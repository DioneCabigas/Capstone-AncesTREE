const admin = require('../config/database');
const FamilyGroup = require('../entities/FamilyGroup');
const db = admin.firestore();
const familyTreeService = require('./familyTreeService');
const userService = require('./userService');

const collection = db.collection('familyGroups');

exports.createGroup = async (userId, treeId, name, description) => {
  const userData = await userService.getUser(userId);
  const treeName = "group-" + name;
  const personData = {
    firstName: userData?.firstName || 'User',
    lastName: userData?.lastName || 'Name',
    birthDate: userData?.birthDate || '',
    birthPlace: userData?.birthPlace || '',
    gender: userData?.gender || ''
  };
  
  // Create the empty group tree first (without overwriting user's personal data)
  const newTreeId = await familyTreeService.createFamilyTree(userId, treeName);

  // Add the user as a single node to the new group tree
  const groupMembershipService = require('./groupMembershipService');
  try {
    const addResult = await groupMembershipService.addUserToNewGroupTree(userId, newTreeId);
    console.log(`Add user to group result: ${addResult.message}`);
  } catch (addError) {
    console.warn(`Failed to add user to group tree: ${addError.message}`);
    // Continue with group creation even if adding user fails
  }

  const group = new FamilyGroup(userId, newTreeId, name, description);
  const docRef = await collection.add(group.toJSON());

  return docRef.id;
};

exports.getGroupById = async (groupId) => {
  if (!groupId || typeof groupId !== 'string' || groupId.trim() === '') {
    throw new Error('Invalid group ID: Group ID must be a non-empty string');
  }
  const doc = await collection.doc(groupId).get();
  if (!doc.exists) throw new Error('Group not found');
  return { id: doc.id, ...doc.data() };
};

exports.getFamilyGroupById = async (groupId) => {
  if (!groupId || typeof groupId !== 'string' || groupId.trim() === '') {
    console.error(`Invalid groupId provided to getFamilyGroupById: ${groupId}`);
    return null;
  }
  const doc = await collection.doc(groupId).get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...doc.data() };
};

exports.getGroupsByUser = async (userId) => {
  // Get groups created by the user
  const createdGroupsSnapshot = await collection.where('userId', '==', userId).get();
  const createdGroups = createdGroupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Get groups where the user is a member
  const memberCollection = db.collection('familyGroupMembers');
  const membershipSnapshot = await memberCollection.where('userId', '==', userId).get();
  
  const memberGroupIds = membershipSnapshot.docs.map(doc => doc.data().groupId);
  
  // Get the full group data for groups where user is a member
  const memberGroups = [];
  for (const groupId of memberGroupIds) {
    try {
      const groupDoc = await collection.doc(groupId).get();
      if (groupDoc.exists) {
        const groupData = { id: groupDoc.id, ...groupDoc.data() };
        // Only add if not already in createdGroups
        if (!createdGroups.some(group => group.id === groupData.id)) {
          memberGroups.push(groupData);
        }
      }
    } catch (error) {
      console.warn(`Could not fetch group ${groupId}:`, error);
    }
  }
  
  // Combine and return all groups (created + member of)
  return [...createdGroups, ...memberGroups];
};

exports.updateGroupDescription = async (groupId, description) => {
  if (!groupId || typeof groupId !== 'string' || groupId.trim() === '') {
    throw new Error('Invalid group ID: Group ID must be a non-empty string');
  }
  const docRef = collection.doc(groupId);
  await docRef.update({ description });
};

/**
 * Removes a user from a group by removing the group tree ID from their groupTreeIds
 * @param {string} userId - The user to remove from the group
 * @param {string} groupTreeId - The group tree ID to remove
 * @returns {Promise<Object>} - Result of the removal
 */
exports.removeUserFromGroup = async (userId, groupTreeId) => {
  const personService = require('./personService');
  
  try {
    const userPerson = await personService.getPersonById(userId);
    if (!userPerson) {
      return { success: false, message: 'User not found' };
    }

    const currentGroupTreeIds = userPerson.groupTreeIds || [];
    const updatedGroupTreeIds = currentGroupTreeIds.filter(id => id !== groupTreeId);

    await personService.updatePerson(userId, {
      groupTreeIds: updatedGroupTreeIds
    });

    console.log(`Removed user ${userId} from group tree ${groupTreeId}`);
    return {
      success: true,
      message: `User ${userId} removed from group tree ${groupTreeId}`
    };
  } catch (error) {
    console.error('Error removing user from group:', error);
    throw error;
  }
};

