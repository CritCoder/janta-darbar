const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user details from database including role
    const userResult = await pool.query(
      'SELECT id, phone, name, language, blocked, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (userResult.rows[0].blocked) {
      return res.status(403).json({ error: 'User account is blocked' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Role-specific middleware helpers
const requireAdmin = requireRole(['admin']);
const requireOfficer = requireRole(['officer', 'admin']);
const requireCitizen = requireRole(['citizen', 'admin', 'officer']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireOfficer,
  requireCitizen
};
