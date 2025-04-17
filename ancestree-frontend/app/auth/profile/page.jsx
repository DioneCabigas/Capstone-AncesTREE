'use client'

/**
 * ProfilePage Component
 * 
 * This component displays a user's profile information with two tabs:
 * 1. Details - Personal information, address, and contact details
 * 2. Connections - Family tree connections to other users
 *
 * The component follows the wireframe design and uses the app's existing theme.
 */

import { useState, useEffect } from "react";
import { auth, db } from "@/app/utils/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Navbar from '@/components/Navbar';
import AuthController from '@/components/AuthController';
import Link from 'next/link';

// Icons for the tab interface and functionality
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
    <div className="min-h-screen bg-[var(--dark-green)]">
      <Navbar />
      
      <div className="container mx-auto pt-24 px-4">
        {/* Profile Header with Avatar */}
        <div className="bg-gray-200 rounded-md p-6 mb-4">
          <div className="flex flex-col items-center">
            {/* Avatar Circle */}
            <div className="w-32 h-32 rounded-full bg-white border-2 border-[var(--dark-green)] mb-4"></div>
            
            {/* User Name */}
            <h1 className="text-2xl font-bold text-black">
              {userData.firstName} {userData.lastName}
            </h1>
            
            {/* Tab Navigation */}
            <div className="flex mt-6 space-x-2">
              <button 
                className={`py-2 px-4 ${activeTab === "details" 
                  ? "bg-[var(--dark-green)] text-[var(--light-yellow)]" 
                  : "bg-gray-300 text-black"}`}
                onClick={() => setActiveTab("details")}
              >
                DETAILS
              </button>
              
              <button 
                className={`py-2 px-4 ${activeTab === "connections" 
                  ? "bg-[var(--dark-green)] text-[var(--light-yellow)]" 
                  : "bg-gray-300 text-black"}`}
                onClick={() => setActiveTab("connections")}
              >
                CONNECTIONS
              </button>
            </div>
          </div>
        </div>
        
        {/* Tab Content */}
        {activeTab === "details" ? (
          /* Personal Information Tab */
          <div className="bg-white rounded-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-black">Personal Information</h2>
              <button 
                onClick={handleEdit} 
                className="px-4 py-1 bg-[var(--light-green)] text-white rounded"
              >
                Edit
              </button>
            </div>
            
            {/* Personal Information Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="text-right font-semibold text-black">First Name:</div>
              <div className="text-black">{userData.firstName}</div>
              
              <div className="text-right font-semibold text-black">Last Name:</div>
              <div className="text-black">{userData.lastName}</div>
              
              <div className="text-right font-semibold text-black">Middle Name:</div>
              <div className="text-black">{userData.middleName}</div>
              
              <div className="text-right font-semibold text-black">Suffix:</div>
              <div className="text-black">{userData.suffix}</div>
              
              <div className="text-right font-semibold text-black">Birth Date:</div>
              <div className="text-black">{userData.birthDate}</div>
              
              <div className="text-right font-semibold text-black">Birth Place:</div>
              <div className="text-black">{userData.birthPlace}</div>
            </div>
            
            {/* Current Address Section */}
            <h3 className="text-lg font-semibold text-black mb-2">Current Address</h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="text-right font-semibold text-black">Street:</div>
              <div className="text-black">{userData.address.street}</div>
              
              <div className="text-right font-semibold text-black">City:</div>
              <div className="text-black">{userData.address.city}</div>
              
              <div className="text-right font-semibold text-black">Province:</div>
              <div className="text-black">{userData.address.province}</div>
              
              <div className="text-right font-semibold text-black">Country:</div>
              <div className="text-black">{userData.address.country}</div>
              
              <div className="text-right font-semibold text-black">Zip Code:</div>
              <div className="text-black">{userData.address.zipCode}</div>
            </div>
            
            {/* Contact Section */}
            <h3 className="text-lg font-semibold text-black mb-2">Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-right font-semibold text-black">Home #:</div>
              <div className="text-black">{userData.contact.homePhone}</div>
              
              <div className="text-right font-semibold text-black">Phone #:</div>
              <div className="text-black">{userData.contact.mobilePhone}</div>
            </div>
          </div>
        ) : (
          /* Connections Tab */
          <div className="bg-white rounded-md p-6">
            <h2 className="text-xl font-semibold text-black mb-4">Connections</h2>
            
            {/* List of connections */}
            {connections.map((connection) => (
              <div key={connection.id} className="flex items-center justify-between border-b py-3">
                <div className="flex items-center">
                  {/* Connection Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gray-300 mr-3"></div>
                  <span className="text-black">{connection.name}</span>
                </div>
                
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-[var(--light-green)] text-white text-sm rounded">
                    View Tree
                  </button>
                  <button 
                    onClick={() => handleRemoveConnection(connection.id)}
                    className="p-1 text-red-500"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            ))}
            
            {connections.length === 0 && (
              <p className="text-gray-500 italic">No connections found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Profile Component (Main export)
 * 
 * Wraps the ProfileContent component with the AuthController in PROTECT mode
 * to ensure only authenticated users can access this page.
 */
export default function Profile() {
  return (
    <AuthController mode="PROTECT">
      <ProfileContent />
    </AuthController>
  );
}