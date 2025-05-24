const admin = require('../config/database');
const FamilyGroup = require('../entities/familyGroup');
const db = admin.firestore();

const collection = db.collection('familyGroups');

exports.createGroup = async (userId, treeId, name, description) => {
  const group = new FamilyGroup(userId, treeId, name, description);
  const docRef = await collection.add({ ...group });
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

exports.deleteGroup = async (groupId) => {
  await collection.doc(groupId).delete();
};
