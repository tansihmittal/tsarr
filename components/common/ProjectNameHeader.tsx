import { useState, useRef, useEffect } from "react";
import { BsPencil, BsCheck, BsX } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
          <Input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="px-3 py-1.5 text-lg font-semibold bg-white border border-[#E5E7EB] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent h-auto"
            placeholder="Project name"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSave}
            className="h-8 w-8 text-green-600 hover:bg-green-50 rounded-[10px]"
          >
            <BsCheck className="text-xl" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCancel}
            className="h-8 w-8 text-[#4B5563] hover:bg-[#F9FAFB] rounded-[10px]"
          >
            <BsX className="text-xl" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <h2 className="text-lg font-semibold text-[#0A0A0A]">{name}</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 text-[#4B5563]/60 hover:text-[#4B5563] hover:bg-[#F9FAFB] rounded-[10px] transition-all opacity-0 group-hover:opacity-100"
          >
            <BsPencil className="text-sm" />
          </Button>
          {isSaving && (
            <span className="text-xs text-[#4B5563] flex items-center gap-1">
              <div className="w-2 h-2 bg-[#2563EB] rounded-full animate-pulse" />
              Saving...
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectNameHeader;
