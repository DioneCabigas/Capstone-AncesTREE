class FamilyGroupMember {
  constructor(groupId, userId, role, status = "pending", invitedAt = new Date()) {
    this._groupId = groupId;
    this._userId = userId;
    this._role = role;
    this._status = status;
    this._invitedAt = invitedAt;
  }

  get groupId() {
    return this._groupId;
  }

  get userId() {
    return this._userId;
  }

  get role() {
    return this._role;
  }

  get status() {
    return this._status;
  }

  get invitedAt() {
    return this._invitedAt;
  }

  set groupId(value) {
    this._groupId = value;
  }

  set userId(value) {
    this._userId = value;
  }

  set role(value) {
    this._role = value;
  }

  set status(value) {
    this._status = value;
  }

  set invitedAt(value) {
    if (!(value instanceof Date)) {
      throw new Error('invitedAt must be a Date object');
    }
    this._invitedAt = value;
  }

  toJSON() {
    return {
      groupId: this._groupId,
      userId: this._userId,
      role: this._role,
      status: this._status,
      invitedAt: this._invitedAt,
    };
  }
}

module.exports = FamilyGroupMember;