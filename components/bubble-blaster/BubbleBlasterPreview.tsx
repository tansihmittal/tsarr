import {
  useEffect,
  useRef,
  RefObject,
  useCallback,
  ReactNode,
  useState,
  ChangeEvent,
} from "react";
import { BsClipboard, BsRepeat, BsUpload, BsStars } from "react-icons/bs";
import { BiReset } from "react-icons/bi";
import { TfiExport } from "react-icons/tfi";
import { BubbleBlasterState } from "./BubbleBlasterLayout";
import { toast } from "react-hot-toast";
import ToolbarButton from "../common/ToolbarButton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface Props {
  state: BubbleBlasterState;
  canvasRef: RefObject<HTMLCanvasElement>;
  workingCanvasRef: RefObject<HTMLCanvasElement>;
  updateState: (updates: Partial<BubbleBlasterState>) => void;
  onImageUpload: (imageUrl: string, width: number, height: number) => void;
  addManualBubble: (
    x: number,
    y: number,
    width: number,
    height: number
  ) => void;
  toggleBubbleSelection: (bubbleId: string) => void;
}

const BubbleBlasterPreview = ({
  state,
  canvasRef,
  workingCanvasRef,
  updateState,
  onImageUpload,
  addManualBubble,
  toggleBubbleSelection,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [drawCurrent, setDrawCurrent] = useState({ x: 0, y: 0 });

  // Initialize working canvas when image loads
  useEffect(() => {
    if (!state.image || !workingCanvasRef.current) return;

    const canvas = workingCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = state.imageWidth;
      canvas.height = state.imageHeight;
      ctx.drawImage(img, 0, 0, state.imageWidth, state.imageHeight);
    };
    img.src = state.image;
  }, [state.image, state.imageWidth, state.imageHeight, workingCanvasRef]);

  // Restore from processed data when available
  useEffect(() => {
    if (!state.processedImageData || !workingCanvasRef.current) return;

    const canvas = workingCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.putImageData(state.processedImageData, 0, 0);
  }, [state.processedImageData, workingCanvasRef]);

  // Render display canvas with overlays
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !workingCanvasRef.current || !state.image) return;

    const displayCanvas = canvasRef.current;
    const workingCanvas = workingCanvasRef.current;
    const ctx = displayCanvas.getContext("2d");
    if (!ctx) return;

    displayCanvas.width = state.imageWidth;
    displayCanvas.height = state.imageHeight;

    // Draw from working canvas
    ctx.drawImage(workingCanvas, 0, 0);

    // Draw bubble regions
    state.bubbles.forEach((bubble) => {
      if (bubble.isSelected) {
        ctx.strokeStyle = bubble.isProcessed ? "#22c55e" : "#6366f1";
        ctx.lineWidth = 2;
        ctx.setLineDash(bubble.isProcessed ? [] : [6, 4]);
        ctx.strokeRect(bubble.x, bubble.y, bubble.width, bubble.height);
        ctx.setLineDash([]);

        ctx.fillStyle = bubble.isProcessed
          ? "rgba(34, 197, 94, 0.1)"
          : "rgba(99, 102, 241, 0.1)";
        ctx.fillRect(bubble.x, bubble.y, bubble.width, bubble.height);
      } else {
        ctx.strokeStyle = "rgba(156, 163, 175, 0.5)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(bubble.x, bubble.y, bubble.width, bubble.height);
        ctx.setLineDash([]);
      }
    });

    // Draw current selection rectangle if drawing
    if (isDrawing && state.mode === "draw") {
      const x = Math.min(drawStart.x, drawCurrent.x);
      const y = Math.min(drawStart.y, drawCurrent.y);
      const w = Math.abs(drawCurrent.x - drawStart.x);
      const h = Math.abs(drawCurrent.y - drawStart.y);

      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(245, 158, 11, 0.1)";
      ctx.fillRect(x, y, w, h);
    }
  }, [
    state,
    canvasRef,
    workingCanvasRef,
    isDrawing,
    drawStart,
    drawCurrent,
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (state.mode !== "select" || isDrawing) return;

    const { x, y } = getCanvasCoords(e);

    for (let i = state.bubbles.length - 1; i >= 0; i--) {
      const bubble = state.bubbles[i];
      if (
        x >= bubble.x &&
        x <= bubble.x + bubble.width &&
        y >= bubble.y &&
        y <= bubble.y + bubble.height
      ) {
        toggleBubbleSelection(bubble.id);
        return;
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (state.mode !== "draw") return;
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setDrawStart(coords);
    setDrawCurrent(coords);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || state.mode !== "draw") return;
    setDrawCurrent(getCanvasCoords(e));
  };

  const handleMouseUp = () => {
    if (!isDrawing || state.mode !== "draw") return;

    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const w = Math.abs(drawCurrent.x - drawStart.x);
    const h = Math.abs(drawCurrent.y - drawStart.y);

    if (w > 20 && h > 20) {
      addManualBubble(x, y, w, h);
    }

    setIsDrawing(false);
  };

  const handleDownload = (scale: number = 1) => {
    if (!workingCanvasRef.current) return;

    const exportCanvas = document.createElement("canvas");
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    exportCanvas.width = state.imageWidth * scale;
    exportCanvas.height = state.imageHeight * scale;

    ctx.scale(scale, scale);
    ctx.drawImage(workingCanvasRef.current, 0, 0);

    const link = document.createElement("a");
    link.download = `tsarr-in-bubble-blaster-${scale}x.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
    toast.success(`Downloaded at ${scale}x resolution`);
  };

  const handleCopyToClipboard = async () => {
    if (!workingCanvasRef.current) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        workingCanvasRef.current?.toBlob(resolve, "image/png")
      );
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        toast.success("Copied to clipboard!");
      }
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      onImageUpload(url, img.width, img.height);
    };
    img.src = url;
  };

  const handleReset = () => {
    updateState({
      image: null,
      originalImage: null,
      processedImageData: null,
      bubbles: [],
      selectedBubbleId: null,
    });
  };

  // Paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
              onImageUpload(url, img.width, img.height);
            };
            img.src = url;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onImageUpload]);

  const selectedCount = state.bubbles.filter((b) => b.isSelected).length;
  const processedCount = state.bubbles.filter((b) => b.isProcessed).length;

  return (
    <div className="flex items-center justify-start flex-col h-full w-full">
      {/* Top options - matching screenshot editor */}
      <div
        style={{ pointerEvents: state.image ? "auto" : "none" }}
        className={`flex flex-wrap gap-2 w-full mb-3 justify-end ${
          state.image ? "opacity-100" : "opacity-80"
        }`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <span>
              <ToolbarButton title="Export Image" disabled={!state.image}>
                <TfiExport />
              </ToolbarButton>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[262px]">
            <DropdownMenuItem onClick={() => handleDownload(1)}>
              Export as PNG 1x
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload(2)}>
              Export as PNG 2x
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload(4)}>
              Export as PNG 4x
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarButton
          title="Copy"
          onTap={handleCopyToClipboard}
          disabled={!state.image}
        >
          <BsClipboard className="icon" />
        </ToolbarButton>

        <label htmlFor="bubble-image-change">
          <input
            type="file"
            hidden
            accept="image/*"
            id="bubble-image-change"
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <ToolbarButton title="Change Image">
            <BsRepeat className="icon" />
          </ToolbarButton>
        </label>

        <ToolbarButton title="Reset" onTap={handleReset}>
          <BiReset className="icon" />
        </ToolbarButton>
      </div>

      {/* Canvas area */}
      <div className="relative w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] flex items-center justify-center rounded-[20px] bg-[#EFF6FF]/30 dark:bg-blue-900/20 border border-[#E5E7EB] dark:border-gray-700 overflow-hidden">
        {state.image ? (
          <div className="relative p-6">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className={`max-w-full max-h-[70vh] rounded-[14px] shadow-2xl ${
                  state.mode === "draw" ? "cursor-crosshair" : "cursor-pointer"
                }`}
                style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              <canvas ref={workingCanvasRef} className="hidden" />
            </div>

            {/* Processing overlay */}
            {state.isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-[14px]">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-[14px] shadow-2xl min-w-[240px]">
                  <div className="h-2 bg-[#F9FAFB] dark:bg-gray-800 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-[#2563EB] rounded-full transition-all duration-300"
                      style={{ width: `${state.processingPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#0A0A0A] dark:text-white">
                      {state.processingProgress}
                    </span>
                    <span className="font-bold text-[#2563EB]">
                      {state.processingPercent}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Status bar */}
            {!state.isProcessing && state.bubbles.length > 0 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-4 py-2 rounded-full flex items-center gap-3">
                <span><span className="inline-block w-3 h-3 rounded-full bg-current" /> {state.bubbles.length} bubbles</span>
                <span className="text-[#60A5FA]">{selectedCount} selected</span>
                {processedCount > 0 && (
                  <span className="text-green-400">
                    {processedCount} cleaned
                  </span>
                )}
              </div>
            )}

            {/* Mode indicator */}
            {state.mode === "draw" && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs px-4 py-2 rounded-full">
                Draw mode — click and drag to select region
              </div>
            )}
          </div>
        ) : (
          <DropZone onImageUpload={onImageUpload} />
        )}
      </div>
    </div>
  );
};

