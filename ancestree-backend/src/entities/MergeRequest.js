class MergeRequest {
  constructor(groupId, requesterId, targetUserId, status = "pending", requestedAt = new Date(), reviewedAt = null, reviewedBy = null) {
    this._groupId = groupId;
    this._requesterId = requesterId;
    this._targetUserId = targetUserId;
    this._status = status; // pending, approved, denied
    this._requestedAt = requestedAt;
    this._reviewedAt = reviewedAt;
    this._reviewedBy = reviewedBy;
  }

  get groupId() {
    return this._groupId;
  }

  get requesterId() {
    return this._requesterId;
  }

  get targetUserId() {
    return this._targetUserId;
  }

  get status() {
    return this._status;
  }

  get requestedAt() {
    return this._requestedAt;
  }

  get reviewedAt() {
    return this._reviewedAt;
  }

  get reviewedBy() {
    return this._reviewedBy;
  }

  set groupId(value) {
    this._groupId = value;
  }

  set requesterId(value) {
    this._requesterId = value;
  }

  set targetUserId(value) {
    this._targetUserId = value;
  }

  set status(value) {
    this._status = value;
  }

  set requestedAt(value) {
    if (!(value instanceof Date)) {
      throw new Error('requestedAt must be a Date object');
    }
    this._requestedAt = value;
  }

  set reviewedAt(value) {
    if (value !== null && !(value instanceof Date)) {
      throw new Error('reviewedAt must be a Date object or null');
    }
    this._reviewedAt = value;
  }

  set reviewedBy(value) {
    this._reviewedBy = value;
  }

  toJSON() {
    return {
      groupId: this._groupId,
      requesterId: this._requesterId,
      targetUserId: this._targetUserId,
      status: this._status,
      requestedAt: this._requestedAt,
      reviewedAt: this._reviewedAt,
      reviewedBy: this._reviewedBy,
    };
  }
}

module.exports = MergeRequest;
