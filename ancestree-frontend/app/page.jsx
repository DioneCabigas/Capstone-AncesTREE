import Navbar from '../components/Navbar';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative bg-dark-green min-h-screen overflow-hidden">
      <Navbar />

      <div className="relative z-10 flex flex-col items-center justify-center text-[var(--light-yellow)] h-[calc(100vh-60px)] md:h-[calc(100vh-72px)] text-center">
        <h1 className="text-[64px] font-semibold">
          Every Connection
        </h1>
        <h1 className="text-[64px] font-semibold">
           Brings You Closer
        </h1>
        <h2 className='text-[20px] mt-4'>
          Discover relatives, uncover shared roots,
        </h2>
        <h2 className='text-[20px] mb-8'>
          and strengthen family ties
        </h2>
        <Link href="/auth/signup" className="bg-[var(--white)] text-[var(--black)] font-medium py-3 px-8 rounded-full text-base hover:bg-[#D7D7D7] transition-colors">
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