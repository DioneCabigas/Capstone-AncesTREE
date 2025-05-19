const admin = require('../config/database');
const dbAdmin = admin.firestore();
const authAdmin = admin.auth();

exports.createUser = async (req, res) => {
  const {
    uid, firstName, lastName, email, middleName, suffix,
    birthDate, birthPlace, nationality, civilStatus,
    streetAddress, cityAddress, provinceAddress, countryAddress,
    zipCode, contactNumber, telephoneNumber
  } = req.body;

  if (!uid || !email || !firstName || !lastName) {
    return res.status(400).json({ message: 'UID, email, first name, and last name are required.' });
  }

  try {
    await authAdmin.getUser(uid);
    const userDocRef = dbAdmin.collection('users').doc(uid);
    await userDocRef.set({
      firstName, lastName, email,
      middleName: middleName || '',
      suffix: suffix || '',
      birthDate: birthDate || '',
      birthPlace: birthPlace || '',
      nationality: nationality || '',
      civilStatus: civilStatus || '',
      streetAddress: streetAddress || '',
      cityAddress: cityAddress || '',
      provinceAddress: provinceAddress || '',
      countryAddress: countryAddress || '',
      zipCode: zipCode || '',
      contactNumber: contactNumber || '',
      telephoneNumber: telephoneNumber || '',
    });

    res.status(200).json({ message: 'User data saved successfully.' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to save user data.' });
  }
};

exports.getUser = async (req, res) => {
  const { uid } = req.params;

  try {
    const doc = await dbAdmin.collection('users').doc(uid).get();
    if (!doc.exists) return res.status(404).json({ message: 'User not found.' });

    res.status(200).json(doc.data());
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user data.' });
  }
};

exports.updateUser = async (req, res) => {
  const { uid } = req.params;
  const updatedData = req.body;

  try {
    await dbAdmin.collection('users').doc(uid).update(updatedData);
    res.status(200).json({ message: 'User settings updated successfully.' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user settings.' });
  }
};

exports.deleteUser = async (req, res) => {
  const { uid } = req.params;

  try {
    await dbAdmin.collection('users').doc(uid).delete();
    res.status(200).json({ message: 'User account deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user.' });
  }
};

exports.searchUsers = async (req, res) => {
  const { term = '', city = '', country = '' } = req.query;

  try {
    const snapshot = await dbAdmin.collection('users').get();
    const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const searchTermLower = term.toLowerCase().trim();
    const searchTokens = searchTermLower.split(' ').filter(t => t !== '');

    // Filter users by matching ALL first or last name
    let filteredResults = allUsers.filter(user => {
      const firstNameLower = (user.firstName || '').toLowerCase();
      const lastNameLower = (user.lastName || '').toLowerCase();

      // Every search must appear (first / last name)
      return searchTokens.every(token => firstNameLower.includes(token) || lastNameLower.includes(token));
    });

    // Filter by EXACT City
    if (city.trim()) {
      const cityLower = city.toLowerCase();
      filteredResults = filteredResults.filter(user => (user.cityAddress || '').toLowerCase() === cityLower);
    }

    // Filter by EXACT Country
    if (country.trim()) {
      const countryLower = country.toLowerCase();
      filteredResults = filteredResults.filter(user => (user.countryAddress || '').toLowerCase() === countryLower);
    }

    res.status(200).json(filteredResults);
  } catch (error) {
    console.error('Search failed:', error);
    res.status(500).json({ message: 'Search failed' });
  }
};
