"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/utils/firebase";
import Layout from '@/components/Layout';
import AuthController from '@/components/AuthController';
import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Plus, User, Edit3, UserPlus, X } from "lucide-react";
import "reactflow/dist/style.css";
import axios from "axios";

function PersonalTree(){
    const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
    const searchParams = useSearchParams();
    const externalUid = searchParams.get("uid");
    const [isCurrentUsersTree, setIsCurrentUsersTree] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [treeId, setTreeId] = useState(null);

    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User logged in:", user.uid);
        setCurrentUserId(user.uid);
        try {
          const profileResponse = await axios.get(`${BACKEND_BASE_URL}/api/user/${user.uid}`);
          setCurrentUser(profileResponse.data);
          console.log("Fetched user profile: ", profileResponse.data);
        } catch (error) {
          console.log("Failed to fetch current user profile.", error);
        }
      } else {
        console.log("User logged out.");
        setCurrentUser(null);
        setCurrentUserId(null);
        setTreeId(null);
      }
    });

    return () => {
      console.log("Cleaning up auth state listener.");
      unsubscribe();
    };
  }, []);

    return (
        <Layout>
            <div className="min-h-screen relative" style={{ backgroundColor: "#D9D9D9" }}>
                <h1 className="text-center">Personal Tree Page</h1>
            </div>
        </Layout>
    );
}

// Wrap with AuthController to ensure only authenticated users can access
function PersonalTreeWithAuth() {
  return (
    <AuthController mode="PROTECT">
      <PersonalTree />
    </AuthController>
  );
}

export default PersonalTreeWithAuth;