const admin = require('../config/database');
const GalleryImage = require('../entities/Gallery');

const db = admin.firestore();
const bucket = admin.storage().bucket();

exports.uploadImage = async (file, userId) => {
  const fileName = `gallery/${userId}/${Date.now()}_${file.originalname}`;
  const storageFile = bucket.file(fileName);

  const stream = storageFile.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    stream.on('error', (err) => reject(err));

    stream.on('finish', async () => {
      await storageFile.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storageFile.name}`;

      const imageEntity = new GalleryImage({
        userId,
        imageUrl: publicUrl,
        fileName,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await db.collection('galleryImages').add(imageEntity.toJSON());
      resolve(publicUrl);
    });

    stream.end(file.buffer);
  });
};

exports.getImagesByUser = async (userId) => {
  const snapshot = await db.collection('galleryImages')
    .where('userId', '==', userId)
    .get();

  const images = snapshot.docs.map(doc => {
    const data = doc.data();
    return new GalleryImage(data).toJSON();
  });

  images.sort((a, b) => {
    const timeA = a.uploadedAt?.toMillis?.() || 0;
    const timeB = b.uploadedAt?.toMillis?.() || 0;
    return timeB - timeA;
  });

  return images;
};