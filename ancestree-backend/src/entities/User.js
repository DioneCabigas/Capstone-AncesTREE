class User {
  constructor(data) {
    this._firstName = data.firstName;
    this._lastName = data.lastName;
    this._email = data.email;
    this._middleName = data.middleName || '';
    this._suffix = data.suffix || '';
  }

  // GETTERS
  get firstName() {
    return this._firstName;
  }

  get lastName() {
    return this._lastName;
  }

  get email() {
    return this._email;
  }

  get middleName() {
    return this._middleName;
  }

  get suffix() {
    return this._suffix;
  }

  // SETTERS
  set firstName(value) {
    this._firstName = value;
  }

  set lastName(value) {
    this._lastName = value;
  }

  set email(value) {
    this._email = value;
  }

  set middleName(value) {
    this._middleName = value;
  }

  set suffix(value) {
    this._suffix = value;
  }

  toJSON() {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      middleName: this.middleName,
      suffix: this.suffix
    };
  }
}

module.exports = User;