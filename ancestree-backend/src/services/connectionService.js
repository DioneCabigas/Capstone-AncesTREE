const admin = require('../config/database');
const Connection = require('../entities/Connections');
const db = admin.firestore();

const collection = db.collection('connections');

exports.createConnection = async (requester, receiver) => {
  const connection = new Connection(requester, receiver);
  const docRef = await collection.add({ ...connection });
  return docRef.id;
};

exports.getUserConnections = async (uid) => {
  const snapshot = await collection
    .where('requester', '==', uid)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

exports.getPendingRequests = async (uid) => {
  const snapshot = await collection
    .where('receiver', '==', uid)
    .where('status', '==', 'pending')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

exports.updateConnectionStatus = async (connectionId, status) => {
  await collection.doc(connectionId).update({ status });
};

exports.deleteConnection = async (connectionId) => {
  await collection.doc(connectionId).delete();
};
