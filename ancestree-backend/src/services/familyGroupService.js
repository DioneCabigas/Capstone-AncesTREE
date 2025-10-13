const admin = require("../config/database");
const FamilyGroup = require("../entities/FamilyGroup");
const db = admin.firestore();
const familyTreeService = require("./familyTreeService");
const userService = require("./userService");

const collection = db.collection("familyGroups");

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
  if (!doc.exists) throw new Error("Group not found");
  return { id: doc.id, ...doc.data() };
};

exports.getGroupsByUser = async (userId) => {
  // Get groups created by the user
  const createdGroupsSnapshot = await collection.where("userId", "==", userId).get();
  const createdGroups = createdGroupsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // Get groups where the user is a member
  const memberCollection = db.collection("familyGroupMembers");
  const membershipSnapshot = await memberCollection.where("userId", "==", userId).get();

  const memberGroupIds = membershipSnapshot.docs.map((doc) => doc.data().groupId);

  // Get the full group data for groups where user is a member
  const memberGroups = [];
  for (const groupId of memberGroupIds) {
    try {
      const groupDoc = await collection.doc(groupId).get();
      if (groupDoc.exists) {
        const groupData = { id: groupDoc.id, ...groupDoc.data() };
        // Only add if not already in createdGroups
        if (!createdGroups.some((group) => group.id === groupData.id)) {
          memberGroups.push(groupData);
        }
      }
    } catch (error) {
      console.warn(`Could not fetch group ${groupId}:`, error);
    }
  }

  // Combine and return all groups (created + member of)
  return [...createdGroups, ...memberGroups];
};

exports.updateGroupDescription = async (groupId, description) => {
  const docRef = collection.doc(groupId);
  await docRef.update({ description });
};

// exports.deleteGroup = async (groupId) => {
//   await collection.doc(groupId).delete();
// };

exports.deleteGroup = async (groupId) => {
  try {
    // Get group details (to find its treeId)
    const groupDoc = await collection.doc(groupId).get();
    if (!groupDoc.exists) {
      throw new Error("Group not found");
    }

    const groupData = groupDoc.data();
    const treeId = groupData.treeId;

    // 1️⃣ Delete all members of this group
    const membersSnapshot = await db.collection("familyGroupMembers").where("groupId", "==", groupId).get();

    if (!membersSnapshot.empty) {
      const batch = db.batch();
      membersSnapshot.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      console.log(`Deleted ${membersSnapshot.size} member(s) from group ${groupId}`);
    }

    // 2️⃣ Delete the associated family tree (if it exists)
    if (treeId) {
      try {
        await familyTreeService.deleteFamilyTree(treeId);
        console.log(`Deleted tree ${treeId} associated with group ${groupId}`);
      } catch (err) {
        console.error("Failed to delete family tree:", err);
      }
    }

    // 3️⃣ Delete the group document itself
    await collection.doc(groupId).delete();
    console.log(`Deleted group ${groupId}`);

    return { message: "Group, members, and associated tree deleted successfully." };
  } catch (error) {
    console.error("Error deleting group:", error);
    throw error;
  }
};

exports.leaveGroup = async (groupId, userId) => {
  const groupRef = db.collection('familyGroups').doc(groupId);
  const groupDoc = await groupRef.get();

  if (!groupDoc.exists) {
    throw new Error('Group not found');
  }

  const groupData = groupDoc.data();
  const membersRef = db.collection('familyGroupMembers');

  // ✅ Get all members of this group
  const membersSnapshot = await membersRef.where('groupId', '==', groupId).get();

  if (membersSnapshot.empty) {
    // If no members, delete the group entirely
    await exports.deleteGroup(groupId);
    return { message: 'Group deleted because no members were found.' };
  }

  // 🧩 If the owner is leaving
  if (groupData.ownerId === userId) {
    const otherMembers = membersSnapshot.docs.filter(doc => doc.data().userId !== userId);

    if (otherMembers.length > 0) {
      // Automatically assign ownership to the first other member
      const newOwnerId = otherMembers[0].data().userId;
      await groupRef.update({
        ownerId: newOwnerId,
        userId: newOwnerId // ✅ keep consistency with getGroupsByUser()
      });
      console.log(`Transferred ownership of group ${groupId} to ${newOwnerId}`);
    } else {
      // No other members — delete group and its tree
      await exports.deleteGroup(groupId);
      return { message: 'Group deleted because the owner was the last member.' };
    }
  }

  // ✅ Remove the member (owner or regular)
  const memberSnapshot = await membersRef
    .where('groupId', '==', groupId)
    .where('userId', '==', userId)
    .get();

  if (memberSnapshot.empty) {
    throw new Error('You are not a member of this group.');
  }

  const batch = db.batch();
  memberSnapshot.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  // ✅ NEW: Delete the group if no members remain
  const remainingMembersSnapshot = await membersRef.where('groupId', '==', groupId).get();
  if (remainingMembersSnapshot.empty) {
    await exports.deleteGroup(groupId);
    return { message: 'Group deleted because no members were left.' };
  }

  return { message: 'You have left the group successfully.' };
};

exports.getGroupByTreeId = async (treeId) => {
  const snapshot = await collection.where("treeId", "==", treeId).get();
  if (snapshot.empty) {
    return null;
  }
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};
