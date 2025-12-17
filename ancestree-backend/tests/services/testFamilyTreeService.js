const admin = require("firebase-admin");
const db = admin.firestore();

const familyTreesCollection = db.collection("testFamilyTrees");
const personsCollection = db.collection("testPersons");


exports.createFamilyTree = async (userId, treeName) => {
  const familyTree = {
    ownerId: userId,
    name: treeName,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  const docRef = await familyTreesCollection.add(familyTree);
  return docRef.id;
};


exports.createPerson = async (treeId, personData) => {
  const person = {
    treeId,
    firstName: personData.firstName,
    lastName: personData.lastName,
    gender: personData.gender || null,
    birthDate: personData.birthDate || null,
    deathDate: personData.deathDate || null,
    parents: [],
    spouses: [],
    children: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  const docRef = await personsCollection.add(person);
  return docRef.id;
};


exports.getFamilyTreeChart = async (treeId) => {
  const snapshot = await personsCollection
    .where("treeId", "==", treeId)
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();

    return {
      id: doc.id,
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        birthDate: data.birthDate,
        deathDate: data.deathDate
      },
      rels: {
        parents: data.parents || [],
        spouses: data.spouses || [],
        children: data.children || []
      }
    };
  });
};


exports.addParentChild = async (parentId, childId) => {
  const parentRef = personsCollection.doc(parentId);
  const childRef = personsCollection.doc(childId);

  await db.runTransaction(async (tx) => {
    const parentSnap = await tx.get(parentRef);
    const childSnap = await tx.get(childRef);

    if (!parentSnap.exists || !childSnap.exists) {
      throw new Error("Person not found");
    }

    tx.update(parentRef, {
      children: admin.firestore.FieldValue.arrayUnion(childId)
    });

    tx.update(childRef, {
      parents: admin.firestore.FieldValue.arrayUnion(parentId)
    });
  });
};


exports.addSpouse = async (personAId, personBId) => {
  const personARef = personsCollection.doc(personAId);
  const personBRef = personsCollection.doc(personBId);

  await db.runTransaction(async (tx) => {
    const aSnap = await tx.get(personARef);
    const bSnap = await tx.get(personBRef);

    if (!aSnap.exists || !bSnap.exists) {
      throw new Error("Person not found");
    }

    tx.update(personARef, {
      spouses: admin.firestore.FieldValue.arrayUnion(personBId)
    });

    tx.update(personBRef, {
      spouses: admin.firestore.FieldValue.arrayUnion(personAId)
    });
  });
};
