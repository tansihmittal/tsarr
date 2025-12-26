import { useState, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";
import Navigation from "../common/Navigation";
import ImageResizerPreview from "./ImageResizerPreview";
import ImageResizerControls from "./ImageResizerControls";

export interface ImageResizerState {
  originalImage: string;
  originalWidth: number;
  originalHeight: number;
  targetWidth: number;
  targetHeight: number;
  maintainAspectRatio: boolean;
  resizeMode: "pixels" | "percentage" | "preset";
  percentage: number;
  outputFormat: "png" | "jpeg" | "webp" | "avif";
  quality: number;
}

const ImageResizerLayout: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<ImageResizerState>({
    originalImage: "",
    originalWidth: 0,
    originalHeight: 0,
    targetWidth: 800,
    targetHeight: 600,
    maintainAspectRatio: true,
    resizeMode: "pixels",
    percentage: 100,
    outputFormat: "png",
    quality: 90,
  });

  const updateState = (updates: Partial<ImageResizerState>) => {
    setState((prev) => {
      const newState = { ...prev, ...updates };
      // Handle aspect ratio lock
      if (newState.maintainAspectRatio && prev.originalWidth > 0 && prev.originalHeight > 0) {
        const aspectRatio = prev.originalWidth / prev.originalHeight;
        if (updates.targetWidth !== undefined && updates.targetWidth !== prev.targetWidth) {
          newState.targetHeight = Math.round(updates.targetWidth / aspectRatio);
        } else if (updates.targetHeight !== undefined && updates.targetHeight !== prev.targetHeight) {
          newState.targetWidth = Math.round(updates.targetHeight * aspectRatio);
        }
      }
      return newState;
    });
  };

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setState(prev => ({
          ...prev,
          originalImage: e.target?.result as string,
          originalWidth: img.width,
          originalHeight: img.height,
          targetWidth: img.width,
          targetHeight: img.height,
        }));
        toast.success("Image loaded!");
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const getOutputDimensions = useCallback(() => {
    if (state.resizeMode === "percentage") {
      return {
        width: Math.round(state.originalWidth * state.percentage / 100),
        height: Math.round(state.originalHeight * state.percentage / 100),
      };
    }
    return { width: state.targetWidth, height: state.targetHeight };
  }, [state]);

  const handleExport = useCallback(async () => {
    if (!state.originalImage || !canvasRef.current) {
      toast.error("No image to export");
      return;
    }

    const canvas = canvasRef.current;
    const mimeTypes: Record<string, string> = {
      png: "image/png",
      jpeg: "image/jpeg",
      webp: "image/webp",
      avif: "image/avif",
    };
    const mimeType = mimeTypes[state.outputFormat] || "image/png";
    const quality = state.outputFormat === "png" ? undefined : state.quality / 100;
    const dims = getOutputDimensions();

    canvas.toBlob((blob) => {
      if (!blob) { toast.error("Failed to export"); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resized-${dims.width}x${dims.height}.${state.outputFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Image exported!");
    }, mimeType, quality);
  }, [state, getOutputDimensions]);

  const handleCopy = useCallback(async () => {
    if (!canvasRef.current) { toast.error("No image to copy"); return; }
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvasRef.current?.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Failed to create blob");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Copied to clipboard!");
    } catch { toast.error("Failed to copy"); }
  }, []);

  return (
    <main className="min-h-[100vh] h-fit editor-bg relative">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-4 lg:px-0 relative">
        <div className="grid gap-5 lg:grid-cols-[3fr_1.5fr]">
          <ImageResizerPreview state={state} canvasRef={canvasRef} onExport={handleExport} onCopy={handleCopy} onImageUpload={handleImageUpload} getOutputDimensions={getOutputDimensions} />
          <ImageResizerControls state={state} updateState={updateState} onImageUpload={handleImageUpload} onExport={handleExport} getOutputDimensions={getOutputDimensions} />
        </div>
      </section>
    </main>
  );
};

export default ImageResizerLayout;
