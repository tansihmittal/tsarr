import { RefObject, ChangeEvent, ReactNode, useState, useEffect } from "react";
import {
  BsPlus,
  BsTrash,
  BsFiles,
  BsChevronRight,
  BsBookmarkFill,
  BsLayers,
  BsSearch,
} from "react-icons/bs";
import { IoMdOptions } from "react-icons/io";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";
import {
  TextBehindImageState,
  TextLayer,
  createDefaultLayer,
} from "./TextBehindImageLayout";
import { GOOGLE_FONTS, FONT_CATEGORIES, TILT_PRESETS, loadFont } from "../../data/fonts";

// Default style values for resetting layers when applying presets
// Excludes: id, text, x, y (position should be preserved)
const getDefaultStyleValues = (): Partial<TextLayer> => ({
  fontSize: 120,
  fontFamily: "Inter",
  textColor: "#ffffff",
  fontWeight: 800,
  opacity: 1,
  rotation: 0,
  letterSpacing: 0,
  tiltX: 0,
  tiltY: 0,
  curve: 0,
  reflection: false,
  reflectionOpacity: 0.3,
  shadowEnabled: false,
  shadowColor: "rgba(0, 0, 0, 0.8)",
  shadowBlur: 10,
  shadowOffsetX: 4,
  shadowOffsetY: 4,
});

// Text style presets
const TEXT_PRESETS = [
  {
    id: "bold-white",
    name: "Bold White",
    preview: "#ffffff",
    settings: {
      textColor: "#ffffff",
      fontWeight: 900,
      fontSize: 150,
      shadowEnabled: true,
      shadowColor: "#000000",
      shadowBlur: 20,
      shadowOffsetX: 5,
      shadowOffsetY: 5,
    },
  },
  {
    id: "neon-glow",
    name: "Neon Glow",
    preview: "#00ff88",
    settings: {
      textColor: "#00ff88",
      fontWeight: 700,
      fontSize: 120,
      shadowEnabled: true,
      shadowColor: "#00ff88",
      shadowBlur: 30,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
    },
  },
  {
    id: "fire-red",
    name: "Fire Red",
    preview: "#ff4444",
    settings: {
      textColor: "#ff4444",
      fontWeight: 800,
      fontSize: 140,
      shadowEnabled: true,
      shadowColor: "#ff0000",
      shadowBlur: 25,
      shadowOffsetX: 3,
      shadowOffsetY: 3,
    },
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    preview: "#0088ff",
    settings: {
      textColor: "#0088ff",
      fontWeight: 700,
      fontSize: 130,
      shadowEnabled: true,
      shadowColor: "#004488",
      shadowBlur: 15,
      shadowOffsetX: 4,
      shadowOffsetY: 4,
    },
  },
  {
    id: "gold-luxury",
    name: "Gold Luxury",
    preview: "#ffd700",
    settings: {
      textColor: "#ffd700",
      fontWeight: 800,
      fontSize: 120,
      shadowEnabled: true,
      shadowColor: "#996600",
      shadowBlur: 10,
      shadowOffsetX: 3,
      shadowOffsetY: 3,
      reflection: true,
      reflectionOpacity: 0.4,
    },
  },
  {
    id: "purple-haze",
    name: "Purple Haze",
    preview: "#9933ff",
    settings: {
      textColor: "#9933ff",
      fontWeight: 700,
      fontSize: 130,
      shadowEnabled: true,
      shadowColor: "#6600cc",
      shadowBlur: 20,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
    },
  },
  {
    id: "minimal-black",
    name: "Minimal Black",
    preview: "#1a1a1a",
    settings: {
      textColor: "#1a1a1a",
      fontWeight: 600,
      fontSize: 100,
      shadowEnabled: false,
      letterSpacing: 5,
    },
  },
  {
    id: "3d-effect",
    name: "3D Effect",
    preview: "#ffffff",
    settings: {
      textColor: "#ffffff",
      fontWeight: 900,
      fontSize: 140,
      tiltX: 15,
      tiltY: -10,
      shadowEnabled: true,
      shadowColor: "#000000",
      shadowBlur: 0,
      shadowOffsetX: 8,
      shadowOffsetY: 8,
    },
  },
  {
    id: "curved-rainbow",
    name: "Curved Style",
    preview: "#ff6b6b",
    settings: {
      textColor: "#ff6b6b",
      fontWeight: 800,
      fontSize: 100,
      curve: 30,
      shadowEnabled: true,
      shadowColor: "#000000",
      shadowBlur: 10,
    },
  },
  {
    id: "reflection-style",
    name: "Reflection",
    preview: "#ffffff",
    settings: {
      textColor: "#ffffff",
      fontWeight: 800,
      fontSize: 130,
      reflection: true,
      reflectionOpacity: 0.5,
      shadowEnabled: false,
    },
  },
];

