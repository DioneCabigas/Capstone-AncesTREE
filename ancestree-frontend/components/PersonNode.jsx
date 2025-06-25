import { useState } from "react";
import { Handle, Position } from "reactflow";
import { User, MoreHorizontal, Plus, Edit3, Trash2, Venus, Mars } from "lucide-react";

export default function PersonNode({ data }) {
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  const toggleActionMenu = (event) => {
    event.stopPropagation();
    setActionMenuOpen((prev) => !prev);
  };

  const getGenderIcon = (gender) => {
    switch (gender && gender.toLowerCase()) {
      case "male":
        return <Mars className="w-7 h-7 text-blue-500" />;
      case "female":
        return <Venus className="w-7 h-7 text-pink-500" />;
      default:
        return <User className="w-7 h-7 text-gray-500" />;
    }
  };

  const getGenderBackgroundColor = (gender) => {
    switch (gender && gender.toLowerCase()) {
      case "male":
        return "bg-blue-200";
      case "female":
        return "bg-pink-200";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <div className="relative w-36 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <Handle type="target" position="top" className="w-2 h-2 bg-blue-500" />
      <Handle type="source" position="bottom" className="w-2 h-2 bg-blue-500" />
      {/* <Handle type="target" position="left" id="left" className="w-2 h-2 bg-blue-500" />
      <Handle type="source" position="right" id="right" className="w-2 h-2 bg-blue-500" /> */}

      {/* Three dots button */}
      <button
        onClick={toggleActionMenu}
        className={`absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded transition-colors ${actionMenuOpen ? "bg-gray-200" : "hover:bg-gray-100"}`}
      >
        <MoreHorizontal className="w-4 h-4 text-gray-600" />
      </button>

      {/* User content */}
      <div className="flex flex-col items-center text-center">
        <div className={`w-13 h-13 rounded-full flex items-center justify-center mb-3 ${getGenderBackgroundColor(data.gender)}`}>{getGenderIcon(data.gender)}</div>
        <h3 className="text-sm font-medium text-gray-800">
          {data.firstName} {data.lastName}
        </h3>
      </div>

      {/* Action Buttons */}
      {actionMenuOpen && (
        <div className="absolute -right-12 top-4 flex flex-col space-y-2 z-20 action-buttons">
          {/* Add Member button */}
          <button
            onClick={() => {
              data.openSidebar(data.personId);
              setActionMenuOpen(false);
            }}
            className="w-8 h-8 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>

          {/* View Person button */}
          <button
            onClick={() => {
              data.handleViewPerson(data);
              setActionMenuOpen(false);
            }}
            className="w-8 h-8 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <User className="w-4 h-4 text-gray-600" />
          </button>

          {/* Edit Person button */}
          <button
            onClick={() => {
              data.handleEditPerson(data);
              setActionMenuOpen(false);
            }}
            className="w-8 h-8 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Edit3 className="w-4 h-4 text-gray-600" />
          </button>

          {/* Delete Person button */}
          <button
            onClick={() => {
              data.handleDeletePerson(data.personId);
              setActionMenuOpen(false);
            }}
            className="w-8 h-8 bg-red-500 rounded-full shadow-sm border border-red-600 flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Delete person"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
