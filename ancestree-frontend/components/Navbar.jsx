'use client'

/**
 * Navbar Component - Enhanced with Facebook-style Notifications
 * 
 * Using the provided color palette:
 * - White (#FFFFFF) as 60% primary color 
 * - Light Green (#4F6F52) as 30% secondary color
 * - Dark Gray (#313131) as 10% accent color
 */

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { auth, db } from "@/app/utils/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:3001';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ firstName: "" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  
  const menuRef = useRef(null);
  const notificationRef = useRef(null);
  const router = useRouter();

  // Handle auth state changes and fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // If user is authenticated, fetch their data from Firestore
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
          
          // Start polling for notifications
          fetchNotifications(currentUser.uid);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        // Clear notifications when user logs out
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, []);

  // Poll for notifications every 30 seconds when user is authenticated
  useEffect(() => {
    let intervalId;
    
    if (user) {
      intervalId = setInterval(() => {
        fetchNotifications(user.uid);
      }, 30000); // Check every 30 seconds
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user]);

  // Listen for user data changes from ProfilePage
  useEffect(() => {
    const handleUserDataChange = () => {
      const storedFirstName = localStorage.getItem('userFirstName');
      if (storedFirstName) {
        setUserData(prevData => ({
          ...prevData,
          firstName: storedFirstName
        }));
      }
    };

    window.addEventListener('userDataChanged', handleUserDataChange);
    handleUserDataChange();
    
    return () => {
      window.removeEventListener('userDataChanged', handleUserDataChange);
    };
  }, []);

  // Handle clicks outside dropdowns to close them
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Fetch notifications for the current user
   * This includes:
   * - Pending connection requests (for receiver)
   * - Connection status updates (for requester)
   */
  const fetchNotifications = async (userId) => {
    if (!userId) return;
    
    setNotificationLoading(true);
    
    try {
      // Get all connections involving this user
      const connectionsResponse = await axios.get(`/api/connections/${userId}`);
      const pendingResponse = await axios.get(`/api/connections/${userId}/pending`);
      
      const allConnections = connectionsResponse.data || [];
      const pendingConnections = pendingResponse.data || [];
      
      const notificationList = [];
      
      // Process pending connection requests (notifications for receivers)
      for (const connection of pendingConnections) {
        if (connection.receiver === userId) {
          // This user received a connection request
          const requesterDetails = await fetchUserDetails(connection.requester);
          const requesterName = requesterDetails 
            ? `${requesterDetails.firstName} ${requesterDetails.lastName}` 
            : "Someone";
          
          notificationList.push({
            id: `pending_${connection.id}`,
            type: 'connection_request',
            message: `${requesterName} has sent you a connection request`,
            timestamp: connection.createdAt || new Date().toISOString(),
            connectionId: connection.id,
            fromUserId: connection.requester,
            fromUserName: requesterName,
            isRead: false
          });
        }
      }
      
      // Check for recently updated connections (accepted/rejected)
      // This is a simplified version - in a real app, you'd want to track status changes
      const recentlyUpdated = allConnections.filter(conn => {
        const updatedAt = new Date(conn.updatedAt || conn.createdAt);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return updatedAt > oneDayAgo && conn.status !== 'pending';
      });
      
      for (const connection of recentlyUpdated) {
        if (connection.requester === userId) {
          // This user was the requester, notify about status change
          const receiverDetails = await fetchUserDetails(connection.receiver);
          const receiverName = receiverDetails 
            ? `${receiverDetails.firstName} ${receiverDetails.lastName}` 
            : "Someone";
          
          const statusMessage = connection.status === 'accepted'
            ? `${receiverName} has accepted your connection request`
            : `${receiverName} has denied your connection request`;
          
          notificationList.push({
            id: `status_${connection.id}`,
            type: connection.status === 'accepted' ? 'connection_accepted' : 'connection_denied',
            message: statusMessage,
            timestamp: connection.updatedAt || connection.createdAt,
            connectionId: connection.id,
            fromUserId: connection.receiver,
            fromUserName: receiverName,
            isRead: false
          });
        }
      }
      
      // Sort notifications by timestamp (newest first)
      notificationList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setNotifications(notificationList);
      setUnreadCount(notificationList.filter(n => !n.isRead).length);
      
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setNotificationLoading(false);
    }
  };

  /**
   * Fetch user details by ID
   */
  const fetchUserDetails = async (userId) => {
    try {
      const response = await axios.get(`/api/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user details for ${userId}:`, error);
      return null;
    }
  };

  /**
   * Handle connection request response (accept/deny)
   */
  const handleConnectionResponse = async (connectionId, status) => {
    try {
      await axios.put(`/api/connections/${connectionId}`, { status });
      
      // Remove the notification after handling
      setNotifications(prev => prev.filter(n => n.connectionId !== connectionId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Refresh notifications
      if (user) {
        fetchNotifications(user.uid);
      }
    } catch (error) {
      console.error("Error responding to connection request:", error);
    }
  };

  /**
   * Mark notification as read
   */
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  /**
   * Clear all notifications
   */
  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  /**
   * Handle user logout
   */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMenuOpen(false);
      setNotificationsOpen(false);
      router.push("/");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMs = now - notificationTime;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return notificationTime.toLocaleDateString();
  };

  // Get the first initial for the avatar
  const getInitial = () => {
    if (userData.firstName) {
      return userData.firstName.charAt(0).toUpperCase();
    }
    if (user && user.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    if (user && user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Get the display name for the profile
  const getDisplayName = () => {
    if (userData.firstName) {
      return userData.firstName;
    }
    if (user && user.displayName) {
      return user.displayName.split(' ')[0];
    }
    return "User";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-[#FFFFFF] text-sm text-[#313131] p-2 z-50 border-b-2 border-[#313131]">
      <div className="container mx-auto grid grid-cols-3 items-center">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-2">
          <Link href={user ? "/home" : "/"} className="flex items-center">
            <Image src="/images/AncesTree_Logo.png" alt="Logo" width={135} height={40}/>
          </Link>
        </div> 

        {/* Navigation Links */}
        <div className="hidden md:flex justify-center space-x-6">
          {user ? (
            <>
              <Link href="/home" className="hover:underline decoration-2 underline-offset-4 px-2 py-1 rounded transition-colors hover:bg-[rgba(49,49,49,0.2)]">Home</Link>
              <Link href="/search" className="hover:underline decoration-2 underline-offset-4 px-2 py-1 rounded transition-colors hover:bg-[rgba(49,49,49,0.2)]">Search</Link>              
              <Link href="/family-tree" className="hover:underline decoration-2 underline-offset-4 px-2 py-1 rounded transition-colors hover:bg-[rgba(49,49,49,0.2)] whitespace-nowrap">Family Tree</Link>
              <Link href="/family-group" className="hover:underline decoration-2 underline-offset-4 px-2 py-1 rounded transition-colors hover:bg-[rgba(49,49,49,0.2)] whitespace-nowrap">Family Group</Link>
              <Link href="/gallery" className="hover:underline decoration-2 underline-offset-4 px-2 py-1 rounded transition-colors hover:bg-[rgba(49,49,49,0.2)]">Gallery</Link>
            </>
          ) : (
            <>
              <Link href="/" className="hover:underline decoration-2 underline-offset-4 px-2 py-1 rounded transition-colors">Home</Link>
              <Link href="/about" className="hover:underline decoration-2 underline-offset-4 px-2 py-1 rounded transition-colors">About</Link>
              <Link href="/features" className="hover:underline decoration-2 underline-offset-4 px-2 py-1 rounded transition-colors">Features</Link>
            </>
          )}
        </div>

        {/* Right side - Notifications and User Menu */}
        <div className="flex justify-end items-center space-x-4">
          {user && (
            <>
              {/* Notifications Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 rounded-full hover:bg-[rgba(49,49,49,0.1)] transition-colors"
                >
                  <Bell size={20} className="text-[#313131]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-[#4F6F52] z-50 max-h-96 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-[#313131]">Notifications</h3>
                      <div className="flex items-center space-x-2">
                        {notifications.length > 0 && (
                          <button
                            onClick={clearAllNotifications}
                            className="text-xs text-[#4F6F52] hover:text-[#313131] transition-colors"
                          >
                            Clear all
                          </button>
                        )}
                        <button
                          onClick={() => setNotificationsOpen(false)}
                          className="text-[#4F6F52] hover:text-[#313131] transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                      {notificationLoading ? (
                        <div className="p-4 text-center text-[#4F6F52]">
                          Loading notifications...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 hover:bg-[rgba(79,111,82,0.05)] transition-colors ${
                              !notification.isRead ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => !notification.isRead && markAsRead(notification.id)}
                          >
                            <div className="flex items-start space-x-3">
                              {/* User Avatar */}
                              <div className="w-10 h-10 rounded-full bg-[rgba(79,111,82,0.1)] text-[#313131] flex items-center justify-center font-bold flex-shrink-0">
                                {notification.fromUserName ? notification.fromUserName.charAt(0) : 'U'}
                              </div>
                              
                              {/* Notification Content */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-[#313131] mb-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-[#4F6F52] mb-2">
                                  {formatTimestamp(notification.timestamp)}
                                </p>
                                
                                {/* Action buttons for connection requests */}
                                {notification.type === 'connection_request' && (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleConnectionResponse(notification.connectionId, 'accepted');
                                      }}
                                      className="px-3 py-1 bg-[#4F6F52] text-white text-xs rounded hover:bg-opacity-90 transition-colors"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleConnectionResponse(notification.connectionId, 'rejected');
                                      }}
                                      className="px-3 py-1 border border-gray-300 text-[#313131] text-xs rounded hover:bg-gray-50 transition-colors"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                )}
                              </div>
                              
                              {/* Unread indicator */}
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-md hover:bg-[rgba(49,49,49,0.2)] transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-white text-[#313131] flex items-center justify-center font-bold">
                    {getInitial()}
                  </div>
                  <span className="hidden md:inline-block">
                    {getDisplayName()}
                  </span>
                  
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-[#4F6F52]">
                    <Link href="/profile">
                      <div onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-[#313131] hover:bg-[rgba(79,111,82,0.1)]">
                        Profile
                      </div>
                    </Link>
                    <Link href="/settings">
                      <div onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-[#313131] hover:bg-[rgba(79,111,82,0.1)]">
                        Settings
                      </div>
                    </Link>
                    <Link href="/help">
                      <div onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-[#313131] hover:bg-[rgba(79,111,82,0.1)]">
                        Help
                      </div>
                    </Link>
                    <div className="border-t border-[#4F6F52] my-1"></div>
                    <div
                      onClick={handleLogout}
                      className="block px-4 py-2 text-sm text-red-600 hover:bg-[rgba(239,68,68,0.1)] cursor-pointer"
                    >
                      Logout
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {!user && (
            <>
              <Link href="/auth/login" className="hover:underline decoration-2 underline-offset-4 hover:bg-opacity-90 px-4 py-2 rounded-md transition-colors">Login</Link>
              <Link href="/auth/signup" className="bg-[#365643] text-white hover:bg-[#294032] hover:bg-opacity-20 px-6 py-2 rounded-md transition-colors">Sign Up</Link>
            </>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-white p-1 rounded-md hover:bg-[rgba(49,49,49,0.2)]">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}