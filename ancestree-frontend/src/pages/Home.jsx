import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '../components/ui/button';
import { auth, loginWithGoogle } from '../lib/firebase';
import { FaTree, FaUsers, FaSearch } from 'react-icons/fa';

const Home = () => {
  const [user, setUser] = useState(auth.currentUser);

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

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Discover and preserve</span>{' '}
                  <span className="block text-primary xl:inline">your family history</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Build your family tree, connect with relatives, and explore your ancestry with AncesTree - the modern way to discover and share your family history.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  {user ? (
                    <div className="rounded-md shadow">
                      <Link href="/family-tree">
                        <Button className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark md:py-4 md:text-lg md:px-10">
                          <FaTree className="mr-2" /> Start Your Tree
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded-md shadow">
                      <Button 
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark md:py-4 md:text-lg md:px-10"
                        onClick={handleLogin}
                      >
                        Get Started
                      </Button>
                    </div>
                  )}
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link href="/search">
                      <Button variant="outline" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                        <FaSearch className="mr-2" /> Search Ancestry
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-primary-light">
          <div className="h-full flex items-center justify-center">
            <FaTree className="h-64 w-64 text-primary-dark opacity-20" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Discover your family's story
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              AncesTree provides powerful tools to help you research, build, and share your family history.
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="relative p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="text-center mb-4">
                  <FaTree className="mx-auto h-12 w-12 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 text-center">Family Tree Builder</h3>
                <p className="mt-4 text-base text-gray-500 text-center">
                  Create and visualize your family tree with our easy-to-use interactive builder.
                </p>
              </div>
              
              <div className="relative p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="text-center mb-4">
                  <FaUsers className="mx-auto h-12 w-12 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 text-center">Family Groups</h3>
                <p className="mt-4 text-base text-gray-500 text-center">
                  Collaborate with family members to grow and share your collective family history.
                </p>
              </div>
              
              <div className="relative p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="text-center mb-4">
                  <FaSearch className="mx-auto h-12 w-12 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 text-center">Ancestry Search</h3>
                <p className="mt-4 text-base text-gray-500 text-center">
                  Find connections to your ancestors and discover new branches of your family tree.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-light">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            <span className="block">Ready to discover your roots?</span>
            <span className="block text-primary">Start building your family tree today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              {user ? (
                <Link href="/family-tree">
                  <Button className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark">
                    Go to my tree
                  </Button>
                </Link>
              ) : (
                <Button 
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
                  onClick={handleLogin}
                >
                  Get started
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;