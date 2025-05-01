const { auth } = require('../config/database');

// Authentication middleware to verify Firebase ID tokens
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No token provided'
      });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Invalid token',
      error: error.message
    });
  }
};

module.exports = authMiddleware;