'use client';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Layout from '../../components/Layout';
import AuthController from '@/components/AuthController';
import ProfileGallery from '@/components/ProfileGallery';

const Gallery = () => {
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-20">Loading...</div>
      </Layout>
    );
  }

  if (!userId) {
    return (
      <Layout>
        <div className="text-center py-20">Login to view your gallery.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pt-20 px-8">
        <ProfileGallery ownerId={userId} showUpload={true} />
      </div>
    </Layout>
  );
};

function GalleryWithAuth() {
  return (
    <AuthController mode="PROTECT">
      <Gallery />
    </AuthController>
  );
}

export default GalleryWithAuth;
