class Person {
  constructor(treeId, firstName, middleName, lastName, birthDate, birthPlace, gender, status, relationships = [], groupTreeIds = [], dateOfDeath = '', placeOfDeath = '') {
    this.treeId = treeId; // Personal tree ID (never changes)
    this.firstName = firstName || '';
    this.middleName = middleName || '';
    this.lastName = lastName || '';
    this.birthDate = birthDate || '';
    this.birthPlace = birthPlace || '';
    this.gender = gender || '';
    this.status = status || 'living';
    this.relationships = relationships || [];
    this.groupTreeIds = groupTreeIds || []; // Array of group tree IDs this person belongs to
    this.dateOfDeath = dateOfDeath || '';
    this.placeOfDeath = placeOfDeath || '';
  }
}

module.exports = Person;
