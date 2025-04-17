'use client'

/**
 * Signup Page Component
 * 
 * This page allows users to create a new account.
 * It uses the AuthController with mode="REDIRECT" to prevent
 * authenticated users from accessing it.
 */

import Navbar from '../../../components/Navbar';
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from '@/app/utils/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import AuthController from '@/components/AuthController'; // Import the unified controller
import Link from "next/link";

/**
 * SignupContent Component
 * 
 * Contains the actual content of the signup page.
 */
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
    <div className="relative h-screen w-screen flex items-center justify-center">
      {/* Navbar */}
      <Navbar />

      {/* Signup Form */}
      <div className="relative z-10 bg-[rgba(26,51,36,0.8)] text-[var(--light-yellow)] border p-8 shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-10">GET STARTED</h2>
        <form className="space-y-4 flex flex-col" onSubmit={onSignup}>
          <div>
            <label htmlFor="email" className="block text-l font-semibold mb-2">
              Email Address:
            </label>
            <input
              type="email"
              id="email"
              className="bg-[var(--light-yellow)] text-[var(--dark-green)] w-full py-2 px-3 leading-tight"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="firstName" className="block text-l font-semibold mb-2">
              First Name:
            </label>
            <input
              type="text"
              id="firstName"
              className="bg-[var(--light-yellow)] text-[var(--dark-green)] w-full py-2 px-3 leading-tight"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-l font-semibold mb-2">
              Last Name:
            </label>
            <input
              type="text"
              id="lastName"
              className="bg-[var(--light-yellow)] text-[var(--dark-green)] w-full py-2 px-3 leading-tight"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-l font-semibold mb-2">
              Password:
            </label>
            <input
              type="password"
              id="password"
              className="bg-[var(--light-yellow)] text-[var(--dark-green)] w-full py-2 px-3 leading-tight"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-l font-semibold mb-2">
              Confirm Password:
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="bg-[var(--light-yellow)] text-[var(--dark-green)] w-full py-2 px-3 leading-tight"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <p className='mt-1'>
            Already have an account? {" "} <Link href="/auth/login" className="font-semibold hover:underline">Login</Link>
          </p>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {message && <p className="text-green-500 text-sm">{message}</p>}
          <div className="flex justify-end mt-5">
            <button
              type="submit"
              onClick={onSignup}
              className="font-bold py-2 px-4 border border-[var(--light-yellow)] hover:underline decoration-2 underline-offset-5"
            >
              SUBMIT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Signup Component (Main export)
 * 
 * This wraps the SignupContent component with the AuthController component
 * in REDIRECT mode to prevent authenticated users from accessing the signup page.
 */
export default function Signup() {
  return (
    <AuthController mode="REDIRECT">
      <SignupContent />
    </AuthController>
  );
}