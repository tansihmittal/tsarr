import React from "react";
import { useEditorContext } from "@/context/Editor";
import {
  BsCursor,
  BsPencil,
  BsSlash,
  BsArrowUpRight,
  BsSquare,
  BsCircle,
  BsTrash,
} from "react-icons/bs";
import { BiText } from "react-icons/bi";

type Tool = "select" | "pen" | "line" | "arrow" | "rectangle" | "ellipse" | "text";

interface DrawingToolbarProps {
  currentTool: Tool;
  setCurrentTool: (tool: Tool) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  onClear: () => void;
}

const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  currentTool,
  setCurrentTool,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  onClear,
}) => {
  const tools: { id: Tool; icon: React.ReactNode; title: string }[] = [
    { id: "select", icon: <BsCursor />, title: "Select" },
    { id: "pen", icon: <BsPencil />, title: "Pen" },
    { id: "line", icon: <BsSlash />, title: "Line" },
    { id: "arrow", icon: <BsArrowUpRight />, title: "Arrow" },
    { id: "rectangle", icon: <BsSquare />, title: "Rectangle" },
    { id: "ellipse", icon: <BsCircle />, title: "Ellipse" },
  ];

  return (
    <div className="bg-base-100 border-2 border-base-200 rounded-lg p-2 mb-3">
      {/* Tools row */}
      <div className="flex items-center justify-center gap-1 mb-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setCurrentTool(tool.id)}
            className={`p-2.5 rounded-md transition-all ${
              currentTool === tool.id
                ? "bg-primary text-white shadow-md"
                : "bg-base-200 hover:bg-base-300 text-primary-content"
            }`}
            title={tool.title}
          >
            {tool.icon}
          </button>
        ))}
        <div className="w-px h-6 bg-base-300 mx-1" />
        <button
          onClick={onClear}
          className="p-2.5 rounded-md bg-red-100 hover:bg-red-200 text-red-600 transition-all"
          title="Clear All"
        >
          <BsTrash />
        </button>
      </div>

      {/* Color and width row */}
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-primary-content">Color:</span>
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border-0 p-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-primary-content">Size:</span>
          <input
            type="range"
            min="1"
            max="10"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="range range-xs w-16"
          />
          <span className="text-xs text-primary-content w-4">{strokeWidth}</span>
        </div>
      </div>
    </div>
  );
};

export default DrawingToolbar;
