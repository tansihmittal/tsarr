import { RefObject, useEffect, useCallback, useState } from "react";
import { IMAGE_ACCEPT } from "@/utils/imageFile";
import { ImageResizerState } from "./ImageResizerLayout";
import { TfiExport } from "react-icons/tfi";
import { BsClipboard, BsUpload, BsRepeat, BsStars } from "react-icons/bs";
import { BiReset } from "react-icons/bi";
import { toast } from "react-hot-toast";
import ToolbarButton from "../common/ToolbarButton";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface Props {
  state: ImageResizerState;
  canvasRef: RefObject<HTMLCanvasElement>;
  onExport: () => void;
  onCopy: () => void;
  onImageUpload: (file: File) => void;
  getOutputDimensions: () => { width: number; height: number };
}

const ImageResizerPreview: React.FC<Props> = ({ state, canvasRef, onExport, onCopy, onImageUpload, getOutputDimensions }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleReset = () => {
    const confirmation = confirm("Confirm Reset - All your changes will be lost!");
    if (confirmation) window.location.reload();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name))) onImageUpload(file);
  }, [onImageUpload]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageUpload(file);
  };

  const handlePaste = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith("image/"));
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

  // Draw canvas
  useEffect(() => {
    if (!state.originalImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const dims = getOutputDimensions();
      canvas.width = dims.width;
      canvas.height = dims.height;
      ctx.clearRect(0, 0, dims.width, dims.height);
      ctx.drawImage(img, 0, 0, dims.width, dims.height);
    };
    img.src = state.originalImage;
  }, [state, canvasRef, getOutputDimensions]);

  if (!state.originalImage) {
    return (
      <div className="flex items-center justify-start flex-col h-full w-full">
        <div className="flex flex-wrap gap-2 w-full mb-3 justify-end opacity-80" style={{ pointerEvents: "none" }}>
          <ToolbarButton title="Export Image" disabled><TfiExport /></ToolbarButton>
          <ToolbarButton title="Copy" disabled><BsClipboard /></ToolbarButton>
          <ToolbarButton title="Reset Image" disabled><BsRepeat /></ToolbarButton>
          <ToolbarButton title="Reset Canvas" disabled><BiReset /></ToolbarButton>
        </div>
        <div className="relative w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] flex items-center justify-center rounded-[20px] bg-[#EFF6FF] border border-[#E5E7EB] overflow-hidden">
          <div className={`p-6 sm:p-8 bg-white relative z-20 rounded-[20px] shadow-xl shadow-black/5 animate-fade-in-scale ${isDragging ? "ring-2 ring-[#2563EB]" : ""}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
            <div className="flex gap-1 flex-col mb-6">
              <div className="flex items-start gap-4 sm:gap-6">
                <h2 className="font-bold text-2xl text-[#0A0A0A]">Resize Image</h2>
                <BsStars className="text-xl text-[#2563EB] animate-pulse-soft" />
              </div>
              <span className="text-sm text-gray-500 mt-1">Resize images to exact dimensions or by percentage</span>
            </div>
            <label className={`flex flex-col items-center justify-center gap-3 aspect-[2/1] p-8 border-2 rounded-[20px] border-dashed transition-all duration-300 cursor-pointer ${isDragging ? "border-[#2563EB] bg-[#2563EB]/5 scale-[1.02]" : "border-gray-300 hover:border-[#2563EB]/50 hover:bg-[#2563EB]/5"}`}>
              <div className={`p-4 rounded-full bg-[#2563EB]/10 transition-transform duration-300 ${isDragging ? "scale-110" : ""}`}><BsUpload className="text-[#2563EB] text-2xl" /></div>
              <input type="file" hidden accept={IMAGE_ACCEPT} onChange={handleFileInput} />
              <h3 className="text-gray-700 font-medium"><span className="text-[#2563EB] hover:underline">Click to upload</span> or drag and drop</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500"><BsClipboard className="text-xs" /><span>or press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl+V</kbd> to paste</span></div>
              <span className="text-xs text-gray-400">PNG, JPG, WebP, AVIF, GIF, HEIC, SVG and more</span>
            </label>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <label className="cursor-pointer">
                <input type="file" hidden accept={IMAGE_ACCEPT} onChange={handleFileInput} />
                <Button className="rounded-[14px] font-semibold w-full shadow-lg shadow-[#2563EB]/20 pointer-events-none">
                  {isDragging ? "DROP TO UPLOAD" : "START EDITING"}
                </Button>
              </label>
              <Button variant="secondary" onClick={handlePaste} className="rounded-[14px] font-semibold w-full gap-2"><BsClipboard className="text-lg" />PASTE IMAGE</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dims = getOutputDimensions();

  return (
    <div className="flex items-center justify-start flex-col h-full w-full">
      <div className="flex flex-wrap gap-2 w-full mb-3 justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <span><ToolbarButton title="Export Image"><TfiExport /></ToolbarButton></span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[262px]">
            <DropdownMenuItem onClick={onExport}>Export as {state.outputFormat.toUpperCase()} ({dims.width}×{dims.height})</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ToolbarButton title="Copy" onTap={onCopy}><BsClipboard /></ToolbarButton>
        <label htmlFor="resizer-change-image"><input type="file" hidden accept={IMAGE_ACCEPT} id="resizer-change-image" onChange={handleFileInput} /><ToolbarButton title="Reset Image"><BsRepeat /></ToolbarButton></label>
        <ToolbarButton title="Reset Canvas" onTap={handleReset}><BiReset /></ToolbarButton>
      </div>
      <div className="flex justify-end mb-2 w-full">
        <span className="text-xs text-gray-500 bg-[#F9FAFB] px-3 py-1 rounded-full">
          {state.originalWidth} × {state.originalHeight} px → {dims.width} × {dims.height} px
        </span>
      </div>
      <div className={`relative w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] flex items-center justify-center rounded-[20px] bg-[#EFF6FF] border ${isDragging ? "border-[#2563EB] border-dashed bg-[#2563EB]/5" : "border-[#E5E7EB]"} overflow-hidden`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
        <div className="relative flex items-center justify-center p-4">
          <canvas ref={canvasRef} className="max-w-full max-h-[550px] rounded-[10px] shadow-2xl shadow-black/10" />
        </div>
      </div>
    </div>
  );
};

export default ImageResizerPreview;
