const admin = require('firebase-admin');
const path = require('path');

// Update the filename to match your new key
const serviceAccount = require(path.resolve(__dirname, 'capstone-ancestree-firebase-adminsdk-fbsvc-01838b417d.json'));
// If mo gamit mo sa database kay generate your own key sa firebase and I-paste sa config directory ang JSON file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;