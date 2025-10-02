const admin = require('../config/database');
const MergeRequest = require('../entities/MergeRequest');
const db = admin.firestore();

const collection = db.collection('mergeRequests');

exports.createMergeRequest = async (groupId, requesterId, targetUserId) => {
  // Check if a pending request already exists
  const existingSnapshot = await collection
    .where('groupId', '==', groupId)
    .where('requesterId', '==', requesterId)
    .where('targetUserId', '==', targetUserId)
    .where('status', '==', 'pending')
    .get();

  if (!existingSnapshot.empty) {
    throw new Error('A pending merge request already exists between these users for this group.');
  }

  const mergeRequest = new MergeRequest(groupId, requesterId, targetUserId);
  const docRef = await collection.add(mergeRequest.toJSON());
  return docRef.id;
};

exports.getMergeRequestById = async (requestId) => {
  const doc = await collection.doc(requestId).get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...doc.data() };
};

exports.getMergeRequestsByGroup = async (groupId) => {
  const snapshot = await collection.where('groupId', '==', groupId).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

exports.getPendingMergeRequestsForOwner = async (groupId) => {
  const snapshot = await collection
    .where('groupId', '==', groupId)
    .where('status', '==', 'pending')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

exports.getMergeRequestsForUser = async (userId) => {
  const snapshot = await collection
    .where('requesterId', '==', userId)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

exports.updateMergeRequestStatus = async (requestId, status, reviewedBy) => {
  await collection.doc(requestId).update({
    status: status,
    reviewedAt: new Date(),
    reviewedBy: reviewedBy
  });
};

exports.deleteMergeRequest = async (requestId) => {
  await collection.doc(requestId).delete();
};
