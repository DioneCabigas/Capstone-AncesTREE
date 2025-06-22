'use client';

import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CircleAlert, Edit, X } from "lucide-react";
import { useState, useEffect } from "react";
import axios from 'axios';
import { getAuth, onAuthStateChanged, updatePassword } from "firebase/auth";

function Settings() {
  const auth = getAuth();
  const user = auth.currentUser;

  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialFetchLoading, setInitialFetchLoading] = useState(false);

  // Email Notifications
  const [newsletter, setNewsletter] = useState(false);
  const [familyGroups, setFamilyGroups] = useState(false);
  const [connectRequests, setConnectRequests] = useState(false);

  // Permissions
  const [allowView, setAllowView] = useState(false);
  const [appearInSearch, setAppearInSearch] = useState(false);
  const [exportTree, setExportTree] = useState(false);

  // Save email and password only
  const handleAccountSave = async () => {
    try {
      if (!user) return;
      setLoading(true);

      const uid = user.uid;

      const res = await axios.post('http://localhost:3001/api/user/', {
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
      if (!user) return;
      setLoading(true);

      const uid = user.uid;

      const res = await axios.post('http://localhost:3001/api/settings/user', {
        uid,
        preferences: {
          familyGroups,
          connectRequests,
          newsletter,
        },
        permissions: {
          allowView,
          appearInSearch,
          exportTree,
        },
      });

      console.log('Preferences/Permissions update success:', res.data.message);
    } catch (error) {
      console.error('Error updating preferences/permissions:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (loggedUser) => {
      if (!loggedUser) return;

      try {
        setInitialFetchLoading(true);
        const res = await axios.get(`http://localhost:3001/api/user/${loggedUser.uid}`);
        const data = res.data;

        setEmail(data.email);

        // Set preferences and permissions
        setNewsletter(data.preferences?.newsletter || false);
        setFamilyGroups(data.preferences?.familyGroups || false);
        setConnectRequests(data.preferences?.connectRequests || false);

        setAllowView(data.permissions?.allowView || false);
        setAppearInSearch(data.permissions?.appearInSearch || false);
        setExportTree(data.permissions?.exportTree || false);
      } catch (err) {
        console.error("Failed to load user data:", err);
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto pt-20">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
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
              <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Delete Account</button>
            </div>
          </div>

          {/* Email Notifications & Permissions */}
          <div>
            <div className="bg-white p-6 rounded-2xl shadow">
              <h2 className="text-xl font-semibold mb-4">Email Notifications</h2>
              {[
                // { label: "Newsletter", desc: "Receive news and updates from AncesTREE", value: newsletter, setter: setNewsletter },
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
                // { label: "Export my family tree data", desc: "Enable the option to download your family tree", value: exportTree, setter: setExportTree }
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
                className="bg-[#4F6F52] text-white px-4 py-2 rounded hover:bg-[#294032]"
                onClick={handlePrefsSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Notifications & Permissions'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;