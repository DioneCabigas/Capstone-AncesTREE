const admin = require('../config/database');
const User = require('../entities/User');
const profileService = require('./profileService');
const familyTreeService = require('./familyTreeService');
const authCleanupService = require('./authCleanupService');

const dbAdmin = admin.firestore();
const authAdmin = admin.auth();

exports.createUser = async (uid, data) => {
  const user = new User(data);
  
  try {
    // Verify the Firebase Auth user exists
    await authAdmin.getUser(uid);
    
    // Create user document in Firestore
    const userDocRef = dbAdmin.collection('users').doc(uid);
    await userDocRef.set(user.toJSON());
    
    // Create user profile
    await profileService.createProfile(uid, {});
    
    // Create personal family tree
    const treeName = 'personal-' + uid;
    const personData = {
      firstName: data.firstName,
      lastName: data.lastName,
    }
    await familyTreeService.createNewFamilyTree(uid, treeName, personData);
    
  } catch (error) {
    console.error('Error during user creation, attempting cleanup:', error);
    
    // Attempt to clean up any partially created data
    try {
      // Delete user document if it was created
      const userDocRef = dbAdmin.collection('users').doc(uid);
      const userDoc = await userDocRef.get();
      if (userDoc.exists) {
        await userDocRef.delete();
        console.log('Cleaned up user document from Firestore');
      }
      
      // Note: Profile and family tree cleanup could be added here if needed
      // For now, we'll let the frontend handle Firebase Auth cleanup
      
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    
    // Re-throw the original error
    throw error;
  }
};

exports.getUser = async (uid) => {
  const doc = await dbAdmin.collection('users').doc(uid).get();
  if (!doc.exists) return null;
  const data = doc.data();
  return new User(data).toJSON();
};

exports.updateUser = async (uid, updatedData) => {
  const allowedFields = ['firstName', 'lastName', 'email', 'middleName', 'suffix'];
  const filtered = {};

  for (const field of allowedFields) {
    if (field in updatedData) {
      filtered[field] = updatedData[field];
    }
  }

  const userDocRef = dbAdmin.collection('users').doc(uid);
  await userDocRef.update(filtered);
};

exports.deleteUser = async (uid) => {
  try {
    console.log(`Starting deletion process for user: ${uid}`);
    
    // Delete user document from Firestore
    const userDocRef = dbAdmin.collection('users').doc(uid);
    const userDoc = await userDocRef.get();
    if (userDoc.exists) {
      await userDocRef.delete();
      console.log('User document deleted from Firestore');
    }
    
    // TODO: Add cleanup for related data:
    // - Profile data
    // - Family trees
    // - Photo gallery
    // - Connections
    // - Settings
    // - Group memberships
    // These can be implemented as needed based on your data structure
    
    console.log(`User deletion completed for: ${uid}`);
    
  } catch (error) {
    console.error(`Error deleting user ${uid}:`, error);
    throw new Error(`Failed to delete user: ${error.message}`);
  }
};
