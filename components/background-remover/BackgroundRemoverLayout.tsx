import { useState, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
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

type BgOption = "transparent" | "white" | "black" | "custom";

const BackgroundRemoverLayout: React.FC = () => {
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [progress, setProgress] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [bgOption, setBgOption] = useState<BgOption>("transparent");
  const [customColor, setCustomColor] = useState("#ffffff");
  const [view, setView] = useState<"split" | "original" | "result">("split");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    const url = URL.createObjectURL(file);
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
        canvas.toBlob((b) => (b ? resolve(b) : reject("Canvas error")), "image/png");
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
      a.download = "tsarr-bg-removed.png";
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
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  view === "split"
                    ? "bg-base-300 text-base-content"
                    : "text-base-content/50 hover:text-base-content"
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setView("original")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  view === "original"
                    ? "bg-base-300 text-base-content"
                    : "text-base-content/50 hover:text-base-content"
                }`}
              >
                Original
              </button>
              <button
                onClick={() => setView("result")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  view === "result"
                    ? "bg-base-300 text-base-content"
                    : "text-base-content/50 hover:text-base-content"
                }`}
              >
                Result
              </button>
              {resultUrl && (
                <button
                  onClick={handleDownload}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-content text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  <BsDownload className="w-3.5 h-3.5" />
                  Download PNG
                </button>
              )}
            </div>

            {!originalUrl ? (
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
            ) : view === "split" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="relative rounded-2xl overflow-hidden bg-base-200/40 border border-base-300 min-h-[320px] flex items-center justify-center">
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
                  className="relative rounded-2xl overflow-hidden border border-base-300 min-h-[320px] flex items-center justify-center"
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
                      <div className="loading loading-spinner loading-md text-primary mb-3" />
                      <p className="text-xs text-base-content/60">{progress}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-base-content/30">
                      Result will appear here
                    </p>
                  )}
                </div>
              </div>
            ) : view === "original" ? (
              <div className="rounded-2xl overflow-hidden bg-base-200/40 border border-base-300 min-h-[420px] flex items-center justify-center">
                <img
                  src={originalUrl}
                  alt="Original"
                  className="max-w-full max-h-[500px] object-contain"
                />
              </div>
            ) : (
              <div
                className="rounded-2xl overflow-hidden border border-base-300 min-h-[420px] flex items-center justify-center"
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
                  <p className="text-xs text-base-content/30">No result yet</p>
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

            {/* Upload */}
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
              {originalUrl && (
                <button
                  onClick={() => {
                    setOriginalUrl("");
                    setResultUrl("");
                  }}
                  className="btn btn-sm btn-ghost w-full mt-2 text-error/70 hover:text-error"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Remove BG button */}
            <button
              onClick={handleRemove}
              disabled={!originalUrl || isProcessing}
              className="btn btn-primary gap-2 w-full"
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
            </button>

            {/* Background color */}
            <div className="bg-base-200/60 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-3">
                Background
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(["transparent", "white", "black", "custom"] as BgOption[]).map(
                  (opt) => (
                    <button
                      key={opt}
                      onClick={() => setBgOption(opt)}
                      className={`btn btn-sm capitalize ${
                        bgOption === opt ? "btn-primary" : "btn-outline"
                      }`}
                    >
                      {opt}
                    </button>
                  )
                )}
              </div>
              {bgOption === "custom" && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer border border-base-300"
                  />
                  <span className="text-xs font-mono text-base-content/70">
                    {customColor.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Download */}
            {resultUrl && (
              <button
                onClick={handleDownload}
                className="btn btn-success gap-2 w-full"
              >
                <BsDownload className="w-4 h-4" />
                Download PNG
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default BackgroundRemoverLayout;
