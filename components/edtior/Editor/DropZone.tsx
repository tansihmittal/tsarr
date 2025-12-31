import { useEditorContext } from "@/context/Editor";
import { ChangeEvent, useCallback, useRef, useState } from "react";
import { BsUpload, BsClipboard, BsLink45Deg } from "react-icons/bs";

import { FileRejection, useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";

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
        errors.map((e) => console.log(e));
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
    filePicker.current?.click();
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    setLoading(true);
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);

      if (updateData) {
        updateData("selectedImage", fileUrl);
        
        // Get image dimensions
        const img = new window.Image();
        img.onload = () => {
          updateData("imageDimensions", { width: img.width, height: img.height });
        };
        img.src = fileUrl;
      }
    }
    setLoading(false);
    // Reset input value to allow re-uploading same file
    e.target.value = '';
  };

  // Capture screenshot from URL
  const handleUrlCapture = async () => {
    if (!urlInput.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    // Validate URL
    let url = urlInput.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    setIsCapturing(true);
    const loadingToast = toast.loading("Capturing screenshot...");

    try {
      const deviceSizes = {
        desktop: { width: 1920, height: 1080 },
        tablet: { width: 768, height: 1024 },
        mobile: { width: 375, height: 812 },
      };

      const dimensions = customWidth && customHeight 
        ? { width: Number(customWidth), height: Number(customHeight) }
        : deviceSizes[captureDevice];

      // Use microlink API for screenshots with device scale factor for better quality
      let apiUrl: string;
      const baseParams = `url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=${dimensions.width}&viewport.height=${dimensions.height}&viewport.deviceScaleFactor=2`;
      
      if (captureFullPage) {
        apiUrl = `https://api.microlink.io/?${baseParams}&screenshot.fullPage=true`;
      } else {
        apiUrl = `https://api.microlink.io/?${baseParams}`;
      }

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error("Failed to capture screenshot");
      }

      // The response is the actual image, convert to blob URL
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      // Get actual image dimensions from the loaded image
      const img = new window.Image();
      img.onload = () => {
        if (updateData) {
          // Use actual image dimensions, not requested dimensions
          updateData("imageDimensions", { width: img.naturalWidth, height: img.naturalHeight });
          updateData("selectedImage", imageUrl);
        }
      };
      img.onerror = () => {
        // Fallback if image fails to load dimensions
        if (updateData) {
          updateData("selectedImage", imageUrl);
          updateData("imageDimensions", { width: dimensions.width, height: dimensions.height });
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
    <div className="p-6 sm:p-8 bg-base-100 relative z-20 rounded-2xl shadow-xl shadow-black/5 animate-fade-in-scale">
      {/* header */}
      <div className="flex gap-1 flex-col mb-6">
        <div className="flex items-start gap-4 sm:gap-6">
          <h2 className="font-bold text-2xl text-primary-content bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text">
            Upload and Start Editing
          </h2>
          <div className="text-2xl text-primary animate-pulse-soft">✦</div>
        </div>
        <span className="text-sm text-gray-500 mt-1">
          Transform boring screenshots into stunning visuals
        </span>
      </div>
      {/* upload */}
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center gap-3 aspect-[2/1] p-8 border-2 rounded-2xl border-dashed transition-all duration-300 cursor-pointer ${
          isDragActive 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-gray-300 hover:border-primary/50 hover:bg-primary/5"
        }`}
      >
        <div className={`p-4 rounded-full bg-primary/10 transition-transform duration-300 ${isDragActive ? "scale-110" : ""}`}>
          <BsUpload
            className="text-primary text-2xl"
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
          <span className="text-primary hover:underline cursor-pointer" onClick={handleFilePickerClick}>
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
        <button
          disabled={loading}
          className="btn btn-primary rounded-xl font-semibold w-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5"
          onClick={handleFilePickerClick}
        >
          {isDragActive ? "DROP TO UPLOAD" : "START EDITING"}
        </button>
        <button
          disabled={loading}
          className="btn btn-outline rounded-xl font-semibold w-full hover:shadow-md transition-all duration-200 gap-2"
          onClick={() => setShowUrlModal(true)}
        >
          <BsLink45Deg className="text-lg" />
          FROM URL
        </button>
      </div>

      {/* URL Screenshot Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-base-100 rounded-2xl shadow-2xl p-8 w-full max-w-xl mx-4 animate-fade-in-scale">
            <h3 className="text-xl font-semibold text-primary-content mb-6">
              Screenshot from URL
            </h3>
            
            {/* URL Input */}
            <div className="mb-5">
              <label className="text-sm text-gray-500 font-medium block mb-2">Website URL</label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3.5 border-2 border-base-200 rounded-xl focus:border-primary focus:outline-none transition-colors bg-base-100 text-base"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleUrlCapture()}
              />
            </div>

            {/* Device Selection */}
            <div className="mb-5">
              <label className="text-sm text-gray-500 font-medium block mb-2">Device View</label>
              <div className="grid grid-cols-3 gap-3">
                {(["desktop", "tablet", "mobile"] as const).map((device) => (
                  <button
                    key={device}
                    onClick={() => setCaptureDevice(device)}
                    className={`py-3 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                      captureDevice === device
                        ? "bg-primary text-primary-content shadow-md"
                        : "bg-base-200 hover:bg-base-300"
                    }`}
                  >
                    {device}
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {captureDevice === "desktop" && "1920 × 1080"}
                {captureDevice === "tablet" && "768 × 1024"}
                {captureDevice === "mobile" && "375 × 812"}
              </div>
            </div>

            {/* Full Page Option */}
            <div className="mb-5 flex items-center justify-between py-2">
              <label className="text-sm text-primary-content font-medium">Capture full page</label>
              <label className="custom-toggle">
                <input
                  type="checkbox"
                  checked={captureFullPage}
                  onChange={(e) => setCaptureFullPage(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            {/* Custom Size */}
            <div className="mb-5">
              <label className="text-sm text-gray-500 font-medium block mb-2">Custom Size (optional)</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Width"
                  className="w-full px-4 py-3 border-2 border-base-200 rounded-lg focus:border-primary focus:outline-none text-sm bg-base-100"
                />
                <input
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Height"
                  className="w-full px-4 py-3 border-2 border-base-200 rounded-lg focus:border-primary focus:outline-none text-sm bg-base-100"
                />
              </div>
              {(customWidth || customHeight) && (
                <button
                  onClick={() => { setCustomWidth(""); setCustomHeight(""); }}
                  className="mt-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Clear custom size
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => {
                  setShowUrlModal(false);
                  setUrlInput("");
                }}
                className="px-6 py-2.5 text-gray-600 hover:bg-base-200 rounded-lg transition-colors font-medium"
                disabled={isCapturing}
              >
                Cancel
              </button>
              <button
                onClick={handleUrlCapture}
                disabled={isCapturing || !urlInput.trim()}
                className="px-8 py-2.5 bg-primary text-primary-content rounded-lg hover:bg-primary-focus transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {isCapturing ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Capturing...
                  </>
                ) : (
                  "Capture"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DropZone;
