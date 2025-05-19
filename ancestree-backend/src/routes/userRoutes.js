const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/search', userController.searchUsers);    // Seach user

router.post('/', userController.createUser);           // Create a new user
router.get('/:uid', userController.getUser);          // Get user by UID
router.put('/:uid', userController.updateUser);       // Update user info
router.delete('/:uid', userController.deleteUser);    // Delete user account

module.exports = router;
