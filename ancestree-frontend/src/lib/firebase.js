import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBjYgRlTDN3RI9JQYFyT1c6hxwHXpEcpW4",
  authDomain: "capstone-ancestree.firebaseapp.com",
  projectId: "capstone-ancestree",
  storageBucket: "capstone-ancestree.appspot.com",
  messagingSenderId: "593123471522",
  appId: "1:593123471522:web:c82dff86e53c6ab96ce662"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google: ", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
    throw error;
  }
};

// Listen for auth state changes
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore DB operations for Family Members
export const createFamilyMember = async (userId, memberData) => {
  try {
    const familyMembersRef = collection(firestore, `users/${userId}/familyMembers`);
    const docRef = doc(familyMembersRef);
    await setDoc(docRef, { ...memberData, id: docRef.id, createdAt: new Date() });
    return docRef.id;
  } catch (error) {
    console.error("Error creating family member: ", error);
    throw error;
  }
};

export const updateFamilyMember = async (userId, memberId, memberData) => {
  try {
    const memberRef = doc(firestore, `users/${userId}/familyMembers/${memberId}`);
    await updateDoc(memberRef, { ...memberData, updatedAt: new Date() });
    return memberId;
  } catch (error) {
    console.error("Error updating family member: ", error);
    throw error;
  }
};

export const deleteFamilyMember = async (userId, memberId) => {
  try {
    await deleteDoc(doc(firestore, `users/${userId}/familyMembers/${memberId}`));
    return memberId;
  } catch (error) {
    console.error("Error deleting family member: ", error);
    throw error;
  }
};

export const getFamilyMember = async (userId, memberId) => {
  try {
    const memberDoc = await getDoc(doc(firestore, `users/${userId}/familyMembers/${memberId}`));
    if (memberDoc.exists()) {
      return { id: memberDoc.id, ...memberDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting family member: ", error);
    throw error;
  }
};

export const getFamilyMembers = async (userId) => {
  try {
    const membersQuery = query(collection(firestore, `users/${userId}/familyMembers`));
    const querySnapshot = await getDocs(membersQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting family members: ", error);
    throw error;
  }
};

// Family Tree operations
export const createFamilyTree = async (userId, treeData) => {
  try {
    const treesRef = collection(firestore, `users/${userId}/familyTrees`);
    const docRef = doc(treesRef);
    await setDoc(docRef, { ...treeData, id: docRef.id, createdAt: new Date() });
    return docRef.id;
  } catch (error) {
    console.error("Error creating family tree: ", error);
    throw error;
  }
};

export const updateFamilyTree = async (userId, treeId, treeData) => {
  try {
    const treeRef = doc(firestore, `users/${userId}/familyTrees/${treeId}`);
    await updateDoc(treeRef, { ...treeData, updatedAt: new Date() });
    return treeId;
  } catch (error) {
    console.error("Error updating family tree: ", error);
    throw error;
  }
};

export const getFamilyTree = async (userId, treeId) => {
  try {
    const treeDoc = await getDoc(doc(firestore, `users/${userId}/familyTrees/${treeId}`));
    if (treeDoc.exists()) {
      return { id: treeDoc.id, ...treeDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting family tree: ", error);
    throw error;
  }
};

export const getFamilyTrees = async (userId) => {
  try {
    const treesQuery = query(collection(firestore, `users/${userId}/familyTrees`));
    const querySnapshot = await getDocs(treesQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting family trees: ", error);
    throw error;
  }
};

// Family Group operations
export const createFamilyGroup = async (groupData) => {
  try {
    const groupsRef = collection(firestore, 'familyGroups');
    const docRef = doc(groupsRef);
    await setDoc(docRef, { 
      ...groupData, 
      id: docRef.id, 
      createdAt: new Date(),
      members: [{ 
        id: groupData.createdBy, 
        role: 'admin', 
        joinedAt: new Date() 
      }]
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating family group: ", error);
    throw error;
  }
};

export const updateFamilyGroup = async (groupId, groupData) => {
  try {
    const groupRef = doc(firestore, `familyGroups/${groupId}`);
    await updateDoc(groupRef, { ...groupData, updatedAt: new Date() });
    return groupId;
  } catch (error) {
    console.error("Error updating family group: ", error);
    throw error;
  }
};

export const getFamilyGroup = async (groupId) => {
  try {
    const groupDoc = await getDoc(doc(firestore, `familyGroups/${groupId}`));
    if (groupDoc.exists()) {
      return { id: groupDoc.id, ...groupDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting family group: ", error);
    throw error;
  }
};

export const getUserFamilyGroups = async (userId) => {
  try {
    const groupsQuery = query(
      collection(firestore, 'familyGroups'),
      where('members', 'array-contains', { id: userId })
    );
    const querySnapshot = await getDocs(groupsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting user family groups: ", error);
    throw error;
  }
};

export const addMemberToGroup = async (groupId, userId, role = 'member') => {
  try {
    const groupRef = doc(firestore, `familyGroups/${groupId}`);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      throw new Error("Group not found");
    }
    
    const groupData = groupDoc.data();
    const members = groupData.members || [];
    const memberExists = members.some((member) => member.id === userId);
    
    if (!memberExists) {
      members.push({
        id: userId,
        role,
        joinedAt: new Date()
      });
      
      await updateDoc(groupRef, { members });
    }
    
    return groupId;
  } catch (error) {
    console.error("Error adding member to group: ", error);
    throw error;
  }
};

export const removeMemberFromGroup = async (groupId, userId) => {
  try {
    const groupRef = doc(firestore, `familyGroups/${groupId}`);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      throw new Error("Group not found");
    }
    
    const groupData = groupDoc.data();
    const members = (groupData.members || []).filter((member) => member.id !== userId);
    
    await updateDoc(groupRef, { members });
    return groupId;
  } catch (error) {
    console.error("Error removing member from group: ", error);
    throw error;
  }
};

// Profile picture upload
export const uploadProfilePicture = async (userId, file) => {
  try {
    const storageRef = ref(storage, `profilePictures/${userId}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile picture: ", error);
    throw error;
  }
};

export { auth, firestore, storage };