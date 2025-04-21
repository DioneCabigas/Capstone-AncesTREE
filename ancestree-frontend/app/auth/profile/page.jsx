'use client'

/**
 * ProfilePage Component - Redesigned with 60-30-10 Color Rule
 * 
 * 60% - Light Yellow (Background, main content areas)
 * 30% - Light Green (Secondary elements, headers, sections)
 * 10% - Dark Green (Accents, important buttons, active elements)
 */

import { useState, useEffect } from "react";
import { auth, db } from "@/app/utils/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Navbar from '@/components/Navbar';
import AuthController from '@/components/AuthController';
import Link from 'next/link';

// Icons
import { Trash } from 'lucide-react';

function ProfileContent() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    middleName: "n/a",
    suffix: "n/a",
    birthDate: "",
    birthPlace: "",
    address: {
      street: "n/a",
      city: "",
      province: "",
      country: "",
      zipCode: ""
    },
    contact: {
      homePhone: "n/a",
      mobilePhone: ""
    }
  });
  
  const [activeTab, setActiveTab] = useState("details");
  const [connections, setConnections] = useState([
    { id: "user2", name: "User 2" }
  ]);

  // Fetch user data from Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            
            // Merge the fetched data with our default structure
            setUserData(prevState => ({
              ...prevState,
              firstName: data.firstName || "",
              lastName: data.lastName || "",
              middleName: data.middleName || "n/a",
              suffix: data.suffix || "n/a",
              birthDate: data.birthDate || "",
              birthPlace: data.birthPlace || "",
              address: {
                street: data.address?.street || "n/a",
                city: data.address?.city || "",
                province: data.address?.province || "",
                country: data.address?.country || "",
                zipCode: data.address?.zipCode || ""
              },
              contact: {
                homePhone: data.contact?.homePhone || "n/a",
                mobilePhone: data.contact?.mobilePhone || ""
              }
            }));
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Handle editing profile information
  const handleEdit = () => {
    // This would navigate to an edit form or toggle edit mode
    alert("Edit functionality will be implemented later");
  };

  // Handle removing a connection
  const handleRemoveConnection = (connectionId) => {
    // This would remove the connection after confirmation
    setConnections(connections.filter(conn => conn.id !== connectionId));
  };

  return (
    <div className="min-h-screen bg-[var(--light-yellow)]"> {/* 60% dominant color */}
      {/* Navbar - 30% Secondary Color */}
      <Navbar />
      
      <div className="container mx-auto pt-8 px-4 pb-12">
        {/* Profile Header */}
        <div className="bg-[var(--light-green)] rounded-t-lg p-6 mb-0 text-[var(--light-yellow)]"> {/* 30% secondary color */}
          <div className="flex flex-col items-center">
            {/* Avatar Circle */}
            <div className="w-32 h-32 rounded-full bg-[var(--light-yellow)] border-4 border-[var(--dark-green)] mb-4 flex items-center justify-center overflow-hidden">
              {/* If there's a profile image, it would go here */}
              <span className="text-[var(--dark-green)] text-5xl font-bold">
                {userData.firstName && userData.lastName ? 
                  `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}` : "??"
                }
              </span>
            </div>
            
            {/* User Name */}
            <h1 className="text-2xl font-bold">
              {userData.firstName} {userData.lastName}
            </h1>
          </div>
        </div>
        
        {/* Tab Navigation - Part of secondary color */}
        <div className="flex bg-[var(--light-green)] px-6 pb-4 rounded-b-lg mb-6">
          <button 
            className={`py-2 px-6 rounded-t-lg mr-2 font-medium ${activeTab === "details" 
              ? "bg-[var(--light-yellow)] text-[var(--dark-green)]" /* 10% accent color */ 
              : "bg-[rgba(245,245,220,0.2)] text-[var(--light-yellow)]"}`}
            onClick={() => setActiveTab("details")}
          >
            DETAILS
          </button>
          
          <button 
            className={`py-2 px-6 rounded-t-lg font-medium ${activeTab === "connections" 
              ? "bg-[var(--light-yellow)] text-[var(--dark-green)]" /* 10% accent color */
              : "bg-[rgba(245,245,220,0.2)] text-[var(--light-yellow)]"}`}
            onClick={() => setActiveTab("connections")}
          >
            CONNECTIONS
          </button>
        </div>
        
        {/* Tab Content */}
        {activeTab === "details" ? (
          /* Personal Information Tab */
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[var(--dark-green)]">Personal Information</h2> {/* 10% accent color */}
              <button 
                onClick={handleEdit} 
                className="px-5 py-2 bg-[var(--dark-green)] text-[var(--light-yellow)] rounded-md hover:bg-opacity-90"
              >
                Edit
              </button>
            </div>
            
            {/* Personal Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="text-right font-semibold text-[var(--light-green)]">First Name:</div> {/* secondary color */}
              <div className="text-[var(--dark-green)]">{userData.firstName}</div> {/* accent color */}
              
              <div className="text-right font-semibold text-[var(--light-green)]">Last Name:</div>
              <div className="text-[var(--dark-green)]">{userData.lastName}</div>
              
              <div className="text-right font-semibold text-[var(--light-green)]">Middle Name:</div>
              <div className="text-[var(--dark-green)]">{userData.middleName}</div>
              
              <div className="text-right font-semibold text-[var(--light-green)]">Suffix:</div>
              <div className="text-[var(--dark-green)]">{userData.suffix}</div>
              
              <div className="text-right font-semibold text-[var(--light-green)]">Birth Date:</div>
              <div className="text-[var(--dark-green)]">{userData.birthDate}</div>
              
              <div className="text-right font-semibold text-[var(--light-green)]">Birth Place:</div>
              <div className="text-[var(--dark-green)]">{userData.birthPlace}</div>
            </div>
            
            {/* Current Address Section */}
            <div className="border-t border-b border-[var(--light-yellow)] py-4 my-6"> {/* dominant color as separator */}
              <h3 className="text-lg font-semibold text-[var(--dark-green)] mb-4">Current Address</h3> {/* accent color */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-right font-semibold text-[var(--light-green)]">Street:</div>
                <div className="text-[var(--dark-green)]">{userData.address.street}</div>
                
                <div className="text-right font-semibold text-[var(--light-green)]">City:</div>
                <div className="text-[var(--dark-green)]">{userData.address.city}</div>
                
                <div className="text-right font-semibold text-[var(--light-green)]">Province:</div>
                <div className="text-[var(--dark-green)]">{userData.address.province}</div>
                
                <div className="text-right font-semibold text-[var(--light-green)]">Country:</div>
                <div className="text-[var(--dark-green)]">{userData.address.country}</div>
                
                <div className="text-right font-semibold text-[var(--light-green)]">Zip Code:</div>
                <div className="text-[var(--dark-green)]">{userData.address.zipCode}</div>
              </div>
            </div>
            
            {/* Contact Section */}
            <h3 className="text-lg font-semibold text-[var(--dark-green)] mb-4">Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-right font-semibold text-[var(--light-green)]">Home #:</div>
              <div className="text-[var(--dark-green)]">{userData.contact.homePhone}</div>
              
              <div className="text-right font-semibold text-[var(--light-green)]">Phone #:</div>
              <div className="text-[var(--dark-green)]">{userData.contact.mobilePhone}</div>
            </div>
          </div>
        ) : (
          /* Connections Tab */
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold text-[var(--dark-green)] mb-6">Connections</h2>
            
            {/* List of connections */}
            {connections.map((connection) => (
              <div key={connection.id} className="flex items-center justify-between border-b border-[var(--light-yellow)] py-4">
                <div className="flex items-center">
                  {/* Connection Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[var(--light-green)] text-[var(--light-yellow)] flex items-center justify-center mr-4">
                    <span className="font-bold">{connection.name.charAt(0)}</span>
                  </div>
                  <span className="text-[var(--dark-green)] font-medium">{connection.name}</span>
                </div>
                
                <div className="flex space-x-3">
                  <button className="px-4 py-2 bg-[var(--light-green)] text-[var(--light-yellow)] text-sm rounded-md hover:bg-opacity-90">
                    View Tree
                  </button>
                  <button 
                    onClick={() => handleRemoveConnection(connection.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            ))}
            
            {connections.length === 0 && (
              <p className="text-gray-500 italic py-4">No connections found.</p>
            )}
            
            {/* Add Connection Button */}
            <div className="mt-6">
              <button className="px-5 py-2 bg-[var(--dark-green)] text-[var(--light-yellow)] rounded-md hover:bg-opacity-90">
                Add Connection
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer - 30% Secondary Color */}
      <footer className="bg-[var(--light-green)] py-4 text-center text-[var(--light-yellow)]">
        <p>© 2025 Your Application Name</p>
      </footer>
    </div>
  );
}

export default function Profile() {
  return (
    <AuthController mode="PROTECT">
      <ProfileContent />
    </AuthController>
  );
}