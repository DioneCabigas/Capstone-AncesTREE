'use client'

/**
 * Navbar Component
 * 
 * This component displays the navigation bar at the top of the application.
 * It shows different options based on whether the user is authenticated or not.
 * Includes a logout function to sign users out of the application.
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { auth } from "@/app/utils/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
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

  return (
    <nav className="fixed top-0 left-0 right-0 bg-[var(--dark-green)] text-[var(--light-yellow)] p-4 z-50 border-b-2 border-[var(--light-yellow)]">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-2">
          <Link href={user ? "/auth/home" : "/"} className="flex items-center">
            {/* Replace with your actual logo */}
            <div className="h-10 w-10 border-2 border-[var(--light-yellow)] flex items-center justify-center mr-2">
              <span className="text-xl">X</span>
            </div>
            <span className="text-xl font-bold">AncesTREE</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-8">
          {user ? (
            /* Links for authenticated users */
            <>
              <Link href="/auth/home" className="hover:underline">Home</Link>
              <Link href="/auth/search" className="hover:underline">Search</Link>
              <Link href="/auth/family-tree" className="hover:underline">Family Tree</Link>
              <Link href="/auth/family-group" className="hover:underline">Family Group</Link>
              <Link href="/auth/gallery" className="hover:underline">Gallery</Link>
            </>
          ) : (
            /* Links for non-authenticated users */
            <>
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/about" className="hover:underline">About</Link>
              <Link href="/features" className="hover:underline">Features</Link>
              <Link href="/auth/login" className="hover:underline">Login</Link>
              <Link href="/auth/signup" className="hover:underline">Sign Up</Link>
            </>
          )}
        </div>

        {/* User Menu (only for authenticated users) */}
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center space-x-2"
            >
              {/* User avatar - replace with actual avatar if available */}
              <div className="h-8 w-8 rounded-full bg-[var(--light-yellow)] text-[var(--dark-green)] flex items-center justify-center">
                {user.displayName ? user.displayName.charAt(0) : "U"}
              </div>
              <span className="hidden md:inline-block">
                {user.displayName || "User"}
              </span>
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-100 rounded-md shadow-xl py-1 z-50">
                <Link href="/auth/profile">
                  <div onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-[var(--dark-green)] hover:bg-gray-200">
                    Profile
                  </div>
                </Link>
                <Link href="/auth/settings">
                  <div onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-[var(--dark-green)] hover:bg-gray-200">
                    Settings
                  </div>
                </Link>
                <Link href="/auth/help">
                  <div onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-[var(--dark-green)] hover:bg-gray-200">
                    Help
                  </div>
                </Link>
                <div
                  onClick={handleLogout}
                  className="block px-4 py-2 text-sm text-[var(--dark-green)] hover:bg-gray-200 cursor-pointer"
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile menu button - implement as needed */}
        <div className="md:hidden">
          <button className="text-[var(--light-yellow)]">
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