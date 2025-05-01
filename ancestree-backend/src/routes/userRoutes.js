const express = require('express');
const admin = require('../config/database');
const router = express.Router();
const dbAdmin = admin.firestore();
const authAdmin = admin.auth();
const { validateToken } = require('../middleware/auth');

router.get('/users/:userId', validateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.uid;

    // Verify the requested user exists in Firebase Auth
    try {
      await authAdmin.getUser(userId);
    } catch (error) {
      console.error('Error verifying user existence:', error);
      return res.status(404).json({ message: 'User not found.' });
    }

    // Get user document from Firestore
    const userDocRef = dbAdmin.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    // Return the user data
    return res.status(200).json(userDoc.data());

  } catch (error) {
    console.error('Error fetching user data:', error);
    return res.status(500).json({ message: 'Failed to retrieve user data.' });
  }
});

// Update user data - protected by auth middleware
router.put('/users/:userId', validateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.uid;

    // Check if the requesting user is updating their own profile
    if (userId !== requestingUserId) {
      return res.status(403).json({ message: 'Unauthorized to update another user\'s profile.' });
    }

    // Extract only allowed fields from the request body
    const { 
      firstName, lastName, email, middleName, suffix, 
      birthDate, birthPlace, nationality, civilStatus, 
      streetAddress, cityAddress, provinceAddress, countryAddress, zipCode, 
      contactNumber, telephoneNumber 
    } = req.body;

    // Prepare update data with proper validation
    const updateData = {};
    
    // Required fields
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    
    // Optional fields
    if (middleName !== undefined) updateData.middleName = middleName || '';
    if (suffix !== undefined) updateData.suffix = suffix || '';
    if (birthDate !== undefined) updateData.birthDate = birthDate || '';
    if (birthPlace !== undefined) updateData.birthPlace = birthPlace || '';
    if (nationality !== undefined) updateData.nationality = nationality || '';
    if (civilStatus !== undefined) updateData.civilStatus = civilStatus || '';
    if (streetAddress !== undefined) updateData.streetAddress = streetAddress || '';
    if (cityAddress !== undefined) updateData.cityAddress = cityAddress || '';
    if (provinceAddress !== undefined) updateData.provinceAddress = provinceAddress || '';
    if (countryAddress !== undefined) updateData.countryAddress = countryAddress || '';
    if (zipCode !== undefined) updateData.zipCode = zipCode || '';
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber || '';
    if (telephoneNumber !== undefined) updateData.telephoneNumber = telephoneNumber || '';

    // Update the user document in Firestore
    const userDocRef = dbAdmin.collection('users').doc(userId);
    await userDocRef.update(updateData);

    return res.status(200).json({ message: 'User data updated successfully.' });

  } catch (error) {
    console.error('Error updating user data:', error);
    return res.status(500).json({ message: 'Failed to update user data.' });
  }
});

router.get('/users/:userId/connections', validateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.uid;

    // Check if the requesting user is getting their own connections
    // or has proper permissions to view other users' connections
    if (userId !== requestingUserId) {
      // Add permission check logic here if needed
      return res.status(403).json({ message: 'Unauthorized to view connections.' });
    }

    // Fetch connections from Firestore
    // This is a placeholder - implement according to your data structure
    const connectionsRef = dbAdmin.collection('connections')
      .where('userId', '==', userId);
    
    const connectionsSnapshot = await connectionsRef.get();
    
    if (connectionsSnapshot.empty) {
      return res.status(200).json([]);
    }

    const connections = [];
    connectionsSnapshot.forEach(doc => {
      connections.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return res.status(200).json(connections);

  } catch (error) {
    console.error('Error fetching connections:', error);
    return res.status(500).json({ message: 'Failed to retrieve connections.' });
  }
});

// Remove a connection
router.delete('/users/:userId/connections/:connectionId', validateToken, async (req, res) => {
  try {
    const { userId, connectionId } = req.params;
    const requestingUserId = req.user.uid;

    // Only allow users to remove their own connections
    if (userId !== requestingUserId) {
      return res.status(403).json({ message: 'Unauthorized to remove this connection.' });
    }

    // Delete the connection document
    await dbAdmin.collection('connections').doc(connectionId).delete();

    return res.status(200).json({ message: 'Connection removed successfully.' });

  } catch (error) {
    console.error('Error removing connection:', error);
    return res.status(500).json({ message: 'Failed to remove connection.' });
  }
});


router.post('/users', async (req, res) => {
  try {
    const { uid, firstName, lastName, email, middleName, suffix, birthDate, birthPlace, nationality, civilStatus, streetAddress, cityAddress, provinceAddress, countryAddress, zipCode, contactNumber, telephoneNumber } = req.body;
    const requestingUserId = req.user.uid;

    if (uid !== requestingUserId) {
      return res.status(403).json({ message: 'Unauthorized to create profile for another user.' });
    }

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