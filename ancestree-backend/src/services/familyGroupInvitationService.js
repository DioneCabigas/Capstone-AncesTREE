const admin = require('firebase-admin');
const db = admin.firestore();
const FamilyGroupInvitation = require('../entities/FamilyGroupInvitation');

const INVITES_COLLECTION = 'groupInvitations';
const MEMBERS_COLLECTION = 'familyGroupMembers';

exports.sendInvitation = async (groupId, senderId, receiverId) => {
  const existing = await db
    .collection(INVITES_COLLECTION)
    .where('groupId', '==', groupId)
    .where('receiverId', '==', receiverId)
    .where('status', '==', 'pending')
    .get();

  if (!existing.empty) {
    const err = new Error('User already has a pending invitation.');
    err.statusCode = 409;
    throw err;
  }

  const invitation = new FamilyGroupInvitation(groupId, senderId, receiverId);
  const invitationData = invitation.toJSON();

  await db.collection(INVITES_COLLECTION).add(invitationData);

  return 'Invitation sent successfully.';
};

exports.acceptInvitation = async (invitationId) => {
  const inviteRef = db.collection(INVITES_COLLECTION).doc(invitationId);
  const inviteSnap = await inviteRef.get();

  if (!inviteSnap.exists) {
    const err = new Error('Invitation not found.');
    err.statusCode = 404;
    throw err;
  }

  const invite = inviteSnap.data();

  // Add user to group members
  await db.collection(MEMBERS_COLLECTION).add({
    groupId: invite.groupId,
    userId: invite.receiverId,
    role: 'Member',
    addedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update invite status
  await inviteRef.update({ status: 'accepted' });

  return 'Invitation accepted and user added to group.';
};

exports.rejectInvitation = async (invitationId) => {
  const inviteRef = db.collection(INVITES_COLLECTION).doc(invitationId);
  const inviteSnap = await inviteRef.get();

  if (!inviteSnap.exists) {
    const err = new Error('Invitation not found.');
    err.statusCode = 404;
    throw err;
  }

  await inviteRef.update({ status: 'rejected' });

  return 'Invitation rejected.';
};

exports.getUserInvitations = async (userId) => {
  try {
    const snapshot = await db.collection('groupInvitations')
      .where('receiverId', '==', userId)
      .where('status', '==', 'pending')
      .get();

    const invitations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return invitations;
  } catch (err) {
    console.error('Error in getUserInvitations service:', err);
    throw err;
  }
};