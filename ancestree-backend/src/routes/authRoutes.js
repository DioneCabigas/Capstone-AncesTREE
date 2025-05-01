const express = require('express');
const router = express.Router();
const loginController = require('../controllers/auth/loginController');
const signupController = require('../controllers/auth/signupController');

// Auth routes
router.post('/login', loginController);
router.post('/signup', signupController);

module.exports = router;