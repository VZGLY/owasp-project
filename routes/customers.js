const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Opérations de gestion des clients
 */

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Obtenir tous les clients ou rechercher par nom de famille (Admin seulement)
 *     tags: [Customers]
 *     description: Récupère une liste de tous les clients ou recherche des clients par nom de famille.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: last_name
 *         schema:
 *           type: string
 *         required: false
 *         description: Nom de famille à rechercher.
 *     responses:
 *       200:
 *         description: Une liste de clients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Utilisateur authentifié requis)
 *       500:
 *         description: Erreur serveur
 */
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  // VULN #1 : Accès non autorisé aux données sensibles - Clients // Fix
  const { last_name } = req.query;
  let sqlQuery = 'SELECT id, first_name, last_name, email, phone FROM customers';
  let params = [];
  
  if (last_name) {
    // VULN #14: Injection SQL - Recherche de clients par nom // Fix
    sqlQuery += ' WHERE last_name ILIKE $1';
    params.push(`%${last_name}%`);
  }

  try {
    const result = await query(sqlQuery, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Obtenir un client par ID (Admin seulement)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID numérique du client à récupérer
 *     responses:
 *       200:
 *         description: Un seul objet client
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin requis)
 *       404:
 *         description: Client non trouvé
 *       500:
 *         description: Erreur serveur
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
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Créer un nouveau client (Admin seulement)
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
 *         description: Client créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Entrée invalide ou client avec cet e-mail existe déjà
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin requis)
 *       500:
 *         description: Erreur serveur
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
 *     summary: Mettre à jour un client existant (Admin seulement)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID numérique du client à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerInput'
 *     responses:
 *       200:
 *         description: Client mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Entrée invalide ou client avec cet e-mail existe déjà
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin requis)
 *       404:
 *         description: Client non trouvé
 *       500:
 *         description: Erreur serveur
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
 *     summary: Supprimer un client (Admin seulement)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID numérique du client à supprimer
 *     responses:
 *       200:
 *         description: Client supprimé avec succès
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
 *         description: Client non trouvé
 *       500:
 *         description: Erreur serveur
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
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
