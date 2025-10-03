const admin = require('../config/database');
const FamilyGroup = require('../entities/FamilyGroup');
const db = admin.firestore();
const familyTreeService = require('./familyTreeService');
const userService = require('./userService');

const collection = db.collection('familyGroups');

exports.createGroup = async (userId, treeId, name, description) => {
  const userData = await userService.getUser(userId);
  const treeName = "tree-" + name;
  const personData = {
    firstName: userData.firstName,
    lastName: userData.lastName,
  };
  const newTreeId = await familyTreeService.createNewFamilyTree(userId, treeName, personData);

  const group = new FamilyGroup(userId, newTreeId, name, description);
  const docRef = await collection.add(group.toJSON());

  return docRef.id;
};

exports.getGroupById = async (groupId) => {
  const doc = await collection.doc(groupId).get();
  if (!doc.exists) throw new Error('Group not found');
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
  const docRef = collection.doc(groupId);
  await docRef.update({ description });
};

exports.deleteGroup = async (groupId) => {
  await collection.doc(groupId).delete();
};

exports.getGroupByTreeId = async (treeId) => {
  const snapshot = await collection.where('treeId', '==', treeId).get();
  if (snapshot.empty) {
    return null;
  }
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};
