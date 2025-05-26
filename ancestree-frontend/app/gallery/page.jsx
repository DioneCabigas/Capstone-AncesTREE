'use client';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar'; // Import the shared Navbar component

const MAX_PHOTOS = 20;
const MAX_SIZE_MB = 10;

const Gallery = () => {
  const [photos, setPhotos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const res = await axios.get('/api/gallery'); // Adjust endpoint as needed
      setPhotos(res.data);
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
    const formData = new FormData();
    formData.append('photo', selectedFile);
    // Add user info as needed
    try {
      await axios.post('/api/gallery/upload', formData, {
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
    <div style={{ minHeight: '100vh', background: '#f7f7f7' }}>
      {/* Navbar */}
      <Navbar /> {/* Use the shared Navbar component */}

      {/* Gallery Content */}
      <div style={{ padding: '2rem', paddingTop: '6rem', maxWidth: '1200px', margin: '0 auto' }}> {/* Added top padding to clear the fixed navbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}> {/* Added bottom margin */}
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#000' }}>Gallery</h2> {/* Adjusted font size, added bold and black color */}
          <button
            style={{ background: '#2d4a3a', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: 5, fontWeight: 500, fontSize: 16, cursor: photos.length >= MAX_PHOTOS ? 'not-allowed' : 'pointer' }}
            onClick={() => setShowModal(true)}
            disabled={photos.length >= MAX_PHOTOS}
          >
            Upload
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {photos.map(photo => (
            <div key={photo.id} style={{ width: 220, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px #eee', background: '#fff' }}>
              <img src={photo.url} alt="" style={{ width: '100%', height: 150, objectFit: 'cover' }} />
              <div style={{ padding: 10, background: '#fafafa' }}>
                <div style={{ fontSize: 12, color: '#888' }}>By: {photo.uploader}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{new Date(photo.timestamp).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', padding: 30, borderRadius: 10, minWidth: 350, boxShadow: '0 4px 24px #0002', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start'
          }}>
            <button onClick={() => setShowModal(false)} style={{
              position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer'
            }}>×</button>
            {/* Modal Content */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}> {/* Wrapper for centering content */}
              <h3 style={{ marginBottom: 10, fontWeight: 'bold', color: '#000', width: '100%', textAlign: 'left' }}>Upload Photo</h3>
              <div style={{ fontSize: 14, color: '#444', marginBottom: 20, textAlign: 'left', width: '100%' }}>Select a photo to add to the gallery</div>
              {/* File input and display container */}
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: 5, padding: '0.5rem', marginBottom: 3, width: '100%' }}> {/* Adjusted bottom margin */}
                <label style={{
                  background: '#ccc', color: '#333', padding: '0.4rem 1rem', borderRadius: 5, cursor: 'pointer', fontSize: 14, fontWeight: 500, marginRight: 10
                }}>
                  Choose File
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
                {selectedFile && <div style={{ fontSize: 14, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</div>}
              </div>
              {/* Upload button container for centering */}
              <div style={{ width: '100%', textAlign: 'center', marginTop: 3 }}> {/* Container for centering, adjusted top margin */}
                <button
                  style={{ background: '#2d4a3a', color: '#fff', border: 'none', padding: '0.75rem 1.2rem', borderRadius: 5, fontWeight: 500, fontSize: 16, cursor: uploading ? 'not-allowed' : 'pointer', display: 'inline-block' }} /* Adjusted horizontal padding for width */
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </button>
              </div>
              {error && <div style={{ color: 'red', marginTop: 15, fontSize: 14, width: '100%', textAlign: 'center' }}>{error}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery; 