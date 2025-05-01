import Navbar from '../components/Navbar';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative bg-dark-green min-h-screen overflow-hidden">
      <Navbar />

      <div className="relative z-10 flex flex-col items-center justify-center text-[var(--light-yellow)] h-[calc(100vh-60px)] md:h-[calc(100vh-72px)] text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-light-yellow mb-10">
          Welcome to
        </h1>
        <h2 className="text-7xl md:text-9xl font-bold text-light-yellow mb-30">
          AncesTREE
        </h2>
        <Link href="/auth/signup" className="bg-[var(--light-yellow)] text-[var(--dark-green)] font-bold py-3 px-8 rounded-full text-xl">
          GET STARTED
        </Link>
      </div>
    </div>
  );
}

// TO RUN THE FRONTEND
// 1. "cd app"
// 2. "npm run dev"

// IF IT FAILS
// DO "npm install" to install the new dependencies