const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Points de terminaison de gestion des utilisateurs
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtenir tous les utilisateurs (Admin seulement)
 *     tags: [Users]
 *     description: Récupère une liste de tous les utilisateurs.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Une liste d'utilisateurs.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   username:
 *                     type: string
 *                   role:
 *                     type: string
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin requis)
 *       500:
 *         description: Erreur serveur
 */
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const result = await query('SELECT id, username, role FROM users'); 
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtenir les détails de l'utilisateur par ID (Admin seulement)
 *     tags: [Users]
 *     description: Récupère les détails d'un utilisateur par ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID numérique de l'utilisateur à récupérer.
 *     responses:
 *       200:
 *         description: Détails de l'utilisateur, y compris le mot de passe haché
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 password:
 *                   type: string
 *                   description: Mot de passe haché de l'utilisateur (Vulnérable)
 *                 role:
 *                   type: string
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin requis)
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    // VULN #19: Exposition du hachage de mot de passe // Fix
    const result = await query('SELECT id, username, role FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
