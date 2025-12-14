'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, User as UserIcon, X as XMark, Loader2, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const filtersRef = useRef(null);
  
  const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

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
      setIsOpen(false);
      return;
    }

    if (trimmedTerm.length > 0 && trimmedTerm.length < 2 && !trimmedCity && !trimmedCountry) {
      setSearchResults([]);
      setError('');
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    setError('');
    setSearchResults([]);
    setIsLoading(true);
    setIsOpen(true);

    try {
      const params = new URLSearchParams({
        search: trimmedTerm,
        city: trimmedCity,
        country: trimmedCountry,
      });

      const res = await axios.get(`${BACKEND_BASE_URL}/api/search?${params.toString()}`);

      if (res.status === 200) {
        const results = res.data.results || [];
        // Filter on frontend for case-insensitive partial matches
        const filtered = results.filter(user => {
          const cityMatch = !trimmedCity || (user.cityAddress && user.cityAddress.toLowerCase().includes(trimmedCity.toLowerCase()));
          const countryMatch = !trimmedCountry || (user.countryAddress && user.countryAddress.toLowerCase().includes(trimmedCountry.toLowerCase()));
          return cityMatch && countryMatch;
        });
        setSearchResults(filtered);
      } else {
        throw new Error(res.data?.message || `HTTP error! status: ${res.status}`);
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setError(err.response?.data?.message || 'Failed to retrieve search results.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(searchTerm, cityFilter, countryFilter);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, cityFilter, countryFilter, performSearch]);

  // Close dropdown and filters when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowFilters(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClear = () => {
    setSearchTerm('');
    setCityFilter('');
    setCountryFilter('');
    setSearchResults([]);
    setError('');
    setIsLoading(false);
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleResultClick = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => (searchTerm.trim() || cityFilter.trim() || countryFilter.trim()) && setIsOpen(true)}
          className="block w-full pl-10 pr-16 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F6F52] focus:border-[#4F6F52] bg-white text-sm"
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {/* <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Toggle filters"
          >
            <Filter className={`h-4 w-4 ${showFilters ? 'text-[#4F6F52]' : 'text-gray-400'} hover:text-gray-600`} />
          </button> */}
          {searchTerm && (
            <button
              onClick={handleClear}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Clear search"
            >
              <XMark className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Inputs */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-white border border-gray-300 rounded-lg shadow-lg z-40">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                placeholder="Enter city..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4F6F52] focus:border-[#4F6F52] bg-white text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                placeholder="Enter country..."
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4F6F52] focus:border-[#4F6F52] bg-white text-sm"
              />
            </div>
            {(cityFilter || countryFilter) && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setCityFilter('');
                    setCountryFilter('');
                  }}
                  className="px-3 py-2 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className={`absolute left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden ${
          showFilters ? 'top-[120px] mt-1' : 'top-full mt-1'
        }`}>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-[#4F6F52]" />
              <span className="ml-2 text-sm text-gray-600">Searching...</span>
            </div>
          ) : error ? (
            <div className="px-4 py-3 text-red-600 text-sm">
              {error}
            </div>
          ) : searchResults.length === 0 && (searchTerm.trim() || cityFilter.trim() || countryFilter.trim()) ? (
            <div className="px-4 py-3 text-gray-500 text-sm">
              No users found
            </div>
          ) : searchResults.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </div>
              {searchResults.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile?userId=${user.id}`}
                  onClick={handleResultClick}
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-[rgba(79,111,82,0.05)] border-b border-gray-100 last:border-b-0"
                >
                  <div className="w-8 h-8 rounded-full bg-[rgba(79,111,82,0.1)] flex items-center justify-center flex-shrink-0">
                    {user.firstName || user.lastName ? (
                      <span className="text-[#313131] font-bold text-xs">
                        {getInitials(user.firstName, user.lastName)}
                      </span>
                    ) : (
                      <UserIcon className="text-gray-400 w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#313131] truncate">
                      {user.firstName} {user.lastName}
                    </div>
                    {(user.cityAddress || user.countryAddress) && (
                      <div className="text-xs text-gray-500 truncate">
                        {user.cityAddress && user.countryAddress
                          ? `${user.cityAddress}, ${user.countryAddress}`
                          : user.cityAddress || user.countryAddress}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}