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

function PersonalTree() {
  const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
  const searchParams = useSearchParams();
  const externalUid = searchParams.get("uid");
  const [isCurrentUsersTree, setIsCurrentUsersTree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // TREE DATA STATES
  const [treeId, setTreeId] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [personsData, setPersonsData] = useState([]);
  const [connections, setConnections] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // SIDEBAR STATES
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({ ...initialFormData });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("form");
  const [isEditMode, setIsEditMode] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Ensure we always show the form tab when entering edit mode
  useEffect(() => {
    if (isEditMode && activeTab !== "form") {
      setActiveTab("form");
    }
  }, [isEditMode, activeTab]);

  // CHART STATES
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

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  // const openSidebar = async (personId) => {
  //   setSelectedPersonId(personId);
  //   setSidebarOpen(true);
  //   setFormData({ ...initialFormData });

  //   if (personsData.length > 0) {
  //     console.log("Sidebar opened for person:", personId, "Generating suggestions...");
  //     setSuggestionsLoading(true);
  //     await generateSuggestions(personId, personsData); // Pass personId here
  //     setSuggestionsLoading(false);
  //   } else {
  //     console.log("Sidebar opened, but data not ready for suggestions.", {
  //       peopleCount: personsData.length,
  //     });
  //     setSuggestions([]); // Clear suggestions if data isn't ready
  //   }
  // };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setIsEditMode(false);
    setActiveTab("form");
    // setSuggestions([]);
  };

  const handleViewPerson = (personData) => {
    setPersonDetailsInModal(personData);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPersonDetailsInModal(null);
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

  const handleAddPerson = async () => {
    event.preventDefault();
    setIsLoading(true);
    if (isEditMode && selectedPersonId) {
      // EDIT
      try {
        await axios.put(`${BACKEND_BASE_URL}/api/persons/${selectedPersonId}`, formData);
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
        const createPersonResponse = await axios.post(`${BACKEND_BASE_URL}/api/persons/${treeId}`, {
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
            await axios.put(`${BACKEND_BASE_URL}/api/persons/${selectedPersonId}`, {
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
            await axios.put(`${BACKEND_BASE_URL}/api/persons/${newPerson.personId}`, {
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
    setSuggestions([]);
    setFormData({ ...initialFormData });
    setSelectedPersonId(null);
    setIsEditMode(false);
    if (!isCurrentUsersTree) {
      await fetchTreeData(externalUid, currentUser, isCurrentUsersTree);
    } else {
      await fetchTreeData(currentUserId, currentUser, isCurrentUsersTree);
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

  // // FETCH TREE DATA USE EFFECT
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
          data: { "first name": "Charles Dominic", "last name": "Hordista", birthday: "1980", gender: "M" },
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

      const f3Chart = f3
        .createChart("#FamilyChart", data)
        .setTransitionTime(700)
        .setCardXSpacing(400) // Default 250
        .setCardYSpacing(150) // Default 150
        .setSingleParentEmptyCard(false, { label: "ADD" })
        .setShowSiblingsOfMain(true)
        .setOrientationVertical();
      console.log("Chart created:", f3Chart);

      const f3Card = f3Chart
        .setCardHtml()
        .setCardDisplay([["first name", "last name"], ["birthday"], ["gender"]])
        .setCardDim({ width: 300, height: 100 })
        .setOnHoverPathToMain()
        .setOnCardUpdate(function (d) {
          d3.select(this).select(".card").style("cursor", "default");
          const card = this.querySelector(".card-inner");
          // EDIT PERSON CARD BUTTON
          d3.select(card)
            .append("div")
            .attr("style", "cursor: pointer; width: 20px; height: 20px;position: absolute; top: 0; right: 0;")
            .html(f3.icons.userEditSvgIcon())
            .select("svg")
            .style("transition", "fill 0.2s ease-in-out")
            .on("mouseenter", function () {
              d3.select(this).style("fill", "#414141ff");
            })
            .on("mouseleave", function () {
              d3.select(this).style("fill", "white");
            })
            .style("padding", "1")
            .on("click", (e) => {
              e.stopPropagation();
              f3Card.onCardClickDefault(e, d);
              setIsEditMode(true);
              setSidebarOpen(true);
            });
          // ADD PERSON CARD BUTTON
          d3.select(card)
            .append("div")
            .attr("style", "cursor: pointer; width: 20px; height: 20px;position: absolute; top: 0; right: 23px;")
            .html(f3.icons.userPlusSvgIcon())
            .select("svg")
            .style("transition", "fill 0.2s ease-in-out")
            .on("mouseenter", function () {
              d3.select(this).style("fill", "#414141ff");
            })
            .on("mouseleave", function () {
              d3.select(this).style("fill", "white");
            })
            .style("padding", "1")
            .on("click", (e) => {
              e.stopPropagation();
              f3Card.onCardClickDefault(e, d);
              setIsEditMode(false);
              setSidebarOpen(true);
            });
        });

      // f3Card.setOnCardClick(() => {
      //   console.log("Card clicked: ");
      //   // setSidebarOpen(true);
      // });

      // const f3EditTree = f3Chart.editTree().fixed(true).setFields(["first name", "last name", "birthday", "avatar"]).setEditFirst(true).setCardClickOpen(f3Card);
      // f3EditTree.setEdit();

      f3Chart.updateTree({ initial: true });
      // f3EditTree.open(f3Chart.getMainDatum());
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
        {/* Main Tree Area */}
        <div className="flex items-center justify-center" style={{ height: "calc(100vh - 64px)" }}>
          <div
            className="f3"
            id="FamilyChart"
            ref={setChartRef}
            style={{ width: "100%", height: "900px", margin: "auto", backgroundColor: "#D9D9D9", color: "#000000ff" }}
          />
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="fixed inset-0 z-45 flex justify-center items-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--light-yellow)]"></div>
          </div>
        )}

        {/* Person Details Modal */}
        {/* {isModalOpen && personDetailsInModal && (
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
        )} */}

        {/* May not work? clicking outside of action menu closes menu */}
        {/* {actionMenuOpen && <div className="fixed inset-0 z-10" onClick={closeActionMenu} />} */}
        {/* Overlay for sidebar */}
        {sidebarOpen && <div className="fixed inset-0 bg-black opacity-20 z-40" onClick={closeSidebar} />}
        {/* Sidebar */}
        <div
          className={`fixed top-[62px] right-0 h-[calc(100%-4rem)] w-100 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-44 ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex justify-around">
              {(isEditMode
                ? [{ id: "form", label: "Edit member" }]
                : [
                    { id: "form", label: "Add member" },
                    { id: "connections", label: "Connections" },
                    { id: "suggestions", label: "Suggestions" },
                  ]
              ).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`mx-1 my-1 rounded-sm px-3 py-2 text-xs font-medium transition-colors flex-grow ${
                    activeTab === id ? "text-white" : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                  style={activeTab === id ? { backgroundColor: "#365643" } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Content */}
          {activeTab === "form" && (
            <form>
              {/* onSubmit={handleAddPerson} */}
              <div className="p-6 space-y-3 overflow-y-auto h-full pb-16 pt-4">
                {/* Relationship */}
                {!isEditMode && (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                    <div className="flex items-center space-x-6">
                      {/* Parent*/}
                      <label className="flex items-center">
                        <div className="relative">
                          <input
                            type="radio"
                            name="relationship"
                            value="parent"
                            checked={formData.relationship === "parent"}
                            onChange={handleInputChange}
                            className="sr-only"
                            required={!isEditMode}
                          />
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
                          <input
                            type="radio"
                            name="relationship"
                            value="child"
                            checked={formData.relationship === "child"}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
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
                          <input
                            type="radio"
                            name="relationship"
                            value="spouse"
                            checked={formData.relationship === "spouse"}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
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
                    required
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
                    required
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
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={formData.gender === "male"}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
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
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={formData.gender === "female"}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
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
                        <input
                          type="radio"
                          name="status"
                          value="living"
                          checked={formData.status === "living"}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            formData.status === "living" ? "" : "border-gray-300"
                          }`}
                          style={formData.status === "living" ? { backgroundColor: "#365643", borderColor: "#365643" } : {}}
                        />
                      </div>
                      <span className="ml-2 text-sm text-gray-700">Living</span>
                    </label>
                    {/* Deceased Radio */}
                    <label className="flex items-center">
                      <div className="relative">
                        <input
                          type="radio"
                          name="status"
                          value="deceased"
                          checked={formData.status === "deceased"}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            formData.status === "deceased" ? "" : "border-gray-300"
                          }`}
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
                    type="submit"
                    className="w-full text-white py-2.5 px-4 rounded-md hover:bg-green-500 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                    style={{ backgroundColor: "#365643" }}
                  >
                    {isEditMode ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    <span>{isEditMode ? "Save Changes" : "Add person"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Connections Tab */}
          {activeTab === "connections" && (
            <div className="p-6 space-y-4 overflow-y-auto h-full">
              {connections.map((person) => (
                <div key={person.id} className="border border-gray-300 rounded-lg p-4 flex items-center justify-between gap-x-3">
                  <div className="flex items-center space-x-3">
                    {/* <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div> */}
                    <div className="w-10 h-10 rounded-full bg-gray-100 border-1 border-gray-400 overflow-hidden flex items-center justify-center">
                      <span className="text-[#313131] text-xl font-bold">
                        {person.firstName ? person.firstName.charAt(0) : ""}
                        {person.lastName ? person.lastName.charAt(0) : ""}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800">{person.name}</h4>
                      {/* <p className="text-xs text-gray-500">Alive</p> */}
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
          {activeTab === "suggestions" && (
            <div className="p-6 space-y-4 overflow-y-auto h-full">
              <div className="mb-4">
                {/* <h3 className="text-sm font-semibold text-gray-800 mb-1">You might be related to the following people:</h3> */}
                <p className="text-xs text-gray-600">You might be related to these following people</p>
              </div>

              {suggestionsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--light-yellow)]"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading suggestions...</span>
                </div>
              ) : (
                suggestions.map((person) => (
                  <div key={person.id} className="space-y-2">
                    <p className="text-xs text-gray-700">
                      {/* <span className="font-medium">Related to:</span> {person.relatedTo} in your tree */}
                      {person.details}
                    </p>
                    <div className="border border-gray-300 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 border-1 border-gray-400 overflow-hidden flex items-center justify-center">
                            <span className="text-[#313131] text-xl font-bold">
                              {person.firstName ? person.firstName.charAt(0) : ""}
                              {person.lastName ? person.lastName.charAt(0) : ""}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-800">{person.name}</h4>
                            <p className="text-xs text-gray-500">{person.timeframe}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <a href={`/profile?userId=${person.id}`} className="text-[#313131] hover:underline font-medium block text-md">
                            <button className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-50 transition-colors">
                              View
                            </button>
                          </a>
                          <button
                            onClick={() => handleAddToTree(person.potentialConnection)}
                            className="text-white px-3 py-1.5 rounded text-xs font-medium hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: "#365643" }}
                          >
                            Add to Tree
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
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
