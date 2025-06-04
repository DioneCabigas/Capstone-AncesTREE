class settingsEntity {
  constructor({ preferences = {}, permissions = {} }) {
    this.preferences = {
    //   newsletter: preferences.newsletter ?? false,
      familyGroups: preferences.familyGroups ?? false,
      connectRequests: preferences.connectRequests ?? false,
    };
    this.permissions = {
      allowView: permissions.allowView ?? false,
      appearInSearch: permissions.appearInSearch ?? false,
    //   exportTree: permissions.exportTree ?? false,
    };
  }
}

module.exports = settingsEntity;
