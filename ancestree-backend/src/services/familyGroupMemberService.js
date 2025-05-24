const admin = require('../config/database');
const FamilyGroupMember = require('../entities/FamilyGroupMember');
const db = admin.firestore();

const collection = db.collection('familyGroupMembers');

exports.addMember = async (groupId, userId, role, status) => {
  const member = new FamilyGroupMember(groupId, userId, role, status);
  const docRef = await collection.add({ ...member });
  return docRef.id;
};

exports.getMembersByGroup = async (groupId) => {
  const snapshot = await collection.where('groupId', '==', groupId).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

exports.updateMemberStatus = async (memberId, status) => {
  await collection.doc(memberId).update({ status });
};

exports.removeMember = async (memberId) => {
  await collection.doc(memberId).delete();
};
