const admin = require("../config/database");
const Person = require("../entities/Person");

const db = admin.firestore();
const collection = db.collection("persons");
const FieldValue = admin.firestore.FieldValue;

exports.createPerson = async (treeId, personData) => {
  const { firstName, middleName, lastName, birthDate, birthPlace, gender, status, relationships = [] } = personData;

  //   const birthDateObj = new Date(birthDate);
  //   if (isNaN(birthDateObj.getTime())) {
  //     return null;
  //   }

  const person = new Person(treeId, firstName, middleName, lastName, birthDate, birthPlace, gender, status, relationships);

  const docRef = await collection.add({ ...person });
  return { personId: docRef.id, ...person };
};

exports.createPersonSelf = async (treeId, uid, personData) => {
  const { firstName, middleName, lastName, birthDate, birthPlace, gender, status, relationships = [] } = personData;
  //   const birthDateObj = new Date(birthDate);
  //   if (isNaN(birthDateObj.getTime())) {
  //     console.error("Invalid birthDate provided:", birthDate);
  //     return null;
  //   }
  const person = new Person(treeId, firstName, middleName, lastName, birthDate, birthPlace, gender, status, relationships);
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
