'use client'

/**
 * ProtectedRoute Component
 * 
 * This component acts as a wrapper to protect routes from unauthorized access.
 * It checks if a user is authenticated and has verified their email before allowing access.
 * If not authenticated, it redirects to the login page.
 * 
 * Usage: Wrap any page component that should only be accessible to authenticated users.
 * Example: 
 *   <ProtectedRoute>
 *     <YourSecurePage />
 *   </ProtectedRoute>
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/utils/firebase";
import LoadingSpinner from "@/components/LoadingSpinner"; // Loading indicator while checking auth

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true); // Initially show loading state
  
  useEffect(() => {
    // Subscribe to the authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Check if user exists and has verified their email
      if (!user || !user.emailVerified) {
        // If not authenticated or email not verified, redirect to login page
        router.push("/auth/login");
      } else {
        // User is authenticated and email is verified, stop showing loading state
        setIsLoading(false);
      }
    });
    
    // Cleanup the subscription when component unmounts to prevent memory leaks
    return () => unsubscribe();
  }, [router]); // Dependency array - rerun if router changes
  
  // While checking authentication status, show a loading spinner
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // If we reach this point, the user is authenticated and email is verified
  // Render the protected content (children components)
  return <>{children}</>;
}