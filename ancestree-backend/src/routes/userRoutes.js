const express = require('express');
const admin = require('../config/database');
const router = express.Router();
const dbAdmin = admin.firestore();
const authAdmin = admin.auth();

router.post('/users', async (req, res) => {
  try {
    const { uid, firstName, lastName, email, middleName, suffix, birthDate, birthPlace, nationality, civilStatus, streetAddress, cityAddress, provinceAddress, countryAddress, zipCode, contactNumber, telephoneNumber } = req.body;

    if (!uid || !email || !firstName || !lastName) {
      return res.status(400).json({ message: 'UID, email, first name, and last name are required.' });
    }

    try {
      await authAdmin.getUser(uid);
    } catch (error) {
      console.error('Error verifying UID:', error);
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const userDocRef = dbAdmin.collection('users').doc(uid);
    await userDocRef.set({
      firstName,
      lastName,
      email,
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

    return res.status(200).json({ message: 'User data saved successfully.' });

  } catch (error) {
    console.error('Error saving user data to Firestore:', error);
    return res.status(500).json({ message: 'Failed to save user data.' });
  }
});

module.exports = router;