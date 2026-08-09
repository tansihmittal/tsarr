import { RefObject, ChangeEvent, ReactNode, useState } from "react";
import { IMAGE_ACCEPT, normalizeImageFile } from "@/utils/imageFile";
import ControlPanelHeading from "../common/ControlPanelHeading";
import ControlPanelRow from "../common/ControlPanelRow";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BsChevronRight,
  BsLayers,
  BsType,
  BsPencil,
  BsCheck,
  BsX,
  BsPlus,
  BsStars,
  BsPalette,
  BsDownload,
} from "react-icons/bs";
import { IoMdOptions } from "react-icons/io";
import { BiRefresh } from "react-icons/bi";
import { ImageTextEditorState, TextRegion } from "./ImageTextEditorLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  state: ImageTextEditorState;
  updateState: (updates: Partial<ImageTextEditorState>) => void;
  updateRegion: (regionId: string, updates: Partial<TextRegion>) => void;
  deleteRegion: (regionId: string) => void;
  onImageUpload: (imageUrl: string, width: number, height: number) => void;
  reprocessImage: () => void;
  addManualRegion: () => void;
  canvasRef: RefObject<HTMLCanvasElement>;
  startEditing: (regionId: string) => void;
}

const PanelHeading = ControlPanelHeading;
const Control = ControlPanelRow;

const ImageTextEditorControls = ({
  state,
  updateState,
  updateRegion,
  deleteRegion,
  onImageUpload,
  reprocessImage,
  addManualRegion,
  startEditing,
}: Props) => {

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const normalized = await normalizeImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        onImageUpload(result, img.width, img.height);
      };
      img.src = result;
    };
    reader.readAsDataURL(normalized);
  };

  const modifiedCount = state.textRegions.filter((r) => r.isModified).length;

  return (
    <section
      className={`flex flex-col transition-opacity duration-300 ${
        state.image ? "opacity-100" : "opacity-90"
      }`}
    >
      <Tabs defaultValue="options">
      {/* Top Buttons Container */}
      <TabsList className="w-full grid grid-cols-2 rounded-[12px] bg-[#F9FAFB] dark:bg-gray-800 mb-3">
        <TabsTrigger value="options" className="gap-1.5 rounded-[10px] text-xs"><IoMdOptions className="w-3.5 h-3.5" /> Options</TabsTrigger>
        <TabsTrigger value="text" className="gap-1.5 rounded-[10px] text-xs"><BsLayers className="w-3.5 h-3.5" /> Text</TabsTrigger>
      </TabsList>

      {/* Options Panel */}
      <TabsContent value="options">
        <div className="rounded-[14px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
          <div className="relative rounded-[14px]">
            {/* Upload Section */}
            <PanelHeading title="Image" />
            <label htmlFor="image-upload">
              <Control title="Upload Image">
                <input
                  type="file"
                  hidden
                  accept={IMAGE_ACCEPT}
                  id="image-upload"
                  onChange={handleImageUpload}
                />
                <BsChevronRight className="text-xl" />
              </Control>
            </label>

            {state.image && (
              <>
                {/* OCR Controls */}
                <PanelHeading title="Text Detection" />
                <Control
                  title="Re-scan Image"
                  value={`${state.textRegions.length} found`}
                  onTap={reprocessImage}
                >
                  <BiRefresh
                    className={`text-xl ${state.isProcessing ? "animate-spin" : ""}`}
                  />
                </Control>

                <Control title="Add Text Manually" onTap={addManualRegion}>
                  <BsPlus className="text-xl" />
                </Control>

                {/* Stats */}
                {modifiedCount > 0 && (
                  <>
                    <PanelHeading title="Changes" />
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <BsCheck className="text-green-500 text-xl" />
                        <span>
                          {modifiedCount} text region{modifiedCount > 1 ? "s" : ""} modified
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Tips */}
                <PanelHeading title="Tips" />
                <div className="p-4 text-xs text-gray-500 dark:text-gray-400 space-y-2">
                  <p className="flex items-center gap-1.5"><BsStars className="shrink-0" /> Click directly on text in the image to edit</p>
                  <p className="flex items-center gap-1.5"><BsPalette className="shrink-0" /> Text color matches the original automatically</p>
                  <p className="flex items-center gap-1.5"><BsDownload className="shrink-0" /> Use Download button to save your edited image</p>
                </div>
              </>
            )}
          </div>
        </div>
      </TabsContent>
      {/* Text Regions Panel */}
      <TabsContent value="text">
        <div className="rounded-[14px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
          <PanelHeading title="Detected Text" />

          {/* Instructions */}
          <div className="p-3 bg-[#EFF6FF] dark:bg-blue-900/20 border-b border-[#E5E7EB]/50 dark:border-gray-700/50">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              <strong>Tip:</strong> Click directly on text in the image to edit it,
              or click the edit button below.
            </p>
          </div>

          {/* Region List */}
          <div className="px-3 pb-3 pt-2 space-y-2">
            {state.textRegions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <BsType className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No text detected</p>
                <p className="text-xs mt-1">Upload an image to detect text</p>
              </div>
            ) : (
              state.textRegions.map((region, index) => (
                <TextRegionItem
                  key={region.id}
                  region={region}
                  index={index}
                  isSelected={state.selectedRegionId === region.id}
                  onSelect={() => updateState({ selectedRegionId: region.id })}
                  onEdit={() => startEditing(region.id)}
                  onUpdate={(updates) => updateRegion(region.id, updates)}
                  onDelete={() => deleteRegion(region.id)}
                />
              ))
            )}
          </div>
        </div>
      </TabsContent>
      </Tabs>
    </section>
  );
};

