'use client'

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

      // Send the registration data to the backend
      const registrationData = {
        uid: user.uid,
        email,
        firstName,
        lastName,
        middleName,
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
        // Contact fields
        contactNumber: '',
        telephoneNumber: '',
      };

      const response = await fetch('http://localhost:3001/api/user', {
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
      if (error.code === 'auth/email-already-in-use') {
        setError("This email is already in use. Please log in or reset your password.");
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred, please try again.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Signup form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-white px-4 md:px-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <Link href="/" className="flex justify-center items-center mb-6">
            <img src="/images/AncesTree_Logo.png" alt="AncesTREE Logo" width={135} height={40} />
          </Link>

          <h2 className="text-4xl font-bold text-center mb-1">
            <span className="text-[#365643]">GET</span> STARTED
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Create your account and grow your Family Tree!
          </p>

          <form className="pt-6" onSubmit={onSignup}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            {message && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{message}</span>
              </div>
            )}

            {/* First Name Field (now full width) */}
            <div className="mb-4">
              <label htmlFor="firstName" className="block text-gray-700 text-base mb-2">First Name</label>
              <input
                type="text"
                id="firstName"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-[#365643]"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            
            {/* Last Name Field */}
            <div className="mb-4">
              <label htmlFor="lastName" className="block text-gray-700 text-base mb-2">Last Name</label>
              <input
                type="text"
                id="lastName"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-[#365643]"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            {/* Email Field*/}
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-base mb-2">Email</label>
              <input
                type="email"
                id="email"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-[#365643]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 text-base mb-2">Password</label>
              <input
                type="password"
                id="password"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-[#365643]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Confirm Password Field */}
            <div className="mb-4 pb-3">
              <label htmlFor="confirmPassword" className="block text-gray-700 text-base mb-2">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-[#365643]"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#365643] hover:bg-[#294032] text-white py-2 px-4 rounded-md mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing Up...' : 'CREATE ACCOUNT'}
            </button>

            <p className="text-sm text-center mt-6 text-gray-700">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-[#365643] hover:underline font-semibold">Login</Link>
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

export default function Signup() {
  return (
    <AuthController mode="REDIRECT">
      <SignupContent />
    </AuthController>
  );
}