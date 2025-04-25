'use client'

/**
 * ProfilePage Component - Redesigned with 60-30-10 Color Rule
 * 
 * 60% - White (#FFFFFF) - Primary/dominant color
 * 30% - Light Green (#4F6F52) - Secondary color
 * 10% - Dark Gray (#313131) - Accent color
 */

import { useState, useEffect } from "react";
import { auth, db } from "@/app/utils/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import AuthController from '@/components/AuthController';
import Navbar from '../../../components/Navbar';
import { Edit, User, MapPin, Calendar, Phone, Heart, ChevronDown, Trash2 } from 'lucide-react';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({
    firstName: "Arthur",
    lastName: "Ehem",
    middleName: "Unknown",
    suffix: "Unknown",
    birthDate: "Unknown",
    deathDate: "Unknown",
    birthPlace: "Unknown",
    birthingCenter: "Unknown",
    nationality: "",
    civilStatus: "Unknown",
    userId: "",
    address: {
      street: "Unknown",
      city: "Unknown",
      province: "Unknown",
      country: "Unknown",
      zipCode: "Unknown"
    },
    contact: {
      homePhone: "Unknown",
      mobilePhone: "Unknown"
    }
  });
  
  const [activeTab, setActiveTab] = useState("details");
  const [activeSection, setActiveSection] = useState("general");
  const [connections, setConnections] = useState([
    { id: "user2", name: "User 2" }
  ]);
  const router = useRouter();

  // Handle editing profile information
  const handleEdit = () => {
    alert("Edit functionality will be implemented later");
  };

  // Handle removing a connection
  const handleRemoveConnection = (connectionId) => {
    setConnections(connections.filter(conn => conn.id !== connectionId));
  };

  return (
    <div className="min-h-screen bg-white"> {/* 60% white */}
      {/* Using the updated Navbar component */}
      <Navbar />
      
      {/* Main Content - Add appropriate top padding to account for navbar */}
      <div className="container mx-auto pt-16 px-4 pb-12">
        {/* Profile Header Banner */}
        <div className="relative">
          {/* Banner Image - Secondary color (30%) */}
          <div className="w-full h-48 bg-[#4F6F52] rounded-t-lg"></div>
          
          {/* Profile Image */}
          <div className="absolute left-8 bottom-0 transform translate-y-1/2">
            <div className="w-32 h-32 rounded-full bg-white border-4 border-white overflow-hidden flex items-center justify-center">
              <span className="text-[#313131] text-5xl font-bold">
                {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Profile Info Bar - White background (60%) */}
        <div className="bg-white shadow-md rounded-b-lg pt-20 pb-4 px-8 mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">ID: {userData.userId}</p>
            <h1 className="text-2xl font-bold text-[#313131]">
              {userData.firstName} {userData.lastName}
            </h1>
          </div>
          
          {/* View Tree Button - Accent color (10%) */}
          <button className="mt-4 md:mt-0 px-4 py-2 bg-[#313131] text-white rounded hover:bg-opacity-90 transition-colors inline-flex items-center">
            View Tree
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button 
            className={`py-3 px-6 font-medium ${activeTab === "details" 
              ? "text-[#313131] border-b-2 border-[#313131]" /* 10% accent color */ 
              : "text-[#4F6F52] hover:text-[#313131]"}`} /* 30% color */
            onClick={() => setActiveTab("details")}
          >
            Personal Details
          </button>
          
          <button 
            className={`py-3 px-6 font-medium ${activeTab === "connections" 
              ? "text-[#313131] border-b-2 border-[#313131]" /* 10% accent color */
              : "text-[#4F6F52] hover:text-[#313131]"}`} /* 30% color */
            onClick={() => setActiveTab("connections")}
          >
            Connections
          </button>
        </div>
        
        {/* Content Area */}
        {activeTab === "details" ? (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar - Secondary color with transparency */}
            <div className="md:w-1/4 bg-[rgba(79,111,82,0.1)] rounded-lg overflow-hidden">
              <ul>
                <li>
                  <button 
                    onClick={() => setActiveSection("general")} 
                    className={`w-full text-left px-4 py-3 flex items-center gap-2 ${
                      activeSection === "general" 
                        ? "bg-[#4F6F52] text-white" 
                        : "text-[#313131] hover:bg-[rgba(79,111,82,0.2)]"
                    }`}
                  >
                    <User size={18} />
                    <span>General Information</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveSection("addresses")} 
                    className={`w-full text-left px-4 py-3 flex items-center gap-2 ${
                      activeSection === "addresses" 
                        ? "bg-[#4F6F52] text-white" 
                        : "text-[#313131] hover:bg-[rgba(79,111,82,0.2)]"
                    }`}
                  >
                    <MapPin size={18} />
                    <span>Addresses</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveSection("contact")} 
                    className={`w-full text-left px-4 py-3 flex items-center gap-2 ${
                      activeSection === "contact" 
                        ? "bg-[#4F6F52] text-white" 
                        : "text-[#313131] hover:bg-[rgba(79,111,82,0.2)]"
                    }`}
                  >
                    <Phone size={18} />
                    <span>Contact Information</span>
                  </button>
                </li>
              </ul>
            </div>
            
            {/* Main Content - White background (60%) */}
            <div className="flex-1 bg-white border border-[#4F6F52] rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#313131]">
                  {activeSection === "general" && "General Information"}
                  {activeSection === "addresses" && "Addresses"}
                  {activeSection === "vital" && "Vital Information"}
                  {activeSection === "interests" && "Personal Interests"}
                  {activeSection === "contact" && "Contact Information"}
                </h2>
                
                {/* Edit button - Secondary color (30%) */}
                <button 
                  onClick={handleEdit}
                  className="p-2 text-[#4F6F52] hover:bg-[rgba(79,111,82,0.1)] rounded-full"
                >
                  <Edit size={20} />
                </button>
              </div>
              
              {/* Content based on selected section */}
              {activeSection === "general" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                    <div className="text-right font-medium text-[#4F6F52]">First Name:</div>
                    <div className="text-[#313131]">{userData.firstName}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                    <div className="text-right font-medium text-[#4F6F52]">Middle Name:</div>
                    <div className="text-[#313131]">{userData.middleName}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                    <div className="text-right font-medium text-[#4F6F52]">Last Name:</div>
                    <div className="text-[#313131]">{userData.lastName}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                    <div className="text-right font-medium text-[#4F6F52]">Suffix:</div>
                    <div className="text-[#313131]">{userData.suffix}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                    <div className="text-right font-medium text-[#4F6F52]">Birth Date:</div>
                    <div className="text-[#313131]">{userData.birthDate}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                    <div className="text-right font-medium text-[#4F6F52]">Death Date:</div>
                    <div className="text-[#313131]">{userData.deathDate}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                    <div className="text-right font-medium text-[#4F6F52]">Birth Place:</div>
                    <div className="text-[#313131]">{userData.birthPlace}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                    <div className="text-right font-medium text-[#4F6F52]">Birthing Center:</div>
                    <div className="text-[#313131]">{userData.birthingCenter}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                    <div className="text-right font-medium text-[#4F6F52]">Nationality:</div>
                    <div className="text-[#313131]">{userData.nationality || "—"}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-right font-medium text-[#4F6F52]">Civil Status:</div>
                    <div className="text-[#313131]">{userData.civilStatus}</div>
                  </div>
                </div>
              )}
              
              {activeSection === "addresses" && (
                <div className="space-y-6">
                  {/* Current Address */}
                  <div>
                    <h3 className="text-lg font-medium text-[#313131] mb-3 pb-2 border-b border-gray-100">
                      Current Address
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                        <div className="text-right font-medium text-[#4F6F52]">Street Address:</div>
                        <div className="text-[#313131]">{userData.address.street || "—"}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                        <div className="text-right font-medium text-[#4F6F52]">City:</div>
                        <div className="text-[#313131]">{userData.address.city || "—"}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                        <div className="text-right font-medium text-[#4F6F52]">Province/State:</div>
                        <div className="text-[#313131]">{userData.address.province || "—"}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                        <div className="text-right font-medium text-[#4F6F52]">Country:</div>
                        <div className="text-[#313131]">{userData.address.country || "—"}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-right font-medium text-[#4F6F52]">Postal/ZIP Code:</div>
                        <div className="text-[#313131]">{userData.address.zipCode || "—"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
             
              
              {activeSection === "contact" && (
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-medium text-[#313131] mb-3 pb-2 border-b border-gray-100">
                      Contact Information
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                        <div className="text-right font-medium text-[#4F6F52]">Mobile Phone:</div>
                        <div className="text-[#313131]">{userData.contact.mobilePhone || "—"}</div>
                      </div>
                            
                      <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                        <div className="text-right font-medium text-[#4F6F52]">Telephone:</div>
                        <div className="text-[#313131]">{userData.contact.telephone || "—"}</div>
                      </div>
                            
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-right font-medium text-[#4F6F52]">Email Address:</div>
                        <div className="text-[#313131]">{userData.contact.email || "—"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Connections Tab */
          <div className="bg-white border border-[#4F6F52] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#313131] mb-6">Connections</h2>
            
            {connections.length === 0 ? (
              <p className="text-gray-500 italic py-4">No connections found.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {connections.map((connection) => (
                  <div key={connection.id} className="flex items-center justify-between py-4">
                    <div className="flex items-center">
                      {/* Connection Avatar */}
                      <div className="w-10 h-10 rounded-full bg-[rgba(79,111,82,0.1)] text-[#313131] flex items-center justify-center mr-4">
                        <span className="font-bold">{connection.name.charAt(0)}</span>
                      </div>
                      <span className="text-[#313131] font-medium">{connection.name}</span>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button className="px-4 py-2 bg-[#4F6F52] text-white text-sm rounded hover:bg-opacity-90">
                        View Tree
                      </button>
                      {/* Added trash icon button */}
                      <button 
                        onClick={() => handleRemoveConnection(connection.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove Connection"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add Connection Button */}
            <div className="mt-6">
              <button className="px-5 py-2 bg-[#313131] text-white rounded hover:bg-opacity-90 transition-colors">
                Add Connection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  return (
    <AuthController mode="PROTECT">
      <ProfilePage />
    </AuthController>
  );
}