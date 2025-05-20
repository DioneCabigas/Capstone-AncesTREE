const admin = require('../config/database');
const User = require('../entities/User');

const dbAdmin = admin.firestore();
const authAdmin = admin.auth();

exports.createUser = async (uid, data) => {
  const user = new User(data);
  await authAdmin.getUser(uid);
  const userDocRef = dbAdmin.collection('users').doc(uid);
  await userDocRef.set(user);
};

exports.getUser = async (uid) => {
  const doc = await dbAdmin.collection('users').doc(uid).get();
  if (!doc.exists) return null;
  return doc.data();
};

exports.updateUser = async (uid, updatedData) => {
  const userDocRef = dbAdmin.collection('users').doc(uid);
  await userDocRef.update(updatedData);
};

exports.deleteUser = async (uid) => {
  const userDocRef = dbAdmin.collection('users').doc(uid);
  await userDocRef.delete();
};