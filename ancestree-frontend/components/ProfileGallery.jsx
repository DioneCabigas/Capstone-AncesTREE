'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const MAX_PHOTOS = 20;
const MAX_SIZE_MB = 10;

export default function ProfileGallery({ ownerId, showUpload = false }) {
  const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!ownerId) {
      setPhotos([]);
      return;
    }
    fetchPhotos();
  }, [ownerId]);

  const fetchPhotos = async () => {
    try {
      const res = await axios.get(`${BACKEND_BASE_URL}/api/gallery/user/${ownerId}`);
      setPhotos(res.data.images || []);
      setError('');
    } catch (err) {
      console.error('Failed to load photos:', err);
      setError('Failed to load photos');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError('File size exceeds 10MB');
      setSelectedFile(null);
    } else {
      setError('');
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !ownerId) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await axios.post(`${BACKEND_BASE_URL}/api/gallery/upload/${ownerId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowModal(false);
      setSelectedFile(null);
      await fetchPhotos();
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed');
    }

    setUploading(false);
  };

  if (!ownerId) {
    return <p className="text-center text-gray-600">No user selected for gallery.</p>;
  }

  return (
    <div className="max-w-10xl mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-black">{showUpload ? 'Gallery' : "User's Gallery"}</h2>
        {showUpload && (
          <button
            className={`px-6 py-2 rounded text-white font-medium ${
              photos.length >= MAX_PHOTOS ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#365643] hover:bg-[#4F6F52]'
            }`}
            onClick={() => setShowModal(true)}
            disabled={photos.length >= MAX_PHOTOS}
          >
            Upload
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {photos.length === 0 ? (
          <div className="col-span-full bg-white text-gray-600 rounded-lg min-h-[120px] flex items-center justify-center p-6">
            No images yet
          </div>
        ) : (
          photos.map((photo, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow overflow-hidden">
              <img src={photo.imageUrl} alt="Gallery" className="w-full h-40 object-cover" />
              <div className="p-3 bg-gray-50">
                <p className="text-xs text-gray-600">
                  {photo.uploadedAt
                    ? new Date(photo.uploadedAt._seconds * 1000).toLocaleString()
                    : 'Unknown'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80 relative shadow-lg">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-3 text-2xl font-bold cursor-pointer"
            >
              &times;
            </button>
            <h3 className="text-xl font-semibold mb-3">Upload Photo</h3>
            <p className="mb-4 text-gray-700">Select a photo to add to your gallery.</p>
            <label className="block mb-3">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <div className="cursor-pointer bg-gray-200 py-2 px-4 rounded text-center hover:bg-gray-300">
                Choose File
              </div>
            </label>
            {selectedFile && <p className="mb-3 text-sm text-gray-600 truncate">{selectedFile.name}</p>}
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className={`w-full py-2 rounded text-white font-semibold ${
                uploading || !selectedFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'
              }`}
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
            {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
