import { useState, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";
import Navigation from "../common/Navigation";
import ImageConverterPreview from "./ImageConverterPreview";
import ImageConverterControls from "./ImageConverterControls";

export interface ImageConverterState {
  originalImage: string;
  originalWidth: number;
  originalHeight: number;
  originalFormat: string;
  originalSize: number;
  outputFormat: "png" | "jpeg" | "webp" | "avif" | "gif" | "bmp" | "ico" | "tiff" | "tga" | "heic";
  quality: number;
  preserveTransparency: boolean;
}

const ImageConverterLayout: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<ImageConverterState>({
    originalImage: "",
    originalWidth: 0,
    originalHeight: 0,
    originalFormat: "",
    originalSize: 0,
    outputFormat: "png",
    quality: 90,
    preserveTransparency: true,
  });

  const updateState = (updates: Partial<ImageConverterState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const getFormatFromFile = (file: File): string => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const mimeType = file.type.split("/")[1] || ext;
    return mimeType.toUpperCase();
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
          originalFormat: getFormatFromFile(file),
          originalSize: file.size,
        });
        toast.success("Image loaded!");
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleExport = useCallback(async () => {
    if (!state.originalImage || !canvasRef.current) {
      toast.error("No image to convert");
      return;
    }

    const canvas = canvasRef.current;
    const mimeTypes: Record<string, string> = {
      png: "image/png",
      jpeg: "image/jpeg",
      webp: "image/webp",
      avif: "image/avif",
      gif: "image/gif",
      bmp: "image/bmp",
      ico: "image/x-icon",
      tiff: "image/tiff",
      tga: "image/x-tga",
      heic: "image/heic",
    };
    
    // Formats that don't support quality
    const noQualityFormats = ["png", "gif", "bmp", "ico", "tiff", "tga"];
    const mimeType = mimeTypes[state.outputFormat] || "image/png";
    const quality = noQualityFormats.includes(state.outputFormat) ? undefined : state.quality / 100;

    // Note: TIFF, TGA, HEIC may not be supported by all browsers
    // They will fall back to PNG if not supported
    canvas.toBlob((blob) => {
      if (!blob) { 
        // Fallback to PNG if format not supported
        canvas.toBlob((fallbackBlob) => {
          if (!fallbackBlob) { toast.error("Failed to convert"); return; }
          const url = URL.createObjectURL(fallbackBlob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `converted.${state.outputFormat}`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success(`Converted to ${state.outputFormat.toUpperCase()}!`);
        }, "image/png");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `converted.${state.outputFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Converted to ${state.outputFormat.toUpperCase()}!`);
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
          <ImageConverterPreview state={state} canvasRef={canvasRef} onExport={handleExport} onCopy={handleCopy} onImageUpload={handleImageUpload} />
          <ImageConverterControls state={state} updateState={updateState} onImageUpload={handleImageUpload} onExport={handleExport} />
        </div>
      </section>
    </main>
  );
};

export default ImageConverterLayout;
