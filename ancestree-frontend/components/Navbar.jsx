'use client'

/**
 * Navbar Component - Redesigned with 60-30-10 Color Rule
 * 
 * Using the provided color palette:
 * - White (#FFFFFF) as 60% primary color 
 * - Light Green (#4F6F52) as 30% secondary color
 * - Dark Gray (#313131) as 10% accent color
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { auth, db } from "@/app/utils/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ firstName: "" });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  // Handle auth state changes and fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // If user is authenticated, fetch their data from Firestore
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // NEW EFFECT - Listen for user data changes from ProfilePage
  useEffect(() => {
    // Function to update userData based on localStorage
    const handleUserDataChange = () => {
      const storedFirstName = localStorage.getItem('userFirstName');
      if (storedFirstName) {
        setUserData(prevData => ({
          ...prevData,
          firstName: storedFirstName
        }));
      }
    };

    // Add event listener for the custom event
    window.addEventListener('userDataChanged', handleUserDataChange);
    
    // Check localStorage on mount in case there's already updated data
    handleUserDataChange();
    
    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('userDataChanged', handleUserDataChange);
    };
  }, []);

  // Handle clicks outside the dropdown menu to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Handle user logout
   * Signs out the user and redirects to login page
   */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMenuOpen(false);
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // Get the first initial for the avatar
  const getInitial = () => {
    if (userData.firstName) {
      return userData.firstName.charAt(0).toUpperCase();
    }
    if (user && user.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    if (user && user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Get the display name for the profile
  const getDisplayName = () => {
    if (userData.firstName) {
      return userData.firstName;
    }
    if (user && user.displayName) {
      return user.displayName.split(' ')[0]; // Just get the first name
    }
    return "User";
  };

  return (
    <nav className="relative top-0 left-0 right-0 bg-[#4F6F52] text-white p-2 z-50 border-b-2 border-[#313131]">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-2">
          <Link href={user ? "/home" : "/"} className="flex items-center">
            {/* Logo with dark accent background and white text */}
            <div className="h-10 w-10 bg-[#313131] border-2 border-white rounded-md flex items-center justify-center mr-2">
              <span className="text-xl font-bold text-white">A</span>
            </div>
            <span className="text-xl font-bold">AncesTREE</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-6">
          {user ? (
            /* Links for authenticated users */
            <>
              <Link href="/home" className="hover:underline decoration-2 underline-offset-4 px-2 py-1 rounded transition-colors hover:bg-[rgba(49,49,49,0.2)]">Home</Link>
              <Link href="/search" className="hover:underline decoration-2 underline-offset-4 px-2 py-1 rounded transition-colors hover:bg-[rgba(49,49,49,0.2)]">Search</Link>              <Link href="/family-tree" className="hover:underline decoration-2 underline-offset-4 px-2 py-1 rounded transition-colors hover:bg-[rgba(49,49,49,0.2)]">Family Tree</Link>
              <Link href="/family-group" className="hover:underline decoration-2 underline-offset-4 px-2 py-1 rounded transition-colors hover:bg-[rgba(49,49,49,0.2)]">Family Group</Link>
              <Link href="/gallery" className="hover:underline decoration-2 underline-offset-4 px-2 py-1 rounded transition-colors hover:bg-[rgba(49,49,49,0.2)]">Gallery</Link>
            </>
          ) : (
            /* Links for non-authenticated users */
            <>
              <Link href="/" className="hover:underline decoration-2 underline-offset-4 px-2 py-1 rounded transition-colors hover:bg-[rgba(49,49,49,0.2)]">Home</Link>
              <Link href="/about" className="hover:underline decoration-2 underline-offset-4 px-2 py-1 rounded transition-colors hover:bg-[rgba(49,49,49,0.2)]">About</Link>
              <Link href="/features" className="hover:underline decoration-2 underline-offset-4 px-2 py-1 rounded transition-colors hover:bg-[rgba(49,49,49,0.2)]">Features</Link>
              <Link href="/auth/login" className="bg-[#313131] hover:bg-opacity-90 px-4 py-2 rounded-md transition-colors">Login</Link>
              <Link href="/auth/signup" className="border-2 border-[#313131] hover:bg-[#313131] hover:bg-opacity-20 px-4 py-1.5 rounded-md transition-colors">Sign Up</Link>
            </>
          )}
        </div>

        {/* User Menu (only for authenticated users) */}
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-md hover:bg-[rgba(49,49,49,0.2)] transition-colors"
            >
              {/* User avatar - with user's first initial */}
              <div className="h-8 w-8 rounded-full bg-white text-[#313131] flex items-center justify-center font-bold">
                {getInitial()}
              </div>
              <span className="hidden md:inline-block">
                {getDisplayName()}
              </span>
              
              {/* Dropdown indicator */}
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-[#4F6F52]">
                <Link href="/profile">
                  <div onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-[#313131] hover:bg-[rgba(79,111,82,0.1)]">
                    Profile
                  </div>
                </Link>
                <Link href="/settings">
                  <div onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-[#313131] hover:bg-[rgba(79,111,82,0.1)]">
                    Settings
                  </div>
                </Link>
                <Link href="/help">
                  <div onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-[#313131] hover:bg-[rgba(79,111,82,0.1)]">
                    Help
                  </div>
                </Link>
                <div className="border-t border-[#4F6F52] my-1"></div>
                <div
                  onClick={handleLogout}
                  className="block px-4 py-2 text-sm text-red-600 hover:bg-[rgba(239,68,68,0.1)] cursor-pointer"
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button className="text-white p-1 rounded-md hover:bg-[rgba(49,49,49,0.2)]">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}