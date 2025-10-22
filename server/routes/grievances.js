const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireAdmin, requireOfficer } = require('../middleware/auth');
const { validateGrievance } = require('../middleware/validation');
const { generateTicketId } = require('../utils/ticket');
const { createEvent } = require('../utils/events');
const { routeGrievance } = require('../services/routing');
const {
  completeAutoProcessing,
  processTextGrievance,
  suggestOfficerAssignment
} = require('../services/ocrService');

// Get all grievances with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      status,
      department_id,
      category,
      severity,
      citizen_id,
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

    // Filter by citizen for citizen users
    if (citizen_id) {
      query += ` AND g.citizen_id = $${++paramCount}`;
      params.push(parseInt(citizen_id));
    }

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

    if (citizen_id) {
      countQuery += ` AND g.citizen_id = $${++countParamCount}`;
      countParams.push(parseInt(citizen_id));
    }

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

// ELON MODE: Public Transparency Dashboard
// NO AUTH REQUIRED - Anyone can see all grievances
// MUST be before /:id route to avoid conflicts
router.get('/public', async (req, res) => {
  try {
    const {
      status,
      department_id,
      category,
      severity,
      pincode,
      page = 1,
      limit = 50
    } = req.query;

    let query = `
      SELECT
        g.id,
        g.ticket_id,
        g.summary,
        g.category,
        g.severity,
        g.status,
        g.location,
        g.pincode,
        g.created_at,
        g.updated_at,
        d.name as department_name,
        d.name_marathi as department_name_marathi,
        EXTRACT(EPOCH FROM (COALESCE(g.updated_at, NOW()) - g.created_at))/86400 as days_pending
      FROM grievances g
      LEFT JOIN departments d ON g.department_id = d.id
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

    if (pincode) {
      query += ` AND g.pincode = $${++paramCount}`;
      params.push(pincode);
    }

    query += ` ORDER BY g.created_at DESC`;
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await pool.query(query, params);

    // Get public statistics
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total_grievances,
        COUNT(CASE WHEN status = 'NEW' THEN 1 END) as new_count,
        COUNT(CASE WHEN status = 'ASSIGNED' THEN 1 END) as assigned_count,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved_count,
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed_count,
        COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_count,
        AVG(CASE WHEN status = 'CLOSED' THEN
          EXTRACT(EPOCH FROM (updated_at - created_at))/86400
        END) as avg_resolution_days,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_count
      FROM grievances
    `);

    // Category breakdown
    const categoryStats = await pool.query(`
      SELECT
        category,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as resolved
      FROM grievances
      GROUP BY category
      ORDER BY count DESC
    `);

    res.json({
      message: '🌐 Public Transparency Dashboard - All Grievances Visible',
      grievances: result.rows,
      statistics: statsResult.rows[0],
      category_breakdown: categoryStats.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Public dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch public data' });
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

// ========================================
// 🚀 ELON MODE: MAX AUTOMATION ENDPOINTS
// ========================================

// ELON MODE: Quick Create with AI Processing
// Admin uploads OR enters text, AI does everything else
router.post('/quick-create', authenticateToken, requireAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      file_url,           // If uploaded via /api/upload/ocr-grievance
      citizen_name,
      citizen_phone,
      summary,
      description,
      category,
      severity,
      location,
      pincode,
      language = 'mr'
    } = req.body;

    // If text input, use AI to analyze and suggest categorization
    let aiSuggestions = {};
    if (!file_url && (summary || description)) {
      const textAnalysis = await processTextGrievance(summary, description);
      if (textAnalysis.success) {
        aiSuggestions = textAnalysis.suggestions;
      }
    }

    // Create or get citizen user
    let userResult = await client.query(
      'SELECT id FROM users WHERE phone = $1',
      [citizen_phone]
    );

    let userId;
    if (userResult.rows.length === 0) {
      const newUserResult = await client.query(
        'INSERT INTO users (phone, name, language, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [citizen_phone, citizen_name || 'Citizen', language, 'citizen']
      );
      userId = newUserResult.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    // Generate ticket ID
    const ticketId = generateTicketId();

    // Create grievance with AI suggestions
    const finalCategory = category || aiSuggestions.category || 'other';
    const finalSeverity = severity || aiSuggestions.severity || 'medium';

    const grievanceResult = await client.query(`
      INSERT INTO grievances (
        ticket_id, citizen_id, summary, description, language,
        category, severity, pincode, location, status, raw_file_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      ticketId, userId, summary, description, language,
      finalCategory, finalSeverity, pincode, location, 'NEW', file_url
    ]);

    const grievance = grievanceResult.rows[0];

    // AI Auto-Suggest Officer Assignment
    const complaintData = {
      category: finalCategory,
      severity: finalSeverity,
      location: location,
      description: description
    };

    const assignmentSuggestion = await suggestOfficerAssignment(complaintData);

    // Create initial event
    await createEvent(client, grievance.id, 'CREATED', {
      message: 'Grievance created by admin',
      ai_suggestions: aiSuggestions,
      auto_assignment_suggested: assignmentSuggestion.success
    }, req.user.id, 'admin');

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Grievance created successfully with AI analysis',
      grievance: {
        ...grievance,
        ticket_id: ticketId
      },
      ai_suggestions: aiSuggestions,
      suggested_officer: assignmentSuggestion.officer || null,
      assignment_reason: assignmentSuggestion.reason || null,
      ready_to_assign: assignmentSuggestion.success
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Quick create error:', error);
    res.status(500).json({ error: 'Failed to create grievance' });
  } finally {
    client.release();
  }
});

// ELON MODE: One-Click Create and Assign
// Bypass NEW status, go straight to ASSIGNED
router.post('/create-and-assign', authenticateToken, requireAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      citizen_name,
      citizen_phone,
      summary,
      description,
      category,
      severity,
      location,
      pincode,
      officer_id,        // Pre-selected or AI-suggested
      department_id,
      language = 'mr'
    } = req.body;

    // Create or get citizen
    let userResult = await client.query(
      'SELECT id FROM users WHERE phone = $1',
      [citizen_phone]
    );

    let userId;
    if (userResult.rows.length === 0) {
      const newUserResult = await client.query(
        'INSERT INTO users (phone, name, language, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [citizen_phone, citizen_name, language, 'citizen']
      );
      userId = newUserResult.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    const ticketId = generateTicketId();

    // Create and IMMEDIATELY assign (skip NEW, go to ASSIGNED)
    const grievanceResult = await client.query(`
      INSERT INTO grievances (
        ticket_id, citizen_id, summary, description, language,
        category, severity, pincode, location, status,
        assigned_officer_id, department_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      ticketId, userId, summary, description, language,
      category, severity, pincode, location, 'ASSIGNED',
      officer_id, department_id
    ]);

    const grievance = grievanceResult.rows[0];

    // Create events
    await createEvent(client, grievance.id, 'CREATED', {
      message: 'One-click create and assign by admin'
    }, req.user.id, 'admin');

    await createEvent(client, grievance.id, 'OFFICER_ASSIGNED', {
      officer_id,
      auto_assigned: true
    }, req.user.id, 'admin');

    await client.query('COMMIT');

    // TODO: Send WhatsApp/Email notification to officer

    res.status(201).json({
      message: '⚡ Grievance created and assigned instantly',
      grievance: {
        ...grievance,
        ticket_id: ticketId
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create and assign error:', error);
    res.status(500).json({ error: 'Failed to create and assign grievance' });
  } finally {
    client.release();
  }
});

// ELON MODE: Officer's Dashboard - Only My Assignments
// Officers see ONLY what's assigned to them, sorted by urgency
router.get('/my-assignments', authenticateToken, requireOfficer, async (req, res) => {
  try {
    const {
      status,
      severity,
      category,
      page = 1,
      limit = 20
    } = req.query;

    let query = `
      SELECT
        g.*,
        u.name as citizen_name,
        u.phone as citizen_phone,
        d.name as department_name,
        EXTRACT(EPOCH FROM (NOW() - g.created_at))/3600 as hours_pending,
        COUNT(e.id) as event_count
      FROM grievances g
      LEFT JOIN users u ON g.citizen_id = u.id
      LEFT JOIN departments d ON g.department_id = d.id
      LEFT JOIN events e ON g.id = e.grievance_id
      WHERE g.assigned_officer_id = $1
    `;

    const params = [req.user.id];
    let paramCount = 1;

    if (status) {
      query += ` AND g.status = $${++paramCount}`;
      params.push(status);
    }

    if (severity) {
      query += ` AND g.severity = $${++paramCount}`;
      params.push(severity);
    }

    if (category) {
      query += ` AND g.category = $${++paramCount}`;
      params.push(category);
    }

    query += ` GROUP BY g.id, u.name, u.phone, d.name`;

    // Sort by severity (critical first) then by age
    query += ` ORDER BY
      CASE g.severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
      END,
      g.created_at ASC
    `;

    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await pool.query(query, params);

    // Get stats for officer
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total_assigned,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved,
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed,
        AVG(CASE WHEN status = 'CLOSED' THEN
          EXTRACT(EPOCH FROM (updated_at - created_at))/3600
        END) as avg_resolution_hours
      FROM grievances
      WHERE assigned_officer_id = $1
    `, [req.user.id]);

    res.json({
      grievances: result.rows,
      stats: statsResult.rows[0],
      officer: {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Error fetching officer assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// ELON MODE: Quick Status Update - One Click Only
// Officer clicks: "Start Work", "Resolve", "Reject", "Close"
router.patch('/:id/quick-update', authenticateToken, requireOfficer, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { action, notes } = req.body; // action: 'start', 'resolve', 'reject', 'close'

    // Verify officer owns this grievance
    const grievanceResult = await client.query(
      'SELECT status, assigned_officer_id FROM grievances WHERE id = $1',
      [id]
    );

    if (grievanceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Grievance not found' });
    }

    const grievance = grievanceResult.rows[0];

    // Only assigned officer (or admin) can update
    if (grievance.assigned_officer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this grievance' });
    }

    // Map actions to status
    const actionMap = {
      'start': 'IN_PROGRESS',
      'resolve': 'RESOLVED',
      'reject': 'REJECTED',
      'close': 'CLOSED',
      'reopen': 'ASSIGNED'
    };

    const newStatus = actionMap[action];
    if (!newStatus) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Update status
    await client.query(
      'UPDATE grievances SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newStatus, id]
    );

    // Create event
    await createEvent(client, id, 'STATUS_CHANGED', {
      from_status: grievance.status,
      to_status: newStatus,
      action,
      notes
    }, req.user.id, 'officer');

    await client.query('COMMIT');

    // TODO: Send notification to citizen and admin

    res.json({
      message: `✅ Grievance ${action}ed successfully`,
      new_status: newStatus
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Quick update error:', error);
    res.status(500).json({ error: 'Failed to update grievance' });
  } finally {
    client.release();
  }
});

module.exports = router;
