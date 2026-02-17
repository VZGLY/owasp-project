const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Service management operations
 */

/**
 * @swagger
 * /services:
 *   get:
 *     summary: Get all services (Admin and User)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of services
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Service'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin or User role required)
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, authorizeRoles(['admin', 'user']), async (req, res) => {
  try {
    const result = await query('SELECT id, name, description, price FROM services');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /services/{id}:
 *   get:
 *     summary: Get a single service by ID (Admin and User)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the service to retrieve
 *     responses:
 *       200:
 *         description: A single service object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin or User role required)
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /services:
 *   post:
 *     summary: Create a new service (Admin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceInput'
 *     responses:
 *       201:
 *         description: Service created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin role required)
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /services/{id}:
 *   put:
 *     summary: Update an existing service (Admin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the service to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceInput'
 *     responses:
 *       200:
 *         description: Service updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin role required)
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /services/{id}:
 *   delete:
 *     summary: Delete a service (Admin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the service to delete
 *     responses:
 *       200:
 *         description: Service deleted successfully
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
 *         description: Service not found
 *       500:
 *         description: Server error
 */
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
