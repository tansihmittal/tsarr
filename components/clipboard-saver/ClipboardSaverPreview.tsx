import { RefObject, useCallback, useState } from "react";
import { BsClipboard, BsUpload, BsRepeat } from "react-icons/bs";
import { BiReset } from "react-icons/bi";
import { TfiExport } from "react-icons/tfi";
import { toast } from "react-hot-toast";
import ToolbarButton from "../common/ToolbarButton";

export type OutputFormat = "png" | "jpeg" | "webp" | "avif" | "gif" | "bmp" | "ico";

export interface ClipboardImage {
  src: string;
  width: number;
  height: number;
}

interface Props {
  image: ClipboardImage | null;
  canvasRef: RefObject<HTMLCanvasElement>;
  onPaste: () => void;
  onDownload: () => void;
  onCopy: () => void;
  onClear: () => void;
  outputFormat: OutputFormat;
}

const ClipboardSaverPreview: React.FC<Props> = ({ image, canvasRef, onPaste, onDownload, onCopy, onClear, outputFormat }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file?.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      toast.success("Image loaded!");
    };
    img.src = url;
  }, []);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleReset = () => {
    const confirmation = confirm("Confirm Reset - All your changes will be lost!");
    if (confirmation) onClear();
  };

  if (!image) {
    return (
      <div className="flex items-center justify-start flex-col h-full w-full">
        <div className="flex flex-wrap gap-2 w-full mb-3 justify-end opacity-80" style={{ pointerEvents: "none" }}>
          <div className="dropdown">
            <label tabIndex={0}><ToolbarButton title="Export Image" disabled><TfiExport /></ToolbarButton></label>
          </div>
          <ToolbarButton title="Copy" disabled><BsClipboard /></ToolbarButton>
          <ToolbarButton title="Reset Image" disabled><BsRepeat /></ToolbarButton>
          <ToolbarButton title="Reset Canvas" disabled><BiReset /></ToolbarButton>
        </div>
        <div
          className={`relative w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] flex items-center justify-center rounded-2xl bg-base-200/30 border border-base-200/80 overflow-hidden`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className={`p-6 sm:p-8 bg-base-100 relative z-20 rounded-2xl shadow-xl shadow-black/5 animate-fade-in-scale ${isDragging ? "ring-2 ring-primary" : ""}`}>
            <div className="flex gap-1 flex-col mb-6">
              <div className="flex items-start gap-4 sm:gap-6">
                <h2 className="font-bold text-2xl text-primary-content">Clipboard to Image</h2>
                <div className="text-2xl text-primary animate-pulse-soft">✦</div>
              </div>
              <span className="text-sm text-gray-500 mt-1">Paste any image from clipboard and download in your preferred format</span>
            </div>
            <div
              onClick={onPaste}
              className={`flex flex-col items-center justify-center gap-3 aspect-[2/1] p-8 border-2 rounded-2xl border-dashed transition-all duration-300 cursor-pointer ${isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-gray-300 hover:border-primary/50 hover:bg-primary/5"}`}
            >
              <div className={`p-4 rounded-full bg-primary/10 transition-transform duration-300 ${isDragging ? "scale-110" : ""}`}>
                <BsClipboard className="text-primary text-2xl" />
              </div>
              <h3 className="text-gray-700 font-medium">
                <span className="text-primary hover:underline">Click to paste</span> or drag and drop an image
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <BsUpload className="text-xs" />
                <span>or press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl+V</kbd> to paste from clipboard</span>
              </div>
              <span className="text-xs text-gray-400">PNG, JPG, WebP, GIF and more</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={onPaste} className="btn btn-primary rounded-xl font-semibold w-full shadow-lg shadow-primary/20">
                {isDragging ? "DROP TO UPLOAD" : "PASTE IMAGE"}
              </button>
              <button className="btn btn-outline rounded-xl font-semibold w-full gap-2" disabled>
                <BsClipboard className="text-lg" />WAITING...
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-start flex-col h-full w-full">
      <div className="flex flex-wrap gap-2 w-full mb-3 justify-end">
        <div className="dropdown">
          <label tabIndex={0}><ToolbarButton title="Export Image"><TfiExport /></ToolbarButton></label>
          <ul tabIndex={0} className="dropdown-content p-2 mt-1 menu bg-base-100 w-full min-w-[262px] border-2 rounded-md z-50">
            <li onClick={onDownload}><a>Download as {outputFormat.toUpperCase()}</a></li>
          </ul>
        </div>
        <ToolbarButton title="Copy" onTap={onCopy}><BsClipboard /></ToolbarButton>
        <ToolbarButton title="New Image" onTap={onPaste}><BsRepeat /></ToolbarButton>
        <ToolbarButton title="Reset Canvas" onTap={handleReset}><BiReset /></ToolbarButton>
      </div>
      <div className="flex justify-end mb-2 w-full">
        <span className="text-xs text-gray-500 bg-base-200 px-3 py-1 rounded-full">
          {image.width} × {image.height} px
        </span>
      </div>
      <div
        className={`relative w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] flex items-center justify-center rounded-2xl bg-base-200/30 border ${isDragging ? "border-primary border-dashed bg-primary/5" : "border-base-200/80"} overflow-hidden`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="relative flex items-center justify-center p-4">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[550px] rounded-lg shadow-2xl shadow-black/10"
            style={{ background: "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 20px 20px" }}
          />
        </div>
      </div>
    </div>
  );
};

export default ClipboardSaverPreview;
