'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/app/utils/firebase";
import AuthController from '@/components/AuthController';
import Link from "next/link";
import Image from "next/image"; // Assuming you want to include the logo

function ForgotPasswordContent() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
 
  const onSendResetEmail = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("If an account with that email exists, a password reset link has been sent to your inbox. Please check your spam folder if you don't see it.");
      setEmail(""); // Clear the email field on success
    } catch (error) {
      if (error.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred, please try again.");
      }
    } finally {
      setIsSubmitting(false); // Always reset submission
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Forgot Password form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-white px-4 md:px-8">
        <Link href="/" className="flex items-center mb-6">
          <Image src="/images/AncesTree_Logo.png" alt="Logo" width={135} height={40}/>
        </Link>

        <div className="w-full max-w-sm">
          <h2 className="text-4xl font-bold text-center mb-1">
            <span className="text-[#365643]">FORGOT</span> PASSWORD?
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Enter the email address associated with your AncesTREE account.
          </p>

          <form className="pt-6" onSubmit={onSendResetEmail}>
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
 
            <button
              type="submit"
              className="w-full bg-[#365643] hover:bg-[#294032] text-white py-2 px-4 rounded-md mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'CONTINUE'}
            </button>
 
            <p className="text-sm text-center mt-6 text-gray-700">
              Remember your password?{" "}
              <Link href="/auth/login" className="text-[#365643] hover:underline font-semibold">Log In</Link>
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

export default function ForgotPassword() {
  return (
    <AuthController mode="REDIRECT">
      <ForgotPasswordContent />
    </AuthController>
  );
}