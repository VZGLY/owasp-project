const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Opérations de gestion des services
 */

/**
 * @swagger
 * /services:
 *   get:
 *     summary: Obtenir tous les services (Admin et Utilisateur)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Une liste de services
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Service'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin ou Utilisateur requis)
 *       500:
 *         description: Erreur serveur
 */
router.get('/', authenticateToken, authorizeRoles(['admin', 'user']), async (req, res) => {
  try {
    const result = await query('SELECT id, name, description, price FROM services');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /services/search:
 *   get:
 *     summary: Rechercher des services (Admin et Utilisateur)
 *     tags: [Services]
 *     description: Permet de rechercher des services par nom ou description.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Terme de recherche pour le nom ou la description du service.
 *     responses:
 *       200:
 *         description: Services correspondants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Service'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin ou Utilisateur requis)
 *       500:
 *         description: Erreur serveur
 */
router.get('/search', authenticateToken, authorizeRoles(['admin', 'user']), async (req, res) => {
  const { query: searchQuery } = req.query;
  let sqlQuery = 'SELECT id, name, description, price FROM services';
  let params = []
  if (searchQuery) {
    // VULN #2: Injection SQL - Recherche de services // Fix
    sqlQuery += ` WHERE name ILIKE '$1' OR description ILIKE '$1'`;
    params.push(`%${searchQuery}%`)
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
 * /services/{id}:
 *   get:
 *     summary: Obtenir un seul service par ID (Admin et Utilisateur)
 *     tags: [Services]
 *     description: Récupère un seul service par son ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID numérique du service à récupérer.
 *     responses:
 *       200:
 *         description: Un seul objet service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin ou Utilisateur requis)
 *       404:
 *         description: Service non trouvé
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
router.get('/:id', authenticateToken, authorizeRoles(['admin', 'user']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('SELECT id, name, description, price FROM services WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    // VULN #17: Messages d'erreur verbeux spécifiques - Services // Fix
    res.status(500).json({ message: 'Server error fetching service' });
  }
});

/**
 * @swagger
 * /services:
 *   post:
 *     summary: Créer un nouveau service (Admin seulement)
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
 *         description: Service créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       400:
 *         description: Entrée invalide
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin requis)
 *       500:
 *         description: Erreur serveur
 */
router.post('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { name, description, price } = req.body;
  try {
    if (price <= 0) {
      return res.status(400).json({message: 'The price need to be more than 0'})
    }
    // VULN #6: Valeurs de prix de service négatives (manque de validation) // Fix
    const result = await query(
      'INSERT INTO services (name, description, price) VALUES ($1, $2, $3) RETURNING id, name, description, price',
      [name, description, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
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
 *     summary: Mettre à jour un service existant (Admin seulement)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID numérique du service à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceInput'
 *     responses:
 *       200:
 *         description: Service mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       400:
 *         description: Entrée invalide
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Interdit (Rôle Admin requis)
 *       404:
 *         description: Service non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.put('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;
  try {
    if (price <= 0) {
      return res.status(400).json({message: 'The price need to be more than 0'})
    }
    // VULN #6: Valeurs de prix de service négatives (manque de validation) // Fix
    const result = await query(
      'UPDATE services SET name = $1, description = $2, price = $3 WHERE id = $4 RETURNING id, name, description, price',
      [name, description, price, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique violation if name is made unique
      return res.status(400).json({ message: 'Service avec ce nom existe déjà' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /services/{id}:
 *   delete:
 *     summary: Supprimer un service (Admin seulement)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID numérique du service à supprimer
 *     responses:
 *       200:
 *         description: Service supprimé avec succès
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
 *         description: Service non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM services WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }
    res.json({ message: 'Service supprimé avec succès', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
