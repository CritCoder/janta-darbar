const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get dashboard analytics
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // Overall statistics
    const overallStats = await pool.query(`
      SELECT 
        COUNT(*) as total_grievances,
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as resolved_grievances,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_grievances,
        COUNT(CASE WHEN status = 'NEW' THEN 1 END) as new_grievances,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '${days} days' THEN 1 END) as recent_grievances,
        AVG(CASE WHEN status = 'CLOSED' THEN 
          EXTRACT(EPOCH FROM (updated_at - created_at))/3600 
        END) as avg_resolution_hours
      FROM grievances
    `);

    // Status distribution
    const statusStats = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM grievances
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY status
      ORDER BY count DESC
    `);

    // Category distribution
    const categoryStats = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM grievances
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY category
      ORDER BY count DESC
    `);

    // Department performance
    const departmentStats = await pool.query(`
      SELECT 
        d.name as department_name,
        d.name_marathi as department_name_marathi,
        COUNT(g.id) as total_grievances,
        COUNT(CASE WHEN g.status = 'CLOSED' THEN 1 END) as resolved,
        ROUND(
          COUNT(CASE WHEN g.status = 'CLOSED' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(g.id), 0), 2
        ) as resolution_rate,
        AVG(CASE WHEN g.status = 'CLOSED' THEN 
          EXTRACT(EPOCH FROM (g.updated_at - g.created_at))/3600 
        END) as avg_resolution_hours
      FROM departments d
      LEFT JOIN grievances g ON d.id = g.department_id 
        AND g.created_at > NOW() - INTERVAL '${days} days'
      WHERE d.active = true
      GROUP BY d.id, d.name, d.name_marathi
      ORDER BY total_grievances DESC
    `);

    // Daily trends
    const dailyTrends = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as grievances_created,
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as grievances_resolved
      FROM grievances
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // SLA breaches
    const slaBreaches = await pool.query(`
      SELECT 
        g.ticket_id,
        g.status,
        g.severity,
        g.created_at,
        d.name as department_name,
        EXTRACT(EPOCH FROM (NOW() - g.created_at))/3600 as hours_pending
      FROM grievances g
      LEFT JOIN departments d ON g.department_id = d.id
      WHERE g.status NOT IN ('CLOSED', 'REJECTED')
        AND (
          (g.severity = 'critical' AND g.created_at < NOW() - INTERVAL '2 hours') OR
          (g.severity = 'high' AND g.created_at < NOW() - INTERVAL '24 hours') OR
          (g.severity = 'medium' AND g.created_at < NOW() - INTERVAL '72 hours') OR
          (g.severity = 'low' AND g.created_at < NOW() - INTERVAL '168 hours')
        )
      ORDER BY hours_pending DESC
    `);

    res.json({
      period_days: parseInt(days),
      overall_stats: overallStats.rows[0],
      status_distribution: statusStats.rows,
      category_distribution: categoryStats.rows,
      department_performance: departmentStats.rows,
      daily_trends: dailyTrends.rows,
      sla_breaches: slaBreaches.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// Get heatmap data
router.get('/heatmap', authenticateToken, async (req, res) => {
  try {
    const { days = 30, category } = req.query;
    
    let query = `
      SELECT 
        pincode,
        lat,
        lng,
        COUNT(*) as grievance_count,
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as resolved_count,
        AVG(CASE WHEN severity = 'critical' THEN 4
                 WHEN severity = 'high' THEN 3
                 WHEN severity = 'medium' THEN 2
                 ELSE 1 END) as avg_severity_score
      FROM grievances
      WHERE created_at > NOW() - INTERVAL '${days} days'
        AND lat IS NOT NULL 
        AND lng IS NOT NULL
    `;
    
    const params = [];
    if (category) {
      query += ` AND category = $1`;
      params.push(category);
    }
    
    query += `
      GROUP BY pincode, lat, lng
      ORDER BY grievance_count DESC
    `;

    const result = await pool.query(query, params);
    
    res.json({
      period_days: parseInt(days),
      category: category || 'all',
      heatmap_data: result.rows
    });
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

// Get impact stories
router.get('/impact-stories', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        g.ticket_id,
        g.summary,
        g.category,
        g.created_at,
        g.updated_at,
        d.name as department_name,
        d.name_marathi as department_name_marathi,
        EXTRACT(EPOCH FROM (g.updated_at - g.created_at))/3600 as resolution_hours,
        m.url as proof_image
      FROM grievances g
      LEFT JOIN departments d ON g.department_id = d.id
      LEFT JOIN media m ON g.id = m.grievance_id AND m.type = 'image'
      WHERE g.status = 'CLOSED'
        AND g.updated_at > NOW() - INTERVAL '90 days'
      ORDER BY g.updated_at DESC
      LIMIT $1
    `, [parseInt(limit)]);
    
    res.json({
      impact_stories: result.rows
    });
  } catch (error) {
    console.error('Error fetching impact stories:', error);
    res.status(500).json({ error: 'Failed to fetch impact stories' });
  }
});

// Get performance metrics
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const { days = 30, department_id } = req.query;
    
    let query = `
      SELECT 
        COUNT(*) as total_grievances,
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as resolved_grievances,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_grievances,
        COUNT(CASE WHEN status = 'NEW' THEN 1 END) as new_grievances,
        AVG(CASE WHEN status = 'CLOSED' THEN 
          EXTRACT(EPOCH FROM (updated_at - created_at))/3600 
        END) as avg_resolution_hours,
        COUNT(CASE WHEN 
          (severity = 'critical' AND created_at < NOW() - INTERVAL '2 hours') OR
          (severity = 'high' AND created_at < NOW() - INTERVAL '24 hours') OR
          (severity = 'medium' AND created_at < NOW() - INTERVAL '72 hours') OR
          (severity = 'low' AND created_at < NOW() - INTERVAL '168 hours')
        THEN 1 END) as sla_breaches
      FROM grievances
      WHERE created_at > NOW() - INTERVAL '${days} days'
    `;
    
    const params = [];
    if (department_id) {
      query += ` AND department_id = $1`;
      params.push(department_id);
    }

    const result = await pool.query(query, params);
    
    const metrics = result.rows[0];
    const resolutionRate = metrics.total_grievances > 0 
      ? (metrics.resolved_grievances / metrics.total_grievances) * 100 
      : 0;
    
    const slaCompliance = metrics.total_grievances > 0 
      ? ((metrics.total_grievances - metrics.sla_breaches) / metrics.total_grievances) * 100 
      : 100;

    res.json({
      period_days: parseInt(days),
      department_id: department_id || 'all',
      metrics: {
        ...metrics,
        resolution_rate: Math.round(resolutionRate * 100) / 100,
        sla_compliance: Math.round(slaCompliance * 100) / 100
      }
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

// Get export data
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      department_id, 
      category, 
      status,
      format = 'json'
    } = req.query;

    let query = `
      SELECT 
        g.ticket_id,
        g.summary,
        g.description,
        g.category,
        g.severity,
        g.status,
        g.pincode,
        g.created_at,
        g.updated_at,
        u.name as citizen_name,
        u.phone as citizen_phone,
        d.name as department_name,
        o.name as officer_name
      FROM grievances g
      LEFT JOIN users u ON g.citizen_id = u.id
      LEFT JOIN departments d ON g.department_id = d.id
      LEFT JOIN officers o ON g.assigned_officer_id = o.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (start_date) {
      query += ` AND g.created_at >= $${++paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND g.created_at <= $${++paramCount}`;
      params.push(end_date);
    }

    if (department_id) {
      query += ` AND g.department_id = $${++paramCount}`;
      params.push(department_id);
    }

    if (category) {
      query += ` AND g.category = $${++paramCount}`;
      params.push(category);
    }

    if (status) {
      query += ` AND g.status = $${++paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY g.created_at DESC`;

    const result = await pool.query(query, params);
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(result.rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=grievances.csv');
      res.send(csv);
    } else {
      res.json({
        total_records: result.rows.length,
        data: result.rows
      });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Helper function to convert to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

module.exports = router;
