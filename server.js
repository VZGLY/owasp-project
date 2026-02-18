const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const authRoutes = require('./routes/auth');
const customersRoutes = require('./routes/customers');
const vehiclesRoutes = require('./routes/vehicles');
const servicesRoutes = require('./routes/services');
const invoicesRoutes = require('./routes/invoices');
const feedbackRoutes = require('./routes/feedback');
const infoRoutes = require('./routes/info');
const usersRoutes = require('./routes/users');
const { authenticateToken, authorizeRoles } = require('./middleware/authMiddleware');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swaggerDef');
const cors = require('cors');
const sanitizeInput = require('./middleware/sanitizeInput');
require('dotenv').config();

app.use(express.json());

// VULN #20: CORS - Autoriser toutes les origines
app.use(cors());

app.use(sanitizeInput)


if (process.env.ENABLE_SWAGGER === 'true') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger UI enabled at /api-docs');
}

app.get('/', (req, res) => {
  res.send('Welcome to the Garage Management API!');
});

app.use('/api/auth', authRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/info', infoRoutes);
app.use('/api/users', usersRoutes);

app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: `Welcome ${req.user.username}, your role is ${req.user.role}. This is a protected route!` });
});

app.get('/api/admin', authenticateToken, authorizeRoles(['admin']), (req, res) => {
  res.json({ message: 'Welcome Admin! This is an admin-only route.' });
});

if (process.env.ENABLE_SWAGGER === 'true') {
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// VULN #5: Messages d'erreur verbeux (Global)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).send({
    message: err.message || 'Internal Server Error',
    stack: err.stack,
    error: err,
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});