"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/utils/firebase";
import Layout from '@/components/Layout';
import AuthController from '@/components/AuthController';
import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Plus, User, Edit3, UserPlus, X, ToggleLeft, ToggleRight } from "lucide-react";
import ReactFlow, { ReactFlowProvider, Background, Controls, useReactFlow, Handle } from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";
import PersonNode from "@/components/PersonNode";
import axios from "axios";

// Marriage junction component - invisible connection point
const MarriageJunctionNode = ({ data }) => {
  // Only show horizontal junctions as small visible squares
  const isVisible = data?.isHorizontalJunction;
  
  return (
    <div 
      className={`w-1 relative`} 
      style={{ 
        opacity: isVisible ? 1 : 0, 
        height: '2px',
        backgroundColor: isVisible ? '#4F6F52' : 'transparent'
      }}
    >
      {/* All handles positioned at edges of the square for proper connections */}
      <Handle type="target" position="top" id="top" className="opacity-0" style={{ top: 0 }} />
      <Handle type="source" position="top" id="top" className="opacity-0" style={{ top: 0 }} />
      <Handle type="target" position="bottom" id="bottom" className="opacity-0" style={{ bottom: 0 }} />
      <Handle type="source" position="bottom" id="bottom" className="opacity-0" style={{ bottom: 0 }} />
      <Handle type="target" position="left" id="left" className="opacity-0" style={{ left: 0 }} />
      <Handle type="source" position="left" id="left" className="opacity-0" style={{ left: 0 }} />
      <Handle type="target" position="right" id="right" className="opacity-0" style={{ right: 0 }} />
      <Handle type="source" position="right" id="right" className="opacity-0" style={{ right: 0 }} />
    </div>
  );
};

