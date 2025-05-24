const express = require('express');
const router = express.Router();
const familyGroupMemberController = require('../controllers/familyGroupMemberController');

router.post('/', familyGroupMemberController.addMember);
router.get('/group/:groupId', familyGroupMemberController.getMembersByGroup);
router.patch('/:id/status', familyGroupMemberController.updateMemberStatus);
router.delete('/:id', familyGroupMemberController.removeMember);

module.exports = router;
