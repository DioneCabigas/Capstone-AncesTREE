'use client'

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { User as UserIcon, X as XMark, Copy as CopyIcon } from 'lucide-react';

function InviteMembersModal({ groupId, existingMembers, currentUserId, onClose, onInviteSuccess }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  
  const [notification, setNotification] = useState({ message: '', type: '' });

  const BACKEND_BASE_URL = 'http://localhost:3001';

  // Helper to get initials for avatars
  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return 'N/A';
    return `${firstName ? firstName.charAt(0) : ''}${lastName ? lastName.charAt(0) : ''}`.toUpperCase();
  };

  // Display Notification (Removed after 3secs)
  const showNotification = (message, type) => {
    setNotification({ message, type });
    const timer = setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, 3000);
    return () => clearTimeout(timer);
  };

  // API Call for User Search
  const performSearch = useCallback(async (term) => {
    const trimmedTerm = term.trim();

    if (!trimmedTerm) {
      setSearchResults([]);
      setError('');
      return;
    }

    setError('');
    setSearchResults([]);

    try {
      const params = new URLSearchParams({
        search: trimmedTerm,
      });

      const res = await axios.get(`${BACKEND_BASE_URL}/api/search?${params.toString()}`);

      if (res.status === 200) {
        // Use .results as in the search page
        const results = res.data.results || [];
        // Filter out existing members and the current user
        const filteredResults = results.filter(user =>
          !existingMembers.includes(user.id) && user.id !== currentUserId
        );
        setSearchResults(filteredResults);
      } else {
        throw new Error(res.data?.message || `HTTP error! status: ${res.status}`);
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setError(err.response?.data?.message || 'Failed to retrieve search results. Please try again.');
    }
  }, [existingMembers, currentUserId]);

  // Live Search Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(searchTerm);
    }, 0);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, performSearch]);
  
  const isSearchCriteriaActive = searchTerm.trim() !== '';
  
  // Handles inviting existing users from search results
  const handleInviteUser = async (userId, userName) => {
  console.log("Inviting user:", userName);
  try {
    const response = await axios.post(`${BACKEND_BASE_URL}/api/group-invitation`, {
      groupId: groupId,
      senderId: currentUserId,
      receiverId: userId,
    });

    if (response.status === 200) {
      showNotification(`Invitation sent to ${userName}.`, 'success');
      onInviteSuccess();
      // Remove invited user from results
      setSearchResults(prev => prev.filter(user => user.id !== userId));
    } else {
      showNotification(response.data?.message || 'Failed to send invitation.', 'error');
    }
  } catch (err) {
    console.error('Error sending invitation:', err);
    showNotification(
      err.response?.data?.message || `Failed to invite ${userName}.`,
      'error'
    );
  }
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-auto p-6 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-3">
          <h3 className="text-2xl font-bold text-[#313131]">Invite Members</h3>
          <div className="flex items-center gap-4">
            <button
              // onClick={handleCopyInviteLink} // Removed onClick to make it static
              className="text-[#365643] flex items-center gap-1 text-sm font-medium cursor-default opacity-50" // Static styling
              title="Copy Invite Link (Functionality not active yet)"
            >
              <CopyIcon className="w-4 h-4" /> Copy Invite Link
            </button>
            <button
              onClick={onClose}
              className="text-[#808080] hover:text-[#313131]"
            >
              <XMark className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Notification Display */}
        {notification.message && (
          <div className={`p-3 mb-4 rounded-md text-center text-sm font-medium ${
            notification.type === 'success' ? 'bg-green-100 text-green-700' :
            notification.type === 'error' ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {notification.message}
          </div>
        )}

        {/* User Search + Email Invite */}
        <div className="mb-6 border-b border-[#D4D4D4] pb-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by first or last name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-[#D4D4D4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#4F6F52] text-[#313131]"
            />
            <button
              // onClick={handleEmailInvite} // Removed onClick to make it static
              className="bg-[#4F6F52] text-white px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 cursor-default opacity-50"
              title="Send Invite by Email"
            >
              Send Invite
            </button>
          </div>
          <p className="text-sm text-[#808080] mt-2">
            Users invited by email will receive a link to join this group. They must accept to become a member.
          </p>
        </div>

        {/* Search Results (Existing functionality) */}
        <div>
          <h4 className="text-xl font-semibold text-[#313131] mb-3">Results</h4>
          <div className="min-h-[120px] max-h-[300px] overflow-y-auto border border-[#D4D4D4] rounded-lg p-3">
            <ul className="space-y-2">
              {error && (
                <p className="text-red-500 text-center my-4">{error}</p>
              )}
              {searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <li key={user.id} className="flex items-center justify-between space-x-3 py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[rgba(79,111,82,0.1)] flex items-center justify-center flex-shrink-0">
                        {user.firstName || user.lastName ? (
                          <span className="text-[#313131] font-bold text-lg">
                            {getInitials(user.firstName, user.lastName)}
                          </span>
                        ) : (
                          <UserIcon className="text-[#808080] w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <span className="text-[#313131] font-medium block text-base">
                          {user.firstName} {user.lastName}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleInviteUser(user.id, `${user.firstName} ${user.lastName}`)}
                      className="bg-[#365643] text-white hover:bg-[#4F6F52] px-4 py-1.5 rounded-md text-sm font-medium flex-shrink-0"
                    >
                      Invite
                    </button>
                  </li>
                ))
              ) : (
                <div className="text-center text-[#808080] py-4">
                  {isSearchCriteriaActive ? (
                    <p>No user found.</p>
                  ) : (
                    ''
                  )}
                </div>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InviteMembersModal;
