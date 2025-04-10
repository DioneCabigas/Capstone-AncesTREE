const admin = require('../../config/database');

exports.verifyToken = async (token) => {
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw error;
  }
};

exports.getUserData = async (uid) => {
  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();

    if (userDoc.exists) {
      return userDoc.data();
    }

    return null;
    
  } catch (error) {
    console.error('Error fetching user data from Firestore:', error);
    throw error;
  }
};