class Profile {
  constructor(data = {}) {
    this._birthDate = data.birthDate || '';
    this._birthPlace = data.birthPlace || '';
    this._nationality = data.nationality || '';
    this._civilStatus = data.civilStatus || '';
    this._streetAddress = data.streetAddress || '';
    this._cityAddress = data.cityAddress || '';
    this._provinceAddress = data.provinceAddress || '';
    this._countryAddress = data.countryAddress || '';
    this._zipCode = data.zipCode || '';
    this._contactNumber = data.contactNumber || '';
    this._telephoneNumber = data.telephoneNumber || '';
  }

  get birthDate() {
    return this._birthDate;
  }
  get birthPlace() {
    return this._birthPlace;
  }
  get nationality() {
    return this._nationality;
  }
  get civilStatus() {
    return this._civilStatus;
  }
  get streetAddress() {
    return this._streetAddress;
  }
  get cityAddress() {
    return this._cityAddress;
  }
  get provinceAddress() {
    return this._provinceAddress;
  }
  get countryAddress() {
    return this._countryAddress;
  }
  get zipCode() {
    return this._zipCode;
  }
  get contactNumber() {
    return this._contactNumber;
  }
  get telephoneNumber() {
    return this._telephoneNumber;
  }

  set birthDate(value) {
    this._birthDate = value;
  }
  set birthPlace(value) {
    this._birthPlace = value;
  }
  set nationality(value) {
    this._nationality = value;
  }
  set civilStatus(value) {
    this._civilStatus = value;
  }
  set streetAddress(value) {
    this._streetAddress = value;
  }
  set cityAddress(value) {
    this._cityAddress = value;
  }
  set provinceAddress(value) {
    this._provinceAddress = value;
  }
  set countryAddress(value) {
    this._countryAddress = value;
  }
  set zipCode(value) {
    this._zipCode = value;
  }
  set contactNumber(value) {
    this._contactNumber = value;
  }
  set telephoneNumber(value) {
    this._telephoneNumber = value;
  }

  toJSON() {
    return {
      birthDate: this.birthDate,
      birthPlace: this.birthPlace,
      nationality: this.nationality,
      civilStatus: this.civilStatus,
      streetAddress: this.streetAddress,
      cityAddress: this.cityAddress,
      provinceAddress: this.provinceAddress,
      countryAddress: this.countryAddress,
      zipCode: this.zipCode,
      contactNumber: this.contactNumber,
      telephoneNumber: this.telephoneNumber,
    };
  }
}

module.exports = Profile;