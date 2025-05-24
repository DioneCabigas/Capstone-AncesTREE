class familyGroup {
    constructor(userId, treeId, name, description, createdAt = new Date()) {
        this.userId = userId;
        this.treeId = treeId;
        this.name = name;
        this.description = description;
        this.createdAt = createdAt;
    }
}

module.exports = familyGroup;