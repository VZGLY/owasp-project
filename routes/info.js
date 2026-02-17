const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('../middleware/authMiddleware');
require('dotenv').config(); // Ensure dotenv is loaded for DB_PORT

/**
 * @swagger
 * tags:
 *   name: Info
 *   description: Point de terminaison intentionnellement vulnérable pour l'exposition d'informations sensibles.
 */

/**
 * @swagger
 * /info:
 *   get:
 *     summary: Obtenir des informations sensibles sur l'application (Admin et Utilisateur).
 *     tags: [Info]
 *     description: Obtenir des informations sensibles sur l'application.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informations sensibles de l'application et de la base de données.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 appName:
 *                   type: string
 *                 appVersion:
 *                   type: string
 *                 dbPort:
 *                   type: string
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // VULN #11: Exposition d'informations sensibles (Nom de l'application, version, port DB)
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const sensitiveInfo = {
      appName: packageJson.name,
      appVersion: packageJson.version,
      dbPort: process.env.DB_PORT,
    };

    res.json(sensitiveInfo);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
