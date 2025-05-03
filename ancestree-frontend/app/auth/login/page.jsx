'use client'

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
        router.push("/home");
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
    <div className="flex min-h-screen">
      {/* Left side - Login form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-white px-4 md:px-8">
        <div className="w-full max-w-sm">
  
          <h2 className="text-4xl font-bold text-center mb-1"><span className="text-[#365643]">WELCOME</span> BACK!</h2>
          <p className="text-sm text-gray-500 text-center mb-6">Ready to manage your Family Tree again?</p>
  
          <form className="pt-6">
            <div className="mb-4">
              <label className="block text-gray-700 text-base mb-2">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-[#365643]"
                required
              />
            </div>
  
            <div className="mb-4">
              <label className="block text-gray-700 text-base mb-2">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-[#365643]"
                required
              />
            </div>
  
            <div className="text-right text-sm mb-6 pb-5">
              <a href="#" className="text-[#365643] hover:underline">Forgot Password?</a>
            </div>
  
            <button
              type="submit"
              className="w-full bg-[#365643] hover:bg-green-700 text-white py-2 px-4 rounded-md"
            >
              LOGIN
            </button>
  
            <p className="text-sm text-center mt-6 text-gray-700">
              Don’t have an account? <a href="/auth/signup" className="text-[#365643] hover:underline">Sign Up</a>
            </p>
          </form>
        </div>
      </div>
  
      {/* Right side - Background image */}
      <div
        className="hidden md:block md:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: `url('/forest.jpg')` }}
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
