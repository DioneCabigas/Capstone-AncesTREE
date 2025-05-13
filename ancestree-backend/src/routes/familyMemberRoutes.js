const express = require('express');
const router = express.Router();
const familyMemberController = require('../controllers/familyMemberController');
const authMiddleware = require('../middleware/auth');

// Family member routes (all protected with auth middleware)
router.post('/', authMiddleware, familyMemberController.createFamilyMember);
router.get('/tree/:treeId', authMiddleware, familyMemberController.getFamilyMembers);
router.get('/:memberId', authMiddleware, familyMemberController.getFamilyMember);
router.put('/:memberId', authMiddleware, familyMemberController.updateFamilyMember);
router.delete('/:memberId', authMiddleware, familyMemberController.deleteFamilyMember);

module.exports = router;