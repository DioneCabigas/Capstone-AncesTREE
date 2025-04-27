const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes'); // You might still have this import
const userRoutes = require('./routes/userRoutes'); // Import the userRoutes
const admin = require('./config/database'); // Import Firebase Admin SDK

const app = express();
const port = process.env.PORT || 3001;

// Middleware setup
// In your app.js file
app.use(cors({
  origin: '*', // Allow all origins temporarily for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Increase JSON payload limit if needed for large profile data
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

// Session configuration
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false }
}));

// Simple middleware to log API requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/auth', authRoutes); // Keep existing auth routes
app.use('/api', userRoutes); // User routes for profile operations

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode`);
});

// Please make sure naa inyong key sa Firebase sa config directory
// To run just do node src/app.js