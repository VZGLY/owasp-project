const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Get all feedback (Admin only)
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const result = await query(
      `SELECT
        f.id,
        f.rating,
        f.comments,
        f.feedback_date,
        c.first_name AS customer_first_name,
        c.last_name AS customer_last_name,
        v.license_plate AS vehicle_license_plate
      FROM feedback f
      JOIN customers c ON f.customer_id = c.id
      JOIN vehicles v ON f.vehicle_id = v.id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single feedback by ID (Admin only)
router.get('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT
        f.id,
        f.rating,
        f.comments,
        f.feedback_date,
        c.first_name AS customer_first_name,
        c.last_name AS customer_last_name,
        v.license_plate AS vehicle_license_plate
      FROM feedback f
      JOIN customers c ON f.customer_id = c.id
      JOIN vehicles v ON f.vehicle_id = v.id
      WHERE f.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit new feedback (Admin and User)
router.post('/', authenticateToken, authorizeRoles(['admin', 'user']), async (req, res) => {
  const { customer_id, vehicle_id, rating, comments } = req.body;
  try {
    const result = await query(
      'INSERT INTO feedback (customer_id, vehicle_id, rating, comments) VALUES ($1, $2, $3, $4) RETURNING *',
      [customer_id, vehicle_id, rating, comments]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update feedback (Admin only)
router.put('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id } = req.params;
  const { customer_id, vehicle_id, rating, comments } = req.body;
  try {
    const result = await query(
      'UPDATE feedback SET customer_id = $1, vehicle_id = $2, rating = $3, comments = $4 WHERE id = $5 RETURNING *',
      [customer_id, vehicle_id, rating, comments, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating feedback:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete feedback (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM feedback WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json({ message: 'Feedback deleted successfully', id: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting feedback:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
