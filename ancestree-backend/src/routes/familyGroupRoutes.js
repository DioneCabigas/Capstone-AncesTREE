const express = require('express');
const router = express.Router();
const familyGroupController = require('../controllers/familyGroupController');

router.post('/', familyGroupController.createGroup);
router.get('/:id', familyGroupController.getGroupById);
router.get('/user/:userId', familyGroupController.getGroupsByUser);
router.patch('/:groupId/description', familyGroupController.updateGroupDescription);
router.delete('/:id', familyGroupController.deleteGroup);
router.get('/tree/:treeId', familyGroupController.getGroupByTreeId);

module.exports = router;