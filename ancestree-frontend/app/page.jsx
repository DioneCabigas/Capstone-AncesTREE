'use client'

import Navbar from '../components/Navbar';
import Link from 'next/link';
import AuthController from '../components/AuthController';

/**
 * LandingContent Component
 * 
 * The actual landing page content that should only be shown to non-authenticated users.
 * Authenticated users will be automatically redirected to /home by the AuthController.
 */
function LandingContent() {
  return (
    <div className="relative bg-dark-green min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section id="home" className="relative z-10 flex flex-col items-center justify-center text-[var(--light-yellow)] h-[calc(100vh-60px)] md:h-[calc(100vh-72px)] text-center">
        <h1 className="text-[64px] font-semibold">
          Every Connection
        </h1>
        <h1 className="text-[64px] font-semibold">
           Brings You Closer
        </h1>
        <h2 className='text-[20px] mt-4'>
          Discover relatives, uncover shared roots,
        </h2>
        <h2 className='text-[20px] mb-8'>
          and strengthen family ties
        </h2>
        <Link href="/auth/signup" className="bg-[var(--white)] text-[var(--black)] font-medium py-3 px-8 rounded-full text-base hover:bg-[#D7D7D7] transition-colors">
          GET STARTED
        </Link>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-[var(--light-yellow)] text-[var(--dark-green)]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-8">About AncesTREE</h2>
            <p className="text-xl mb-12">
              Connecting families, preserving legacies, and celebrating heritage through technology.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p>
                  AncesTREE empowers families to discover, document, and celebrate their unique heritage. 
                  We believe every family story deserves to be preserved and shared across generations.
                </p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p>
                  To become the world's most trusted platform for family heritage, where connections 
                  span continents and generations come together through shared stories and memories.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[var(--white)] text-[var(--dark-green)]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl font-bold mb-12 text-center">Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[var(--dark-green)] text-[var(--light-yellow)] p-8 rounded-lg text-center">
                <div className="text-4xl mb-4">🌳</div>
                <h3 className="text-2xl font-bold mb-4">Build Your Family Tree</h3>
                <p>
                  Create and manage your family connections with our intuitive tree builder. 
                  Add family members, document relationships, and watch your tree grow.
                </p>
              </div>
              
              <div className="bg-[var(--dark-green)] text-[var(--light-yellow)] p-8 rounded-lg text-center">
                <div className="text-4xl mb-4">📸</div>
                <h3 className="text-2xl font-bold mb-4">Share Memories</h3>
                <p>
                  Upload photos, stories, and documents to preserve your family's unique history. 
                  Create lasting memories for future generations.
                </p>
              </div>
              
              <div className="bg-[var(--dark-green)] text-[var(--light-yellow)] p-8 rounded-lg text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold mb-4">Discover Connections</h3>
                <p>
                  Connect with relatives around the world, discover shared roots, 
                  and expand your family network through our search tools.
                </p>
              </div>
              
              <div className="bg-[var(--dark-green)] text-[var(--light-yellow)] p-8 rounded-lg text-center">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-2xl font-bold mb-4">Family Groups</h3>
                <p>
                  Create and join family groups to collaborate on research, 
                  share discoveries, and stay connected with your extended family.
                </p>
              </div>
              
              <div className="bg-[var(--dark-green)] text-[var(--light-yellow)] p-8 rounded-lg text-center">
                <div className="text-4xl mb-4">🖼️</div>
                <h3 className="text-2xl font-bold mb-4">Photo Gallery</h3>
                <p>
                  Organize and share family photos in beautiful galleries. 
                  Tag relatives and create albums for special occasions.
                </p>
              </div>
              
              <div className="bg-[var(--dark-green)] text-[var(--light-yellow)] p-8 rounded-lg text-center">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-2xl font-bold mb-4">Privacy & Security</h3>
                <p>
                  Your family's information is secure with us. Control who can see your data 
                  and maintain privacy while staying connected.
                </p>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <Link 
                href="/auth/signup" 
                className="bg-[var(--dark-green)] text-[var(--light-yellow)] font-medium py-4 px-10 rounded-full text-lg hover:bg-opacity-90 transition-colors"
              >
                Start Your Family Tree Today
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--dark-green)] text-[var(--light-yellow)] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl font-bold mb-4">AncesTREE</h3>
            <p className="text-lg mb-8">Connecting families, preserving legacies</p>
            <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-8 mb-8">
              <Link href="#home" className="hover:underline">Home</Link>
              <Link href="#about" className="hover:underline">About</Link>
              <Link href="#features" className="hover:underline">Features</Link>
              <Link href="/auth/login" className="hover:underline">Login</Link>
              <Link href="/auth/signup" className="hover:underline">Sign Up</Link>
            </div>
            <div className="text-sm opacity-70">
              &copy; {new Date().getFullYear()} AncesTREE. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Landing Page (Main export)
 * 
 * This wraps the LandingContent component with the AuthController component
 * in REDIRECT mode. This ensures that:
 * - Non-authenticated users see the landing page with the unauthenticated navbar (Home, About, Features)
 * - Authenticated users are automatically redirected to /home with the authenticated navbar
 */
export default function Home() {
  return (
    <AuthController mode="REDIRECT">
      <LandingContent />
    </AuthController>
  );
}

// TO RUN THE FRONTEND
// 1. "cd app"
// 2. "npm run dev"

// IF IT FAILS
// DO "npm install" to install the new dependencies