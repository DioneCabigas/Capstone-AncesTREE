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
  const [selectedPersonId, setSelectedPersonId] = useState(null);

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

  const openSidebar = async (personData) => {
    setSelectedPersonId(personData.id);
    setSidebarOpen(true);

    const d = personData.data || {};

    setFormData({
      ...initialFormData,
      firstName: d["first name"] ?? "",
      middleName: d["middle name"] ?? "",
      lastName: d["last name"] ?? "",
      birthDate: d.birthday ?? "",
      gender: d.gender === "M" ? "male" : d.gender === "F" ? "female" : "",
      // status/dateOfDeath/placeOfDeath map here if you have them in `d`
    });
    console.log("PersonId in openSidebar:", personData.id);

    if (treeData.persons.length > 0) {
      setSuggestionsLoading(true);
      // await generateSuggestions(personId, treeData.persons); // Pass personId here
      setSuggestionsLoading(false);
    } else {
      console.log("Sidebar opened, but data not ready for suggestions.", {
        peopleCount: treeData.persons.length,
      });
      setSuggestions([]); // Clear suggestions if data isn't ready
    }
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

  // MODIFIED generateSuggestions function
  const generateSuggestions = async (selectedPersonId, currentPeople) => {
    let newSuggestions = [];

    // Find the selected person's data
    const selectedPerson = currentPeople.find((p) => p.personId === selectedPersonId);

    if (!selectedPerson) {
      console.warn("Selected person not found for generating suggestions.");
      setSuggestions([]); // Clear suggestions if person not found
      return;
    }

    // --- Rule: Suggest People with Same Last Name as the selectedPerson ---
    if (selectedPerson.lastName) {
      try {
        const lastNameToSearch = selectedPerson.lastName;
        console.log("Generating last name suggestions for:", selectedPerson.firstName, lastNameToSearch);

        const matchingUsers = await performSuggestionsSearch(lastNameToSearch, "", "");

        const filteredMatchingUsers = matchingUsers.filter(
          (user) =>
            user.id !== currentUserId && // Exclude the currently logged-in user
            !(
              // Exclude the selected person based on their name
              (
                user.firstName?.toLowerCase() === selectedPerson.firstName?.toLowerCase() &&
                (user.middleName?.toLowerCase() || "") === (selectedPerson.middleName?.toLowerCase() || "") &&
                user.lastName?.toLowerCase() === selectedPerson.lastName?.toLowerCase()
              )
            ) &&
            // Exclude any other person already in the current tree based on first and last name
            !currentPeople.some(
              (treePerson) =>
                treePerson.firstName?.toLowerCase() === user.firstName?.toLowerCase() &&
                treePerson.lastName?.toLowerCase() === user.lastName?.toLowerCase()
              // OPTIONAL IMPROVEMENT: If both 'treePerson' and 'user' have 'birthDate', add it for higher accuracy:
              // && treePerson.birthDate === user.birthDate
            )
        );

        filteredMatchingUsers.forEach((user) => {
          newSuggestions.push({
            id: user.id, // Unique ID
            type: "same_last_name",
            targetUserId: user.id,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            details: `This user shares the last name "${lastNameToSearch}" with ${selectedPerson.firstName}.`,
            potentialConnection: {
              // Data structure for handleAddToTree
              personId: user.id,
              firstName: user.firstName,
              middleName: user.middleName || "",
              lastName: user.lastName,
              birthDate: user.birthDate || "",
              birthPlace: user.birthPlace || "",
              gender: user.gender || "",
              status: user.status || "living",
              dateOfDeath: "",
              placeOfDeath: "",
            },
          });
        });
      } catch (error) {
        console.error("Error fetching users by last name for suggestions:", error);
      }
    }

    setSuggestions(newSuggestions);
    console.log("Suggestions: ", suggestions);
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

  // FETCH TREE DATA FUNCTION
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
      const treeResponse = await axios.get(`${BACKEND_BASE_URL}/api/family-trees/personal/${uid}`);

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
        // const personsResponse = await axios.get(`${BACKEND_BASE_URL}/api/persons/tree/${treeIdToUse}`);
        const personsResponse = await axios.get(`${BACKEND_BASE_URL}/test/family-trees/${treeIdToUse}/chart`);
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
  useEffect(() => {
    if (externalUid !== currentUserId) {
      const isCurrentUsersTreeBool = false;
      fetchTreeData(externalUid, isCurrentUsersTreeBool);
      setIsCurrentUsersTree(false);
    } else if (currentUserId && currentUser) {
      const isCurrentUsersTreeBool = true;
      console.log("Both UID and User Profile are ready. Fetching tree data.");
      setIsCurrentUsersTree(true);
      fetchTreeData(currentUserId, isCurrentUsersTreeBool);
    } else if (!currentUserId && !currentUser) {
      console.log("User logged out or profile not loaded yet.");
    }
  }, [currentUserId, currentUser, externalUid]);

  // USE LAYOUT EFFECT TO INITIALIZE CHART
  // Initialize family chart when the chart element is ready (the chart only initializes when the DOM element is definitely ready)
  // This fixes issues with the chart not rendering properly on first load
  useLayoutEffect(() => {
    // Do nothing if the container is not ready
    if (!isChartReady || !chartRef.current) return;

    // Wait for treeData to be loaded
    if (!treeData?.persons || treeData.persons.length === 0) {
      console.log("Waiting for tree data to load...");
      return;
    }

    // // Prevent creating the chart more than once
    if (chartInstanceRef.current) return;

    try {
      console.log("Creating family chart...");

      // const data = [
      //   {
      //     id: "1",
      //     data: { "first name": "Charles Dominic", "last name": "Hordista", birthday: "1980", gender: "M" },
      //     rels: { spouses: ["2"], children: ["3"] },
      //   },
      //   {
      //     id: "2",
      //     data: { "first name": "Jane", "last name": "Doe", birthday: "1982", gender: "F" },
      //     rels: { spouses: ["1"], children: ["3"] },
      //   },
      //   {
      //     id: "3",
      //     data: { "first name": "Ben", "last name": "Doe", birthday: "2005", gender: "M" },
      //     rels: { parents: ["1", "2"] },
      //   },
      // ];

      // Map treeData to f3 chart format
      const data = treeData?.persons
        ? treeData.persons.map((person) => ({
            id: person.id,
            data: {
              "first name": person.data.firstName,
              "last name": person.data.lastName,
              birthday: person.data.birthDate,
              gender: person.data.gender === "Male" ? "M" : "F",
            },
            rels: {
              spouses: person.rels?.spouses || [],
              children: person.rels?.children || [],
              parents: person.rels?.parents || [],
            },
          }))
        : [];

      console.log("Mapped chart data:", data);

      // Clear previous chart DOM (VERY IMPORTANT)
      d3.select(chartRef.current).selectAll("*").remove();

      const f3Chart = f3
        // .createChart("#FamilyChart", data)
        .createChart(chartRef.current, data) // ← better than "#FamilyChart"
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
              openSidebar(d.data);
              console.log("Editing person:", d);
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
              openSidebar(d.data);
            });
        });

      f3Chart.updateTree({ initial: true });
      // f3EditTree.open(f3Chart.getMainDatum());
      // f3Chart.updateTree({ initial: true });

      // Store chart instance for later use
      chartInstanceRef.current = f3Chart;

      console.log("Chart updated successfully");
    } catch (error) {
      console.error("Error creating family chart:", error);
    }

    // Cleanup when component unmounts
    return () => {
      console.log("Cleaning up family chart");
      d3.select(chartRef.current).selectAll("*").remove(); // CLEANUP LIKE ABOVE
      chartInstanceRef.current = null;
    };
  }, [isChartReady, treeData]);

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
            {/* <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--light-yellow)]"></div> */}
          </div>
        )}

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
