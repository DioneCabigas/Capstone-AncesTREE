class User {
  constructor(data) {
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.email = data.email;
    this.middleName = data.middleName || '';
    this.suffix = data.suffix || '';
    this.birthDate = data.birthDate || '';
    this.birthPlace = data.birthPlace || '';
    this.nationality = data.nationality || '';
    this.civilStatus = data.civilStatus || '';
    this.streetAddress = data.streetAddress || '';
    this.cityAddress = data.cityAddress || '';
    this.provinceAddress = data.provinceAddress || '';
    this.countryAddress = data.countryAddress || '';
    this.zipCode = data.zipCode || '';
    this.contactNumber = data.contactNumber || '';
    this.telephoneNumber = data.telephoneNumber || '';
  }
}

module.exports = User;