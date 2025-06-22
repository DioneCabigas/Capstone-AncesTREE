const admin = require('../config/database');
const SettingsEntity = require('../entities/Settings');

const db = admin.firestore();
const collection = db.collection('users');

exports.getSettings = async (uid) => {
  const doc = await collection.doc(uid).get();
  if (!doc.exists) {
    throw new Error('User not found');
  }

  const data = doc.data();
  return new SettingsEntity({
    preferences: data.preferences,
    permissions: data.permissions,
  });
};

exports.saveSettings = async (uid, preferences, permissions) => {
  const entity = new SettingsEntity({ preferences, permissions });

  await collection.doc(uid).set({
    preferences: entity.preferences,
    permissions: entity.permissions
  }, { merge: true });

  return 'User settings updated successfully';
};