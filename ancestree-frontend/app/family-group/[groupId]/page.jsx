'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import axios from 'axios';
import { ArrowLeft, Edit, User, Users, ChevronDown, Check, X as XMark } from 'lucide-react';
import { auth } from "@/app/utils/firebase";
import { onAuthStateChanged } from "firebase/auth";

function ViewGroupPage() {
  const { groupId } = useParams();
  const router = useRouter();
  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [members, setMembers] = useState([]);
  const [startingPerson, setStartingPerson] = useState('Loading...');
  const [isPrivate, setIsPrivate] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  const BACKEND_BASE_URL = 'http://localhost:3001';
  const API_FAMILY_GROUPS_PATH = '/api/family-groups';
  const API_FAMILY_GROUP_MEMBERS_PATH = '/api/family-group-members';

  // Function to get initials for avatars - temporary
  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return 'N/A';
    return `${firstName ? firstName.charAt(0) : ''}${lastName ? lastName.charAt(0) : ''}`.toUpperCase();
  };

  // useEffect to get current user's information
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        try {
          axios.defaults.baseURL = BACKEND_BASE_URL;
          const response = await axios.get(`${BACKEND_BASE_URL}/api/user/${user.uid}`);
          if (response.data && response.data.firstName) {
            setCurrentUserName(`${response.data.firstName} ${response.data.lastName || ''}`);
            setStartingPerson(`${response.data.firstName} ${response.data.lastName || ''}`);
          } else {
            setCurrentUserName('User');
            setStartingPerson('User');
          }
        } catch (error) {
          console.error("Error fetching current user's name:", error);
          setCurrentUserName('User');
          setStartingPerson('User');
        }
      } else {
        setCurrentUserId(null);
        setCurrentUserName('');
        setStartingPerson('Not logged in'); // Set to 'Not logged in' if no user
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!groupId) {
      setIsLoading(false);
      setError("Group ID is missing.");
      return;
    }

    const fetchGroupDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const groupResponse = await axios.get(`${BACKEND_BASE_URL}${API_FAMILY_GROUPS_PATH}/${groupId}`);
        if (groupResponse.status === 200) {
          setGroup(groupResponse.data);
          setEditedDescription(groupResponse.data.description || '');
        } else {
          throw new Error(`Failed to fetch group: ${groupResponse.statusText}`);
        }

        const membersResponse = await axios.get(`${BACKEND_BASE_URL}${API_FAMILY_GROUP_MEMBERS_PATH}/group/${groupId}`);
        if (membersResponse.status === 200) {
            const membersWithDetails = await Promise.all(
              membersResponse.data.map(async (member) => {
                try {
                    const userResponse = await axios.get(`${BACKEND_BASE_URL}/api/user/${member.userId}`);
                    return { ...member, userDetails: userResponse.data };
                } catch (userErr) {
                    console.warn(`Could not fetch details for member ${member.userId}:`, userErr);
                    return { ...member, userDetails: null };
                }
              })
            );
            setMembers(membersWithDetails);
        }

      } catch (err) {
        console.error("Error fetching group details:", err);
        setError(err.response?.data?.message || "Failed to load group details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupDetails();
  }, [groupId]);

  const handleDescriptionEdit = () => {
    setIsEditingDescription(true);
  };

  const handleDescriptionSave = async () => {
    try {
      await axios.put(`${BACKEND_BASE_URL}${API_FAMILY_GROUPS_PATH}/${groupId}`, {
        description: editedDescription,
      });
      setGroup(prevGroup => ({ ...prevGroup, description: editedDescription }));
      setIsEditingDescription(false);
    } catch (err) {
      console.error("Error saving description:", err);
      setError("Failed to save description. Please try again.");
    }
  };

  const handleDescriptionCancel = () => {
    setEditedDescription(group.description || '');
    setIsEditingDescription(false);
  };

  const handleTogglePrivacy = async () => {
    const newPrivacyStatus = !isPrivate;
    try {
      setIsPrivate(newPrivacyStatus);
    } catch (err) {
      console.error("Error updating privacy setting:", err);
      setError("Failed to update privacy setting.");
    }
  };

  // Function to handle group deletion
  const handleDeleteGroup = async () => {
    try {
      // Close the confirmation modal for deletion
      setShowDeleteConfirmModal(false);
      setIsLoading(true);

      // Call Delete API
      const response = await axios.delete(`${BACKEND_BASE_URL}${API_FAMILY_GROUPS_PATH}/${groupId}`);

      if (response.status === 200) {
        router.push('/family-group');
      } else {
        throw new Error(`Failed to delete group: ${response.statusText}`);
      }
    } catch (err) {
      console.error("Error deleting group:", err);
      setError(err.response?.data?.message || "Failed to delete group. Please try again.");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#D9D9D9]">Loading group details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-md flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <p className="text-[#808080] mb-4">Group not found.</p>
        <button
          onClick={() => router.back()}
          className="bg-[#365643] text-white hover:bg-[#4F6F52] px-4 py-2 rounded-md flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 py-10 pt-20">
        {/* Go Back button */}
        <div className="mt-18 mb-4">
          <button
            onClick={() => router.back()}
            className="text-[#313131] hover:underline flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-[#313131]">{group.name}</h1>
          <button className="bg-[#365643] text-white hover:bg-[#4F6F52] px-6 py-2 rounded-md flex items-center gap-2 cursor-pointer">
            View Tree
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column (Family Group Description, Settings) */}
          <div className="md:col-span-2 space-y-6">
            {/* Family Group Description */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[#313131]">Family Group Description</h2>
                {isEditingDescription ? (
                  <div className="flex gap-2">
                    <button onClick={handleDescriptionSave} className="text-[#365643] hover:text-[#4F6F52] flex items-center">
                      <Check className="w-5 h-5" /> Save
                    </button>
                    <button onClick={handleDescriptionCancel} className="text-red-500 hover:text-red-700 flex items-center">
                      <XMark className="w-5 h-5" /> Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={handleDescriptionEdit} className="text-[#313131] hover:text-[#4F6F52]">
                    <Edit className="w-5 h-5" />
                  </button>
                )}
              </div>
              {isEditingDescription ? (
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full h-32 p-3 border border-[#D9D9D9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#365643]"
                />
              ) : (
                <p className="text-[#808080] text-base leading-relaxed">
                  {group.description || 'No description provided for this family group.'}
                </p>
              )}
            </div>

            {/* Family Group Settings */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-semibold text-[#313131] mb-4">Family Group Settings</h2>

              <div className="flex justify-between items-center py-3 border-b border-[#F2F2F2]">
                <div>
                  <p className="text-[#313131] font-medium">Private</p>
                  <p className="text-[#808080] text-sm mt-1">
                    Only group Owner / Admins can send invites and create invite links
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    value=""
                    className="sr-only peer"
                    checked={isPrivate}
                    onChange={handleTogglePrivacy}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#365643]"></div>
                </label>
              </div>

              <div className="flex justify-between items-center py-3">
                <div>
                  <p className="text-[#313131] font-medium">Starting Person</p>
                  <p className="text-[#808080] text-sm mt-1">
                    This person appears in the root position when I view this group tree
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-[#F2F2F2] rounded-full px-4 py-2 cursor-pointer">
                  <User className="w-4 h-4 text-[#313131]" />
                  <span className="text-[#313131]">{startingPerson}</span>
                  <ChevronDown className="w-4 h-4 text-[#313131]" />
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  className="bg-red-500 text-white hover:bg-red-600 px-6 py-2 rounded-md"
                  onClick={() => console.log('Leave Group clicked')}
                >
                  Leave Group
                </button>
                <button
                  className="border border-red-500 text-red-500 hover:bg-red-50 px-6 py-2 rounded-md"
                  onClick={() => setShowDeleteConfirmModal(true)}
                >
                  Delete Group
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (Members) */}
          <div className="md:col-span-1 space-y-6">
            {/* Members */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[#313131]">Members ({members.length})</h2>
                <button className="bg-[#365643] text-white hover:bg-[#4F6F52] px-4 py-2 rounded-md text-sm">
                  Invite
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {members.length > 0 ? (
                  members.map((member) => (
                    <div key={member.id} className="flex flex-col items-center p-3 border border-[#F2F2F2] rounded-lg">
                      <div className="w-16 h-16 rounded-full bg-[rgba(79,111,82,0.1)] flex items-center justify-center mb-2">
                        <span className="text-[#313131] font-bold text-2xl">
                          {getInitials(member.userDetails?.firstName, member.userDetails?.lastName)}
                        </span>
                      </div>
                      <p className="text-[#313131] font-medium text-sm text-center">
                        {member.userDetails ? `${member.userDetails.firstName} ${member.userDetails.lastName}` : 'Unknown User'}
                      </p>
                      <p className="text-[#808080] text-xs text-center">{member.role}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[#808080] text-sm text-center col-span-2">No members yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-[#313131]">Confirm Deletion</h3>
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="text-[#808080] hover:text-[#313131]"
              >
                <XMark className="w-6 h-6" />
              </button>
            </div>
            <p className="text-[#808080] mb-6">
              Are you sure you want to delete the family group "{group.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 rounded-md border border-[#D9D9D9] text-[#313131] hover:bg-[#F2F2F2]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewGroupPage;
