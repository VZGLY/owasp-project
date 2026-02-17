const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Fallback for local testing

// Register a new user
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hashedPassword, role || 'user'] // Default role to 'user'
    );
    const user = result.rows[0];
    res.status(201).json({ message: 'User registered successfully', user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Error registering user:', err);
    if (err.code === '23505') { // Unique violation error code for PostgreSQL
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Logged in successfully', token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Error logging in user:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;
