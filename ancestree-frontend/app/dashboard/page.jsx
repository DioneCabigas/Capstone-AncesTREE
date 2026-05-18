'use client'

/**
 * Dashboard Page Component - Enhanced family overview
 * 
 * Features:
 * - Recent family activities
 * - Family statistics
 * - Recent photos
 * - Pending merge requests
 */

import Layout from '../../components/Layout';
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/utils/firebase";
import AuthController from '@/components/AuthController';
import Link from 'next/link';
import axios from 'axios';
import { Users, ImageIcon, Calendar, TrendingUp } from 'lucide-react';

function DashboardContent() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    familyMembers: 0,
    photos: 0,
    groups: 0,
    recentActivities: [],
    recentPhotos: [],
    pendingRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [verificationMessage, setVerificationMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        if (authUser.emailVerified) {
          setUser(authUser);
          await fetchDashboardData(authUser.uid);
        } else {
          setVerificationMessage("Your email address is not yet verified. Please check your inbox (and spam folder) for the verification link.");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchDashboardData = async (userId) => {
    try {
      setLoading(true);

      // Fetch user data
      const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/user/${userId}`);
      if (userResponse.data) {
        setUserData(userResponse.data);
      }

      // Fetch family connections count
      let familyMembers = 0;
      try {
        const connectionsResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/connections/${userId}`);
        familyMembers = connectionsResponse.data.length;
      } catch (error) {
        console.log('Could not fetch connections:', error);
      }

      // Fetch photos count and recent photos
      let photos = 0;
      let recentPhotos = [];
      try {
        const galleryResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/gallery/user/${userId}`);
        photos = galleryResponse.data.length;
        // Get the 3 most recent photos
        recentPhotos = galleryResponse.data
          .sort((a, b) => new Date(b.uploadedAt?._seconds * 1000) - new Date(a.uploadedAt?._seconds * 1000))
          .slice(0, 3);
      } catch (error) {
        console.log('Could not fetch gallery:', error);
      }

      // Fetch pending merge requests count
      let pendingRequests = 0;
      try {
        const pendingResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/connections/${userId}/pending`);
        pendingRequests = pendingResponse.data.length;
      } catch (error) {
        console.log('Could not fetch pending requests:', error);
      }

      // Fetch family groups count
      let groups = 0;
      try {
        const groupsResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/family-groups/user/${userId}`);
        groups = groupsResponse.data.length;
      } catch (error) {
        console.log('Could not fetch family groups:', error);
      }

      // Mock recent activities for now (you can implement this later with actual activity tracking)
      const recentActivities = [
        { type: 'profile', message: 'Profile updated', date: new Date() },
        { type: 'tree', message: 'Family tree viewed', date: new Date() }
      ];

      setStats({
        familyMembers,
        photos,
        groups,
        recentActivities,
        recentPhotos,
        pendingRequests
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4F6F52] mx-auto"></div>
            <p className="mt-4 text-[#313131]">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#F4F4F4]">
        <div className="container mx-auto p-8 py-20">
          {/* Welcome Header */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h1 className="text-4xl font-bold text-[#313131] mb-2">
              Welcome back, {userData?.firstName || 'User'}!
            </h1>
            <p className="text-lg text-[#313131] mb-4">
              Here's an overview of your family activities
            </p>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar size={16} className="mr-2" />
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          {/* Show verification message if needed */}
          {verificationMessage && (
            <div className="bg-[#4F6F52] text-white p-4 rounded-md mb-8">
              {verificationMessage}
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-[#4F6F52] p-3 rounded-lg">
                  <Users size={24} className="text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-[#313131]">{stats.familyMembers}</h3>
                  <p className="text-gray-600">Family Members</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-[#4F6F52] p-3 rounded-lg">
                  <ImageIcon size={24} className="text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-[#313131]">{stats.photos}</h3>
                  <p className="text-gray-600">Photos</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-[#4F6F52] p-3 rounded-lg">
                  <Users size={24} className="text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-[#313131]">{stats.groups}</h3>
                  <p className="text-gray-600">Family Groups</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-[#4F6F52] p-3 rounded-lg">
                  <TrendingUp size={24} className="text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-[#313131]">{stats.pendingRequests}</h3>
                  <p className="text-gray-600">Pending Requests</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 gap-8">
            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-[#313131] mb-4">Recent Activities</h2>
              {stats.recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-[#4F6F52] rounded-full mr-3"></div>
                      <div className="flex-1">
                        <p className="text-[#313131]">{activity.message}</p>
                        <p className="text-sm text-gray-600">
                          {activity.date.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No recent activities to display.</p>
              )}
            </div>
          </div>

          {/* Recent Photos Section */}
          {stats.recentPhotos.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mt-8">
              <h2 className="text-2xl font-bold text-[#313131] mb-4">Recent Photos</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.recentPhotos.map((photo, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg overflow-hidden">
                    <img 
                      src={photo.imageUrl} 
                      alt="Recent photo" 
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-xs text-gray-600">
                        {photo.uploadedAt
                          ? new Date(photo.uploadedAt._seconds * 1000).toLocaleDateString()
                          : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="/gallery">
                  <button className="bg-[#4F6F52] text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors">
                    View All Photos
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default function Dashboard() {
  return (
    <AuthController mode="PROTECT">
      <DashboardContent />
    </AuthController>
  );
}