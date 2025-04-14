// components/Navbar.jsx
import Image from 'next/image';
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-[rgba(26,51,36)] h-[85px] fixed w-full top-0 start-0 border-b border-[var(--light-yellow)] flex items-center ">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4 w-full">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/" className="flex items-center">
            <Image src="/images/smallLogo.png" className="h-auto max-h-[80px]" alt="AncesTREE Logo" width={200} height={350} />
          </Link>
        </div>
        
        {/* Buttons */}
        <div className="flex-shrink-0 flex md:order-2 space-x-3 rtl:space-x-reverse items-center">
          <Link 
          href="/auth/signup"
            className="text-[var(--light-yellow)] bg-[var(--light-green)] font-medium text-l px-4 py-2 text-center hover:underline decoration-2 underline-offset-5"
          >
            SIGN UP
          </Link>
          <Link
            href="/auth/login"
            className="text-[var(--light-yellow)] font-medium text-l px-4 py-2 text-center hover:underline decoration-2 underline-offset-5"
          >
            LOGIN
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;