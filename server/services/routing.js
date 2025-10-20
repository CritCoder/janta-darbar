const pool = require('../config/database');

// Category to department mapping
const categoryMapping = {
  'water': 'Water Resources',
  'road': 'Public Works',
  'electricity': 'Electricity',
  'health': 'Health',
  'sanitation': 'Sanitation',
  'women_child': 'Women & Child Development',
  'police': 'Police',
  'revenue': 'Revenue',
  'education': 'Education',
  'other': 'Public Works' // Default fallback
};

// Severity-based routing rules
const severityRules = {
  'critical': {
    priority: 1,
    sla_hours: 2,
    escalation_hours: 4
  },
  'high': {
    priority: 2,
    sla_hours: 24,
    escalation_hours: 48
  },
  'medium': {
    priority: 3,
    sla_hours: 72,
    escalation_hours: 96
  },
  'low': {
    priority: 4,
    sla_hours: 168, // 7 days
    escalation_hours: 192
  }
};

const routeGrievance = async (grievance, client) => {
  try {
    const { category, severity, pincode, lat, lng } = grievance;
    
    // Get department based on category
    const departmentName = categoryMapping[category] || categoryMapping['other'];
    
    // Find department by name and location
    let departmentQuery = `
      SELECT * FROM departments 
      WHERE name = $1 AND active = true
    `;
    
    const params = [departmentName];
    
    // If we have location data, try to match by district/pincode
    if (pincode) {
      // For now, we'll use a simple approach
      // In production, you'd want to implement proper geo-routing
      departmentQuery += ` AND district = 'Pune'`; // Default district
    }
    
    const departmentResult = await client.query(departmentQuery, params);
    
    if (departmentResult.rows.length === 0) {
      // Fallback to any active department of this type
      const fallbackResult = await client.query(
        'SELECT * FROM departments WHERE name = $1 AND active = true LIMIT 1',
        [departmentName]
      );
      
      if (fallbackResult.rows.length === 0) {
        throw new Error(`No active department found for category: ${category}`);
      }
      
      return {
        department_id: fallbackResult.rows[0].id,
        department_name: fallbackResult.rows[0].name,
        reason: 'Fallback routing - no location-specific department found'
      };
    }
    
    const department = departmentResult.rows[0];
    
    // Check for duplicate grievances
    const duplicateCheck = await checkForDuplicates(grievance, client);
    if (duplicateCheck.isDuplicate) {
      return {
        department_id: department.id,
        department_name: department.name,
        reason: `Potential duplicate of ${duplicateCheck.duplicateTicketId}`,
        isDuplicate: true,
        duplicateId: duplicateCheck.duplicateId
      };
    }
    
    return {
      department_id: department.id,
      department_name: department.name,
      reason: `Routed based on category: ${category}`,
      severity_rules: severityRules[severity]
    };
    
  } catch (error) {
    console.error('Error routing grievance:', error);
    throw error;
  }
};

const checkForDuplicates = async (grievance, client) => {
  try {
    const { summary, description, pincode, lat, lng, citizen_id } = grievance;
    
    // Check for similar grievances in the last 30 days
    const duplicateQuery = `
      SELECT id, ticket_id, summary, description, created_at
      FROM grievances
      WHERE citizen_id = $1 
        AND created_at > NOW() - INTERVAL '30 days'
        AND status NOT IN ('REJECTED', 'CLOSED')
    `;
    
    const result = await client.query(duplicateQuery, [citizen_id]);
    
    // Simple similarity check (in production, use more sophisticated NLP)
    for (const existingGrievance of result.rows) {
      const similarity = calculateSimilarity(
        summary + ' ' + description,
        existingGrievance.summary + ' ' + existingGrievance.description
      );
      
      if (similarity > 0.8) { // 80% similarity threshold
        return {
          isDuplicate: true,
          duplicateId: existingGrievance.id,
          duplicateTicketId: existingGrievance.ticket_id,
          similarity: similarity
        };
      }
    }
    
    return { isDuplicate: false };
    
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return { isDuplicate: false };
  }
};

const calculateSimilarity = (text1, text2) => {
  // Simple Jaccard similarity
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

const getRoutingStats = async () => {
  try {
    const result = await pool.query(`
      SELECT 
        d.name as department_name,
        COUNT(g.id) as total_grievances,
        AVG(CASE WHEN g.status = 'CLOSED' THEN 
          EXTRACT(EPOCH FROM (g.updated_at - g.created_at))/3600 
        END) as avg_resolution_hours,
        COUNT(CASE WHEN g.severity = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN g.severity = 'high' THEN 1 END) as high_count
      FROM departments d
      LEFT JOIN grievances g ON d.id = g.department_id
      WHERE d.active = true
      GROUP BY d.id, d.name
      ORDER BY total_grievances DESC
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching routing stats:', error);
    throw error;
  }
};

module.exports = {
  routeGrievance,
  checkForDuplicates,
  getRoutingStats,
  categoryMapping,
  severityRules
};
