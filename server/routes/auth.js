const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { validateUser } = require('../middleware/validation');

// Register new user
router.post('/register', validateUser, async (req, res) => {
  try {
    const { phone, name, language, consent_flags } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      [phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const result = await pool.query(
      'INSERT INTO users (phone, name, language, consent_flags) VALUES ($1, $2, $3, $4) RETURNING id, phone, name, language',
      [phone, name, language, consent_flags]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Send OTP for login
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database with expiration (5 minutes)
    await pool.query(
      'INSERT INTO otp_verifications (phone, otp, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'5 minutes\') ON CONFLICT (phone) DO UPDATE SET otp = $2, expires_at = NOW() + INTERVAL \'5 minutes\'',
      [phone, otp]
    );

    // TODO: Send OTP via SMS/WhatsApp
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({
      message: 'OTP sent successfully',
      phone: phone
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP and login
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    // Development mode: accept any OTP
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔓 Development mode: Accepting any OTP for ${phone}`);
    } else {
      // Production mode: verify OTP
      const result = await pool.query(
        'SELECT * FROM otp_verifications WHERE phone = $1 AND otp = $2 AND expires_at > NOW()',
        [phone, otp]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid or expired OTP' });
      }
    }

    // Find or create user
    let userResult = await pool.query(
      'SELECT id, phone, name, language, blocked, role FROM users WHERE phone = $1',
      [phone]
    );

    let user;
    if (userResult.rows.length === 0) {
      // Create new user if doesn't exist (default role: citizen)
      const newUser = await pool.query(
        'INSERT INTO users (phone, name, language, role) VALUES ($1, $2, $3, $4) RETURNING id, phone, name, language, blocked, role',
        [phone, 'User', 'mr', 'citizen']
      );
      user = newUser.rows[0];
    } else {
      user = userResult.rows[0];
    }

    if (user.blocked) {
      return res.status(403).json({ error: 'User account is blocked' });
    }

    // Delete used OTP
    await pool.query('DELETE FROM otp_verifications WHERE phone = $1', [phone]);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// Login user (legacy endpoint for backward compatibility)
router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, phone, name, language, blocked, role FROM users WHERE phone = $1',
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (user.blocked) {
      return res.status(403).json({ error: 'User account is blocked' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await pool.query(
      'SELECT id, phone, name, language, consent_flags, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { name, language, consent_flags } = req.body;

    const result = await pool.query(
      'UPDATE users SET name = $1, language = $2, consent_flags = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, phone, name, language, consent_flags',
      [name, language, consent_flags, decoded.userId]
    );

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await pool.query(
      'SELECT id, phone, name, language, blocked FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ valid: true, user: result.rows[0] });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