interface TextRegionItemProps {
  region: TextRegion;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onUpdate: (updates: Partial<TextRegion>) => void;
  onDelete: () => void;
}

const TextRegionItem = ({
  region,
  index,
  isSelected,
  onSelect,
  onEdit,
  onUpdate,
  onDelete,
}: TextRegionItemProps) => {
  return (
    <div
      className={`border rounded-[14px] overflow-hidden bg-white dark:bg-gray-900 transition-all ${
        isSelected ? "border-[#2563EB] ring-2 ring-[#2563EB]/20" : "border-[#E5E7EB] dark:border-gray-700"
      } ${region.isModified ? "bg-green-50/50 dark:bg-green-900/10" : ""}`}
      onClick={onSelect}
    >
      <div className="p-3">
        {/* Original vs New text */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
              {region.isModified ? "Original" : "Detected Text"}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
              {region.text}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                region.confidence > 70
                  ? "bg-green-100 text-green-700"
                  : region.confidence > 40
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {Math.round(region.confidence)}%
            </span>
          </div>
        </div>

        {/* Modified text display */}
        {region.isModified && (
          <div className="mb-2">
            <div className="text-[10px] text-green-600 uppercase tracking-wide mb-1">
              New Text
            </div>
            <div className="text-sm text-green-700 font-medium truncate">
              {region.newText}
            </div>
          </div>
        )}

        {/* Quick edit input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={region.newText}
            onChange={(e) => onUpdate({ newText: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 px-3 py-2 bg-[#EFF6FF] dark:bg-blue-900/20 border-0 rounded-[10px] focus:ring-2 focus:ring-[#2563EB] text-sm outline-none"
            placeholder="Type new text..."
          />
          <Button
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-[10px] h-9 w-9"
            title="Edit on image"
          >
            <BsPencil className="w-4 h-4" />
          </Button>
        </div>

        {/* Reset button if modified */}
        {region.isModified && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ newText: region.text, isModified: false });
            }}
            className="mt-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 flex items-center gap-1"
          >
            <BsX className="w-4 h-4" />
            Reset to original
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageTextEditorControls;