/**
 * Removes all members from a group and cleans up the group tree
 * @param {string} groupId - The group ID
 * @returns {Promise<Object>} - Result of the cleanup
 */
exports.removeAllMembersAndCleanup = async (groupId) => {
  const personService = require('./personService');
  
  try {
    // Validate groupId
    if (!groupId || typeof groupId !== 'string' || groupId.trim() === '') {
      console.error(`Invalid groupId provided to removeAllMembersAndCleanup: ${groupId}`);
      return { success: false, message: 'Invalid group ID' };
    }
    
    // Get the group to find its tree ID
    const group = await exports.getFamilyGroupById(groupId);
    if (!group) {
      return { success: false, message: 'Group not found' };
    }

    const groupTreeId = group.treeId;
    console.log(`Cleaning up group tree: ${groupTreeId}`);

    // Get all people in this group tree
    const groupMembers = await personService.getPeopleByGroupTreeId(groupTreeId);
    console.log(`Found ${groupMembers.length} members in group`);

    let removedMembers = 0;
    let deletedPersons = 0;

    // Process each member
    for (const member of groupMembers) {
      if (member.treeId === groupTreeId) {
        // This person was created directly in the group tree, delete them entirely
        await personService.deletePerson(member.personId);
        deletedPersons++;
        console.log(`Deleted person ${member.personId} (created directly in group)`);
      } else {
        // This person has a personal tree, just remove the group tree from their groupTreeIds
        const currentGroupTreeIds = member.groupTreeIds || [];
        const updatedGroupTreeIds = currentGroupTreeIds.filter(id => id !== groupTreeId);
        
        await personService.updatePerson(member.personId, {
          groupTreeIds: updatedGroupTreeIds
        });
        removedMembers++;
        console.log(`Removed group tree from person ${member.personId}`);
      }
    }

    // Delete the group tree itself
    try {
      await familyTreeService.deleteFamilyTree(groupTreeId);
      console.log(`Deleted group tree ${groupTreeId}`);
    } catch (treeError) {
      console.warn(`Could not delete group tree ${groupTreeId}:`, treeError.message);
    }

    return {
      success: true,
      removedMembers,
      deletedPersons,
      groupTreeId,
      message: `Removed ${removedMembers} members and deleted ${deletedPersons} persons from group tree`
    };

  } catch (error) {
    console.error('Error removing all members from group:', error);
    throw error;
  }
};

/**
 * Deletes a group after removing all members and cleaning up the group tree
 * @param {string} groupId - The group ID to delete
 * @returns {Promise<Object>} - Result of the deletion
 */
exports.deleteGroup = async (groupId) => {
  try {
    // Validate groupId
    if (!groupId || typeof groupId !== 'string' || groupId.trim() === '') {
      console.error(`Invalid groupId provided: ${groupId}`);
      throw new Error('Invalid group ID: Group ID must be a non-empty string');
    }
    
    console.log(`Starting group deletion process for group ${groupId}`);
    
    // First, remove all members and clean up the group tree
    const cleanupResult = await exports.removeAllMembersAndCleanup(groupId);
    console.log(`Cleanup result:`, cleanupResult);

    // Check if cleanup was successful (group exists)
    if (!cleanupResult.success) {
      throw new Error(cleanupResult.message || 'Failed to clean up group');
    }

    // Then delete the group document
    await collection.doc(groupId).delete();
    console.log(`Deleted group document ${groupId}`);

    return {
      success: true,
      message: `Group ${groupId} and all associated data deleted successfully`,
      cleanup: cleanupResult
    };

  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
};

exports.getGroupByTreeId = async (treeId) => {
  const snapshot = await collection.where('treeId', '==', treeId).get();
  if (snapshot.empty) {
    return null;
  }
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};
