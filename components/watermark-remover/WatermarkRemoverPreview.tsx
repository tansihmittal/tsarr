import { RefObject, useEffect, useCallback, useState, ReactNode, useRef } from "react";
import { WatermarkRemoverState, SelectionArea } from "./WatermarkRemoverLayout";
import { TfiExport } from "react-icons/tfi";
import { BsClipboard, BsUpload, BsRepeat } from "react-icons/bs";
import { BiReset } from "react-icons/bi";
import { toast } from "react-hot-toast";

interface Props {
  state: WatermarkRemoverState;
  canvasRef: RefObject<HTMLCanvasElement>;
  onExport: () => void;
  onCopy: () => void;
  onImageUpload: (file: File) => void;
  addSelection: (selection: SelectionArea) => void;
  removeSelection: (id: string) => void;
}

const WatermarkRemoverPreview: React.FC<Props> = ({ 
  state, 
  canvasRef, 
  onExport, 
  onCopy, 
  onImageUpload,
  addSelection,
  removeSelection 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const OptionButtonOutline = ({ title, onTap, children, disabled }: { children: ReactNode; title: string; onTap?: () => void; disabled?: boolean }) => (
    <div
      className={`text-primary-content bg-base-100 py-2.5 px-4 flex items-center justify-center gap-2.5 border border-base-200 rounded-lg transition-all duration-200 ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-base-200/50 hover:border-primary/20 hover:shadow-sm cursor-pointer press-effect"
      }`}
      onClick={disabled ? undefined : onTap}
    >
      <span className="text-lg">{children}</span>
      <span className="font-medium">{title}</span>
    </div>
  );

  const handleReset = () => {
    const confirmation = confirm("Confirm Reset - All your changes will be lost!");
    if (confirmation) window.location.reload();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onImageUpload(file);
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

  // Selection handlers
  const getRelativeCoords = (e: React.MouseEvent): { x: number; y: number } | null => {
    if (!imageRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = state.imageWidth / rect.width;
    const scaleY = state.imageHeight / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!state.originalImage) return;
    const coords = getRelativeCoords(e);
    if (!coords) return;
    setIsSelecting(true);
    setSelectionStart(coords);
    setCurrentRect({ x: coords.x, y: coords.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart) return;
    const coords = getRelativeCoords(e);
    if (!coords) return;
    
    const x = Math.min(selectionStart.x, coords.x);
    const y = Math.min(selectionStart.y, coords.y);
    const width = Math.abs(coords.x - selectionStart.x);
    const height = Math.abs(coords.y - selectionStart.y);
    
    setCurrentRect({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (isSelecting && currentRect && currentRect.width > 10 && currentRect.height > 10) {
      addSelection({
        id: `sel-${Date.now()}`,
        ...currentRect,
      });
    }
    setIsSelecting(false);
    setSelectionStart(null);
    setCurrentRect(null);
  };

  // Calculate display scale for selection overlays
  const getDisplayScale = () => {
    if (!imageRef.current || !state.imageWidth) return { scaleX: 1, scaleY: 1 };
    const rect = imageRef.current.getBoundingClientRect();
    return {
      scaleX: rect.width / state.imageWidth,
      scaleY: rect.height / state.imageHeight,
    };
  };

  if (!state.originalImage) {
    return (
      <div className="flex items-center justify-start flex-col h-full w-full">
        <div className="flex flex-wrap gap-2 w-full mb-3 justify-end opacity-80" style={{ pointerEvents: "none" }}>
          <div className="dropdown"><label tabIndex={0}><OptionButtonOutline title="Export Image" disabled><TfiExport /></OptionButtonOutline></label></div>
          <OptionButtonOutline title="Copy" disabled><BsClipboard /></OptionButtonOutline>
          <label><OptionButtonOutline title="Reset Image" disabled><BsRepeat /></OptionButtonOutline></label>
          <OptionButtonOutline title="Reset Canvas" disabled><BiReset /></OptionButtonOutline>
        </div>
        <div className="relative w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] flex items-center justify-center rounded-2xl bg-base-200/30 border border-base-200/80 overflow-hidden">
          <div className={`p-6 sm:p-8 bg-base-100 relative z-20 rounded-2xl shadow-xl shadow-black/5 animate-fade-in-scale ${isDragging ? "ring-2 ring-primary" : ""}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
            <div className="flex gap-1 flex-col mb-6">
              <div className="flex items-start gap-4 sm:gap-6">
                <h2 className="font-bold text-2xl text-primary-content">Watermark Remover</h2>
                <div className="text-2xl text-primary animate-pulse-soft">✦</div>
              </div>
              <span className="text-sm text-gray-500 mt-1">Remove watermarks from images with intelligent inpainting</span>
            </div>
            <label className={`flex flex-col items-center justify-center gap-3 aspect-[2/1] p-8 border-2 rounded-2xl border-dashed transition-all duration-300 cursor-pointer ${isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-gray-300 hover:border-primary/50 hover:bg-primary/5"}`}>
              <div className={`p-4 rounded-full bg-primary/10 transition-transform duration-300 ${isDragging ? "scale-110" : ""}`}><BsUpload className="text-primary text-2xl" /></div>
              <input type="file" hidden accept="image/*" onChange={handleFileInput} />
              <h3 className="text-gray-700 font-medium"><span className="text-primary hover:underline">Click to upload</span> or drag and drop</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500"><BsClipboard className="text-xs" /><span>or press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl+V</kbd> to paste</span></div>
              <span className="text-xs text-gray-400">JPG, PNG, WebP up to 30MB</span>
            </label>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <label className="btn btn-primary rounded-xl font-semibold w-full shadow-lg shadow-primary/20 cursor-pointer"><input type="file" hidden accept="image/*" onChange={handleFileInput} />{isDragging ? "DROP TO UPLOAD" : "START EDITING"}</label>
              <button onClick={handlePaste} className="btn btn-outline rounded-xl font-semibold w-full gap-2"><BsClipboard className="text-lg" />PASTE IMAGE</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayImage = state.processedImage || state.originalImage;
  const scale = getDisplayScale();

  return (
    <div className="flex items-center justify-start flex-col h-full w-full">
      <div className="flex flex-wrap gap-2 w-full mb-3 justify-end">
        <div className="dropdown">
          <label tabIndex={0}><OptionButtonOutline title="Export Image"><TfiExport /></OptionButtonOutline></label>
          <ul tabIndex={0} className="dropdown-content p-2 mt-1 menu bg-base-100 w-full min-w-[262px] border-2 rounded-md z-50">
            <li onClick={onExport}><a>Export as {state.outputFormat.toUpperCase()}</a></li>
          </ul>
        </div>
        <OptionButtonOutline title="Copy" onTap={onCopy}><BsClipboard /></OptionButtonOutline>
        <label htmlFor="watermark-change-image"><input type="file" hidden accept="image/*" id="watermark-change-image" onChange={handleFileInput} /><OptionButtonOutline title="Change Image"><BsRepeat /></OptionButtonOutline></label>
        <OptionButtonOutline title="Reset" onTap={handleReset}><BiReset /></OptionButtonOutline>
      </div>
      
      <div className="flex justify-between mb-2 w-full">
        <span className="text-xs text-gray-500 bg-base-200 px-3 py-1 rounded-full">
          {state.imageWidth} × {state.imageHeight} px
        </span>
        <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
          Click and drag to select watermark areas
        </span>
      </div>

      <div 
        ref={containerRef}
        className={`relative w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] flex items-center justify-center rounded-2xl bg-base-200/30 border ${isDragging ? "border-primary border-dashed bg-primary/5" : "border-base-200/80"} overflow-hidden`} 
        onDrop={handleDrop} 
        onDragOver={handleDragOver} 
        onDragLeave={handleDragLeave}
      >
        <div className="relative flex items-center justify-center p-4">
          <div className="relative">
            <img 
              ref={imageRef}
              src={displayImage} 
              alt="Preview"
              className="max-w-full max-h-[550px] rounded-lg shadow-2xl shadow-black/10 select-none"
              style={{ cursor: "crosshair" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              draggable={false}
            />
            
            {/* Selection overlays */}
            {state.selections.map((sel) => (
              <div
                key={sel.id}
                className="absolute border-2 border-red-500 bg-red-500/20 pointer-events-none"
                style={{
                  left: sel.x * scale.scaleX,
                  top: sel.y * scale.scaleY,
                  width: sel.width * scale.scaleX,
                  height: sel.height * scale.scaleY,
                }}
              >
                <button
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center pointer-events-auto hover:bg-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSelection(sel.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            
            {/* Current selection being drawn */}
            {currentRect && currentRect.width > 0 && currentRect.height > 0 && (
              <div
                className="absolute border-2 border-dashed border-primary bg-primary/10 pointer-events-none"
                style={{
                  left: currentRect.x * scale.scaleX,
                  top: currentRect.y * scale.scaleY,
                  width: currentRect.width * scale.scaleX,
                  height: currentRect.height * scale.scaleY,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatermarkRemoverPreview;
