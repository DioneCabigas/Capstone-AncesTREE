const express = require('express');
const router = express.Router();
const { db, auth } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    return res.status(200).json({ 
      success: true, 
      user: { id: userDoc.id, ...userDoc.data() } 
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching user profile',
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { displayName, photoURL } = req.body;
    const uid = req.user.uid;
    
    // Update in Firebase Auth
    await auth.updateUser(uid, {
      displayName,
      photoURL
    });
    
    // Update in Firestore
    await db.collection('users').doc(uid).update({
      displayName,
      photoURL,
      updatedAt: new Date().toISOString()
    });
    
    return res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error updating profile',
      error: error.message
    });
  }
});

module.exports = router;