const admin = require('../config/database');
const Profile = require('../entities/Profile');
const userService = require('./userService');
const db = admin.firestore();

const profilesCollection = db.collection('profiles');

exports.createProfile = async (uid, profileData) => {
  const docRef = profilesCollection.doc(uid);
  const doc = await docRef.get();

  if (doc.exists) {
    throw new Error('Profile already exists');
  }

  const profile = new Profile(profileData);
  await docRef.set(profile.toJSON());
};

exports.updateProfile = async (uid, profileData) => {
  const docRef = profilesCollection.doc(uid);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error('Profile does not exist');
  }

  const updatedFields = {};
  const allowedFields = [
    'birthDate', 'birthPlace', 'nationality', 'civilStatus',
    'streetAddress', 'cityAddress', 'provinceAddress',
    'countryAddress', 'zipCode', 'contactNumber', 'telephoneNumber'
  ];

  for (const field of allowedFields) {
    if (profileData[field] !== undefined) {
      updatedFields[field] = profileData[field];
    }
  }

  await docRef.update(updatedFields);
};

exports.getProfileWithUser = async (uid, requestingUserId = null) => {
  const userData = await userService.getUser(uid);
  if (!userData) throw new Error('User not found');

  // If it's not the user's own profile, check privacy permissions
  if (requestingUserId && requestingUserId !== uid) {
    try {
      // Check if the user allows others to view their information
      const userDoc = await profilesCollection.firestore.collection('users').doc(uid).get();
      const userSettings = userDoc.exists ? userDoc.data() : {};
      
      // Default to false if no permission setting exists (private by default)
      const allowView = userSettings.permissions?.allowView === true;
      
      if (!allowView) {
        // Return limited public information only
        return {
          firstName: userData.firstName,
          lastName: userData.lastName,
          // Hide all other personal information
          email: null,
          middleName: null,
          suffix: null,
          birthDate: null,
          birthPlace: null,
          nationality: null,
          civilStatus: null,
          streetAddress: null,
          cityAddress: null,
          provinceAddress: null,
          countryAddress: null,
          zipCode: null,
          contactNumber: null,
          telephoneNumber: null,
          _restricted: true // Flag to indicate this is restricted data
        };
      }
    } catch (error) {
      console.error(`Error checking privacy settings for user ${uid}:`, error);
      // On error, default to showing limited info (fail-safe)
      return {
        firstName: userData.firstName,
        lastName: userData.lastName,
        _restricted: true,
        _error: 'Privacy settings could not be verified'
      };
    }
  }

  // User is viewing their own profile OR privacy allows viewing
  const profileDoc = await profilesCollection.doc(uid).get();
  const profileData = profileDoc.exists ? profileDoc.data() : {};

  return {
    ...userData,
    ...profileData
  };
};

exports.deleteProfile = async (uid) => {
  await profilesCollection.doc(uid).delete();
};