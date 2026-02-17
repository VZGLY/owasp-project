const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Get all services (Admin and User)
router.get('/', authenticateToken, authorizeRoles(['admin', 'user']), async (req, res) => {
  try {
    const result = await query('SELECT id, name, description, price FROM services');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single service by ID (Admin and User)
router.get('/:id', authenticateToken, authorizeRoles(['admin', 'user']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('SELECT id, name, description, price FROM services WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching service:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new service (Admin only)
router.post('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { name, description, price } = req.body;
  try {
    const result = await query(
      'INSERT INTO services (name, description, price) VALUES ($1, $2, $3) RETURNING id, name, description, price',
      [name, description, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating service:', err);
    if (err.code === '23505') { // Unique violation if name is made unique
      return res.status(400).json({ message: 'Service with this name already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a service (Admin only)
router.put('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;
  try {
    const result = await query(
      'UPDATE services SET name = $1, description = $2, price = $3 WHERE id = $4 RETURNING id, name, description, price',
      [name, description, price, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating service:', err);
    if (err.code === '23505') { // Unique violation if name is made unique
      return res.status(400).json({ message: 'Service with this name already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a service (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM services WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json({ message: 'Service deleted successfully', id: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting service:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
