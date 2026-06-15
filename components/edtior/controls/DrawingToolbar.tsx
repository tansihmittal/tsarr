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
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

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
    <div className="bg-white border-2 border-[#E5E7EB] rounded-[10px] p-2 mb-3">
      {/* Tools row */}
      <div className="flex items-center justify-center gap-1 mb-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setCurrentTool(tool.id)}
            className={`p-2.5 rounded-md transition-all ${
              currentTool === tool.id
                ? "bg-[#2563EB] text-white shadow-md"
                : "bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#0A0A0A]"
            }`}
            title={tool.title}
          >
            {tool.icon}
          </button>
        ))}
        <div className="w-px h-6 bg-[#E5E7EB] mx-1" />
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
          <span className="text-xs text-[#0A0A0A]">Color:</span>
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border-0 p-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#0A0A0A]">Size:</span>
          <Slider
            min={1}
            max={10}
            value={[strokeWidth]}
            onValueChange={([v]) => setStrokeWidth(v)}
            className="w-16"
          />
          <span className="text-xs text-[#0A0A0A] w-4">{strokeWidth}</span>
        </div>
      </div>
    </div>
  );
};

export default DrawingToolbar;
