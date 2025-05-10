import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import FamilyGroupsList from '../components/FamilyGroup/FamilyGroupsList';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { auth, loginWithGoogle } from '../lib/firebase';
import { FaUsers } from 'react-icons/fa';

const FamilyGroups = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full mx-auto">
          <CardContent className="pt-6 px-6 pb-8">
            <div className="text-center mb-6">
              <FaUsers className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-3 text-2xl font-bold text-gray-900">
                Sign in to access family groups
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Create an account or sign in to create and join family groups.
              </p>
            </div>
            <Button
              onClick={handleLogin}
              className="w-full bg-primary hover:bg-primary-dark text-white"
            >
              Sign in with Google
            </Button>
            <p className="mt-4 text-xs text-center text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <FamilyGroupsList />;
};

export default FamilyGroups;