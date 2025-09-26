const express = require('express');
const router = express.Router();
const familyGroupInvitation = require('../controllers/FamilyGroupInvitationController');

router.post('/', familyGroupInvitation.sendInvitation);
router.post('/:id/accept', familyGroupInvitation.acceptInvitation);
router.post('/:id/reject', familyGroupInvitation.rejectInvitation);
router.get('/user/:userId', familyGroupInvitation.getUserInvitations);

module.exports = router;