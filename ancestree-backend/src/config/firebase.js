const admin = require('firebase-admin');
const serviceAccount = require('./capstone-ancestree-firebase-adminsdk-fbsvc-3a06b2436e.json');

// Initialize Firebase Admin SDK with the service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://capstone-ancestree.firebaseio.com",
  storageBucket: "capstone-ancestree.appspot.com"
});

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = {
  admin,
  db,
  auth,
  storage
};