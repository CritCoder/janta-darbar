const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateGrievance } = require('../middleware/validation');
const { generateTicketId } = require('../utils/ticket');
const { createEvent } = require('../utils/events');
const { routeGrievance } = require('../services/routing');

// Get all grievances with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      status, 
      department_id, 
      category, 
      severity, 
      page = 1, 
      limit = 20,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    let query = `
      SELECT 
        g.*,
        u.name as citizen_name,
        u.phone as citizen_phone,
        d.name as department_name,
        d.name_marathi as department_name_marathi,
        o.name as officer_name,
        COUNT(e.id) as event_count
      FROM grievances g
      LEFT JOIN users u ON g.citizen_id = u.id
      LEFT JOIN departments d ON g.department_id = d.id
      LEFT JOIN officers o ON g.assigned_officer_id = o.id
      LEFT JOIN events e ON g.id = e.grievance_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (status) {
      query += ` AND g.status = $${++paramCount}`;
      params.push(status);
    }

    if (department_id) {
      query += ` AND g.department_id = $${++paramCount}`;
      params.push(department_id);
    }

    if (category) {
      query += ` AND g.category = $${++paramCount}`;
      params.push(category);
    }

    if (severity) {
      query += ` AND g.severity = $${++paramCount}`;
      params.push(severity);
    }

    if (search) {
      query += ` AND (g.summary ILIKE $${++paramCount} OR g.description ILIKE $${++paramCount} OR u.name ILIKE $${++paramCount})`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` GROUP BY g.id, u.name, u.phone, d.name, d.name_marathi, o.name`;
    query += ` ORDER BY g.${sort_by} ${sort_order.toUpperCase()}`;
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT g.id) as total
      FROM grievances g
      LEFT JOIN users u ON g.citizen_id = u.id
      WHERE 1=1
    `;
    
    const countParams = [];
    let countParamCount = 0;

    if (status) {
      countQuery += ` AND g.status = $${++countParamCount}`;
      countParams.push(status);
    }

    if (department_id) {
      countQuery += ` AND g.department_id = $${++countParamCount}`;
      countParams.push(department_id);
    }

    if (category) {
      countQuery += ` AND g.category = $${++countParamCount}`;
      countParams.push(category);
    }

    if (severity) {
      countQuery += ` AND g.severity = $${++countParamCount}`;
      countParams.push(severity);
    }

    if (search) {
      countQuery += ` AND (g.summary ILIKE $${++countParamCount} OR g.description ILIKE $${++countParamCount} OR u.name ILIKE $${++countParamCount})`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      grievances: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching grievances:', error);
    res.status(500).json({ error: 'Failed to fetch grievances' });
  }
});

// Get single grievance with full details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get grievance details
    const grievanceQuery = `
      SELECT 
        g.*,
        u.name as citizen_name,
        u.phone as citizen_phone,
        u.language as citizen_language,
        d.name as department_name,
        d.name_marathi as department_name_marathi,
        d.contact_whatsapp as department_whatsapp,
        d.contact_email as department_email,
        o.name as officer_name,
        o.whatsapp as officer_whatsapp,
        o.email as officer_email
      FROM grievances g
      LEFT JOIN users u ON g.citizen_id = u.id
      LEFT JOIN departments d ON g.department_id = d.id
      LEFT JOIN officers o ON g.assigned_officer_id = o.id
      WHERE g.id = $1
    `;

    const grievanceResult = await pool.query(grievanceQuery, [id]);
    
    if (grievanceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Grievance not found' });
    }

    const grievance = grievanceResult.rows[0];

    // Get events timeline
    const eventsQuery = `
      SELECT e.*, u.name as actor_name
      FROM events e
      LEFT JOIN users u ON e.actor_id = u.id
      WHERE e.grievance_id = $1
      ORDER BY e.created_at ASC
    `;

    const eventsResult = await pool.query(eventsQuery, [id]);

    // Get media files
    const mediaQuery = `
      SELECT * FROM media
      WHERE grievance_id = $1
      ORDER BY created_at ASC
    `;

    const mediaResult = await pool.query(mediaQuery, [id]);

    // Get tags
    const tagsQuery = `
      SELECT tag FROM tags
      WHERE grievance_id = $1
    `;

    const tagsResult = await pool.query(tagsQuery, [id]);

    // Get letter if exists
    const letterQuery = `
      SELECT * FROM letters
      WHERE grievance_id = $1
    `;

    const letterResult = await pool.query(letterQuery, [id]);

    res.json({
      ...grievance,
      events: eventsResult.rows,
      media: mediaResult.rows,
      tags: tagsResult.rows.map(t => t.tag),
      letter: letterResult.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching grievance:', error);
    res.status(500).json({ error: 'Failed to fetch grievance' });
  }
});

