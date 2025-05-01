const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const app = require('./src/services/app');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const familyTreeRoutes = require('./src/routes/familyTreeRoutes');
const familyMemberRoutes = require('./src/routes/familyMemberRoutes');
const familyGroupRoutes = require('./src/routes/familyGroupRoutes');

// Apply routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/family-trees', familyTreeRoutes);
app.use('/api/family-members', familyMemberRoutes);
app.use('/api/family-groups', familyGroupRoutes);

// Serve static files from the React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../ancestree-frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../ancestree-frontend/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

module.exports = app;