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

const nodeTypes = {
  person: PersonNode,
  marriage: () => null,
};

const initialFormData = {
  relationship: "",
  firstName: "",
  middleName: "",
  lastName: "",
  birthDate: "",
  birthPlace: "",
  gender: "",
  status: "living",
  dateOfDeath: "",
  placeOfDeath: "",
};

export default function PersonalTree() {
  const [isLoading, setIsLoading] = useState(false);
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [personDetailsInModal, setPersonDetailsInModal] = useState(null);

  const getSortedSpouseIds = (id1, id2) => {
    return id1 < id2 ? [id1, id2] : [id2, id1];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "status" && value === "living") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        dateOfDeath: "",
        placeOfDeath: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
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
        setCurrentUserId(null);
        setTreeId(null);
        setNodes([]);
        setEdges([]);
        setPeople([]);
      }
    });

    return () => {
      console.log("Cleaning up auth state listener.");
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (currentUserId && currentUser) {
      console.log("Both UID and User Profile are ready. Fetching tree data.");
      fetchTreeData(currentUserId, currentUser);
    } else if (!currentUserId && !currentUser) {
      console.log("User logged out or profile not loaded yet.");
      setNodes([]);
      setEdges([]);
      setPeople([]);
    }
  }, [currentUserId, currentUser]);

  const transformPeopleToNodes = (people, openSidebar, handleDeletePerson, handleViewPerson) => {
    return people.map((person) => ({
      id: person.personId,
      type: "person",
      position: { x: 0, y: 0 },
      data: {
        personId: person.personId,
        firstName: person.firstName,
        middleName: person.middleName,
        lastName: person.lastName,
        gender: person.gender,
        birthDate: person.birthDate,
        birthPlace: person.birthPlace,
        status: person.status,
        // fields for deceased?
        relationships: person.relationships.map((rel) => ({
          relatedPersonId: rel.relatedPersonId,
          type: rel.type,
        })),

        // Functions
        openSidebar: openSidebar,
        handleDeletePerson: handleDeletePerson,
        handleViewPerson: handleViewPerson,
        handleEditPerson: (personData) => {
          setSelectedPersonId(personData.personId);
          setFormData(personData);
          setIsEditMode(true);
          setSidebarOpen(true);
        },
      },
    }));
  };

  const handleViewPerson = (personData) => {
    setPersonDetailsInModal(personData);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPersonDetailsInModal(null);
  };

  const transformPeopleToEdges = (people) => {
    const reactFlowEdges = [];
    const dagreNodes = new Map();
    const dagreEdges = [];

    const getPersonById = (id) => people.find((p) => p.personId === id);

    const addedReactFlowEdges = new Set();
    const addedDagreEdges = new Set();
    const processedSpousePairs = new Set();

    people.forEach((person) => {
      dagreNodes.set(person.personId, { id: person.personId, type: "person" });
    });

    people.forEach((person) => {
      person.relationships.forEach((rel) => {
        const targetPerson = getPersonById(rel.relatedPersonId);
        if (!targetPerson) return;

        const lowercaseRelType = rel.type.toLowerCase();

        // Parent - Child Logic
        let parentId, childId;
        if (lowercaseRelType === "child") {
          parentId = person.personId;
          childId = rel.relatedPersonId;
        } else if (lowercaseRelType === "parent") {
          parentId = rel.relatedPersonId;
          childId = person.personId;
        }

        if (parentId && childId) {
          const edgeKey = `P_${parentId}-${childId}`;
          if (!addedReactFlowEdges.has(edgeKey)) {
            reactFlowEdges.push({
              id: `e-${parentId}-${childId}-parentOf`,
              source: childId,
              target: parentId,
              // label: "parent of",
              type: "smoothstep",
              // sourceHandle: "bottom",
              // targetHandle: "top",
            });
            addedReactFlowEdges.add(edgeKey);
          }
          const dagreEdgeKey = `D_${parentId}-${childId}`;
          if (!addedDagreEdges.has(dagreEdgeKey)) {
            dagreEdges.push({ source: childId, target: parentId });
            addedDagreEdges.add(dagreEdgeKey);
          }
        }

        // Spouse Logic
        else if (lowercaseRelType === "spouse") {
          const [id1, id2] = getSortedSpouseIds(person.personId, rel.relatedPersonId);
          const spouseEdgeKey = `S_${id1}-${id2}`;

          if (!addedReactFlowEdges.has(spouseEdgeKey)) {
            reactFlowEdges.push({
              id: `e-${id1}-${id2}-spouseOf`,
              source: id1,
              target: id2,
              // label: "spouse of",
              type: "smoothstep",
              // sourceHandle: "right",
              // targetHandle: "left",
            });
            addedReactFlowEdges.add(spouseEdgeKey);
          }

          const dagreSpouseEdgeKey = `DS_${id1}-${id2}`;
          if (!addedDagreEdges.has(dagreSpouseEdgeKey)) {
            dagreEdges.push({
              source: id1,
              target: id2,
              minlen: 1,
              constraint: "same",
            });
            addedDagreEdges.add(dagreSpouseEdgeKey);
          }
        }
      });
    });

    return { reactFlowEdges, dagreEdges };
  };

  const applyLayout = (nodes, { reactFlowEdges, dagreEdges }, direction = "TB") => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
      rankdir: direction,
      nodesep: 50,
      ranksep: 100,
      // ranker: "tight-tree",
    });

    const nodeWidth = 200;
    const nodeHeight = 150;

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    dagreEdges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target, { minlen: edge.minlen || 1 });
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    });

    return { layoutedNodes, reactFlowEdges };
  };

  // FETCH TREE DATA
  const fetchTreeData = async (uid, userProfileData) => {
    if (!uid) {
      console.warn("Cannot fetch tree data: UID is null."); //test
      return;
    }

    setIsLoading(true);
    let treeIdToUse = null;

    try {
      const treeResponse = await axios.get(`http://localhost:3001/api/family-trees/personal/${uid}`);
      const personalTreeData = treeResponse.data;

      if (personalTreeData && personalTreeData.treeId) {
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

        const newNodes = transformPeopleToNodes(fetchedPeople, openSidebar, handleDeletePerson, handleViewPerson);
        const { reactFlowEdges, dagreEdges } = transformPeopleToEdges(fetchedPeople);

        const { layoutedNodes, reactFlowEdges: finalReactFlowEdges } = applyLayout(newNodes, { reactFlowEdges, dagreEdges });

        setNodes(layoutedNodes);
        setEdges(finalReactFlowEdges);
      } else {
        console.error("No treeId available to fetch persons.");
      }
    } catch (error) {
      console.error("Failed to fetch tree data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTree = async (uid, userProfileData) => {
    let treeIdToUse = null;
    try {
      const newTreeId = await axios.post(`http://localhost:3001/api/family-trees/newTree`, {
        userId: uid,
        treeName: uid,
        firstName: userProfileData?.firstName || "My",
        middleName: userProfileData?.middleName || "",
        lastName: userProfileData?.lastName || "Self",
        birthDate: userProfileData?.birthDate || "",
        birthPlace: userProfileData?.birthPlace || "",
        gender: "",
        status: "living",
        relationships: [],
      });

      treeIdToUse = newTreeId.data.treeId;
      console.log("New Personal tree created: ", treeIdToUse);
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
    setIsLoading(true);
    if (isEditMode && selectedPersonId) {
      // EDIT
      try {
        await axios.put(`http://localhost:3001/api/persons/${selectedPersonId}`, formData);
        console.log(`Successfully updated person ${selectedPersonId}`, formData);
      } catch (error) {
        console.error("Error updating person:", error);
        alert(`Failed to update person: ${error.response?.data?.message || error.message}`);
        return;
      }
    } else {
      console.log("PersonId:", selectedPersonId);
      console.log("Adding person:", formData);

      const { relationship, ...personDataToSend } = formData;
      personDataToSend.relationships = [];

      console.log("Sending person data:", personDataToSend);
      console.log("Relationship to establish:", relationship);
      console.log("Targeting treeId:", treeId);

      try {
        const createPersonResponse = await axios.post(`http://localhost:3001/api/persons/${treeId}`, {
          ...personDataToSend,
        });
        const newPerson = createPersonResponse.data;
        console.log(`Successfully added person to tree ${treeId}: `, newPerson);

        if (newPerson && selectedPersonId && relationship) {
          let sourceRelationshipType;
          let targetRelationshipType;

          if (relationship === "parent") {
            sourceRelationshipType = "child";
            targetRelationshipType = "parent";
          } else if (relationship === "child") {
            sourceRelationshipType = "parent";
            targetRelationshipType = "child";
          } else if (relationship === "spouse") {
            sourceRelationshipType = "spouse";
            targetRelationshipType = "spouse";
          } else {
            console.warn("Unknown relationship type:", relationship);
            return;
          }

          try {
            await axios.put(`http://localhost:3001/api/persons/${selectedPersonId}`, {
              relationships: [
                {
                  relatedPersonId: newPerson.personId,
                  type: sourceRelationshipType,
                },
              ],
            });
            console.log(`Successfully updated relationship for person ${selectedPersonId}:`);
          } catch (error) {
            console.warn(`Error adding relationship to selected person ${selectedPersonId}: `, error);
            return;
          }

          try {
            await axios.put(`http://localhost:3001/api/persons/${newPerson.personId}`, {
              relationships: [
                {
                  relatedPersonId: selectedPersonId,
                  type: targetRelationshipType,
                },
              ],
            });
            console.log(`Successfully updated relationship for new person ${newPerson.personId}`);
          } catch (error) {
            console.warn(`Error adding reciprocal relationship to new person ${newPerson.personId}: `, error.response?.data || error.message);
          }
        } else {
          console.warn("Cannot establish relationship: new person, selected person, or relationship type is missing.");
        }
      } catch (error) {
        console.warn("Error adding person to tree: ", error);
      } finally {
        setIsLoading(false);
      }
    }

    setSidebarOpen(false);
    setFormData({ ...initialFormData });
    setSelectedPersonId(null);
    setIsEditMode(false);
    await fetchTreeData(currentUserId, currentUser);
  };

  const openSidebar = (personId) => {
    setSelectedPersonId(personId);
    setSidebarOpen(true);
    setActionMenuOpen(false);
    setFormData({ ...initialFormData });
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setIsEditMode(false);
  };

  const toggleActionMenu = () => {
    setActionMenuOpen(!actionMenuOpen);
  };

  const closeActionMenu = (e) => {
    if (e.target.closest(".action-buttons")) {
      return;
    }
    setActionMenuOpen(false);
  };

  const handleAddToTree = (person) => {
    console.log("Adding to tree:", person);
  };

  const handleDeletePerson = async (personIdToDelete) => {
    console.log("Attempting to delete person:", personIdToDelete);
    const confirmDelete = window.confirm(`Are you sure you want to delete this person? This action cannot be undone.`);
    if (!confirmDelete) {
      return;
    }

    setIsLoading(true);

    try {
      await axios.delete(`http://localhost:3001/api/persons/${personIdToDelete}`);
      console.log(`Successfully deleted person with ID: ${personIdToDelete}`);

      await fetchTreeData(currentUserId, currentUser);
    } catch (error) {
      console.error("Error deleting person:", error.response?.data || error.message);
      alert(`Failed to delete person: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
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
      {/* Loading Spinner */}
      {isLoading && (
        <div className="fixed inset-0 z-45 flex justify-center items-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--light-yellow)]"></div>
        </div>
      )}

      {/* Person Details Modal */}
      {isModalOpen && personDetailsInModal && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-[60]" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }} onClick={closeModal}>
          {" "}
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              {personDetailsInModal.firstName} {personDetailsInModal.middleName && personDetailsInModal.middleName + " "}
              {personDetailsInModal.lastName}
            </h2>

            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Gender:</strong> {personDetailsInModal.gender}
              </p>
              {personDetailsInModal.birthDate && (
                <p>
                  <strong>Birth Date:</strong> {personDetailsInModal.birthDate}
                </p>
              )}
              {personDetailsInModal.birthPlace && (
                <p>
                  <strong>Birth Place:</strong> {personDetailsInModal.birthPlace}
                </p>
              )}
              <p>
                <strong>Status:</strong> {personDetailsInModal.status}
              </p>
              {personDetailsInModal.status === "deceased" && personDetailsInModal.dateOfDeath && (
                <p>
                  <strong>Date of Death:</strong> {personDetailsInModal.dateOfDeath}
                </p>
              )}
              {personDetailsInModal.status === "deceased" && personDetailsInModal.placeOfDeath && (
                <p>
                  <strong>Place of Death:</strong> {personDetailsInModal.placeOfDeath}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={closeModal} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* May not work? clicking outside of action menu closes menu */}
      {actionMenuOpen && <div className="fixed inset-0 z-10" onClick={closeActionMenu} />}
      {/* Overlay for sidebar */}
      {sidebarOpen && <div className="fixed inset-0 bg-black opacity-20 z-40" onClick={closeSidebar} />}
      {/* Sidebar */}
      <div
        className={`fixed top-[62px] right-0 h-[calc(100%-4rem)] w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-44 ${
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
            {!isEditMode && (
              <>
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
              </>
            )}
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

            {/* Add/Edit Person Button */}
            <div className="pt-4">
              <button
                onClick={handleAddPerson}
                className="w-full text-white py-2.5 px-4 rounded-md hover:bg-green-500 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                style={{ backgroundColor: "#365643" }}
              >
                {isEditMode ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{isEditMode ? "Edit Person" : "Add Person"}</span>
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
                      <button className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-50 transition-colors">View</button>
                      <button className="text-white px-3 py-1.5 rounded text-xs font-medium hover:opacity-90 transition-opacity" style={{ backgroundColor: "#365643" }}>
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
