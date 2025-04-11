'use client'

import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { app } from '@/app/utils/firebase'

export default function Signup() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    
  };

  return (
    <div className="relative h-screen w-screen flex items-center justify-center">
      {/* Navbar */}
      <Navbar />

      {/* Signup Form */}
      <div className="relative z-10 bg-[rgba(26,51,36,0.8)] text-[var(--light-yellow)] border p-8 shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-10">GET STARTED</h2>
        <form className="space-y-4 flex flex-col" onSubmit={handleSubmit}>
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
            />
          </div>
          <div className="flex justify-end mt-5">
            <button
              type="submit"
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