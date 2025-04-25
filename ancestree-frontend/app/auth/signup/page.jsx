'use client'

/**
 * Signup Page Component - Redesigned with 60-30-10 Color Rule
 * 
 * 60% - White (#FFFFFF) - Primary/dominant color
 * 30% - Light Green (#4F6F52) - Secondary color
 * 10% - Dark Gray (#313131) - Accent color
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSignup = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      setIsSubmitting(false);
      return;
    }

    try {
      const userCreds = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCreds.user;

      await sendEmailVerification(user);

      // 04/25/2025 - Send the registration data to the backend -Dione
      const registrationData = {
        uid: user.uid,
        firstName,
        lastName,
        email,
        middleName: '',
        suffix: '',
        birthDate: '',
        birthPlace: '',
        nationality: '',
        civilStatus: '',
        // Address fields
        streetAddress: '',
        cityAddress: '',
        provinceAddress: '',
        countryAddress: '',
        zipCode: '',
        // Contact fields (Wla nko gi apil diri ang email but part gihapon sya ari -Dione)
        contactNumber: '',
        telephoneNumber: '',
      };

      const response = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to complete registration.');
        setIsSubmitting(false);
        return;
      }

      setMessage(
        "Registration Successful! Please check your Email for verification."
      );

      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setIsSubmitting(false);

    } catch (error) {
      if(error instanceof Error){
        setError(error.message);
      } else {
        setError("An unknown error occurred, please try again.");
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex flex-col">
      {/* Navbar - 30% Secondary Color */}
      <Navbar />

      {/* Main Content - 60% Dominant Color (white background) */}
      <div className="flex-grow flex items-center justify-center px-4 py-10 content-container">
        {/* Signup Form Card */}
        <div className="bg-white shadow-lg rounded-lg border border-[#4F6F52] w-full max-w-md p-8">
          <h2 className="text-2xl font-bold mb-8 text-[#313131]">GET STARTED</h2>
          
          <form className="space-y-4" onSubmit={onSignup}>
            <div>
              <label htmlFor="email" className="block text-lg font-medium mb-2 text-[#313131]">
                Email Address:
              </label>
              <input
                type="email"
                id="email"
                className="bg-white text-[#313131] w-full py-2 px-4 border border-[#4F6F52] rounded-md focus:outline-none focus:ring-2 focus:ring-[#313131]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="firstName" className="block text-lg font-medium mb-2 text-[#313131]">
                First Name:
              </label>
              <input
                type="text"
                id="firstName"
                className="bg-white text-[#313131] w-full py-2 px-4 border border-[#4F6F52] rounded-md focus:outline-none focus:ring-2 focus:ring-[#313131]"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-lg font-medium mb-2 text-[#313131]">
                Last Name:
              </label>
              <input
                type="text"
                id="lastName"
                className="bg-white text-[#313131] w-full py-2 px-4 border border-[#4F6F52] rounded-md focus:outline-none focus:ring-2 focus:ring-[#313131]"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-lg font-medium mb-2 text-[#313131]">
                Password:
              </label>
              <input
                type="password"
                id="password"
                className="bg-white text-[#313131] w-full py-2 px-4 border border-[#4F6F52] rounded-md focus:outline-none focus:ring-2 focus:ring-[#313131]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-lg font-medium mb-2 text-[#313131]">
                Confirm Password:
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="bg-white text-[#313131] w-full py-2 px-4 border border-[#4F6F52] rounded-md focus:outline-none focus:ring-2 focus:ring-[#313131]"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <p className="text-[#313131]">
              Already have an account? {" "} 
              <Link href="/auth/login" className="text-[#313131] font-semibold hover:underline">
                Login
              </Link>
            </p>
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-500 text-sm">{message}</p>}
            
            <div className="flex justify-end mt-6">
              {/* 10% Accent Color */}
              <button
                type="submit"
                className="bg-[#4F6F52] text-white font-bold py-3 px-6 rounded-md hover:scale-105 transition-all"
                disabled={isSubmitting}
              >
                {/* SUBMIT */}
                {isSubmitting ? 'Signing Up...' : 'SUBMIT'}
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

export default function Signup() {
  return (
    <AuthController mode="REDIRECT">
      <SignupContent />
    </AuthController>
  );
}