'use client';

import React from 'react';
import { X, Check, User } from 'lucide-react';
import axios from 'axios';

const MergeRequestsModal = ({ isOpen, onClose, groupId, mergeRequests, onRequestHandled, currentUserId }) => {
  const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
  if (!isOpen) return null;

  const handleApprove = async (requestId) => {
    try {
      await axios.patch(`${BACKEND_BASE_URL}/api/merge-requests/${requestId}/status`, {
        status: 'approved',
        reviewedBy: currentUserId
      });
      onRequestHandled();
    } catch (error) {
      console.error('Error approving merge request:', error);
      alert('Failed to approve merge request');
    }
  };

  const handleDeny = async (requestId) => {
    try {
      await axios.patch(`${BACKEND_BASE_URL}/api/merge-requests/${requestId}/status`, {
        status: 'denied',
        reviewedBy: currentUserId
      });
      onRequestHandled();
    } catch (error) {
      console.error('Error denying merge request:', error);
      alert('Failed to deny merge request');
    }
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return 'N/A';
    return `${firstName ? firstName.charAt(0) : ''}${lastName ? lastName.charAt(0) : ''}`.toUpperCase();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#313131]">
            Merge Requests ({mergeRequests.length})
          </h2>
          <button
            onClick={onClose}
            className="text-[#808080] hover:text-[#313131]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {mergeRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#808080] text-lg">No pending merge requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mergeRequests.map((request) => (
                <div key={request.id} className="border border-[#F2F2F2] rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-[rgba(79,111,82,0.1)] flex items-center justify-center">
                        <span className="text-[#313131] font-bold text-lg">
                          {getInitials(
                            request.requesterDetails?.firstName,
                            request.requesterDetails?.lastName
                          )}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#313131]">
                          {request.requesterName}
                        </h3>
                        <p className="text-[#808080] text-sm">
                          Requested to merge their tree with the group tree
                        </p>
                        <p className="text-[#808080] text-xs mt-1">
                          Requested on {formatDate(request.requestedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="bg-[#365643] text-white hover:bg-[#4F6F52] px-4 py-2 rounded-md flex items-center space-x-2 text-sm"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleDeny(request.id)}
                        className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-md flex items-center space-x-2 text-sm"
                      >
                        <X className="w-4 h-4" />
                        <span>Deny</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MergeRequestsModal;
