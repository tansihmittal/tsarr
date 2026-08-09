import { useCallback, useEffect, useRef, useState } from "react";
import { IMAGE_ACCEPT } from "@/utils/imageFile";
import { AppIconGeneratorState } from "./types";
import { TfiExport } from "react-icons/tfi";
import { BsClipboard, BsUpload, BsRepeat, BsStars } from "react-icons/bs";
import { BiReset } from "react-icons/bi";
import { toast } from "react-hot-toast";
import ToolbarButton from "../common/ToolbarButton";
import { Button } from "@/components/ui/button";

interface Props {
  state: AppIconGeneratorState;
  onImageUpload: (file: File) => void;
  onReset: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const PREVIEW_SIZE = 320;

const AppIconGeneratorPreview: React.FC<Props> = ({ state, onImageUpload, onReset, onGenerate, isGenerating }) => {
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name))) onImageUpload(file);
    },
    [onImageUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageUpload(file);
  };

  const handlePaste = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], "pasted-image.png", { type: imageType });
          onImageUpload(file);
          toast.success("Image pasted from clipboard!");
          return;
        }
      }
      toast.error("No image found in clipboard");
    } catch {
      toast.error("Failed to paste from clipboard");
    }
  }, [onImageUpload]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "v") handlePaste();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePaste]);

  // Draw the live square preview: background fill -> padding inset -> cover-fit crop.
  useEffect(() => {
    if (!state.image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = PREVIEW_SIZE;
      canvas.height = PREVIEW_SIZE;
      ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
      ctx.fillStyle = state.backgroundColor;
      ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

      const inset = (state.padding / 100) * PREVIEW_SIZE;
      const drawSize = PREVIEW_SIZE - inset * 2;
      const srcSize = Math.min(img.width, img.height);
      const sx = (img.width - srcSize) / 2;
      const sy = (img.height - srcSize) / 2;
      ctx.drawImage(img, sx, sy, srcSize, srcSize, inset, inset, drawSize, drawSize);
    };
    img.src = state.image;
  }, [state.image, state.backgroundColor, state.padding]);

  if (!state.image) {
    return (
      <div className="flex items-center justify-start flex-col h-full w-full">
        <div className="flex flex-wrap gap-2 w-full mb-3 justify-end opacity-80" style={{ pointerEvents: "none" }}>
          <ToolbarButton title="Download ZIP" disabled>
            <TfiExport />
          </ToolbarButton>
          <ToolbarButton title="Reset" disabled>
            <BiReset />
          </ToolbarButton>
        </div>
        <div className="relative w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] flex items-center justify-center rounded-[20px] bg-[#EFF6FF] dark:bg-blue-900/20 border border-[#E5E7EB] dark:border-gray-700 overflow-hidden">
          <div
            className={`p-6 sm:p-8 bg-white dark:bg-gray-900 relative z-20 rounded-[20px] shadow-xl shadow-black/5 animate-fade-in-scale ${
              isDragging ? "ring-2 ring-[#2563EB]" : ""
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex gap-1 flex-col mb-6">
              <div className="flex items-start gap-4 sm:gap-6">
                <h2 className="font-bold text-2xl text-[#0A0A0A] dark:text-white">App Icon Generator</h2>
                <BsStars className="text-xl text-[#2563EB] animate-pulse-soft" />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Upload one image, export a full icon set for iOS, Android, Web, and macOS
              </span>
            </div>
            <label
              className={`flex flex-col items-center justify-center gap-3 aspect-[2/1] p-8 border-2 rounded-[20px] border-dashed transition-all duration-300 cursor-pointer ${
                isDragging ? "border-[#2563EB] bg-[#2563EB]/5 scale-[1.02]" : "border-gray-300 hover:border-[#2563EB]/50 hover:bg-[#2563EB]/5"
              }`}
            >
              <div className={`p-4 rounded-full bg-[#2563EB]/10 transition-transform duration-300 ${isDragging ? "scale-110" : ""}`}>
                <BsUpload className="text-[#2563EB] text-2xl" />
              </div>
              <input type="file" hidden accept={IMAGE_ACCEPT} onChange={handleFileInput} />
              <h3 className="text-gray-700 dark:text-gray-200 font-medium">
                <span className="text-[#2563EB] hover:underline">Click to upload</span> or drag and drop
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <BsClipboard className="text-xs" />
                <span>
                  or press{" "}
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">Ctrl+V</kbd> to paste
                </span>
              </div>
              <span className="text-xs text-gray-400">A square image (at least 1024×1024) works best</span>
            </label>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <label className="cursor-pointer">
                <input type="file" hidden accept={IMAGE_ACCEPT} onChange={handleFileInput} />
                <Button className="rounded-[14px] font-semibold w-full shadow-lg shadow-[#2563EB]/20 pointer-events-none">
                  {isDragging ? "DROP TO UPLOAD" : "START GENERATING"}
                </Button>
              </label>
              <Button variant="secondary" onClick={handlePaste} className="rounded-[14px] font-semibold w-full gap-2">
                <BsClipboard className="text-lg" />
                PASTE IMAGE
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-start flex-col h-full w-full">
      <div className="flex flex-wrap gap-2 w-full mb-3 justify-end">
        <ToolbarButton title="Download ZIP" onTap={onGenerate} disabled={isGenerating}>
          <TfiExport />
        </ToolbarButton>
        <label htmlFor="app-icon-change-image">
          <input type="file" hidden accept={IMAGE_ACCEPT} id="app-icon-change-image" onChange={handleFileInput} />
          <ToolbarButton title="Change Image">
            <BsRepeat />
          </ToolbarButton>
        </label>
        <ToolbarButton title="Reset" onTap={onReset}>
          <BiReset />
        </ToolbarButton>
      </div>
      <div className="flex justify-end mb-2 w-full">
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-[#F9FAFB] dark:bg-gray-800 px-3 py-1 rounded-full">
          {state.imageWidth} × {state.imageHeight} px source
        </span>
      </div>
      <div
        className={`relative w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] flex items-center justify-center rounded-[20px] bg-[#EFF6FF] dark:bg-blue-900/20 border ${
          isDragging ? "border-[#2563EB] border-dashed bg-[#2563EB]/5" : "border-[#E5E7EB] dark:border-gray-700"
        } overflow-hidden`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="relative flex items-center justify-center p-4">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[550px] shadow-2xl shadow-black/10"
            style={{ borderRadius: state.roundedPreview ? "22%" : "0" }}
          />
        </div>
      </div>
    </div>
  );
};

export default AppIconGeneratorPreview;
