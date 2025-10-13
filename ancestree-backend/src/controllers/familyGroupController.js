const familyGroupService = require('../services/familyGroupService');

exports.createGroup = async (req, res) => {
  const { userId, treeId, name, description } = req.body;

  if (!userId || !treeId || !name) {
    return res.status(400).json({ message: 'userId, treeId, and name are required.' });
  }

  try {
    const id = await familyGroupService.createGroup(userId, treeId, name, description);
    res.status(200).json({ message: 'Family group created.', id });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Failed to create group.' });
  }
};

exports.getGroupById = async (req, res) => {
  const { id } = req.params;

  try {
    const group = await familyGroupService.getGroupById(id);
    res.status(200).json(group);
  } catch (error) {
    console.error('Error retrieving group:', error);
    res.status(500).json({ message: 'Failed to retrieve group.' });
  }
};

exports.getGroupsByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const groups = await familyGroupService.getGroupsByUser(userId);
    res.status(200).json(groups);
  } catch (error) {
    console.error('Error retrieving user groups:', error);
    res.status(500).json({ message: 'Failed to retrieve user groups.' });
  }
};

exports.updateGroupDescription = async (req, res) => {
  const { groupId } = req.params;
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ message: 'Description is required.' });
  }

  try {
    await familyGroupService.updateGroupDescription(groupId, description);
    res.status(200).json({ message: 'Group description updated.' });
  } catch (error) {
    console.error('Error updating group description:', error);
    res.status(500).json({ message: 'Failed to update description.' });
  }
};


exports.deleteGroup = async (req, res) => {
  const { groupId } = req.params;

  try {
    await familyGroupService.deleteGroup(groupId);
    res.status(200).json({ message: 'Group deleted.' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ message: 'Failed to delete group.' });
  }
};

exports.leaveGroup = async (req, res) => {
  const { groupId, userId } = req.body;

  try {
    const result = await familyGroupService.leaveGroup(groupId, userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(400).json({ message: error.message });
  }
};


exports.getGroupByTreeId = async (req, res) => {
  const { treeId } = req.params;

  try {
    const group = await familyGroupService.getGroupByTreeId(treeId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found for this tree.' });
    }
    res.status(200).json(group);
  } catch (error) {
    console.error('Error retrieving group by tree ID:', error);
    res.status(500).json({ message: 'Failed to retrieve group.' });
  }
};
