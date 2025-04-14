'use client'

/**
 * Home Page Component
 * 
 * This file contains two components:
 * 1. HomeContent - The actual content of the home page
 * 2. Home - A wrapper that applies the ProtectedRoute component
 * 
 * The page is protected and only accessible to authenticated users with verified emails.
 * It also handles saving user data to Firestore if needed.
 */

import Navbar from '../../../components/Navbar';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/app/utils/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import ProtectedRoute from '@/components/ProtectedRoute'; // Adjust the path based on your project structure

/**
 * HomeContent Component
 * It also handles:
 * - Setting up the user's document in Firestore if it doesn't exist
 * - Using registration data from localStorage if available
 * - Showing verification messages if needed
 */
function HomeContent() {
  const [user, setUser] = useState(null); // Store the authenticated user
  const [verificationMessage, setVerificationMessage] = useState(""); // Messages about email verification

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        if (authUser.emailVerified) {
          // Check if user document exists in Firestore
          const userDoc = await getDoc(doc(db, "users", authUser.uid));
          
          // If the user document doesn't exist in Firestore, create it
          if (!userDoc.exists()) {
            // Try to get registration data from localStorage
            const registrationData = localStorage.getItem("registrationData");
            const {
              firstName = "",
              lastName = "",
            } = registrationData ? JSON.parse(registrationData) : {};

            // Create user document in Firestore
            await setDoc(doc(db, "users", authUser.uid), {
              firstName,
              lastName,
              email: authUser.email,
            });
            
            // Clean up localStorage after using the data
            localStorage.removeItem("registrationData");
          }
          
          // Store authenticated user in state
          setUser(authUser);
        } else {
          // User exists but email is not verified
          setUser(null);
          setVerificationMessage("Your email address is not yet verified. Please check your inbox (and spam folder) for the verification link.");
        }
      }
      // If authUser is null, the ProtectedRoute component will handle redirection
    });

    // Cleanup subscription when component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--dark-green)]">
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-5xl font-bold text-[var(--light-yellow)]">Welcome to AncesTREE!</h1>
        
        {/* Show verification message if user's email is not verified */}
        {verificationMessage && <p className="text-[var(--light-yellow)] mt-4">{verificationMessage}</p>}
        
        {/* Only show authenticated content if user exists and email is verified */}
        {user && user.emailVerified && (
          <div className="mt-8">
            {/* Your authenticated content here */}
            <p className="text-2xl text-[var(--light-yellow)]">You are logged in!</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Home Component (Main export)
 * 
 * This wraps the HomeContent component with the ProtectedRoute component
 * to ensure only authenticated users can access this page.
 * 
 * If a user is not authenticated, the ProtectedRoute component will
 * redirect them to the login page automatically.
 */
export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}