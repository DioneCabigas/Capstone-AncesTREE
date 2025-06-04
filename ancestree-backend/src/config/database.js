const admin = require('firebase-admin');
const serviceAccount = require('./capstone-ancestree-firebase-adminsdk-fbsvc-650a69d943.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'capstone-ancestree.firebasestorage.app',
});

admin.bucket = admin.storage().bucket();

module.exports = admin;
