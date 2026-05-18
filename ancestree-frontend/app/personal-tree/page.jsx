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
import { initialPersonFormData } from "@/app/utils/constants";

const initialFormData = initialPersonFormData;

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
  const [personDetailsInModal, setPersonDetailsInModal] = useState(null);

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

  const getBackendPersonId = (person) => {
    return (
      person?.personId ??
      person?.data?.personId ??
      person?._id ??
      person?.id ??
      person?.data?._id ??
      person?.data?.id ??
      null
    );
  };

  const getPersonRelationships = (person) => {
    return (
      person?.relationships ??
      person?.rels ??
      person?.data?.relationships ??
      person?.data?.rels ??
      []
    );
  };

  const getExistingRelationshipIds = (person, type) => {
    return getPersonRelationships(person)
      .filter((rel) => rel && rel.relatedPersonId && String(rel.type).toLowerCase() === type)
      .map((rel) => rel.relatedPersonId);
  };

  const getCoParentIdsFromExistingChildren = (personId) => {
    const person = treeData?.persons?.find((p) => getBackendPersonId(p) === personId);
    if (!person) return [];

    const childIds = getExistingRelationshipIds(person, "child");
    const coParents = new Set();

    childIds.forEach((childId) => {
      const child = treeData?.persons?.find((p) => getBackendPersonId(p) === childId);
      if (!child) return;
      getExistingRelationshipIds(child, "parent").forEach((parentId) => {
        if (parentId !== personId) {
          coParents.add(parentId);
        }
      });
    });

    return Array.from(coParents);
  };

  const toF3Gender = (gender) => {
    const value = String(gender || "").toLowerCase();
    if (value.startsWith("m")) return "M";
    if (value.startsWith("f")) return "F";
    return "";
  };

  const getF3Relationships = (person) => {
    const relationships = person.relationships || person.rels || person.data?.relationships || person.data?.rels || [];
    const rels = { parents: [], children: [], spouses: [] };

    relationships.forEach((rel) => {
      if (!rel || !rel.relatedPersonId || !rel.type) return;
      const type = String(rel.type).toLowerCase();
      if (type === "parent") rels.parents.push(rel.relatedPersonId);
      else if (type === "child") rels.children.push(rel.relatedPersonId);
      else if (type === "spouse") rels.spouses.push(rel.relatedPersonId);
    });

    return rels;
  };

  const fetchUserDetails = async (uid) => {
    try {
      const response = await axios.get(`${BACKEND_BASE_URL}/api/user/${uid}`);
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      console.error(`Error fetching user details for ${uid}:`, error);
    }
    return null;
  };

  const fetchConnectionsData = async (userId) => {
    if (!userId) return;

    try {
      let connectionsResponse;
      try {
        connectionsResponse = await axios.get(`${BACKEND_BASE_URL}/api/connections/${userId}`);
      } catch (error) {
        if (error.response?.status === 404) {
          connectionsResponse = await axios.get(`${BACKEND_BASE_URL}/api/user/${userId}/connections`);
        } else {
          throw error;
        }
      }

      if (connectionsResponse?.status === 200) {
        const connectionsWithDetails = await Promise.all(
          connectionsResponse.data.map(async (conn) => {
            const otherUserId = conn.connectionWith || (conn.requester === userId ? conn.receiver : conn.requester);
            const userDetails = await fetchUserDetails(otherUserId);
            const firstName = userDetails?.firstName || "";
            const lastName = userDetails?.lastName || "";

            return {
              ...conn,
              otherUserId,
              firstName,
              lastName,
              name: userDetails ? `${firstName} ${lastName}`.trim() : "Unknown User",
            };
          })
        );

        setConnections(connectionsWithDetails);
      }
    } catch (error) {
      console.error("Error fetching connections for personal tree:", error);
      setConnections([]);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchConnectionsData(currentUserId);
    }
  }, [currentUserId]);

  const openSidebar = async (personData) => {
    const id = getBackendPersonId(personData);
    setSelectedPersonId(id);
    setSidebarOpen(true);
    setActiveTab("form");

    const personFromTree = treeData?.persons?.find((person) => getBackendPersonId(person) === id);
    const source = personFromTree || personData;
    const d = source?.data || source || {};

    const firstName = d["first name"] ?? d.firstName ?? d.first_name ?? "";
    const middleName = d["middle name"] ?? d.middleName ?? d.middle_name ?? "";
    const lastName = d["last name"] ?? d.lastName ?? d.last_name ?? "";
    const birthDate = d.birthDate ?? d.birthday ?? d.birth_date ?? "";
    const birthPlace = d.birthPlace ?? d.birth_place ?? d.placeOfBirth ?? "";
    const rawGender = (d.gender ?? d.sex ?? "").toString();
    const gender = rawGender === "M" || rawGender.toLowerCase() === "male" ? "male" : rawGender === "F" || rawGender.toLowerCase() === "female" ? "female" : "";
    const status = d.status ?? d.livingStatus ?? "living";

    setFormData({
      ...initialFormData,
      firstName,
      middleName,
      lastName,
      birthDate,
      birthPlace,
      gender,
      status,
      dateOfDeath: d.dateOfDeath ?? d.date_of_death ?? "",
      placeOfDeath: d.placeOfDeath ?? d.place_of_death ?? "",
    });

    console.log("PersonId in openSidebar:", id);

    if (treeData?.persons?.length > 0) {
      setSuggestionsLoading(true);
      // await generateSuggestions(personId, treeData.persons); // Pass personId here
      setSuggestionsLoading(false);
    } else {
      console.log("Sidebar opened, but data not ready for suggestions.", {
        peopleCount: treeData?.persons?.length,
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

  const handleAddToTree = (personDetails) => {
    setFormData({
      relationship: "",
      firstName: personDetails.firstName || "",
      middleName: personDetails.middleName || "",
      lastName: personDetails.lastName || "",
      birthDate: personDetails.birthDate || "",
      birthPlace: personDetails.birthPlace || "",
      gender: personDetails.gender || "",
      status: personDetails.status || "living",
      dateOfDeath: personDetails.dateOfDeath || "",
      placeOfDeath: personDetails.placeOfDeath || "",
    });
    setActiveTab("form");
    setIsEditMode(false);
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

  const handleAddPerson = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    const { relationship, ...personDataToSend } = formData;
    if (personDataToSend.relationship) delete personDataToSend.relationship;

    if (isEditMode && selectedPersonId) {
      // EDIT
      try {
        await axios.put(`${BACKEND_BASE_URL}/api/persons/${selectedPersonId}`, personDataToSend);
        console.log(`Successfully updated person ${selectedPersonId}`, personDataToSend);
      } catch (error) {
        console.error("Error updating person:", error);
        alert(`Failed to update person: ${error.response?.data?.message || error.message}`);
        setIsLoading(false);
        return;
      }
    } else {
      console.log("PersonId:", selectedPersonId);
      console.log("Adding person:", personDataToSend);

      try {
        const createPersonResponse = await axios.post(`${BACKEND_BASE_URL}/api/persons/${treeId}`, {
          ...personDataToSend,
          relationships: [],
        });
        const newPerson = createPersonResponse.data;
        const newPersonId = getBackendPersonId(newPerson);
        console.log(`Successfully added person to tree ${treeId}: `, newPerson);

        if (newPersonId && selectedPersonId && relationship) {
          let sourceRelationshipType;
          let targetRelationshipType;

          if (relationship === "parent") {
            sourceRelationshipType = "parent";
            targetRelationshipType = "child";
          } else if (relationship === "child") {
            sourceRelationshipType = "child";
            targetRelationshipType = "parent";
          } else if (relationship === "spouse") {
            sourceRelationshipType = "spouse";
            targetRelationshipType = "spouse";
          } else {
            console.warn("Unknown relationship type:", relationship);
            return;
          }

          const selectedPerson = treeData?.persons?.find((person) => getBackendPersonId(person) === selectedPersonId);
          const selectedExistingRelationships = getPersonRelationships(selectedPerson);
          const selectedSpouseIds = getExistingRelationshipIds(selectedPerson, "spouse");
          const inferredCoParentIds = getCoParentIdsFromExistingChildren(selectedPersonId);
          const coParentIds = Array.from(new Set([...selectedSpouseIds, ...inferredCoParentIds]));

          const updatedSelectedRelationships = [
            ...selectedExistingRelationships,
            {
              relatedPersonId: newPersonId,
              type: sourceRelationshipType,
            },
          ];

          try {
            await axios.put(`${BACKEND_BASE_URL}/api/persons/${selectedPersonId}`, {
              relationships: updatedSelectedRelationships,
            });
            console.log(`Successfully updated relationship for person ${selectedPersonId}:`);
          } catch (error) {
            console.warn(`Error adding relationship to selected person ${selectedPersonId}: `, error);
            return;
          }

          const newPersonExistingRelationships = getPersonRelationships(newPerson);
          const updatedNewPersonRelationships = [
            ...newPersonExistingRelationships,
            {
              relatedPersonId: selectedPersonId,
              type: targetRelationshipType,
            },
          ];

          if (relationship === "child" && coParentIds.length > 0) {
            coParentIds.forEach((parentId) => {
              if (parentId !== selectedPersonId) {
                updatedNewPersonRelationships.push({ relatedPersonId: parentId, type: "parent" });
              }
            });
          }

          try {
            await axios.put(`${BACKEND_BASE_URL}/api/persons/${newPersonId}`, {
              relationships: updatedNewPersonRelationships,
            });
            console.log(`Successfully updated relationship for new person ${newPersonId}`);
          } catch (error) {
            console.warn(`Error adding reciprocal relationship to new person ${newPersonId}: `, error.response?.data || error.message);
          }

          if (relationship === "child" && coParentIds.length > 0) {
            for (const parentId of coParentIds) {
              if (parentId === selectedPersonId) continue;
              const parentPerson = treeData?.persons?.find((person) => getBackendPersonId(person) === parentId);
              const parentRelationships = getPersonRelationships(parentPerson);
              const hasChildRelation = parentRelationships.some(
                (rel) => rel.relatedPersonId === newPersonId && String(rel.type).toLowerCase() === "child"
              );
              if (!hasChildRelation) {
                parentRelationships.push({ relatedPersonId: newPersonId, type: "child" });
              }

              try {
                await axios.put(`${BACKEND_BASE_URL}/api/persons/${parentId}`, {
                  relationships: parentRelationships,
                });
                console.log(`Successfully updated co-parent ${parentId} with new child ${newPersonId}`);
              } catch (error) {
                console.warn(`Error updating co-parent ${parentId} with new child ${newPersonId}:`, error.response?.data || error.message);
              }
            }
          }
        } else if (newPersonId && selectedPersonId) {
          console.warn("Relationship type not specified; created person without connecting relationship.");
        }
      } catch (error) {
        console.warn("Error adding person to tree: ", error);
      }
    }

    setSidebarOpen(false);
    setSuggestions([]);
    setFormData({ ...initialFormData });
    setSelectedPersonId(null);
    setIsEditMode(false);

    if (!isCurrentUsersTree) {
      await fetchTreeData(externalUid, isCurrentUsersTree);
    } else {
      await fetchTreeData(currentUserId, isCurrentUsersTree);
    }

    setIsLoading(false);
  };

  const handleDeletePerson = async (personIdToDelete) => {
    if (!personIdToDelete) {
      console.warn("No person ID provided for delete.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this person? This action cannot be undone."
    );
    if (!confirmDelete) return;

    setIsLoading(true);

    try {
      await axios.delete(`${BACKEND_BASE_URL}/api/persons/${personIdToDelete}`);
      console.log(`Successfully deleted person with ID: ${personIdToDelete}`);
      setSidebarOpen(false);
      setIsEditMode(false);
      setSelectedPersonId(null);
      setFormData({ ...initialFormData });
      setPersonsData((prev) => prev.filter((person) => getBackendPersonId(person) !== personIdToDelete));
      setTreeData((prev) =>
        prev
          ? {
              ...prev,
              persons: prev.persons?.filter((person) => getBackendPersonId(person) !== personIdToDelete) ?? [],
            }
          : prev
      );
      if (chartInstanceRef.current && chartRef.current) {
        d3.select(chartRef.current).selectAll("*").remove();
        chartInstanceRef.current = null;
      }

      // Clean up any remaining relationships that still reference the deleted person.
      const remainingPeople = treeData?.persons?.filter((person) => getBackendPersonId(person) !== personIdToDelete) || [];
      for (const person of remainingPeople) {
        const currentRelationships = person.relationships || person.rels || [];
        const filteredRelationships = currentRelationships.filter(
          (rel) => rel && rel.relatedPersonId !== personIdToDelete
        );
        if (filteredRelationships.length !== currentRelationships.length) {
          try {
            await axios.put(`${BACKEND_BASE_URL}/api/persons/${getBackendPersonId(person)}`, {
              relationships: filteredRelationships,
            });
            console.log(`Removed deleted person ${personIdToDelete} from relationships of ${getBackendPersonId(person)}`);
          } catch (error) {
            console.warn(
              `Error cleaning relationships for person ${getBackendPersonId(person)} after delete:`,
              error.response?.data || error.message
            );
          }
        }
      }

      if (!isCurrentUsersTree) {
        await fetchTreeData(externalUid, isCurrentUsersTree);
      } else {
        await fetchTreeData(currentUserId, isCurrentUsersTree);
      }
    } catch (error) {
      console.error("Error deleting person:", error.response?.data || error.message);
      alert(`Failed to delete person: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
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
        const personsResponse = await axios.get(`${BACKEND_BASE_URL}/api/persons/tree/${treeIdToUse}`);
        // const personsResponse = await axios.get(`${BACKEND_BASE_URL}/test/family-trees/${treeIdToUse}/chart`);
        const fetchedPersons = personsResponse.data;
        console.log("Fetched persons data:", fetchedPersons);
        setPersonsData(fetchedPersons);
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

    // Recreate the chart whenever treeData changes so updates are always reflected.
    if (chartInstanceRef.current) {
      d3.select(chartRef.current).selectAll("*").remove();
      chartInstanceRef.current = null;
    }

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
        ? treeData.persons
            .map((person) => {
              const source = person.data || person;
              const firstName = source.firstName ?? source["first name"] ?? "";
              const lastName = source.lastName ?? source["last name"] ?? "";
              const birthday = source.birthDate ?? source.birthday ?? "";
              const gender = toF3Gender(source.gender);
              const id = getBackendPersonId(person);

              if (!id) {
                console.warn("Skipping person record with missing id:", person);
                return null;
              }

              return {
                id,
                data: {
                  personId: id,
                  "first name": firstName,
                  "last name": lastName,
                  birthday,
                  gender,
                },
                rels: getF3Relationships(person),
              };
            })
            .filter(Boolean)
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
          // DELETE PERSON CARD BUTTON
          d3.select(card)
            .append("div")
            .attr(
              "style",
              "cursor: pointer; width: 22px; height: 22px; position: absolute; top: 0; right: 0; background: rgba(255,255,255,0.9); border: 1px solid rgba(229,62,62,0.35); border-radius: 9999px; display: flex; align-items: center; justify-content: center; color: #dc2626; font-weight: 700;"
            )
            .html("×")
            .on("mouseenter", function () {
              d3.select(this).style("background", "rgba(249,250,251,0.95)");
            })
            .on("mouseleave", function () {
              d3.select(this).style("background", "rgba(255,255,255,0.9)");
            })
            .on("click", (e) => {
              e.stopPropagation();
              const personId = getBackendPersonId(d);
              handleDeletePerson(personId);
            });

          // ADD PERSON CARD BUTTON
          d3.select(card)
            .append("div")
            .attr(
              "style",
              "cursor: pointer; width: 22px; height: 22px; position: absolute; top: 0; right: 23px; background: rgba(255,255,255,0.9); border: 1px solid rgba(148,163,184,0.35); border-radius: 9999px; display: flex; align-items: center; justify-content: center; color: #475569;"
            )
            .html("+")
            .on("mouseenter", function () {
              d3.select(this).style("background", "rgba(249,250,251,0.95)");
            })
            .on("mouseleave", function () {
              d3.select(this).style("background", "rgba(255,255,255,0.9)");
            })
            .on("click", (e) => {
              e.stopPropagation();
              f3Card.onCardClickDefault(e, d);
              setIsEditMode(false);
              openSidebar(d);
            });

          // EDIT PERSON CARD BUTTON
          d3.select(card)
            .append("div")
            .attr(
              "style",
              "cursor: pointer; width: 22px; height: 22px; position: absolute; top: 0; right: 46px; background: rgba(255,255,255,0.9); border: 1px solid rgba(148,163,184,0.35); border-radius: 9999px; display: flex; align-items: center; justify-content: center; color: #475569;"
            )
            .html("✎")
            .on("mouseenter", function () {
              d3.select(this).style("background", "rgba(249,250,251,0.95)");
            })
            .on("mouseleave", function () {
              d3.select(this).style("background", "rgba(255,255,255,0.9)");
            })
            .on("click", (e) => {
              e.stopPropagation();
              f3Card.onCardClickDefault(e, d);
              setIsEditMode(true);
              openSidebar(d);
              console.log("Editing person:", d);
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
                ? [{ id: "form", label: "Edit member details" }]
                : [
                    { id: "form", label: "Add member" },
                    { id: "connections", label: "Connections" },
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
            <form onSubmit={handleAddPerson}>
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

                {formData.status === "deceased" && (
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
                {isEditMode && selectedPersonId && (
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => handleDeletePerson(selectedPersonId)}
                      className="w-full text-white py-2.5 px-4 rounded-md hover:bg-red-500 transition-colors text-sm font-medium"
                      style={{ backgroundColor: "#dc2626" }}
                    >
                      <X className="w-4 h-4 mr-2 inline-block" />
                      Delete person
                    </button>
                  </div>
                )}
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
