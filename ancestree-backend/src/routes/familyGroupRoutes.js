const express = require('express');
const router = express.Router();
const familyGroupController = require('../controllers/familyGroupController');

router.post('/', familyGroupController.createGroup);
router.get('/:id', familyGroupController.getGroupById);
router.get('/user/:userId', familyGroupController.getGroupsByUser);
router.delete('/:id', familyGroupController.deleteGroup);

module.exports = router;
