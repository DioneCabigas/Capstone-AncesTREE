'use client'

import Navbar from '../../../components/Navbar';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/app/utils/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

import Link from "next/link";

export default function Login() {
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
        setError("Please verify your email before loggin in.")
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError ("An unknown error occurred, please try again.");
      }
    }
  };

  return (
    <div className="relative h-screen w-screen flex items-center justify-center">
      {/* Navbar */}
      <Navbar />

      {/* Login Form */}
      <div className="relative z-10 bg-[rgba(26,51,36,0.8)] text-[var(--light-yellow)] border p-8 shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-10">WELCOME BACK!</h2>
        <form className="space-y-4 flex flex-col" onSubmit={onLogin}>
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
            <label htmlFor="password" className="block text-l font-semibold mb-2 mt-5">
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
          <p className='mt-3'>
            Forgot password? {" "} <Link href="/" className="font-semibold hover:underline" >Click Here</Link>
          </p>
          {error && <p className="text-red-500 text-sm" >{error}</p>}
          <div className="flex justify-end mt-5">
            <button
              type="submit"
              onClick={onLogin}
              className=" font-bold py-2 px-4 border border-[var(--light-yellow)] hover:underline decoration-2 underline-offset-5"
            >
              LOGIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}