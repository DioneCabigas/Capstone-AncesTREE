"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/utils/firebase";
import Layout from "@/components/Layout";
import AuthController from "@/components/AuthController";
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { MoreHorizontal, Plus, User, Edit3, UserPlus, X } from "lucide-react";
import axios from "axios";
import * as f3 from "family-chart";

function PersonalTree() {
  const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
  const searchParams = useSearchParams();
  const externalUid = searchParams.get("uid");

  const [isCurrentUsersTree, setIsCurrentUsersTree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [treeId, setTreeId] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [isChartReady, setIsChartReady] = useState(false);

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, async (user) => {
  //     if (user) {
  //       console.log("User logged in:", user.uid);
  //       setCurrentUserId(user.uid);
  //       try {
  //         const profileResponse = await axios.get(`${BACKEND_BASE_URL}/api/user/${user.uid}`);
  //         setCurrentUser(profileResponse.data);
  //         console.log("Fetched user profile: ", profileResponse.data);
  //       } catch (error) {
  //         console.log("Failed to fetch current user profile.", error);
  //       }
  //     } else {
  //       console.log("User logged out.");
  //       setCurrentUser(null);
  //       setCurrentUserId(null);
  //       setTreeId(null);
  //     }
  //   });

  //   return () => {
  //     console.log("Cleaning up auth state listener.");
  //     unsubscribe();
  //   };
  // }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstanceRef.current) return;

    // In dev (React Strict Mode), effects can run twice.
    chartRef.current.innerHTML = "";

    const data = [
      {
        id: "1",
        data: { "first name": "John", "last name": "Doe", birthday: "1980", gender: "M" },
        rels: { spouses: ["2"], children: ["3"] },
      },
      {
        id: "2",
        data: { "first name": "Jane", "last name": "Doe", birthday: "1982", gender: "F" },
        rels: { spouses: ["1"], children: ["3"] },
      },
      {
        id: "3",
        data: { "first name": "Bob", "last name": "Doe", birthday: "2005", gender: "M" },
        rels: { parents: ["1", "2"] },
      },
    ];

    try {
      const f3Chart = f3.createChart(chartRef.current, data);
      chartInstanceRef.current = f3Chart;
      f3Chart.setCardHtml().setCardDisplay([["first name", "last name"], ["birthday"]]);
      f3Chart.updateTree({ initial: true });
    } catch (error) {
      console.error("Error rendering chart:", error);
    }

    return () => {
      chartInstanceRef.current = null;
      if (chartRef.current) chartRef.current.innerHTML = "";
    };
  }, []);

  return (
    <Layout>
      <div className="min-h-screen relative" style={{ backgroundColor: "#D9D9D9" }}>
        <div
          className="f3"
          id="FamilyChart"
          ref={chartRef}
          style={{ width: "100%", height: "900px", margin: "auto", backgroundColor: "rgb(33,33,33)", color: "#fff" }}
        />
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
