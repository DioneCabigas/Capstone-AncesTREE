const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authCleanupService = require('../services/authCleanupService');

router.post('/', userController.createUser);
router.get('/:uid', userController.getUser);
router.put('/:uid', userController.updateUser);
router.delete('/:uid', userController.deleteUser);

// Cleanup endpoint for failed registrations
router.delete('/auth-cleanup/:uid', async (req, res) => {
  const { uid } = req.params;
  
  try {
    await authCleanupService.deleteAuthUser(uid);
    res.status(200).json({ message: 'Firebase Auth user deleted successfully.' });
  } catch (error) {
    console.error('Error cleaning up Firebase Auth user:', error);
    res.status(500).json({ message: 'Failed to cleanup Firebase Auth user.' });
  }
});

module.exports = router;