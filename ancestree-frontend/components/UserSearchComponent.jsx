'use client'

/**
 * UserSearch Component - Designed with 60-30-10 Color Rule
 * 
 * 60% - White (#FFFFFF) - Primary/dominant color
 * 30% - Light Green (#4F6F52) - Secondary color
 * 10% - Dark Gray (#313131) - Accent color
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/app/utils/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import Navbar from '../../../components/Navbar';
import { Search, User } from 'lucide-react';
import AuthController from '@/components/AuthController';

function UserSearchPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  // Fetch current user on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Handle search submission
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }
    
    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    
    try {
      // Split the search query into terms
      const terms = searchQuery.toLowerCase().trim().split(/\s+/);
      
      // Create a query to search for users by first name OR last name
      const usersRef = collection(db, "users");
      
      // In a real app, you'd want to use a more sophisticated search mechanism
      // For simplicity, we'll just get all users and filter client-side
      const querySnapshot = await getDocs(usersRef);
      
      const results = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        const userId = doc.id;
        
        // Skip the current user in results
        if (userId === currentUser?.uid) {
          return;
        }
        
        const firstName = (userData.firstName || "").toLowerCase();
        const lastName = (userData.lastName || "").toLowerCase();
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        
        // Check if any search term is included in the user's name
        const matchesSearch = terms.some(term => 
          firstName.includes(term) || 
          lastName.includes(term) || 
          fullName.includes(term)
        );
        
        if (matchesSearch) {
          results.push({
            id: userId,
            ...userData
          });
        }
      });
      
      setSearchResults(results);
      
      if (results.length === 0) {
        setError("No users found matching your search.");
      }
    } catch (error) {
      console.error("Error searching for users:", error);
      setError("An error occurred while searching. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };
  
  // Navigate to a user's profile
  const viewUserProfile = (userId) => {
    router.push(`/auth/profile?userId=${userId}`);
  };
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="container mx-auto pt-20 px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#313131] mb-2">Find People</h1>
            <p className="text-[#4F6F52]">Search for other users by name</p>
          </div>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex w-full border-2 border-[#4F6F52] rounded-lg overflow-hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="flex-grow px-4 py-3 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="bg-[#4F6F52] text-white px-6 py-3 flex items-center gap-2 hover:bg-opacity-90 transition-colors"
              >
                <Search size={20} />
                <span>{isSearching ? "Searching..." : "Search"}</span>
              </button>
            </div>
          </form>
          
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-white border border-[#4F6F52] rounded-lg overflow-hidden">
              <h2 className="bg-[#4F6F52] text-white px-6 py-3">
                Search Results ({searchResults.length})
              </h2>
              
              <div className="divide-y divide-gray-100">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 hover:bg-[rgba(79,111,82,0.05)]">
                    <div className="flex items-center">
                      {/* User Avatar */}
                      <div className="w-12 h-12 rounded-full bg-[rgba(79,111,82,0.1)] text-[#313131] flex items-center justify-center mr-4">
                        <span className="text-xl font-bold">
                          {user.firstName ? user.firstName.charAt(0) : ""}
                          {user.lastName ? user.lastName.charAt(0) : ""}
                        </span>
                      </div>
                      
                      {/* User Info */}
                      <div>
                        <p className="font-medium text-[#313131]">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="space-x-2">
                      <button
                        onClick={() => viewUserProfile(user.id)}
                        className="px-4 py-2 bg-[#313131] text-white text-sm rounded hover:bg-opacity-90 inline-flex items-center gap-1"
                      >
                        <User size={16} />
                        <span>View Profile</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UserSearch() {
  return (
    <AuthController mode="PROTECT">
      <UserSearchPage />
    </AuthController>
  );
}