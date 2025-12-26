import { RefObject, useEffect, useCallback, useState, ReactNode } from "react";
import { AspectRatioState } from "./AspectRatioLayout";
import { TfiExport } from "react-icons/tfi";
import { BsClipboard, BsUpload, BsRepeat } from "react-icons/bs";
import { BiReset } from "react-icons/bi";
import { toast } from "react-hot-toast";

interface Props {
  state: AspectRatioState;
  canvasRef: RefObject<HTMLCanvasElement>;
  onExport: () => void;
  onCopy: () => void;
  onImageUpload: (file: File) => void;
  onImageLoad: (src: string) => void;
}

const AspectRatioPreview: React.FC<Props> = ({ state, canvasRef, onExport, onCopy, onImageUpload, onImageLoad }) => {
  const [isDragging, setIsDragging] = useState(false);

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

  // Paste from clipboard
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

  // Listen for Ctrl+V paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        handlePaste();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePaste]);

  // Draw canvas whenever state changes
  useEffect(() => {
    if (!state.originalImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let canvasWidth: number, canvasHeight: number;

      if (state.useCustomSize) {
        // Use custom pixel dimensions
        canvasWidth = state.customOutputWidth;
        canvasHeight = state.customOutputHeight;
      } else {
        // Use aspect ratio with scale
        const aspectRatio = state.targetAspectRatio.value;
        const baseSize = 800;
        if (aspectRatio >= 1) {
          canvasWidth = baseSize * state.outputScale;
          canvasHeight = (baseSize / aspectRatio) * state.outputScale;
        } else {
          canvasHeight = baseSize * state.outputScale;
          canvasWidth = baseSize * aspectRatio * state.outputScale;
        }
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      if (state.backgroundType === "transparent") {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      } else if (state.backgroundType === "blur") {
        ctx.filter = "blur(50px)";
        ctx.drawImage(img, -50, -50, canvasWidth + 100, canvasHeight + 100);
        ctx.filter = "none";
      } else {
        ctx.fillStyle = state.backgroundColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      const imgAspect = img.width / img.height;
      let drawWidth: number, drawHeight: number, drawX: number, drawY: number;

      if (state.fitMode === "fill") {
        drawWidth = canvasWidth;
        drawHeight = canvasHeight;
        drawX = 0;
        drawY = 0;
      } else if (state.fitMode === "cover" || state.fitMode === "crop") {
        if (imgAspect > canvasWidth / canvasHeight) {
          drawHeight = canvasHeight;
          drawWidth = canvasHeight * imgAspect;
        } else {
          drawWidth = canvasWidth;
          drawHeight = canvasWidth / imgAspect;
        }
        drawX = (canvasWidth - drawWidth) * (state.cropPosition.x / 100);
        drawY = (canvasHeight - drawHeight) * (state.cropPosition.y / 100);
      } else {
        if (imgAspect > canvasWidth / canvasHeight) {
          drawWidth = canvasWidth;
          drawHeight = canvasWidth / imgAspect;
        } else {
          drawHeight = canvasHeight;
          drawWidth = canvasHeight * imgAspect;
        }
        drawX = (canvasWidth - drawWidth) / 2;
        drawY = (canvasHeight - drawHeight) / 2;
      }

      ctx.drawImage(img, 0, 0, img.width, img.height, drawX, drawY, drawWidth, drawHeight);
    };
    img.src = state.originalImage;
  }, [state, canvasRef]);

  // DropZone UI (like screenshot editor) when no image
  if (!state.originalImage) {
    return (
      <div className="flex items-center justify-start flex-col h-full w-full">
        {/* Top options - disabled state */}
        <div className="grid grid-cols-2 gap-2 w-full mb-3 lg:flex lg:justify-end lg:items-center opacity-80" style={{ pointerEvents: "none" }}>
          <div className="dropdown">
            <label tabIndex={0}><OptionButtonOutline title="Export Image" disabled><TfiExport /></OptionButtonOutline></label>
          </div>
          <OptionButtonOutline title="Copy to Clipboard" disabled><BsClipboard /></OptionButtonOutline>
          <label><OptionButtonOutline title="Reset Image" disabled><BsRepeat /></OptionButtonOutline></label>
          <OptionButtonOutline title="Reset Canvas" disabled><BiReset /></OptionButtonOutline>
        </div>

        {/* Editor Canvas Area with DropZone */}
        <div className="relative w-full min-h-[500px] lg:min-h-[600px] flex items-center justify-center rounded-2xl bg-base-200/30 border border-base-200/80 overflow-hidden">
          <div
            className={`p-6 sm:p-8 bg-base-100 relative z-20 rounded-2xl shadow-xl shadow-black/5 animate-fade-in-scale ${isDragging ? "ring-2 ring-primary" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {/* header */}
            <div className="flex gap-1 flex-col mb-6">
              <div className="flex items-start gap-4 sm:gap-6">
                <h2 className="font-bold text-2xl text-primary-content bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text">
                  Convert Image Aspect Ratio
                </h2>
                <div className="text-2xl text-primary animate-pulse-soft">✦</div>
              </div>
              <span className="text-sm text-gray-500 mt-1">
                Resize images to any aspect ratio with multiple output formats
              </span>
            </div>

            {/* upload area */}
            <label
              className={`flex flex-col items-center justify-center gap-3 aspect-[2/1] p-8 border-2 rounded-2xl border-dashed transition-all duration-300 cursor-pointer ${
                isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-gray-300 hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              <div className={`p-4 rounded-full bg-primary/10 transition-transform duration-300 ${isDragging ? "scale-110" : ""}`}>
                <BsUpload className="text-primary text-2xl" />
              </div>
              <input type="file" hidden accept="image/*" onChange={handleFileInput} />
              <h3 className="text-gray-700 font-medium">
                <span className="text-primary hover:underline">Click to upload</span> or drag and drop
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <BsClipboard className="text-xs" />
                <span>or press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl+V</kbd> to paste</span>
              </div>
              <span className="text-xs text-gray-400">JPG, PNG, WebP, AVIF, HEIC, GIF, SVG up to 30MB</span>
            </label>

            {/* buttons */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <label className="btn btn-primary rounded-xl font-semibold w-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
                <input type="file" hidden accept="image/*" onChange={handleFileInput} />
                {isDragging ? "DROP TO UPLOAD" : "START EDITING"}
              </label>
              <button onClick={handlePaste} className="btn btn-outline rounded-xl font-semibold w-full hover:shadow-md transition-all duration-200 gap-2">
                <BsClipboard className="text-lg" />
                PASTE IMAGE
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main editor view when image is loaded
  return (
    <div className="flex items-center justify-start flex-col h-full w-full">
      {/* Top options */}
      <div className="grid grid-cols-2 gap-2 w-full mb-3 lg:flex lg:justify-end lg:items-center">
        <div className="dropdown">
          <label tabIndex={0}><OptionButtonOutline title="Export Image"><TfiExport /></OptionButtonOutline></label>
          <ul tabIndex={0} className="dropdown-content p-2 mt-1 menu bg-base-100 w-full min-w-[262px] border-2 rounded-md z-50">
            <li onClick={onExport}><a>Export as {state.outputFormat.toUpperCase()} ({state.outputScale}x)</a></li>
          </ul>
        </div>

        <OptionButtonOutline title="Copy to Clipboard" onTap={onCopy}><BsClipboard /></OptionButtonOutline>

        <label htmlFor="aspect-ratio-change-image">
          <input type="file" hidden accept="image/*" id="aspect-ratio-change-image" onChange={handleFileInput} />
          <OptionButtonOutline title="Reset Image"><BsRepeat /></OptionButtonOutline>
        </label>

        <OptionButtonOutline title="Reset Canvas" onTap={handleReset}><BiReset /></OptionButtonOutline>
      </div>

      {/* Image Dimensions Display */}
      <div className="flex justify-end mb-2 w-full">
        <span className="text-xs text-gray-500 bg-base-200 px-3 py-1 rounded-full">
          {state.originalWidth} × {state.originalHeight} px → {state.useCustomSize ? `${state.customOutputWidth} × ${state.customOutputHeight}` : `${Math.round(800 * state.outputScale * (state.targetAspectRatio.value >= 1 ? 1 : state.targetAspectRatio.value))} × ${Math.round(800 * state.outputScale / (state.targetAspectRatio.value >= 1 ? state.targetAspectRatio.value : 1))}`} px
        </span>
      </div>

      {/* Editor Canvas Area */}
      <div
        className={`relative w-full min-h-[500px] lg:min-h-[600px] flex items-center justify-center rounded-2xl bg-base-200/30 border ${isDragging ? "border-primary border-dashed bg-primary/5" : "border-base-200/80"} overflow-hidden`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="relative flex items-center justify-center p-4">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[550px] rounded-lg shadow-2xl shadow-black/10"
            style={{ background: state.backgroundType === "transparent" ? "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 20px 20px" : undefined }}
          />
        </div>
      </div>
    </div>
  );
};

export default AspectRatioPreview;
