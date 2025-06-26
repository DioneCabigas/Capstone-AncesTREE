class FamilyTree {
  constructor(userId, treeName, createdAt = new Date(), sharedUsers = []) {
    this.userId = userId;
    this.treeName = treeName;
    this.createdAt = createdAt;
    this.sharedUsers = sharedUsers;
  }
}

module.exports = FamilyTree;
