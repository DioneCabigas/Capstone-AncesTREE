'use client'

import Navbar from '../../components/Navbar';
import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { FaUserCircle } from 'react-icons/fa'; // Import a user icon

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
      const searchTokens = searchTermLower.split(' ').filter(token => token !== ''); // Split search term into words

      const querySnapshot = await getDocs(usersRef);
      const allUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const filteredResults = allUsers.filter(user => {
        const firstNameLower = user.firstName.toLowerCase();
        const lastNameLower = user.lastName.toLowerCase();

        // Check if all search tokens are found in either the first or last name
        return searchTokens.every(token => firstNameLower.includes(token) || lastNameLower.includes(token));
      });

      let results = filteredResults;

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
    <div className="min-h-screen bg-[#F4F4F4]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white mt-18 rounded-lg p-12 mb-10">
          <h2 className="text-2xl font-bold mb-6 text-[#313131]">User Search</h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search by first or last name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-3 w-full border border-[#313131] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
            />
            <input
              type="text"
              placeholder="Filter by City"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="p-3 w-full border border-[#313131] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
            />
            <input
              type="text"
              placeholder="Filter by Country"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="p-3 w-full border border-[#313131] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F6F52] mb-5"
            />
          </div>

          {loading && <p style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold', color: '#365643' }}>Searching...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}

          <div><h2 className="text-2xl font-bold mb-4 mt-5 text-[#313131]">Results</h2></div>
          <div className="">
            <ul className="space-y-3">
              {searchResults.map((user) => (
                <li key={user.id} className="flex items-center space-x-4 py-3 border-b border-[#808080]">
                  <div className="rounded-full w-12 h-12 flex items-center justify-center">
                    <FaUserCircle className="text-[#808080]" size={100} />
                  </div>
                  <div>
                    <a
                      href={`/profile?userId=${user.id}`}
                      className="text-[#313131] hover:underline font-medium block"
                    >
                      {user.firstName} {user.lastName}
                    </a>
                    <p className="text-[#808080] text-sm">
                      {user.cityAddress ? `${user.cityAddress}, ` : ''}
                      {user.countryAddress ? user.countryAddress : ''}
                      {!user.cityAddress && !user.countryAddress ? '' : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            {searchResults.length === 0 && !loading && searchTerm.trim() !== '' && (
              <p className="text-[#FF0000] mt-4">No results found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchUsers;