const { db } = require('../config/database');

// Create a new family group
const createFamilyGroup = async (req, res) => {
  try {
    const { name, description, isPrivate, treeId } = req.body;
    const userId = req.user.uid;
    
    const groupData = {
      name,
      description: description || '',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPrivate: isPrivate || false,
      treeId: treeId || null,
      members: [{
        id: userId,
        role: 'admin',
        joinedAt: new Date().toISOString()
      }]
    };
    
    const groupRef = await db.collection('familyGroups').add(groupData);
    
    return res.status(201).json({
      success: true,
      message: 'Family group created successfully',
      groupId: groupRef.id,
      group: { id: groupRef.id, ...groupData }
    });
  } catch (error) {
    console.error('Error creating family group:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating family group',
      error: error.message
    });
  }
};

// Get all family groups for a user
const getFamilyGroups = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const groupsSnapshot = await db.collection('familyGroups')
      .where('members', 'array-contains', { id: userId })
      .get();
    
    if (groupsSnapshot.empty) {
      // Try different query approach since array-contains with object can be tricky
      const allGroupsSnapshot = await db.collection('familyGroups').get();
      
      const groups = [];
      allGroupsSnapshot.forEach(doc => {
        const groupData = doc.data();
        // Check if the user is a member
        const isMember = groupData.members.some(member => member.id === userId);
        
        if (isMember) {
          groups.push({ id: doc.id, ...groupData });
        }
      });
      
      return res.status(200).json({
        success: true,
        groups
      });
    } else {
      const groups = [];
      groupsSnapshot.forEach(doc => {
        groups.push({ id: doc.id, ...doc.data() });
      });
      
      return res.status(200).json({
        success: true,
        groups
      });
    }
  } catch (error) {
    console.error('Error fetching family groups:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching family groups',
      error: error.message
    });
  }
};

// Get a specific family group
const getFamilyGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.uid;
    
    const groupDoc = await db.collection('familyGroups').doc(groupId).get();
    
    if (!groupDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Family group not found'
      });
    }
    
    const groupData = groupDoc.data();
    
    // Check if the user is a member of this group
    const isMember = groupData.members.some(member => member.id === userId);
    
    if (!isMember && groupData.isPrivate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this private family group'
      });
    }
    
    return res.status(200).json({
      success: true,
      group: { id: groupDoc.id, ...groupData }
    });
  } catch (error) {
    console.error('Error fetching family group:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching family group',
      error: error.message
    });
  }
};

// Update a family group
const updateFamilyGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, isPrivate, treeId } = req.body;
    const userId = req.user.uid;
    
    const groupDoc = await db.collection('familyGroups').doc(groupId).get();
    
    if (!groupDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Family group not found'
      });
    }
    
    const groupData = groupDoc.data();
    
    // Check if the user is an admin of this group
    const isAdmin = groupData.members.some(
      member => member.id === userId && member.role === 'admin'
    );
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can update the group'
      });
    }
    
    const updateData = {
      name: name || groupData.name,
      description: description !== undefined ? description : groupData.description,
      isPrivate: isPrivate !== undefined ? isPrivate : groupData.isPrivate,
      treeId: treeId !== undefined ? treeId : groupData.treeId,
      updatedAt: new Date().toISOString()
    };
    
    await db.collection('familyGroups').doc(groupId).update(updateData);
    
    return res.status(200).json({
      success: true,
      message: 'Family group updated successfully',
      group: { id: groupId, ...groupData, ...updateData }
    });
  } catch (error) {
    console.error('Error updating family group:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating family group',
      error: error.message
    });
  }
};

// Delete a family group
const deleteFamilyGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.uid;
    
    const groupDoc = await db.collection('familyGroups').doc(groupId).get();
    
    if (!groupDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Family group not found'
      });
    }
    
    const groupData = groupDoc.data();
    
    // Check if the user is an admin of this group
    const isAdmin = groupData.members.some(
      member => member.id === userId && member.role === 'admin'
    );
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can delete the group'
      });
    }
    
    await db.collection('familyGroups').doc(groupId).delete();
    
    return res.status(200).json({
      success: true,
      message: 'Family group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting family group:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting family group',
      error: error.message
    });
  }
};

// Add a member to a family group
const addGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId, role } = req.body;
    const userId = req.user.uid;
    
    const groupDoc = await db.collection('familyGroups').doc(groupId).get();
    
    if (!groupDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Family group not found'
      });
    }
    
    const groupData = groupDoc.data();
    
    // Check if the user is an admin of this group
    const isAdmin = groupData.members.some(
      member => member.id === userId && member.role === 'admin'
    );
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can add members'
      });
    }
    
    // Check if the member is already in the group
    const isMember = groupData.members.some(member => member.id === memberId);
    
    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this group'
      });
    }
    
    const newMember = {
      id: memberId,
      role: role || 'member',
      joinedAt: new Date().toISOString()
    };
    
    const updatedMembers = [...groupData.members, newMember];
    
    await db.collection('familyGroups').doc(groupId).update({
      members: updatedMembers
    });
    
    return res.status(200).json({
      success: true,
      message: 'Member added to family group successfully',
      member: newMember
    });
  } catch (error) {
    console.error('Error adding group member:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding group member',
      error: error.message
    });
  }
};

// Remove a member from a family group
const removeGroupMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.uid;
    
    const groupDoc = await db.collection('familyGroups').doc(groupId).get();
    
    if (!groupDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Family group not found'
      });
    }
    
    const groupData = groupDoc.data();
    
    // Check if the user is an admin of this group or the member themselves
    const isAdmin = groupData.members.some(
      member => member.id === userId && member.role === 'admin'
    );
    
    if (!isAdmin && userId !== memberId) {
      return res.status(403).json({
        success: false,
        message: 'Only group admins or the member themselves can remove a member'
      });
    }
    
    // Check if trying to remove the last admin
    if (memberId === userId && isAdmin) {
      const adminCount = groupData.members.filter(member => member.role === 'admin').length;
      
      if (adminCount === 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the last admin from the group'
        });
      }
    }
    
    const updatedMembers = groupData.members.filter(member => member.id !== memberId);
    
    await db.collection('familyGroups').doc(groupId).update({
      members: updatedMembers
    });
    
    return res.status(200).json({
      success: true,
      message: 'Member removed from family group successfully'
    });
  } catch (error) {
    console.error('Error removing group member:', error);
    return res.status(500).json({
      success: false,
      message: 'Error removing group member',
      error: error.message
    });
  }
};

// Update a member's role in a family group
const updateMemberRole = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user.uid;
    
    if (!role || !['admin', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }
    
    const groupDoc = await db.collection('familyGroups').doc(groupId).get();
    
    if (!groupDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Family group not found'
      });
    }
    
    const groupData = groupDoc.data();
    
    // Check if the user is an admin of this group
    const isAdmin = groupData.members.some(
      member => member.id === userId && member.role === 'admin'
    );
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can update member roles'
      });
    }
    
    // Check if trying to downgrade the last admin
    if (role === 'member' && memberId !== userId) {
      const adminCount = groupData.members.filter(member => member.role === 'admin').length;
      const memberToUpdate = groupData.members.find(member => member.id === memberId);
      
      if (adminCount === 1 && memberToUpdate && memberToUpdate.role === 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Cannot downgrade the last admin of the group'
        });
      }
    }
    
    const updatedMembers = groupData.members.map(member => {
      if (member.id === memberId) {
        return { ...member, role };
      }
      return member;
    });
    
    await db.collection('familyGroups').doc(groupId).update({
      members: updatedMembers
    });
    
    return res.status(200).json({
      success: true,
      message: 'Member role updated successfully'
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating member role',
      error: error.message
    });
  }
};

module.exports = {
  createFamilyGroup,
  getFamilyGroups,
  getFamilyGroup,
  updateFamilyGroup,
  deleteFamilyGroup,
  addGroupMember,
  removeGroupMember,
  updateMemberRole
};