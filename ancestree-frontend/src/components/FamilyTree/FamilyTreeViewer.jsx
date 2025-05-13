import { useState } from 'react';
import { FaUser, FaPlus, FaPen, FaSearch, FaTrash } from 'react-icons/fa';

const FamilyTreeViewer = ({ 
  familyMembers, 
  onSelectMember,
  onDeleteMember
}) => {
  const [hoveredMember, setHoveredMember] = useState(null);
  
  // For simplicity, we'll just display the first member in this demo
  // In a real implementation, you would use a tree visualization library like d3.js
  const rootMember = familyMembers[0];

  if (!rootMember) {
    return <div className="text-center">No family members to display</div>;
  }

  const getFullName = (member) => {
    return `${member.firstName} ${member.middleName ? member.middleName + ' ' : ''}${member.lastName}`;
  };

  const getLifeSpan = (member) => {
    const birthYear = member.birthDate ? new Date(member.birthDate).getFullYear() : '?';
    const deathYear = member.status === 'Deceased' && member.dateOfDeath 
      ? new Date(member.dateOfDeath).getFullYear() 
      : member.status === 'Alive' ? 'Present' : '?';
    return `${birthYear} - ${deathYear}`;
  };

  return (
    <div className="text-center p-8 bg-secondary-light rounded-lg inline-flex flex-col items-center">
      {familyMembers.map((member, index) => (
        <div 
          key={member.id}
          className="relative mb-4"
          style={{ top: index * 30, left: index * 20 }}
          onMouseEnter={() => setHoveredMember(member)}
          onMouseLeave={() => setHoveredMember(null)}
        >
          <div className="w-24 h-24 mb-2 relative mx-auto">
            <div 
              className="absolute inset-0 rounded-lg border border-gray-300 flex flex-col items-center justify-center p-2 bg-white"
              onClick={() => onSelectMember(member)}
            >
              <FaUser className="text-primary text-2xl mb-1" />
              <div className="text-xs text-gray-700 truncate w-full text-center">
                {getFullName(member)}
              </div>
            </div>
            
            {/* Tree Controls */}
            <div className="absolute -right-1 -top-1 flex flex-col">
              <button 
                className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs mb-1"
                onClick={(e) => {
                  e.stopPropagation();
                  // Here you would handle adding a related person
                }}
              >
                <FaPlus />
              </button>
              <button 
                className="w-5 h-5 bg-white border border-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMember(member);
                }}
              >
                <FaPen />
              </button>
            </div>
          </div>
          
          {/* Hover info card */}
          {hoveredMember && hoveredMember.id === member.id && (
            <div className="absolute left-[80px] top-[10px] w-48 bg-white shadow-lg rounded-md p-3 border border-gray-200 text-left z-10">
              <div className="text-sm font-medium text-gray-900 mb-1">{getFullName(member)}</div>
              <div className="text-xs text-gray-500 mb-2">{getLifeSpan(member)}</div>
              <div className="flex justify-between text-xs">
                <button 
                  className="text-primary hover:text-primary-dark"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMember(member);
                  }}
                >
                  <FaSearch className="inline mr-1" /> View
                </button>
                <button 
                  className="text-gray-600 hover:text-gray-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMember(member);
                  }}
                >
                  <FaPen className="inline mr-1" /> Edit
                </button>
                <button 
                  className="text-gray-600 hover:text-gray-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteMember(member.id);
                  }}
                >
                  <FaTrash className="inline mr-1" /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FamilyTreeViewer;