'use client'

/**
 * Home Page Component
 * 
 * This page is protected and only accessible to authenticated users with verified emails.
 * It uses the AuthController component with mode="PROTECT" to enforce this.
 */

import Navbar from '../../../components/Navbar';
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