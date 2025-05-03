const express = require('express');
const router = express.Router();
const familyGroupController = require('../controllers/familyGroupController');
const authMiddleware = require('../middleware/auth');

// Family group routes (all protected with auth middleware)
router.post('/', authMiddleware, familyGroupController.createFamilyGroup);
router.get('/', authMiddleware, familyGroupController.getFamilyGroups);
router.get('/:groupId', authMiddleware, familyGroupController.getFamilyGroup);
router.put('/:groupId', authMiddleware, familyGroupController.updateFamilyGroup);
router.delete('/:groupId', authMiddleware, familyGroupController.deleteFamilyGroup);

// Family group member management
router.post('/:groupId/members', authMiddleware, familyGroupController.addGroupMember);
router.delete('/:groupId/members/:memberId', authMiddleware, familyGroupController.removeGroupMember);
router.put('/:groupId/members/:memberId/role', authMiddleware, familyGroupController.updateMemberRole);

module.exports = router;