class familyGroupMember {
    constructor(groupId, userId, role, status = "pending", invitedAt = new Date()) {
        this.groupId = groupId;
        this.userId = userId;
        this.role = role;
        this.status = status;
        this.invitedAt = invitedAt;
    }
}

module.exports = familyGroupMember;