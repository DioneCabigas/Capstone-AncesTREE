const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const galleryController = require('../controllers/galleryController');

router.post('/upload/:userId', upload.single('file'), galleryController.uploadImage);
router.get('/user/:userId', galleryController.getImagesByUser);

module.exports = router;