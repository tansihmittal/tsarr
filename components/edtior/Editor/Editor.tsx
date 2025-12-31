import { useEditorContext } from "@/context/Editor";
import Image from "next/image";
import { ChangeEvent, ReactNode, useRef, useEffect, useState } from "react";
import { BiReset } from "react-icons/bi";
import { BsBookmark, BsClipboard, BsRepeat, BsShare } from "react-icons/bs";
import { TfiExport } from "react-icons/tfi";
import DropZone from "./DropZone";
import EditorWrapper from "./EditorWrapper";
import ImageWrapper from "./ImageWrapper";
import {
  copyToClipboard,
  downloadimageJpeg,
  downloadimagePng,
  downloadimageSvg,
  getImageBlob,
} from "./downloads";
import { toast } from "react-hot-toast";
import DrawingCanvas from "./DrawingCanvas";
import { FaPencilAlt } from "react-icons/fa";
import SaveLocalPresetModal from "@/components/common/SaveLocalPresetModal";
import { useLocalPresets } from "@/hooks/useLocalPresets";
import { PresetSettings } from "@/interface";

interface Props {}

const Editor: React.FC<Props> = () => {
  const { 
    updateData, 
    resetChanges, 
    selectedImage, 
    noise, 
    watermark, 
    showAnnotations,
    currentBackground,
    currentBackgroundType,
    scale,
    borderRadius,
    canvasRoundness,
    padding,
    left,
    right,
    tilt,
    rotate,
    aspectRatio,
    currentBoxShadow,
    selectedFrame,
    imageDimensions,
  } = useEditorContext();

  const imageToDownload = useRef<HTMLDivElement | null>(null);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { presets, savePreset } = useLocalPresets();

  // Share functionality
  const handleShare = async () => {
    if (!imageToDownload.current || !selectedImage) return;
    
    setIsSharing(true);
    try {
      const blob = await getImageBlob(imageToDownload.current, 2);
      if (!blob) {
        toast.error("Failed to generate image");
        setIsSharing(false);
        return;
      }

      const file = new File([blob], "tsarr-creation.png", { type: "image/png" });
      const shareText = "Created with tsarr.in - Free Screenshot Editor ✨";
      const shareUrl = "https://tsarr.in";

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "My Creation - tsarr.in",
          text: shareText,
          url: shareUrl,
          files: [file]
        });
        toast.success("Shared successfully!");
      } else if (navigator.share) {
        await navigator.share({
          title: "My Creation - tsarr.in",
          text: shareText,
          url: shareUrl
        });
        toast.success("Link shared!");
      } else {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
        toast.success("Image copied to clipboard!");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error("Share failed");
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Get current settings for saving as preset
  const getCurrentSettings = (): PresetSettings => ({
    currentBackground,
    currentBackgroundType,
    scale,
    borderRadius,
    canvasRoundness,
    padding,
    left,
    right,
    tilt,
    rotate,
    aspectRatio,
    currentBoxShadow,
    noise,
    watermark,
    selectedFrame,
  });

  const handleSavePreset = (name: string) => {
    const settings = getCurrentSettings();
    return savePreset(name, settings);
  };

  // Handle clipboard paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const fileUrl = URL.createObjectURL(blob);
            updateData && updateData("selectedImage", fileUrl);
            
            // Get image dimensions
            const img = new window.Image();
            img.onload = () => {
              updateData && updateData("imageDimensions", { width: img.width, height: img.height });
            };
            img.src = fileUrl;
            
            toast.success("Image pasted from clipboard!");
          }
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [updateData]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      updateData && updateData("selectedImage", fileUrl);
      
      // Get image dimensions
      const img = new window.Image();
      img.onload = () => {
        updateData && updateData("imageDimensions", { width: img.width, height: img.height });
      };
      img.src = fileUrl;
    }
  };

  const handleReset = () => {
    const confirmation = confirm("Confirm Reset - All your changes will be lost!");
    if (confirmation) {
      resetChanges && resetChanges();
    }
  };

  const OptionButtonOutline = ({
    title,
    onTap,
    children,
    disabled,
  }: {
    children: ReactNode;
    title: string;
    onTap?: () => void;
    disabled?: boolean;
  }) => {
    return (
      <div
        className={`text-primary-content bg-base-100 py-2.5 px-4 flex items-center justify-center gap-2.5 border border-base-200 rounded-lg transition-all duration-200 ${
          disabled 
            ? "opacity-50 cursor-not-allowed" 
            : "hover:bg-base-200/50 hover:border-primary/20 hover:shadow-sm cursor-pointer press-effect"
        }`}
        onClick={disabled ? undefined : onTap}
      >
        <span className="text-lg">{children}</span>
        <span className="font-medium">{title}</span>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-start flex-col h-full w-full">
      {/* Top options */}
      <div
        style={{ pointerEvents: selectedImage ? "auto" : "none" }}
        className={`grid grid-cols-2 gap-2 w-full mb-3 lg:flex lg:justify-end lg:items-center ${
          selectedImage ? "opacity-100" : "opacity-80"
        }`}
      >
        <div className="dropdown">
          <label tabIndex={0}>
            <OptionButtonOutline title="Export Image">
              <TfiExport />
            </OptionButtonOutline>
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content p-2 mt-1 menu bg-base-100 w-full min-w-[262px] border-2 rounded-md"
          >
            <li onClick={() => downloadimagePng(imageToDownload.current, 1)}>
              <a>Export as PNG 1x</a>
            </li>
            <li onClick={() => downloadimagePng(imageToDownload.current, 2)}>
              <a>Export as PNG 2x</a>
            </li>
            <li onClick={() => downloadimagePng(imageToDownload.current, 4)}>
              <a>Export as PNG 4x</a>
            </li>
            <li onClick={() => downloadimageSvg(imageToDownload.current, 2)}>
              <a>Export as SVG</a>
            </li>
            <li onClick={() => downloadimageJpeg(imageToDownload.current, 2)}>
              <a>Export as JPEG</a>
            </li>
          </ul>
        </div>

        <OptionButtonOutline
          title="Copy to Clipboard"
          onTap={() => copyToClipboard(imageToDownload.current)}
          disabled={!selectedImage}
        >
          <BsClipboard className="icon" />
        </OptionButtonOutline>

        <label htmlFor="selected-image-reset">
          <input
            type="file"
            hidden
            accept="image/*"
            id="selected-image-reset"
            onChange={(e) => handleImageChange(e)}
          />
          <OptionButtonOutline title="Reset Image">
            <BsRepeat className="icon" />
          </OptionButtonOutline>
        </label>

        <OptionButtonOutline title="Reset Canvas" onTap={handleReset}>
          <BiReset className="icon" />
        </OptionButtonOutline>

        <OptionButtonOutline
          title="Save Preset"
          onTap={() => setShowSavePresetModal(true)}
        >
          <BsBookmark className="icon" />
        </OptionButtonOutline>

        <OptionButtonOutline
          title={showAnnotations ? "Close Drawing" : "Draw/Annotate"}
          onTap={() => updateData && updateData("showAnnotations", !showAnnotations)}
        >
          <FaPencilAlt className={showAnnotations ? "text-primary" : "icon"} />
        </OptionButtonOutline>

        <div
          className={`text-white bg-gradient-to-r from-indigo-500 to-purple-600 py-2.5 px-4 flex items-center justify-center gap-2.5 rounded-lg transition-all duration-200 ${
            !selectedImage || isSharing
              ? "opacity-50 cursor-not-allowed" 
              : "hover:from-indigo-600 hover:to-purple-700 cursor-pointer press-effect"
          }`}
          onClick={selectedImage && !isSharing ? handleShare : undefined}
        >
          {isSharing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="font-medium">Sharing...</span>
            </>
          ) : (
            <>
              <BsShare className="text-lg" />
              <span className="font-medium">Share</span>
            </>
          )}
        </div>
      </div>

      {/* Image Dimensions Display */}
      {selectedImage && imageDimensions.width > 0 && (
        <div className="flex justify-end mb-2 w-full">
          <span className="text-xs text-gray-500 bg-base-200 px-3 py-1 rounded-full">
            {imageDimensions.width} × {imageDimensions.height} px
          </span>
        </div>
      )}

      {/* Editor Canvas Area */}
      <div className="relative w-full min-h-[500px] lg:min-h-[600px] flex items-center justify-center rounded-2xl bg-base-200/30 border border-base-200/80 overflow-hidden">
        <EditorWrapper imageRef={imageToDownload}>
          <>
            {noise && (
              <div className="absolute z-0 inset-0 h-full w-full opacity-20 bg-repeat bg-[length:20%] bg-[url('/images/noise.png')]" />
            )}
            {selectedImage ? (
              <ImageWrapper>
                <Image
                  priority
                  src={selectedImage}
                  height={200}
                  width={200}
                  unoptimized
                  alt=""
                  className="block bg-contain w-full h-full"
                />
              </ImageWrapper>
            ) : (
              <DropZone />
            )}
            {watermark.visible && (
              <span
                className="text-primary-content absolute bottom-3 right-4 z-20 color-base-100 opacity-90 font-medium outline-none font-sans text-[1rem]"
                spellCheck={false}
                suppressContentEditableWarning={true}
                contentEditable
              >
                {watermark.value}
              </span>
            )}
            {showAnnotations && <DrawingCanvas />}
          </>
        </EditorWrapper>
      </div>

      {/* Save Preset Modal */}
      <SaveLocalPresetModal
        isOpen={showSavePresetModal}
        onClose={() => setShowSavePresetModal(false)}
        onSave={handleSavePreset}
        existingNames={presets.map((p) => p.name)}
      />
    </div>
  );
};

export default Editor;
