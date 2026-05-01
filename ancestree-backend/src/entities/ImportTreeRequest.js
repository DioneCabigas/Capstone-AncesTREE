class ImportTreeRequest {
  constructor(
    groupTreeId,
    personalTreeId,
    requestorId,
    requestorName,
    preview = {},
    status = "pending",
    requestedAt = new Date(),
    reviewedAt = null,
    reviewedBy = null
  ) {
    this._groupTreeId = groupTreeId;
    this._personalTreeId = personalTreeId;
    this._requestorId = requestorId;
    this._requestorName = requestorName;
    this._preview = preview; // metadata about the tree being imported
    this._status = status; // pending, approved, rejected
    this._requestedAt = requestedAt;
    this._reviewedAt = reviewedAt;
    this._reviewedBy = reviewedBy;
  }

  get groupTreeId() {
    return this._groupTreeId;
  }

  get personalTreeId() {
    return this._personalTreeId;
  }

  get requestorId() {
    return this._requestorId;
  }

  get requestorName() {
    return this._requestorName;
  }

  get preview() {
    return this._preview;
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

  set groupTreeId(value) {
    this._groupTreeId = value;
  }

  set personalTreeId(value) {
    this._personalTreeId = value;
  }

  set requestorId(value) {
    this._requestorId = value;
  }

  set requestorName(value) {
    this._requestorName = value;
  }

  set preview(value) {
    this._preview = value;
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
      groupTreeId: this._groupTreeId,
      personalTreeId: this._personalTreeId,
      requestorId: this._requestorId,
      requestorName: this._requestorName,
      preview: this._preview,
      status: this._status,
      requestedAt: this._requestedAt,
      reviewedAt: this._reviewedAt,
      reviewedBy: this._reviewedBy
    };
  }
}

module.exports = ImportTreeRequest;
