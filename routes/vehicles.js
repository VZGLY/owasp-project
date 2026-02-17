const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Get all vehicles (Admin only)
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const result = await query(
      `SELECT
        v.id,
        v.make,
        v.model,
        v.year,
        v.license_plate,
        v.vin,
        c.first_name AS customer_first_name,
        c.last_name AS customer_last_name
      FROM vehicles v
      JOIN customers c ON v.customer_id = c.id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single vehicle by ID (Admin only)
router.get('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT
        v.id,
        v.make,
        v.model,
        v.year,
        v.license_plate,
        v.vin,
        c.first_name AS customer_first_name,
        c.last_name AS customer_last_name
      FROM vehicles v
      JOIN customers c ON v.customer_id = c.id
      WHERE v.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching vehicle:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new vehicle (Admin only)
router.post('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { customer_id, make, model, year, license_plate, vin } = req.body;
  try {
    const result = await query(
      'INSERT INTO vehicles (customer_id, make, model, year, license_plate, vin) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [customer_id, make, model, year, license_plate, vin]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating vehicle:', err);
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'Vehicle with this license plate or VIN already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a vehicle (Admin only)
router.put('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id } = req.params;
  const { customer_id, make, model, year, license_plate, vin } = req.body;
  try {
    const result = await query(
      'UPDATE vehicles SET customer_id = $1, make = $2, model = $3, year = $4, license_plate = $5, vin = $6 WHERE id = $7 RETURNING *',
      [customer_id, make, model, year, license_plate, vin, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating vehicle:', err);
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'Vehicle with this license plate or VIN already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a vehicle (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM vehicles WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json({ message: 'Vehicle deleted successfully', id: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting vehicle:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
