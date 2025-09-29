'use client'

import Layout from '../../components/Layout';
import AuthController from '@/components/AuthController';
import { useState, useEffect, useCallback } from 'react';
import { User as UserIcon, X as XMark, Loader2 } from 'lucide-react';
import axios from 'axios';

function SearchUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const BACKEND_BASE_URL = 'http://localhost:3001';

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return 'N/A';
    return `${firstName ? firstName.charAt(0) : ''}${lastName ? lastName.charAt(0) : ''}`.toUpperCase();
  };

  const performSearch = useCallback(async (term, city, country) => {
    const trimmedTerm = term.trim();
    const trimmedCity = city.trim();
    const trimmedCountry = country.trim();

    if (!trimmedTerm && !trimmedCity && !trimmedCountry) {
      setSearchResults([]);
      setError('');
      setIsLoading(false);
      return;
    }

    setError('');
    setSearchResults([]);
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        search: trimmedTerm,
        city: trimmedCity,
        country: trimmedCountry,
      });

      const res = await axios.get(`${BACKEND_BASE_URL}/api/search?${params.toString()}`);

      if (res.status === 200) {
        // ⬅️ ACCESS `.results` inside the returned object
        setSearchResults(res.data.results || []);
      } else {
        throw new Error(res.data?.message || `HTTP error! status: ${res.status}`);
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setError(err.response?.data?.message || 'Failed to retrieve search results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(searchTerm, cityFilter, countryFilter);
    }, 100);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, cityFilter, countryFilter, performSearch]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setCityFilter('');
    setCountryFilter('');
    setSearchResults([]);
    setError('');
    setIsLoading(false);
  };

  const isSearchCriteriaActive = searchTerm.trim() !== '' || cityFilter.trim() !== '' || countryFilter.trim() !== '';

  return (
    <Layout>
      <div className="min-h-screen bg-[#F4F4F4]">
        <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white mt-18 rounded-lg p-8 md:p-12 mb-10 shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-[#313131]">User Search</h2>

          <div className="space-y-4 mb-6">
            <input
              type="text"
              placeholder="Search by first or last name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-3 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F6F52] text-[#313131]"
            />
            <input
              type="text"
              placeholder="Filter by City (Optional)"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="p-3 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F6F52] text-[#313131]"
            />
            <input
              type="text"
              placeholder="Filter by Country (Optional)"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="p-3 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F6F52] text-[#313131]"
            />
            <button
              onClick={handleClearFilters}
              className="w-full bg-gray-200 text-[#313131] hover:bg-gray-300 px-4 py-2 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <XMark className="w-5 h-5" /> Clear All
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-center my-4">{error}</p>
          )}

          <h2 className="text-2xl font-bold mb-4 mt-5 text-[#313131]">Results</h2>
          <div className="min-h-[150px]">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-[#4F6F52]" />
                <p className="ml-2 text-[#808080]">Searching...</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {searchResults.map((user) => (
                  <li key={user.id} className="flex items-center space-x-4 py-3 border-b border-gray-200 last:border-b-0">
                    <div className="w-12 h-12 rounded-full bg-[rgba(79,111,82,0.1)] flex items-center justify-center flex-shrink-0">
                      {user.firstName || user.lastName ? (
                        <span className="text-[#313131] font-bold text-xl">
                          {getInitials(user.firstName, user.lastName)}
                        </span>
                      ) : (
                        <UserIcon className="text-[#808080] w-8 h-8" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <a
                        href={`/profile?userId=${user.id}`}
                        className="text-[#313131] hover:underline font-medium block text-md"
                      >
                        {user.firstName} {user.lastName}
                      </a>
                      <p className="text-[#808080] text-sm">
                        {user.cityAddress && user.countryAddress
                          ? `${user.cityAddress}, ${user.countryAddress}`
                          : user.cityAddress || user.countryAddress || ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {!isLoading && searchResults.length === 0 && isSearchCriteriaActive && (
              <p className="text-red-500 text-center mt-4">No results found for your search criteria.</p>
            )}
            {!isLoading && searchResults.length === 0 && !isSearchCriteriaActive && (
              <p className="text-[#808080] text-center mt-4">Start typing to search for users.</p>
            )}
          </div>
        </div>
        </div>
      </div>
    </Layout>
  );
}

// Wrap with AuthController to ensure only authenticated users can access
function SearchUsersWithAuth() {
  return (
    <AuthController mode="PROTECT">
      <SearchUsers />
    </AuthController>
  );
}

export default SearchUsersWithAuth;
