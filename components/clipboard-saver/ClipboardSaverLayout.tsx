import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import Navigation from "../common/Navigation";
import ClipboardSaverPreview, { ClipboardImage, OutputFormat } from "./ClipboardSaverPreview";
import ClipboardSaverControls from "./ClipboardSaverControls";

const ClipboardSaverLayout: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<ClipboardImage | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(90);

  const loadImageFromBlob = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      setImage((prev) => {
        if (prev?.src?.startsWith("blob:")) URL.revokeObjectURL(prev.src);
        return { src: url, width: img.width, height: img.height };
      });
      toast.success("Image pasted!");
    };
    img.src = url;
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          loadImageFromBlob(blob);
          return;
        }
      }
      toast.error("No image found in clipboard");
    } catch {
      toast.error("Failed to read clipboard. Try Ctrl+V");
    }
  }, [loadImageFromBlob]);

  // Listen for paste keyboard events
  useEffect(() => {
    const handler = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const blob = items[i].getAsFile();
          if (blob) { loadImageFromBlob(blob); break; }
        }
      }
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [loadImageFromBlob]);

  // Draw to canvas whenever image or format changes
  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (outputFormat === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, img.width, img.height);
      } else {
        ctx.clearRect(0, 0, img.width, img.height);
      }
      ctx.drawImage(img, 0, 0);
    };
    img.src = image.src;
  }, [image, outputFormat]);

  // Revoke blob URL on image change / unmount
  useEffect(() => {
    const src = image?.src;
    return () => { if (src?.startsWith("blob:")) URL.revokeObjectURL(src); };
  }, [image?.src]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current || !image) return;
    const mimeTypes: Record<string, string> = {
      png: "image/png", jpeg: "image/jpeg", webp: "image/webp",
      avif: "image/avif", gif: "image/gif", bmp: "image/bmp", ico: "image/x-icon",
    };
    const mimeType = mimeTypes[outputFormat];
    const q = ["png", "gif", "bmp", "ico"].includes(outputFormat) ? undefined : quality / 100;
    canvasRef.current.toBlob((blob) => {
      if (!blob) { toast.error("Failed to create image"); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tsarr-in-clipboard-image.${outputFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded as ${outputFormat.toUpperCase()}!`);
    }, mimeType, q);
  }, [image, outputFormat, quality]);

  const handleCopy = useCallback(async () => {
    if (!canvasRef.current || !image) { toast.error("No image to copy"); return; }
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvasRef.current?.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Failed to create blob");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Copied to clipboard!");
    } catch { toast.error("Failed to copy"); }
  }, [image]);

  const handleClear = useCallback(() => setImage(null), []);

  return (
    <main className="min-h-[100vh] h-fit editor-bg relative pb-20 lg:pb-0" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-3 sm:px-4 lg:px-0 relative">
        <div className="flex flex-col lg:grid lg:gap-5 lg:grid-cols-[3fr_1.5fr]">
          <ClipboardSaverPreview
            image={image}
            canvasRef={canvasRef}
            onPaste={handlePaste}
            onDownload={handleDownload}
            onCopy={handleCopy}
            onClear={handleClear}
            outputFormat={outputFormat}
          />
          <ClipboardSaverControls
            hasImage={!!image}
            outputFormat={outputFormat}
            quality={quality}
            onFormatChange={setOutputFormat}
            onQualityChange={setQuality}
            onDownload={handleDownload}
          />
        </div>
      </section>
    </main>
  );
};

export default ClipboardSaverLayout;
