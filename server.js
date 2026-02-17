const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const authRoutes = require('./routes/auth');
const customersRoutes = require('./routes/customers');
const vehiclesRoutes = require('./routes/vehicles');
const servicesRoutes = require('./routes/services');
const invoicesRoutes = require('./routes/invoices');
const feedbackRoutes = require('./routes/feedback'); // Add this line
const { authenticateToken, authorizeRoles } = require('./middleware/authMiddleware'); // Added for future use

app.use(express.json());

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