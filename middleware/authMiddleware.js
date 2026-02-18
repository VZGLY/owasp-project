const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  // VULN #12: Vérification de jeton défaillante (FIXED)
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    req.user = decoded;
    next();
  });
};

const authorizeRoles = (roles) => {
  return (req, res, next) => {
    // VULN #13: Escalade de privilèges via manipulation du rôle // Fix
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient privileges' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
