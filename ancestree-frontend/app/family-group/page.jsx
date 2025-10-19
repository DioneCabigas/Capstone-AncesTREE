'use client'

import React, { useState, useEffect } from 'react';
import { Plus, X } from "lucide-react"
import { auth } from "@/app/utils/firebase";
import { onAuthStateChanged } from "firebase/auth";
import axios from 'axios';
import Link from 'next/link';
import Layout from '@/components/Layout';
import AuthController from '@/components/AuthController';

function FamilyGroup() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [familyGroups, setFamilyGroups] = useState([]);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const BACKEND_BASE_URL = 'http://localhost:3001';
  const API_FAMILY_GROUPS_PATH = '/api/family-groups';
  const API_FAMILY_GROUP_MEMBERS_PATH = '/api/family-group-members';

  const [userId, setUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [treeId, setTreeId] = useState('tempTreeId_123'); // Still using placeholder treeId for now
  const DESCRIPTION_CHAR_LIMIT = 70;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          axios.defaults.baseURL = BACKEND_BASE_URL;
          const response = await axios.get(`/api/user/${user.uid}`);
          if (response.data && response.data.firstName) {
            setCurrentUserName(response.data.firstName);
          } else {
            setCurrentUserName('User');
          }
        } catch (error) {
          console.error("Error fetching user's name:", error);
          setCurrentUserName('User');
          setApiError("Failed to fetch user's name for defaults.");
        }
      } else {
        setUserId(null);
        setCurrentUserName('');
        setIsLoading(false);
        setFamilyGroups([]);
        setApiError("Please log in to view and create family groups.");
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchFamilyGroups = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setApiError(null);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}${API_FAMILY_GROUPS_PATH}/user/${userId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      let groupsData = await response.json();

      // Fetch member count for each group
      const groupsWithMembers = await Promise.all(groupsData.map(async (group) => {
        try {
          // Call API to get Members
          const membersResponse = await axios.get(`${BACKEND_BASE_URL}${API_FAMILY_GROUP_MEMBERS_PATH}/group/${group.id}`);

          return { ...group, members: membersResponse.data.length };
        } catch (memberError) {
          console.error(`Error fetching members for group ${group.id}:`, memberError);
          // Set fallback to 1
          return { ...group, members: 1 };
        }
      }));

      const sortedData = groupsWithMembers.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt._seconds * 1000 + a.createdAt._nanoseconds / 1000000) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt._seconds * 1000 + b.createdAt._nanoseconds / 1000000) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setFamilyGroups(sortedData);
    } catch (error) {
      console.error("Error fetching family groups: ", error);
      setApiError(`Failed to load family groups: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyGroups();
  }, [userId]);

  const openCreateGroupModal = () => {
    if (!groupName.trim() && currentUserName) {
      setGroupName(`${currentUserName}'s Group`);
    } else if (!groupName.trim()) {
      setGroupName('User\'s Group');
    }

    if (!description.trim() && currentUserName) {
      setDescription(`Welcome to ${currentUserName}'s group.`);
    } else if (!description.trim()) {
      setDescription('Welcome to user\'s group.');
    }

    setIsModalOpen(true);
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      return;
    }
    if (!userId || !treeId) {
      setApiError("User ID or Tree ID is missing. Cannot create group.");
      return;
    }
    setIsConfirmationOpen(true);
  };

  const confirmCreateGroup = async () => {
    setIsConfirmationOpen(false);

    if (!userId || !treeId) {
      setApiError("User ID or Tree ID is missing. Cannot create group.");
      return;
    }

    let finalGroupName = groupName.trim();
    let counter = 1;

    while (familyGroups.some(group => group.name.toLowerCase() === finalGroupName.toLowerCase())) {
      finalGroupName = `${groupName.trim()} (${counter})`;
      counter++;
    }

    try {
      // Create the family group
      const createGroupResponse = await fetch(`${BACKEND_BASE_URL}${API_FAMILY_GROUPS_PATH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          treeId: treeId,
          name: finalGroupName,
          description: description,
        }),
      });

      if (!createGroupResponse.ok) {
        const errorData = await createGroupResponse.json();
        throw new Error(errorData.message || `HTTP error! status: ${createGroupResponse.status} for group creation`);
      }
      
      const newGroup = await createGroupResponse.json(); // Get the new group's data, including its ID

      // 2. Set Creator as Member with Owner role
      await fetch(`${BACKEND_BASE_URL}${API_FAMILY_GROUP_MEMBERS_PATH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          groupId: newGroup.id,
          role: 'Owner',
          status: 'accepted' //Default for creator
        }),
      });
      
      await fetchFamilyGroups();

      setIsModalOpen(false);
      setGroupName('');
      setDescription('');
      setApiError(null); // Clear any previous API errors
    } catch (error) {
      console.error("Error creating group or adding member: ", error);
      setApiError(`Failed to create group: ${error.message}`);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setIsConfirmationOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-white">
        <div className="m-auto max-w-7xl px-4 py-6">
        <div className="bg-white mt-18 rounded-lg p-8 mb-10 flex items-center justify-between shadow-md">
          <h2 className="text-3xl font-bold text-[#313131]">
            Family Group
          </h2>
          <button
            className="bg-[#365643] text-white hover:bg-[#4F6F52] px-4 py-2 rounded-md flex items-center gap-2 cursor-pointer"
            onClick={openCreateGroupModal}
          >
            <Plus className="w-4 h-4" />
            Create Group
          </button>
        </div>

        {apiError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {apiError}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setApiError(null)}>
              <X className="w-4 h-4" />
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-10 col-span-full">
            <p className="text-[#D9D9D9]">Loading family groups...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {familyGroups.length > 0 ? (
              familyGroups.map((group) => (
                <div key={group.id} className="bg-white rounded-lg py-4 px-6 shadow-md flex justify-between items-center min-h-[150px]">
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold text-[#313131] mb-2">{group.name}</h3>
                    <p className="text-[#808080] text-sm mb-2">
                      {group.description && group.description.length > DESCRIPTION_CHAR_LIMIT
                        ? `${group.description.substring(0, DESCRIPTION_CHAR_LIMIT)}...`
                        : group.description || ''}
                    </p>
                    {/* Set 1 as fallback */}
                    <p className="text-[#808080] text-sm">Members ({group.members || 1})</p>
                  </div>
                  <div className="flex gap-4">
                    <Link href={`/family-group/${group.id}`} passHref>
                      <button className="text-[#313131] text-sm hover:underline px-4 py-2 items-center cursor-pointer">
                        View Group
                      </button>
                    </Link>
                    <Link href={`/group-tree?treeId=${group.treeId}`}>
                      <button className="bg-[#365643] text-white text-sm hover:bg-[#4F6F52] px-4 py-2 rounded-md items-center cursor-pointer">View Tree</button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 col-span-full">
                <div className="border-2 border-dashed border-[#D9D9D9] rounded-lg py-10">
                  <Plus className="w-10 h-10 mx-auto text-[#D9D9D9] mb-4" />
                  <p className="text-[#D9D9D9]">No family groups to display</p>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-[#313131]">Create Group</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#D4D4D4] hover:text-[#808080]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <label htmlFor="groupName" className="block text-sm font-medium text-[#313131]">
                Group Name (Required) <span className="text-[#CB0404]">*</span>
              </label>
              <input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="mt-1 border border-[#D4D4D4] rounded-md shadow-sm py-2 px-3 w-full focus:outline-none focus:border-[#365643]"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="/description" className="block text-sm font-medium text-[#313131]">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter group description"
                className="mt-1 border border-[#D4D4D4] rounded-md shadow-sm py-2 px-3 w-full focus:outline-none focus:border-[#365643] min-h-[100px]"
              />
            </div>

            <div>
              <button
                onClick={handleCreateGroup}
                className={`bg-[#365643] text-white hover:bg-[#4F6F52] px-6 py-2 w-full rounded-md cursor-pointer ${
                  !groupName.trim() || !userId || !treeId ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!groupName.trim() || !userId || !treeId}
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfirmationOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex flex-col justify-center py-2">
              <h2 className="text-xl font-semibold text-[#313131] mb-4">Confirm Group Creation</h2>
              <p className="text-[#808080] text-center mb-4">
                Are you sure you want to create the group "{groupName}"?
              </p>
            </div>
            <div className="flex justify-end">
              <button
                className="bg-[#D4D4D4] hover:bg-[#808080] hover:text-white text-black py-2 px-4 rounded-md mr-2"
                onClick={() => setIsConfirmationOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-[#365643] text-white hover:bg-[#4F6F52] py-2 px-4 rounded-md"
                onClick={confirmCreateGroup}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// Wrap with AuthController to ensure only authenticated users can access
function FamilyGroupWithAuth() {
  return (
    <AuthController mode="PROTECT">
      <FamilyGroup />
    </AuthController>
  );
}

export default FamilyGroupWithAuth;
