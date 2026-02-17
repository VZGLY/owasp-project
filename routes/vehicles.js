const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Vehicles
 *   description: Vehicle management operations
 */

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: Get all vehicles (Admin only)
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of vehicles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehicle'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin role required)
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     summary: Get a single vehicle by ID (Admin only)
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the vehicle to retrieve
 *     responses:
 *       200:
 *         description: A single vehicle object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin role required)
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /vehicles:
 *   post:
 *     summary: Create a new vehicle (Admin only)
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VehicleInput'
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Invalid input or vehicle with this license plate/VIN already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin role required)
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /vehicles/{id}:
 *   put:
 *     summary: Update an existing vehicle (Admin only)
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the vehicle to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VehicleInput'
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Invalid input or vehicle with this license plate/VIN already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin role required)
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /vehicles/{id}:
 *   delete:
 *     summary: Delete a vehicle (Admin only)
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the vehicle to delete
 *     responses:
 *       200:
 *         description: Vehicle deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 id:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin role required)
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Server error
 */
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
