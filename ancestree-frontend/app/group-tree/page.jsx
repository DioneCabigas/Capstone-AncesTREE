"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/utils/firebase";
import Layout from '@/components/Layout';
import AuthController from '@/components/AuthController';
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Edit3, UserPlus, Upload, CheckCircle, XCircle } from "lucide-react";
import axios from "axios";
import * as d3 from "d3";
import * as f3 from "family-chart";
import "family-chart/styles/family-chart.css";
import { initialPersonFormData } from "@/app/utils/constants";

const initialFormData = initialPersonFormData;

function ViewGroupPage() {
  const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
  const router = useRouter();
  const searchParams = useSearchParams();
  const treeId = searchParams.get("treeId");
  const [isCurrentUsersTree, setIsCurrentUsersTree] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Add member");
  const [formData, setFormData] = useState({ ...initialFormData });
  const [people, setPeople] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [personDetailsInModal, setPersonDetailsInModal] = useState(null);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [connections, setConnections] = useState([]);

  const [isChartReady, setIsChartReady] = useState(false);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Import Tree states
  const [personalTrees, setPersonalTrees] = useState([]);
  const [importRequests, setImportRequests] = useState([]);
  const [selectedPersonalTreeId, setSelectedPersonalTreeId] = useState(null);
  const [selectedPersonalTreePersons, setSelectedPersonalTreePersons] = useState([]);
  const [importPreview, setImportPreview] = useState(null);
  const [importPreviewSummary, setImportPreviewSummary] = useState(null);
  const [isImportRequestLoading, setIsImportRequestLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });

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

  const showToast = (message, type = "success") => {
    setToast({ message, type, visible: true });
    window.setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 4000);
  };

  const getCoParentIdsFromExistingChildren = (personId) => {
    const person = people?.find((p) => getBackendPersonId(p) === personId);
    if (!person) return [];

    const childIds = getExistingRelationshipIds(person, "child");
    const coParents = new Set();

    childIds.forEach((childId) => {
      const child = people?.find((p) => getBackendPersonId(p) === childId);
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
    const relationships = getPersonRelationships(person);
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        try {
          const profileResponse = await axios.get(`${BACKEND_BASE_URL}/api/user/${user.uid}`);
          setCurrentUser(profileResponse.data);
        } catch (error) {
          console.error("Failed to fetch current user profile.", error);
        }
      } else {
        setCurrentUser(null);
        setCurrentUserId(null);
        setUserRole(null);
        setIsRoleLoading(false);
        setPeople([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchConnectionsData(currentUserId);
      fetchPersonalTrees(currentUserId);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId && treeId) {
      checkUserRole(currentUserId, treeId);
    }
  }, [currentUserId, treeId]);

  useEffect(() => {
    if (treeId) {
      fetchTreeData(treeId);
      if (userRole === "Host") fetchImportRequests(treeId);
    }
  }, [treeId, userRole]);

  // Poll pending import requests when the current user is the Host
  useEffect(() => {
    if (!treeId || userRole !== "Host") return;
    let interval = null;
    const startPolling = () => {
      // initial fetch
      fetchImportRequests(treeId);
      interval = setInterval(() => {
        fetchImportRequests(treeId);
      }, 30000); // poll every 30 seconds
    };
    startPolling();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [treeId, userRole]);

  const fetchUserDetails = async (uid) => {
    try {
      const response = await axios.get(`${BACKEND_BASE_URL}/api/user/${uid}`);
      return response.status === 200 ? response.data : null;
    } catch (error) {
      console.error(`Error fetching user details for ${uid}:`, error);
      return null;
    }
  };

  const fetchConnectionsData = async (userId) => {
    try {
      const connectionsResponse = await axios.get(`${BACKEND_BASE_URL}/api/connections/${userId}`);
      if (connectionsResponse.status === 200) {
        const connectionsWithDetails = await Promise.all(
          connectionsResponse.data.map(async (conn) => {
            const otherUserId = conn.connectionWith || (conn.requester === userId ? conn.receiver : conn.requester);
            const userDetails = await fetchUserDetails(otherUserId);
            return {
              ...conn,
              otherUserId,
              name: userDetails ? `${userDetails.firstName} ${userDetails.lastName}` : "Unknown User",
              firstName: userDetails?.firstName || "",
              lastName: userDetails?.lastName || "",
              gender: userDetails?.gender || "",
              birthDate: userDetails?.birthDate || "",
              birthPlace: userDetails?.birthPlace || "",
              status: userDetails?.status || "living",
              dateOfDeath: userDetails?.dateOfDeath || "",
              placeOfDeath: userDetails?.placeOfDeath || "",
            };
          })
        );
        setConnections(connectionsWithDetails);
      }
    } catch (error) {
      console.error("Error fetching connections data:", error);
      setConnections([]);
    }
  };

  const fetchPersonalTrees = async (userId) => {
    try {
      const response = await axios.get(`${BACKEND_BASE_URL}/api/family-trees/personal/${userId}`);
      let data = [];

      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data) {
        if (response.data.treeId || response.data.id) {
          data = [response.data];
        } else if (Array.isArray(response.data.trees)) {
          data = response.data.trees;
        } else if (Array.isArray(response.data.data)) {
          data = response.data.data;
        }
      }

      setPersonalTrees(data);
    } catch (error) {
      console.error("Error fetching personal trees:", error);
      setPersonalTrees([]);
    }
  };

  const checkUserRole = async (userId, treeId) => {
    if (!userId || !treeId) {
      setUserRole(null);
      setIsRoleLoading(false);
      return;
    }

    setIsRoleLoading(true);
    try {
      const response = await axios.get(`${BACKEND_BASE_URL}/api/family-group-members/tree/${treeId}/user/${userId}`);
      const member = response.data?.data ?? response.data;
      const role = member?.role || null;
      setUserRole(role);
    } catch (error) {
      console.error("Error checking user role:", error);
      setUserRole(null);
    } finally {
      setIsRoleLoading(false);
    }
  };

  const fetchImportRequests = async (treeId) => {
    try {
      const response = await axios.get(`${BACKEND_BASE_URL}/api/import-tree-req/${treeId}/pending`);
      const respData = response.data;

      let data = [];
      if (Array.isArray(respData)) data = respData;
      else if (respData && typeof respData === "object") {
        // common wrappers
        if (Array.isArray(respData.requests)) data = respData.requests;
        else if (Array.isArray(respData.data)) data = respData.data;
        else if (Array.isArray(respData.items)) data = respData.items;
        else {
          // try to find the first array property on the object
          const arrProp = Object.keys(respData).find((k) => Array.isArray(respData[k]));
          if (arrProp) data = respData[arrProp];
        }
      }

      setImportRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching import requests:", error);
      setImportRequests([]);
    }
  };

  const normalizeName = (value) => String(value || "").trim().toLowerCase();

  const getPersonalTreeLabel = (tree) => {
    const userName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ");
    if (userName) {
      return `${userName} Tree`;
    }
    if (tree?.name) {
      return tree.name;
    }
    return "Personal Tree";
  };

  const buildImportPreview = (importPeople) => {
    if (!importPeople || !Array.isArray(importPeople)) {
      setImportPreview(null);
      setImportPreviewSummary(null);
      return;
    }

    const matches = importPeople.map((importPerson) => {
      const importedFirstName = normalizeName(importPerson.firstName || importPerson["first name"]);
      const importedLastName = normalizeName(importPerson.lastName || importPerson["last name"]);
      const importedBirthDate = String(importPerson.birthDate || importPerson.birthday || "").trim();

      const matchedPerson = people.find((existingPerson) => {
        const existingSource = existingPerson.data || existingPerson;
        const existingFirstName = normalizeName(existingSource.firstName || existingSource["first name"]);
        const existingLastName = normalizeName(existingSource.lastName || existingSource["last name"]);
        const existingBirthDate = String(existingSource.birthDate || existingSource.birthday || "").trim();

        if (!importedFirstName || !importedLastName || !existingFirstName || !existingLastName) return false;

        const nameMatch = importedFirstName === existingFirstName && importedLastName === existingLastName;
        const birthMatch = importedBirthDate && existingBirthDate ? importedBirthDate === existingBirthDate : true;

        return nameMatch && birthMatch;
      });

      return {
        importPerson,
        matchedPerson,
      };
    });

    const matchedCount = matches.filter((item) => item.matchedPerson).length;
    setImportPreview(matches);
    setImportPreviewSummary({
      groupPersonCount: people.length,
      importPersonCount: importPeople.length,
      matchedCount,
      newPersonCount: importPeople.length - matchedCount,
    });
  };

  const fetchPersonalTreePersons = async (personalTreeId) => {
    if (!personalTreeId) return;
    try {
      const response = await axios.get(`${BACKEND_BASE_URL}/api/persons/tree/${personalTreeId}`);
      const importedPersons = response.data || [];
      setSelectedPersonalTreePersons(importedPersons);
      buildImportPreview(importedPersons);
    } catch (error) {
      console.error("Error fetching personal tree persons:", error);
      setSelectedPersonalTreePersons([]);
      setImportPreview(null);
      setImportPreviewSummary(null);
    }
  };

  const handleSelectPersonalTree = async (personalTreeId) => {
    setSelectedPersonalTreeId(personalTreeId);
    await fetchPersonalTreePersons(personalTreeId);
  };

  const handleSubmitImportRequest = async () => {
    if (!selectedPersonalTreeId || !treeId) {
      showToast("Please select a personal tree to import.", "error");
      return;
    }
    if (!currentUserId || !currentUser) {
      showToast("Unable to submit import request: user information is missing.", "error");
      return;
    }

    setIsImportRequestLoading(true);
    try {
      await axios.post(`${BACKEND_BASE_URL}/api/import-tree-req/${treeId}/create`, {
        personalTreeId: selectedPersonalTreeId,
        requestorId: currentUserId,
        requestorName: `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim(),
      });
      showToast("Import request submitted. The host will review it.", "success");
      if (userRole === "Host") {
        await fetchImportRequests(treeId);
      }
    } catch (error) {
      console.error("Error submitting import request:", error);
      showToast("Failed to submit import request. Please try again.", "error");
    } finally {
      setIsImportRequestLoading(false);
    }
  };

  const handleApproveImportRequest = async (requestId) => {
    if (!requestId) return;
    setIsImportRequestLoading(true);
    try {
      await axios.put(`${BACKEND_BASE_URL}/api/import-tree-req/${requestId}/approve`, {
        reviewedBy: currentUserId,
      });
      if (treeId) {
        await fetchImportRequests(treeId);
        await fetchTreeData(treeId);
      }
      showToast("Import request approved and merged into the group tree.", "success");
    } catch (error) {
      console.error("Error approving import request:", error);
      showToast("Failed to approve import request. Please try again.", "error");
    } finally {
      setIsImportRequestLoading(false);
    }
  };

  const handleRejectImportRequest = async (requestId) => {
    if (!requestId) return;
    setIsImportRequestLoading(true);
    try {
      await axios.put(`${BACKEND_BASE_URL}/api/import-tree-req/${requestId}/reject`, {
        reviewedBy: currentUserId,
      });
      if (treeId) {
        await fetchImportRequests(treeId);
      }
      showToast("Import request rejected.", "success");
    } catch (error) {
      console.error("Error rejecting import request:", error);
      showToast("Failed to reject import request. Please try again.", "error");
    } finally {
      setIsImportRequestLoading(false);
    }
  };

  const handleMergeSelectedTreeNow = async () => {
    if (!selectedPersonalTreeId || !treeId) {
      showToast("Please select a personal tree to merge.", "error");
      return;
    }
    if (!importPreview) {
      showToast("Please load tree preview before merging.", "error");
      return;
    }

    setIsImportRequestLoading(true);
    try {
      await axios.post(`${BACKEND_BASE_URL}/api/import-tree-req/${treeId}/create`, {
        personalTreeId: selectedPersonalTreeId,
        requestorId: currentUserId,
        preview: importPreview,
      });

      if (treeId) {
        await fetchTreeData(treeId);
        if (userRole === "Host") {
          await fetchImportRequests(treeId);
        }
      }

      showToast("Selected personal tree import request has been submitted.", "success");
    } catch (error) {
      console.error("Error merging selected tree:", error);
      showToast("Failed to merge tree. Please try again.", "error");
    } finally {
      setIsImportRequestLoading(false);
    }
  };

  const fetchTreeData = async (treeIdToFetch) => {
    if (!treeIdToFetch) {
      console.warn("Cannot fetch tree data: treeId is missing.");
      return;
    }
    setIsLoading(true);
    try {
      const personsResponse = await axios.get(`${BACKEND_BASE_URL}/api/persons/tree/${treeIdToFetch}`);
      setPeople(personsResponse.data || []);
    } catch (error) {
      console.error("Failed to fetch tree data:", error);
      setPeople([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePerson = async (personIdToDelete) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this person? This action cannot be undone.");
    if (!confirmDelete) return;
    setIsLoading(true);
    try {
      await axios.delete(`${BACKEND_BASE_URL}/api/persons/${personIdToDelete}`);
      await fetchTreeData(treeId);
    } catch (error) {
      console.error("Error deleting person:", error?.response?.data || error.message);
      alert(`Failed to delete person: ${error?.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPerson = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    if (isEditMode && selectedPersonId) {
      try {
        await axios.put(`${BACKEND_BASE_URL}/api/persons/${selectedPersonId}`, formData);
      } catch (error) {
        console.error("Error updating person:", error);
        alert(`Failed to update person: ${error.response?.data?.message || error.message}`);
        setIsLoading(false);
        return;
      }
    } else {
      const { relationship, ...personDataToSend } = formData;
      personDataToSend.relationships = [];
      try {
        const createPersonResponse = await axios.post(`${BACKEND_BASE_URL}/api/persons/${treeId}`, personDataToSend);
        const newPerson = createPersonResponse.data;
        if (newPerson && selectedPersonId && relationship) {
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
          }
          if (sourceRelationshipType && targetRelationshipType) {
            const selectedPerson = people?.find((person) => getBackendPersonId(person) === selectedPersonId);
            const selectedExistingRelationships = getPersonRelationships(selectedPerson);
            const selectedPersonParentIds = getExistingRelationshipIds(selectedPerson, "parent");
            const selectedSpouseIds = getExistingRelationshipIds(selectedPerson, "spouse");
            const inferredCoParentIds = getCoParentIdsFromExistingChildren(selectedPersonId);
            const coParentIds = Array.from(new Set([...selectedSpouseIds, ...inferredCoParentIds]));
            let spouseConnectIds = [];
            if (relationship === "parent" && selectedPersonParentIds.length > 0) {
              const confirmConnect = window.confirm("This child already has another parent. Do you want to connect the new parent with the existing parent(s) as spouses?");
              if (confirmConnect) spouseConnectIds = selectedPersonParentIds;
            }
            try {
              await axios.put(`${BACKEND_BASE_URL}/api/persons/${selectedPersonId}`, {
                relationships: [
                  ...selectedExistingRelationships,
                  { relatedPersonId: newPerson.personId, type: sourceRelationshipType },
                ],
              });
            } catch (error) {
              console.warn(`Error adding relationship to selected person ${selectedPersonId}:`, error);
            }
            const updatedNewPersonRelationships = [{ relatedPersonId: selectedPersonId, type: targetRelationshipType }];
            if (relationship === "child" && coParentIds.length > 0) {
              coParentIds.forEach((parentId) => {
                if (parentId !== selectedPersonId) updatedNewPersonRelationships.push({ relatedPersonId: parentId, type: "parent" });
              });
            }
            if (relationship === "parent" && spouseConnectIds.length > 0) {
              spouseConnectIds.forEach((parentId) => {
                if (parentId !== newPerson.personId) updatedNewPersonRelationships.push({ relatedPersonId: parentId, type: "spouse" });
              });
            }
            try {
              await axios.put(`${BACKEND_BASE_URL}/api/persons/${newPerson.personId}`, { relationships: updatedNewPersonRelationships });
            } catch (error) {
              console.warn(`Error updating relationships for new person ${newPerson.personId}:`, error);
            }
            if (relationship === "parent" && spouseConnectIds.length > 0) {
              for (const parentId of spouseConnectIds) {
                const parentPerson = people?.find((person) => getBackendPersonId(person) === parentId);
                if (!parentPerson) continue;
                const parentRelationships = getPersonRelationships(parentPerson);
                const hasSpouseRelation = parentRelationships.some((rel) => rel.relatedPersonId === newPerson.personId && String(rel.type).toLowerCase() === "spouse");
                if (!hasSpouseRelation) {
                  parentRelationships.push({ relatedPersonId: newPerson.personId, type: "spouse" });
                  try {
                    await axios.put(`${BACKEND_BASE_URL}/api/persons/${parentId}`, { relationships: parentRelationships });
                  } catch (error) {
                    console.warn(`Error connecting existing parent ${parentId} as spouse:`, error);
                  }
                }
              }
            }
            if (relationship === "child" && coParentIds.length > 0) {
              for (const parentId of coParentIds) {
                if (parentId === selectedPersonId) continue;
                const parentPerson = people?.find((person) => getBackendPersonId(person) === parentId);
                if (!parentPerson) continue;
                const parentRelationships = getPersonRelationships(parentPerson);
                const hasChildRelation = parentRelationships.some((rel) => rel.relatedPersonId === newPerson.personId && String(rel.type).toLowerCase() === "child");
                if (!hasChildRelation) {
                  parentRelationships.push({ relatedPersonId: newPerson.personId, type: "child" });
                  try {
                    await axios.put(`${BACKEND_BASE_URL}/api/persons/${parentId}`, { relationships: parentRelationships });
                  } catch (error) {
                    console.warn(`Error updating co-parent ${parentId} with new child ${newPerson.personId}:`, error);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn("Error adding person to tree:", error);
      }
    }
    setSidebarOpen(false);
    setFormData({ ...initialFormData });
    setSelectedPersonId(null);
    setIsEditMode(false);
    await fetchTreeData(treeId);
    setIsLoading(false);
  };

  const openSidebar = async (personData) => {
    const id = getBackendPersonId(personData);
    setSelectedPersonId(id);
    setSidebarOpen(true);
    setActionMenuOpen(false);
    const d = personData.data || personData || {};
    setFormData({
      ...initialFormData,
      firstName: d["first name"] ?? d.firstName ?? "",
      middleName: d["middle name"] ?? d.middleName ?? "",
      lastName: d["last name"] ?? d.lastName ?? "",
      birthDate: d.birthDate ?? d.birthday ?? "",
      birthPlace: d.birthPlace ?? "",
      gender: d.gender === "M" ? "male" : d.gender === "F" ? "female" : d.gender === "male" ? "male" : d.gender === "female" ? "female" : "",
      status: d.status ?? "living",
      dateOfDeath: d.dateOfDeath ?? "",
      placeOfDeath: d.placeOfDeath ?? "",
    });
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setIsEditMode(false);
  };

  const toggleActionMenu = () => setActionMenuOpen(!actionMenuOpen);
  const closeActionMenu = (e) => {
    if (e.target.closest(".action-buttons")) return;
    setActionMenuOpen(false);
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
    setActiveTab("Add member");
    setIsEditMode(false);
  };

  const selectedPerson = people?.find((person) => getBackendPersonId(person) === selectedPersonId);
  const selectedPersonParentIds = selectedPerson ? getExistingRelationshipIds(selectedPerson, "parent") : [];
  const isAddingParentToChild = !isEditMode && formData.relationship === "parent" && selectedPersonParentIds.length > 0;

  useLayoutEffect(() => {
    if (!isChartReady || !chartRef.current || !people || people.length === 0) return;
    if (chartInstanceRef.current && chartRef.current) {
      d3.select(chartRef.current).selectAll("*").remove();
      chartInstanceRef.current = null;
    }
    try {
      const data = people
        .map((person) => {
          const source = person.data || person;
          const firstName = source.firstName ?? source["first name"] ?? "";
          const lastName = source.lastName ?? source["last name"] ?? "";
          const birthday = source.birthDate ?? source.birthday ?? "";
          const gender = toF3Gender(source.gender);
          const id = getBackendPersonId(person);
          if (!id) return null;
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
        .filter(Boolean);

      d3.select(chartRef.current).selectAll("*").remove();
      const f3Chart = f3
        .createChart(chartRef.current, data)
        .setTransitionTime(700)
        .setCardXSpacing(400)
        .setCardYSpacing(150)
        .setSingleParentEmptyCard(false, { label: "ADD" })
        .setShowSiblingsOfMain(true)
        .setOrientationVertical();

      const f3Card = f3Chart
        .setCardHtml()
        .setCardDisplay([["first name", "last name"], ["birthday"], ["gender"]])
        .setCardDim({ width: 300, height: 100 })
        .setOnHoverPathToMain()
        .setOnCardUpdate(function (d) {
          d3.select(this).select(".card").style("cursor", "default");
          const card = this.querySelector(".card-inner");

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
              openSidebar(d);
            });

          d3.select(card)
            .append("div")
            .attr(
              "style",
              "cursor: pointer; width: 20px; height: 20px; position: absolute; top: 0; right: 46px; background: #e11d48; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;"
            )
            .html("×")
            .on("mouseenter", function () {
              d3.select(this).style("background", "#be123c");
            })
            .on("mouseleave", function () {
              d3.select(this).style("background", "#e11d48");
            })
            .on("click", (e) => {
              e.stopPropagation();
              const personId = getBackendPersonId(d);
              handleDeletePerson(personId);
            });

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
              openSidebar(d);
            });
        });

      f3Chart.updateTree({ initial: true });
      chartInstanceRef.current = f3Chart;
    } catch (error) {
      console.error("Error creating family chart:", error);
    }

    return () => {
      if (chartRef.current) {
        d3.select(chartRef.current).selectAll("*").remove();
      }
      chartInstanceRef.current = null;
    };
  }, [isChartReady, people]);

  return (
    <Layout>
      <div className="min-h-screen relative" style={{ backgroundColor: "#D9D9D9" }}>
        <div className="flex items-center justify-center" style={{ height: "calc(100vh - 64px)" }}>
          <div
            className="f3"
            ref={setChartRef}
            style={{ width: "100%", height: "900px", margin: "auto", backgroundColor: "#D9D9D9", color: "#000000ff" }}
          />
        </div>

        {isLoading && (
          <div className="fixed inset-0 z-45 flex justify-center items-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--light-yellow)]"></div>
          </div>
        )}

        {isModalOpen && personDetailsInModal && (
          <div className="fixed inset-0 bg-black flex items-center justify-center z-[60]" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }} onClick={() => setIsModalOpen(false)}>
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
                    <strong>Place of Death:</strong> {personDetailsInModal.placeOfDeath}</p>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setIsModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {actionMenuOpen && <div className="fixed inset-0 z-10" onClick={closeActionMenu} />}
        {sidebarOpen && <div className="fixed inset-0 bg-black opacity-20 z-40" onClick={closeSidebar} />}

        <div className={`fixed top-[62px] right-0 h-[calc(100%-4rem)] w-100 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-44 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="border-b border-gray-200">
            <div className="flex justify-between items-center px-4 py-2">
              <span className="text-sm font-medium text-gray-700">
                Role: {isRoleLoading ? "Loading..." : userRole || "Unknown"}
              </span>
              <button
                onClick={() => checkUserRole(currentUserId, treeId)}
                className="text-xs text-gray-500 hover:text-gray-700"
                title="Refresh role"
              >
                Refresh role
              </button>
            </div>
            <div className="flex justify-around">
              {['Add member', 'Connections', 'Import Tree'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`mx-1 my-1 rounded-sm px-3 py-2 text-xs font-medium transition-colors flex-grow ${activeTab === tab ? "text-white" : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"}`}
                  style={activeTab === tab ? { backgroundColor: "#365643" } : {}}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "Add member" && (
            <form onSubmit={handleAddPerson}>
              <div className="p-6 space-y-3 overflow-y-auto h-full pb-16 pt-4">
                {!isEditMode && (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                    {isAddingParentToChild && (
                      <div className="mb-3 rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-900">
                        This child already has another parent. After saving, you can choose whether to connect the new parent and existing parent(s) as spouses.
                      </div>
                    )}
                    <div className="flex items-center space-x-6">
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
                    </div>
                  </>
                )}

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900"
                  />
                </div>

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

                <div>
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

                <div>
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

                {formData.status === "deceased" && (
                  <div>
                    <div className="pb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Death</label>
                      <input
                        type="date"
                        name="dateOfDeath"
                        value={formData.dateOfDeath}
                        onChange={handleInputChange}
                        disabled={formData.status === "living"}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Place of Death</label>
                      <input
                        type="text"
                        name="placeOfDeath"
                        value={formData.placeOfDeath}
                        onChange={handleInputChange}
                        disabled={formData.status === "living"}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full text-white py-2.5 px-4 rounded-md hover:bg-green-500 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                    style={{ backgroundColor: "#365643" }}
                  >
                    {isEditMode ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    <span>{isEditMode ? "Edit Person" : "Add Person"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === "Connections" && (
            <div className="p-6 space-y-4 overflow-y-auto h-full">
              {connections.map((person) => (
                <div key={person.id} className="border border-gray-300 rounded-lg p-4 flex items-center justify-between gap-x-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-400 overflow-hidden flex items-center justify-center">
                      <span className="text-[#313131] text-xl font-bold">
                        {person.firstName ? person.firstName.charAt(0) : ""}
                        {person.lastName ? person.lastName.charAt(0) : ""}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800">{person.name}</h4>
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

          {activeTab === "Import Tree" && (
            <div className="p-6 space-y-4 overflow-y-auto h-full">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Select a personal tree to import</h3>
                <p className="text-xs text-gray-500">Choose one of your personal trees for merge preview and submit an import request.</p>
              </div>

              <div className="space-y-3">
                {personalTrees.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                    No personal trees available for import.
                  </div>
                ) : (
                  personalTrees.map((tree) => (
                    <button
                      type="button"
                      key={tree.treeId || tree.id}
                      onClick={() => handleSelectPersonalTree(tree.treeId || tree.id)}
                      className={`w-full border rounded-lg p-4 text-left ${selectedPersonalTreeId === (tree.treeId || tree.id) ? "border-emerald-700 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <div className="flex items-center justify-between gap-x-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{getPersonalTreeLabel(tree)}</h4>
                          <p className="text-xs text-gray-500">{tree.description || `${tree.members?.length || 0} people`}</p>
                        </div>
                        {selectedPersonalTreeId === (tree.treeId || tree.id) && <span className="text-xs text-emerald-700">Selected</span>}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {selectedPersonalTreeId && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Preview</h4>
                  {selectedPersonalTreePersons.length === 0 ? (
                    <p className="text-sm text-gray-500">Loading selected tree members...</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 mb-4">
                        <div className="rounded-lg border border-gray-200 p-3">
                          <p className="font-semibold">Group tree size</p>
                          <p>{people.length} people</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-3">
                          <p className="font-semibold">Import tree size</p>
                          <p>{selectedPersonalTreePersons.length} people</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-3">
                          <p className="font-semibold">Matching nodes</p>
                          <p>{importPreviewSummary?.matchedCount ?? 0}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-3">
                          <p className="font-semibold">New nodes</p>
                          <p>{importPreviewSummary?.newPersonCount ?? 0}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                          The merge preview uses summary matching data and hides individual nodes for a cleaner review.
                        </div>
                        <div className="rounded-lg border border-gray-200 p-3 bg-white text-sm text-gray-700">
                          <p className="font-medium text-gray-800">Preview details</p>
                          <p className="mt-2">Matching details are available in the summary above. Individual node rows are not shown in this preview.</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="pt-3 flex flex-col gap-2">
                {userRole !== "Host" && (
                  <button
                    type="button"
                    onClick={handleSubmitImportRequest}
                    disabled={isImportRequestLoading || !selectedPersonalTreeId}
                    className="w-full text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    style={{ backgroundColor: "#365643" }}
                  >
                    {isImportRequestLoading ? "Submitting request..." : "Submit Import Request"}
                  </button>
                )}

                {userRole === "Host" && (
                  <button
                    type="button"
                    onClick={handleMergeSelectedTreeNow}
                    disabled={isImportRequestLoading || !selectedPersonalTreeId}
                    className="w-full text-[#365643] border border-emerald-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-50 transition-colors disabled:opacity-50"
                  >
                    {isImportRequestLoading ? "Merging..." : "Merge Now"}
                  </button>
                )}

                {userRole !== "Host" && (
                  <p className="text-xs text-gray-500 pt-1">Only the group Host can perform an immediate merge.</p>
                )}
              </div>

              {userRole === "Host" && (
                <div className="rounded-lg border border-gray-200 bg-white p-4 mt-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Pending import requests</h4>
                      <p className="text-xs text-gray-500">
                        {importRequests.length} pending request{importRequests.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fetchImportRequests(treeId)}
                        className="text-xs text-gray-500 hover:text-gray-800"
                        title="Refresh pending requests"
                      >
                        Refresh
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          fetchImportRequests(treeId);
                          setIsRequestsModalOpen(true);
                        }}
                        className="text-xs text-[#365643] border border-[#365643] px-3 py-1 rounded hover:bg-emerald-50"
                      >
                        View Requests
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isRequestsModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setIsRequestsModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Pending Import Requests</h2>
                <p className="text-xs text-gray-500">Review and approve or reject requests from group members.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestsModalOpen(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4 max-h-[70vh]">
              {importRequests.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">No pending import requests.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {importRequests.map((request) => (
                    <div key={request.id || request.requestId} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{request.requestorName || "Unknown requester"}</p>
                          <p className="text-xs text-gray-500">Requested import for tree {request.personalTreeId || request.treeId}</p>
                          <p className="text-xs text-gray-500">Created: {new Date(request.createdAt || request.created || Date.now()).toLocaleString()}</p>
                          <p className="text-xs text-gray-600 mt-2">{request.preview ? `Preview matched ${request.preview.matchedCount} of ${request.preview.importPersonCount} people.` : "No preview available."}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleApproveImportRequest(request.requestId || request.id)}
                            className="bg-[#365643] text-white px-4 py-2 rounded-md text-sm hover:bg-[#4f6f52] disabled:opacity-50"
                            disabled={isImportRequestLoading}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectImportRequest(request.requestId || request.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
                            disabled={isImportRequestLoading}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
            <div className="flex items-center justify-end border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => fetchImportRequests(treeId)}
                className="text-xs text-[#365643] border border-[#365643] px-3 py-1 rounded hover:bg-emerald-50"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.visible && (
        <div className="fixed bottom-4 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-4">
          <div className={`rounded-xl px-4 py-3 shadow-lg text-sm font-medium text-white ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
            {toast.message}
          </div>
        </div>
      )}
    </Layout>
  );
}

function ViewGroupPageWithAuth() {
  return (
    <AuthController mode="PROTECT">
      <ViewGroupPage />
    </AuthController>
  );
}

export default ViewGroupPageWithAuth;
