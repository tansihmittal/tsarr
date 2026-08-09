import { useEffect, useRef, RefObject, useCallback, ReactNode, useState } from "react";
import ToolbarButton from "../common/ToolbarButton";
import { BsClipboard, BsRepeat, BsImage, BsShare, BsStars } from "react-icons/bs";
import { TfiExport } from "react-icons/tfi";
import { BiReset } from "react-icons/bi";
import { TextBehindImageState, TextLayer } from "./TextBehindImageLayout";
import { shareImage } from "../../utils/share";
import ProjectNameHeader from "../common/ProjectNameHeader";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { IMAGE_ACCEPT, normalizeImageFile } from "@/utils/imageFile";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface Props {
  state: TextBehindImageState;
  canvasRef: RefObject<HTMLCanvasElement>;
  updateState: (updates: Partial<TextBehindImageState>) => void;
  onImageUpload?: (imageUrl: string, width: number, height: number) => void;
  updateLayer?: (layerId: string, updates: Partial<TextLayer>) => void;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  isSaving: boolean;
}

const TextBehindImageEditor = ({ state, canvasRef, updateState, onImageUpload, updateLayer, projectName, onProjectNameChange, isSaving }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragLayerId, setDragLayerId] = useState<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);

  // Handle mouse down on canvas for dragging
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !updateLayer) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Find which layer was clicked (check in reverse order for top layer first)
    for (let i = state.textLayers.length - 1; i >= 0; i--) {
      const layer = state.textLayers[i];
      const layerX = (layer.x / 100) * canvas.width;
      const layerY = (layer.y / 100) * canvas.height;
      const hitRadius = layer.fontSize * 1.5; // Approximate hit area

      if (
        Math.abs(clickX - layerX) < hitRadius &&
        Math.abs(clickY - layerY) < hitRadius
      ) {
        setIsDragging(true);
        setDragLayerId(layer.id);
        dragStartRef.current = { x: clickX, y: clickY };
        updateState({ selectedLayerId: layer.id });
        e.preventDefault();
        return;
      }
    }
  };

  // Handle mouse move for dragging - using requestAnimationFrame for smooth updates
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragLayerId || !canvasRef.current || !updateLayer) return;

    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    // Use requestAnimationFrame for smooth updates
    animationFrameRef.current = requestAnimationFrame(() => {
      const layer = state.textLayers.find((l) => l.id === dragLayerId);
      if (!layer) return;

      const deltaX = ((currentX - dragStartRef.current.x) / canvas.width) * 100;
      const deltaY = ((currentY - dragStartRef.current.y) / canvas.height) * 100;

      const newX = Math.max(0, Math.min(100, layer.x + deltaX));
      const newY = Math.max(0, Math.min(100, layer.y + deltaY));

      updateLayer(dragLayerId, { x: newX, y: newY });
      dragStartRef.current = { x: currentX, y: currentY };
    });
  };

  // Handle mouse up to stop dragging
  const handleCanvasMouseUp = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsDragging(false);
    setDragLayerId(null);
  };

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Helper function to draw curved text
  const drawCurvedText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    fontSize: number,
    isReflection: boolean = false
  ) => {
    const chars = text.split("");
    const totalAngle = (chars.length * fontSize * 0.6) / radius;
    let currentAngle = startAngle - totalAngle / 2;

    chars.forEach((char) => {
      ctx.save();
      ctx.translate(
        centerX + Math.cos(currentAngle) * radius,
        centerY + Math.sin(currentAngle) * radius * (isReflection ? -1 : 1)
      );
      ctx.rotate(currentAngle + Math.PI / 2);
      if (isReflection) {
        ctx.scale(1, -1);
      }
      ctx.fillText(char, 0, 0);
      ctx.restore();
      currentAngle += (fontSize * 0.6) / radius;
    });
  };

  // Helper function to draw text with all properties including 3D transforms, curve, and reflection
  const drawTextLayer = (
    ctx: CanvasRenderingContext2D,
    layer: typeof state.textLayers[0],
    width: number,
    height: number,
    scale: number = 1
  ) => {
    const x = (layer.x / 100) * width;
    const y = (layer.y / 100) * height;
    const fontSize = layer.fontSize * scale;

    ctx.save();
    ctx.translate(x, y);

    // Apply 3D transforms
    const tiltXRad = (-layer.tiltX * Math.PI) / 180;
    const tiltYRad = (-layer.tiltY * Math.PI) / 180;
    ctx.transform(Math.cos(tiltYRad), 0, 0, Math.cos(tiltXRad), 0, 0);

    // Apply rotation
    ctx.rotate((layer.rotation * Math.PI) / 180);

    ctx.font = `${layer.fontWeight} ${fontSize}px ${layer.fontFamily}`;
    ctx.fillStyle = layer.textColor;
    ctx.globalAlpha = layer.opacity;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Apply shadow if enabled
    if (layer.shadowEnabled) {
      ctx.shadowColor = layer.shadowColor;
      ctx.shadowBlur = layer.shadowBlur * scale;
      ctx.shadowOffsetX = layer.shadowOffsetX * scale;
      ctx.shadowOffsetY = layer.shadowOffsetY * scale;
    }

    if (layer.curve !== 0) {
      // Draw curved text
      const radius = Math.abs(5000 / layer.curve);
      const startAngle = layer.curve > 0 ? Math.PI / 2 : -Math.PI / 2;
      const offsetY = layer.curve > 0 ? -radius : radius;

      ctx.save();
      ctx.translate(0, offsetY);
      drawCurvedText(ctx, layer.text, 0, 0, radius, startAngle, fontSize);
      ctx.restore();

      // Draw reflection for curved text
      if (layer.reflection) {
        ctx.save();
        ctx.globalAlpha = layer.opacity * layer.reflectionOpacity;
        ctx.translate(0, offsetY + fontSize * 1.5);
        ctx.scale(1, -1);

        // Create gradient for reflection fade
        const gradient = ctx.createLinearGradient(0, -fontSize, 0, fontSize);
        gradient.addColorStop(0, layer.textColor);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;

        drawCurvedText(ctx, layer.text, 0, 0, radius, startAngle, fontSize, true);
        ctx.restore();
      }
    } else {
      // Draw straight text with letter spacing
      const drawText = (yOffset: number = 0, isReflection: boolean = false) => {
        ctx.save();
        if (isReflection) {
          ctx.translate(0, yOffset);
          ctx.scale(1, -1);
          ctx.globalAlpha = layer.opacity * layer.reflectionOpacity;

          // Create gradient for reflection fade
          const gradient = ctx.createLinearGradient(0, -fontSize / 2, 0, fontSize / 2);
          gradient.addColorStop(0, layer.textColor);
          gradient.addColorStop(1, "transparent");
          ctx.fillStyle = gradient;
        }

        if (layer.letterSpacing === 0) {
          ctx.fillText(layer.text, 0, 0);
        } else {
          const chars = layer.text.split("");
          let totalWidth = 0;
          chars.forEach((char, i) => {
            const charWidth = ctx.measureText(char).width;
            totalWidth += charWidth + (i < chars.length - 1 ? layer.letterSpacing * scale : 0);
          });

          let currentX = -totalWidth / 2;
          chars.forEach((char) => {
            const charWidth = ctx.measureText(char).width;
            ctx.fillText(char, currentX + charWidth / 2, 0);
            currentX += charWidth + layer.letterSpacing * scale;
          });
        }
        ctx.restore();
      };

      // Draw main text
      drawText();

      // Draw reflection
      if (layer.reflection) {
        drawText(fontSize * 1.2, true);
      }
    }

    ctx.restore();
  };

  const renderCanvas = useCallback(
    (scale: number = 1) => {
      if (!canvasRef.current) return null;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const width = state.imageWidth * scale;
      const height = state.imageHeight * scale;

      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = state.backgroundColor;
      ctx.fillRect(0, 0, width, height);

      state.textLayers.forEach((layer) => {
        drawTextLayer(ctx, layer, width, height, scale);
      });

      if (state.image) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
        };
        img.src = state.image;
      }

      return canvas;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, canvasRef]
  );

  useEffect(() => {
    if (!state.image) {
      renderCanvas(1);
      return;
    }

    const img = new Image();
    img.onload = () => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = state.imageWidth;
      canvas.height = state.imageHeight;

      const w = canvas.width;
      const h = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, w, h);

      if (state.foregroundImage) {
        // TEXT-BEHIND EFFECT: Background -> Text -> Subject
        const foregroundImg = new Image();
        foregroundImg.onload = () => {
          // Layer 1: Draw original image as background
          ctx.globalAlpha = 1;
          ctx.drawImage(img, 0, 0, w, h);

          // Layer 2: Draw text on top of background
          state.textLayers.forEach((layer) => {
            drawTextLayer(ctx, layer, w, h, 1);
          });

          // Layer 3: Draw subject (foreground cutout) on top - hides text behind person
          ctx.globalAlpha = 1;
          ctx.drawImage(foregroundImg, 0, 0, w, h);
        };
        foregroundImg.src = state.foregroundImage;
      } else {
        // No foreground yet - show image with text overlay (processing or not started)
        ctx.globalAlpha = 1;
        ctx.drawImage(img, 0, 0, w, h);

        // Draw text with slight transparency to indicate it's not final
        state.textLayers.forEach((layer) => {
          drawTextLayer(ctx, layer, w, h, 1);
        });

        // Show processing indicator
        if (state.isProcessing) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 24px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("Processing...", w / 2, h / 2);
        }
      }
    };

    img.src = state.image;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, canvasRef, renderCanvas]);

  const handleDownload = (overrideScale?: number, overrideFormat?: string) => {
    if (!canvasRef.current || !state.image) return;

    const exportCanvas = document.createElement("canvas");
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    const scale = overrideScale ?? state.exportScale;
    const exportFormat = overrideFormat ?? state.exportFormat;
    const width = state.imageWidth * scale;
    const height = state.imageHeight * scale;

    exportCanvas.width = width;
    exportCanvas.height = height;

    // Helper to draw text on export canvas
    const drawExportTextLayer = (layer: typeof state.textLayers[0]) => {
      ctx.save();
      const x = (layer.x / 100) * width;
      const y = (layer.y / 100) * height;
      ctx.translate(x, y);

      // Apply 3D transforms
      const tiltXRad = (-layer.tiltX * Math.PI) / 180;
      const tiltYRad = (-layer.tiltY * Math.PI) / 180;
      ctx.transform(
        Math.cos(tiltYRad),
        0,
        0,
        Math.cos(tiltXRad),
        0,
        0
      );

      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.font = `${layer.fontWeight} ${layer.fontSize * scale}px ${layer.fontFamily}`;
      ctx.fillStyle = layer.textColor;
      ctx.globalAlpha = layer.opacity;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (layer.letterSpacing === 0) {
        ctx.fillText(layer.text, 0, 0);
      } else {
        const chars = layer.text.split("");
        let totalWidth = 0;
        chars.forEach((char, i) => {
          const charWidth = ctx.measureText(char).width;
          totalWidth += charWidth + (i < chars.length - 1 ? layer.letterSpacing * scale : 0);
        });

        let currentX = -totalWidth / 2;
        chars.forEach((char) => {
          const charWidth = ctx.measureText(char).width;
          ctx.fillText(char, currentX + charWidth / 2, 0);
          currentX += charWidth + layer.letterSpacing * scale;
        });
      }
      ctx.restore();
    };

    const img = new Image();
    img.onload = () => {
      if (state.foregroundImage) {
        // Text-behind effect export
        const foregroundImg = new Image();
        foregroundImg.onload = () => {
          // Step 1: Draw the ORIGINAL full image (with background scenery)
          ctx.drawImage(img, 0, 0, width, height);

          // Step 2: Draw text layers ON TOP of the original image
          state.textLayers.forEach((layer) => {
            drawExportTextLayer(layer);
          });

          // Step 3: Draw foreground cutout (subject) on top
          ctx.globalAlpha = 1;
          ctx.drawImage(foregroundImg, 0, 0, width, height);

          // Export
          const mimeType =
            exportFormat === "jpeg" ? "image/jpeg"
            : exportFormat === "webp" ? "image/webp"
            : exportFormat === "avif" ? "image/avif"
            : "image/png";

          const link = document.createElement("a");
          link.download = `tsarr-in-text-behind-image-${scale}x.${exportFormat}`;
          link.href = exportCanvas.toDataURL(mimeType, 0.95);
          link.click();
        };
        foregroundImg.src = state.foregroundImage;
      } else {
        // Normal export
        ctx.fillStyle = state.backgroundColor;
        ctx.fillRect(0, 0, width, height);

        state.textLayers.forEach((layer) => {
          drawExportTextLayer(layer);
        });

        ctx.globalAlpha = 1;
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType =
          exportFormat === "jpeg"
            ? "image/jpeg"
            : exportFormat === "webp"
              ? "image/webp"
              : "image/png";

        const link = document.createElement("a");
        link.download = `tsarr-in-text-behind-image-${scale}x.${exportFormat}`;
        link.href = exportCanvas.toDataURL(mimeType, 0.95);
        link.click();
      }
    };
    img.src = state.image;
  };

  const handleCopyToClipboard = async () => {
    if (!canvasRef.current || !state.image) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvasRef.current?.toBlob(resolve, "image/png")
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const normalized = await normalizeImageFile(file);
    const url = URL.createObjectURL(normalized);
    const img = new Image();
    img.onload = () => {
      if (onImageUpload) {
        onImageUpload(url, img.width, img.height);
      } else {
        updateState({
          image: url,
          imageWidth: img.width,
          imageHeight: img.height,
        });
      }
    };
    img.src = url;
  };

  const handleReset = () => {
    updateState({
      image: null,
      foregroundImage: null,
    });
  };

  // Listen for paste events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
              if (onImageUpload) {
                onImageUpload(url, img.width, img.height);
              } else {
                updateState({
                  image: url,
                  imageWidth: img.width,
                  imageHeight: img.height,
                });
              }
            };
            img.src = url;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [updateState, onImageUpload]);

  return (
    <div className="flex items-center justify-start flex-col h-full w-full">
      <ProjectNameHeader name={projectName} onNameChange={onProjectNameChange} isSaving={isSaving} />
      {/* Top options */}
      <div
        style={{ pointerEvents: state.image ? "auto" : "none" }}
        className={`flex flex-wrap gap-2 w-full mb-3 justify-end ${
          state.image ? "opacity-100" : "opacity-80"
        }`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <span>
              <ToolbarButton title="Export Image">
                <TfiExport />
              </ToolbarButton>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[262px]">
            <DropdownMenuItem onClick={() => handleDownload(1, "png")}>
              Export as PNG 1x
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload(2, "png")}>
              Export as PNG 2x
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload(4, "png")}>
              Export as PNG 4x
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload(2, "jpeg")}>
              Export as JPEG 2x
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload(2, "webp")}>
              Export as WebP 2x
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload(2, "avif")}>
              Export as AVIF 2x
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

        <label htmlFor="image-upload-reset">
          <input
            type="file"
            hidden
            accept={IMAGE_ACCEPT}
            id="image-upload-reset"
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

        <ToolbarButton
          title="Share"
          onTap={() => state.image && canvasRef.current && shareImage(canvasRef.current.parentElement)}
          disabled={!state.image}
        >
          <BsShare className="icon" />
        </ToolbarButton>
      </div>

      {/* Editor Canvas Area */}
      <div
        ref={containerRef}
        className="relative w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] flex items-center justify-center rounded-[20px] bg-[#EFF6FF]/30 dark:bg-blue-900/20 border border-[#E5E7EB] dark:border-gray-700 overflow-hidden"
      >
        {state.image ? (
          <div className="relative p-8">
            <canvas
              ref={canvasRef}
              className={`max-w-full max-h-[70vh] rounded-[14px] shadow-2xl ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
              style={{
                boxShadow:
                  "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
            {state.isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-[14px]">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-[14px] shadow-2xl min-w-[220px] border border-[#E5E7EB] dark:border-gray-700">
                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="h-2.5 bg-[#F9FAFB] dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: (() => {
                            const match = state.processingProgress.match(/(\d+)/);
                            return match ? `${match[1]}%` : '5%';
                          })()
                        }}
                      />
                    </div>
                  </div>

                  {/* Status text */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#0A0A0A] dark:text-white font-medium">
                      {state.processingProgress.includes('Loading') ? 'Loading Model...' : 'Processing...'}
                    </span>
                    <span className="text-sm font-bold text-[#2563EB]">
                      {(() => {
                        const match = state.processingProgress.match(/(\d+)/);
                        return match ? `${match[1]}%` : '5%';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 sm:p-8 bg-white dark:bg-gray-900 relative z-20 rounded-[20px] shadow-xl shadow-black/5 animate-fade-in-scale">
            {/* header */}
            <div className="flex gap-1 flex-col mb-6">
              <div className="flex items-start gap-4 sm:gap-6">
                <h2 className="font-bold text-2xl text-[#0A0A0A] dark:text-white bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text">
                  Upload and Start Editing
                </h2>
                <BsStars className="text-xl text-[#2563EB] animate-pulse-soft" />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Create stunning text behind image effects
              </span>
            </div>
            {/* upload */}
            <label
              htmlFor="image-upload-main"
              className="flex flex-col items-center justify-center gap-3 aspect-[2/1] p-8 border-2 rounded-[20px] border-dashed transition-all duration-300 cursor-pointer border-gray-300 hover:border-[#2563EB]/50 hover:bg-[#2563EB]/5"
            >
              <div className="p-4 rounded-full bg-[#2563EB]/10 transition-transform duration-300">
                <BsImage className="text-[#2563EB] text-2xl" />
              </div>
              <input
                type="file"
                hidden
                accept={IMAGE_ACCEPT}
                id="image-upload-main"
                onChange={handleImageUpload}
              />
              <h3 className="text-gray-700 dark:text-gray-200 font-medium">
                <span className="text-[#2563EB] hover:underline cursor-pointer">
                  Click to upload
                </span>{" "}
                or drag and drop
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <BsClipboard className="text-xs" />
                <span>or press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">Ctrl+V</kbd> to paste</span>
              </div>
              <span className="text-xs text-gray-400">PNG, JPG, WebP, AVIF, HEIC, SVG and more</span>
            </label>

            {/* button wrapper */}
            <div className="grid grid-cols-1 gap-3 mt-6">
              <label
                htmlFor="image-upload-btn"
                className="cursor-pointer"
              >
                <input
                  type="file"
                  hidden
                  accept={IMAGE_ACCEPT}
                  id="image-upload-btn"
                  onChange={handleImageUpload}
                />
                <Button className="w-full font-semibold shadow-lg shadow-[#2563EB]/20 hover:shadow-xl hover:shadow-[#2563EB]/30 transition-all duration-200 hover:-translate-y-0.5">
                  START EDITING
                </Button>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextBehindImageEditor;
