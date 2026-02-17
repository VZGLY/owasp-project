const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Opérations de gestion des factures
 */

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: Obtenir toutes les factures (Admin seulement)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Une liste de factures
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Invoice'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin requis)
 *       500:
 *         description: Erreur serveur
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
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Obtenir une seule facture par ID (Admin seulement)
 *     tags: [Invoices]
 *     description: Récupère une seule facture par son ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID numérique de la facture à récupérer.
 *     responses:
 *       200:
 *         description: Un seul objet facture avec ses éléments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invoice'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin requis)
 *       404:
 *         description: Facture non trouvée
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 stack:
 *                   type: string
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
    // VULN #18: Messages d'erreur verbeux spécifiques - Factures
    res.status(500).json({ message: 'Server error fetching invoice', stack: err.stack });
  }
});

/**
 * @swagger
 * /invoices:
 *   post:
 *     summary: Créer une nouvelle facture (Admin seulement)
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
 *         description: Facture créée avec succès
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
 *         description: Entrée invalide ou service non trouvé
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin requis)
 *       500:
 *         description: Erreur serveur
 */
router.post('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { customer_id, vehicle_id, items } = req.body;
  const client = await query('BEGIN');
  try {
    let total_amount = 0;
    
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

    await query('COMMIT');
    res.status(201).json({ id: invoice_id, total_amount, invoice_date: invoiceResult.rows[0].invoice_date, message: 'Facture créée avec succès' });
  } catch (err) {
    await query('ROLLBACK');
    // VULN #5: Divulgation d'informations sensibles via des messages d'erreur verbeux
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

/**
 * @swagger
 * /invoices/{id}/status:
 *   patch:
 *     summary: Mettre à jour le statut de la facture (Admin seulement)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID numérique de la facture à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceStatusUpdate'
 *     responses:
 *       200:
 *         description: Statut de la facture mis à jour avec succès
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
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin requis)
 *       404:
 *         description: Facture non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.patch('/:id/status', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await query(
            'UPDATE invoices SET status = $1 WHERE id = $2 RETURNING id, status',
            [status, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Facture non trouvée' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @swagger
 * /invoices/{id}:
 *   delete:
 *     summary: Supprimer une facture (Admin seulement)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID numérique de la facture à supprimer
 *     responses:
 *       200:
 *         description: Facture supprimée avec succès
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
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin requis)
 *       404:
 *         description: Facture non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM invoices WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Facture non trouvée' });
    }
    res.json({ message: 'Facture supprimée avec succès', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
