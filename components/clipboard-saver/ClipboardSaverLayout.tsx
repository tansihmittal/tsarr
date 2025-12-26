import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import Navigation from "../common/Navigation";
import { BsClipboard, BsDownload, BsTrash, BsArrowRepeat } from "react-icons/bs";

type OutputFormat = "png" | "jpeg" | "webp" | "avif" | "gif" | "bmp" | "ico";

interface ClipboardImage {
  src: string;
  width: number;
  height: number;
}

const formats: { id: OutputFormat; name: string; icon: string; supportsQuality: boolean }[] = [
  { id: "png", name: "PNG", icon: "🖼️", supportsQuality: false },
  { id: "jpeg", name: "JPG", icon: "📷", supportsQuality: true },
  { id: "webp", name: "WebP", icon: "🌐", supportsQuality: true },
  { id: "avif", name: "AVIF", icon: "✨", supportsQuality: true },
  { id: "gif", name: "GIF", icon: "🎞️", supportsQuality: false },
  { id: "bmp", name: "BMP", icon: "🎨", supportsQuality: false },
  { id: "ico", name: "ICO", icon: "🔷", supportsQuality: false },
];

const ClipboardSaverLayout: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<ClipboardImage | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(90);
  const [isListening, setIsListening] = useState(true);

  const handlePaste = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(t => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            setImage({ src: url, width: img.width, height: img.height });
            toast.success("Image pasted from clipboard!");
          };
          img.src = url;
          return;
        }
      }
      toast.error("No image found in clipboard");
    } catch {
      toast.error("Failed to read clipboard. Try Ctrl+V");
    }
  }, []);

  // Listen for paste events
  useEffect(() => {
    if (!isListening) return;
    const handler = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const blob = items[i].getAsFile();
          if (blob) {
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
              setImage({ src: url, width: img.width, height: img.height });
              toast.success("Image pasted!");
            };
            img.src = url;
          }
          break;
        }
      }
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [isListening]);

  // Draw to canvas when image changes
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
      }
      ctx.drawImage(img, 0, 0);
    };
    img.src = image.src;
  }, [image, outputFormat]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current || !image) return;
    const canvas = canvasRef.current;
    const mimeTypes: Record<string, string> = {
      png: "image/png", jpeg: "image/jpeg", webp: "image/webp",
      avif: "image/avif", gif: "image/gif", bmp: "image/bmp", ico: "image/x-icon",
    };
    const mimeType = mimeTypes[outputFormat];
    const q = ["png", "gif", "bmp", "ico"].includes(outputFormat) ? undefined : quality / 100;
    
    canvas.toBlob((blob) => {
      if (!blob) { toast.error("Failed to create image"); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clipboard-image.${outputFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded as ${outputFormat.toUpperCase()}!`);
    }, mimeType, q);
  }, [image, outputFormat, quality]);

  const handleClear = () => { setImage(null); };
  const selectedFormat = formats.find(f => f.id === outputFormat);

  return (
    <main className="min-h-[100vh] h-fit editor-bg relative">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-4 lg:px-0 relative py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-content mb-2">Clipboard to Image</h1>
            <p className="text-primary-content/60">Paste any image from clipboard and download in your preferred format</p>
          </div>

          {/* Main Card */}
          <div className="bg-base-100 rounded-2xl shadow-xl p-6 sm:p-8">
            {!image ? (
              /* Empty State - Paste Area */
              <div className="text-center">
                <div
                  onClick={handlePaste}
                  className="border-2 border-dashed border-base-300 rounded-2xl p-12 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <BsClipboard className="text-4xl text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-primary-content mb-2">Paste from Clipboard</h2>
                  <p className="text-primary-content/60 mb-4">Press <kbd className="px-2 py-1 bg-base-200 rounded text-sm font-mono">Ctrl+V</kbd> or click to paste</p>
                  <button onClick={handlePaste} className="btn btn-primary btn-lg gap-2">
                    <BsClipboard /> Paste Image
                  </button>
                </div>
                <p className="text-xs text-primary-content/50 mt-4">Copy any image (screenshot, from browser, etc.) and paste here</p>
              </div>
            ) : (
              /* Image Loaded */
              <div className="space-y-6">
                {/* Preview */}
                <div className="relative rounded-xl p-4 flex items-center justify-center min-h-[300px] checkerboard-bg">
                  <canvas ref={canvasRef} className="max-w-full max-h-[400px] rounded-lg shadow-lg" />
                  <button onClick={handleClear} className="absolute top-4 right-4 btn btn-sm btn-circle btn-ghost bg-base-100/80"><BsTrash /></button>
                </div>
                <div className="text-center text-sm text-primary-content/60">{image.width} × {image.height} px</div>

                {/* Format Selection */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Output Format</label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {formats.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setOutputFormat(f.id)}
                        className={`p-3 rounded-lg text-center transition-all ${outputFormat === f.id ? "bg-primary text-white ring-2 ring-primary ring-offset-2 ring-offset-base-100" : "bg-base-200 hover:bg-base-300 text-primary-content"}`}
                      >
                        <div className="text-lg mb-1">{f.icon}</div>
                        <div className="text-xs font-semibold">{f.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality Slider */}
                {selectedFormat?.supportsQuality && (
                  <div>
                    <label className="text-sm font-medium text-primary-content/70 block mb-2">
                      Quality: {quality}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="range range-primary w-full"
                    />
                    <div className="flex justify-between text-xs text-primary-content/50 mt-1">
                      <span>Smaller file</span>
                      <span>Better quality</span>
                    </div>
                  </div>
                )}

                {/* Download Button */}
                <div className="flex gap-3">
                  <button onClick={handleDownload} className="btn btn-primary flex-1 gap-2">
                    <BsDownload /> Download as {outputFormat.toUpperCase()}
                  </button>
                  <button onClick={handleClear} className="btn btn-outline gap-2">
                    <BsArrowRepeat /> New Image
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default ClipboardSaverLayout;
