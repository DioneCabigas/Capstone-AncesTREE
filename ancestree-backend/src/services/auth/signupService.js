const admin = require('../../config/database');

exports.createUser = async (email, password) => {
  try {

    return await admin.auth().createUser({
      email: email,
      password: password,
    });

  } catch (error) {
    console.error('Error creating user in Firebase Auth:', error);
    throw error;
  }
};

exports.storeUserData = async (uid, email, additionalData = {}) => {
  try {

    const userData = {
      email,
      ...additionalData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin.firestore().collection('users').doc(uid).set(userData);
    
    return userData;

  } catch (error) {
    console.error('Error storing user data in Firestore:', error);
    throw error;
  }
};