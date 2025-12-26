import { RefObject, ChangeEvent, ReactNode, useState } from "react";
import {
  BsChevronRight,
  BsLayers,
  BsType,
  BsPencil,
  BsCheck,
  BsX,
  BsPlus,
} from "react-icons/bs";
import { IoMdOptions } from "react-icons/io";
import { BiRefresh } from "react-icons/bi";
import { ImageTextEditorState, TextRegion } from "./ImageTextEditorLayout";

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

// Reusable Control component
const Control = ({
  title,
  value,
  children,
  onTap,
}: {
  title: string;
  value?: string | number | null;
  children: ReactNode;
  onTap?: () => void;
}) => (
  <div
    className="control-item flex justify-between items-center p-[1rem] border-b border-base-200/60 cursor-pointer overflow-hidden group"
    onClick={onTap}
  >
    <div className="flex justify-between items-center gap-2 shrink-0">
      <span className="text-primary-content font-medium">{title}</span>
      {value != null && (
        <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium text-gray-600 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
          {value}
        </span>
      )}
    </div>
    <div className="flex items-center overflow-hidden">{children}</div>
  </div>
);

// Panel heading
const PanelHeading = ({ title }: { title: string }) => (
  <h2 className="text-[0.75rem] uppercase tracking-wider font-semibold px-4 py-3 bg-gradient-to-r from-base-200/80 to-base-200/40 text-gray-600 border-b border-base-200/50 flex items-center gap-2">
    <span className="w-1 h-4 bg-primary rounded-full"></span>
    {title}
  </h2>
);

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
  const [selectedOption, setSelectedOption] = useState("options");

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        onImageUpload(result, img.width, img.height);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const OptionButton = ({
    title,
    children,
  }: {
    children: ReactNode;
    title: string;
  }) => {
    const triggerValue = title.toLowerCase();
    const isActive = selectedOption === triggerValue;
    return (
      <div
        className={`flex justify-center items-center gap-2 font-medium px-4 py-2.5 transition-all duration-200 cursor-pointer ${
          isActive
            ? "bg-base-100 rounded-lg shadow-sm text-primary"
            : "text-primary-content hover:text-primary"
        }`}
        onClick={() => setSelectedOption(triggerValue)}
      >
        <span className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>
          {children}
        </span>
        <span>{title}</span>
      </div>
    );
  };

  const modifiedCount = state.textRegions.filter((r) => r.isModified).length;

  return (
    <section
      className={`flex flex-col transition-opacity duration-300 ${
        state.image ? "opacity-100" : "opacity-90"
      }`}
    >
      {/* Top Buttons Container */}
      <div className="grid grid-cols-2 bg-base-200/60 rounded-xl p-1 mb-3 cursor-pointer backdrop-blur-sm">
        <OptionButton title="Options">
          <IoMdOptions />
        </OptionButton>
        <OptionButton title="Text">
          <BsLayers />
        </OptionButton>
      </div>

      {/* Options Panel */}
      {selectedOption === "options" ? (
        <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
          <div className="relative rounded-xl">
            {/* Upload Section */}
            <PanelHeading title="Image" />
            <label htmlFor="image-upload">
              <Control title="Upload Image">
                <input
                  type="file"
                  hidden
                  accept="image/*"
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
                <div className="p-4 text-xs text-gray-500 space-y-2">
                  <p>✨ Click directly on text in the image to edit</p>
                  <p>🎨 Text color matches the original automatically</p>
                  <p>📥 Use Download button to save your edited image</p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Text Regions Panel */
        <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
          <PanelHeading title="Detected Text" />

          {/* Instructions */}
          <div className="p-3 bg-primary/5 border-b border-base-200/50">
            <p className="text-xs text-gray-600">
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
      )}
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
      className={`border rounded-xl overflow-hidden bg-base-100 transition-all ${
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-base-200/80"
      } ${region.isModified ? "bg-green-50/50" : ""}`}
      onClick={onSelect}
    >
      <div className="p-3">
        {/* Original vs New text */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
              {region.isModified ? "Original" : "Detected Text"}
            </div>
            <div className="text-sm text-gray-600 truncate">
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
            className="flex-1 px-3 py-2 bg-base-200/50 border-0 rounded-lg focus:ring-2 focus:ring-primary text-sm"
            placeholder="Type new text..."
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 bg-primary text-white rounded-lg hover:bg-primary-focus transition-colors"
            title="Edit on image"
          >
            <BsPencil className="w-4 h-4" />
          </button>
        </div>

        {/* Reset button if modified */}
        {region.isModified && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ newText: region.text, isModified: false });
            }}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
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
