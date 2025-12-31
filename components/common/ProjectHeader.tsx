import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  BsCloud, BsCloudCheck, BsCloudArrowUp, BsChevronDown,
  BsFolder2, BsPencil, BsCheck2
} from "react-icons/bs";

interface ProjectHeaderProps {
  projectName: string;
  onNameChange: (name: string) => void;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  onSave: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  projectName,
  onNameChange,
  isSaving,
  lastSaved,
  hasUnsavedChanges,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(projectName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditName(projectName);
  }, [projectName]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSubmit = () => {
    if (editName.trim()) {
      onNameChange(editName.trim());
    } else {
      setEditName(projectName);
    }
    setIsEditing(false);
  };

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex items-center gap-3">
      {/* Logo */}
      <Link
        href="/app"
        className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
      >
        tsarr.in
      </Link>

      <span className="text-gray-300">|</span>

      {/* Project name */}
      <div className="flex items-center gap-2">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
                if (e.key === "Escape") {
                  setEditName(projectName);
                  setIsEditing(false);
                }
              }}
              className="px-2 py-1 text-sm font-medium border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40"
            />
            <button
              onClick={handleSubmit}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <BsCheck2 className="text-green-600" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors group"
          >
            <span className="font-medium text-gray-900 text-sm max-w-[150px] truncate">
              {projectName}
            </span>
            <BsPencil className="text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>

      {/* Save status */}
      <div className="flex items-center gap-2 ml-2">
        {isSaving ? (
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <BsCloudArrowUp className="animate-pulse" />
            <span>Saving...</span>
          </div>
        ) : hasUnsavedChanges ? (
          <button
            onClick={onSave}
            className="flex items-center gap-1.5 text-amber-600 text-xs hover:bg-amber-50 px-2 py-1 rounded transition-colors"
          >
            <BsCloud />
            <span>Unsaved</span>
          </button>
        ) : lastSaved ? (
          <div className="flex items-center gap-1.5 text-green-600 text-xs">
            <BsCloudCheck />
            <span>{formatLastSaved()}</span>
          </div>
        ) : null}
      </div>

      {/* Projects link */}
      <Link
        href="/projects"
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
      >
        <BsFolder2 />
        <span className="hidden sm:inline">My Projects</span>
      </Link>
    </div>
  );
};

export default ProjectHeader;
