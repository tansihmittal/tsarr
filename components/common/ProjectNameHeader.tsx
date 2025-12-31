import { useState, useRef, useEffect } from "react";
import { BsPencil, BsCheck, BsX } from "react-icons/bs";

interface ProjectNameHeaderProps {
  name: string;
  onNameChange: (name: string) => void;
  isSaving?: boolean;
}

const ProjectNameHeader: React.FC<ProjectNameHeaderProps> = ({
  name,
  onNameChange,
  isSaving = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(name);
  }, [name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed) {
      onNameChange(trimmed);
    } else {
      setEditValue(name);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="px-3 py-1.5 text-lg font-semibold bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Project name"
          />
          <button
            onClick={handleSave}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <BsCheck className="text-xl" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <BsX className="text-xl" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <h2 className="text-lg font-semibold text-gray-800">{name}</h2>
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          >
            <BsPencil className="text-sm" />
          </button>
          {isSaving && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Saving...
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectNameHeader;