const nodeTypes = {
  person: PersonNode,
  marriage: MarriageJunctionNode,
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

function PersonalTree() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const externalUid = searchParams.get("uid");
  const [isCurrentUsersTree, setIsCurrentUsersTree] = useState(false);

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
  const [connections, setConnections] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // New state for toolbar functionality
  const [autoLayout, setAutoLayout] = useState(true); // Keep auto layout as default
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPersonData, setEditPersonData] = useState(null);
  const [editConnectionPersonId, setEditConnectionPersonId] = useState("");
  const [editRelationshipType, setEditRelationshipType] = useState("");
  
  // Remove relationship modal state
  const [isRemoveRelationshipModalOpen, setIsRemoveRelationshipModalOpen] = useState(false);
  const [selectedPersonForRelationshipRemoval, setSelectedPersonForRelationshipRemoval] = useState(null);

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

  // FETCH TREE DATA USE EFFECT
  useEffect(() => {
    if (externalUid !== currentUserId) {
      const isCurrentUsersTreeBool = false;
      fetchTreeData(externalUid, currentUser, isCurrentUsersTreeBool);
      setIsCurrentUsersTree(false);
    } else if (currentUserId && currentUser) {
      const isCurrentUsersTreeBool = true;
      console.log("Both UID and User Profile are ready. Fetching tree data.");
      setIsCurrentUsersTree(true);
      fetchTreeData(currentUserId, currentUser, isCurrentUsersTreeBool);
      fetchConnectionsData(currentUserId); //new
    } else if (!currentUserId && !currentUser) {
      console.log("User logged out or profile not loaded yet.");
      setNodes([]);
      setEdges([]);
      setPeople([]);
    }
  }, [currentUserId, currentUser, externalUid]);

  // Auto-layout disabled - users can position nodes manually by dragging
  // useEffect(() => {
  //   if (autoLayout && people.length > 0) {
  //     console.log('Auto-layout useEffect triggered with people:', people.length);
  //     const currentNodes = transformPeopleToNodes(people, openSidebar, handleDeletePerson, handleViewPerson, isCurrentUsersTree);
  //     const { reactFlowEdges, dagreEdges, marriageJunctions } = transformPeopleToEdgesEnhanced(people);
  //     const allNodes = [...currentNodes, ...marriageJunctions];
  //     const { layoutedNodes } = applyFamilyTreeLayout(allNodes, people);
  //     setNodes(layoutedNodes);
  //     setEdges(reactFlowEdges);
  //   }
  // }, [autoLayout, people, isCurrentUsersTree]);


  const fetchUserDetails = async (uid) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/user/${uid}`);
      if (response.status === 200) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching user details for ${uid}:`, error);
      return null;
    }
  };

  // FETCH CONNECTIONS
  const fetchConnectionsData = async (userId) => {
    try {
      let connectionsResponse;

      // First attempt - alternative endpoint format
      try {
        connectionsResponse = await axios.get(`http://localhost:3001/api/connections/${userId}`);
      } catch (error) {
        console.error("Failed to fetch connections data:", error);
      }

      if (connectionsResponse.status === 200) {
        // For each connection, get the other user's details
        const connectionsWithDetails = await Promise.all(
          connectionsResponse.data.map(async (conn) => {
            // Use the connectionWith field if available, otherwise determine it
            const otherUserId = conn.connectionWith || (conn.requester === userId ? conn.receiver : conn.requester);

            const userDetails = await fetchUserDetails(otherUserId);

            return {
              ...conn,
              otherUserId,
              name: userDetails ? `${userDetails.firstName} ${userDetails.lastName}` : "Unknown User",
              firstName: userDetails ? userDetails.firstName : "",
              lastName: userDetails ? userDetails.lastName : "",
              gender: userDetails ? userDetails.gender : "",
              birthDate: userDetails ? userDetails.birthDate : "",
              birthPlace: userDetails ? userDetails.birthPlace : "",
              status: userDetails ? userDetails.status : "living",
              dateOfDeath: userDetails ? userDetails.dateOfDeath : "",
              placeOfDeath: userDetails ? userDetails.placeOfDeath : "",
            };
          })
        );

        setConnections(connectionsWithDetails);
      }
    } catch (error) {
      console.error("Error fetching connections data:", error);
      setError("Failed to load connections. Please check console for details.");
      setConnections([]);
    }
  };

  const performSuggestionsSearch = async (term, city, country) => {
    const trimmedTerm = term.trim();
    const trimmedCity = city.trim();
    const trimmedCountry = country.trim();

    if (!trimmedTerm && !trimmedCity && !trimmedCountry) {
      return []; // Return empty array if no search criteria
    }

    try {
      const params = new URLSearchParams({
        search: trimmedTerm,
        city: trimmedCity,
        country: trimmedCountry,
      });

      const res = await axios.get(`http://localhost:3001/api/search?${params.toString()}`);

      if (res.status === 200) {
        return res.data.results || []; // Return the results array
      } else {
        throw new Error(res.data?.message || `HTTP error! status: ${res.status}`);
      }
    } catch (err) {
      console.error("Error searching for suggestions:", err);
      return []; // Return empty array on error
    }
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
              (treePerson) => treePerson.firstName?.toLowerCase() === user.firstName?.toLowerCase() && treePerson.lastName?.toLowerCase() === user.lastName?.toLowerCase()
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

  const transformPeopleToNodes = (people, openSidebar, handleDeletePerson, handleViewPerson, isCurrentUsersTreeBool) => {
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
          setEditPersonData(personData);
          setEditConnectionPersonId("");
          setEditRelationshipType("");
          setIsEditModalOpen(true);
        },
        handleRemoveRelationship: (personData) => {
          setSelectedPersonForRelationshipRemoval(personData);
          setIsRemoveRelationshipModalOpen(true);
        },
        isCurrentUsersTree: isCurrentUsersTreeBool,
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

  // Enhanced family tree transformation with T-junctions
  const transformPeopleToEdgesEnhanced = (people) => {
    console.log('=== ENHANCED FAMILY TREE WITH T-JUNCTIONS ===');
    const reactFlowEdges = [];
    const dagreEdges = [];
    const marriageJunctions = [];
    const processedRelationships = new Set();
    const spousePairs = new Map(); // Track spouse pairs for junction creation
    
    // Step 1: Identify spouse relationships and create spouse pairs
    people.forEach(person => {
      person.relationships?.forEach(rel => {
        if (rel.type.toLowerCase() === 'spouse') {
          const [id1, id2] = getSortedSpouseIds(person.personId, rel.relatedPersonId);
          const pairKey = `${id1}-${id2}`;
          
          if (!spousePairs.has(pairKey)) {
            spousePairs.set(pairKey, { spouse1: id1, spouse2: id2 });
            console.log(`Found spouse pair: ${id1} ↔ ${id2}`);
          }
        }
      });
    });
    
    // Step 2: Create T-junction nodes for each spouse pair
    spousePairs.forEach((pair, pairKey) => {
      // Horizontal junction - connects the two spouses
      const hJunctionId = `h-junction-${pairKey}`;
      marriageJunctions.push({
        id: hJunctionId,
        type: 'marriage',
        position: { x: 0, y: 0 }, // Will be positioned later
        data: { isHorizontalJunction: true, spousePair: pair }
      });
      
      // Vertical junction - connects to children (if any)
      const vJunctionId = `v-junction-${pairKey}`;
      marriageJunctions.push({
        id: vJunctionId,
        type: 'marriage', 
        position: { x: 0, y: 0 }, // Will be positioned later
        data: { isVerticalJunction: true, spousePair: pair }
      });
      
      // Create spouse connection edges via horizontal junction
      reactFlowEdges.push(
        // Spouse 1 to horizontal junction
        {
          id: `spouse1-to-hjunction-${pairKey}`,
          source: pair.spouse1,
          target: hJunctionId,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'straight',
          style: { stroke: '#4F6F52', strokeWidth: 2 }
        },
        // Horizontal junction to spouse 2
        {
          id: `hjunction-to-spouse2-${pairKey}`,
          source: hJunctionId,
          target: pair.spouse2,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'straight',
          style: { stroke: '#4F6F52', strokeWidth: 2 }
        }
        // Removed vertical red line - children will connect directly from horizontal junction
      );
      
      // Dagre edge to keep spouses on same level
      dagreEdges.push({
        source: pair.spouse1,
        target: pair.spouse2,
        minlen: 1,
        weight: 0.1,
        constraint: "same"
      });
      
      console.log(`Created T-junction system for spouse pair: ${pairKey}`);
    });
    
    // Step 3: Process parent-child relationships
    people.forEach(person => {
      person.relationships?.forEach(rel => {
        const relationshipKey = `${person.personId}-${rel.relatedPersonId}-${rel.type.toLowerCase()}`;
        const reverseKey = `${rel.relatedPersonId}-${person.personId}-${rel.type.toLowerCase()}`;
        
        // Skip if already processed or if it's a spouse relationship (handled above)
        if (processedRelationships.has(relationshipKey) || 
            processedRelationships.has(reverseKey) ||
            rel.type.toLowerCase() === 'spouse') {
          return;
        }
        
        const lowercaseRelType = rel.type.toLowerCase();
        let parentId, childId;
        
        if (lowercaseRelType === 'parent') {
          parentId = rel.relatedPersonId;
          childId = person.personId;
        } else if (lowercaseRelType === 'child') {
          parentId = person.personId;
          childId = rel.relatedPersonId;
        } else {
          return; // Skip non-family relationships
        }
        
        console.log(`Processing parent-child: ${parentId} → ${childId}`);
        
        // Check if parent is part of a spouse pair
        let parentConnection = null;
        spousePairs.forEach((pair, pairKey) => {
          if (pair.spouse1 === parentId || pair.spouse2 === parentId) {
            parentConnection = `h-junction-${pairKey}`; // Connect directly to horizontal junction
            console.log(`  Parent ${parentId} is in spouse pair, connecting via ${parentConnection}`);
          }
        });
        
        // Create unique edge ID to prevent duplicates
        const edgeId = parentConnection ? 
          `hjunction-to-child-${childId}-from-${parentConnection.replace('h-junction-', '')}` :
          `parent-child-${parentId}-${childId}`;
          
        // Check if this edge already exists
        const edgeExists = reactFlowEdges.some(edge => edge.id === edgeId);
        
        if (!edgeExists) {
          if (parentConnection) {
            // Connect child directly to the horizontal junction of the spouse pair
            reactFlowEdges.push({
              id: edgeId,
              source: parentConnection,
              target: childId,
              sourceHandle: 'bottom',
              targetHandle: 'top',
              type: 'smoothstep',
              style: { stroke: '#4F6F52', strokeWidth: 2 }
            });
          } else {
            // Direct parent-child connection (no spouse pair involved)
            reactFlowEdges.push({
              id: edgeId,
              source: parentId,
              target: childId,
              sourceHandle: 'bottom',
              targetHandle: 'top',
              type: 'smoothstep',
              style: { stroke: '#4F6F52', strokeWidth: 2 }
            });
          }
          console.log(`Added parent-child edge: ${edgeId}`);
        } else {
          console.log(`Skipped duplicate edge: ${edgeId}`);
        }
        
        // Add dagre edge for hierarchy
        dagreEdges.push({
          source: parentId,
          target: childId
        });
        
        // Mark as processed
        processedRelationships.add(relationshipKey);
        processedRelationships.add(reverseKey);
      });
    });
    
    console.log('=== T-JUNCTION TRANSFORMATION COMPLETE ===');
    console.log('Spouse pairs found:', spousePairs.size);
    console.log('Marriage junctions created:', marriageJunctions.length);
    console.log('Total edges created:', reactFlowEdges.length);
    
    return { reactFlowEdges, dagreEdges, marriageJunctions };
  };

  const transformPeopleToEdges = (people) => {
    console.log('=== TRANSFORM PEOPLE TO EDGES ===');
    console.log('People data:', people);
    
    // Check what relationships exist
    people.forEach((person, index) => {
      console.log(`Person ${index}: ${person.firstName} ${person.lastName}`);
      console.log('  Relationships:', person.relationships);
      if (person.relationships && person.relationships.length > 0) {
        person.relationships.forEach((rel, relIndex) => {
          console.log(`    Relationship ${relIndex}: ${rel.type} to ${rel.relatedPersonId}`);
        });
      } else {
        console.log('    No relationships found');
      }
    });
    
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
        console.log(`Processing relationship: ${person.firstName} ${person.lastName} -> ${targetPerson.firstName} ${targetPerson.lastName} (${lowercaseRelType})`);

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
            const parentChildEdge = {
              id: `e-${parentId}-${childId}-parentOf`,
              source: parentId, // Parent is the source 
              target: childId,  // Child is the target
              // label: "parent of",
              type: "smoothstep",
              sourceHandle: "bottom",  // Parent handle: bottom (parent connects downward)
              targetHandle: "top",     // Child handle: top (child receives from above)
              style: { stroke: '#4F6F52', strokeWidth: 2 }, // Green color for parent-child connections
            };
            console.log('Adding parent-child edge:', parentChildEdge);
            console.log(`  Parent ${parentId} (bottom handle) → Child ${childId} (top handle)`);
            reactFlowEdges.push(parentChildEdge);
            addedReactFlowEdges.add(edgeKey);
          }
          const dagreEdgeKey = `D_${parentId}-${childId}`;
          if (!addedDagreEdges.has(dagreEdgeKey)) {
            dagreEdges.push({ source: parentId, target: childId }); // Correct direction: parent -> child (for proper hierarchy)
            addedDagreEdges.add(dagreEdgeKey);
          }
        }

        // Spouse Logic
        else if (lowercaseRelType === "spouse") {
          const [id1, id2] = getSortedSpouseIds(person.personId, rel.relatedPersonId);
          const spouseEdgeKey = `S_${id1}-${id2}`;

          if (!addedReactFlowEdges.has(spouseEdgeKey)) {
            const spouseEdge = {
              id: `e-${id1}-${id2}-spouseOf`,
              source: id1,
              target: id2,
              // label: "spouse of",
              type: "smoothstep",
              sourceHandle: "right",
              targetHandle: "left",
              style: { stroke: '#4F6F52', strokeWidth: 2 }, // Green color for spouse connections
            };
            console.log('Adding spouse edge:', spouseEdge);
            reactFlowEdges.push(spouseEdge);
            addedReactFlowEdges.add(spouseEdgeKey);
          }

          const dagreSpouseEdgeKey = `DS_${id1}-${id2}`;
          if (!addedDagreEdges.has(dagreSpouseEdgeKey)) {
            dagreEdges.push({
              source: id1,
              target: id2,
              minlen: 1,
              weight: 1, // Lower weight for horizontal spacing
              constraint: "same", // Keep on same rank (horizontal level)
            });
            addedDagreEdges.add(dagreSpouseEdgeKey);
          }
        }
      });
    });

    // Enhanced family tree transformation complete
    
    console.log('Final reactFlowEdges:', reactFlowEdges);
    console.log('Total edges created:', reactFlowEdges.length);
    reactFlowEdges.forEach((edge, index) => {
      console.log(`Edge ${index}:`, edge);
    });
    return { reactFlowEdges, dagreEdges };
  };

  // Custom Family Tree Layout Algorithm - Specifically designed for genealogical data
  const applyFamilyTreeLayout = (nodes, people) => {
    console.log('=== APPLYING CUSTOM FAMILY TREE LAYOUT ===');
    console.log('Input people data:', people);
    
    const nodeWidth = 200;
    const nodeHeight = 200;
    const spouseSpacing = 300;  // Space between spouses
    const generationSpacing = 300;  // Space between generations (increased for 200px height nodes)
    const siblingSpacing = 220;  // Space between siblings
    
    // Step 1: Build family relationships map using original people data
    const spouseMap = new Map();  // person -> spouse
    const childrenMap = new Map(); // person -> [children]
    const parentsMap = new Map();  // person -> [parents]
    const generationLevels = new Map(); // person -> generation level
    // Junction nodes will be positioned manually between spouses
    
    // Parse relationships directly from people data (more reliable than parsing edges)
    people.forEach(person => {
      console.log(`Processing relationships for: ${person.firstName} ${person.lastName} (${person.personId})`);
      
      person.relationships?.forEach(rel => {
        const relType = rel.type.toLowerCase();
        const relatedPersonId = rel.relatedPersonId;
        
        console.log(`  - ${relType} relationship with ${relatedPersonId}`);
        
        if (relType === 'spouse') {
          spouseMap.set(person.personId, relatedPersonId);
          console.log(`    Added spouse mapping: ${person.personId} -> ${relatedPersonId}`);
        } else if (relType === 'parent') {
          // This person is a child, relatedPersonId is their parent
          if (!parentsMap.has(person.personId)) {
            parentsMap.set(person.personId, []);
          }
          parentsMap.get(person.personId).push(relatedPersonId);
          
          // Add reverse mapping - parent has this person as child
          if (!childrenMap.has(relatedPersonId)) {
            childrenMap.set(relatedPersonId, []);
          }
          if (!childrenMap.get(relatedPersonId).includes(person.personId)) {
            childrenMap.get(relatedPersonId).push(person.personId);
          }
          
          console.log(`    Added parent mapping: child ${person.personId} -> parent ${relatedPersonId}`);
          console.log(`    Added child mapping: parent ${relatedPersonId} -> child ${person.personId}`);
        } else if (relType === 'child') {
          // This person is a parent, relatedPersonId is their child
          if (!childrenMap.has(person.personId)) {
            childrenMap.set(person.personId, []);
          }
          if (!childrenMap.get(person.personId).includes(relatedPersonId)) {
            childrenMap.get(person.personId).push(relatedPersonId);
          }
          
          // Add reverse mapping - child has this person as parent
          if (!parentsMap.has(relatedPersonId)) {
            parentsMap.set(relatedPersonId, []);
          }
          parentsMap.get(relatedPersonId).push(person.personId);
          
          console.log(`    Added child mapping: parent ${person.personId} -> child ${relatedPersonId}`);
          console.log(`    Added parent mapping: child ${relatedPersonId} -> parent ${person.personId}`);
        }
      });
    });
    
    console.log('=== FAMILY RELATIONSHIPS PARSED ===');
    console.log('Spouses found:', [...spouseMap.entries()]);
    console.log('Children found:', [...childrenMap.entries()]);
    console.log('Parents found:', [...parentsMap.entries()]);
    
    // Debug: Show what we found for your specific family
    spouseMap.forEach((spouse, person) => {
      console.log(`${person} is married to ${spouse}`);
    });
    
    childrenMap.forEach((children, parent) => {
      console.log(`${parent} has children: ${children.join(', ')}`);
    });
    
    parentsMap.forEach((parents, child) => {
      console.log(`${child} has parents: ${parents.join(', ')}`);
    });
    
    // Step 2: Assign generation levels
    const personNodes = nodes.filter(n => n.type === 'person');
    const visited = new Set();
    
    // Find root nodes (no parents) and assign them to generation 0
    const rootNodes = personNodes.filter(node => !parentsMap.has(node.id) || parentsMap.get(node.id).length === 0);
    console.log('Root nodes found:', rootNodes.map(n => n.id));
    
    const assignGenerationLevel = (personId, level) => {
      if (visited.has(personId)) return;
      visited.add(personId);
      
      generationLevels.set(personId, level);
      console.log(`Assigned generation ${level} to person ${personId}`);
      
      // Assign same level to spouse
      const spouse = spouseMap.get(personId);
      if (spouse && !visited.has(spouse)) {
        generationLevels.set(spouse, level);
        visited.add(spouse);
        console.log(`Assigned generation ${level} to spouse ${spouse}`);
      }
      
      // Assign next level to children
      const children = childrenMap.get(personId) || [];
      children.forEach(childId => {
        if (!visited.has(childId)) {
          assignGenerationLevel(childId, level + 1);
        }
      });
    };
    
    // Start from root nodes
    rootNodes.forEach(rootNode => {
      assignGenerationLevel(rootNode.id, 0);
    });
    
    // Handle any remaining unvisited nodes
    personNodes.forEach(node => {
      if (!visited.has(node.id)) {
        console.log(`Assigning default generation 0 to unvisited node: ${node.id}`);
        assignGenerationLevel(node.id, 0);
      }
    });
    
    // Junction nodes are positioned manually between spouses (no generation assignment needed)
    
    console.log('Generation levels:', [...generationLevels.entries()]);
    
    // Step 3: Position nodes by generation
    const generationGroups = new Map();
    
    // Group nodes by generation
    generationLevels.forEach((level, personId) => {
      if (!generationGroups.has(level)) {
        generationGroups.set(level, []);
      }
      generationGroups.get(level).push(personId);
    });
    
    console.log('Generation groups:', [...generationGroups.entries()]);
    
    // Step 4: Position nodes
    const layoutedNodes = [...nodes];
    
    // Calculate optimal starting X to center the tree
    const maxGenerationSize = Math.max(...Array.from(generationGroups.values()).map(gen => gen.length));
    const estimatedTreeWidth = maxGenerationSize * (spouseSpacing + siblingSpacing);
    const startX = Math.max(100, (800 - estimatedTreeWidth) / 2); // Center the tree better
    
    // Sort generations from oldest to youngest
    const sortedGenerations = [...generationGroups.keys()].sort((a, b) => a - b);
    
    sortedGenerations.forEach(generation => {
      const generationMembers = generationGroups.get(generation);
      const generationY = 100 + generation * generationSpacing;
      
      // Group spouses together
      const spousePairs = [];
      const singles = [];
      const processed = new Set();
      
      generationMembers.forEach(personId => {
        if (processed.has(personId)) return;
        
        const spouse = spouseMap.get(personId);
        if (spouse && generationMembers.includes(spouse)) {
          spousePairs.push([personId, spouse]);
          processed.add(personId);
          processed.add(spouse);
        } else {
          singles.push(personId);
          processed.add(personId);
        }
      });
      
      console.log(`Generation ${generation}: ${spousePairs.length} spouse pairs, ${singles.length} singles`);
      
      let currentX = startX;
      
      // Position spouse pairs
      spousePairs.forEach(([spouse1, spouse2]) => {
        const spouse1Node = layoutedNodes.find(n => n.id === spouse1);
        const spouse2Node = layoutedNodes.find(n => n.id === spouse2);
        
        if (spouse1Node && spouse2Node) {
          // Position spouses side by side
          spouse1Node.position = { x: currentX, y: generationY };
          spouse2Node.position = { x: currentX + spouseSpacing, y: generationY };
          
          console.log(`Positioned spouse pair: ${spouse1} at (${currentX}, ${generationY}), ${spouse2} at (${currentX + spouseSpacing}, ${generationY})`);
          
          currentX += spouseSpacing + siblingSpacing;
        }
      });
      
      // Position singles
      singles.forEach(personId => {
        const personNode = layoutedNodes.find(n => n.id === personId);
        if (personNode) {
          personNode.position = { x: currentX, y: generationY };
          console.log(`Positioned single: ${personId} at (${currentX}, ${generationY})`);
          currentX += siblingSpacing;
        }
      });
    });
    
    // Position T-junction nodes close to family members using custom algorithm
    const junctionNodes = layoutedNodes.filter(n => n.type === 'marriage');
    console.log('Positioning T-junction nodes with custom family tree layout:', junctionNodes.length);
    
    junctionNodes.forEach(junction => {
      if (junction.data?.isHorizontalJunction && junction.data?.spousePair) {
        // Horizontal junction - position exactly between spouses at their Y level
        const spouse1Node = layoutedNodes.find(n => n.id === junction.data.spousePair.spouse1);
        const spouse2Node = layoutedNodes.find(n => n.id === junction.data.spousePair.spouse2);
        
        if (spouse1Node && spouse2Node) {
          // Position junction shifted left to make junction-to-Annabel line longer
          const centerX = spouse1Node.position.x + nodeWidth/2 + (spouse2Node.position.x - spouse1Node.position.x) / 2 - 30;
          // Position junction at exact same vertical center as spouses for perfectly straight horizontal line
          const sharedY = spouse1Node.position.y + (nodeHeight / 2) - 17; // Adjusted 17px higher (raised by 1px)
          
          // Double-check both spouses are at exact same Y (they should be from positioning code)
          if (Math.abs(spouse1Node.position.y - spouse2Node.position.y) > 0.1) {
            console.warn(`Spouses not at same Y level: ${spouse1Node.position.y} vs ${spouse2Node.position.y}`);
          }
          
          junction.position = { x: centerX, y: sharedY };
          console.log(`Custom layout - Positioned horizontal junction ${junction.id} at (${centerX}, ${sharedY})`);
        }
      } else if (junction.data?.isVerticalJunction && junction.data?.spousePair) {
        // Vertical junction - position just below the horizontal junction
        const hJunctionId = junction.id.replace('v-junction-', 'h-junction-');
        const horizontalJunction = layoutedNodes.find(n => n.id === hJunctionId);
        
        if (horizontalJunction) {
          const junctionY = horizontalJunction.position.y + 60; // 60px below horizontal junction
          
          junction.position = { 
            x: horizontalJunction.position.x, 
            y: junctionY
          };
          console.log(`Custom layout - Positioned vertical junction ${junction.id} at (${junction.position.x}, ${junctionY})`);
        }
      } else {
        // Legacy junction positioning for backward compatibility
        if (junction.id.includes('h-junction-')) {
          const pairKey = junction.id.replace('h-junction-', '');
          const [spouse1Id, spouse2Id] = pairKey.split('-');
          
          const spouse1Node = layoutedNodes.find(n => n.id === spouse1Id);
          const spouse2Node = layoutedNodes.find(n => n.id === spouse2Id);
          
          if (spouse1Node && spouse2Node) {
            const centerX = spouse1Node.position.x + nodeWidth/2 + (spouse2Node.position.x - spouse1Node.position.x) / 2 - 30;
            const sharedY = spouse1Node.position.y + (nodeHeight / 2) - 17; // Adjusted 17px higher (raised by 1px)
            junction.position = { x: centerX, y: sharedY };
          }
        }
      }
    });
    
    // Step 5: Adjust children positioning to be equidistant from junctions
    spouseMap.forEach((spouse, person) => {
      const pairKey = [person, spouse].sort().join('-');
      const horizontalJunction = layoutedNodes.find(n => n.id === `h-junction-${pairKey}`);
      
      if (horizontalJunction) {
        const children = [...(childrenMap.get(person) || []), ...(childrenMap.get(spouse) || [])];
        const uniqueChildren = [...new Set(children)]; // Remove duplicates
        
        if (uniqueChildren.length > 0) {
          console.log(`Positioning ${uniqueChildren.length} children around junction at x=${horizontalJunction.position.x}`);
          
          // Position children centered around the junction (no odd/even condition)
          const childSpacing = 220; // Same as siblingSpacing
          const numChildren = uniqueChildren.length;
          
          // Always center children around the junction
          const totalWidth = (numChildren - 1) * childSpacing;
          const startX = horizontalJunction.position.x - totalWidth / 2;
          console.log(`Positioning ${numChildren} children centered around junction at x=${horizontalJunction.position.x}`);
          console.log(`Total width: ${totalWidth}, startX: ${startX}`);
          
          uniqueChildren.forEach((childId, index) => {
            const childNode = layoutedNodes.find(n => n.id === childId);
            if (childNode) {
              const childX = startX + index * childSpacing;
              console.log(`DEBUG: Junction at x=${horizontalJunction.position.x}, startX=${startX}, index=${index}, childSpacing=${childSpacing}`);
              console.log(`DEBUG: Calculated childX = ${startX} + ${index} * ${childSpacing} = ${childX}`);
              childNode.position = { x: childX, y: childNode.position.y }; // Keep same Y, adjust X
              console.log(`Repositioned child ${childId} at (${childX}, ${childNode.position.y}) - should be directly below junction`);
            }
          });
        }
      }
    });
    
    console.log('=== CUSTOM FAMILY TREE LAYOUT COMPLETE ===');
    console.log('Final layouted nodes:', layoutedNodes.length);
    
    return { layoutedNodes, reactFlowEdges: [] }; // Return empty reactFlowEdges since we'll use the original ones
  };
  
  const applyLayout = (nodes, { reactFlowEdges, dagreEdges }, direction = "TB") => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
      rankdir: direction, // TB = Top to Bottom (parents above, children below)
      nodesep: 150, // Horizontal spacing between nodes on same level
      ranksep: 200, // Vertical spacing between generations
      align: "UL", // Align nodes to upper left
      marginx: 50,
      marginy: 50,
    });

    const nodeWidth = 200;
    const nodeHeight = 200;

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    dagreEdges.forEach((edge) => {
      const edgeOptions = { 
        minlen: edge.minlen || 1,
        weight: edge.weight || 1
      };
      
      // Special handling for spouse relationships to keep them on the same rank
      if (edge.constraint === "same") {
        edgeOptions.minlen = 1;
        edgeOptions.weight = 0.1; // Very low weight for spouses
      }
      
      dagreGraph.setEdge(edge.source, edge.target, edgeOptions);
    });

    dagre.layout(dagreGraph);

    let layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    });
    
    // Post-process to ensure spouses are side by side
    const spousePairs = new Map();
    reactFlowEdges.forEach(edge => {
      if (edge.style?.stroke === '#4F6F52' && edge.sourceHandle === 'right' && edge.targetHandle === 'left') {
        // This is a spouse edge
        const spouse1Id = edge.source;
        const spouse2Id = edge.target;
        spousePairs.set(`${spouse1Id}-${spouse2Id}`, { spouse1: spouse1Id, spouse2: spouse2Id });
      }
    });
    
    // Adjust spouse positions to ensure they're properly side by side
    spousePairs.forEach(({ spouse1, spouse2 }) => {
      const spouse1Node = layoutedNodes.find(n => n.id === spouse1);
      const spouse2Node = layoutedNodes.find(n => n.id === spouse2);
      
      if (spouse1Node && spouse2Node) {
        // Force both spouses to the same Y level
        const targetY = Math.min(spouse1Node.position.y, spouse2Node.position.y);
        spouse1Node.position.y = targetY;
        spouse2Node.position.y = targetY;
        
        // Ensure proper horizontal spacing
        const centerX = (spouse1Node.position.x + spouse2Node.position.x) / 2;
        const spouseSpacing = nodeWidth + 100;
        
        spouse1Node.position.x = centerX - spouseSpacing / 2;
        spouse2Node.position.x = centerX + spouseSpacing / 2;
      }
    });

    // Junction positioning is now handled by the custom family tree layout
    console.log('Junction positioning delegated to custom family tree layout');

    return { layoutedNodes, reactFlowEdges };
  };

  // FETCH TREE DATA
  const fetchTreeData = async (uid, userProfileData, isCurrentUsersTreeBool) => {
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
      const treeResponse = await axios.get(`http://localhost:3001/api/family-trees/personal/${uid}`);
      const personalTreeData = treeResponse.data;

      if (personalTreeData && personalTreeData.treeId) {
        treeIdToUse = personalTreeData.treeId;
        setTreeId(treeIdToUse);
        console.log("Existing Personal tree Id found:", treeIdToUse);
      }
      // else {
      //   // CREATE NEW TREE for testing only
      //   console.warn("Personal tree not found for user:", uid, ". Creating a new one...");
      //   try {
      //     treeIdToUse = await createTree(uid, userProfileData);
      //   } catch (createTreeError) {
      //     console.error("Failed to create new tree during fetchTreeData: ", createTreeError);
      //     return;
      //   }
      // }

      if (treeIdToUse) {
        console.log("Fetching persons for tree ID:", treeIdToUse);
        const personsResponse = await axios.get(`http://localhost:3001/api/persons/tree/${treeIdToUse}`);
        const fetchedPeople = personsResponse.data;
        console.log("People data:", fetchedPeople);
        setPeople(fetchedPeople);

        const newNodes = transformPeopleToNodes(fetchedPeople, openSidebar, handleDeletePerson, handleViewPerson, isCurrentUsersTreeBool);
        const { reactFlowEdges, dagreEdges, marriageJunctions } = transformPeopleToEdgesEnhanced(fetchedPeople);
        
        // Add marriage junction nodes to the nodes array
        const allNodes = [...newNodes, ...marriageJunctions];
        console.log('All nodes (people + junctions):', allNodes.length);

        console.log('In fetchTreeData - About to set edges:', reactFlowEdges);
        
        // Enhanced family tree transformation applied
        
        // Manual layout mode - provide initial positions then users can drag
        console.log('FetchTreeData - Manual dragging mode, providing initial positions');
        
        // Apply initial positioning so nodes aren't all stacked at (0,0)
        const { layoutedNodes } = applyFamilyTreeLayout(allNodes, fetchedPeople);
        console.log('Applied initial positions, now users can drag nodes freely');
        
        setNodes(layoutedNodes);
        setEdges(reactFlowEdges);
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
  // const connections = [
  //   { id: 1, name: "Jane Doe", timeframe: "year - Present" },
  //   { id: 2, name: "Jane Doe", timeframe: "year - Present" },
  //   { id: 3, name: "Jane Doe", timeframe: "year - Present" },
  // ];

  // const suggestions = [
  //   { id: 1, name: "Jane Doe", timeframe: "year - Present", relatedTo: "John Doe" },
  //   { id: 2, name: "Jane Doe", timeframe: "year - Present", relatedTo: "John Doe" },
  //   { id: 3, name: "Jane Doe", timeframe: "year - Present", relatedTo: "John Doe" },
  // ];

  const handleAddPerson = async () => {
    event.preventDefault();
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

  const openSidebar = async (personId) => {
    setSelectedPersonId(personId);
    setSidebarOpen(true);
    setActionMenuOpen(false);
    setFormData({ ...initialFormData });

    if (people.length > 0) {
      console.log("Sidebar opened for person:", personId, "Generating suggestions...");
      await generateSuggestions(personId, people); // Pass personId here
    } else {
      console.log("Sidebar opened, but data not ready for suggestions.", {
        peopleCount: people.length,
      });
      setSuggestions([]); // Clear suggestions if data isn't ready
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setIsEditMode(false);
    // setSuggestions([]);
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

  const handleAddToTree = (personDetails) => {
    // Set the form data with the details from the selected connection
    setFormData({
      // It's good to explicitly map fields to ensure correct naming for your form
      relationship: "",
      firstName: personDetails.firstName || "",
      middleName: personDetails.middleName || "",
      lastName: personDetails.lastName || "",
      birthDate: personDetails.birthDate || "",
      birthPlace: personDetails.birthPlace || "",
      gender: personDetails.gender || "",
      status: personDetails.status || "living",
      dateOfDeath: "",
      placeOfDeath: "",
      // Relationship should probably be reset or chosen manually for the new person relative to existing tree
    });

    // Switch to the "Add member" tab
    setActiveTab("Add member");

    // Ensure the form is in 'add' mode, not 'edit' mode, when pre-filling from a connection
    setIsEditMode(false); // Make sure you have an setIsEditMode state in your parent component
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

      console.log("IsCurrentUser'sTree Boolean after delete: ", isCurrentUsersTree);
      if (!isCurrentUsersTree) {
        await fetchTreeData(externalUid, currentUser, isCurrentUsersTree);
      } else {
        await fetchTreeData(currentUserId, currentUser, isCurrentUsersTree);
      }
    } catch (error) {
      console.error("Error deleting person:", error.response?.data || error.message);
      alert(`Failed to delete person: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // New toolbar functions

  // Auto layout toggle disabled - permanent manual dragging mode
  // const handleToggleAutoLayout = () => {
  //   setAutoLayout(prev => !prev);
  //   if (!autoLayout && people.length > 0) {
  //     const currentNodes = transformPeopleToNodes(people, openSidebar, handleDeletePerson, handleViewPerson, isCurrentUsersTree);
  //     const { reactFlowEdges, dagreEdges, marriageJunctions } = transformPeopleToEdgesEnhanced(people);
  //     const allNodes = [...currentNodes, ...marriageJunctions];
  //     const { layoutedNodes } = applyFamilyTreeLayout(allNodes, people);
  //     setNodes(layoutedNodes);
  //     setEdges(reactFlowEdges);
  //   }
  // };

  const handleNodeDrag = (event, node) => {
    // This will be handled by ReactFlow's built-in drag handling
    // We just need to make sure we don't apply auto-layout when manual positioning is happening
  };

  // Edit modal functions
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditPersonData(null);
    setEditConnectionPersonId("");
    setEditRelationshipType("");
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "status" && value === "living") {
      setEditPersonData((prev) => ({
        ...prev,
        [name]: value,
        dateOfDeath: "",
        placeOfDeath: "",
      }));
    } else {
      setEditPersonData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editPersonData) return;

    setIsLoading(true);
    try {
      // Prepare clean person data for update (remove any extra fields)
      const cleanPersonData = {
        firstName: editPersonData.firstName?.trim(),
        middleName: editPersonData.middleName?.trim() || "",
        lastName: editPersonData.lastName?.trim(),
        birthDate: editPersonData.birthDate || null,
        birthPlace: editPersonData.birthPlace?.trim() || "",
        gender: editPersonData.gender,
        status: editPersonData.status || "living",
        dateOfDeath: editPersonData.status === "deceased" ? (editPersonData.dateOfDeath || null) : null,
        placeOfDeath: editPersonData.status === "deceased" ? (editPersonData.placeOfDeath?.trim() || "") : "",
      };

      console.log("Attempting to update person with data:", cleanPersonData);
      console.log("Person ID:", editPersonData.personId);

      // Update the person's basic information
      const response = await axios.put(`http://localhost:3001/api/persons/${editPersonData.personId}`, cleanPersonData);
      console.log(`Successfully updated person ${editPersonData.personId}:`, response.data);

      // Handle new connection if specified
      if (editConnectionPersonId && editRelationshipType) {
        let sourceRelationshipType, targetRelationshipType;
        
        if (editRelationshipType === "parent") {
          sourceRelationshipType = "child";
          targetRelationshipType = "parent";
        } else if (editRelationshipType === "child") {
          sourceRelationshipType = "parent";
          targetRelationshipType = "child";
        } else if (editRelationshipType === "spouse") {
          sourceRelationshipType = "spouse";
          targetRelationshipType = "spouse";
        }

        try {
          // Add relationship from edited person to selected person
          await axios.put(`http://localhost:3001/api/persons/${editPersonData.personId}`, {
            relationships: [
              {
                relatedPersonId: editConnectionPersonId,
                type: targetRelationshipType,
              },
            ],
          });
          console.log(`Successfully added relationship to person ${editPersonData.personId}`);

          // Add reciprocal relationship from selected person to edited person
          await axios.put(`http://localhost:3001/api/persons/${editConnectionPersonId}`, {
            relationships: [
              {
                relatedPersonId: editPersonData.personId,
                type: sourceRelationshipType,
              },
            ],
          });
          console.log(`Successfully added reciprocal relationship to person ${editConnectionPersonId}`);
        } catch (relationshipError) {
          console.error("Error creating relationships:", relationshipError);
          // Don't fail the whole operation if relationships fail
          alert(`Person updated successfully, but failed to create relationship: ${relationshipError.response?.data?.message || relationshipError.message}`);
        }
      }

      closeEditModal();
      
      // Refresh the tree
      if (!isCurrentUsersTree) {
        await fetchTreeData(externalUid, currentUser, isCurrentUsersTree);
      } else {
        await fetchTreeData(currentUserId, currentUser, isCurrentUsersTree);
      }
    } catch (error) {
      console.error("Error updating person:", error);
      alert(`Failed to update person: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Close remove relationship modal
  const closeRemoveRelationshipModal = () => {
    setIsRemoveRelationshipModalOpen(false);
    setSelectedPersonForRelationshipRemoval(null);
  };

  // Handle relationship removal
  const handleRemoveRelationshipSubmit = async (personId, relationshipToRemove) => {
    setIsLoading(true);
    try {
      console.log('Removing relationship:', relationshipToRemove, 'from person:', personId);
      
      // Remove relationship from the selected person
      await axios.patch(`http://localhost:3001/api/persons/relationship/${personId}`, {
        relationshipToRemove: relationshipToRemove
      });
      
      // Remove reciprocal relationship
      const reciprocalRelationshipType = getReciprocalRelationshipType(relationshipToRemove.type);
      await axios.patch(`http://localhost:3001/api/persons/relationship/${relationshipToRemove.relatedPersonId}`, {
        relationshipToRemove: {
          relatedPersonId: personId,
          type: reciprocalRelationshipType
        }
      });
      
      console.log('Successfully removed relationship');
      closeRemoveRelationshipModal();
      
      // Refresh the tree
      if (!isCurrentUsersTree) {
        await fetchTreeData(externalUid, currentUser, isCurrentUsersTree);
      } else {
        await fetchTreeData(currentUserId, currentUser, isCurrentUsersTree);
      }
    } catch (error) {
      console.error('Error removing relationship:', error);
      alert(`Failed to remove relationship: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get reciprocal relationship type
  const getReciprocalRelationshipType = (relationshipType) => {
    switch (relationshipType.toLowerCase()) {
      case 'parent': return 'child';
      case 'child': return 'parent';
      case 'spouse': return 'spouse';
      default: return relationshipType;
    }
  };

  // Get available people for connection (exclude the person being edited)
  const availableConnections = people.filter(person => 
    person.personId !== editPersonData?.personId && 
    person.firstName && 
    person.lastName
  );

  return (
    <Layout>
      <div className="min-h-screen relative" style={{ backgroundColor: "#D9D9D9" }}>
        {/* Top Right Add Node Button */}
        <div className="fixed top-20 right-6 z-30">
          {/* White panel background */}
          <div className="bg-white rounded-lg p-3 shadow-lg border border-gray-200">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center space-x-2 text-white px-3 py-2 rounded-lg hover:opacity-90 transition-colors shadow-md text-sm"
              style={{ backgroundColor: '#4F6F52' }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Node</span>
            </button>
          </div>
        </div>

        {/* Main Tree Area */}
        <div className="flex items-center justify-center" style={{ height: "calc(100vh - 64px)" }}>
          <ReactFlowProvider>
            <div style={{ width: "100%", height: "100%" }}>
              {console.log('RENDERING ReactFlow with nodes:', nodes.length, 'edges:', edges.length)}
              {console.log('RENDERING ReactFlow edges:', edges)}
              <ReactFlow 
                nodes={nodes} 
                edges={edges} 
                nodeTypes={nodeTypes} 
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={true}
                onNodesChange={() => {
                  // Node dragging is disabled, no position changes needed
                }}
              >
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

        {/* Edit Person Modal */}
        {isEditModalOpen && editPersonData && (
          <div className="fixed inset-0 bg-black flex items-center justify-center z-[70]" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }} onClick={closeEditModal}>
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Edit {editPersonData.firstName} {editPersonData.lastName}
                </h2>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                {/* Connection Section */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Connection (Optional)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Connect to Person</label>
                      <select
                        value={editConnectionPersonId}
                        onChange={(e) => setEditConnectionPersonId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900"
                      >
                        <option value="">Select a person (optional)</option>
                        {availableConnections.map(person => (
                          <option key={person.personId} value={person.personId}>
                            {person.firstName} {person.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Relationship Type</label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="editRelationship"
                            value="parent"
                            checked={editRelationshipType === "parent"}
                            onChange={(e) => setEditRelationshipType(e.target.value)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Parent</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="editRelationship"
                            value="child"
                            checked={editRelationshipType === "child"}
                            onChange={(e) => setEditRelationshipType(e.target.value)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Child</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="editRelationship"
                            value="spouse"
                            checked={editRelationshipType === "spouse"}
                            onChange={(e) => setEditRelationshipType(e.target.value)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Spouse</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={editPersonData.firstName || ""}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900"
                        required
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={editPersonData.lastName || ""}
                        onChange={handleEditInputChange}
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
                        value={editPersonData.middleName || ""}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="gender"
                            value="male"
                            checked={editPersonData.gender === "male"}
                            onChange={handleEditInputChange}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Male</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="gender"
                            value="female"
                            checked={editPersonData.gender === "female"}
                            onChange={handleEditInputChange}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Female</span>
                        </label>
                      </div>
                    </div>

                    {/* Birth Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                      <input
                        type="date"
                        name="birthDate"
                        value={editPersonData.birthDate || ""}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900"
                      />
                    </div>

                    {/* Birth Place */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birth Place</label>
                      <input
                        type="text"
                        name="birthPlace"
                        value={editPersonData.birthPlace || ""}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="status"
                            value="living"
                            checked={editPersonData.status === "living"}
                            onChange={handleEditInputChange}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Living</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="status"
                            value="deceased"
                            checked={editPersonData.status === "deceased"}
                            onChange={handleEditInputChange}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Deceased</span>
                        </label>
                      </div>
                    </div>

                    {/* Death Information - Only show if deceased */}
                    {editPersonData.status === "deceased" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Death</label>
                          <input
                            type="date"
                            name="dateOfDeath"
                            value={editPersonData.dateOfDeath || ""}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Place of Death</label>
                          <input
                            type="text"
                            name="placeOfDeath"
                            value={editPersonData.placeOfDeath || ""}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Remove Relationship Modal */}
        {isRemoveRelationshipModalOpen && selectedPersonForRelationshipRemoval && (
          <div className="fixed inset-0 bg-black flex items-center justify-center z-[70]" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }} onClick={closeRemoveRelationshipModal}>
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Remove Relationship
                </h2>
                <button
                  onClick={closeRemoveRelationshipModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-gray-700 mb-4">
                  Select a relationship to remove for <strong>{selectedPersonForRelationshipRemoval.firstName} {selectedPersonForRelationshipRemoval.lastName}</strong>:
                </p>
                
                {selectedPersonForRelationshipRemoval.relationships && selectedPersonForRelationshipRemoval.relationships.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPersonForRelationshipRemoval.relationships.map((relationship, index) => {
                      const relatedPerson = people.find(p => p.personId === relationship.relatedPersonId);
                      return (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                          <div>
                            <span className="font-medium">
                              {relatedPerson ? `${relatedPerson.firstName} ${relatedPerson.lastName}` : 'Unknown Person'}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">({relationship.type})</span>
                          </div>
                          <button
                            onClick={() => handleRemoveRelationshipSubmit(selectedPersonForRelationshipRemoval.personId, relationship)}
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    This person has no relationships to remove.
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={closeRemoveRelationshipModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
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
          className={`fixed top-[62px] right-0 h-[calc(100%-4rem)] w-100 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-44 ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex justify-around">
            {["Add member", "Connections", "Suggestions"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`mx-1 my-1 rounded-sm px-3 py-2 text-xs font-medium transition-colors flex-grow ${
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
          <div className="p-6 space-y-4 overflow-y-auto h-full pb-16 pt-4">
            


            {/* Add Person Form */}
            <form onSubmit={handleAddPerson}>
              <div className="space-y-3">
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
                      <span>{isEditMode ? "Edit Person" : "Add Person"}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          // </div>
        )}

        {/* Connections Tab */}
        {activeTab === "Connections" && (
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
        {activeTab === "Suggestions" && (
          <div className="p-6 space-y-4 overflow-y-auto h-full">
            <div className="mb-4">
              {/* <h3 className="text-sm font-semibold text-gray-800 mb-1">You might be related to the following people:</h3> */}
              <p className="text-xs text-gray-600">You might be related to these following people</p>
            </div>

            {suggestions.map((person) => (
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
                        <button className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-50 transition-colors">View</button>
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
