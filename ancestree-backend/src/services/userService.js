const admin = require('../config/database');
const User = require('../entities/User');
const profileService = require('./profileService');

const dbAdmin = admin.firestore();
const authAdmin = admin.auth();

exports.createUser = async (uid, data) => {
  const user = new User(data);
  await authAdmin.getUser(uid);
  const userDocRef = dbAdmin.collection('users').doc(uid);
  await userDocRef.set(user.toJSON());
  await profileService.createOrUpdateProfile(uid, {});
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
  const userDocRef = dbAdmin.collection('users').doc(uid);
  await userDocRef.delete();
};