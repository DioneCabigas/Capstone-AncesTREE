class GalleryImage {
  constructor(data) {
    this._userId = data.userId;
    this._imageUrl = data.imageUrl;
    this._fileName = data.fileName;
    this._uploadedAt = data.uploadedAt || null;
  }

  // Getters
  get userId() {
    return this._userId;
  }

  get imageUrl() {
    return this._imageUrl;
  }

  get fileName() {
    return this._fileName;
  }

  get uploadedAt() {
    return this._uploadedAt;
  }

  // Setters
  set userId(value) {
    this._userId = value;
  }

  set imageUrl(value) {
    this._imageUrl = value;
  }

  set fileName(value) {
    this._fileName = value;
  }

  set uploadedAt(value) {
    this._uploadedAt = value;
  }

  toJSON() {
    return {
      userId: this.userId,
      imageUrl: this.imageUrl,
      fileName: this.fileName,
      uploadedAt: this.uploadedAt,
    };
  }
}

module.exports = GalleryImage;