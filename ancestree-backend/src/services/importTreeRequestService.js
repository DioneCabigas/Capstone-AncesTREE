const admin = require('../config/database');
const ImportTreeRequest = require('../entities/ImportTreeRequest');
const personService = require('./personService');

const db = admin.firestore();
const collection = db.collection('importTreeRequests');

exports.createImportRequest = async (groupTreeId, personalTreeId, requestorId, requestorName, preview = {}) => {
  // Check if a pending request already exists
  const existingSnapshot = await collection
    .where('groupTreeId', '==', groupTreeId)
    .where('personalTreeId', '==', personalTreeId)
    .where('requestorId', '==', requestorId)
    .where('status', '==', 'pending')
    .get();

  if (!existingSnapshot.empty) {
    throw new Error('A pending import request already exists for this tree.');
  }

  const importRequest = new ImportTreeRequest(
    groupTreeId,
    personalTreeId,
    requestorId,
    requestorName,
    preview
  );

  const docRef = await collection.add(importRequest.toJSON());
  return { id: docRef.id, ...importRequest.toJSON() };
};

exports.getImportRequestsByGroupTree = async (groupTreeId) => {
  const snapshot = await collection.where('groupTreeId', '==', groupTreeId).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

exports.getPendingImportRequests = async (groupTreeId) => {
  const snapshot = await collection
    .where('groupTreeId', '==', groupTreeId)
    .where('status', '==', 'pending')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

exports.getImportRequestsForUser = async (requestorId) => {
  const snapshot = await collection
    .where('requestorId', '==', requestorId)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

exports.updateImportRequestStatus = async (requestId, status, reviewedBy) => {
  await collection.doc(requestId).update({
    status: status,
    reviewedAt: new Date(),
    reviewedBy: reviewedBy
  });

  const updatedDoc = await collection.doc(requestId).get();
  return { id: updatedDoc.id, ...updatedDoc.data() };
};

exports.getImportRequestById = async (requestId) => {
  const doc = await collection.doc(requestId).get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...doc.data() };
};

exports.deleteImportRequest = async (requestId) => {
  await collection.doc(requestId).delete();
  return { success: true };
};

exports.generateImportPreview = async (personalTreeId) => {
  try {
    const people = await personService.getPeopleByTreeId(personalTreeId);
    return {
      personCount: people.length,
      persons: people.map(p => ({
        personId: p.personId,
        name: `${p.firstName} ${p.lastName || ''}`.trim(),
        birthDate: p.birthDate || null
      }))
    };
  } catch (error) {
    console.error('Error generating preview:', error);
    return { personCount: 0, persons: [] };
  }
};
