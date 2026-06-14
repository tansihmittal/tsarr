import { useState, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import Navigation from "../common/Navigation";
import { BsUpload, BsDownload, BsClipboard, BsImage } from "react-icons/bs";

interface Color {
  hex: string;
  rgb: { r: number; g: number; b: number };
  count: number;
}

function componentToHex(c: number) {
  return c.toString(16).padStart(2, "0");
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

function colorDistance(a: [number, number, number], b: [number, number, number]) {
  return (
    Math.pow(a[0] - b[0], 2) +
    Math.pow(a[1] - b[1], 2) +
    Math.pow(a[2] - b[2], 2)
  );
}

function quantizeColors(
  imageData: Uint8ClampedArray,
  numColors: number
): Color[] {
  // Sample every 4th pixel for performance
  const pixels: [number, number, number][] = [];
  for (let i = 0; i < imageData.length; i += 16) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const a = imageData[i + 3];
    if (a > 128) pixels.push([r, g, b]);
  }

  if (pixels.length === 0) return [];

  // k-means clustering
  let centroids: [number, number, number][] = [];
  const step = Math.max(1, Math.floor(pixels.length / numColors));
  for (let i = 0; i < numColors; i++) {
    centroids.push([...pixels[Math.min(i * step, pixels.length - 1)]]);
  }

  const MAX_ITER = 15;
  for (let iter = 0; iter < MAX_ITER; iter++) {
    const clusters: [number, number, number][][] = Array.from(
      { length: numColors },
      () => []
    );

    for (const px of pixels) {
      let minDist = Infinity;
      let idx = 0;
      for (let c = 0; c < centroids.length; c++) {
        const d = colorDistance(px, centroids[c]);
        if (d < minDist) {
          minDist = d;
          idx = c;
        }
      }
      clusters[idx].push(px);
    }

    let moved = false;
    for (let c = 0; c < numColors; c++) {
      if (clusters[c].length === 0) continue;
      const avg: [number, number, number] = [
        Math.round(
          clusters[c].reduce((s, p) => s + p[0], 0) / clusters[c].length
        ),
        Math.round(
          clusters[c].reduce((s, p) => s + p[1], 0) / clusters[c].length
        ),
        Math.round(
          clusters[c].reduce((s, p) => s + p[2], 0) / clusters[c].length
        ),
      ];
      if (
        avg[0] !== centroids[c][0] ||
        avg[1] !== centroids[c][1] ||
        avg[2] !== centroids[c][2]
      ) {
        centroids[c] = avg;
        moved = true;
      }
    }
    if (!moved) break;
  }

  return centroids
    .map((c, i) => ({
      hex: rgbToHex(c[0], c[1], c[2]),
      rgb: { r: c[0], g: c[1], b: c[2] },
      count: i,
    }))
    .sort((a, b) => {
      // Sort by luminance descending
      const la = 0.299 * a.rgb.r + 0.587 * a.rgb.g + 0.114 * a.rgb.b;
      const lb = 0.299 * b.rgb.r + 0.587 * b.rgb.g + 0.114 * b.rgb.b;
      return lb - la;
    });
}

function getTextColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

const ColorPaletteLayout: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [palette, setPalette] = useState<Color[]>([]);
  const [numColors, setNumColors] = useState(6);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const extractColors = useCallback(
    (url: string, n = numColors) => {
      setIsProcessing(true);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 400;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const colors = quantizeColors(data, n);
        setPalette(colors);
        setIsProcessing(false);
        toast.success(`Extracted ${colors.length} colors`);
      };
      img.onerror = () => {
        toast.error("Failed to process image");
        setIsProcessing(false);
      };
      img.src = url;
    },
    [numColors]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image");
        return;
      }
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      extractColors(url);
    },
    [extractColors]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const item = Array.from(e.clipboardData.items).find((i) =>
        i.type.startsWith("image/")
      );
      if (item) {
        const file = item.getAsFile();
        if (file) handleFile(file);
      }
    },
    [handleFile]
  );

  const copyHex = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex.toUpperCase());
      setCopiedHex(hex);
      toast.success(`Copied ${hex.toUpperCase()}`);
      setTimeout(() => setCopiedHex(""), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const exportPalette = () => {
    const canvas = document.createElement("canvas");
    const w = 120;
    const h = 200;
    canvas.width = w * palette.length;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    palette.forEach((color, i) => {
      ctx.fillStyle = color.hex;
      ctx.fillRect(i * w, 0, w, h - 40);
      ctx.fillStyle = getTextColor(color.hex);
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(color.hex.toUpperCase(), i * w + w / 2, h - 52);
    });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "tsarr-palette.png";
    a.click();
    toast.success("Palette exported!");
  };

  return (
    <main
      className="min-h-[100vh] h-fit editor-bg relative pb-20 lg:pb-0"
      onPaste={handlePaste}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-3 sm:px-4 lg:px-0 relative">
        <div className="flex flex-col lg:grid lg:gap-5 lg:grid-cols-[3fr_1.5fr]">
          {/* Preview */}
          <div className="flex flex-col gap-3 py-4">
            {palette.length > 0 && (
              <div className="flex items-center justify-end">
                <button
                  onClick={exportPalette}
                  className="btn btn-sm btn-primary gap-2"
                >
                  <BsDownload className="w-3.5 h-3.5" />
                  Export Palette
                </button>
              </div>
            )}

            {!imageUrl ? (
              <div
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-base-300 bg-base-200/40 min-h-[420px] cursor-pointer hover:border-primary/50 transition-colors"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <BsImage className="w-12 h-12 text-base-content/20 mb-4" />
                <p className="text-base-content/50 text-sm mb-1">
                  Drop image here or click to upload
                </p>
                <p className="text-base-content/30 text-xs">
                  Or paste (Ctrl/Cmd+V) anywhere
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl overflow-hidden border border-base-300 bg-base-200/40 flex items-center justify-center min-h-[240px]">
                  <img
                    ref={imgRef}
                    src={imageUrl}
                    alt="Source"
                    className="max-w-full max-h-[320px] object-contain"
                  />
                </div>

                {isProcessing ? (
                  <div className="flex items-center justify-center gap-2 py-8">
                    <span className="loading loading-spinner loading-md text-primary" />
                    <span className="text-sm text-base-content/60">
                      Extracting colors…
                    </span>
                  </div>
                ) : (
                  palette.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {/* Color strip */}
                      <div className="flex rounded-2xl overflow-hidden h-16 shadow-md">
                        {palette.map((color) => (
                          <div
                            key={color.hex}
                            className="flex-1 cursor-pointer hover:scale-y-105 transition-transform origin-bottom"
                            style={{ backgroundColor: color.hex }}
                            onClick={() => copyHex(color.hex)}
                            title={color.hex.toUpperCase()}
                          />
                        ))}
                      </div>

                      {/* Color cards */}
                      <div
                        className="grid gap-2"
                        style={{
                          gridTemplateColumns: `repeat(${Math.min(palette.length, 3)}, 1fr)`,
                        }}
                      >
                        {palette.map((color) => (
                          <button
                            key={color.hex}
                            className="group relative rounded-xl overflow-hidden border border-base-300 shadow-sm hover:shadow-md transition-shadow"
                            onClick={() => copyHex(color.hex)}
                          >
                            <div
                              className="h-16"
                              style={{ backgroundColor: color.hex }}
                            />
                            <div className="p-2 bg-base-100 flex items-center justify-between">
                              <span className="text-xs font-mono font-medium text-base-content/80">
                                {color.hex.toUpperCase()}
                              </span>
                              <BsClipboard
                                className={`w-3 h-3 transition-colors ${
                                  copiedHex === color.hex
                                    ? "text-success"
                                    : "text-base-content/30 group-hover:text-base-content/60"
                                }`}
                              />
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* RGB values */}
                      <div className="bg-base-200/60 rounded-2xl p-4 backdrop-blur-sm">
                        <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-3">
                          RGB Values
                        </p>
                        <div className="space-y-1.5">
                          {palette.map((color) => (
                            <div
                              key={color.hex}
                              className="flex items-center gap-3"
                            >
                              <div
                                className="w-5 h-5 rounded-full flex-shrink-0 border border-base-300"
                                style={{ backgroundColor: color.hex }}
                              />
                              <span className="text-xs font-mono text-base-content/60">
                                {color.hex.toUpperCase()}
                              </span>
                              <span className="text-xs font-mono text-base-content/40 ml-auto">
                                rgb({color.rgb.r}, {color.rgb.g}, {color.rgb.b})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3 py-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />

            <div className="bg-base-200/60 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-3">
                Image
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-sm btn-outline w-full gap-2"
              >
                <BsUpload className="w-3.5 h-3.5" />
                Upload Image
              </button>
              {imageUrl && (
                <button
                  onClick={() => {
                    setImageUrl("");
                    setPalette([]);
                  }}
                  className="btn btn-sm btn-ghost w-full mt-2 text-error/70 hover:text-error"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="bg-base-200/60 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                  Number of Colors
                </p>
                <span className="text-xs font-mono text-base-content/70">
                  {numColors}
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={12}
                step={1}
                value={numColors}
                onChange={(e) => setNumColors(Number(e.target.value))}
                className="range range-xs range-primary"
              />
              <div className="flex justify-between text-xs text-base-content/40 mt-1">
                <span>2</span>
                <span>12</span>
              </div>
            </div>

            {imageUrl && (
              <button
                onClick={() => extractColors(imageUrl, numColors)}
                disabled={isProcessing}
                className="btn btn-primary w-full gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    Extracting…
                  </>
                ) : (
                  "Re-extract Colors"
                )}
              </button>
            )}

            {palette.length > 0 && (
              <div className="bg-base-200/60 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-3">
                  Tips
                </p>
                <ul className="space-y-1.5 text-xs text-base-content/50">
                  <li>• Click any color card to copy its hex</li>
                  <li>• Click the color strip to copy too</li>
                  <li>• Export saves as PNG palette</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default ColorPaletteLayout;