interface Props {
  state: TextBehindImageState;
  updateState: (updates: Partial<TextBehindImageState>) => void;
  updateLayer: (layerId: string, updates: Partial<TextLayer>) => void;
  addLayer: () => void;
  duplicateLayer: (layerId: string) => void;
  removeLayer: (layerId: string) => void;
  onImageUpload: (imageUrl: string, width: number, height: number) => void;
  reprocessImage: () => void;
  canvasRef: RefObject<HTMLCanvasElement>;
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

const TextBehindImageControls = ({
  state,
  updateState,
  updateLayer,
  addLayer,
  duplicateLayer,
  removeLayer,
  onImageUpload,
  reprocessImage,
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
        // Call the parent's onImageUpload which will auto-process
        onImageUpload(result, img.width, img.height);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const toggleLayerExpand = (layerId: string) => {
    updateState({
      selectedLayerId: state.selectedLayerId === layerId ? null : layerId,
    });
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

  return (
    <section
      className={`flex flex-col transition-opacity duration-300 ${
        state.image ? "opacity-100" : "opacity-90"
      }`}
    >
      {/* Top Buttons Container */}
      <div className="grid grid-cols-3 bg-base-200/60 rounded-xl p-1 mb-3 cursor-pointer backdrop-blur-sm">
        <OptionButton title="Options">
          <IoMdOptions />
        </OptionButton>
        <OptionButton title="Layers">
          <BsLayers />
        </OptionButton>
        <OptionButton title="Presets">
          <BsBookmarkFill />
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

            {/* Export Options - only show when image is loaded */}
            {state.image && (
              <>
                <PanelHeading title="Export" />
                <Control title="Scale" value={`${state.exportScale}x`}>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((scale) => (
                      <button
                        key={scale}
                        onClick={() => updateState({ exportScale: scale })}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-all duration-200 ${
                          state.exportScale === scale
                            ? "bg-primary text-primary-content"
                            : "bg-base-200 hover:bg-base-300"
                        }`}
                      >
                        {scale}x
                      </button>
                    ))}
                  </div>
                </Control>

                <Control title="Format" value={state.exportFormat.toUpperCase()}>
                  <div className="flex gap-1">
                    {(["png", "jpeg", "webp"] as const).map((format) => (
                      <button
                        key={format}
                        onClick={() => updateState({ exportFormat: format })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                          state.exportFormat === format
                            ? "bg-primary text-primary-content"
                            : "bg-base-200 hover:bg-base-300"
                        }`}
                      >
                        {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </Control>
              </>
            )}
          </div>
        </div>
      ) : selectedOption === "layers" ? (
        /* Layers Panel */
        <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
          <PanelHeading title="Text Layers" />

          {/* Add Layer Button */}
          <div className="p-3">
            <button
              onClick={addLayer}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-focus text-primary-content rounded-xl transition-all duration-200 font-medium shadow-lg shadow-primary/20"
            >
              <BsPlus className="w-5 h-5" />
              Add Text Layer
            </button>
          </div>

          {/* Layer List */}
          <div className="px-3 pb-3 space-y-2">
            {state.textLayers.map((layer, index) => (
              <LayerItem
                key={layer.id}
                layer={layer}
                index={index}
                isExpanded={state.selectedLayerId === layer.id}
                canDelete={state.textLayers.length > 1}
                onToggle={() => toggleLayerExpand(layer.id)}
                onUpdate={(updates) => updateLayer(layer.id, updates)}
                onDuplicate={() => duplicateLayer(layer.id)}
                onRemove={() => removeLayer(layer.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Presets Panel */
        <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
          <PanelHeading title="Text Style Presets" />
          <p className="text-xs text-gray-500 px-4 py-2">
            Click a preset to apply it to the selected layer, or add a new layer with that style.
          </p>
          <div className="grid grid-cols-2 gap-3 p-3">
            {TEXT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  const selectedLayer = state.textLayers.find(
                    (l) => l.id === state.selectedLayerId
                  );
                  // Reset all style properties to defaults, then apply preset settings
                  const resetAndApply = { ...getDefaultStyleValues(), ...preset.settings };
                  if (selectedLayer) {
                    updateLayer(selectedLayer.id, resetAndApply as Partial<TextLayer>);
                  } else if (state.textLayers.length > 0) {
                    updateLayer(state.textLayers[0].id, resetAndApply as Partial<TextLayer>);
                  }
                }}
                className="group relative overflow-hidden rounded-xl border border-base-200/80 hover:border-primary transition-all hover:shadow-lg"
              >
                <div
                  className="h-16 w-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${preset.preview}22 0%, ${preset.preview}44 100%)`,
                  }}
                >
                  <span
                    className="text-2xl font-bold"
                    style={{
                      color: preset.preview,
                      textShadow:
                        preset.settings.shadowEnabled
                          ? `${preset.settings.shadowOffsetX || 2}px ${preset.settings.shadowOffsetY || 2}px ${preset.settings.shadowBlur || 5}px ${preset.settings.shadowColor || "#000"}`
                          : "none",
                    }}
                  >
                    Aa
                  </span>
                </div>
                <div className="p-2 bg-base-100 text-center border-t border-base-200/50">
                  <span className="text-xs font-medium text-primary-content">
                    {preset.name}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Add new layer with preset */}
          <div className="p-3 border-t border-base-200/50">
            <p className="text-xs text-gray-500 mb-2">Or add a new layer:</p>
            <button
              onClick={() => {
                const newLayer = createDefaultLayer();
                updateState({
                  textLayers: [...state.textLayers, newLayer],
                  selectedLayerId: newLayer.id,
                });
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-base-200 hover:bg-base-300 text-primary-content rounded-lg transition-all duration-200 text-sm"
            >
              <BsPlus className="w-4 h-4" />
              Add Default Layer
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

interface LayerItemProps {
  layer: TextLayer;
  index: number;
  isExpanded: boolean;
  canDelete: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<TextLayer>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

const LayerItem = ({
  layer,
  index,
  isExpanded,
  canDelete,
  onToggle,
  onUpdate,
  onDuplicate,
  onRemove,
}: LayerItemProps) => {
  const [fontSearch, setFontSearch] = useState("");
  const [fontCategory, setFontCategory] = useState("all");
  const [showFontPicker, setShowFontPicker] = useState(false);

  // Load font when selected
  useEffect(() => {
    if (layer.fontFamily) {
      loadFont(layer.fontFamily);
    }
  }, [layer.fontFamily]);

  // Filter fonts based on search and category
  const filteredFonts = GOOGLE_FONTS.filter((font) => {
    const matchesSearch = font.name.toLowerCase().includes(fontSearch.toLowerCase());
    const matchesCategory = fontCategory === "all" || font.category === fontCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFontSelect = (fontName: string) => {
    loadFont(fontName);
    onUpdate({ fontFamily: fontName });
    setShowFontPicker(false);
    setFontSearch("");
  };

  return (
    <div className="border border-base-200/80 rounded-xl overflow-hidden bg-base-100">
      {/* Layer Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-base-200/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <BiChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <BiChevronDown className="w-4 h-4 text-gray-500" />
          )}
          <span className="font-medium text-sm">Layer {index + 1}</span>
          <span className="text-xs text-gray-400 truncate max-w-[80px]">
            {layer.text || "Empty"}
          </span>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onDuplicate}
            className="p-1.5 hover:bg-base-200 rounded-lg transition-colors"
            title="Duplicate"
          >
            <BsFiles className="w-3.5 h-3.5 text-gray-500" />
          </button>
          {canDelete && (
            <button
              onClick={onRemove}
              className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
              title="Delete"
            >
              <BsTrash className="w-3.5 h-3.5 text-red-500" />
            </button>
          )}
        </div>
      </div>

      {/* Layer Content */}
      {isExpanded && (
        <div className="p-3 pt-0 space-y-3 border-t border-base-200/60">
          {/* Text Input */}
          <div>
            <span className="text-xs text-gray-500 font-medium block mb-1.5">Text</span>
            <input
              type="text"
              value={layer.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full px-3 py-2 bg-base-200/50 border-0 rounded-lg focus:ring-2 focus:ring-primary text-sm"
              placeholder="Enter text"
            />
          </div>

          {/* Font Family - Searchable Picker */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-500 font-medium">Font Family</span>
              <span className="text-xs text-primary">{GOOGLE_FONTS.length} fonts</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFontPicker(!showFontPicker)}
                className="w-full px-3 py-2 bg-base-200/50 border-0 rounded-lg text-sm text-left flex items-center justify-between hover:bg-base-200 transition-colors"
                style={{ fontFamily: layer.fontFamily }}
              >
                <span>{layer.fontFamily}</span>
                <BiChevronDown className={`w-4 h-4 transition-transform ${showFontPicker ? "rotate-180" : ""}`} />
              </button>
              
              {showFontPicker && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-base-100 border border-base-200 rounded-xl shadow-xl max-h-[300px] overflow-hidden">
                  {/* Search */}
                  <div className="p-2 border-b border-base-200 sticky top-0 bg-base-100">
                    <div className="relative">
                      <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                      <input
                        type="text"
                        value={fontSearch}
                        onChange={(e) => setFontSearch(e.target.value)}
                        placeholder="Search fonts..."
                        className="w-full pl-8 pr-3 py-1.5 bg-base-200/50 border-0 rounded-lg text-xs focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  {/* Category Filter */}
                  <div className="p-2 border-b border-base-200 flex gap-1 flex-wrap sticky top-[52px] bg-base-100">
                    {FONT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setFontCategory(cat.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          fontCategory === cat.id
                            ? "bg-primary text-white"
                            : "bg-base-200 hover:bg-base-300"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  
                  {/* Font List */}
                  <div className="overflow-y-auto max-h-[180px]">
                    {filteredFonts.map((font) => (
                      <button
                        key={font.name}
                        onClick={() => handleFontSelect(font.name)}
                        onMouseEnter={() => loadFont(font.name)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-primary/10 transition-colors flex items-center justify-between ${
                          layer.fontFamily === font.name ? "bg-primary/10 text-primary" : ""
                        }`}
                        style={{ fontFamily: font.name }}
                      >
                        <span>{font.name}</span>
                        <span className="text-[10px] text-gray-400 capitalize">{font.category}</span>
                      </button>
                    ))}
                    {filteredFonts.length === 0 && (
                      <div className="px-3 py-4 text-center text-xs text-gray-400">
                        No fonts found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <span className="text-xs text-gray-500 font-medium block mb-1.5">Size</span>
            <input
              type="number"
              min="10"
              max="500"
              value={layer.fontSize}
              onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) || 10 })}
              className="w-full px-3 py-2 bg-base-200/50 border-0 rounded-lg focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          {/* Font Weight */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-500 font-medium">Font Weight</span>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {layer.fontWeight}
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="900"
              step="100"
              value={layer.fontWeight}
              onChange={(e) => onUpdate({ fontWeight: parseInt(e.target.value) })}
              className="range range-xs range-primary w-full"
            />
          </div>

          {/* Color */}
          <div>
            <span className="text-xs text-gray-500 font-medium block mb-1.5">Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={layer.textColor}
                onChange={(e) => onUpdate({ textColor: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
              />
              <input
                type="text"
                value={layer.textColor}
                onChange={(e) => onUpdate({ textColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-base-200/50 border-0 rounded-lg focus:ring-2 focus:ring-primary text-xs font-mono"
              />
            </div>
          </div>

          {/* Opacity & Rotation */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Opacity</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {Math.round(layer.opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={layer.opacity}
                onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
                className="range range-xs range-primary w-full"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Rotation</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {layer.rotation}°
                </span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={layer.rotation}
                onChange={(e) => onUpdate({ rotation: parseInt(e.target.value) })}
                className="range range-xs range-primary w-full"
              />
            </div>
          </div>

          {/* Letter Spacing */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-500 font-medium">Letter Spacing</span>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {layer.letterSpacing}px
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="100"
              value={layer.letterSpacing}
              onChange={(e) => onUpdate({ letterSpacing: parseInt(e.target.value) })}
              className="range range-xs range-primary w-full"
            />
          </div>

          {/* 3D Tilt Effects */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-500 font-medium">3D Tilt Presets</span>
            </div>
            <div className="grid grid-cols-4 gap-1 mb-2">
              {TILT_PRESETS.slice(0, 8).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onUpdate({ tiltX: preset.tiltX, tiltY: preset.tiltY });
                  }}
                  className={`px-1.5 py-1 rounded text-[9px] font-medium transition-colors ${
                    layer.tiltX === preset.tiltX && layer.tiltY === preset.tiltY
                      ? "bg-primary text-white"
                      : "bg-base-200 hover:bg-base-300"
                  }`}
                  title={`X: ${preset.tiltX}°, Y: ${preset.tiltY}°`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Tilt X</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {layer.tiltX}°
                </span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                value={layer.tiltX}
                onChange={(e) => onUpdate({ tiltX: parseInt(e.target.value) })}
                className="range range-xs range-primary w-full"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Tilt Y</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {layer.tiltY}°
                </span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                value={layer.tiltY}
                onChange={(e) => onUpdate({ tiltY: parseInt(e.target.value) })}
                className="range range-xs range-primary w-full"
              />
            </div>
          </div>

          {/* Curve Text */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-500 font-medium">Curve</span>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {layer.curve}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={layer.curve}
              onChange={(e) => onUpdate({ curve: parseInt(e.target.value) })}
              className="range range-xs range-primary w-full"
            />
          </div>

          {/* 3D Reflection */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">3D Reflection</span>
            <label className="custom-toggle">
              <input
                type="checkbox"
                checked={layer.reflection}
                onChange={(e) => onUpdate({ reflection: e.target.checked })}
              />
              <span className="slider"></span>
            </label>
          </div>

          {/* Reflection Opacity - only show when reflection is enabled */}
          {layer.reflection && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Reflection Opacity</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {Math.round(layer.reflectionOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={layer.reflectionOpacity}
                onChange={(e) => onUpdate({ reflectionOpacity: parseFloat(e.target.value) })}
                className="range range-xs range-primary w-full"
              />
            </div>
          )}

          {/* Text Shadow */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Text Shadow</span>
            <label className="custom-toggle">
              <input
                type="checkbox"
                checked={layer.shadowEnabled}
                onChange={(e) => onUpdate({ shadowEnabled: e.target.checked })}
              />
              <span className="slider"></span>
            </label>
          </div>

          {/* Shadow Controls - only show when shadow is enabled */}
          {layer.shadowEnabled && (
            <>
              {/* Shadow Color */}
              <div>
                <span className="text-xs text-gray-500 font-medium block mb-1.5">Shadow Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={layer.shadowColor.startsWith("rgba") ? "#000000" : layer.shadowColor}
                    onChange={(e) => onUpdate({ shadowColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <div className="flex gap-1">
                    {["#000000", "#ffffff", "#ff0000", "#0066ff"].map((color) => (
                      <button
                        key={color}
                        onClick={() => onUpdate({ shadowColor: color })}
                        className="w-6 h-6 rounded border border-base-300"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Shadow Blur */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-gray-500 font-medium">Shadow Blur</span>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {layer.shadowBlur}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={layer.shadowBlur}
                  onChange={(e) => onUpdate({ shadowBlur: parseInt(e.target.value) })}
                  className="range range-xs range-primary w-full"
                />
              </div>

              {/* Shadow Offset */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-gray-500 font-medium">Offset X</span>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {layer.shadowOffsetX}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    value={layer.shadowOffsetX}
                    onChange={(e) => onUpdate({ shadowOffsetX: parseInt(e.target.value) })}
                    className="range range-xs range-primary w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-gray-500 font-medium">Offset Y</span>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {layer.shadowOffsetY}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    value={layer.shadowOffsetY}
                    onChange={(e) => onUpdate({ shadowOffsetY: parseInt(e.target.value) })}
                    className="range range-xs range-primary w-full"
                  />
                </div>
              </div>
            </>
          )}

          {/* Position */}
          <div>
            <span className="text-xs text-gray-500 font-medium block mb-1.5">Position</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-gray-400">X</span>
                  <span className="text-[10px] text-gray-400">{layer.x}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={layer.x}
                  onChange={(e) => onUpdate({ x: parseInt(e.target.value) })}
                  className="range range-xs range-primary w-full"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-gray-400">Y</span>
                  <span className="text-[10px] text-gray-400">{layer.y}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={layer.y}
                  onChange={(e) => onUpdate({ y: parseInt(e.target.value) })}
                  className="range range-xs range-primary w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextBehindImageControls;
