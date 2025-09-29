'use client'

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/app/utils/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  User, 
  TreePine, 
  Users, 
  ImageIcon,
  Settings,
  LogOut,
  ChevronUp,
  ChevronDown
} from "lucide-react";

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ firstName: "" });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Get user data for display
      if (currentUser) {
        try {
          // Try to get firstName from localStorage first (faster)
          const storedFirstName = localStorage.getItem('userFirstName');
          if (storedFirstName) {
            setUserData(prev => ({ ...prev, firstName: storedFirstName }));
          }
        } catch (error) {
          console.error('Error getting user data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle clicks outside user menu dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      setUserMenuOpen(false);
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // Don't show sidebar for non-authenticated users
  if (!user) {
    return null;
  }

  const navigationItems = [
    {
      name: "Profile",
      href: "/profile",
      icon: User,
      description: "View and edit your profile"
    },
    {
      name: "Family Tree", 
      href: `/personal-tree?uid=${user.uid}`,
      icon: TreePine,
      description: "Explore your family tree"
    },
    {
      name: "Family Group",
      href: "/family-group", 
      icon: Users,
      description: "Manage family groups"
    },
    {
      name: "Gallery",
      href: "/gallery",
      icon: ImageIcon, 
      description: "View family photos"
    }
  ];

  const isActiveLink = (href) => {
    if (href.includes('personal-tree')) {
      return pathname.includes('personal-tree');
    }
    return pathname === href;
  };

  // Get the display name for the user
  const getDisplayName = () => {
    if (userData.firstName) {
      return userData.firstName;
    }
    if (user && user.displayName) {
      return user.displayName.split(' ')[0];
    }
    return "User";
  };

  // Get the initial for the avatar
  const getInitial = () => {
    if (userData.firstName) {
      return userData.firstName.charAt(0).toUpperCase();
    }
    if (user && user.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    if (user && user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="fixed left-0 top-15 h-[calc(100vh-4rem)] w-64 bg-white border-r-2 border-gray-200 z-[30] flex flex-col">
      {/* Spacer to account for navbar height */}

      {/* Navigation Links */}
      <nav className="flex-1 mt-4">
        <ul className="space-y-2 px-3">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group ${
                  isActiveLink(item.href)
                    ? 'bg-[#4F6F52] text-white'
                    : 'text-[#313131] hover:bg-[#4F6F52] hover:text-white'
                }`}
              >
                <item.icon 
                  size={20} 
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{item.name}</div>
                  <div className={`text-xs opacity-75 ${
                    isActiveLink(item.href) ? 'text-white' : 'text-gray-500'
                  } group-hover:text-white`}>
                    {/* {item.description} */}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section - User Menu with Dropdown */}
      <div className="border-t border-gray-200 p-4 relative" ref={userMenuRef}>
        {/* User Menu Button */}
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center space-x-3 w-full p-2 rounded-lg transition-colors hover:bg-gray-100 group"
        >
          <div className="w-10 h-10 rounded-full bg-[#4F6F52] text-white flex items-center justify-center font-bold">
            {getInitial()}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-medium text-[#313131] truncate">
              {getDisplayName()}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {user?.email || 'user@example.com'}
            </div>
          </div>
          {userMenuOpen ? (
            <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
          )}
        </button>

        {/* Dropdown Menu */}
        {userMenuOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
            <Link
              href="/settings"
              onClick={() => setUserMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 transition-colors ${
                pathname === '/settings' ? 'bg-[#4F6F52] text-white hover:bg-[#4F6F52]' : 'text-[#313131]'
              }`}
            >
              <Settings size={18} className="flex-shrink-0" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 hover:text-red-600 transition-colors text-[#313131] w-full text-left"
            >
              <LogOut size={18} className="flex-shrink-0" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}