// DropZone component matching screenshot editor style
const DropZone = ({
  onImageUpload,
}: {
  onImageUpload: (url: string, w: number, h: number) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      onImageUpload(url, img.width, img.height);
    };
    img.src = url;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="p-6 sm:p-8 bg-white dark:bg-gray-900 relative z-20 rounded-[20px] shadow-xl shadow-black/5 animate-fade-in-scale max-w-lg w-full">
      <div className="flex gap-1 flex-col mb-6">
        <div className="flex items-start gap-4 sm:gap-6">
          <h2 className="font-bold text-2xl text-[#0A0A0A] dark:text-white bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text">
            Bubble Blaster
          </h2>
          <BsStars className="text-xl text-[#2563EB] animate-pulse-soft" />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Remove text from manga speech bubbles instantly
        </span>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex flex-col items-center justify-center gap-3 aspect-[2/1] p-8 border-2 rounded-[20px] border-dashed transition-all duration-300 cursor-pointer ${
          isDragActive
            ? "border-[#2563EB] bg-[#2563EB]/5 scale-[1.02]"
            : "border-gray-300 hover:border-[#2563EB]/50 hover:bg-[#2563EB]/5"
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div
          className={`p-4 rounded-full bg-[#2563EB]/10 transition-transform duration-300 ${isDragActive ? "scale-110" : ""}`}
        >
          <BsUpload className="text-[#2563EB] text-2xl" />
        </div>
        <input
          type="file"
          hidden
          accept="image/*"
          ref={fileInputRef}
          onChange={handleChange}
        />
        <h3 className="text-gray-700 dark:text-gray-200 font-medium">
          <span className="text-[#2563EB] hover:underline cursor-pointer">
            Click to upload
          </span>{" "}
          or drag and drop
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <BsClipboard className="text-xs" />
          <span>
            or press{" "}
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
              Ctrl+V
            </kbd>{" "}
            to paste
          </span>
        </div>
        <span className="text-xs text-gray-400">PNG, JPG, WEBP up to 30MB</span>
      </div>

      <Button
        className="w-full mt-6 shadow-lg shadow-[#2563EB]/20 hover:shadow-xl hover:shadow-[#2563EB]/30 transition-all duration-200 hover:-translate-y-0.5"
        onClick={() => fileInputRef.current?.click()}
      >
        {isDragActive ? "DROP TO UPLOAD" : "UPLOAD MANGA PAGE"}
      </Button>

      <div className="mt-6 p-4 bg-[#EFF6FF] dark:bg-blue-900/20 rounded-[14px]">
        <h3 className="font-medium text-sm text-[#0A0A0A] dark:text-white mb-2">
          How it works:
        </h3>
        <ol className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <li>1. Upload a manga/comic page</li>
          <li>2. Bubbles are auto-detected (or draw manually)</li>
          <li>3. Click &quot;Blast!&quot; to remove text</li>
          <li>4. Download clean bubbles for translation</li>
        </ol>
      </div>
    </div>
  );
};

export default BubbleBlasterPreview;
