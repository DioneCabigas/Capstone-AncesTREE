'use client'

/**
 * Home Page Component - Redesigned with 60-30-10 Color Rule
 * 
 * Using the provided color palette:
 * - White (#FFFFFF) as 60% primary color
 * - Light Green (#4F6F52) as 30% secondary color
 * - Dark Gray (#313131) as 10% accent color
 */

import Navbar from '../../components/Navbar';
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/app/utils/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import AuthController from '@/components/AuthController'; // Import the unified controller
import Link from 'next/link';

/**
 * HomeContent Component
 * 
 * Contains the actual content of the home page that will be displayed
 * after a user has been authenticated and their email verified.
 */
function HomeContent() {
  const [user, setUser] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState("");

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        if (authUser.emailVerified) {
          // Check if user document exists in Firestore
          // const userDoc = await getDoc(doc(db, "users", authUser.uid));
          
          // // If the user document doesn't exist in Firestore, create it
          // if (!userDoc.exists()) {
          //   // Try to get registration data from localStorage
          //   const registrationData = localStorage.getItem("registrationData");
          //   const {
          //     firstName = "",
          //     lastName = "",
          //   } = registrationData ? JSON.parse(registrationData) : {};

          //   // Create user document in Firestore
          //   await setDoc(doc(db, "users", authUser.uid), {
          //     firstName,
          //     lastName,
          //     email: authUser.email,
          //   });
            
          //   // Clean up localStorage after using the data
          //   localStorage.removeItem("registrationData");
          // }
          
          // Store authenticated user in state
          setUser(authUser);
        } else {
          // User exists but email is not verified
          setUser(null);
          setVerificationMessage("Your email address is not yet verified. Please check your inbox (and spam folder) for the verification link.");
        }
      }
    });

    // Cleanup subscription when component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Main content with 60-30-10 color distribution */}
      <div className="container mx-auto p-8">
        {/* Hero section - using white as primary, green as secondary */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 className="text-5xl font-bold text-[#313131] mb-4">Welcome to AncesTREE!</h1>
          <p className="text-xl text-[#313131] mb-6">Your digital family heritage platform</p>
          
        </div>
        
        {/* Show verification message if user's email is not verified */}
        {verificationMessage && (
          <div className="bg-[#4F6F52] text-white p-4 rounded-md mb-8">
            {verificationMessage}
          </div>
        )}
        
        {/* Features section - secondary color as background */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#4F6F52] text-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-3">Build Your Tree</h2>
            <p>Create and manage your family connections with our intuitive tree builder.</p>
          </div>
          <div className="bg-[#4F6F52] text-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-3">Share Memories</h2>
            <p>Upload photos and stories to preserve your family's unique history.</p>
          </div>
          <div className="bg-[#4F6F52] text-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-3">Discover Roots</h2>
            <p>Connect with relatives and explore your ancestral background.</p>
          </div>
        </div>
        
        {/* Dashboard section - removed authentication check */}
        <div className="bg-white border-2 border-[#4F6F52] rounded-lg p-6">
          <h2 className="text-2xl font-bold text-[#313131] mb-4">Your Family Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[rgba(79,111,82,0.1)] p-4 rounded-md">
              <h3 className="text-xl font-semibold text-[#313131] mb-2">Recent Updates</h3>
              <p className="text-[#313131]">No recent updates to display.</p>
            </div>
            <div className="bg-[rgba(79,111,82,0.1)] p-4 rounded-md">
              <h3 className="text-xl font-semibold text-[#313131] mb-2">Quick Actions</h3>
              <div className="flex flex-col space-y-2">
                <Link href="/family-tree">
                  <button className="bg-[#4F6F52] text-white px-4 py-2 rounded w-full hover:bg-opacity-90">
                    View Family Tree
                  </button>
                </Link>
                <Link href="/gallery">
                  <button className="bg-[#4F6F52] text-white px-4 py-2 rounded w-full hover:bg-opacity-90">
                    Manage Gallery
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer with accent color */}
      <footer className="bg-[#313131] text-white py-6 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">AncesTREE</h3>
              <p className="text-sm">Connecting families, preserving legacies</p>
            </div>
            <div className="flex space-x-4">
              <Link href="/privacy" className="hover:underline">Privacy</Link>
              <Link href="/terms" className="hover:underline">Terms</Link>
              <Link href="/contact" className="hover:underline">Contact</Link>
            </div>
          </div>
          <div className="mt-4 text-center text-sm">
            &copy; {new Date().getFullYear()} AncesTREE. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Home Component (Main export)
 * 
 * This wraps the HomeContent component with the AuthController component
 * in PROTECT mode to ensure only authenticated users can access this page.
 */
export default function Home() {
  return (
    <AuthController mode="PROTECT">
      <HomeContent />
    </AuthController>
  );
}