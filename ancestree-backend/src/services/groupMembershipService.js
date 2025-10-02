const personService = require('./personService');
const userService = require('./userService');

/**
 * Adds the user as a single node to a new group tree (when creating a group)
 * @param {string} userId - The user creating the group
 * @param {string} groupTreeId - The ID of the new group tree
 * @returns {Promise<Object>} - Result of the operation
 */
exports.addUserToNewGroupTree = async (userId, groupTreeId) => {
  try {
    console.log(`Adding user ${userId} as node to new group tree ${groupTreeId}`);
    
    // Get user's existing person record to update their groupTreeIds
    const userPersonRecord = await personService.getPersonById(userId);
    if (!userPersonRecord) {
      console.log(`No user person record found for ${userId}`);
      return { success: false, message: 'User person record not found' };
    }
    
    // Update the user's person record to include this group tree
    const currentGroupTreeIds = userPersonRecord.groupTreeIds || [];
    const updatedGroupTreeIds = currentGroupTreeIds.includes(groupTreeId) 
      ? currentGroupTreeIds 
      : [...currentGroupTreeIds, groupTreeId];
    
    const updatedPerson = await personService.updatePerson(userId, {
      groupTreeIds: updatedGroupTreeIds // Add this group tree to their list, keep original treeId
    });
    
    console.log(`Updated user ${userId} to include group tree ${groupTreeId}`);
    
    return {
      success: true,
      groupTreeId,
      message: `Successfully added user ${userId} to group tree ${groupTreeId}`
    };

  } catch (error) {
    console.error('Error adding user to group tree:', error);
    throw error;
  }
};

/**
 * Adds a user to an existing group tree (when joining, not creating)
 * This only adds the user themselves as a single node
 * @param {string} userId - The user joining the group
 * @param {string} groupTreeId - The ID of the group tree they're joining
 * @returns {Promise<Object>} - Result of the join operation
 */
exports.addUserToGroupTree = async (userId, groupTreeId) => {
  try {
    console.log(`Adding user ${userId} to existing group tree ${groupTreeId}`);
    
    // Check if user is already part of this group tree
    const userPerson = await personService.getPersonById(userId);
    if (!userPerson) {
      console.log(`No user person record found for ${userId}`);
      return { success: false, message: 'User person record not found' };
    }
    
    if (userPerson.groupTreeIds && userPerson.groupTreeIds.includes(groupTreeId)) {
      console.log(`User ${userId} already part of group tree ${groupTreeId}`);
      return { success: true, message: 'User already in group tree' };
    }

    // Add the group tree to user's groupTreeIds
    const currentGroupTreeIds = userPerson.groupTreeIds || [];
    const updatedGroupTreeIds = [...currentGroupTreeIds, groupTreeId];

    await personService.updatePerson(userId, {
      groupTreeIds: updatedGroupTreeIds
    });

    console.log(`Added user ${userId} to group tree ${groupTreeId}`);
    return {
      success: true,
      message: `User ${userId} added to group tree ${groupTreeId}`,
      groupTreeId
    };

  } catch (error) {
    console.error('Error adding user to group tree:', error);
    throw error;
  }
};

/**
 * Removes a user from a group tree (individual member removal)
 * @param {string} userId - The user to remove from the group
 * @param {string} groupTreeId - The group tree ID to remove from
 * @returns {Promise<Object>} - Result of the removal
 */
exports.removeUserFromGroupTree = async (userId, groupTreeId) => {
  try {
    console.log(`Removing user ${userId} from group tree ${groupTreeId}`);
    
    const userPerson = await personService.getPersonById(userId);
    if (!userPerson) {
      console.log(`No user person record found for ${userId}`);
      return { success: false, message: 'User person record not found' };
    }
    
    const currentGroupTreeIds = userPerson.groupTreeIds || [];
    if (!currentGroupTreeIds.includes(groupTreeId)) {
      console.log(`User ${userId} is not in group tree ${groupTreeId}`);
      return { success: true, message: 'User not in group tree' };
    }

    // Remove the group tree from user's groupTreeIds
    const updatedGroupTreeIds = currentGroupTreeIds.filter(id => id !== groupTreeId);

    await personService.updatePerson(userId, {
      groupTreeIds: updatedGroupTreeIds
    });

    console.log(`Removed user ${userId} from group tree ${groupTreeId}`);
    return {
      success: true,
      message: `User ${userId} removed from group tree ${groupTreeId}`,
      groupTreeId
    };

  } catch (error) {
    console.error('Error removing user from group tree:', error);
    throw error;
  }
};
