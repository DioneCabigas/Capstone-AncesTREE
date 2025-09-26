class FamilyGroupInvitation {
  constructor(groupId, senderId, receiverId, status = 'pending') {
    this._groupId = groupId;
    this._senderId = senderId;
    this._receiverId = receiverId;
    this._status = status;
    this._createdAt = new Date();
  }

  get groupId() {
    return this._groupId;
  }

  get senderId() {
    return this._senderId;
  }

  get receiverId() {
    return this._receiverId;
  }

  get status() {
    return this._status;
  }

  get createdAt() {
    return this._createdAt;
  }

  set groupId(value) {
    this._groupId = value;
  }

  set senderId(value) {
    this._senderId = value;
  }

  set receiverId(value) {
    this._receiverId = value;
  }

  set status(value) {
    const allowed = ['pending', 'accepted', 'rejected'];
    if (!allowed.includes(value)) {
      throw new Error(`Invalid status: ${value}`);
    }
    this._status = value;
  }

  set createdAt(value) {
    if (!(value instanceof Date)) {
      throw new Error('createdAt must be a Date object');
    }
    this._createdAt = value;
  }

  toJSON() {
    return {
      groupId: this._groupId,
      senderId: this._senderId,
      receiverId: this._receiverId,
      status: this._status,
      createdAt: this._createdAt,
    };
  }
}

module.exports = FamilyGroupInvitation;