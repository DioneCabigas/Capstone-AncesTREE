const admin = require('../config/database');
const personService = require('./personService');
const familyTreeService = require('./familyTreeService');

const db = admin.firestore();

/**
 * Merges a user's personal tree into a group tree by duplicating persons and relationships
 * @param {string} requesterId - The ID of the user requesting the merge
 * @param {string} groupTreeId - The ID of the group tree to merge into
 * @returns {Promise<Object>} - Result of the merge operation
 */
exports.mergePersonalTreeIntoGroup = async (requesterId, groupTreeId) => {
  try {
    // Get the requester's personal tree
    const personalTree = await familyTreeService.getPersonalTree(requesterId);
    
    if (!personalTree) {
      throw new Error(`No personal tree found for user ${requesterId}`);
    }

    // Get all persons from the personal tree
    const personalTreePersons = await personService.getPeopleByTreeId(personalTree.treeId);
    
    if (personalTreePersons.length === 0) {
      return {
        success: true,
        message: 'No persons to merge from personal tree',
        mergedPersons: 0
      };
    }

    // Check if the group tree exists
    const groupTree = await familyTreeService.getFamilyTreeById(groupTreeId);
    if (!groupTree) {
      throw new Error(`Group tree ${groupTreeId} not found`);
    }

    // Get existing persons in the group tree to avoid duplicates
    const existingGroupPersons = await personService.getPeopleByTreeId(groupTreeId);
    
    // Create a map for person ID translation (personal tree ID -> group tree ID)
    const personIdMap = new Map();
    const duplicatedPersons = [];

    // First pass: Duplicate all persons to the group tree
    for (const person of personalTreePersons) {
      // Check if person might already exist in group tree (by name and birth date)
      const possibleDuplicate = existingGroupPersons.find(existing => 
        existing.firstName?.toLowerCase() === person.firstName?.toLowerCase() &&
        existing.lastName?.toLowerCase() === person.lastName?.toLowerCase() &&
        existing.birthDate === person.birthDate
      );

      if (possibleDuplicate) {
        // Person likely already exists, map to existing ID
        personIdMap.set(person.personId, possibleDuplicate.personId);
        console.log(`Mapped existing person: ${person.firstName} ${person.lastName} -> ${possibleDuplicate.personId}`);
      } else {
        // Create new person in group tree
        const newPersonData = {
          firstName: person.firstName,
          middleName: person.middleName,
          lastName: person.lastName,
          birthDate: person.birthDate,
          birthPlace: person.birthPlace,
          gender: person.gender,
          status: person.status,
          dateOfDeath: person.dateOfDeath,
          placeOfDeath: person.placeOfDeath,
          relationships: [] // Will be added in second pass
        };

        // Special handling for the requesting user - create with predictable ID
        if (person.personId === requesterId) {
          // Create user's node in group tree with unique ID
          const userPersonId = `${requesterId}_${groupTreeId}`;
          const userPerson = new (require('../entities/Person'))(
            groupTreeId, 
            newPersonData.firstName, 
            newPersonData.middleName, 
            newPersonData.lastName, 
            newPersonData.birthDate, 
            newPersonData.birthPlace, 
            newPersonData.gender, 
            newPersonData.status, 
            newPersonData.relationships
          );
          
          const db = require('../config/database').firestore();
          await db.collection('persons').doc(userPersonId).set({ ...userPerson });
          
          const newUserPerson = { personId: userPersonId, ...userPerson };
          personIdMap.set(person.personId, newUserPerson.personId);
          duplicatedPersons.push(newUserPerson);
          
          console.log(`Created user node in group tree: ${person.firstName} ${person.lastName} -> ${newUserPerson.personId}`);
        } else {
          // Regular person duplication
          const newPerson = await personService.createPerson(groupTreeId, newPersonData);
          personIdMap.set(person.personId, newPerson.personId);
          duplicatedPersons.push(newPerson);
          
          console.log(`Duplicated person: ${person.firstName} ${person.lastName} -> ${newPerson.personId}`);
        }
      }
    }

    // Second pass: Update relationships using the new IDs
    for (const originalPerson of personalTreePersons) {
      const groupTreePersonId = personIdMap.get(originalPerson.personId);
      
      if (originalPerson.relationships && originalPerson.relationships.length > 0) {
        const translatedRelationships = [];
        
        for (const relationship of originalPerson.relationships) {
          const relatedGroupPersonId = personIdMap.get(relationship.relatedPersonId);
          
          if (relatedGroupPersonId) {
            translatedRelationships.push({
              relatedPersonId: relatedGroupPersonId,
              type: relationship.type
            });
          }
        }

        // Update the person with translated relationships
        if (translatedRelationships.length > 0) {
          await personService.updatePerson(groupTreePersonId, {
            relationships: translatedRelationships
          });
        }
      }
    }

    return {
      success: true,
      message: `Successfully merged ${duplicatedPersons.length} persons from personal tree to group tree`,
      mergedPersons: duplicatedPersons.length,
      personalTreeId: personalTree.treeId,
      groupTreeId: groupTreeId,
      personIdMap: Object.fromEntries(personIdMap)
    };

  } catch (error) {
    console.error('Error merging personal tree into group:', error);
    throw error;
  }
};

/**
 * Reverts a merge operation (for testing or error recovery)
 * @param {string} groupTreeId - The ID of the group tree
 * @param {Object} mergeResult - The result object from a previous merge operation
 * @returns {Promise<Object>} - Result of the revert operation
 */
exports.revertMerge = async (groupTreeId, mergeResult) => {
  try {
    if (!mergeResult.personIdMap) {
      throw new Error('No person ID map provided for revert operation');
    }

    const personsToDelete = Object.values(mergeResult.personIdMap);
    let deletedCount = 0;

    for (const personId of personsToDelete) {
      try {
        await personService.deletePerson(personId);
        deletedCount++;
      } catch (error) {
        console.warn(`Failed to delete person ${personId} during revert:`, error);
      }
    }

    return {
      success: true,
      message: `Reverted merge by deleting ${deletedCount} persons from group tree`,
      deletedPersons: deletedCount
    };

  } catch (error) {
    console.error('Error reverting merge:', error);
    throw error;
  }
};

/**
 * Gets merge statistics for a group tree
 * @param {string} groupTreeId - The ID of the group tree
 * @returns {Promise<Object>} - Statistics about the tree
 */
exports.getTreeMergeStats = async (groupTreeId) => {
  try {
    const persons = await personService.getPeopleByTreeId(groupTreeId);
    
    // Count relationships
    let totalRelationships = 0;
    const relationshipTypes = {};
    
    persons.forEach(person => {
      if (person.relationships) {
        totalRelationships += person.relationships.length;
        
        person.relationships.forEach(rel => {
          relationshipTypes[rel.type] = (relationshipTypes[rel.type] || 0) + 1;
        });
      }
    });

    return {
      totalPersons: persons.length,
      totalRelationships: totalRelationships,
      relationshipTypes: relationshipTypes,
      averageRelationshipsPerPerson: persons.length > 0 ? totalRelationships / persons.length : 0
    };

  } catch (error) {
    console.error('Error getting tree merge stats:', error);
    throw error;
  }
};