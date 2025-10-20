const pool = require('../config/database');

const createEvent = async (client, grievanceId, type, payload, actorId = null, actorType = 'system') => {
  try {
    const result = await client.query(`
      INSERT INTO events (grievance_id, type, payload_json, actor_id, actor_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [grievanceId, type, JSON.stringify(payload), actorId, actorType]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

const getEventsByGrievance = async (grievanceId) => {
  try {
    const result = await pool.query(`
      SELECT e.*, u.name as actor_name
      FROM events e
      LEFT JOIN users u ON e.actor_id = u.id
      WHERE e.grievance_id = $1
      ORDER BY e.created_at ASC
    `, [grievanceId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

const getEventsByType = async (type, limit = 100) => {
  try {
    const result = await pool.query(`
      SELECT e.*, u.name as actor_name, g.ticket_id
      FROM events e
      LEFT JOIN users u ON e.actor_id = u.id
      LEFT JOIN grievances g ON e.grievance_id = g.id
      WHERE e.type = $1
      ORDER BY e.created_at DESC
      LIMIT $2
    `, [type, limit]);
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching events by type:', error);
    throw error;
  }
};

const getEventStats = async (startDate, endDate) => {
  try {
    const result = await pool.query(`
      SELECT 
        type,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM events
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY type, DATE(created_at)
      ORDER BY date DESC, count DESC
    `, [startDate, endDate]);
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching event stats:', error);
    throw error;
  }
};

module.exports = {
  createEvent,
  getEventsByGrievance,
  getEventsByType,
  getEventStats
};
