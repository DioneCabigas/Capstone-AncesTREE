class Person {
  constructor(treeId, firstName, middleName, lastName, birthDate, birthPlace, gender, status, relationships = []) {
    this.treeId = treeId;
    this.firstName = firstName;
    this.middleName = middleName;
    this.lastName = lastName;
    this.birthDate = birthDate;
    this.birthPlace = birthPlace;
    this.gender = gender;
    this.status = status;
    this.relationships = relationships;
  }
}

module.exports = Person;
