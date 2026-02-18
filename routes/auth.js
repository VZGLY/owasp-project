const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { query } = require('../config/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Protection contre le brute force : 5 tentatives par minute par IP
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limite à 5 requêtes
  message: { message: 'Trop de tentatives de connexion. Veuillez réessayer dans 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentification et autorisation des utilisateurs
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Enregistrer un nouvel utilisateur
 *     tags: [Auth]
 *     description: Crée un nouveau compte utilisateur.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       201:
 *         description: Utilisateur enregistré/mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Entrée invalide
 *       500:
 *         description: Erreur serveur
 */
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  // Validation: empty password
  if (!password || password.trim() === '') {
    return res.status(400).json({ message: 'Password is required and cannot be empty.' });
  }

  // Validation: Regex for username (3-20 characters, alphanumeric and underscores)
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ message: 'Invalid username. It must be 3-20 characters long and contain only letters, numbers, and underscores.' });
  }

  // Validation: Regex for password (min 8 chars, 1 upper, 1 lower, 1 digit, 1 special)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&=])[A-Za-z\d@$!%*?&=]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.' });
  }

  if (role && !['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Role must be "user" or "admin".' });
  }

  try {
    // Check if user already exists
    const userExists = await query('SELECT * FROM users WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Username already exists. Please choose another one.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hashedPassword, role || 'user']
    );
    const user = result.rows[0];
    res.status(201).json({ message: 'User registered', user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connecter un utilisateur
 *     tags: [Auth]
 *     description: Authentifie un utilisateur et renvoie un jeton JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Connecté avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  // VULN #3: Absence de limitation de débit sur le point de terminaison 
  try {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // VULN #10: Authentification par n'importe quel mot de passe // Fix
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Logged in successfully ', token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;
