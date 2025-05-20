const connectionService = require('../services/connectionService');

exports.sendConnectionRequest = async (req, res) => {
  const { requester, receiver } = req.body;

  if (!requester || !receiver) {
    return res.status(400).json({ message: 'Both current user and another user are required.' });
  }

  try {
    const id = await connectionService.createConnection(requester, receiver);
    res.status(200).json({ message: 'Connection request sent.', id });
  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({ message: 'Failed to send connection request.' });
  }
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

exports.getPendingRequests = async (req, res) => {
  const { uid } = req.params;

  try {
    const pending = await connectionService.getPendingRequests(uid);
    res.status(200).json(pending);
  } catch (error) {
    console.error('Error getting pending requests:', error);
    res.status(500).json({ message: 'Failed to retrieve pending requests.' });
  }
};

exports.updateConnectionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await connectionService.updateConnectionStatus(id, status);
    res.status(200).json({ message: 'Connection status updated.' });
  } catch (error) {
    console.error('Error updating connection status:', error);
    res.status(500).json({ message: 'Failed to update status.' });
  }
};

exports.deleteConnection = async (req, res) => {
  const { id } = req.params;

  try {
    await connectionService.deleteConnection(id);
    res.status(200).json({ message: 'Connection deleted.' });
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({ message: 'Failed to delete connection.' });
  }
};