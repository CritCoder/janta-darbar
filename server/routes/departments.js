const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateDepartment } = require('../middleware/validation');

// Get all departments
router.get('/', async (req, res) => {
  try {
    const { active_only = true } = req.query;
    
    let query = 'SELECT * FROM departments';
    const params = [];
    
    if (active_only === 'true') {
      query += ' WHERE active = true';
    }
    
    query += ' ORDER BY name ASC';
    
    const result = await pool.query(query, params);
    res.json({ departments: result.rows });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get single department
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM departments WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json({ department: result.rows[0] });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// Create new department
router.post('/', authenticateToken, requireRole(['admin']), validateDepartment, async (req, res) => {
  try {
    const {
      name,
      name_marathi,
      name_hindi,
      district,
      contact_whatsapp,
      contact_email,
      escalation_contact
    } = req.body;

    const result = await pool.query(
      `INSERT INTO departments (
        name, name_marathi, name_hindi, district, 
        contact_whatsapp, contact_email, escalation_contact
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [name, name_marathi, name_hindi, district, contact_whatsapp, contact_email, escalation_contact]
    );

    res.status(201).json({
      message: 'Department created successfully',
      department: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// Update department
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      name_marathi,
      name_hindi,
      district,
      contact_whatsapp,
      contact_email,
      escalation_contact,
      active
    } = req.body;

    const result = await pool.query(
      `UPDATE departments SET 
        name = $1, name_marathi = $2, name_hindi = $3, district = $4,
        contact_whatsapp = $5, contact_email = $6, escalation_contact = $7,
        active = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 
      RETURNING *`,
      [name, name_marathi, name_hindi, district, contact_whatsapp, contact_email, escalation_contact, active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({
      message: 'Department updated successfully',
      department: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// Delete department
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if department has active grievances
    const grievancesResult = await pool.query(
      'SELECT COUNT(*) as count FROM grievances WHERE department_id = $1 AND status NOT IN ($2, $3)',
      [id, 'CLOSED', 'REJECTED']
    );

    if (parseInt(grievancesResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete department with active grievances' 
      });
    }

    const result = await pool.query(
      'UPDATE departments SET active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({
      message: 'Department deactivated successfully',
      department: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

// Get department statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const statsQuery = `
      SELECT 
        COUNT(*) as total_grievances,
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as resolved_grievances,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_grievances,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_grievances,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_grievances,
        AVG(CASE WHEN status = 'CLOSED' THEN 
          EXTRACT(EPOCH FROM (updated_at - created_at))/3600 
        END) as avg_resolution_hours,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '${days} days' THEN 1 END) as recent_grievances
      FROM grievances 
      WHERE department_id = $1
    `;

    const result = await pool.query(statsQuery, [id]);
    
    res.json({ 
      department_id: id,
      stats: result.rows[0],
      period_days: parseInt(days)
    });
  } catch (error) {
    console.error('Error fetching department stats:', error);
    res.status(500).json({ error: 'Failed to fetch department statistics' });
  }
});

// Get department officers
router.get('/:id/officers', async (req, res) => {
  try {
    const { id } = req.params;
    const { active_only = true } = req.query;

    let query = 'SELECT * FROM officers WHERE department_id = $1';
    const params = [id];

    if (active_only === 'true') {
      query += ' AND active = true';
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);
    res.json({ officers: result.rows });
  } catch (error) {
    console.error('Error fetching department officers:', error);
    res.status(500).json({ error: 'Failed to fetch officers' });
  }
});

module.exports = router;
