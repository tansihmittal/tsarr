import { useEffect, useRef, RefObject, useCallback, ReactNode } from "react";
import { BsClipboard, BsRepeat, BsImage, BsDownload } from "react-icons/bs";
import { BiReset } from "react-icons/bi";
import { ImageTextEditorState, TextRegion } from "./ImageTextEditorLayout";

// Helper to check if a color is light (for shadow direction)
const isColorLight = (color: string): boolean => {
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  }
  // For hex colors
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  }
  return true; // Default to light
};

interface Props {
  state: ImageTextEditorState;
  canvasRef: RefObject<HTMLCanvasElement>;
  updateState: (updates: Partial<ImageTextEditorState>) => void;
  onImageUpload?: (imageUrl: string, width: number, height: number) => void;
  updateRegion: (regionId: string, updates: Partial<TextRegion>) => void;
  startEditing: (regionId: string) => void;
  stopEditing: () => void;
}

const ImageTextEditorPreview = ({
  state,
  canvasRef,
  updateState,
  onImageUpload,
  updateRegion,
  startEditing,
  stopEditing,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (state.editingRegionId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [state.editingRegionId]);

  // Handle click on canvas to select/edit regions
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Find which region was clicked
    for (let i = state.textRegions.length - 1; i >= 0; i--) {
      const region = state.textRegions[i];
      const padding = 10;
      if (
        clickX >= region.x - padding &&
        clickX <= region.x + region.width + padding &&
        clickY >= region.y - padding &&
        clickY <= region.y + region.height + padding
      ) {
        if (state.editingRegionId === region.id) return;
        startEditing(region.id);
        e.preventDefault();
        return;
      }
    }

    if (state.editingRegionId) {
      stopEditing();
    }
    updateState({ selectedRegionId: null });
  };

  // Smart inpainting - samples from edges and creates smooth gradient
  const inpaintBackground = useCallback((
    ctx: CanvasRenderingContext2D,
    region: TextRegion,
    imgWidth: number,
    imgHeight: number
  ) => {
    const pad = 2;
    const x = Math.max(0, region.x - pad);
    const y = Math.max(0, region.y - pad);
    const w = Math.min(imgWidth - x, region.width + pad * 2);
    const h = Math.min(imgHeight - y, region.height + pad * 2);

    // Sample colors from the 4 edges (outside the text region)
    const sampleEdge = (sx: number, sy: number, sw: number, sh: number): [number, number, number] => {
      try {
        const data = ctx.getImageData(
          Math.max(0, Math.min(imgWidth - sw, sx)),
          Math.max(0, Math.min(imgHeight - sh, sy)),
          Math.max(1, sw),
          Math.max(1, sh)
        ).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        return count > 0 ? [r / count, g / count, b / count] : [128, 128, 128];
      } catch {
        return [128, 128, 128];
      }
    };

    // Sample from left, right, top, bottom edges
    const edgeSize = 3;
    const leftColor = sampleEdge(x - edgeSize * 2, y, edgeSize, h);
    const rightColor = sampleEdge(x + w + edgeSize, y, edgeSize, h);
    const topColor = sampleEdge(x, y - edgeSize * 2, w, edgeSize);
    const bottomColor = sampleEdge(x, y + h + edgeSize, w, edgeSize);

    // Create a smooth gradient fill
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    
    // Blend all 4 colors for smooth transition
    const avgLeft = [(leftColor[0] + topColor[0]) / 2, (leftColor[1] + topColor[1]) / 2, (leftColor[2] + topColor[2]) / 2];
    const avgRight = [(rightColor[0] + bottomColor[0]) / 2, (rightColor[1] + bottomColor[1]) / 2, (rightColor[2] + bottomColor[2]) / 2];
    
    gradient.addColorStop(0, `rgb(${avgLeft[0]}, ${avgLeft[1]}, ${avgLeft[2]})`);
    gradient.addColorStop(1, `rgb(${avgRight[0]}, ${avgRight[1]}, ${avgRight[2]})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
  }, []);

  // Render canvas
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !state.image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      originalImageRef.current = img;
      canvas.width = state.imageWidth;
      canvas.height = state.imageHeight;

      // Draw original image
      ctx.drawImage(img, 0, 0, state.imageWidth, state.imageHeight);

      // Process each region
      state.textRegions.forEach((region) => {
        // Highlight unmodified regions
        if (!region.isModified && !region.isEditing) {
          ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(region.x - 2, region.y - 2, region.width + 4, region.height + 4);
          ctx.setLineDash([]);
        }

        // Render modified text
        if (region.isModified && region.newText !== region.text) {
          // Step 1: Inpaint background
          inpaintBackground(ctx, region, state.imageWidth, state.imageHeight);

          // Step 2: Draw new text with AUTO-DETECTED style (color, weight, size)
          const fontWeight = region.fontWeight || "bold";
          ctx.font = `${fontWeight} ${region.fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
          ctx.fillStyle = region.textColor; // Use detected text color
          ctx.textBaseline = "middle";
          ctx.textAlign = "left";
          
          // Add subtle shadow for depth (adapts to text color brightness)
          const isLightText = isColorLight(region.textColor);
          ctx.shadowColor = isLightText ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.3)";
          ctx.shadowBlur = 2;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 1;
          
          ctx.fillText(region.newText, region.x, region.y + region.height / 2);
          
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;
        }

        // Selection highlight
        if (region.id === state.selectedRegionId && !region.isEditing) {
          ctx.strokeStyle = "#6366f1";
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(region.x - 4, region.y - 4, region.width + 8, region.height + 8);
          ctx.setLineDash([]);
        }
      });
    };
    img.src = state.image;
  }, [state, canvasRef, inpaintBackground]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Get editing region style
  const getEditingRegionStyle = () => {
    const region = state.textRegions.find((r) => r.id === state.editingRegionId);
    if (!region || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / state.imageWidth;

    // Use detected colors for the input
    const textColor = region.textColor || "#ffffff";
    const isLight = isColorLight(textColor);

    return {
      position: "absolute" as const,
      left: `${region.x * scale}px`,
      top: `${region.y * scale}px`,
      width: `${Math.max(region.width * scale, 200)}px`,
      minHeight: `${Math.max(region.height * scale, 32)}px`,
      fontSize: `${Math.max(region.fontSize * scale, 16)}px`,
      fontWeight: region.fontWeight || "bold",
      color: textColor,
      backgroundColor: isLight ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.9)",
      padding: "6px 10px",
      borderRadius: "6px",
      border: "2px solid #6366f1",
      textShadow: isLight ? "0 1px 2px rgba(0,0,0,0.5)" : "none",
    };
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `tsarr-in-edited-image.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const handleCopyToClipboard = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvasRef.current?.toBlob(resolve, "image/png")
      );
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      onImageUpload?.(url, img.width, img.height) ?? updateState({
        image: url,
        imageWidth: img.width,
        imageHeight: img.height,
      });
    };
    img.src = url;
  };

  const handleReset = () => {
    updateState({
      image: null,
      textRegions: [],
      selectedRegionId: null,
      editingRegionId: null,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (state.editingRegionId) {
      updateRegion(state.editingRegionId, { newText: e.target.value });
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Escape") {
      stopEditing();
    }
  };

  // Paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (state.editingRegionId) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
              onImageUpload?.(url, img.width, img.height) ?? updateState({
                image: url,
                imageWidth: img.width,
                imageHeight: img.height,
              });
            };
            img.src = url;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [updateState, onImageUpload, state.editingRegionId]);

  const ActionButton = ({ title, onClick, children, disabled }: {
    children: ReactNode;
    title: string;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
        disabled
          ? "opacity-50 cursor-not-allowed bg-base-200 text-gray-400"
          : "bg-base-100 text-primary-content border border-base-200 hover:bg-base-200/50 hover:border-primary/30 hover:shadow-sm"
      }`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <span className="text-lg">{children}</span>
      <span>{title}</span>
    </button>
  );

  const editingRegion = state.textRegions.find((r) => r.id === state.editingRegionId);
  const editingStyle = getEditingRegionStyle();

  return (
    <div className="flex flex-col h-full w-full">
      {/* Action buttons */}
      <div className={`flex flex-wrap gap-2 mb-3 justify-end ${state.image ? "opacity-100" : "opacity-60 pointer-events-none"}`}>
        <ActionButton title="Download" onClick={handleDownload} disabled={!state.image}>
          <BsDownload />
        </ActionButton>
        <ActionButton title="Copy" onClick={handleCopyToClipboard} disabled={!state.image}>
          <BsClipboard />
        </ActionButton>
        <label>
          <input type="file" hidden accept="image/*" ref={fileInputRef} onChange={handleImageUpload} />
          <ActionButton title="Change">
            <BsRepeat />
          </ActionButton>
        </label>
        <ActionButton title="Reset" onClick={handleReset}>
          <BiReset />
        </ActionButton>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[500px] flex items-center justify-center rounded-2xl bg-base-200/30 border border-base-200/80 overflow-hidden"
      >
        {state.image ? (
          <div className="relative p-6">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[70vh] rounded-xl shadow-2xl cursor-pointer"
                style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                onClick={handleCanvasClick}
              />
              
              {/* Inline editor */}
              {editingRegion && editingStyle && (
                <input
                  ref={inputRef}
                  type="text"
                  value={editingRegion.newText}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  onBlur={stopEditing}
                  style={editingStyle}
                  className="outline-none font-sans"
                />
              )}
            </div>
            
            {/* Processing overlay */}
            {state.isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
                <div className="bg-base-100 p-5 rounded-xl shadow-2xl min-w-[240px]">
                  <div className="h-2 bg-base-200 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${state.processingPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-content">{state.processingProgress}</span>
                    <span className="font-bold text-primary">{state.processingPercent}%</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Status */}
            {!state.isProcessing && state.textRegions.length > 0 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-4 py-2 rounded-full">
                ✨ {state.textRegions.length} text regions • Click to edit
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 bg-base-100 rounded-2xl shadow-xl max-w-md w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-primary-content mb-2">
                ✨ Magic Text Editor
              </h2>
              <p className="text-gray-500 text-sm">
                Edit any text in images seamlessly
              </p>
            </div>
            
            <label
              htmlFor="image-upload-main"
              className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <div className="p-4 rounded-full bg-primary/10">
                <BsImage className="text-primary text-3xl" />
              </div>
              <input type="file" hidden accept="image/*" id="image-upload-main" onChange={handleImageUpload} />
              <div className="text-center">
                <p className="font-medium text-gray-700">
                  <span className="text-primary">Click to upload</span> or drag & drop
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG, WEBP • Or paste with Ctrl+V
                </p>
              </div>
            </label>

            <button
              onClick={() => document.getElementById("image-upload-main")?.click()}
              className="w-full mt-4 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-focus transition-all shadow-lg shadow-primary/20"
            >
              START EDITING
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageTextEditorPreview;
