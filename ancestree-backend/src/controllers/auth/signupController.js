const { auth, db } = require('../../config/database');

// Signup controller - handles user registration
const signupController = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    
    // Create user with Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName
    });
    
    // Create a user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: userRecord.email,
      displayName: userRecord.displayName,
      createdAt: new Date().toISOString(),
      photoURL: userRecord.photoURL || '',
      lastLogin: new Date().toISOString()
    });
    
    return res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      } 
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(400).json({ 
      success: false, 
      message: 'User creation failed',
      error: error.message 
    });
  }
};

module.exports = signupController;