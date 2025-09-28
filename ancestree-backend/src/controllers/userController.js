const userService = require('../services/userService');

exports.createUser = async (req, res) => {
  const { uid, email, firstName, lastName } = req.body;

  if (!uid || !email || !firstName || !lastName) {
    return res.status(400).json({ message: 'UID, email, first name, and last name are required.' });
  }

  try {
    await userService.createUser(uid, req.body);
    res.status(200).json({ message: 'User data saved successfully.' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to save user data.' });
  }
};

exports.getUser = async (req, res) => {
  const { uid } = req.params;
  const requestingUserId = req.query.requestingUserId || null;

  try {
    let userData = await userService.getUser(uid);
    if (!userData) return res.status(404).json({ message: 'User not found.' });
    
    // If someone else is requesting this user's data, check privacy settings
    if (requestingUserId && requestingUserId !== uid) {
      try {
        const admin = require('../config/database');
        const db = admin.firestore();
        
        // Check privacy permissions directly from database
        const userDoc = await db.collection('users').doc(uid).get();
        const fullUserData = userDoc.exists ? userDoc.data() : {};
        
        // Check privacy permissions
        const allowView = fullUserData.permissions?.allowView === true;
        
        if (!allowView) {
          // Return limited public information only
          userData = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            // Hide all sensitive information
            email: null,
            middleName: null,
            suffix: null,
            _restricted: true
          };
        }
      } catch (privacyError) {
        console.error('Error checking privacy settings:', privacyError);
        // On error, return limited info
        userData = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          _restricted: true,
          _error: 'Privacy settings could not be verified'
        };
      }
    }
    
    res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user data.' });
  }
};

exports.updateUser = async (req, res) => {
  const { uid } = req.params;

  try {
    await userService.updateUser(uid, req.body);
    res.status(200).json({ message: 'User settings updated successfully.' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user settings.' });
  }
};

exports.deleteUser = async (req, res) => {
  const { uid } = req.params;

  try {
    await userService.deleteUser(uid);
    res.status(200).json({ message: 'User account deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user.' });
  }
};