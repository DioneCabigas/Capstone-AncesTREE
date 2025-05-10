'use client'

import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, startAt, endAt } from 'firebase/firestore';
import { db } from '../utils/firebase';

function SearchUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (term) => {
    setLoading(true);
    setError('');
    setSearchResults([]);
  
    if (!term.trim()) {
      setLoading(false);
      return;
    }
  
    try {
      const usersRef = collection(db, 'users');
      const searchTermLower = term.toLowerCase().trim();
  
      const firstNameQuery = query(
        usersRef,
        orderBy('firstName')
      );
  
      const lastNameQuery = query(
        usersRef,
        orderBy('lastName')
      );
  
      const [firstNameSnapshot, lastNameSnapshot] = await Promise.all([
        getDocs(firstNameQuery),
        getDocs(lastNameQuery),
      ]);
  
      const resultsMap = new Map();
  
      // First Name Filtering
      firstNameSnapshot.docs.forEach(doc => {
        const firstName = doc.data().firstName.toLowerCase();
        if (firstName.includes(searchTermLower)) {
          resultsMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });
  
      // Last Name Filtering
      lastNameSnapshot.docs.forEach(doc => {
        const lastName = doc.data().lastName.toLowerCase();
        if (lastName.includes(searchTermLower)) {
          resultsMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });
  
      let results = Array.from(resultsMap.values());
  
      // Manual filtering by City
      if (cityFilter.trim()) {
        const cityFilterLower = cityFilter.toLowerCase();
        results = results.filter(user =>
          user.cityAddress?.toLowerCase() === cityFilterLower
        );
      }
  
      // Manual filtering by Country
      if (countryFilter.trim()) {
        const countryFilterLower = countryFilter.toLowerCase();
        results = results.filter(user =>
          user.countryAddress?.toLowerCase() === countryFilterLower
        );
      }
  
      setSearchResults(results);
  
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to retrieve search results.');
    } finally {
      setLoading(false);
    }
  };
  

  // Live search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchTerm);
    }, 200); // 200ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, cityFilter, countryFilter]); 

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg border border-[#4F6F52] p-8 mb-10">
        <h2 className="text-2xl font-bold mb-6 text-black">USER SEARCH</h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search by first or last name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-3 w-full border border-[#4F6F52] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
          />
          <input
            type="text"
            placeholder="Filter by City"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="p-3 w-full border border-[#4F6F52] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
          />
          <input
            type="text"
            placeholder="Filter by Country"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="p-3 w-full border border-[#4F6F52] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52] mb-5"
          />
        </div>

          {loading && <p>Searching...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          
        </div>
        <div className="justify-center items-center place-items-center">
          <ul className="">
              {searchResults.map((user) => (
                <li key={user.id}>
                  <a
                    href={`/profile?userId=${user.id}`}
                    className="text-[#4F6F52] hover:underline font-medium"
                  >
                    {user.firstName} {user.lastName} ({user.cityAddress}, {user.countryAddress})
                  </a>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SearchUsers;