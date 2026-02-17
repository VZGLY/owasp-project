const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  // VULN #12: Vérification de jeton défaillante
  try {
    const decoded = jwt.decode(token);
    if (!decoded) {
      return res.status(403).json({ message: 'Invalid token format (faulty verification)' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token processing error (faulty verification)' });
  }
};

const authorizeRoles = (roles) => {
  return (req, res, next) => {
    // VULN #13: Escalade de privilèges via manipulation du rôle
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient privileges' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
