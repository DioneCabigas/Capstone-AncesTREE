const familyGroupMemberService = require('../services/familyGroupMemberService');

exports.addMember = async (req, res) => {
  const { groupId, userId, role, status } = req.body;

  if (!groupId || !userId) {
    return res.status(400).json({ message: 'groupId and userId are required.' });
  }

  try {
    const id = await familyGroupMemberService.addMember(groupId, userId, role, status);
    res.status(200).json({ message: 'Member added.', id });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ message: 'Failed to add member.' });
  }
};

exports.getMembersByGroup = async (req, res) => {
  const { groupId } = req.params;

  try {
    const members = await familyGroupMemberService.getMembersByGroup(groupId);
    res.status(200).json(members);
  } catch (error) {
    console.error('Error retrieving members:', error);
    res.status(500).json({ message: 'Failed to retrieve members.' });
  }
};

exports.updateMemberStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required.' });
  }

  try {
    await familyGroupMemberService.updateMemberStatus(id, status);
    res.status(200).json({ message: 'Member status updated.' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Failed to update status.' });
  }
};

exports.removeMember = async (req, res) => {
  const { id } = req.params;

  try {
    await familyGroupMemberService.removeMember(id);
    res.status(200).json({ message: 'Member removed.' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Failed to remove member.' });
  }
};
