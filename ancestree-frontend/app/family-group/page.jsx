'use client'

import Navbar from '@/components/Navbar';
import React, { useState } from 'react';
import { Plus, X } from "lucide-react"

function FamilyGroup() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [familyGroups, setFamilyGroups] = useState([]);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      return;
    }
    setIsConfirmationOpen(true);
  };

  const confirmCreateGroup = () => {
  let uniqueName = groupName;
  let counter = 1;

  // Ensure unique name
  while (familyGroups.some(group => group.name.toLowerCase() === uniqueName.toLowerCase())) {
    counter++;
    uniqueName = `${groupName} (${counter})`;
  }

  setFamilyGroups([...familyGroups, {
    name: uniqueName,
    members: 1,
  }]);

  setIsModalOpen(false);
  setIsConfirmationOpen(false);
  setGroupName('');
  setDescription('');
};

// Allow "Esc" key to close Modal
React.useEffect(() => {
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
    <div className="min-h-screen bg-white">
    <Navbar/>
      <div className="m-auto max-w-7xl px-4 py-10">
        <div className="bg-white rounded-lg p-8 mb-10 flex items-center justify-between shadow-md">
          <h2 className="text-3xl font-bold text-[#313131]">
            Family Group
          </h2>
          <button
            className="bg-[#365643] text-white hover:bg-[#4F6F52] px-4 py-2 rounded-md flex items-center gap-2 cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Create Group
          </button>
        </div>
        {/* Display Family Group List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {familyGroups.length > 0 ? (
            familyGroups.map((group, index) => (
              <div key={index} className="bg-white rounded-lg py-4 px-6 shadow-md flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-[#313131] mb-2">{group.name}</h3>
                  <p className="text-[#808080] text-sm mb-4">Members ({group.members})</p>
                </div>
                <div className="flex gap-4">
                  <button className="text-[#313131] text-sm hover:underline px-4 py-2 items-center cursor-pointer">View Group</button>
                  <button className="bg-[#365643] text-white text-sm hover:bg-[#4F6F52] px-4 py-2 rounded-md items-center cursor-pointer">View Tree</button>
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
      </div>

      {/* Modal for Creating Group */}
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
              <label htmlFor="description" className="block text-sm font-medium text-[#313131]">
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
                className={`bg-[#365643] text-white hover:bg-[#4F6F52] px-6 py-2 w-full rounded-md cursor-pointer ${!groupName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!groupName.trim()}
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
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
    </div>
  );
}

export default FamilyGroup;