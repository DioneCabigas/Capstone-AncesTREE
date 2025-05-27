const { uploadImageToStorage, getImagesByUser } = require('../services/galleryService');

exports.uploadImage = async (req, res) => {
  try {
    const userId = req.params.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrl = await uploadImageToStorage(file, userId);
    res.status(200).json({ imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

exports.getUserImages = async (req, res) => {
  try {
    const userId = req.params.userId;
    const images = await getImagesByUser(userId);
    res.status(200).json({ images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not retrieve images' });
  }
};