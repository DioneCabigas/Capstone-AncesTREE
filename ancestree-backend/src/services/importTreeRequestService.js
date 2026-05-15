const admin = require('../config/database');
const ImportTreeRequest = require('../entities/ImportTreeRequest');
const personService = require('./personService');

const db = admin.firestore();
const collection = db.collection('importTreeRequests');

exports.createImportRequest = async (groupTreeId, personalTreeId, requestorId, requestorName, preview = {}, status = 'pending', reviewedBy = null, reviewedAt = null) => {
  // Check if a pending request already exists when creating a pending request
  if (status === 'pending') {
    const existingSnapshot = await collection
      .where('groupTreeId', '==', groupTreeId)
      .where('personalTreeId', '==', personalTreeId)
      .where('requestorId', '==', requestorId)
      .where('status', '==', 'pending')
      .get();

    if (!existingSnapshot.empty) {
      throw new Error('A pending import request already exists for this tree.');
    }
  }

  const importRequest = new ImportTreeRequest(
    groupTreeId,
    personalTreeId,
    requestorId,
    requestorName,
    preview,
    status,
    new Date(),
    reviewedAt,
    reviewedBy
  );

  const docRef = await collection.add(importRequest.toJSON());
  return { id: docRef.id, ...importRequest.toJSON() };
};

exports.getImportRequestsByGroupTree = async (groupTreeId) => {
  const snapshot = await collection.where('groupTreeId', '==', groupTreeId).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

exports.getPendingImportRequests = async (groupTreeId) => {
  const snapshot = await collection
    .where('groupTreeId', '==', groupTreeId)
    .where('status', '==', 'pending')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

exports.getImportRequestsForUser = async (requestorId) => {
  const snapshot = await collection
    .where('requestorId', '==', requestorId)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

exports.importPersonalTreeIntoGroupTree = async (personalTreeId, groupTreeId) => {
  if (personalTreeId === groupTreeId) {
    throw new Error('Cannot import a tree into itself. Please select a different personal tree.');
  }

  const people = await personService.getPeopleByTreeId(personalTreeId);
  console.debug(`Importing personal tree ${personalTreeId} into group tree ${groupTreeId}. Found ${people.length} people.`);
  if (!people.length) {
    console.debug('No people found for personalTreeId:', personalTreeId);
    return [];
  }

  const existingGroupPeople = await personService.getPeopleByTreeId(groupTreeId);
  const existingGroupMap = new Map();

  const normalizeKey = (p) => {
    const firstName = (p.firstName || '').trim().toLowerCase();
    const lastName = (p.lastName || '').trim().toLowerCase();
    const birthDate = p.birthDate || '';
    const birthPlace = (p.birthPlace || '').trim().toLowerCase();
    return `${firstName}|${lastName}|${birthDate}|${birthPlace}`;
  };

  existingGroupPeople.forEach(person => {
    const key = normalizeKey(person);
    if (!existingGroupMap.has(key)) {
      existingGroupMap.set(key, person.personId);
    }
  });

  const idMap = new Map();
  const importedPeople = [];

  // Create all persons first and map old IDs to new IDs (or match existing persons)
  for (const person of people) {
    const { personId, firstName, middleName, lastName, birthDate, birthPlace, gender, status, relationships = [] } = person;
    console.debug('Importing person (pre-create):', {
      sourcePersonId: personId,
      firstName,
      lastName,
      relationshipCount: Array.isArray(relationships) ? relationships.length : 0
    });

    const key = normalizeKey(person);
    let targetPersonId = existingGroupMap.get(key);
    let targetPerson;

    if (targetPersonId) {
      console.debug(`Matched existing group person for import key ${key}: ${targetPersonId}`);
      targetPerson = { personId: targetPersonId, treeId: groupTreeId, firstName, middleName, lastName, birthDate, birthPlace, gender, status, relationships: [] };
    } else {
      const personData = {
        firstName,
        middleName,
        lastName,
        birthDate,
        birthPlace,
        gender,
        status,
        relationships: []
      };
      targetPerson = await personService.createPerson(groupTreeId, personData);
      targetPersonId = targetPerson.personId;
      existingGroupMap.set(key, targetPersonId);
    }

    idMap.set(personId, targetPersonId);
    importedPeople.push({
      ...targetPerson,
      sourcePersonId: personId,
      sourceRelationships: relationships
    });
  }

  // Update imported persons with remapped relationships
  for (const imported of importedPeople) {
    const sourceRelationships = imported.sourceRelationships || [];
    const remappedRelationships = sourceRelationships.map(rel => {
      if (!rel || typeof rel !== 'object') {
        return rel;
      }

      const remapped = { ...rel };
      const targetIdFields = ['personId', 'relatedPersonId', 'targetPersonId', 'relationshipId'];

      for (const field of targetIdFields) {
        if (remapped[field] && idMap.has(remapped[field])) {
          remapped[field] = idMap.get(remapped[field]);
        }
      }

      return remapped;
    });

    if (remappedRelationships.length > 0) {
      await personService.updatePerson(imported.personId, { relationships: remappedRelationships });
      console.debug('Updated relationships for imported person:', {
        importedPersonId: imported.personId,
        sourcePersonId: imported.sourcePersonId,
        relationships: remappedRelationships
      });
    }
  }

  console.debug(`Imported ${importedPeople.length} people into group tree ${groupTreeId}.`);
  return importedPeople.map(({ sourcePersonId, sourceRelationships, ...rest }) => rest);
};

exports.updateImportRequestStatus = async (requestId, status, reviewedBy) => {
  const importRequest = await exports.getImportRequestById(requestId);
  if (!importRequest) {
    throw new Error('Import request not found.');
  }

  if (status === 'approved') {
    console.debug(`Approving import request ${requestId} for personalTreeId=${importRequest.personalTreeId} groupTreeId=${importRequest.groupTreeId} reviewedBy=${reviewedBy}`);
    await exports.importPersonalTreeIntoGroupTree(importRequest.personalTreeId, importRequest.groupTreeId);
  }

  await collection.doc(requestId).update({
    status: status,
    reviewedAt: new Date(),
    reviewedBy: reviewedBy
  });

  const updatedDoc = await collection.doc(requestId).get();
  return { id: updatedDoc.id, ...updatedDoc.data() };
};

exports.getImportRequestById = async (requestId) => {
  const doc = await collection.doc(requestId).get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...doc.data() };
};

exports.deleteImportRequest = async (requestId) => {
  await collection.doc(requestId).delete();
  return { success: true };
};

exports.generateImportPreview = async (personalTreeId) => {
  try {
    const people = await personService.getPeopleByTreeId(personalTreeId);
    return {
      personCount: people.length,
      persons: people.map(p => ({
        personId: p.personId,
        name: `${p.firstName} ${p.lastName || ''}`.trim(),
        birthDate: p.birthDate || null
      }))
    };
  } catch (error) {
    console.error('Error generating preview:', error);
    return { personCount: 0, persons: [] };
  }
};
