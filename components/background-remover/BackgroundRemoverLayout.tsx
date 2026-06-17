import { useState, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import { normalizeImageFile, IMAGE_ACCEPT } from "@/utils/imageFile";
import Navigation from "../common/Navigation";
import { backgroundRemover } from "../../utils/backgroundRemoval";
import {
  BsUpload,
  BsDownload,
  BsEraser,
  BsImage,
  BsPalette,
  BsArrowLeftRight,
} from "react-icons/bs";
import { MdOutlineAutoFixHigh } from "react-icons/md";
import { Button } from "@/components/ui/button";

type BgOption = "transparent" | "white" | "black" | "custom";
type ExportFormat = "png" | "webp" | "jpeg";

const BackgroundRemoverLayout: React.FC = () => {
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [progress, setProgress] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [bgOption, setBgOption] = useState<BgOption>("transparent");
  const [customColor, setCustomColor] = useState("#ffffff");
  const [view, setView] = useState<"split" | "original" | "result">("split");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
      toast.error("Please upload an image file");
      return;
    }
    const normalized = await normalizeImageFile(file);
    const url = URL.createObjectURL(normalized);
    setOriginalUrl(url);
    setResultUrl("");
    setProgress("");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
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

  const handleRemove = useCallback(async () => {
    if (!originalUrl) {
      toast.error("Upload an image first");
      return;
    }
    setIsProcessing(true);
    setProgress("Starting...");
    try {
      const result = await backgroundRemover.processImage(originalUrl, (s) =>
        setProgress(s)
      );
      setResultUrl(result.foregroundUrl);
      setView("result");
      toast.success("Background removed!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove background");
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  }, [originalUrl]);

  const getExportUrl = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!resultUrl) return reject("No result");
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        if (bgOption !== "transparent") {
          ctx.fillStyle =
            bgOption === "white"
              ? "#ffffff"
              : bgOption === "black"
              ? "#000000"
              : customColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        const mimeType = exportFormat === "jpeg" ? "image/jpeg" : exportFormat === "webp" ? "image/webp" : "image/png";
        const quality = exportFormat === "png" ? undefined : 0.92;
        canvas.toBlob((b) => (b ? resolve(b) : reject("Canvas error")), mimeType, quality);
      };
      img.onerror = reject;
      img.src = resultUrl;
    });
  }, [resultUrl, bgOption, customColor]);

  const handleDownload = useCallback(async () => {
    try {
      const blob = await getExportUrl();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tsarr-bg-removed.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded!");
    } catch {
      toast.error("Failed to download");
    }
  }, [getExportUrl]);

  const bgColor =
    bgOption === "transparent"
      ? "transparent"
      : bgOption === "white"
      ? "#ffffff"
      : bgOption === "black"
      ? "#000000"
      : customColor;

  return (
    <main
      className="min-h-[100vh] h-fit editor-bg relative pb-20 lg:pb-0"
      onPaste={handlePaste}
      style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <canvas ref={canvasRef} className="hidden" />
      <section className="container mx-auto px-3 sm:px-4 lg:px-0 relative">
        <div className="flex flex-col lg:grid lg:gap-5 lg:grid-cols-[3fr_1.5fr]">
          {/* Preview */}
          <div className="flex flex-col gap-3 py-4">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => setView("split")}
                className={`px-3 py-1 rounded-[10px] text-xs font-medium transition-colors ${
                  view === "split"
                    ? "bg-[#F3F4F6] text-[#0A0A0A]"
                    : "text-[#4B5563] hover:text-[#0A0A0A]"
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setView("original")}
                className={`px-3 py-1 rounded-[10px] text-xs font-medium transition-colors ${
                  view === "original"
                    ? "bg-[#F3F4F6] text-[#0A0A0A]"
                    : "text-[#4B5563] hover:text-[#0A0A0A]"
                }`}
              >
                Original
              </button>
              <button
                onClick={() => setView("result")}
                className={`px-3 py-1 rounded-[10px] text-xs font-medium transition-colors ${
                  view === "result"
                    ? "bg-[#F3F4F6] text-[#0A0A0A]"
                    : "text-[#4B5563] hover:text-[#0A0A0A]"
                }`}
              >
                Result
              </button>
              {resultUrl && (
                <Button
                  onClick={handleDownload}
                  size="sm"
                  className="ml-auto gap-1.5"
                >
                  <BsDownload className="w-3.5 h-3.5" />
                  Download {exportFormat === "jpeg" ? "JPG" : exportFormat.toUpperCase()}
                </Button>
              )}
            </div>

            {!originalUrl ? (
              <div
                className="flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[#E5E7EB] bg-[#EFF6FF] min-h-[420px] cursor-pointer hover:border-[#2563EB]/50 transition-colors"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <BsImage className="w-12 h-12 text-[#4B5563]/20 mb-4" />
                <p className="text-[#4B5563] text-sm mb-1">
                  Drop image here or click to upload
                </p>
                <p className="text-[#4B5563]/60 text-xs">
                  Or paste (Ctrl/Cmd+V) anywhere
                </p>
              </div>
            ) : view === "split" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="relative rounded-[20px] overflow-hidden bg-[#EFF6FF] border border-[#E5E7EB] min-h-[320px] flex items-center justify-center">
                  <span className="absolute top-2 left-2 text-xs font-medium bg-black/40 text-white px-2 py-0.5 rounded-md z-10">
                    Original
                  </span>
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="max-w-full max-h-[400px] object-contain"
                  />
                </div>
                <div
                  className="relative rounded-[20px] overflow-hidden border border-[#E5E7EB] min-h-[320px] flex items-center justify-center"
                  style={{
                    background:
                      bgColor === "transparent"
                        ? "repeating-conic-gradient(#808080 0% 25%, #fff 0% 50%) 0 0 / 16px 16px"
                        : bgColor,
                  }}
                >
                  <span className="absolute top-2 left-2 text-xs font-medium bg-black/40 text-white px-2 py-0.5 rounded-md z-10">
                    Result
                  </span>
                  {resultUrl ? (
                    <img
                      src={resultUrl}
                      alt="Result"
                      className="max-w-full max-h-[400px] object-contain"
                    />
                  ) : isProcessing ? (
                    <div className="text-center px-4">
                      <div className="loading loading-spinner loading-md text-[#2563EB] mb-3" />
                      <p className="text-xs text-[#4B5563]">{progress}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#4B5563]/60">
                      Result will appear here
                    </p>
                  )}
                </div>
              </div>
            ) : view === "original" ? (
              <div className="rounded-[20px] overflow-hidden bg-[#EFF6FF] border border-[#E5E7EB] min-h-[420px] flex items-center justify-center">
                <img
                  src={originalUrl}
                  alt="Original"
                  className="max-w-full max-h-[500px] object-contain"
                />
              </div>
            ) : (
              <div
                className="rounded-[20px] overflow-hidden border border-[#E5E7EB] min-h-[420px] flex items-center justify-center"
                style={{
                  background:
                    bgColor === "transparent"
                      ? "repeating-conic-gradient(#808080 0% 25%, #fff 0% 50%) 0 0 / 16px 16px"
                      : bgColor,
                }}
              >
                {resultUrl ? (
                  <img
                    src={resultUrl}
                    alt="Result"
                    className="max-w-full max-h-[500px] object-contain"
                  />
                ) : (
                  <p className="text-xs text-[#4B5563]/60">No result yet</p>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3 py-4">
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />

            {/* Upload */}
            <div className="bg-[#F3F4F6] rounded-[20px] p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold text-[#4B5563]/60 uppercase tracking-wider mb-3">
                Image
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                variant="secondary"
                className="w-full gap-2"
              >
                <BsUpload className="w-3.5 h-3.5" />
                Upload Image
              </Button>
              {originalUrl && (
                <Button
                  onClick={() => {
                    setOriginalUrl("");
                    setResultUrl("");
                  }}
                  size="sm"
                  variant="ghost"
                  className="w-full mt-2 text-red-400 hover:text-red-600"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Remove BG button */}
            <Button
              onClick={handleRemove}
              disabled={!originalUrl || isProcessing}
              className="gap-2 w-full"
            >
              {isProcessing ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  {progress || "Processing..."}
                </>
              ) : (
                <>
                  <MdOutlineAutoFixHigh className="w-4 h-4" />
                  Remove Background
                </>
              )}
            </Button>

            {/* Background color */}
            <div className="bg-[#F3F4F6] rounded-[20px] p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold text-[#4B5563]/60 uppercase tracking-wider mb-3">
                Background
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(["transparent", "white", "black", "custom"] as BgOption[]).map(
                  (opt) => (
                    <Button
                      key={opt}
                      size="sm"
                      variant={bgOption === opt ? "default" : "secondary"}
                      className="capitalize"
                      onClick={() => setBgOption(opt)}
                    >
                      {opt}
                    </Button>
                  )
                )}
              </div>
              {bgOption === "custom" && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer border border-[#E5E7EB]"
                  />
                  <span className="text-xs font-mono text-[#4B5563]">
                    {customColor.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Export Format */}
            {resultUrl && (
              <div className="bg-[#F3F4F6] rounded-[20px] p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold text-[#4B5563]/60 uppercase tracking-wider mb-3">Export Format</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["png", "webp", "jpeg"] as ExportFormat[]).map((fmt) => (
                    <Button
                      key={fmt}
                      size="sm"
                      variant={exportFormat === fmt ? "default" : "secondary"}
                      className="uppercase text-xs"
                      onClick={() => setExportFormat(fmt)}
                    >
                      {fmt === "jpeg" ? "JPG" : fmt.toUpperCase()}
                    </Button>
                  ))}
                </div>
                {exportFormat === "jpeg" && bgOption === "transparent" && (
                  <p className="text-xs text-amber-600 mt-2">JPG doesn't support transparency — white bg will be used</p>
                )}
              </div>
            )}

            {/* Download */}
            {resultUrl && (
              <Button
                onClick={handleDownload}
                className="gap-2 w-full bg-green-600 hover:bg-green-700"
              >
                <BsDownload className="w-4 h-4" />
                Download {exportFormat === "jpeg" ? "JPG" : exportFormat.toUpperCase()}
              </Button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default BackgroundRemoverLayout;
