'use client'
import { useState, useEffect } from "react";
import { auth } from "@/app/utils/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Link from 'next/link';
import { useRouter, useSearchParams } from "next/navigation";
import AuthController from '@/components/AuthController';
import Navbar from '../../components/Navbar';
import { Edit, Save, X, User, MapPin, Calendar, Phone, Heart, ChevronDown, Trash2, Check, X as XMark } from 'lucide-react';
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:3001';

function ProfilePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  
  // Updated userData structure to match your Firebase structure
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    suffix: "",
    birthDate: "",
    birthPlace: "",
    streetAddress: "",
    cityAddress: "",
    provinceAddress: "",
    countryAddress: "",
    zipCode: "",
    contactNumber: "",
    telephoneNumber: "",
    email: "",
    nationality: "",
    civilStatus: ""
  });
  
  // Local state for editing
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const [activeTab, setActiveTab] = useState("details");
  const [activeSection, setActiveSection] = useState("general");
  const [connectionsSubTab, setConnectionsSubTab] = useState("active"); // "active" or "pending"
  const [connections, setConnections] = useState([]);
  const [pendingConnections, setPendingConnections] = useState([]);
  const [connectionLoading, setConnectionLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the userId from URL query params (for viewing other profiles)
  const userIdFromQuery = searchParams.get('userId');

  // Fetch user data on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setCurrentUser(currentUser);
        
        // Determine which user profile to load
        const targetUserId = userIdFromQuery || currentUser.uid;
        const isOwn = targetUserId === currentUser.uid;
        setIsOwnProfile(isOwn);
        
        try {
          // Load the target user's profile using the server API
          const response = await axios.get(`/user/${targetUserId}`);
          
          if (response.status === 200) {
            const data = response.data;
            setUserData(prevState => ({
              ...prevState,
              ...data,
              userId: targetUserId
            }));
            
            // If viewing another user's profile, store their info in profileUser
            if (!isOwn) {
              setProfileUser({
                uid: targetUserId,
                ...data
              });
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          if (error.response && error.response.status === 404) {
            setError("User profile not found");
          } else {
            setError("Error loading profile data");
          }
        }
        
        // If own profile, also fetch connections and pending requests
        if (isOwn) {
          fetchConnectionsData(currentUser.uid);
        }
      }
    });
    
    return () => unsubscribe();
  }, [userIdFromQuery]);

  // Function to fetch both connections and pending requests
  const fetchConnectionsData = async (userId) => {
    setConnectionLoading(true);
    try {
      // Try different possible API endpoints for connections
      let connectionsResponse;
      let pendingResponse;
      
      // First attempt - standard endpoint
      try {
        connectionsResponse = await axios.get(`/user/${userId}/connections`);
      } catch (error) {
        if (error.response?.status === 404) {
          // Try alternative endpoint format
          try {
            console.log("Trying alternative endpoint: /connections");
            connectionsResponse = await axios.get(`/connections/${userId}`);
          } catch (altError) {
            console.error("Both connection endpoints failed:", altError);
            throw altError;
          }
        } else {
          throw error;
        }
      }
      
      if (connectionsResponse.status === 200) {
        setConnections(connectionsResponse.data);
      }
      
      // Try to get pending requests - first attempt
      try {
        pendingResponse = await axios.get(`/user/${userId}/pending`);
      } catch (error) {
        if (error.response?.status === 404) {
          // Try alternative endpoint format
          try {
            console.log("Trying alternative endpoint: /connections/pending");
            pendingResponse = await axios.get(`/connections/${userId}/pending`);
          } catch (altError) {
            console.error("Both pending endpoints failed:", altError);
            throw altError;
          }
        } else {
          throw error;
        }
      }
      
      if (pendingResponse.status === 200) {
        setPendingConnections(pendingResponse.data);
      }
    } catch (error) {
      console.error("Error fetching connections data:", error);
      setError("Failed to load connections. Please check console for details.");
    } finally {
      setConnectionLoading(false);
    }
  };

  // Initialize edited data when entering edit mode
  useEffect(() => {
    if (editMode) {
      setEditedData({...userData});
    }
  }, [editMode, userData]);

  // Handle editing profile information
  const handleEdit = () => {
    setEditMode(true);
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditMode(false);
    setError(null);
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle save changes - Updated to use server API
  const handleSaveChanges = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!currentUser || !currentUser.uid) {
        throw new Error("User not authenticated");
      }
      
      // Use the server API instead of direct Firebase access
      const response = await axios.put(`/user/${currentUser.uid}`, editedData);
      
      if (response.status === 200) {
        // Update local state
        setUserData(editedData);
        setEditMode(false);
        setSuccessMessage("Profile updated successfully");
        
        // Update firstName in localStorage to notify navbar
        if (editedData.firstName) {
          try {
            localStorage.setItem('userFirstName', editedData.firstName || '');
            // Try to dispatch event but handle any errors
            try {
              window.dispatchEvent(new Event('userDataChanged'));
            } catch (eventError) {
              console.error("Error dispatching event:", eventError);
            }
          } catch (storageError) {
            console.error("Error updating localStorage:", storageError);
          }
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.response?.data?.message || "Failed to save changes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle removing a connection - Updated to use server API
  const handleRemoveConnection = async (connectionId) => {
    setError(null);
    
    try {
      // Try the primary endpoint
      let response;
      try {
        response = await axios.delete(`/connection/${connectionId}`);
      } catch (error) {
        if (error.response?.status === 404) {
          // Try alternative endpoint format
          console.log("Trying alternative endpoint: /connections");
          response = await axios.delete(`/connections/${connectionId}`);
        } else {
          throw error;
        }
      }
      
      if (response.status === 200) {
        // Update local state after successful API call
        setConnections(connections.filter(conn => conn.id !== connectionId));
        setSuccessMessage("Connection removed successfully");
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (error) {
      console.error("Error removing connection:", error);
      setError(error.response?.data?.message || "Failed to remove connection. Please try again.");
    }
  };
  
  // Handle sending a connection request - Direct Firebase approach
  const handleSendConnectionRequest = async () => {
    if (!currentUser || !profileUser) return;
    
    setConnectionLoading(true);
    setError(null);
    
    try {
      // Try the backend API first (as previously implemented)
      try {
        const response = await axios.post('/connections', {
          requester: currentUser.uid,
          receiver: profileUser.uid,
          status: 'pending'
        });
        
        if (response.status === 200 || response.status === 201) {
          setSuccessMessage("Connection request sent successfully");
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            setSuccessMessage(null);
          }, 3000);
          return; // Exit early if successful
        }
      } catch (apiError) {
        console.error("API connection request failed:", apiError);
        // Continue to Firebase fallback if API fails
      }
      
      // If the API call failed, show a message about using direct Firebase (for debugging)
      console.log("Attempting direct Firebase connection creation");
      
      // Check if a connection already exists between these users
      // You would need to import the necessary Firebase functions at the top:
      // import { collection, addDoc, query, where, getDocs, getFirestore } from "firebase/firestore";
      // const db = getFirestore();
      
      // This is pseudocode - you'll need to adapt this to your actual Firebase setup
      /*
      const db = getFirestore();
      const connectionsRef = collection(db, "connections");
      const q = query(
        connectionsRef,
        where("requester", "in", [currentUser.uid, profileUser.uid]),
        where("receiver", "in", [currentUser.uid, profileUser.uid])
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setError("A connection already exists or is pending between you and this user");
        return;
      }
      
      // Create the connection document
      await addDoc(collection(db, "connections"), {
        requester: currentUser.uid,
        receiver: profileUser.uid,
        status: "pending",
        createdAt: new Date()
      });
      
      setSuccessMessage("Connection request sent successfully");
      */
      
      // For now, let's show a temporary message suggesting a workaround
      setSuccessMessage("Connection request functionality is currently being set up. Please try again later.");
    } catch (error) {
      console.error("Error sending connection request:", error);
      setError("Failed to send connection request. Please ensure the backend API is properly configured.");
    } finally {
      setConnectionLoading(false);
    }
  };
  
  // Handle updating a connection request status (confirm/deny)
  const handleUpdateConnectionStatus = async (connectionId, status) => {
    setConnectionLoading(true);
    setError(null);
    
    try {
      // Try the primary endpoint
      let response;
      try {
        response = await axios.put(`/connection/${connectionId}`, { status });
      } catch (error) {
        if (error.response?.status === 404) {
          // Try alternative endpoint format
          console.log("Trying alternative endpoint: /connections");
          response = await axios.put(`/connections/${connectionId}`, { status });
        } else {
          throw error;
        }
      }
      
      if (response.status === 200) {
        // Refresh connections data
        fetchConnectionsData(currentUser.uid);
        
        setSuccessMessage(status === 'accepted' 
          ? "Connection request accepted" 
          : "Connection request denied");
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (error) {
      console.error("Error updating connection status:", error);
      setError(error.response?.data?.message || "Failed to update connection status. Please try again.");
    } finally {
      setConnectionLoading(false);
    }
  };

  // Render edit fields based on section
  const renderEditFields = () => {
    switch (activeSection) {
      case "general":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
              <div className="text-right font-medium text-[#4F6F52]">First Name:</div>
              <div className="text-[#313131]">
                <input
                  type="text"
                  value={editedData.firstName || ""}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
              <div className="text-right font-medium text-[#4F6F52]">Middle Name:</div>
              <div className="text-[#313131]">
                <input
                  type="text"
                  value={editedData.middleName || ""}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
              <div className="text-right font-medium text-[#4F6F52]">Last Name:</div>
              <div className="text-[#313131]">
                <input
                  type="text"
                  value={editedData.lastName || ""}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
              <div className="text-right font-medium text-[#4F6F52]">Suffix:</div>
              <div className="text-[#313131]">
                <input
                  type="text"
                  value={editedData.suffix || ""}
                  onChange={(e) => handleInputChange('suffix', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
              <div className="text-right font-medium text-[#4F6F52]">Birth Date:</div>
              <div className="text-[#313131]">
                <input
                  type="date"
                  value={editedData.birthDate || ""}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
              <div className="text-right font-medium text-[#4F6F52]">Birth Place:</div>
              <div className="text-[#313131]">
                <input
                  type="text"
                  value={editedData.birthPlace || ""}
                  onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
              <div className="text-right font-medium text-[#4F6F52]">Nationality:</div>
              <div className="text-[#313131]">
                <input
                  type="text"
                  value={editedData.nationality || ""}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-right font-medium text-[#4F6F52]">Civil Status:</div>
              <div className="text-[#313131]">
                <select
                  value={editedData.civilStatus || ""}
                  onChange={(e) => handleInputChange('civilStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
                >
                  <option value="">Select</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>
            </div>
          </div>
        );
      
      case "addresses":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-[#313131] mb-3 pb-2 border-b border-gray-100">
                Current Address
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                  <div className="text-right font-medium text-[#4F6F52]">Street Address:</div>
                  <div className="text-[#313131]">
                    <input
                      type="text"
                      value={editedData.streetAddress || ""}
                      onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                  <div className="text-right font-medium text-[#4F6F52]">City:</div>
                  <div className="text-[#313131]">
                    <input
                      type="text"
                      value={editedData.cityAddress || ""}
                      onChange={(e) => handleInputChange('cityAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                  <div className="text-right font-medium text-[#4F6F52]">Province/State:</div>
                  <div className="text-[#313131]">
                    <input
                      type="text"
                      value={editedData.provinceAddress || ""}
                      onChange={(e) => handleInputChange('provinceAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                  <div className="text-right font-medium text-[#4F6F52]">Country:</div>
                  <div className="text-[#313131]">
                    <input
                      type="text"
                      value={editedData.countryAddress || ""}
                      onChange={(e) => handleInputChange('countryAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-right font-medium text-[#4F6F52]">Postal/ZIP Code:</div>
                  <div className="text-[#313131]">
                    <input
                      type="text"
                      value={editedData.zipCode || ""}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case "contact":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-[#313131] mb-3 pb-2 border-b border-gray-100">
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                  <div className="text-right font-medium text-[#4F6F52]">Mobile Phone:</div>
                  <div className="text-[#313131]">
                    <input
                      type="text"
                      value={editedData.contactNumber || ""}
                      onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                  <div className="text-right font-medium text-[#4F6F52]">Telephone:</div>
                  <div className="text-[#313131]">
                    <input
                      type="text"
                      value={editedData.telephoneNumber || ""}
                      onChange={(e) => handleInputChange('telephoneNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-right font-medium text-[#4F6F52]">Email Address:</div>
                  <div className="text-[#313131]">
                    <input
                      type="email"
                      value={editedData.email || ""}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return <p>Select a section to edit</p>;
    }
  };

  // Render view-only fields
  const renderViewFields = () => {
    switch (activeSection) {
      case "general":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
              <div className="text-right font-medium text-[#4F6F52]">First Name:</div>
              <div className="text-[#313131]">{userData.firstName || "—"}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
              <div className="text-right font-medium text-[#4F6F52]">Middle Name:</div>
              <div className="text-[#313131]">{userData.middleName || "—"}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
              <div className="text-right font-medium text-[#4F6F52]">Last Name:</div>
              <div className="text-[#313131]">{userData.lastName || "—"}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
              <div className="text-right font-medium text-[#4F6F52]">Suffix:</div>
              <div className="text-[#313131]">{userData.suffix || "—"}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
              <div className="text-right font-medium text-[#4F6F52]">Birth Date:</div>
              <div className="text-[#313131]">{userData.birthDate || "—"}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
              <div className="text-right font-medium text-[#4F6F52]">Birth Place:</div>
              <div className="text-[#313131]">{userData.birthPlace || "—"}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
              <div className="text-right font-medium text-[#4F6F52]">Nationality:</div>
              <div className="text-[#313131]">{userData.nationality || "—"}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-right font-medium text-[#4F6F52]">Civil Status:</div>
              <div className="text-[#313131]">{userData.civilStatus || "—"}</div>
            </div>
          </div>
        );
      
      case "addresses":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-[#313131] mb-3 pb-2 border-b border-gray-100">
                Current Address
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                  <div className="text-right font-medium text-[#4F6F52]">Street Address:</div>
                  <div className="text-[#313131]">{userData.streetAddress || "—"}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                  <div className="text-right font-medium text-[#4F6F52]">City:</div>
                  <div className="text-[#313131]">{userData.cityAddress || "—"}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                  <div className="text-right font-medium text-[#4F6F52]">Province/State:</div>
                  <div className="text-[#313131]">{userData.provinceAddress || "—"}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                  <div className="text-right font-medium text-[#4F6F52]">Country:</div>
                  <div className="text-[#313131]">{userData.countryAddress || "—"}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-right font-medium text-[#4F6F52]">Postal/ZIP Code:</div>
                  <div className="text-[#313131]">{userData.zipCode || "—"}</div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case "contact":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-[#313131] mb-3 pb-2 border-b border-gray-100">
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                  <div className="text-right font-medium text-[#4F6F52]">Mobile Phone:</div>
                  <div className="text-[#313131]">{userData.contactNumber || "—"}</div>
                </div>
                      
                <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                  <div className="text-right font-medium text-[#4F6F52]">Telephone:</div>
                  <div className="text-[#313131]">{userData.telephoneNumber || "—"}</div>
                </div>
                      
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-right font-medium text-[#4F6F52]">Email Address:</div>
                  <div className="text-[#313131]">{userData.email || "—"}</div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return <p>Select a section to view</p>;
    }
  };

  // Render connections content
  const renderConnectionsContent = () => {
    return (
      <div className="bg-white border border-[#ffffff] rounded-lg p-6">
        {/* Sub-tabs for connections */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex space-x-4">
            <button
              className={`py-2 px-4 font-medium border-b-2 ${
                connectionsSubTab === "active"
                  ? "text-[#313131] border-[#313131]"
                  : "text-[#4F6F52] border-transparent hover:text-[#313131]"
              }`}
              onClick={() => setConnectionsSubTab("active")}
            >
              Connections
            </button>
            <button
              className={`py-2 px-4 font-medium border-b-2 ${
                connectionsSubTab === "pending"
                  ? "text-[#313131] border-[#313131]"
                  : "text-[#4F6F52] border-transparent hover:text-[#313131]"
              }`}
              onClick={() => setConnectionsSubTab("pending")}
            >
              Pending Requests
            </button>
          </div>
        </div>
        
        {/* Success message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md">
            {successMessage}
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}
        
        {/* Loading indicator */}
        {connectionLoading && (
          <div className="flex justify-center py-6">
            <p className="text-[#4F6F52]">Loading...</p>
          </div>
        )}
        
        {/* Active connections list */}
        {!connectionLoading && connectionsSubTab === "active" && (
          <>
            <h2 className="text-xl font-semibold text-[#313131] mb-6">Your Connections</h2>
            
            {connections.length === 0 ? (
              <p className="text-gray-500 italic py-4">No connections found.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {connections.map((connection) => (
                  <div key={connection.id} className="flex items-center justify-between py-4">
                    <div className="flex items-center">
                      {/* Connection Avatar */}
                      <div className="w-10 h-10 rounded-full bg-[rgba(79,111,82,0.1)] text-[#313131] flex items-center justify-center mr-4">
                        <span className="font-bold">{connection.name ? connection.name.charAt(0) : ""}</span>
                      </div>
                      <span className="text-[#313131] font-medium">{connection.name || "Unknown"}</span>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => router.push(`/auth/profile?userId=${connection.id}`)}
                        className="px-4 py-2 bg-[#4F6F52] text-white text-sm rounded hover:bg-opacity-90"
                      >
                        View Profile
                      </button>
                      <button className="px-4 py-2 bg-[#4F6F52] text-white text-sm rounded hover:bg-opacity-90">
                        View Tree
                      </button>
                      {/* Trash icon button */}
                      <button 
                        onClick={() => handleRemoveConnection(connection.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove Connection"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
        {/* Pending connection requests list */}
        {!connectionLoading && connectionsSubTab === "pending" && (
          <>
            <h2 className="text-xl font-semibold text-[#313131] mb-6">Pending Connection Requests</h2>
            
            {pendingConnections.length === 0 ? (
              <p className="text-gray-500 italic py-4">No pending connection requests.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingConnections.map((request) => (
                  <div key={request.id} className="flex items-center justify-between py-4">
                    <div className="flex items-center">
                      {/* Connection Avatar */}
                      <div className="w-10 h-10 rounded-full bg-[rgba(79,111,82,0.1)] text-[#313131] flex items-center justify-center mr-4">
                        <span className="font-bold">{request.name ? request.name.charAt(0) : ""}</span>
                      </div>
                      <div>
                        <div className="text-[#313131] font-medium">{request.name || "Unknown"}</div>
                        <div className="text-sm text-gray-500">
                          {request.requester === currentUser.uid ? "Sent by you" : "Wants to connect with you"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      {/* Only show confirm/deny buttons for received requests */}
                      {request.requester !== currentUser.uid ? (
                        <>
                          <button 
                            onClick={() => handleUpdateConnectionStatus(request.id, 'accepted')}
                            className="px-4 py-2 bg-[#4F6F52] text-white text-sm rounded hover:bg-opacity-90 flex items-center gap-1"
                          >
                            <Check size={16} />
                            <span>Confirm</span>
                          </button>
                          <button 
                            onClick={() => handleUpdateConnectionStatus(request.id, 'rejected')}
                            className="px-4 py-2 border border-gray-300 text-[#313131] text-sm rounded hover:bg-gray-50 flex items-center gap-1"
                          >
                            <XMark size={16} />
                            <span>Deny</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-500 italic">Awaiting response</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white"> {/* 60% white */}
      {/* Using the updated Navbar component */}
      <Navbar />
      
      {/* Main Content - Add appropriate top padding to account for navbar */}
      <div className="container mx-auto pt-20 px-4 pb-12">
        {/* Profile Header Banner */}
        <div className="relative">
          {/* Banner Image - Secondary color (30%) */}
          <div className="w-full h-48 bg-[#365643] rounded-t-lg"></div>
          
          {/* Profile Image */}
          <div className="absolute left-8 bottom-0 transform translate-y-1/2">
            <div className="w-32 h-32 rounded-full bg-white border-4 border-white overflow-hidden flex items-center justify-center">
              <span className="text-[#313131] text-5xl font-bold">
                {userData.firstName ? userData.firstName.charAt(0) : ""}
                {userData.lastName ? userData.lastName.charAt(0) : ""}
              </span>
            </div>
          </div>
        </div>
        
        {/* Profile Info Bar - White background (60%) */}
        <div className="bg-white shadow-md rounded-b-lg pt-20 pb-4 px-8 mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#313131]">
              {userData.firstName || "—"} {userData.lastName || "—"}
            </h1>
              <div className="text-sm text -[#4F6F52] mt-1">
                <div className="text-[#313131]">{userData.email || "—"}</div>
              </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
            {/* Connect Button - Only show if viewing another user's profile */}
            {!isOwnProfile && (
              <button 
                onClick={handleSendConnectionRequest}
                disabled={connectionLoading}
                className={`px-4 py-2 rounded hover:bg-opacity-90 transition-colors inline-flex items-center justify-center ${
                  connectionLoading 
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                    : "bg-[#4F6F52] text-white"
                }`}
              >
                <Heart size={16} className="mr-2" />
                {connectionLoading ? "Processing..." : "Connect"}
              </button>
            )}
            
            {/* View Tree Button */}
            <button className="px-4 py-2 bg-[#365643] text-white rounded hover:bg-opacity-90 transition-colors inline-flex items-center justify-center">
              View Tree
            </button>
          </div>
        </div>
        
        {/* Success message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md">
            {successMessage}
          </div>
        )}
        
        {/* Tab Navigation - Only show connections tab for own profile */}
        <div className="flex border-b border-gray-200 mb-6">
          <button 
            className={`py-3 px-6 font-medium ${activeTab === "details" 
              ? "text-[#313131] border-b-2 border-[#313131]" /* 10% accent color */ 
              : "text-[#4F6F52] hover:text-[#313131]"}`} /* 30% color */
            onClick={() => setActiveTab("details")}
          >
            Personal Details
          </button>
          
          {isOwnProfile && (
            <button 
              className={`py-3 px-6 font-medium ${activeTab === "connections" 
                ? "text-[#313131] border-b-2 border-[#313131]" /* 10% accent color */
                : "text-[#4F6F52] hover:text-[#313131]"}`} /* 30% color */
              onClick={() => {
                setActiveTab("connections");
                // Refresh connections data when clicking on the tab
                if (currentUser) {
                  fetchConnectionsData(currentUser.uid);
                }
              }}
            >
              Connections
            </button>
          )}
        </div>
        
        {/* Content Area */}
        {activeTab === "details" ? (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar - Secondary color with transparency */}
            <div className="md:w-1/4 bg-[rgba(79,111,82,0.1)] rounded-lg overflow-hidden">
              <ul>
                <li>
                  <button 
                    onClick={() => setActiveSection("general")} 
                    className={`w-full text-left px-4 py-3 flex items-center gap-2 ${
                      activeSection === "general" 
                        ? "bg-[#4F6F52] text-white" 
                        : "text-[#313131] hover:bg-[rgba(79,111,82,0.2)]"
                    }`}
                  >
                    <User size={18} />
                    <span>General Information</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveSection("addresses")} 
                    className={`w-full text-left px-4 py-3 flex items-center gap-2 ${
                      activeSection === "addresses" 
                        ? "bg-[#4F6F52] text-white" 
                        : "text-[#313131] hover:bg-[rgba(79,111,82,0.2)]"
                    }`}
                  >
                    <MapPin size={18} />
                    <span>Addresses</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveSection("contact")} 
                    className={`w-full text-left px-4 py-3 flex items-center gap-2 ${
                      activeSection === "contact" 
                        ? "bg-[#4F6F52] text-white" 
                        : "text-[#313131] hover:bg-[rgba(79,111,82,0.2)]"
                    }`}
                  >
                    <Phone size={18} />
                    <span>Contact Information</span>
                  </button>
                </li>
              </ul>
            </div>
            
            {/* Main Content - White background (60%) */}
            <div className="flex-1 bg-white border border-[#ffffff] rounded-lg p-6">
              {/* Add edit/save/cancel buttons here - Only show for own profile */}
              {isOwnProfile && (
                <div className="flex justify-end mb-6 space-x-3">
                  {editMode ? (
                    <>
                      <button 
                        onClick={handleSaveChanges}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                          isLoading 
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                            : "bg-[#4F6F52] text-white hover:bg-opacity-90"
                        }`}
                      >
                        <Save size={16} />
                        <span>{isLoading ? "Saving..." : "Save"}</span>
                      </button>
                      <button 
                        onClick={handleCancelEdit}
                        className="px-4 py-2 border border-gray-300 rounded-md text-[#313131] hover:bg-gray-50 flex items-center gap-2"
                      >
                        <X size={16} />
                        <span>Cancel</span>
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={handleEdit}
                      className="px-4 py-2 bg-[#365643] text-white rounded-md hover:bg-opacity-90 flex items-center gap-2"
                    >
                      <Edit size={16} />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              )}
              
              {/* If viewing another user's profile, show a notice */}
              {!isOwnProfile && (
                <div className="mb-6 p-4 bg-[rgba(79,111,82,0.1)] rounded-md">
                  <p className="text-[#313131]">
                    You are viewing {userData.firstName}'s profile.
                  </p>
                </div>
              )}
              
              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
                  {error}
                </div>
              )}
              
              {/* Content based on selected section - Toggle between edit fields and view fields */}
              {isOwnProfile && editMode ? renderEditFields() : renderViewFields()}
            </div>
          </div>
        ) : (
          /* Connections Tab */
          renderConnectionsContent()
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  return (
    <AuthController mode="PROTECT">
      <ProfilePage />
    </AuthController>
  );
}