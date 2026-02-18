const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Vehicles
 *   description: Opérations de gestion des véhicules
 */

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: Obtenir tous les véhicules (Admin seulement)
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Une liste de véhicules
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehicle'
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
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     summary: Obtenir un seul véhicule par ID (Admin seulement)
 *     tags: [Vehicles]
 *     description: Récupère un seul véhicule par son ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID numérique du véhicule à récupérer.
 *     responses:
 *       200:
 *         description: Un seul objet véhicule
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin requis)
 *       404:
 *         description: Véhicule non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id } = req.params;
  // VULN #8: Décalage d'ID sur les véhicules // Fix
  const targetId = parseInt(id);
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
      [targetId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /vehicles:
 *   post:
 *     summary: Créer un nouveau véhicule (Admin seulement)
 *     tags: [Vehicles]
 *     description: Crée un nouveau véhicule.
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
 *         description: Véhicule créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Entrée invalide ou erreur de base de données
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 detail:
 *                   type: string
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin requis)
 *       500:
 *         description: Erreur serveur
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
    // VULN #7: Exposition des erreurs de base de données
    res.status(400).json({ message: 'Database error occurred', detail: err.detail || err.message });
  }
});

/**
 * @swagger
 * /vehicles/{id}:
 *   put:
 *     summary: Mettre à jour un véhicule existant (Admin seulement)
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID numérique du véhicule à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VehicleInput'
 *     responses:
 *       200:
 *         description: Véhicule mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Entrée invalide ou véhicule avec cette plaque d'immatriculation/VIN existe déjà
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin requis)
 *       404:
 *         description: Véhicule non trouvé
 *       500:
 *         description: Erreur serveur
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
 *     summary: Supprimer un véhicule (Admin seulement)
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID numérique du véhicule à supprimer
 *     responses:
 *       200:
 *         description: Véhicule supprimé avec succès
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
 *         description: Véhicule non trouvé
 *       500:
 *         description: Erreur serveur
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
