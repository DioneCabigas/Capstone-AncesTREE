'use client'

/**
 * Login Page Component - Redesigned with 60-30-10 Color Rule
 * 
 * 60% - White (#FFFFFF) - Primary/dominant color
 * 30% - Light Green (#4F6F52) - Secondary color
 * 10% - Dark Gray (#313131) - Accent color
 */

import Navbar from '../../../components/Navbar';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/app/utils/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import AuthController from '@/components/AuthController';
import Link from "next/link";

function LoginContent() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const onLogin = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      const userCreds = await signInWithEmailAndPassword(auth, email, password);
      const user = userCreds.user;

      if (user.emailVerified) {
        const registrationData = localStorage.getItem("registrationData");
        const {
          firstName = "",
          lastName = "",
        } = registrationData ? JSON.parse(registrationData) : {};

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, "users", user.uid), {
            firstName,
            lastName,
            email: user.email,
          });
        }
        router.push("/auth/home");
      } else {
        setError("Please verify your email before logging in.")
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred, please try again.");
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex flex-col">
      {/* Navbar - 30% Secondary Color */}
      <Navbar />

      {/* Main Content - 60% Dominant Color (white background) */}
      <div className="flex-grow flex items-center justify-center px-4 py-10 content-container">
        {/* Login Form Card */}
        <div className="bg-white shadow-lg rounded-lg border border-[#4F6F52] w-full max-w-md p-8">
          <h2 className="text-2xl font-bold mb-8 text-[#313131]">WELCOME BACK!</h2>
          
          <form className="space-y-5" onSubmit={onLogin}>
            <div>
              <label htmlFor="email" className="block text-lg font-medium mb-2 text-[#4F6F52]">
                Email Address:
              </label>
              <input
                type="email"
                id="email"
                className="bg-white text-[#313131] w-full py-3 px-4 border border-[#4F6F52] rounded-md focus:outline-none focus:ring-2 focus:ring-[#313131]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-lg font-medium mb-2 text-[#4F6F52]">
                Password:
              </label>
              <input
                type="password"
                id="password"
                className="bg-white text-[#313131] w-full py-3 px-4 border border-[#4F6F52] rounded-md focus:outline-none focus:ring-2 focus:ring-[#313131]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="text-[#4F6F52]">
              <p>
                Forgot password? {" "} 
                <Link href="/" className="text-[#313131] font-semibold hover:underline">
                  Click Here
                </Link>
              </p>
              <p className="mt-1">
                Don't have an account? {" "} 
                <Link href="/auth/signup" className="text-[#313131] font-semibold hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <div className="flex justify-end mt-8">
              {/* 10% Accent Color */}
              <button
                type="submit"
                className="bg-[#313131] text-white font-bold py-3 px-6 rounded-md hover:bg-opacity-90 transition-all"
              >
                LOGIN
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Footer - 30% Secondary Color */}
      <footer className="bg-[#4F6F52] py-4 text-center text-white">
        <p>© 2025 AncesTREE</p>
      </footer>
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