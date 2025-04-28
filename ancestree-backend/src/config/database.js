const admin = require('firebase-admin');
const serviceAccount = require('./capstone-ancestree-firebase-adminsdk-fbsvc-650a69d943.json'); 
// If mo gamit mo sa database kay generate your own key sa firebase and I-paste sa config directory ang JSON file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;