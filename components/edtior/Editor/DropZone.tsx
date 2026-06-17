import { useEditorContext } from "@/context/Editor";
import { ChangeEvent, useCallback, useRef, useState } from "react";
import { BsUpload, BsClipboard, BsLink45Deg, BsStars } from "react-icons/bs";

import { FileRejection, useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {}

const DropZone: React.FC<Props> = () => {
  const { updateData } = useEditorContext();
  const filePicker = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [captureDevice, setCaptureDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [captureFullPage, setCaptureFullPage] = useState(false);
  const [customWidth, setCustomWidth] = useState<number | "">("");
  const [customHeight, setCustomHeight] = useState<number | "">("");
  const [isCapturing, setIsCapturing] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setLoading(true);
      const errors = rejectedFiles[0]?.errors;

      if (errors && errors?.length > 0) {
        errors.forEach((e) => console.error(e));
        errors.map((e) =>
          e.code == "file-invalid-type"
            ? toast("oops! Try uploading images.")
            : toast("oops! Size does matter here.")
        );
        setLoading(false);
        return;
      }

      const fileUrl = URL.createObjectURL(acceptedFiles[0]);

      if (updateData) {
        updateData("selectedImage", fileUrl);

        // Get image dimensions
        const img = new window.Image();
        img.onload = () => {
          updateData("imageDimensions", { width: img.width, height: img.height });
        };
        img.src = fileUrl;
      }

      setLoading(false);
    },
    [updateData]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 30 * 1024 * 1024,
  });

  const handleFilePickerClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    // Reset the input value before clicking to ensure change event fires
    if (filePicker.current) {
      filePicker.current.value = '';
      filePicker.current.click();
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const fileUrl = URL.createObjectURL(file);

    if (updateData) {
      // Set image immediately
      updateData("selectedImage", fileUrl);

      // Get image dimensions
      const img = new window.Image();
      img.onload = () => {
        updateData("imageDimensions", { width: img.width, height: img.height });
        setLoading(false);
      };
      img.onerror = () => {
        setLoading(false);
      };
      img.src = fileUrl;
    } else {
      setLoading(false);
    }

    // Reset input value to allow re-uploading same file
    e.target.value = '';
  };

  // Capture screenshot from URL
  const handleUrlCapture = async () => {
    if (!urlInput.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    let url = urlInput.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    setIsCapturing(true);
    const loadingToast = toast.loading("Capturing screenshot...");

    try {
      const body: Record<string, unknown> = {
        url,
        device: captureDevice,
        fullPage: captureFullPage,
      };
      if (customWidth && customHeight) {
        body.width = Number(customWidth);
        body.height = Number(customHeight);
      }

      const response = await fetch("/api/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to capture screenshot");
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      const img = new window.Image();
      img.onload = () => {
        if (updateData) {
          updateData("imageDimensions", { width: img.naturalWidth, height: img.naturalHeight });
          updateData("selectedImage", imageUrl);
        }
      };
      img.onerror = () => {
        if (updateData) {
          updateData("selectedImage", imageUrl);
        }
      };
      img.src = imageUrl;
      toast.success("Screenshot captured!", { id: loadingToast });
      setShowUrlModal(false);
      setUrlInput("");
    } catch (error) {
      console.error("Screenshot error:", error);
      toast.error("Failed to capture screenshot. Please check the URL.", { id: loadingToast });
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 bg-white relative z-20 rounded-[20px] shadow-xl shadow-black/5 animate-fade-in-scale">
      {/* header */}
      <div className="flex gap-1 flex-col mb-6">
        <div className="flex items-start gap-4 sm:gap-6">
          <h2 className="font-bold text-2xl text-[#0A0A0A] bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text">
            Upload and Start Editing
          </h2>
          <BsStars className="text-xl text-[#2563EB] animate-pulse-soft" />
        </div>
        <span className="text-sm text-gray-500 mt-1">
          Transform boring screenshots into stunning visuals
        </span>
      </div>

      {/* upload */}
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center gap-3 aspect-[2/1] p-8 border-2 rounded-[20px] border-dashed transition-all duration-300 cursor-pointer ${
          isDragActive
            ? "border-[#2563EB] bg-[#2563EB]/5 scale-[1.02]"
            : "border-gray-300 hover:border-[#2563EB]/50 hover:bg-[#2563EB]/5"
        }`}
      >
        <div className={`p-4 rounded-full bg-[#2563EB]/10 transition-transform duration-300 ${isDragActive ? "scale-110" : ""}`}>
          <BsUpload
            className="text-[#2563EB] text-2xl"
            onClick={handleFilePickerClick}
          />
        </div>
        <input
          type="file"
          hidden
          accept="image/*"
          onChange={handleImageUpload}
          {...getInputProps()}
        />
        <h3 className="text-gray-700 font-medium">
          <span className="text-[#2563EB] hover:underline cursor-pointer" onClick={handleFilePickerClick}>
            Click to upload
          </span>{" "}
          or drag and drop
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <BsClipboard className="text-xs" />
          <span>or press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl+V</kbd> to paste</span>
        </div>
        <span className="text-xs text-gray-400">PNG, JPG, WEBP up to 30MB</span>
      </div>

      {/* button wrapper */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <input
          type="file"
          hidden
          accept="image/*"
          onChange={handleImageUpload}
          ref={filePicker}
        />
        <Button
          disabled={loading}
          className="rounded-[14px] font-semibold w-full shadow-lg shadow-[#2563EB]/20 hover:shadow-xl hover:shadow-[#2563EB]/30 transition-all duration-200 hover:-translate-y-0.5"
          onClick={handleFilePickerClick}
        >
          {isDragActive ? "DROP TO UPLOAD" : "START EDITING"}
        </Button>
        <Button
          disabled={loading}
          variant="secondary"
          className="rounded-[14px] font-semibold w-full hover:shadow-md transition-all duration-200 gap-2"
          onClick={() => setShowUrlModal(true)}
        >
          <BsLink45Deg className="text-lg" />
          FROM URL
        </Button>
      </div>

      {/* URL Screenshot Modal */}
      <Dialog open={showUrlModal} onOpenChange={(open) => {
        if (!open) {
          setShowUrlModal(false);
          setUrlInput("");
        }
      }}>
        <DialogContent className="w-full max-w-md p-6 gap-0">
          <DialogHeader className="mb-5">
            <DialogTitle className="text-lg font-semibold text-[#0A0A0A]">
              Screenshot from URL
            </DialogTitle>
          </DialogHeader>

          {/* URL Input */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 font-medium block mb-1.5">Website URL</label>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-[12px] focus:border-[#2563EB] focus:outline-none transition-colors bg-white text-sm"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleUrlCapture()}
            />
          </div>

          {/* Device Selection */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 font-medium block mb-1.5">Device View</label>
            <div className="grid grid-cols-3 gap-2">
              {(["desktop", "tablet", "mobile"] as const).map((device) => (
                <button
                  key={device}
                  onClick={() => setCaptureDevice(device)}
                  className={`py-2.5 rounded-[10px] text-xs font-medium transition-all capitalize ${
                    captureDevice === device
                      ? "bg-[#2563EB] text-white shadow-sm"
                      : "bg-[#F3F4F6] hover:bg-[#E5E7EB] text-gray-700"
                  }`}
                >
                  {device}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {captureDevice === "desktop" && "1920 × 1080"}
              {captureDevice === "tablet" && "768 × 1024"}
              {captureDevice === "mobile" && "375 × 812"}
            </p>
          </div>

          {/* Full Page Option */}
          <div className="flex items-center justify-between mb-4 px-4 py-3 bg-[#F9FAFB] rounded-[12px]">
            <span className="text-sm text-[#0A0A0A] font-medium">Capture full page</span>
            <Switch checked={captureFullPage} onCheckedChange={setCaptureFullPage} />
          </div>

          {/* Custom Size */}
          <div className="mb-6">
            <label className="text-xs text-gray-500 font-medium block mb-1.5">
              Custom Size <span className="font-normal">(optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value ? Number(e.target.value) : "")}
                placeholder="Width"
                className="w-full px-4 py-2.5 border-2 border-[#E5E7EB] rounded-[12px] focus:border-[#2563EB] focus:outline-none text-sm bg-white transition-colors"
              />
              <input
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value ? Number(e.target.value) : "")}
                placeholder="Height"
                className="w-full px-4 py-2.5 border-2 border-[#E5E7EB] rounded-[12px] focus:border-[#2563EB] focus:outline-none text-sm bg-white transition-colors"
              />
            </div>
            {(customWidth || customHeight) && (
              <button
                onClick={() => { setCustomWidth(""); setCustomHeight(""); }}
                className="mt-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Clear custom size
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => { setShowUrlModal(false); setUrlInput(""); }}
              disabled={isCapturing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUrlCapture}
              disabled={isCapturing || !urlInput.trim()}
              className="gap-2 min-w-[100px]"
            >
              {isCapturing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Capturing...
                </>
              ) : (
                "Capture"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DropZone;
