import React, { ReactNode } from "react";
import { useEditorContext } from "@/context/Editor";

interface Props {
  children: ReactNode;
  frame: string;
}

const FrameWrapper: React.FC<Props> = ({ children, frame }) => {
  const { frameTitle, frameUrl, updateData } = useEditorContext();

  if (frame === "none") return <>{children}</>;

  if (frame === "macOsLight" || frame === "macOsDark") {
    const isDark = frame === "macOsDark";
    return (
      <div
        className={`flex flex-col rounded-lg overflow-hidden border ${isDark ? "border-gray-700 shadow-2xl" : "border-gray-200 shadow-xl"}`}
      >
        <div
          className={`flex items-center gap-2 px-4 py-2 ${isDark ? "bg-[#2D2D2D]" : "bg-[#F6F6F6]"}`}
        >
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
          </div>
          <input
            type="text"
            value={frameTitle}
            onChange={(e) => updateData && updateData("frameTitle", e.target.value)}
            className={`flex-1 text-center text-xs bg-transparent border-none outline-none ${isDark ? "text-gray-400" : "text-gray-600"}`}
            placeholder="Title"
          />
        </div>
        <div className="overflow-hidden bg-white">{children}</div>
      </div>
    );
  }

  if (frame === "browserLight" || frame === "browserDark") {
    const isDark = frame === "browserDark";
    return (
      <div
        className={`flex flex-col rounded-lg overflow-hidden border ${isDark ? "border-gray-700 shadow-2xl" : "border-gray-200 shadow-xl"}`}
      >
        <div
          className={`flex items-center gap-2 px-4 py-3 ${isDark ? "bg-[#202124]" : "bg-[#F1F3F4]"}`}
        >
          <div className="flex gap-1.5 mr-4">
            <div className={`w-3 h-3 rounded-full ${isDark ? "bg-gray-600" : "bg-gray-300"}`} />
            <div className={`w-3 h-3 rounded-full ${isDark ? "bg-gray-600" : "bg-gray-300"}`} />
            <div className={`w-3 h-3 rounded-full ${isDark ? "bg-gray-600" : "bg-gray-300"}`} />
          </div>
          <input
            type="text"
            value={frameUrl}
            onChange={(e) => updateData && updateData("frameUrl", e.target.value)}
            className={`flex-1 h-6 rounded px-3 text-[10px] bg-transparent border-none outline-none ${isDark ? "bg-[#35363A] text-gray-400" : "bg-white text-gray-500"}`}
            style={{ backgroundColor: isDark ? "#35363A" : "white" }}
            placeholder="https://example.com"
          />
        </div>
        <div className="overflow-hidden bg-white">{children}</div>
      </div>
    );
  }

  if (frame === "windowsLight" || frame === "windowsDark") {
    const isDark = frame === "windowsDark";
    return (
      <div
        className={`flex flex-col rounded shadow-2xl border ${isDark ? "border-[#333] shadow-black/50" : "border-[#ccc] shadow-black/20"}`}
      >
        <div
          className={`flex items-center justify-between px-3 py-1.5 ${isDark ? "bg-[#1c1c1c]" : "bg-white"}`}
        >
          <input
            type="text"
            value={frameTitle}
            onChange={(e) => updateData && updateData("frameTitle", e.target.value)}
            className={`text-[11px] bg-transparent border-none outline-none ${isDark ? "text-gray-400" : "text-gray-600"}`}
            placeholder="Window Title"
          />
          <div className="flex gap-4 items-center">
            <div className={`w-3 h-[1px] ${isDark ? "bg-white" : "bg-black"}`} />
            <div className={`w-3 h-3 border ${isDark ? "border-white" : "border-black"}`} />
            <div className="relative w-3 h-3 group">
              <div
                className={`absolute top-1/2 left-0 w-full h-[1px] rotate-45 ${isDark ? "bg-white" : "bg-black"}`}
              />
              <div
                className={`absolute top-1/2 left-0 w-full h-[1px] -rotate-45 ${isDark ? "bg-white" : "bg-black"}`}
              />
            </div>
          </div>
        </div>
        <div className="overflow-hidden bg-white">{children}</div>
      </div>
    );
  }

  return <>{children}</>;
};

export default FrameWrapper;
