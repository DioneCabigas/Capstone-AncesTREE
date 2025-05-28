"use client";

import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/utils/firebase";
import Navbar from "@/components/Navbar";
import React, { useState, useEffect } from "react";
import { MoreHorizontal, Plus, User, Edit3, UserPlus, X } from "lucide-react";
import ReactFlow, { ReactFlowProvider, Background, Controls, useReactFlow } from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";
import PersonNode from "@/components/PersonNode";
import axios from "axios";
import { tree } from "next/dist/build/templates/app-page";

const nodeTypes = {
  person: PersonNode,
};

const initialFormData = {
  relationship: "",
  firstName: "",
  middleName: "",
  lastName: "",
  birthDate: "",
  birthPlace: "",
  gender: "",
  status: "Living",
  dateOfDeath: "",
  placeOfDeath: "",
};

export default function TreeBuilder() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Add member");
  const [formData, setFormData] = useState({ ...initialFormData });
  const [isValid, setIsValid] = useState(false);
  const [people, setPeople] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [treeId, setTreeId] = useState(null);
  const [selectedPersonId, setSelectedPersonId] = useState(null);

  const getSortedSpouseIds = (id1, id2) => {
    return id1 < id2 ? [id1, id2] : [id2, id1];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User logged in:", user.uid);
        setCurrentUserId(user.uid);
        try {
          const profileResponse = await axios.get(`http://localhost:3001/api/user/${user.uid}`);
          setCurrentUser(profileResponse.data);
          console.log("Fetched user profile: ", profileResponse.data);
        } catch (error) {
          console.log("Failed to fetch current user profile.", error);
        }
      } else {
        console.log("User logged out.");
        setCurrentUser(null);
        setCurrentUserId(null); // Clear userId on logout
        setTreeId(null); // Clear treeId on logout
        setNodes([]);
        setEdges([]);
        setPeople([]);
      }
    });

    // The cleanup function for useEffect.
    // This will be called when the component unmounts.
    return () => {
      console.log("Cleaning up auth state listener.");
      unsubscribe(); // Call the unsubscribe function to stop listening
    };
  }, [auth]); // Dependency array: re-run if the 'auth' instance changes (unlikely, but good practice)

  useEffect(() => {
    if (currentUserId && currentUser) {
      // Ensure both UID and profile data are available
      console.log("Both UID and User Profile are ready. Fetching tree data.");
      fetchTreeData(currentUserId, currentUser); // Pass uid and profile data
    } else if (!currentUserId && !currentUser) {
      console.log("User logged out or profile not loaded yet.");
      setNodes([]);
      setEdges([]);
      setPeople([]);
    }
  }, [currentUserId, currentUser]); // Depends on both states

  const transformPeopleToNodes = (people, openSidebar) => {
    return people.map((person) => ({
      id: person.personId,
      type: "person",
      position: { x: 0, y: 0 }, // Initial position, will be updated by layout algorithm
      data: {
        personId: person.personId,
        firstName: person.firstName,
        middleName: person.middleName,
        lastName: person.lastName,
        gender: person.gender,
        birthDate: person.birthDate,
        birthPlace: person.birthPlace,
        status: person.status,
        // add fields here for deceased status
        relationships: person.relationships.map((rel) => ({
          relatedPersonId: rel.relatedPersonId,
          type: rel.type,
        })),

        // Pass functions needed by the node
        openSidebar: openSidebar,
        // Add other node-specific properties for your custom PersonNode
        // e.g., actionMenuOpen, toggleActionMenu if those are managed per-node
      },
    }));
  };

  const transformPeopleToEdges = (people) => {
    const reactFlowEdges = [];
    const dagreEdges = []; // Edges specifically for Dagre layout, might not be rendered

    // Helper to find a person by ID for their relationships
    const getPersonById = (id) => people.find((p) => p.personId === id);

    const processedSpousePairs = new Set(); // To prevent duplicate spouse edges

    people.forEach((person) => {
      // Iterate through relationships for Parent/Child links (vertical)
      person.relationships.forEach((rel) => {
        const targetPerson = getPersonById(rel.relatedPersonId);
        if (!targetPerson) return; // Skip if related person not found in current data

        // --- Parent-Child Logic ---
        // Assuming `rel.type` on `person` refers to *their* relationship to `rel.relatedPersonId`
        // If 'person' is the PARENT of 'targetPerson':
        if (rel.type.toLowerCase() === "child") {
          // The current 'person' is the parent, 'rel.relatedPersonId' is the child
          // Edge from parent to child (top to bottom)
          reactFlowEdges.push({
            id: `e-${person.personId}-${rel.relatedPersonId}-parentOf`,
            source: person.personId,
            target: rel.relatedPersonId,
            label: "parent of",
            type: "smoothstep",
            // sourceHandle: 'bottom', // Assuming parent node has a 'bottom' handle
            // targetHandle: 'top',    // Assuming child node has a 'top' handle
          });
          // Add a Dagre edge to ensure vertical flow
          dagreEdges.push({ source: person.personId, target: rel.relatedPersonId });
        }
        // If 'person' is the CHILD of 'targetPerson':
        else if (rel.type.toLowerCase() === "parent") {
          // The current 'person' is the child, 'rel.relatedPersonId' is the parent
          // Edge from parent to child (top to bottom)
          reactFlowEdges.push({
            id: `e-${rel.relatedPersonId}-${person.personId}-parentOf`,
            source: rel.relatedPersonId,
            target: person.personId,
            label: "parent of",
            type: "smoothstep",
            // sourceHandle: 'bottom',
            // targetHandle: 'top',
          });
          // Add a Dagre edge
          dagreEdges.push({ source: rel.relatedPersonId, target: person.personId });
        }

        // --- Spouse Logic (Horizontal Alignment) ---
        else if (rel.type.toLowerCase() === "spouse") {
          const [id1, id2] = getSortedSpouseIds(person.personId, rel.relatedPersonId);
          const spouseKey = `${id1}-${id2}`;

          if (!processedSpousePairs.has(spouseKey)) {
            // Create React Flow edge for spouse
            reactFlowEdges.push({
              id: `e-${id1}-${id2}-spouseOf`,
              source: id1,
              target: id2,
              label: "spouse of",
              type: "smoothstep",
              // sourceHandle: 'right', // Assuming spouses connect horizontally
              // targetHandle: 'left',
            });

            // Create an invisible Dagre edge with minlen 1 for horizontal placement
            // Dagre treats edges with minlen=1 as trying to keep nodes on the same rank
            dagreEdges.push({
              source: id1,
              target: id2,
              minlen: 1, // Encourages horizontal placement
              // Set specific rank for these nodes if needed, or let Dagre try to place them
            });

            processedSpousePairs.add(spouseKey);
          }
        }
        // You can add logic for 'sibling' here as well, similar to spouse but potentially
        // based on common parents, or directly through a 'sibling' relationship if stored.
        // For siblings, you might need a "dummy node" for parents to connect children to,
        // or just use minlen on invisible edges between siblings if they are explicitly linked.
        // A common pattern for siblings is to have an invisible node that represents the "marriage"
        // or "parental bond" and connect children to that node, then the parents to that node.
      });
    });

    return { reactFlowEdges, dagreEdges }; // Return both sets of edges
  };

  const applyLayout = (nodes, { reactFlowEdges, dagreEdges }, direction = "TB") => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Set graph direction and node separation
    dagreGraph.setGraph({
      rankdir: direction, // "TB" for Top-to-Bottom, "LR" for Left-to-Right
      nodesep: 50, // Minimum space between nodes on the same rank
      ranksep: 100, // Minimum space between ranks (vertical layers)
    });

    const nodeWidth = 170; // Adjust this based on your PersonNode's actual size
    const nodeHeight = 80; // Adjust this based on your PersonNode's actual size

    // Add nodes to Dagre graph with dimensions
    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    // Add Dagre layout edges
    dagreEdges.forEach((edge) => {
      // Use 'minlen' for edges that should encourage horizontal alignment (like spouses)
      // If minlen is 1, Dagre tries to keep nodes on the same rank (horizontal)
      // Otherwise, standard hierarchical edge.
      dagreGraph.setEdge(edge.source, edge.target, { minlen: edge.minlen || 1 });
    });

    // Run the Dagre layout algorithm
    dagre.layout(dagreGraph);

    // Position React Flow nodes based on Dagre layout
    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      // React Flow uses top-left, Dagre uses center
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    });

    return { layoutedNodes, reactFlowEdges }; // Return both for state update
  };

  // FETCH TREE DATA
  const fetchTreeData = async (uid, userProfileData) => {
    if (!uid) {
      console.warn("Cannot fetch tree data: UID is null."); //test
      return;
    }

    let treeIdToUse = null;

    try {
      const treeResponse = await axios.get(`http://localhost:3001/api/family-trees/personal/${uid}`);
      const personalTreeData = treeResponse.data;

      if (personalTreeData && personalTreeData.treeId) {
        // If a personal tree was found, use its treeId
        treeIdToUse = personalTreeData.treeId;
        setTreeId(treeIdToUse);
        console.log("Existing Personal tree Id found:", treeIdToUse);
      } else {
        // CREATE NEW TREE
        console.warn("Personal tree not found for user:", uid, ". Creating a new one...");
        try {
          treeIdToUse = await createTree(uid, userProfileData);
        } catch (createTreeError) {
          console.error("Failed to create new tree during fetchTreeData: ", createTreeError);
          return;
        }
      }

      if (treeIdToUse) {
        console.log("Fetching persons for tree ID:", treeIdToUse);
        const personsResponse = await axios.get(`http://localhost:3001/api/persons/tree/${treeIdToUse}`);
        const fetchedPeople = personsResponse.data;
        console.log("People data:", fetchedPeople);
        setPeople(fetchedPeople);

        const newNodes = transformPeopleToNodes(fetchedPeople, openSidebar);
        const { reactFlowEdges, dagreEdges } = transformPeopleToEdges(fetchedPeople); // Get both sets of edges

        // Pass both to applyLayout
        const { layoutedNodes, reactFlowEdges: finalReactFlowEdges } = applyLayout(newNodes, { reactFlowEdges, dagreEdges });

        setNodes(layoutedNodes);
        setEdges(finalReactFlowEdges); // Set the edges meant for rendering
      } else {
        console.error("No treeId available to fetch persons.");
      }
    } catch (error) {
      console.error("Failed to fetch tree data:", error);
    }
  };

  const createTree = async (uid, userProfileData) => {
    let treeIdToUse = null;
    try {
      const createTreeResponse = await axios.post(`http://localhost:3001/api/family-trees`, {
        userId: uid,
        treeName: uid,
      });

      const newTreeId = createTreeResponse.data.treeId;
      treeIdToUse = newTreeId;
      console.log("New Personal tree created: ", treeIdToUse);

      const personSelfResponse = await axios.post(`http://localhost:3001/api/persons/self/${treeIdToUse}`, {
        uid: uid,
        firstName: userProfileData?.firstName || "My",
        middleName: userProfileData?.middleName || "",
        lastName: userProfileData?.lastName || "Self",
        birthDate: userProfileData?.birthDate || "", // Provide a default in YYYY-MM-DD format
        birthPlace: userProfileData?.birthPlace || "",
        status: "living",
        // dateOfDeath: userProfileData?.dateOfDeath || "",
        // placeOfDeath: userProfileData?.placeOfDeath || "",
        relationships: [],
      });
      console.log("First person created ", personSelfResponse.data);
      return treeIdToUse;
    } catch (error) {
      console.error("Error creating new tree or first person:", error);
      throw error;
    }
  };

  // Sample data for connections and suggestions
  const connections = [
    { id: 1, name: "Jane Doe", timeframe: "year - Present" },
    { id: 2, name: "Jane Doe", timeframe: "year - Present" },
    { id: 3, name: "Jane Doe", timeframe: "year - Present" },
  ];

  const suggestions = [
    { id: 1, name: "Jane Doe", timeframe: "year - Present", relatedTo: "John Doe" },
    { id: 2, name: "Jane Doe", timeframe: "year - Present", relatedTo: "John Doe" },
    { id: 3, name: "Jane Doe", timeframe: "year - Present", relatedTo: "John Doe" },
  ];

  const handleAddPerson = async () => {
    console.log("PersonId:", selectedPersonId);
    console.log("Adding person:", formData);
    // Here you would integrate with your Firebase/Express API

    const { relationship, ...personDataToSend } = formData;
    personDataToSend.relationships = [];

    console.log("Sending person data:", personDataToSend);
    console.log("Relationship to establish:", relationship);
    console.log("Targeting treeId:", treeId);

    try {
      const createPersonResponse = await axios.post(`http://localhost:3001/api/persons/${treeId}`, {
        ...personDataToSend,
      });
      const personResponse = createPersonResponse.data;
      console.log(`Successfully added person to tree ${treeId}: `, personResponse);

      if (personResponse && selectedPersonId) {
        try {
          const updateRelationshipResponse = await axios.put(`http://localhost:3001/api/persons/${selectedPersonId}`, {
            relationships: [
              {
                relatedPersonId: personResponse.personId,
                type: relationship,
              },
            ],
          });

          console.log(`Successfully updated relationship for person ${selectedPersonId}:`, updateRelationshipResponse.data);
        } catch (error) {
          console.warn(`Error adding relationship to person ${personResponse}: `, error);
          return;
        }
      } else {
        console.warn("Person Id not found for your clicked person");
      }

      await fetchTreeData(currentUserId, currentUser);
    } catch (error) {
      console.warn("Error adding person to tree: ", error);
    }

    setSidebarOpen(false);
    setFormData({ ...initialFormData });
  };

  const openSidebar = (personId) => {
    setSelectedPersonId(personId);
    setSidebarOpen(true);
    setActionMenuOpen(false); // Close action menu when opening sidebar
    setFormData({ ...initialFormData });
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleActionMenu = () => {
    setActionMenuOpen(!actionMenuOpen);
  };

  const closeActionMenu = (e) => {
    // Don't close if clicking on the action buttons themselves
    if (e.target.closest(".action-buttons")) {
      return;
    }
    setActionMenuOpen(false);
  };

  const handleAddToTree = (person) => {
    console.log("Adding to tree:", person);
    // Here you would integrate with your Firebase/Express API
  };

  const handleViewPerson = (person) => {
    console.log("Viewing person:", person);
    // Here you would open a detailed view or navigate to person's profile
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "#D9D9D9" }}>
      <Navbar />
      {/* Main Tree Area */}
      <div className="flex items-center justify-center" style={{ height: "calc(100vh - 64px)" }}>
        <ReactFlowProvider>
          <div style={{ width: "100%", height: "100%" }}>
            <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
              <Background />
              <Controls />
            </ReactFlow>
          </div>
        </ReactFlowProvider>
      </div>

      {/* Click outside to close action menu - positioned behind action buttons */}
      {actionMenuOpen && <div className="fixed inset-0 z-10" onClick={closeActionMenu} />}

      {/* Overlay for sidebar */}
      {sidebarOpen && <div className="fixed inset-0 bg-black opacity-20 z-40" onClick={closeSidebar} />}

      {/* Sticky Sidebar */}
      <div
        className={`fixed top-[62px] right-0 h-[calc(100%-4rem)] w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {["Add member", "Connections", "Suggestions"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`mx-1 my-1 rounded-sm px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab ? "text-white" : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
                style={activeTab === tab ? { backgroundColor: "#365643" } : {}}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        {activeTab === "Add member" && (
          <div className="p-6 space-y-3 overflow-y-auto h-full pb-16 pt-4">
            {/* Relationship */}
            <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
            <div className="flex items-center space-x-6">
              {/* Parent*/}
              <label className="flex items-center">
                <div className="relative">
                  <input type="radio" name="relationship" value="parent" checked={formData.relationship === "parent"} onChange={handleInputChange} className="sr-only" />
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${formData.relationship === "parent" ? "" : "border-gray-300"}`}
                    style={formData.relationship === "parent" ? { backgroundColor: "#365643", borderColor: "#365643" } : {}}
                  />
                </div>
                <span className="ml-2 text-sm text-gray-700">Parent</span>
              </label>
              {/* Child */}
              <label className="flex items-center">
                <div className="relative">
                  <input type="radio" name="relationship" value="child" checked={formData.relationship === "child"} onChange={handleInputChange} className="sr-only" />
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${formData.relationship === "child" ? "" : "border-gray-300"}`}
                    style={formData.relationship === "child" ? { backgroundColor: "#365643", borderColor: "#365643" } : {}}
                  />
                </div>
                <span className="ml-2 text-sm text-gray-700">Child</span>
              </label>
              {/* Spouse */}
              <label className="flex items-center">
                <div className="relative">
                  <input type="radio" name="relationship" value="spouse" checked={formData.relationship === "spouse"} onChange={handleInputChange} className="sr-only" />
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${formData.relationship === "spouse" ? "" : "border-gray-300"}`}
                    style={formData.relationship === "spouse" ? { backgroundColor: "#365643", borderColor: "#365643" } : {}}
                  />
                </div>
                <span className="ml-2 text-sm text-gray-700">Spouse</span>
              </label>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900"
              />
            </div>

            {/* Middle Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900"
              />
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                placeholder=""
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900"
              />
            </div>

            {/* Birth Place */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Place</label>
              <input
                type="text"
                name="birthPlace"
                value={formData.birthPlace}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900"
              />
            </div>

            {/* Gender */}
            <div>
              {/* Male Radio */}
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <div className="relative">
                    <input type="radio" name="gender" value="male" checked={formData.gender === "male"} onChange={handleInputChange} className="sr-only" />
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${formData.gender === "male" ? "" : "border-gray-300"}`}
                      style={formData.gender === "male" ? { backgroundColor: "#365643", borderColor: "#365643" } : {}}
                    />
                  </div>
                  <span className="ml-2 text-sm text-gray-700">Male</span>
                </label>
                {/* Female Radio */}
                <label className="flex items-center">
                  <div className="relative">
                    <input type="radio" name="gender" value="female" checked={formData.gender === "female"} onChange={handleInputChange} className="sr-only" />
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${formData.gender === "female" ? "" : "border-gray-300"}`}
                      style={formData.gender === "female" ? { backgroundColor: "#365643", borderColor: "#365643" } : {}}
                    />
                  </div>
                  <span className="ml-2 text-sm text-gray-700">Female</span>
                </label>
              </div>
            </div>

            {/* Status */}
            <div>
              {/* Living radio */}
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <div className="relative">
                    <input type="radio" name="status" value="living" checked={formData.status === "living"} onChange={handleInputChange} className="sr-only" />
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.status === "living" ? "" : "border-gray-300"}`}
                      style={formData.status === "living" ? { backgroundColor: "#365643", borderColor: "#365643" } : {}}
                    />
                  </div>
                  <span className="ml-2 text-sm text-gray-700">Living</span>
                </label>
                {/* Deceased Radio */}
                <label className="flex items-center">
                  <div className="relative">
                    <input type="radio" name="status" value="deceased" checked={formData.status === "deceased"} onChange={handleInputChange} className="sr-only" />
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.status === "deceased" ? "" : "border-gray-300"}`}
                      style={formData.status === "deceased" ? { backgroundColor: "#365643", borderColor: "#365643" } : {}}
                    />
                  </div>
                  <span className="ml-2 text-gray-700">Deceased</span>
                </label>
              </div>
            </div>

            {formData.status === "Deceased" && (
              <div>
                {/* Date of Death */}
                <div className="pb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Death</label>
                  <input
                    type="date"
                    name="dateOfDeath"
                    value={formData.dateOfDeath}
                    onChange={handleInputChange}
                    disabled={formData.status === "Living"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
                {/* Place of Death */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Place of Death</label>
                  <input
                    type="text"
                    name="placeOfDeath"
                    value={formData.placeOfDeath}
                    onChange={handleInputChange}
                    disabled={formData.status === "Living"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {/* Add Person Button */}
            <div className="pt-4">
              <button
                onClick={handleAddPerson}
                className="w-full text-white py-2.5 px-4 rounded-md hover:bg-green-500 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                style={{ backgroundColor: "#365643" }}
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Person</span>
              </button>
            </div>
          </div>
        )}

        {/* Connections Tab */}
        {activeTab === "Connections" && (
          <div className="p-6 space-y-4 overflow-y-auto h-full">
            {connections.map((person) => (
              <div key={person.id} className="border border-gray-300 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{person.name}</h4>
                    <p className="text-xs text-gray-500">{person.timeframe}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAddToTree(person)}
                  className="text-white px-3 py-1.5 rounded text-xs font-medium hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#365643" }}
                >
                  Add to Tree
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === "Suggestions" && (
          <div className="p-6 space-y-4 overflow-y-auto h-full">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">AI Analysis Suggestion</h3>
              <p className="text-xs text-gray-600">You might be related to these following people</p>
            </div>

            {suggestions.map((person) => (
              <div key={person.id} className="space-y-2">
                <p className="text-xs text-gray-700">
                  <span className="font-medium">Related to:</span> {person.relatedTo} in your tree
                </p>
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-800">{person.name}</h4>
                        <p className="text-xs text-gray-500">{person.timeframe}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewPerson(person)}
                        className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleAddToTree(person)}
                        className="text-white px-3 py-1.5 rounded text-xs font-medium hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: "#365643" }}
                      >
                        Add to Tree
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
