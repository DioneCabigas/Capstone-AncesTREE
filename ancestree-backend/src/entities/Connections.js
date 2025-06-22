class Connection {
  constructor(requester, receiver, status = 'pending') {
    this._requester = requester;
    this._receiver = receiver;
    this._status = status;
    this._createdAt = new Date();
  }

  get requester() {
    return this._requester;
  }

  get receiver() {
    return this._receiver;
  }

  get status() {
    return this._status;
  }

  get createdAt() {
    return this._createdAt;
  }

  set requester(value) {
    this._requester = value;
  }

  set receiver(value) {
    this._receiver = value;
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
      requester: this._requester,
      receiver: this._receiver,
      status: this._status,
      createdAt: this._createdAt,
    };
  }
}

module.exports = Connection;