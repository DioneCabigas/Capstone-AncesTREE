const express = require('express');
const router = express.Router();
const signupController = require('../controllers/auth/signupController');
const loginController = require('../controllers/auth/loginController');

//Auth Routes
router.post('/signup', signupController.signup);
router.post('/login', loginController.login);

module.exports = router;