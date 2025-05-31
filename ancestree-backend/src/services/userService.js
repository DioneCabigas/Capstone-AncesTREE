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

exports.searchUsers = async (searchTerm = '', city = '', country = '') => {
  const snapshot = await dbAdmin.collection('users').get();
  const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const searchTokens = searchTerm.toLowerCase().trim().split(' ').filter(Boolean);

  return allUsers.filter(user => {
    const firstName = user.firstName?.toLowerCase() || '';
    const lastName = user.lastName?.toLowerCase() || '';
    const cityAddress = user.cityAddress?.toLowerCase() || '';
    const countryAddress = user.countryAddress?.toLowerCase() || '';

    const nameMatch = searchTokens.every(token =>
      firstName.includes(token) || lastName.includes(token)
    );

    const cityMatch = !city || cityAddress === city.toLowerCase();
    const countryMatch = !country || countryAddress === country.toLowerCase();

    return nameMatch && cityMatch && countryMatch;
  });
};
