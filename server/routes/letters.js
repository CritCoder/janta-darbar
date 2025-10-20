const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { generateOutwardNumber, getDepartmentCode } = require('../utils/ticket');
const { createEvent } = require('../utils/events');
const { generatePDF } = require('../services/pdf');

// Get all letters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { grievance_id, page = 1, limit = 20 } = req.query;
    
    let query = `
      SELECT l.*, g.ticket_id, g.summary, d.name as department_name
      FROM letters l
      LEFT JOIN grievances g ON l.grievance_id = g.id
      LEFT JOIN departments d ON g.department_id = d.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (grievance_id) {
      query += ` AND l.grievance_id = $${++paramCount}`;
      params.push(grievance_id);
    }

    query += ` ORDER BY l.created_at DESC`;
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await pool.query(query, params);
    res.json({ letters: result.rows });
  } catch (error) {
    console.error('Error fetching letters:', error);
    res.status(500).json({ error: 'Failed to fetch letters' });
  }
});

// Get single letter
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT l.*, g.ticket_id, g.summary, g.description, g.category, g.severity,
             g.pincode, g.lat, g.lng, u.name as citizen_name, u.phone as citizen_phone,
             d.name as department_name, d.name_marathi as department_name_marathi,
             d.contact_whatsapp, d.contact_email
      FROM letters l
      LEFT JOIN grievances g ON l.grievance_id = g.id
      LEFT JOIN users u ON g.citizen_id = u.id
      LEFT JOIN departments d ON g.department_id = d.id
      WHERE l.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Letter not found' });
    }
    
    res.json({ letter: result.rows[0] });
  } catch (error) {
    console.error('Error fetching letter:', error);
    res.status(500).json({ error: 'Failed to fetch letter' });
  }
});

// Create new letter
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { grievance_id, approver_id } = req.body;

    if (!grievance_id) {
      return res.status(400).json({ error: 'Grievance ID is required' });
    }

    // Get grievance details
    const grievanceResult = await client.query(`
      SELECT g.*, u.name as citizen_name, u.phone as citizen_phone,
             d.name as department_name, d.name_marathi as department_name_marathi
      FROM grievances g
      LEFT JOIN users u ON g.citizen_id = u.id
      LEFT JOIN departments d ON g.department_id = d.id
      WHERE g.id = $1
    `, [grievance_id]);

    if (grievanceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Grievance not found' });
    }

    const grievance = grievanceResult.rows[0];

    // Check if letter already exists
    const existingLetter = await client.query(
      'SELECT id FROM letters WHERE grievance_id = $1',
      [grievance_id]
    );

    if (existingLetter.rows.length > 0) {
      return res.status(400).json({ error: 'Letter already exists for this grievance' });
    }

    // Generate outward number
    const departmentCode = getDepartmentCode(grievance.department_name);
    const outwardNo = generateOutwardNumber(departmentCode);

    // Generate PDF
    const pdfBuffer = await generatePDF(grievance, outwardNo);
    
    // Upload PDF to storage (implement your storage service)
    const pdfUrl = await uploadToStorage(pdfBuffer, `letters/${outwardNo}.pdf`);
    
    // Generate QR code URL
    const qrCodeUrl = `${process.env.FRONTEND_URL}/grievance/${grievance.ticket_id}`;

    // Create letter record
    const letterResult = await client.query(`
      INSERT INTO letters (grievance_id, outward_no, pdf_url, qr_code_url, signed_by, signed_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *
    `, [grievance_id, outwardNo, pdfUrl, qrCodeUrl, approver_id]);

    const letter = letterResult.rows[0];

    // Update grievance status
    await client.query(
      'UPDATE grievances SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['APPROVED', grievance_id]
    );

    // Create event
    await createEvent(client, grievance_id, 'LETTER_GENERATED', {
      outward_no: outwardNo,
      pdf_url: pdfUrl,
      qr_code_url: qrCodeUrl
    }, approver_id, 'user');

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Letter generated successfully',
      letter
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating letter:', error);
    res.status(500).json({ error: 'Failed to create letter' });
  } finally {
    client.release();
  }
});

// Download letter PDF
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT pdf_url, outward_no FROM letters WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Letter not found' });
    }
    
    const { pdf_url, outward_no } = result.rows[0];
    
    // Download PDF from storage and serve
    const pdfBuffer = await downloadFromStorage(pdf_url);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${outward_no}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error downloading letter:', error);
    res.status(500).json({ error: 'Failed to download letter' });
  }
});

// Sign letter
router.patch('/:id/sign', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { approver_id, signature_data } = req.body;

    if (!approver_id) {
      return res.status(400).json({ error: 'Approver ID is required' });
    }

    const result = await pool.query(
      'UPDATE letters SET signed_by = $1, signed_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [approver_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Letter not found' });
    }

    // Create event
    await createEvent(null, result.rows[0].grievance_id, 'LETTER_SIGNED', {
      letter_id: id,
      approver_id
    }, approver_id, 'user');

    res.json({
      message: 'Letter signed successfully',
      letter: result.rows[0]
    });
  } catch (error) {
    console.error('Error signing letter:', error);
    res.status(500).json({ error: 'Failed to sign letter' });
  }
});

// Helper functions (implement based on your storage solution)
async function uploadToStorage(buffer, key) {
  // Implement your storage upload logic (AWS S3, etc.)
  return `https://your-storage-url/${key}`;
}

async function downloadFromStorage(url) {
  // Implement your storage download logic
  return Buffer.from('PDF content'); // Placeholder
}

module.exports = router;
