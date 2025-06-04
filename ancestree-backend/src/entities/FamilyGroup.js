class FamilyGroup {
  constructor(userId, treeId, name, description, createdAt = new Date()) {
    this._userId = userId;
    this._treeId = treeId;
    this._name = name;
    this._description = description;
    this._createdAt = createdAt;
  }

  get userId() {
    return this._userId;
  }
  get treeId() {
    return this._treeId;
  }
  get name() {
    return this._name;
  }
  get description() {
    return this._description;
  }
  get createdAt() {
    return this._createdAt;
  }

  set userId(value) {
    this._userId = value;
  }
  set treeId(value) {
    this._treeId = value;
  }
  set name(value) {
    this._name = value;
  }
  set description(value) {
    this._description = value;
  }
  set createdAt(value) {
    if (!(value instanceof Date)) {
      throw new Error('createdAt must be a Date object');
    }
    this._createdAt = value;
  }

  toJSON() {
    return {
      userId: this._userId,
      treeId: this._treeId,
      name: this._name,
      description: this._description,
      createdAt: this._createdAt,
    };
  }
}

module.exports = FamilyGroup;