'use client'

/**
 * Signup Page Component - Redesigned with 60-30-10 Color Rule
 * 
 * 60% - Light Yellow (Background, main content areas)
 * 30% - Light Green (Secondary elements, header, footer)
 * 10% - Dark Green (Accents, important buttons, headings)
 */

import Navbar from '../../../components/Navbar';
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from '@/app/utils/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import AuthController from '@/components/AuthController';
import Link from "next/link";

function SignupContent() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const onSignup = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const userCreds = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCreds.user;

      await sendEmailVerification(user);

      localStorage.setItem(
        "registrationData",
        JSON.stringify({
          firstName,
          lastName,
          email,
        })
      );

      setMessage(
        "Registration Successful! Please check your Email for verification."
      );

      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

    } catch (error) {
      if(error instanceof Error){
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
        {/* Signup Form Card */}
        <div className="bg-white shadow-lg rounded-lg border border-[var(--light-green)] w-full max-w-md p-8">
          <h2 className="text-2xl font-bold mb-8 text-[var(--dark-green)]">GET STARTED</h2>
          
          <form className="space-y-4" onSubmit={onSignup}>
            <div>
              <label htmlFor="email" className="block text-lg font-medium mb-2 text-[var(--light-green)]">
                Email Address:
              </label>
              <input
                type="email"
                id="email"
                className="bg-[var(--light-yellow)] text-[var(--dark-green)] w-full py-2 px-4 border border-[var(--light-green)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--dark-green)]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="firstName" className="block text-lg font-medium mb-2 text-[var(--light-green)]">
                First Name:
              </label>
              <input
                type="text"
                id="firstName"
                className="bg-[var(--light-yellow)] text-[var(--dark-green)] w-full py-2 px-4 border border-[var(--light-green)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--dark-green)]"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-lg font-medium mb-2 text-[var(--light-green)]">
                Last Name:
              </label>
              <input
                type="text"
                id="lastName"
                className="bg-[var(--light-yellow)] text-[var(--dark-green)] w-full py-2 px-4 border border-[var(--light-green)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--dark-green)]"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
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
                className="bg-[var(--light-yellow)] text-[var(--dark-green)] w-full py-2 px-4 border border-[var(--light-green)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--dark-green)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-lg font-medium mb-2 text-[var(--light-green)]">
                Confirm Password:
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="bg-[var(--light-yellow)] text-[var(--dark-green)] w-full py-2 px-4 border border-[var(--light-green)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--dark-green)]"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <p className="text-[var(--light-green)]">
              Already have an account? {" "} 
              <Link href="/auth/login" className="text-[var(--dark-green)] font-semibold hover:underline">
                Login
              </Link>
            </p>
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-500 text-sm">{message}</p>}
            
            <div className="flex justify-end mt-6">
              {/* 10% Accent Color */}
              <button
                type="submit"
                className="bg-[var(--dark-green)] text-[var(--light-yellow)] font-bold py-3 px-6 rounded-md hover:bg-opacity-90 transition-all"
              >
                SUBMIT
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

export default function Signup() {
  return (
    <AuthController mode="REDIRECT">
      <SignupContent />
    </AuthController>
  );
}