const admin = require("../config/database");
const Person = require("../entities/Person");

const db = admin.firestore();
const collection = db.collection("persons");
const FieldValue = admin.firestore.FieldValue;

exports.createPerson = async (treeId, personData) => {
  const { firstName, middleName, lastName, birthDate, birthPlace, gender, status, relationships = [], dateOfDeath, placeOfDeath } = personData;

  //   const birthDateObj = new Date(birthDate);
  //   if (isNaN(birthDateObj.getTime())) {
  //     return null;
  //   }

  const person = new Person(treeId, firstName, middleName, lastName, birthDate, birthPlace, gender, status, relationships, [], dateOfDeath, placeOfDeath);

  const docRef = await collection.add({ ...person });
  return { personId: docRef.id, ...person };
};

exports.createPersonSelf = async (treeId, uid, personData) => {
  const { firstName, middleName, lastName, birthDate, birthPlace, gender, status, relationships = [], dateOfDeath, placeOfDeath } = personData;
  
  const person = new Person(treeId, firstName, middleName, lastName, birthDate, birthPlace, gender, status, relationships, [], dateOfDeath, placeOfDeath);
  await collection.doc(uid).set({ ...person });
  return { personId: uid, ...person };
};

exports.getPersonById = async (personId) => {
  const doc = await collection.doc(personId).get();
  if (!doc.exists) {
    return null;
  }
  return { personId: doc.id, ...doc.data() };
};

exports.getPeopleByTreeId = async (treeId) => {
  const snapshot = await collection.where("treeId", "==", treeId).get();
  return snapshot.docs.map((doc) => ({ personId: doc.id, ...doc.data() }));
};

/**
 * Gets all people who belong to a specific group tree
 * This includes people whose groupTreeIds array contains the specified treeId
 * OR whose treeId equals the specified treeId (for group trees)
 */
exports.getPeopleByGroupTreeId = async (groupTreeId) => {
  // Get people who have this group tree in their groupTreeIds array
  const groupMembersSnapshot = await collection.where("groupTreeIds", "array-contains", groupTreeId).get();
  const groupMembers = groupMembersSnapshot.docs.map((doc) => ({ personId: doc.id, ...doc.data() }));
  
  // Also get people whose main treeId is this group tree (for people created directly in the group)
  const directMembersSnapshot = await collection.where("treeId", "==", groupTreeId).get();
  const directMembers = directMembersSnapshot.docs.map((doc) => ({ personId: doc.id, ...doc.data() }));
  
  // Combine and deduplicate
  const allMembers = [...groupMembers];
  directMembers.forEach(directMember => {
    if (!allMembers.find(member => member.personId === directMember.personId)) {
      allMembers.push(directMember);
    }
  });
  
  return allMembers;
};

exports.updatePerson = async (personId, data) => {
  const updateData = { ...data };

  const docRef = collection.doc(personId);
  const existingDoc = await docRef.get();

  if (!existingDoc.exists) {
    return null;
  }

  if (updateData.relationships && Array.isArray(updateData.relationships)) {
    await docRef.update({
      relationships: FieldValue.arrayUnion(...updateData.relationships),
    });

    delete updateData.relationships;
  }

  if (updateData.groupTreeIds && Array.isArray(updateData.groupTreeIds)) {
    // For groupTreeIds, we replace the entire array instead of union
    // This allows both adding and removing group trees
    await docRef.update({
      groupTreeIds: updateData.groupTreeIds,
    });

    delete updateData.groupTreeIds;
  }

  if (Object.keys(updateData).length > 0) {
    await docRef.update(updateData);
  }

  const updatedDoc = await docRef.get();

  return { personId: updatedDoc.id, ...updatedDoc.data() };
};

exports.deleteRelationshipFromPerson = async (personId, relationshipToDelete) => {
  const docRef = collection.doc(personId);
  const existingDoc = await docRef.get();

  if (!existingDoc.exists) {
    return null;
  }

  await docRef.update({
    relationships: FieldValue.arrayRemove(relationshipToDelete),
  });

  const updatedDoc = await docRef.get();
  return { personId: updatedDoc.id, ...updatedDoc.data() };
};

exports.deletePerson = async (personId) => {
  await collection.doc(personId).delete();
  return { success: true };
};

