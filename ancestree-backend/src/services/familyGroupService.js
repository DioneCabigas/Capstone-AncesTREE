const admin = require('../config/database');
const FamilyGroup = require('../entities/familyGroup');
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
  const snapshot = await collection.where('userId', '==', userId).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

exports.updateGroupDescription = async (groupId, description) => {
  const docRef = collection.doc(groupId);
  await docRef.update({ description });
};

exports.deleteGroup = async (groupId) => {
  await collection.doc(groupId).delete();
};