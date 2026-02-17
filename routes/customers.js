const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Get all customers (Admin only)
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const result = await query('SELECT id, first_name, last_name, email, phone FROM customers');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single customer by ID (Admin only)
router.get('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('SELECT id, first_name, last_name, email, phone FROM customers WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching customer:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new customer (Admin only)
router.post('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { first_name, last_name, email, phone } = req.body;
  try {
    const result = await query(
      'INSERT INTO customers (first_name, last_name, email, phone) VALUES ($1, $2, $3, $4) RETURNING id, first_name, last_name, email, phone',
      [first_name, last_name, email, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating customer:', err);
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'Customer with this email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a customer (Admin only)
router.put('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, phone } = req.body;
  try {
    const result = await query(
      'UPDATE customers SET first_name = $1, last_name = $2, email = $3, phone = $4 WHERE id = $5 RETURNING id, first_name, last_name, email, phone',
      [first_name, last_name, email, phone, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating customer:', err);
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'Customer with this email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a customer (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM customers WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully', id: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
