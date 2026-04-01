import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/app/utils/firebase';

/**
 * Custom hook to manage Firebase authentication state
 * @returns {Object} { user, userId, isLoading, error }
 */
export const useAuthUser = () => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          setUserId(currentUser.uid);
        } else {
          setUser(null);
          setUserId(null);
        }
      } catch (err) {
        setError(err);
        console.error('Auth state change error:', err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, userId, isLoading, error };
};
