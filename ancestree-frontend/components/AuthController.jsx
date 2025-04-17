'use client'

/**
 * AuthController Component
 * 
 * A unified component that handles authentication flow control based on mode:
 * - PROTECT: Ensures only authenticated users can access (redirects to login if not authenticated)
 * - REDIRECT: Ensures only non-authenticated users can access (redirects to home if authenticated)
 * 
 * Usage examples:
 * <AuthController mode="PROTECT">  // For secure pages (home, profile)
 *   <SecurePage />
 * </AuthController>
 * 
 * <AuthController mode="REDIRECT"> // For auth pages (login, signup)
 *   <LoginPage />
 * </AuthController>
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/utils/firebase";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function AuthController({ children, mode = "PROTECT" }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Subscribe to authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      
      // Handle redirection based on mode and auth state
      if (mode === "PROTECT") {
        // For protected routes: redirect to login if not authenticated or email not verified
        if (!authUser || !authUser.emailVerified) {
          router.push("/auth/login");
        } else {
          setIsLoading(false);
        }
      } else if (mode === "REDIRECT") {
        // For auth pages (login/signup): redirect to home if authenticated
        if (authUser && authUser.emailVerified) {
          router.push("/auth/home");
        } else {
          setIsLoading(false);
        }
      }
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router, mode]);
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // Handle the different auth scenarios based on mode
  if (mode === "PROTECT") {
    // For protected routes: if we're here, user is authenticated and email is verified
    return <>{children}</>;
  } else if (mode === "REDIRECT") {
    // For auth pages: if we're here, user is not authenticated or email not verified
    return <>{children}</>;
  }
  
  // Fallback in case of invalid mode
  return <>{children}</>;
}