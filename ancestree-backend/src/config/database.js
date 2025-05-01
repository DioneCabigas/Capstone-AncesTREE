// Firebase Firestore configuration
const admin = require('firebase-admin');
const serviceAccount = require('../../service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = {
  db,
  auth,
  storage
};