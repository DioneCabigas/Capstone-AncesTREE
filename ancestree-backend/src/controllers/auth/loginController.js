const { auth } = require('../../config/database');

// Login controller - authentication is handled by Firebase on the frontend,
// this controller can be used for additional server-side authentication logic
const loginController = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Respond with user data
    return res.status(200).json({ 
      success: true, 
      message: 'Authentication successful',
      user: {
        uid: uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed',
      error: error.message 
    });
  }
};

module.exports = loginController;