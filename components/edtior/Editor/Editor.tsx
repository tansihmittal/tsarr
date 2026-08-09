import { useEditorContext } from "@/context/Editor";
import ToolbarButton from "../../common/ToolbarButton";
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
  downloadimageWebp,
  getImageBlob,
} from "./downloads";
import { toast } from "react-hot-toast";
import DrawingCanvas from "./DrawingCanvas";
import { FaPencilAlt } from "react-icons/fa";
import SaveLocalPresetModal from "@/components/common/SaveLocalPresetModal";
import { useLocalPresets } from "@/hooks/useLocalPresets";
import { PresetSettings } from "@/interface";
import { useProject } from "@/hooks/useProject";
import { getProjectAsync } from "@/utils/projectStorage";
import { imageToBase64 } from "@/utils/imageStorage";
import ProjectNameHeader from "@/components/common/ProjectNameHeader";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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
    frameTitle,
    frameUrl,
  } = useEditorContext();

  const imageToDownload = useRef<HTMLDivElement | null>(null);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { presets, savePreset } = useLocalPresets();

  // Check if we have a project ID in URL on initial render
  const [hasProjectInUrl] = useState(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    return !!urlParams.get('project');
  });

  // Project system integration - Canva-style auto-save
  const project = useProject({
    type: "screenshot",
    defaultName: "Untitled Screenshot",
    autoSaveInterval: 0, // We handle auto-save manually with debounce
  });

  // Load project data when project ID is in URL
  useEffect(() => {
    // Only load if there's a project ID in URL and we haven't loaded yet
    if (hasProjectInUrl && project.projectId && !projectLoaded) {
      getProjectAsync(project.projectId).then(savedProject => {
        if (savedProject?.data) {
          const data = savedProject.data;
          // Restore editor state from saved project
          if (data.selectedImage) updateData && updateData("selectedImage", data.selectedImage);
          if (data.imageDimensions) updateData && updateData("imageDimensions", data.imageDimensions);
          if (data.currentBackground) updateData && updateData("currentBackground", data.currentBackground);
          if (data.currentBackgroundType) updateData && updateData("currentBackgroundType", data.currentBackgroundType);
          if (data.scale !== undefined) updateData && updateData("scale", data.scale);
          if (data.borderRadius !== undefined) updateData && updateData("borderRadius", data.borderRadius);
          if (data.canvasRoundness !== undefined) updateData && updateData("canvasRoundness", data.canvasRoundness);
          if (data.padding !== undefined) updateData && updateData("padding", data.padding);
          if (data.left !== undefined) updateData && updateData("left", data.left);
          if (data.right !== undefined) updateData && updateData("right", data.right);
          if (data.tilt) updateData && updateData("tilt", data.tilt);
          if (data.rotate !== undefined) updateData && updateData("rotate", data.rotate);
          if (data.aspectRatio) updateData && updateData("aspectRatio", data.aspectRatio);
          if (data.currentBoxShadow) updateData && updateData("currentBoxShadow", data.currentBoxShadow);
          if (data.noise !== undefined) updateData && updateData("noise", data.noise);
          if (data.watermark) updateData && updateData("watermark", data.watermark);
          if (data.selectedFrame) updateData && updateData("selectedFrame", data.selectedFrame);
          if (data.frameTitle) updateData && updateData("frameTitle", data.frameTitle);
          if (data.frameUrl) updateData && updateData("frameUrl", data.frameUrl);
          setProjectLoaded(true);
        }
      });
    } else if (!hasProjectInUrl) {
      // No project in URL, mark as loaded to prevent loading old data
      setProjectLoaded(true);
    }
  }, [hasProjectInUrl, project.projectId, projectLoaded, updateData]);

  // Get current editor state for saving
  const getEditorState = () => ({
    selectedImage,
    imageDimensions,
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
    frameTitle,
    frameUrl,
  });

  // Stable ref so the save callback always reads current project.save without
  // being listed as a dep (project object changes identity every render).
  const projectSaveRef = useRef(project.save);
  useEffect(() => { projectSaveRef.current = project.save; });

  // Auto-save with debounce (Canva-style) - saves 2 seconds after last change
  useEffect(() => {
    // Only auto-save if there's an image (actual content to save)
    if (!selectedImage) return;

    // Clear previous timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Capture state values synchronously so the async callback below is not stale
    const snapshot = {
      selectedImage,
      imageDimensions,
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
      frameTitle,
      frameUrl,
    };

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      const editorState = { ...snapshot };
      // Convert blob URL to base64 off the hot path — deferred so it doesn't
      // block interaction (fires after the 2-second idle gap).
      if (editorState.selectedImage && editorState.selectedImage.startsWith('blob:')) {
        editorState.selectedImage = await imageToBase64(editorState.selectedImage);
      }
      projectSaveRef.current(editorState, imageToDownload.current);
    }, 2000); // 2 second debounce

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [
    selectedImage,
    imageDimensions,
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
    frameTitle,
    frameUrl,
  ]);

  const projectMarkChangedRef = useRef(project.markChanged);
  useEffect(() => { projectMarkChangedRef.current = project.markChanged; });

  // Mark project as changed when editor state changes
  useEffect(() => {
    if (projectLoaded || selectedImage) {
      projectMarkChangedRef.current();
    }
  }, [projectLoaded, selectedImage, currentBackground, scale, borderRadius, canvasRoundness, padding, left, right, tilt, rotate, aspectRatio, currentBoxShadow, noise, watermark, selectedFrame]);

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
      const shareText = "Created with tsarr.in - Free Screenshot Editor";
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
            if (selectedImage && selectedImage.startsWith("blob:")) URL.revokeObjectURL(selectedImage);
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
  }, [updateData, selectedImage]);

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const { normalizeImageFile } = await import("@/utils/imageFile");
      const normalized = await normalizeImageFile(file);
      if (selectedImage && selectedImage.startsWith("blob:")) URL.revokeObjectURL(selectedImage);
      const fileUrl = URL.createObjectURL(normalized);
      updateData && updateData("selectedImage", fileUrl);

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


  return (
    <div className="flex items-center justify-start flex-col h-full w-full">
      {/* Project Name */}
      <ProjectNameHeader
        name={project.projectName}
        onNameChange={project.setProjectName}
        isSaving={project.isSaving}
      />

      {/* Top options */}
      <div
        style={{ pointerEvents: selectedImage ? "auto" : "none" }}
        className={`flex flex-wrap gap-2 w-full mb-3 justify-end ${
          selectedImage ? "opacity-100" : "opacity-80"
        }`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <span>
              <ToolbarButton title="Export Image">
                <TfiExport />
              </ToolbarButton>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[262px]" align="end">
            <DropdownMenuItem onClick={() => downloadimagePng(imageToDownload.current, 1)}>PNG 1x</DropdownMenuItem>
            <DropdownMenuItem onClick={() => downloadimagePng(imageToDownload.current, 2)}>PNG 2x</DropdownMenuItem>
            <DropdownMenuItem onClick={() => downloadimagePng(imageToDownload.current, 4)}>PNG 4x</DropdownMenuItem>
            <DropdownMenuItem onClick={() => downloadimageJpeg(imageToDownload.current, 2)}>JPEG</DropdownMenuItem>
            <DropdownMenuItem onClick={() => downloadimageWebp(imageToDownload.current, 2)}>WebP</DropdownMenuItem>
            <DropdownMenuItem onClick={() => downloadimageSvg(imageToDownload.current, 2)}>SVG</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarButton
          title="Copy"
          onTap={() => copyToClipboard(imageToDownload.current)}
          disabled={!selectedImage}
        >
          <BsClipboard className="icon" />
        </ToolbarButton>

        <label htmlFor="selected-image-reset">
          <input
            type="file"
            hidden
            accept="image/*"
            id="selected-image-reset"
            onChange={(e) => handleImageChange(e)}
          />
          <ToolbarButton title="Reset Image">
            <BsRepeat className="icon" />
          </ToolbarButton>
        </label>

        <ToolbarButton title="Reset Canvas" onTap={handleReset}>
          <BiReset className="icon" />
        </ToolbarButton>

        <ToolbarButton
          title="Save Preset"
          onTap={() => setShowSavePresetModal(true)}
        >
          <BsBookmark className="icon" />
        </ToolbarButton>

        <ToolbarButton
          title={showAnnotations ? "Close Drawing" : "Draw/Annotate"}
          onTap={() => updateData && updateData("showAnnotations", !showAnnotations)}
        >
          <FaPencilAlt className={showAnnotations ? "text-[#2563EB]" : "icon"} />
        </ToolbarButton>

        <ToolbarButton
          title={isSharing ? "Sharing..." : "Share"}
          onTap={handleShare}
          disabled={!selectedImage || isSharing}
        >
          {isSharing ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <BsShare className="icon" />
          )}
        </ToolbarButton>
      </div>

      {/* Image Dimensions Display */}
      {selectedImage && imageDimensions.width > 0 && (
        <div className="flex justify-end mb-2 w-full">
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-[#F9FAFB] dark:bg-gray-800/50 px-3 py-1 rounded-full">
            {imageDimensions.width} × {imageDimensions.height} px
          </span>
        </div>
      )}

      {/* Editor Canvas Area */}
      <div className="relative w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] flex items-center justify-center rounded-[20px] bg-[#F9FAFB]/3 dark:bg-gray-800/30 dark:bg-gray-800/50 border border-[#E5E7EB]/8 dark:border-gray-700/80 dark:border-gray-700 overflow-hidden">
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
                className="text-[#0A0A0A] dark:text-white absolute bottom-3 right-4 z-20 opacity-90 font-medium outline-none font-sans text-[1rem]"
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
