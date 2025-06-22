const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.post('/:userId', profileController.createProfile);
router.put('/:userId', profileController.updateProfile);
router.get('/:userId', profileController.getProfile);
router.delete('/:userId', profileController.deleteProfile);

module.exports = router;