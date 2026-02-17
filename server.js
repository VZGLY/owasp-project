const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const authRoutes = require('./routes/auth');
const customersRoutes = require('./routes/customers');
const vehiclesRoutes = require('./routes/vehicles');
const servicesRoutes = require('./routes/services');
const invoicesRoutes = require('./routes/invoices');
const feedbackRoutes = require('./routes/feedback');
const { authenticateToken, authorizeRoles } = require('./middleware/authMiddleware');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swaggerDef');
require('dotenv').config();

app.use(express.json());

// Conditionally enable Swagger UI
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

// Example of a protected route (requires authentication)
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: `Welcome ${req.user.username}, your role is ${req.user.role}. This is a protected route!` });
});

// Example of an admin-only route (requires admin role)
app.get('/api/admin', authenticateToken, authorizeRoles(['admin']), (req, res) => {
  res.json({ message: 'Welcome Admin! This is an admin-only route.' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});