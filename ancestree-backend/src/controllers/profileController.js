const profileService = require('../services/profileService');

exports.createProfile = async (req, res) => {
  const uid = req.params.userId;
  const profileData = req.body;

  try {
    await profileService.createProfile(uid, profileData);
    res.status(201).json({ message: 'Profile created successfully.' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || 'Failed to create profile.' });
  }
};

exports.updateProfile = async (req, res) => {
  const uid = req.params.userId;
  const profileData = req.body;

  try {
    await profileService.updateProfile(uid, profileData);
    res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || 'Failed to update profile.' });
  }
};

exports.getProfile = async (req, res) => {
  const uid = req.params.userId;

  try {
    const profile = await profileService.getProfileWithUser(uid);
    res.status(200).json(profile);
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: error.message || 'Profile not found.' });
  }
};

exports.deleteProfile = async (req, res) => {
  const uid = req.params.userId;

  try {
    await profileService.deleteProfile(uid);
    res.status(200).json({ message: 'Profile deleted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete profile.' });
  }
};