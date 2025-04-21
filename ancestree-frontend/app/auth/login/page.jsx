'use client'

/**
 * Login Page Component - Redesigned with 60-30-10 Color Rule
 * 
 * 60% - Light Yellow (Background, main content areas)
 * 30% - Light Green (Secondary elements, header, footer)
 * 10% - Dark Green (Accents, important buttons, headings)
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
    <div className="relative min-h-screen bg-[var(--light-yellow)] flex flex-col">
      {/* Navbar - 30% Secondary Color */}
      <Navbar />

      {/* Main Content - 60% Dominant Color (light yellow background) */}
      <div className="flex-grow flex items-center justify-center px-4 py-10">
        {/* Login Form Card */}
        <div className="bg-white shadow-lg rounded-lg border border-[var(--light-green)] w-full max-w-md p-8">
          <h2 className="text-2xl font-bold mb-8 text-[var(--dark-green)]">WELCOME BACK!</h2>
          
          <form className="space-y-5" onSubmit={onLogin}>
            <div>
              <label htmlFor="email" className="block text-lg font-medium mb-2 text-[var(--light-green)]">
                Email Address:
              </label>
              <input
                type="email"
                id="email"
                className="bg-[var(--light-yellow)] text-[var(--dark-green)] w-full py-3 px-4 border border-[var(--light-green)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--dark-green)]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-lg font-medium mb-2 text-[var(--light-green)]">
                Password:
              </label>
              <input
                type="password"
                id="password"
                className="bg-[var(--light-yellow)] text-[var(--dark-green)] w-full py-3 px-4 border border-[var(--light-green)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--dark-green)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="text-[var(--light-green)]">
              <p>
                Forgot password? {" "} 
                <Link href="/" className="text-[var(--dark-green)] font-semibold hover:underline">
                  Click Here
                </Link>
              </p>
              <p className="mt-1">
                Don't have an account? {" "} 
                <Link href="/auth/signup" className="text-[var(--dark-green)] font-semibold hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <div className="flex justify-end mt-8">
              {/* 10% Accent Color */}
              <button
                type="submit"
                className="bg-[var(--dark-green)] text-[var(--light-yellow)] font-bold py-3 px-6 rounded-md hover:bg-opacity-90 transition-all"
              >
                LOGIN
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Footer - 30% Secondary Color */}
      <footer className="bg-[var(--light-green)] py-4 text-center text-[var(--light-yellow)]">
        <p>© 2025 Your Application Name</p>
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