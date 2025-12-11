'use client';

import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CircleAlert, Edit, X } from "lucide-react";
import { useState, useEffect } from "react";
import axios from 'axios';
import { getAuth, onAuthStateChanged, updatePassword, deleteUser } from "firebase/auth";
import { useRouter } from 'next/navigation';

function Settings() {
  const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
  const auth = getAuth();
  const user = auth.currentUser;
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialFetchLoading, setInitialFetchLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Notifications
  const [familyGroups, setFamilyGroups] = useState(true);
  const [connectRequests, setConnectRequests] = useState(true);

  // Permissions
  const [allowView, setAllowView] = useState(true);
  const [appearInSearch, setAppearInSearch] = useState(true);

  // Save email and password only
  const handleAccountSave = async () => {
    try {
      if (!user) return;
      setLoading(true);

      const uid = user.uid;

      const res = await axios.post(`${BACKEND_BASE_URL}/api/user/`, {
        uid,
        email,
      });

      if (password) {
        await updatePassword(user, password);
        console.log("Password updated.");
      }

      console.log('Email/Password update success:', res.data.message);
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating email/password:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Save notifications and permissions only
  const handlePrefsSave = async () => {
    try {
      if (!user) {
        setErrorMessage('No user found. Please log in again.');
        return;
      }
      
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const uid = user.uid;

      const res = await axios.post(`${BACKEND_BASE_URL}/api/settings/user`, {
        uid,
        preferences: {
          familyGroups,
          connectRequests,
        },
        permissions: {
          allowView,
          appearInSearch,
        },
      });

      setSuccessMessage('Settings saved successfully!');
      console.log('Preferences/Permissions update success:', res.data.message);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error updating preferences/permissions:', error.response?.data || error.message);
      setErrorMessage(
        error.response?.data?.message || 
        'Failed to save settings. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      if (!user) {
        setErrorMessage('No user found. Please log in again.');
        return;
      }

      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const uid = user.uid;

      // Delete user data from backend first
      await axios.delete(`${BACKEND_BASE_URL}/api/user/${uid}`);
      
      // Delete Firebase Auth user
      await deleteUser(user);
      
      // Redirect to landing page
      router.push('/');
      
    } catch (error) {
      console.error('Error deleting account:', error.response?.data || error.message);
      setErrorMessage(
        error.response?.data?.message || 
        'Failed to delete account. Please try again or contact support.'
      );
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // Clear messages when component updates
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (loggedUser) => {
      if (!loggedUser) return;

      try {
        setInitialFetchLoading(true);
        
        // Load user basic info
        const userRes = await axios.get(`${BACKEND_BASE_URL}/api/user/${loggedUser.uid}`);
        const userData = userRes.data;
        setEmail(userData.email);
        
        // Load settings separately
        try {
          const settingsRes = await axios.get(`${BACKEND_BASE_URL}/api/settings/user/${loggedUser.uid}`);
          const settingsData = settingsRes.data;
          
          // Set preferences and permissions from settings API
          setFamilyGroups(settingsData.preferences?.familyGroups || false);
          setConnectRequests(settingsData.preferences?.connectRequests || false);
          
          setAllowView(settingsData.permissions?.allowView || false);
          setAppearInSearch(settingsData.permissions?.appearInSearch || false);
          
        } catch (settingsErr) {
          // If settings don't exist yet, use defaults (first time setup)
          console.log('No settings found, using defaults:', settingsErr.response?.status === 404 ? 'User settings not initialized' : settingsErr.message);
          
          // Set default values
          setFamilyGroups(true);
          setConnectRequests(true);
          setAllowView(true);
          setAppearInSearch(true);
        }
        
      } catch (err) {
        console.error("Failed to load user data:", err);
        setErrorMessage('Failed to load settings. Please refresh the page.');
      } finally {
        setInitialFetchLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (initialFetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto pt-16">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {successMessage}
          </div>
        )}
        
        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {errorMessage}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Account Information */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Account Information</h2>
              <span className="text-[#4F6F52] cursor-pointer text-sm" onClick={() => setIsEditing((prev) => !prev)}>
                {isEditing ? <X /> : <Edit />}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="font-semibold">Email</p>
                {isEditing ? (
                  <input type="email" className="border border-[#D9D9D9] px-2 py-1 rounded w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
                ) : (
                  <p>{email || '—'}</p>
                )}
              </div>

              <div>
                {isEditing && (
                  <div>
                    <p className="font-semibold">New Password</p>
                    <input
                      type="password"
                      className="border border-[#D9D9D9] px-2 py-1 rounded w-full"
                      placeholder="Enter New Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                )}
              </div> 

              {isEditing && (
                <div className="flex justify-end space-x-3">
                  <button
                    className="bg-[#4F6F52] text-white px-4 py-2 rounded hover:bg-[#294032]"
                    onClick={handleAccountSave}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Email/Password'}
                  </button>
                </div>
              )}
            </div>

            {/* Account Deletion Notice */}
            <div className="mt-10">
              <h3 className="text-md font-semibold mb-2">Account Deletion</h3>
              <div className="flex bg-red-100 p-4 rounded-md mb-4 text">
                <CircleAlert className="text-red-600" />
                <p className="pl-5">
                  <span className="font-semibold">Important:</span> Before You Delete Your AncesTREE Account
                </p>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Please be aware that deleting your AncesTREE account will result in the permanent removal of all information you have saved and created. This includes your family tree and all associated data.
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Once your account is deleted, you will not be able to recover any of your deleted files or information stored within that account.
              </p>
              <p className="text-sm text-gray-600 mb-4">Please carefully consider this before proceeding with account deletion.</p>
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Delete Account'}
              </button>
              
              {/* Delete Confirmation Modal */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                    <h3 className="text-xl font-bold mb-4 text-red-600">Confirm Account Deletion</h3>
                    <p className="mb-6">
                      Are you absolutely sure you want to delete your account? This action cannot be undone 
                      and will permanently delete all your data including your family tree, photos, and connections.
                    </p>
                    <div className="flex space-x-4">
                      <button
                        onClick={handleDeleteAccount}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
                        disabled={loading}
                      >
                        {loading ? 'Deleting...' : 'Yes, Delete My Account'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email Notifications & Permissions */}
          <div>
            <div className="bg-white p-6 rounded-2xl shadow">
              <h2 className="text-xl font-semibold mb-4">Notifications</h2>
              {[
                { label: "Family Groups", desc: "Receive Family Group Invitations", value: familyGroups, setter: setFamilyGroups },
                { label: "Connect Requests", desc: "Receive Connection Requests from other Users", value: connectRequests, setter: setConnectRequests }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={item.value}
                      onChange={(e) => item.setter(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-[#4F6F52] transition-all duration-300"></div>
                    <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-300 peer-checked:translate-x-full"></div>
                  </label>
                </div>
              ))}
            </div>

            <div className="bg-white mt-5 p-6 rounded-2xl shadow">
              <h2 className="text-xl font-semibold mb-4">Permissions</h2>
              {[
                { label: "Allow other users to view my information", desc: "Decide if other AncesTREE members can see your basic profile details", value: allowView, setter: setAllowView },
                { label: "Appear in public search results", desc: "Control whether your profile can be found by other users", value: appearInSearch, setter: setAppearInSearch },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={item.value}
                      onChange={(e) => item.setter(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-[#4F6F52] transition-all duration-300"></div>
                    <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-300 peer-checked:translate-x-full"></div>
                  </label>
                </div>
              ))}
            </div>

            {/* Save button for Notifications & Permissions */}
            <div className="flex justify-end mt-4">
              <button
                className="bg-[#4F6F52] text-white px-4 py-2 rounded hover:bg-[#294032] disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handlePrefsSave}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Notifications & Permissions'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Settings;