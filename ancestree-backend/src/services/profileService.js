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

exports.getProfileWithUser = async (uid) => {
  const userData = await userService.getUser(uid);
  if (!userData) throw new Error('User not found');

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