const familyGroupInvitationService = require('../services/familyGroupInvitationService');

exports.sendInvitation = async (req, res) => {
  const { groupId, senderId, receiverId } = req.body;

  if (!groupId || !senderId || !receiverId) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const result = await familyGroupInvitationService.sendInvitation(groupId, senderId, receiverId);
    return res.status(200).json({ message: result });
  } catch (err) {
    console.error('Error sending invitation:', err);
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
};

exports.acceptInvitation = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await familyGroupInvitationService.acceptInvitation(id);
    return res.status(200).json({ message: result });
  } catch (err) {
    console.error('Error accepting invitation:', err);
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
};

exports.rejectInvitation = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await familyGroupInvitationService.rejectInvitation(id);
    return res.status(200).json({ message: result });
  } catch (err) {
    console.error('Error rejecting invitation:', err);
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
};

exports.getUserInvitations = async (req, res) => {
  const { userId } = req.params;

  try {
    const invitations = await familyGroupInvitationService.getUserInvitations(userId);
    res.status(200).json(invitations);
  } catch (err) {
    console.error('Error fetching invitations:', err);
    res.status(500).json({ message: 'Failed to fetch invitations' });
  }
};