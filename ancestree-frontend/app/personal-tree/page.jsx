"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/utils/firebase";
import Layout from "@/components/Layout";
import AuthController from "@/components/AuthController";
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { MoreHorizontal, Plus, User, Edit3, UserPlus, X } from "lucide-react";
import axios from "axios";
import * as d3 from "d3";
import * as f3 from "family-chart";
import "family-chart/styles/family-chart.css";

function PersonalTree() {
  const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
  const searchParams = useSearchParams();
  const externalUid = searchParams.get("uid");
  const [isCurrentUsersTree, setIsCurrentUsersTree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [treeId, setTreeId] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [personsData, setPersonsData] = useState([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const chartRef = useRef(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const chartInstanceRef = useRef(null);

  // Ref callback to know when the chart element is mounted
  const setChartRef = (element) => {
    chartRef.current = element;
    if (element) {
      setIsChartReady(true);
    }
  };

  const fetchTreeData = async (uid, isCurrentUsersTreeBool) => {
    if (!uid) {
      console.warn("Cannot fetch tree data: UID is null."); //test
      return;
    }

    console.log("Fetching tree data...");
    console.log("isCurrentUsersTreeBool: ", isCurrentUsersTreeBool);
    console.log("isCurrentUsersTree: ", isCurrentUsersTree);

    setIsLoading(true);
    let treeIdToUse = null;
    try {
      const treeResponse = await axios.get(`${BACKEND_BASE_URL}/api/tree/${uid}`);

      const fetchedTreeData = treeResponse.data;
      // setTreeData(treeResponse.data);
      console.log("Fetched tree data:", treeResponse.data);

      // set tree ID to use for fetching persons
      if (fetchedTreeData && fetchedTreeData.treeId) {
        treeIdToUse = fetchedTreeData.treeId; // set treeIdToUse for fetching persons
        setTreeId(treeIdToUse); // put treeId in useState for other uses
        console.log("Existing Personal tree Id found:", treeIdToUse);
      }

      // fetch persons for the tree
      if (treeIdToUse) {
        console.log("Fetching persons for tree ID:", treeIdToUse);
        const personsResponse = await axios.get(`${BACKEND_BASE_URL}/api/persons/tree/${treeIdToUse}`);
        const fetchedPersons = personsResponse.data;
        console.log("Fetched persons data:", fetchedPersons);
        setTreeData({ ...fetchedTreeData, persons: fetchedPersons });
      }
    } catch (error) {
      console.error("Failed to fetch tree data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // FETCH TREE DATA USE EFFECT
  // useEffect(() => {
  //   if (externalUid !== currentUserId) {
  //     const isCurrentUsersTreeBool = false;
  //     fetchTreeData(externalUid, currentUser, isCurrentUsersTreeBool);
  //     setIsCurrentUsersTree(false);
  //   } else if (currentUserId && currentUser) {
  //     const isCurrentUsersTreeBool = true;
  //     console.log("Both UID and User Profile are ready. Fetching tree data.");
  //     setIsCurrentUsersTree(true);
  //     fetchTreeData(currentUserId, currentUser, isCurrentUsersTreeBool);
  //   } else if (!currentUserId && !currentUser) {
  //     console.log("User logged out or profile not loaded yet.");
  //   }
  // }, [currentUserId, currentUser, externalUid]);

  // Initialize family chart when the chart element is ready (the chart only initializes when the DOM element is definitely ready)
  // This fixes issues with the chart not rendering properly on first load
  useLayoutEffect(() => {
    // Do nothing if the container is not ready
    if (!isChartReady || !chartRef.current) return;

    // Prevent creating the chart more than once
    if (chartInstanceRef.current) return;

    try {
      console.log("Creating family chart...");
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
          data: { "first name": "Ben", "last name": "Doe", birthday: "2005", gender: "M" },
          rels: { parents: ["1", "2"] },
        },
      ];

      const f3Chart = f3.createChart("#FamilyChart", data);
      console.log("Chart created:", f3Chart);

      const f3Card = f3Chart.setCardHtml().setCardDisplay([["first name", "last name"], ["birthday"], ["gender"]]);

      const f3EditTree = f3Chart.editTree().fixed(true).setFields(["first name", "last name", "birthday", "avatar"]).setEditFirst(true).setCardClickOpen(f3Card);
      f3EditTree.setEdit();

      f3Chart.updateTree({ initial: true });
      f3EditTree.open(f3Chart.getMainDatum());
      f3Chart.updateTree({ initial: true });

      // Store chart instance for later use
      chartInstanceRef.current = f3Chart;

      console.log("Chart updated successfully");
    } catch (error) {
      console.error("Error creating family chart:", error);
    }

    // Cleanup when component unmounts
    return () => {
      console.log("Cleaning up family chart");
      chartInstanceRef.current = null;
    };
  }, [isChartReady]);

  // Listen for auth state changes to get current user info
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
        <div className="f3" id="FamilyChart" ref={setChartRef} style={{ width: "100%", height: "900px", margin: "auto", backgroundColor: "rgb(33,33,33)", color: "#fff" }} />
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
