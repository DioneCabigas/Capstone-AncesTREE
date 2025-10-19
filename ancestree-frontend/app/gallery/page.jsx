'use client';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Layout from '../../components/Layout';
import AuthController from '@/components/AuthController';

const MAX_PHOTOS = 20;
const MAX_SIZE_MB = 10;

const Gallery = () => {
  const [photos, setPhotos] = useState([]);
  const [userId, setUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { // Yaw lng ni hilabti kay mao ni mo kuha sa current Auth User [Dione]
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setPhotos([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchPhotos();
    }
  }, [userId]);

  const fetchPhotos = async () => { // Ako nalang gi modify daan [Dione]
    try {
      const res = await axios.get(`http://localhost:3001/api/gallery/user/${userId}`);
      console.log('Photos:', res.data.images); 
      setPhotos(res.data.images || []);
    } catch (err) {
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
    if (!selectedFile) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await axios.post(`http://localhost:3001/api/gallery/upload/${userId}`, formData, { // Gi change na sad ni nako [Dione]
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowModal(false);
      setSelectedFile(null);
      fetchPhotos();
    } catch (err) {
      setError('Upload failed');
    }
    setUploading(false);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pt-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-black">Gallery</h2>
          <button
            className={`px-6 py-2 rounded text-white font-medium ${
              photos.length >= MAX_PHOTOS ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#365643] hover:bg-[#4F6F52]'
            }`}
            onClick={() => setShowModal(true)}
            disabled={photos.length >= MAX_PHOTOS}
          >
            Upload
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((photo, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow overflow-hidden">
              <img src={photo.imageUrl} alt="Gallery" className="w-full h-40 object-cover" />
              <div className="p-3 bg-gray-50">
                {/* <p className="text-xs text-gray-600">By: {photo.userId}</p> */}
                <p className="text-xs text-gray-600">
                  {photo.uploadedAt
                    ? new Date(photo.uploadedAt._seconds * 1000).toLocaleString()
                    : 'Unknown'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
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
            {selectedFile && (
              <p className="mb-3 text-sm text-gray-600 truncate">{selectedFile.name}</p>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className={`w-full py-2 rounded text-white font-semibold ${
                uploading || !selectedFile
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-700 hover:bg-green-800'
              }`}
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>

            {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
          </div>
        </div>
      )}
    </Layout>
  );
};

// Wrap with AuthController to ensure only authenticated users can access
function GalleryWithAuth() {
  return (
    <AuthController mode="PROTECT">
      <Gallery />
    </AuthController>
  );
}

export default GalleryWithAuth;
