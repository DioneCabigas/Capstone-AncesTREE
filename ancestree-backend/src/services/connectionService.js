const admin = require('../config/database');
const Connection = require('../entities/Connections');
const db = admin.firestore();

const collection = db.collection('connections');

exports.createConnection = async (requester, receiver) => {
  const connection = new Connection(requester, receiver);
  const docRef = await collection.add(connection.toJSON());
  return docRef.id;
};

exports.getUserConnections = async (uid) => {
  const requesterSnapshot = await collection
    .where('requester', '==', uid)
    .where('status', '==', 'accepted')
    .get();

  const receiverSnapshot = await collection
    .where('receiver', '==', uid)
    .where('status', '==', 'accepted')
    .get();

  const requesterConnections = requesterSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    connectionWith: doc.data().receiver,
    role: 'requester',
  }));

  const receiverConnections = receiverSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    connectionWith: doc.data().requester,
    role: 'receiver',
  }));

  return [...requesterConnections, ...receiverConnections];
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
