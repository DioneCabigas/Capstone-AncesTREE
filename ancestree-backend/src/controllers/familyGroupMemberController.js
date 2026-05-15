const familyGroupMemberService = require('../services/familyGroupMemberService');
const familyGroupService = require('../services/familyGroupService');

exports.addMember = async (req, res) => {
  const { groupId, userId, role = 'Member', status = 'pending' } = req.body;

  if (!groupId || !userId) {
    return res.status(400).json({ message: 'groupId and userId are required.' });
  }

  try {
    const id = await familyGroupMemberService.addMember(groupId, userId, role, status);
    res.status(200).json({ message: 'Member added.', id });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ message: error.message || 'Failed to add member.' });
  }
};

exports.getMembersByGroup = async (req, res) => {
  const { groupId } = req.params;

  try {
    const members = await familyGroupMemberService.getMembersByGroup(groupId);
    console.debug(`getMembersByGroup(${groupId}) returned ${members.length} member(s)`);
    if (members.length) {
      console.debug('member payload example:', members.map(member => ({ userId: member.userId, role: member.role })));
    } else {
      console.debug(`No members found for group ${groupId}`);
    }
    res.status(200).json(members);
  } catch (error) {
    console.error('Error retrieving members:', error);
    res.status(500).json({ message: 'Failed to retrieve members.' });
  }
};

exports.getMemberByTreeAndUser = async (req, res) => {
  const { treeId, userId } = req.params;

  try {
    const group = await familyGroupService.getGroupByTreeId(treeId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found for this tree.' });
    }

    const members = await familyGroupMemberService.getMemberByGroupAndUser(group.id, userId);
    const member = members[0];

    console.debug(`getMemberByTreeAndUser(treeId=${treeId}, userId=${userId}) groupId=${group.id} result=`, member);

    if (!member) {
      return res.status(404).json({ message: 'Member not found for this user in the group.' });
    }

    res.status(200).json(member);
  } catch (error) {
    console.error('Error retrieving member by tree and user:', error);
    res.status(500).json({ message: 'Failed to retrieve member.' });
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
