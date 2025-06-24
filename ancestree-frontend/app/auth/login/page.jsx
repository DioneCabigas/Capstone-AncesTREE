'use client'

import Navbar from '../../../components/Navbar';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/utils/firebase";
import AuthController from '@/components/AuthController';
import Image from 'next/image';
import Link from "next/link";
import axios from 'axios';

// Set the base URL for your backend
axios.defaults.baseURL = 'http://localhost:3001';

function LoginContent() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Use your backend API instead of direct Firestore access
          const response = await axios.get(`/api/user/${currentUser.uid}`);
          
          if (response.status === 200) {
            // User data loaded successfully from backend
            console.log("User data loaded:", response.data);
          }
        } catch (error) {
          console.error("Error fetching user data from backend:", error);
          // Handle case where user might not exist in backend yet
          if (error.response?.status === 404) {
            console.log("User not found in backend, might need to create profile");
          }
        }
      }
    });
    
    return () => unsubscribe();
  }, []);

  const onLogin = async (event) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Step 1: Authenticate with Firebase
      const userCreds = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCreds.user;

      if (firebaseUser.emailVerified) {
        try {
          // Step 2: Check if user exists in your backend
          const userResponse = await axios.get(`/api/user/${firebaseUser.uid}`);
          
          if (userResponse.status === 200) {
            // User exists in backend, proceed to home
            router.push("/home");
          }
        } catch (backendError) {
          if (backendError.response?.status === 404) {
            // User doesn't exist in backend, but might have registration data
            await handleUserCreation(firebaseUser);
          } else {
            console.error("Backend error:", backendError);
            setError("Failed to load user data. Please try again.");
          }
        }
      } else {
        setError("Please verify your email before logging in.");
      }
    } catch (error) {
      // Handle Firebase authentication errors
      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/invalid-email'
      ) {
        setError("Invalid email or password. Please try again.");
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred, please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserCreation = async (firebaseUser) => {
    try {
      // Check for registration data in localStorage
      const registrationData = localStorage.getItem("registrationData");
      let userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        firstName: "",
        lastName: "",
        middleName: "",
        suffix: "",
        birthDate: "",
        birthPlace: "",
        nationality: "",
        civilStatus: "",
        streetAddress: "",
        cityAddress: "",
        provinceAddress: "",
        countryAddress: "",
        zipCode: "",
        contactNumber: "",
        telephoneNumber: "",
      };

      if (registrationData) {
        const parsedData = JSON.parse(registrationData);
        userData = {
          ...userData,
          firstName: parsedData.firstName || "",
          lastName: parsedData.lastName || "",
          middleName: parsedData.middleName || "",
        };
      }

      // Create user in backend using your API
      const createResponse = await axios.post('/api/user', userData);
      
      if (createResponse.status === 200) {
        // Clean up localStorage after successful creation
        localStorage.removeItem("registrationData");
        router.push("/home");
      } else {
        setError("Failed to complete user setup. Please try again.");
      }
    } catch (creationError) {
      console.error("Error creating user in backend:", creationError);
      setError(creationError.response?.data?.message || "Failed to complete user setup. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Login form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-white px-4 md:px-8">
        <Link href={user ? "/home" : "/"} className="flex items-center">
          <Image src="/images/AncesTree_Logo.png" alt="Logo" width={135} height={40}/>
        </Link>
        <div className="w-full max-w-sm">
 
          <h2 className="text-4xl font-bold text-center mb-1">
            <span className="text-[#365643]">WELCOME</span> BACK!
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Ready to manage your Family Tree again?
          </p>
 
          <form className="pt-6" onSubmit={onLogin}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 text-base mb-2">Email</label>
              <input
                type="email"
                id='email'
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-[#365643]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
 
            <div className="mb-4">
              <label className="block text-gray-700 text-base mb-2">Password</label>
              <input
                type="password"
                id='password'
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-[#365643]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
 
            <div className="text-right text-sm mb-6 pb-5">
              <Link href="/auth/forgot-password" className="text-[#365643] hover:underline">
                Forgot Password?
              </Link>
            </div>
 
            <button
              type="submit"
              className="w-full bg-[#365643] hover:bg-[#294032] text-white py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "LOGGING IN..." : "LOGIN"}
            </button>
 
            <p className="text-sm text-center mt-6 text-gray-700">
              Don't have an account? {" "}
              <Link href="/auth/signup" className="text-[#365643] hover:underline font-semibold">
                Sign Up
              </Link>
            </p>
          </form>
        </div>
      </div>
 
      {/* Right side - Background image */}
      <div
        className="hidden md:block md:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: `url('/images/treeBG.jpg')` }}
      ></div>
    </div>
  );
}

export default function Login() {
  return (
    <AuthController mode="REDIRECT">
      <LoginContent />
    </AuthController>
  );
}