import { useState, useCallback, useRef, useEffect } from "react";
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
import { IoMdOptions } from "react-icons/io";
import { MdOutlineAutoFixHigh } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ControlPanelHeading from "../common/ControlPanelHeading";

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

  // Revoke blob URLs when they change or on unmount
  useEffect(() => {
    const url = originalUrl;
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [originalUrl]);

  useEffect(() => {
    const url = resultUrl;
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [resultUrl]);

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
                    ? "bg-[#F3F4F6] dark:bg-gray-700 text-[#0A0A0A] dark:text-white"
                    : "text-[#4B5563] dark:text-gray-400 hover:text-[#0A0A0A] dark:text-white dark:hover:text-white"
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setView("original")}
                className={`px-3 py-1 rounded-[10px] text-xs font-medium transition-colors ${
                  view === "original"
                    ? "bg-[#F3F4F6] dark:bg-gray-700 text-[#0A0A0A] dark:text-white"
                    : "text-[#4B5563] dark:text-gray-400 hover:text-[#0A0A0A] dark:text-white dark:hover:text-white"
                }`}
              >
                Original
              </button>
              <button
                onClick={() => setView("result")}
                className={`px-3 py-1 rounded-[10px] text-xs font-medium transition-colors ${
                  view === "result"
                    ? "bg-[#F3F4F6] dark:bg-gray-700 text-[#0A0A0A] dark:text-white"
                    : "text-[#4B5563] dark:text-gray-400 hover:text-[#0A0A0A] dark:text-white dark:hover:text-white"
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
                className="flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[#E5E7EB] dark:border-gray-700 bg-[#EFF6FF] dark:bg-blue-900/20 min-h-[420px] cursor-pointer hover:border-[#2563EB]/50 transition-colors"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <BsImage className="w-12 h-12 text-[#4B5563]/20 dark:text-gray-400/20 mb-4" />
                <p className="text-[#4B5563] dark:text-gray-400 text-sm mb-1">
                  Drop image here or click to upload
                </p>
                <p className="text-[#4B5563]/60 dark:text-gray-400/60 text-xs">
                  Or paste (Ctrl/Cmd+V) anywhere
                </p>
              </div>
            ) : view === "split" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="relative rounded-[20px] overflow-hidden bg-[#EFF6FF] dark:bg-blue-900/20 border border-[#E5E7EB] dark:border-gray-700 min-h-[320px] flex items-center justify-center">
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
                  className="relative rounded-[20px] overflow-hidden border border-[#E5E7EB] dark:border-gray-700 min-h-[320px] flex items-center justify-center"
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
                      <p className="text-xs text-[#4B5563] dark:text-gray-400">{progress}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#4B5563]/60 dark:text-gray-400/60">
                      Result will appear here
                    </p>
                  )}
                </div>
              </div>
            ) : view === "original" ? (
              <div className="rounded-[20px] overflow-hidden bg-[#EFF6FF] dark:bg-blue-900/20 border border-[#E5E7EB] dark:border-gray-700 min-h-[420px] flex items-center justify-center">
                <img
                  src={originalUrl}
                  alt="Original"
                  className="max-w-full max-h-[500px] object-contain"
                />
              </div>
            ) : (
              <div
                className="rounded-[20px] overflow-hidden border border-[#E5E7EB] dark:border-gray-700 min-h-[420px] flex items-center justify-center"
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
                  <p className="text-xs text-[#4B5563]/60 dark:text-gray-400/60">No result yet</p>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <section className="flex flex-col transition-opacity duration-300 opacity-100">
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
            <Tabs defaultValue="options">
              <TabsList className="w-full grid grid-cols-2 rounded-[12px] bg-[#F3F4F6] dark:bg-gray-800 mb-3">
                <TabsTrigger value="options" className="gap-1.5 rounded-[10px] text-xs"><IoMdOptions className="w-3.5 h-3.5" /> Options</TabsTrigger>
                <TabsTrigger value="output" className="gap-1.5 rounded-[10px] text-xs"><BsDownload className="w-3.5 h-3.5" /> Export</TabsTrigger>
              </TabsList>

              <TabsContent value="options">
                <div className="rounded-[14px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
                  <ControlPanelHeading title="Image" />
                  <div className="p-4 border-b border-[#E5E7EB]/60 dark:border-gray-700/60">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      size="sm"
                      variant="secondary"
                      className="w-full gap-2"
                    >
                      <BsUpload className="w-3.5 h-3.5" />
                      {originalUrl ? "Change Image" : "Upload Image"}
                    </Button>
                    {originalUrl && (
                      <Button
                        onClick={() => { setOriginalUrl(""); setResultUrl(""); }}
                        size="sm"
                        variant="ghost"
                        className="w-full mt-2 text-red-400 hover:text-red-600"
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  <ControlPanelHeading title="Remove Background" />
                  <div className="p-4 border-b border-[#E5E7EB]/60 dark:border-gray-700/60">
                    <Button
                      onClick={handleRemove}
                      disabled={!originalUrl || isProcessing}
                      className="gap-2 w-full shadow-lg shadow-[#2563EB]/20"
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
                  </div>

                  <ControlPanelHeading title="Background Color" />
                  <div className="p-4 border-b border-[#E5E7EB]/60 dark:border-gray-700/60">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {(["transparent", "white", "black", "custom"] as BgOption[]).map((opt) => (
                        <Button
                          key={opt}
                          size="sm"
                          variant={bgOption === opt ? "default" : "secondary"}
                          className="capitalize"
                          onClick={() => setBgOption(opt)}
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                    {bgOption === "custom" && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="color"
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          className="w-10 h-8 rounded cursor-pointer border border-[#E5E7EB] dark:border-gray-700"
                        />
                        <span className="text-xs font-mono text-[#4B5563] dark:text-gray-400">
                          {customColor.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="output">
                <div className="rounded-[14px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
                  <ControlPanelHeading title="Format" />
                  <div className="p-4 border-b border-[#E5E7EB]/60 dark:border-gray-700/60">
                    <div className="grid grid-cols-3 gap-2">
                      {(["png", "webp", "jpeg"] as ExportFormat[]).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setExportFormat(fmt)}
                          className={`p-3 rounded-[10px] text-center transition-all ${exportFormat === fmt ? "bg-[#2563EB] text-white" : "bg-[#F9FAFB] dark:bg-gray-800 hover:bg-[#F3F4F6] dark:hover:bg-gray-700 dark:bg-gray-800"}`}
                        >
                          <div className="font-semibold text-sm">{fmt === "jpeg" ? "JPG" : fmt.toUpperCase()}</div>
                          <div className={`text-xs ${exportFormat === fmt ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}>
                            {fmt === "png" ? "Lossless" : fmt === "webp" ? "Modern" : "Smaller"}
                          </div>
                        </button>
                      ))}
                    </div>
                    {exportFormat === "jpeg" && bgOption === "transparent" && (
                      <p className="text-xs text-amber-600 mt-3">JPG doesn&apos;t support transparency — white bg will be used</p>
                    )}
                  </div>

                  <ControlPanelHeading title="Download" />
                  <div className="p-4 border-b border-[#E5E7EB]/60 dark:border-gray-700/60">
                    <Button
                      onClick={handleDownload}
                      disabled={!resultUrl}
                      className="gap-2 w-full shadow-lg shadow-[#2563EB]/20"
                    >
                      <BsDownload className="w-4 h-4" />
                      Download {exportFormat === "jpeg" ? "JPG" : exportFormat.toUpperCase()}
                    </Button>
                    {!resultUrl && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">Remove background first to download</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </section>
    </main>
  );
};

export default BackgroundRemoverLayout;
