const admin = require("../config/database");
const FamilyTree = require("../entities/FamilyTree");
const db = admin.firestore();

const collection = db.collection("familyTrees");
const personsCollection = db.collection("persons");

// Create Family tree only without creating first person in the tree
exports.createFamilyTree = async (userId, treeName) => {
  const familyTree = new FamilyTree(userId, treeName);
  const docRef = await collection.add({ ...familyTree });
  return docRef.id;
};

// Creates first person as well
exports.createNewFamilyTree = async (userId, treeName, person) => {
  const familyTree = new FamilyTree(userId, treeName);
  const docRef = await collection.add({ ...familyTree });
  return docRef.id;
};

exports.getFamilyTreeById = async (treeId) => {
  const doc = await collection.doc(treeId).get();
  if (!doc.exists) {
    return null;
  }
  return { treeId: doc.id, ...doc.data() };
};

exports.getAllFamilyTrees = async () => {
  const snapshot = await collection.get();
  return snapshot.docs.map((doc) => ({
    treeId: doc.id,
    ...doc.data(),
  }));
};

exports.updateFamilyTree = async (treeId, data) => {
  const updatedData = { ...data };

  if (updatedData.createdAt) {
    delete updatedData.createdAt;
  }
  if (updatedData.userId) {
    delete updatedData.userId;
  }
  await collection.doc(treeId).update(updatedData);
  const updatedDoc = await collection.doc(treeId).get();
  return {
    treeId: updatedDoc.id,
    ...updatedDoc.data(),
  };
};

// SINGLE DELETE TREE DOCUMENT
// exports.deleteFamilyTree = async (treeId) => {
//   await collection.doc(treeId).delete();
//   return { success: true, message: "Family tree deleted successfully." };
// };

// BATCH DELETE TREE AND PERSONS IN THE TREE
exports.deleteFamilyTree = async (treeId) => {
  const batch = db.batch();

  const treeRef = collection.doc(treeId);
  const treeDoc = await treeRef.get();

  if (!treeDoc.exists) {
    return null;
  }
  batch.delete(treeRef);

  const personsQuerySnapshot = await personsCollection.where("treeId", "==", treeId).get();

  personsQuerySnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  return { success: true, message: "Family tree and all related persons deleted successfully." };
};

exports.getPersonalTree = async (userId) => {
  // Create a query to find the personal tree
  const snapshot = await collection
    .where("userId", "==", userId) // Filter by the user's ID
    .where("treeName", "==", userId) // Filter where treeName is also the user's ID
    .where("sharedUsers", "==", []) // Filter where sharedUsers array is empty
    .limit(1) // Assuming there should only be one personal tree per user
    .get();

  if (snapshot.empty) {
    return null; // No personal tree found
  }

  // Return the first (and should be only) personal tree found
  const doc = snapshot.docs[0];
  return { treeId: doc.id, ...doc.data() };
};