// Create new grievance
router.post('/', validateGrievance, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      citizen_phone,
      citizen_name,
      summary,
      description,
      language = 'mr',
      category,
      severity = 'medium',
      pincode,
      lat,
      lng,
      media_urls = [],
      tags = []
    } = req.body;

    // Create or get user
    let userResult = await client.query(
      'SELECT id FROM users WHERE phone = $1',
      [citizen_phone]
    );

    let userId;
    if (userResult.rows.length === 0) {
      const newUserResult = await client.query(
        'INSERT INTO users (phone, name, language) VALUES ($1, $2, $3) RETURNING id',
        [citizen_phone, citizen_name, language]
      );
      userId = newUserResult.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    // Generate ticket ID
    const ticketId = generateTicketId();

    // Create grievance
    const grievanceResult = await client.query(`
      INSERT INTO grievances (
        ticket_id, citizen_id, summary, description, language, 
        category, severity, pincode, lat, lng, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [ticketId, userId, summary, description, language, category, severity, pincode, lat, lng, 'NEW']);

    const grievance = grievanceResult.rows[0];

    // Create initial event
    await createEvent(client, grievance.id, 'CREATED', {
      message: 'Grievance created',
      citizen_phone,
      category,
      severity
    }, userId, 'citizen');

    // Add media files
    for (const mediaUrl of media_urls) {
      await client.query(
        'INSERT INTO media (grievance_id, url, type, uploaded_by) VALUES ($1, $2, $3, $4)',
        [grievance.id, mediaUrl, 'image', userId]
      );
    }

    // Add tags
    for (const tag of tags) {
      await client.query(
        'INSERT INTO tags (grievance_id, tag) VALUES ($1, $2)',
        [grievance.id, tag]
      );
    }

    // Route grievance to appropriate department
    const routingResult = await routeGrievance(grievance, client);
    
    if (routingResult.department_id) {
      await client.query(
        'UPDATE grievances SET department_id = $1, status = $2 WHERE id = $3',
        [routingResult.department_id, 'INTAKE', grievance.id]
      );

      await createEvent(client, grievance.id, 'ROUTED', {
        department_id: routingResult.department_id,
        department_name: routingResult.department_name,
        routing_reason: routingResult.reason
      }, null, 'system');
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Grievance created successfully',
      grievance: {
        ...grievance,
        ticket_id: ticketId
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating grievance:', error);
    res.status(500).json({ error: 'Failed to create grievance' });
  } finally {
    client.release();
  }
});

// Update grievance status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { status, notes, actor_id, actor_type = 'user' } = req.body;

    // Validate status transition
    const validTransitions = {
      'NEW': ['INTAKE', 'REJECTED'],
      'INTAKE': ['APPROVAL_PENDING', 'REJECTED'],
      'APPROVAL_PENDING': ['APPROVED', 'REJECTED'],
      'APPROVED': ['DISPATCHED'],
      'DISPATCHED': ['ACKNOWLEDGED', 'REJECTED'],
      'ACKNOWLEDGED': ['IN_PROGRESS'],
      'IN_PROGRESS': ['RESOLVED'],
      'RESOLVED': ['CITIZEN_CONFIRMED', 'REOPENED'],
      'CITIZEN_CONFIRMED': ['CLOSED'],
      'REOPENED': ['INTAKE']
    };

    const currentGrievance = await client.query(
      'SELECT status FROM grievances WHERE id = $1',
      [id]
    );

    if (currentGrievance.rows.length === 0) {
      return res.status(404).json({ error: 'Grievance not found' });
    }

    const currentStatus = currentGrievance.rows[0].status;
    
    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status transition from ${currentStatus} to ${status}` 
      });
    }

    // Update status
    await client.query(
      'UPDATE grievances SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, id]
    );

    // Create event
    await createEvent(client, id, 'STATUS_CHANGED', {
      from_status: currentStatus,
      to_status: status,
      notes
    }, actor_id, actor_type);

    await client.query('COMMIT');

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  } finally {
    client.release();
  }
});

// Assign officer to grievance
router.patch('/:id/assign', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { officer_id, actor_id } = req.body;

    // Update assignment
    await client.query(
      'UPDATE grievances SET assigned_officer_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [officer_id, id]
    );

    // Create event
    await createEvent(client, id, 'OFFICER_ASSIGNED', {
      officer_id
    }, actor_id, 'user');

    await client.query('COMMIT');

    res.json({ message: 'Officer assigned successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error assigning officer:', error);
    res.status(500).json({ error: 'Failed to assign officer' });
  } finally {
    client.release();
  }
});

module.exports = router;
