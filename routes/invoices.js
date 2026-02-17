const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Invoice management operations
 */

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: Get all invoices (Admin only)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Invoice'
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
        i.id,
        i.invoice_date,
        i.total_amount,
        i.status,
        c.first_name AS customer_first_name,
        c.last_name AS customer_last_name,
        v.license_plate AS vehicle_license_plate
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      JOIN vehicles v ON i.vehicle_id = v.id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Get a single invoice by ID (Admin only)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the invoice to retrieve
 *     responses:
 *       200:
 *         description: A single invoice object with its items
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invoice'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin role required)
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT
        i.id,
        i.invoice_date,
        i.total_amount,
        i.status,
        c.first_name AS customer_first_name,
        c.last_name AS customer_last_name,
        v.license_plate AS vehicle_license_plate,
        json_agg(json_build_object('item_id', ii.id, 'service_name', s.name, 'quantity', ii.quantity, 'unit_price', ii.unit_price)) AS items
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      JOIN vehicles v ON i.vehicle_id = v.id
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      LEFT JOIN services s ON ii.service_id = s.id
      WHERE i.id = $1
      GROUP BY i.id, c.first_name, c.last_name, v.license_plate`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching invoice:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /invoices:
 *   post:
 *     summary: Create a new invoice (Admin only)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceInput'
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 total_amount:
 *                   type: number
 *                   format: float
 *                 invoice_date:
 *                   type: string
 *                   format: date-time
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input or service not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin role required)
 *       500:
 *         description: Server error
 */
router.post('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { customer_id, vehicle_id, items } = req.body; // items is an array [{ service_id, quantity }]
  const client = await query('BEGIN'); // Start transaction
  try {
    let total_amount = 0;
    
    // Calculate total amount from items
    for (const item of items) {
      const serviceResult = await query('SELECT price FROM services WHERE id = $1', [item.service_id]);
      if (serviceResult.rows.length === 0) {
        throw new Error(`Service with ID ${item.service_id} not found`);
      }
      total_amount += serviceResult.rows[0].price * item.quantity;
    }

    const invoiceResult = await query(
      'INSERT INTO invoices (customer_id, vehicle_id, total_amount, status) VALUES ($1, $2, $3, $4) RETURNING id, invoice_date',
      [customer_id, vehicle_id, total_amount, 'pending']
    );
    const invoice_id = invoiceResult.rows[0].id;

    for (const item of items) {
      const serviceResult = await query('SELECT price FROM services WHERE id = $1', [item.service_id]);
      await query(
        'INSERT INTO invoice_items (invoice_id, service_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [invoice_id, item.service_id, item.quantity, serviceResult.rows[0].price]
      );
    }

    await query('COMMIT'); // End transaction
    res.status(201).json({ id: invoice_id, total_amount, invoice_date: invoiceResult.rows[0].invoice_date, message: 'Invoice created successfully' });
  } catch (err) {
    await query('ROLLBACK'); // Rollback transaction on error
    console.error('Error creating invoice:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

/**
 * @swagger
 * /invoices/{id}/status:
 *   patch:
 *     summary: Update invoice status (Admin only)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the invoice to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceStatusUpdate'
 *     responses:
 *       200:
 *         description: Invoice status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 status:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin role required)
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/status', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // e.g., 'paid', 'pending', 'cancelled'
    try {
        const result = await query(
            'UPDATE invoices SET status = $1 WHERE id = $2 RETURNING id, status',
            [status, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating invoice status:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @swagger
 * /invoices/{id}:
 *   delete:
 *     summary: Delete an invoice (Admin only)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the invoice to delete
 *     responses:
 *       200:
 *         description: Invoice deleted successfully
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
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM invoices WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ message: 'Invoice deleted successfully', id: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting invoice:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
