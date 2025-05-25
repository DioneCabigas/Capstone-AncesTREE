const userService = require('../services/userService');

exports.createUser = async (req, res) => {
  const { uid, email, firstName, lastName } = req.body;

  if (!uid || !email || !firstName || !lastName) {
    return res.status(400).json({ message: 'UID, email, first name, and last name are required.' });
  }

  try {
    await userService.createUser(uid, req.body);
    res.status(200).json({ message: 'User data saved successfully.' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to save user data.' });
  }
};

exports.getUser = async (req, res) => {
  const { uid } = req.params;

  try {
    const userData = await userService.getUser(uid);
    if (!userData) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user data.' });
  }
};

exports.updateUser = async (req, res) => {
  const { uid } = req.params;

  try {
    await userService.updateUser(uid, req.body);
    res.status(200).json({ message: 'User settings updated successfully.' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user settings.' });
  }
};

exports.deleteUser = async (req, res) => {
  const { uid } = req.params;

  try {
    await userService.deleteUser(uid);
    res.status(200).json({ message: 'User account deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user.' });
  }
};

exports.searchUsers = async (req, res) => {
  const { search = '', city = '', country = '' } = req.query;

  try {
    const users = await userService.searchUsers(search, city, country);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Failed to search users.' });
  }
};