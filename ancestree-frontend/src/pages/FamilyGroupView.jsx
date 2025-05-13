import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import FamilyGroupDetails from '../components/FamilyGroup/FamilyGroupDetails';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { auth, loginWithGoogle } from '../lib/firebase';
import { FaUsers } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';

const FamilyGroupView = ({ params }) => {
  const [user, setUser] = useState(auth.currentUser);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full mx-auto">
          <CardContent className="pt-6 px-6 pb-8">
            <div className="text-center mb-6">
              <FaUsers className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-3 text-2xl font-bold text-gray-900">
                Sign in to view this family group
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Create an account or sign in to access family group details.
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

  return <FamilyGroupDetails groupId={params.id} />;
};

export default FamilyGroupView;