import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  BsCloud, BsCloudCheck, BsCloudArrowUp, BsChevronDown,
  BsFolder2, BsPencil, BsCheck2
} from "react-icons/bs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        className="text-lg font-bold bg-gradient-to-r from-[#2563EB] to-purple-600 bg-clip-text text-transparent"
      >
        tsarr.in
      </Link>

      <span className="text-gray-300">|</span>

      {/* Project name */}
      <div className="flex items-center gap-2">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
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
              className="px-2 py-1 text-sm font-medium border border-[#2563EB]/30 rounded focus:outline-none focus:ring-2 focus:ring-[#2563EB] w-40 h-8"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSubmit}
              className="h-7 w-7"
            >
              <BsCheck2 className="text-green-600" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-2 py-1 h-auto rounded-[10px] group"
          >
            <span className="font-medium text-[#0A0A0A] text-sm max-w-[150px] truncate">
              {projectName}
            </span>
            <BsPencil className="text-[#4B5563] text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        )}
      </div>

      {/* Save status */}
      <div className="flex items-center gap-2 ml-2">
        {isSaving ? (
          <div className="flex items-center gap-1.5 text-[#4B5563] text-xs">
            <BsCloudArrowUp className="animate-pulse" />
            <span>Saving...</span>
          </div>
        ) : hasUnsavedChanges ? (
          <Button
            variant="ghost"
            onClick={onSave}
            className="flex items-center gap-1.5 text-amber-600 text-xs hover:bg-amber-50 px-2 py-1 h-auto rounded"
          >
            <BsCloud />
            <span>Unsaved</span>
          </Button>
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
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#4B5563] hover:text-[#0A0A0A] hover:bg-[#F9FAFB] rounded-[10px] transition-colors ml-auto"
      >
        <BsFolder2 />
        <span className="hidden sm:inline">My Projects</span>
      </Link>
    </div>
  );
};

export default ProjectHeader;
