const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const familyTreeRoutes = require('./routes/familyTreeRoutes');
const familyMemberRoutes = require('./routes/familyMemberRoutes');
const familyGroupRoutes = require('./routes/familyGroupRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/family-trees', familyTreeRoutes);
app.use('/api/family-members', familyMemberRoutes);
app.use('/api/family-groups', familyGroupRoutes);

// Root route for API health check
app.get('/api', (req, res) => {
  res.json({ message: 'AncesTREE API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;