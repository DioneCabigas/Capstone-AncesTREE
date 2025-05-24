class Connection {
  constructor(requester, receiver, status = 'pending') {
    this.requester = requester;
    this.receiver = receiver;
    this.status = status; // pending, accepted, rejected
    this.createdAt = new Date();
  }
}

module.exports = Connection;