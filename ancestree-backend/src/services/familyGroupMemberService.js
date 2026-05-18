const admin = require('../config/database');
const FamilyGroupMember = require('../entities/FamilyGroupMember');
const db = admin.firestore();

const collection = db.collection('familyGroupMembers');

exports.addMember = async (groupId, userId, role = 'Member', status = 'pending') => {
  const allowedRoles = ['Host', 'Editor', 'Member'];
  if (!allowedRoles.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  const member = new FamilyGroupMember(groupId, userId, role, status);
  const docRef = await collection.add(member.toJSON());
  return docRef.id;
};

exports.getMembersByGroup = async (groupId) => {
  const snapshot = await collection.where('groupId', '==', groupId).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

exports.getMemberByGroupAndUser = async (groupId, userId) => {
  const snapshot = await collection
    .where('groupId', '==', groupId)
    .where('userId', '==', userId)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

exports.updateMemberStatus = async (memberId, status) => {
  await collection.doc(memberId).update({ status });
};

exports.removeMember = async (memberId) => {
  await collection.doc(memberId).delete();
};