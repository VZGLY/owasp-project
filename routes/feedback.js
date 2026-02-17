const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: Opérations de feedback client
 */

/**
 * @swagger
 * /feedback:
 *   get:
 *     summary: Obtenir tous les feedbacks (Admin seulement)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Une liste d'entrées de feedback
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Feedback'
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
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /feedback/{id}:
 *   get:
 *     summary: Obtenir une seule entrée de feedback par ID (Admin seulement)
 *     tags: [Feedback]
 *     description: Obtenir une seule entrée de feedback par ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID numérique de l'entrée de feedback à récupérer. Vulnérable à l'IDOR.
 *     responses:
 *       200:
 *         description: Un seul objet entrée de feedback
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feedback'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Utilisateur authentifié requis)
 *       404:
 *         description: Feedback non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', authenticateToken, authorizeRoles(['admin', 'user']), async (req, res) => {
  const { id } = req.params;
  // VULN #4: IDOR sur feedback
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
      return res.status(404).json({ message: 'Feedback non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /feedback:
 *   post:
 *     summary: Soumettre un nouveau feedback (Admin et Utilisateur)
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
 *         description: Feedback soumis avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Entrée invalide
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin ou Utilisateur requis)
 *       500:
 *         description: Erreur serveur
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
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /feedback/{id}:
 *   put:
 *     summary: Mettre à jour le feedback (Admin seulement)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID numérique de l'entrée de feedback à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeedbackInput'
 *     responses:
 *       200:
 *         description: Feedback mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Entrée invalide
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin requis)
 *       404:
 *         description: Feedback non trouvé
 *       500:
 *         description: Erreur serveur
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
      return res.status(404).json({ message: 'Feedback non trouvé' });
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
 *     summary: Supprimer le feedback (Admin seulement)
 *     tags: [Feedback]
 *     description: Supprimer le feedback.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID numérique de l'entrée de feedback à supprimer.
 *     responses:
 *       200:
 *         description: Feedback supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 id:
 *                   type: integer
 *       404:
 *         description: Feedback non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  // VULN #15: Suppression non authentifiée
  try {
    const result = await query('DELETE FROM feedback WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Feedback non trouvé' });
    }
    res.json({ message: 'Feedback supprimé avec succès', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
