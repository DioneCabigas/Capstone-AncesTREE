// components/Navbar.jsx
import Image from 'next/image';
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-[rgba(26,51,36,0.5)] h-[85px] fixed w-full top-0 start-0 border-b border-[var(--light-yellow)] flex items-center ">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4 w-full">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/" className="flex items-center">
            <Image src="/images/smallLogo.png" className="h-auto max-h-[80px]" alt="AncesTREE Logo" width={200} height={350} />
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1 text-xl text-[var(--light-yellow)] ">
          <Link
            href="/"
            className="block py-2 px-3 rounded-sm hover:font-bold focus:font-bold focus:underline decoration-1 underline-offset-5"
            aria-current="page"
          >
            Home
          </Link>
          <Link
            href="/"
            className="block py-2 px-3 rounded-sm hover:font-bold focus:font-bold focus:underline decoration-1 underline-offset-5"
          >
            About
          </Link>
          <Link
            href="/"
            className="block py-2 px-3 rounded-sm hover:font-bold focus:font-bold focus:underline decoration-1 underline-offset-5"
          >
            Services
          </Link>
          <Link
            href="/"
            className="block py-2 px-3 rounded-sm hover:font-bold focus:font-bold focus:underline decoration-1 underline-offset-5"
          >
            Contact
          </Link>
        </div>

        {/* Buttons */}
        <div className="flex-shrink-0 flex md:order-2 space-x-3 rtl:space-x-reverse items-center">
          <Link
            href="/auth/signup"
            className="text-[var(--light-yellow)] bg-[var(--light-green)] hover:bg-[var(--dark-green)] hover:border-2 border-[var(--light-green)] rounded-sm font-medium text-xl px-4 py-2 text-center"
          >
            SIGN UP
          </Link>
          <Link
            href="/auth/login"
            className="text-[var(--light-yellow)] font-medium text-xl px-4 py-2 text-center hover:underline decoration-2 underline-offset-5"
          >
            LOGIN
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;