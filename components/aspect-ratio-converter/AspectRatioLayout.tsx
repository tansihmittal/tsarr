import { useState, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";
import Navigation from "../common/Navigation";
import AspectRatioPreview from "./AspectRatioPreview";
import AspectRatioControls from "./AspectRatioControls";

export interface AspectRatioState {
  originalImage: string;
  originalWidth: number;
  originalHeight: number;
  targetAspectRatio: { name: string; value: number };
  fitMode: "contain" | "cover" | "fill" | "crop";
  backgroundColor: string;
  backgroundType: "solid" | "blur" | "transparent";
  outputScale: number;
  outputFormat: "png" | "jpeg" | "webp" | "avif";
  quality: number;
  cropPosition: { x: number; y: number };
  customOutputWidth: number;
  customOutputHeight: number;
  useCustomSize: boolean;
}

const AspectRatioLayout: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<AspectRatioState>({
    originalImage: "",
    originalWidth: 0,
    originalHeight: 0,
    targetAspectRatio: { name: "1:1", value: 1 },
    fitMode: "contain",
    backgroundColor: "#ffffff",
    backgroundType: "solid",
    outputScale: 1,
    outputFormat: "png",
    quality: 90,
    cropPosition: { x: 50, y: 50 },
    customOutputWidth: 1080,
    customOutputHeight: 1080,
    useCustomSize: false,
  });

  const updateState = (updates: Partial<AspectRatioState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        updateState({
          originalImage: e.target?.result as string,
          originalWidth: img.width,
          originalHeight: img.height,
        });
        toast.success("Image loaded!");
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImageLoad = useCallback((src: string) => {
    const img = new Image();
    img.onload = () => {
      updateState({
        originalImage: src,
        originalWidth: img.width,
        originalHeight: img.height,
      });
      toast.success("Image loaded!");
    };
    img.src = src;
  }, []);

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

    canvas.toBlob((blob) => {
      if (!blob) { toast.error("Failed to export"); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tsarr-in-converted-${state.targetAspectRatio.name.replace(":", "x")}-${state.outputScale}x.${state.outputFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Image exported!");
    }, mimeType, quality);
  }, [state]);

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
          <AspectRatioPreview state={state} canvasRef={canvasRef} onExport={handleExport} onCopy={handleCopy} onImageUpload={handleImageUpload} onImageLoad={handleImageLoad} />
          <AspectRatioControls state={state} updateState={updateState} onImageUpload={handleImageUpload} onExport={handleExport} />
        </div>
      </section>
    </main>
  );
};

export default AspectRatioLayout;
