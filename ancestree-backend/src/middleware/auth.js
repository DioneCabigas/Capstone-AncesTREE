// src/middleware/auth.js
const admin = require('../config/database');

// Middleware to validate Firebase JWT token
const validateToken = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    // Check if auth header exists and has the right format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Unauthorized. No valid authentication token provided.'
      });
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Unauthorized. No token found in authorization header.'
      });
    }
    
    try {
      // Verify the token with Firebase Admin
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Add the user information to the request
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        // Add any other user info you need from the token
      };
      
      // Continue to the next middleware or route handler
      next();
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return res.status(401).json({ 
        message: 'Unauthorized. Invalid or expired token.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      message: 'Internal server error during authentication.'
    });
  }
};

module.exports = {
  validateToken
};  