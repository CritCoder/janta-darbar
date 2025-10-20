const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get all officers
router.get('/', async (req, res) => {
  try {
    const { department_id, active_only = true } = req.query;
    
    let query = `
      SELECT o.*, d.name as department_name, d.name_marathi as department_name_marathi
      FROM officers o
      LEFT JOIN departments d ON o.department_id = d.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (department_id) {
      query += ` AND o.department_id = $${++paramCount}`;
      params.push(department_id);
    }

    if (active_only === 'true') {
      query += ` AND o.active = true`;
    }

    query += ' ORDER BY o.name ASC';

    const result = await pool.query(query, params);
    res.json({ officers: result.rows });
  } catch (error) {
    console.error('Error fetching officers:', error);
    res.status(500).json({ error: 'Failed to fetch officers' });
  }
});

// Get single officer
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT o.*, d.name as department_name, d.name_marathi as department_name_marathi
      FROM officers o
      LEFT JOIN departments d ON o.department_id = d.id
      WHERE o.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Officer not found' });
    }
    
    res.json({ officer: result.rows[0] });
  } catch (error) {
    console.error('Error fetching officer:', error);
    res.status(500).json({ error: 'Failed to fetch officer' });
  }
});

// Create new officer
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      name,
      role,
      department_id,
      whatsapp,
      email
    } = req.body;

    if (!name || !department_id) {
      return res.status(400).json({ error: 'Name and department_id are required' });
    }

    const result = await pool.query(
      `INSERT INTO officers (name, role, department_id, whatsapp, email)
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`,
      [name, role, department_id, whatsapp, email]
    );

    res.status(201).json({
      message: 'Officer created successfully',
      officer: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating officer:', error);
    res.status(500).json({ error: 'Failed to create officer' });
  }
});

// Update officer
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      role,
      department_id,
      whatsapp,
      email,
      active
    } = req.body;

    const result = await pool.query(
      `UPDATE officers SET 
        name = $1, role = $2, department_id = $3, whatsapp = $4, 
        email = $5, active = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 
      RETURNING *`,
      [name, role, department_id, whatsapp, email, active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Officer not found' });
    }

    res.json({
      message: 'Officer updated successfully',
      officer: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating officer:', error);
    res.status(500).json({ error: 'Failed to update officer' });
  }
});

// Delete officer
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if officer has active grievances
    const grievancesResult = await pool.query(
      'SELECT COUNT(*) as count FROM grievances WHERE assigned_officer_id = $1 AND status NOT IN ($2, $3)',
      [id, 'CLOSED', 'REJECTED']
    );

    if (parseInt(grievancesResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete officer with active grievances' 
      });
    }

    const result = await pool.query(
      'UPDATE officers SET active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Officer not found' });
    }

    res.json({
      message: 'Officer deactivated successfully',
      officer: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting officer:', error);
    res.status(500).json({ error: 'Failed to delete officer' });
  }
});

// Get officer performance stats
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const statsQuery = `
      SELECT 
        COUNT(*) as total_assigned,
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as resolved,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress,
        AVG(CASE WHEN status = 'CLOSED' THEN 
          EXTRACT(EPOCH FROM (updated_at - created_at))/3600 
        END) as avg_resolution_hours,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '${days} days' THEN 1 END) as recent_assignments
      FROM grievances 
      WHERE assigned_officer_id = $1
    `;

    const result = await pool.query(statsQuery, [id]);
    
    res.json({ 
      officer_id: id,
      stats: result.rows[0],
      period_days: parseInt(days)
    });
  } catch (error) {
    console.error('Error fetching officer stats:', error);
    res.status(500).json({ error: 'Failed to fetch officer statistics' });
  }
});

module.exports = router;
