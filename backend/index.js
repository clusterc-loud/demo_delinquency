require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const flaggedRoutes = require('./routes/flaggedAccounts');
const customerRoutes = require('./routes/customer');
const interventionRoutes = require('./routes/interventions');
const msmeRoutes = require('./routes/msme');
const fraudRoutes = require('./routes/fraud');
const portalRoutes = require('./routes/portal');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'VittChetak Backend', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/flagged', flaggedRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/msme', msmeRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/chat', require('./routes/chat'));
app.use('/api/simulator', require('./routes/simulator'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`VittChetak Backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`CORS allowed origin: ${process.env.CLIENT_URL}`);
  });
};

start();
