const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: Customer feedback operations
 */

/**
 * @swagger
 * /feedback:
 *   get:
 *     summary: Get all feedback (Admin only)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of feedback entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Feedback'
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

/**
 * @swagger
 * /feedback/{id}:
 *   get:
 *     summary: Get a single feedback entry by ID (Admin only)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the feedback entry to retrieve
 *     responses:
 *       200:
 *         description: A single feedback entry object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feedback'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin role required)
 *       404:
 *         description: Feedback not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /feedback:
 *   post:
 *     summary: Submit new feedback (Admin and User)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeedbackInput'
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin or User role required)
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /feedback/{id}:
 *   put:
 *     summary: Update feedback (Admin only)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the feedback entry to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeedbackInput'
 *     responses:
 *       200:
 *         description: Feedback updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin role required)
 *       404:
 *         description: Feedback not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /feedback/{id}:
 *   delete:
 *     summary: Delete feedback (Admin only)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the feedback entry to delete
 *     responses:
 *       200:
 *         description: Feedback deleted successfully
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
 *         description: Feedback not found
 *       500:
 *         description: Server error
 */
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
