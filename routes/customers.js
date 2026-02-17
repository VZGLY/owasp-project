const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management operations
 */

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all customers (Admin only)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin role required)
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const result = await query('SELECT id, first_name, last_name, email, phone FROM customers');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Get a single customer by ID (Admin only)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the customer to retrieve
 *     responses:
 *       200:
 *         description: A single customer object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin role required)
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Create a new customer (Admin only)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerInput'
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Invalid input or customer with this email already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin role required)
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /customers/{id}:
 *   put:
 *     summary: Update an existing customer (Admin only)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the customer to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerInput'
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Invalid input or customer with this email already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin role required)
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /customers/{id}:
 *   delete:
 *     summary: Delete a customer (Admin only)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the customer to delete
 *     responses:
 *       200:
 *         description: Customer deleted successfully
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
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
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
