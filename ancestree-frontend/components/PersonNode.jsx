// components/PersonNode.jsx
import { useState } from "react";
import { Handle } from "reactflow";
import { User, MoreHorizontal, Plus, Edit3 } from "lucide-react";

export default function PersonNode({ data }) {
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  const toggleActionMenu = () => setActionMenuOpen((prev) => !prev);

  return (
    <div className="relative w-48 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Handle for connections (optional, customize as needed) */}
      <Handle type="target" position="top" className="w-2 h-2 bg-blue-500" />
      <Handle type="source" position="bottom" className="w-2 h-2 bg-blue-500" />

      {/* Three dots button */}
      <button
        onClick={toggleActionMenu}
        className={`absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded transition-colors ${actionMenuOpen ? "bg-gray-200" : "hover:bg-gray-100"}`}
      >
        <MoreHorizontal className="w-4 h-4 text-gray-600" />
      </button>

      {/* User content */}
      <div className="flex flex-col items-center text-center">
        <div className="w-13 h-13 bg-gray-300 rounded-full flex items-center justify-center mb-3">
          <User className="w-7 h-7 text-gray-500" />
        </div>
        <h3 className="text-sm font-medium text-gray-800">
          {data.firstName} {data.lastName}
        </h3>
      </div>

      {/* Action Buttons - Only show when actionMenuOpen is true */}
      {actionMenuOpen && (
        <div className="absolute -right-12 top-4 flex flex-col space-y-2 z-20 action-buttons">
          <button
            onClick={() => {
              data.openSidebar(data.personId);
            }}
            className="w-8 h-8 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
          <button className="w-8 h-8 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <User className="w-4 h-4 text-gray-600" />
          </button>
          <button className="w-8 h-8 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <Edit3 className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}
