const admin = require('../config/database');
const db = admin.firestore();

exports.uploadUserImages = async (file, userId) => {
  const fileName = `gallery/${userId}/${Date.now()}_${file.originalname}`;
  const storageFile = admin.bucket.file(fileName);

  const stream = storageFile.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    stream.on('error', (err) => reject(err));

    stream.on('finish', async () => {
      await storageFile.makePublic();
      const publicUrl = `https://storage.googleapis.com/${admin.bucket.name}/${storageFile.name}`;

      await db.collection('galleryImages').add({
        userId,
        imageUrl: publicUrl,
        fileName,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      resolve(publicUrl);
    });

    stream.end(file.buffer);
  });
};

exports.getUserImages = async (userId) => {
  const snapshot = await db.collection('galleryImages')
    .where('userId', '==', userId)
    .get();

  const images = snapshot.docs.map(doc => doc.data());

  images.sort((a, b) => {
    const timeA = a.uploadedAt ? a.uploadedAt.toMillis() : 0;
    const timeB = b.uploadedAt ? b.uploadedAt.toMillis() : 0;
    return timeB - timeA;
  });

  return images;
};