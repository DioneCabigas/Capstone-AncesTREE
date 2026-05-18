const admin = require("firebase-admin");
const db = admin.firestore();

const familyTreesCollection = db.collection("testFamilyTrees");
const personsCollection = db.collection("testPersons");

exports.createFamilyTree = async (ownerId, treeName) => {
  const ref = await familyTreesCollection.add({
    ownerId,
    treeName,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return ref.id;
};

exports.createPerson = async (treeId, data) => {
  const ref = await personsCollection.add({
    treeId,
    firstName: data.firstName,
    middleName: data.middleName,
    lastName: data.lastName,
    status: data.status,
    gender: data.gender || null,
    birthDate: data.birthDate || null,
    birthPlace: data.birthPlace || null,
    deathDate: data.deathDate || null,
    parents: [],
    spouses: [],
    children: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return ref.id;
};

exports.getPersonsByTreeId = async (treeId) => {
  const snapshot = await personsCollection.where("treeId", "==", treeId).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

exports.findDuplicateCandidates = async (treeId, personData) => {
  const snapshot = await personsCollection
    .where("treeId", "==", treeId)
    .where("lastName", "==", personData.lastName)
    .get();

  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(p => {
      const firstMatch =
        p.firstName.toLowerCase() === personData.firstName.toLowerCase();
      const birthMatch =
        !p.birthDate ||
        !personData.birthDate ||
        p.birthDate === personData.birthDate;
      return firstMatch && birthMatch;
    });
};

const isAncestor = async (descendantId, ancestorId) => {
  const stack = [descendantId];
  const visited = new Set();

  while (stack.length) {
    const current = stack.pop();
    if (visited.has(current)) continue;
    visited.add(current);

    const snap = await personsCollection.doc(current).get();
    if (!snap.exists) continue;

    const parents = snap.data().parents || [];
    if (parents.includes(ancestorId)) return true;

    stack.push(...parents);
  }

  return false;
};

exports.linkExistingPerson = async (treeId, sourceId, targetId, relationship) => {
  if (sourceId === targetId) {
    throw new Error("Cannot link person to themselves");
  }

  const sourceRef = personsCollection.doc(sourceId);
  const targetRef = personsCollection.doc(targetId);

  await db.runTransaction(async (tx) => {
    const sourceSnap = await tx.get(sourceRef);
    const targetSnap = await tx.get(targetRef);

    if (!sourceSnap.exists || !targetSnap.exists) {
      throw new Error("Person not found");
    }

    const source = sourceSnap.data();
    const target = targetSnap.data();

    if (source.treeId !== treeId || target.treeId !== treeId) {
      throw new Error("Persons must belong to the same tree");
    }

    if (relationship === "parent") {
      if ((source.parents || []).length >= 2) {
        throw new Error("A person can only have two parents");
      }

      if (await isAncestor(sourceId, targetId)) {
        throw new Error("Cycle detected");
      }

      tx.update(sourceRef, {
        parents: admin.firestore.FieldValue.arrayUnion(targetId)
      });

      tx.update(targetRef, {
        children: admin.firestore.FieldValue.arrayUnion(sourceId)
      });
    }

    if (relationship === "spouse") {
      if (
        (source.parents || []).includes(targetId) ||
        (source.children || []).includes(targetId)
      ) {
        throw new Error("Invalid spouse relationship");
      }

      tx.update(sourceRef, {
        spouses: admin.firestore.FieldValue.arrayUnion(targetId)
      });

      tx.update(targetRef, {
        spouses: admin.firestore.FieldValue.arrayUnion(sourceId)
      });
    }
  });
};

exports.importPersonalTreeIntoGroupTree = async (groupTreeId, personalTreeId) => {
  const snapshot = await personsCollection
    .where("treeId", "==", personalTreeId)
    .get();

  if (snapshot.empty) return [];

  const idMap = {};
  const importedIds = [];

  for (const doc of snapshot.docs) {
    const p = doc.data();
    const ref = await personsCollection.add({
      treeId: groupTreeId,
      firstName: p.firstName,
      lastName: p.lastName,
      gender: p.gender,
      birthDate: p.birthDate,
      deathDate: p.deathDate,
      parents: [],
      spouses: [],
      children: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    idMap[doc.id] = ref.id;
    importedIds.push(ref.id);
  }

  for (const doc of snapshot.docs) {
    const p = doc.data();
    const newId = idMap[doc.id];

    for (const parentId of p.parents || []) {
      if (idMap[parentId]) {
        await exports.linkExistingPerson(
          groupTreeId,
          newId,
          idMap[parentId],
          "parent"
        );
      }
    }

    for (const spouseId of p.spouses || []) {
      if (idMap[spouseId]) {
        await exports.linkExistingPerson(
          groupTreeId,
          newId,
          idMap[spouseId],
          "spouse"
        );
      }
    }
  }

  return importedIds;
};

exports.getFamilyTreeChart = async (treeId) => {
  const snapshot = await personsCollection.where("treeId", "==", treeId).get();

  return snapshot.docs.map(doc => {
    const p = doc.data();
    return {
      id: doc.id,
      data: {
        firstName: p.firstName,
        lastName: p.lastName,
        gender: p.gender,
        birthDate: p.birthDate,
        deathDate: p.deathDate
      },
      rels: {
        parents: p.parents || [],
        spouses: p.spouses || [],
        children: p.children || []
      }
    };
  });
};

exports.mergePersons = async (treeId, primaryId, secondaryId) => {
  if (primaryId === secondaryId) {
    throw new Error("Cannot merge the same person");
  }

  await db.runTransaction(async (tx) => {
    const primaryRef = personsCollection.doc(primaryId);
    const secondaryRef = personsCollection.doc(secondaryId);

    const primarySnap = await tx.get(primaryRef);
    const secondarySnap = await tx.get(secondaryRef);

    if (!primarySnap.exists || !secondarySnap.exists) {
      throw new Error("Person not found");
    }

    const primary = primarySnap.data();
    const secondary = secondarySnap.data();

    if (primary.treeId !== treeId || secondary.treeId !== treeId) {
      throw new Error("Persons must belong to the same tree");
    }

    const mergedParents = Array.from(
      new Set([...(primary.parents || []), ...(secondary.parents || [])])
    ).slice(0, 2);

    const mergedChildren = Array.from(
      new Set([...(primary.children || []), ...(secondary.children || [])])
    );

    const mergedSpouses = Array.from(
      new Set([...(primary.spouses || []), ...(secondary.spouses || [])])
    );

    tx.update(primaryRef, {
      parents: mergedParents,
      children: mergedChildren,
      spouses: mergedSpouses
    });

    const snapshot = await personsCollection
      .where("treeId", "==", treeId)
      .get();

    snapshot.docs.forEach(doc => {
      const ref = personsCollection.doc(doc.id);
      const data = doc.data();

      if ((data.parents || []).includes(secondaryId)) {
        tx.update(ref, {
          parents: admin.firestore.FieldValue.arrayRemove(secondaryId)
        });
        tx.update(ref, {
          parents: admin.firestore.FieldValue.arrayUnion(primaryId)
        });
      }

      if ((data.children || []).includes(secondaryId)) {
        tx.update(ref, {
          children: admin.firestore.FieldValue.arrayRemove(secondaryId)
        });
        tx.update(ref, {
          children: admin.firestore.FieldValue.arrayUnion(primaryId)
        });
      }

      if ((data.spouses || []).includes(secondaryId)) {
        tx.update(ref, {
          spouses: admin.firestore.FieldValue.arrayRemove(secondaryId)
        });
        tx.update(ref, {
          spouses: admin.firestore.FieldValue.arrayUnion(primaryId)
        });
      }
    });

    tx.delete(secondaryRef);
  });
};
