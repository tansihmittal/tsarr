import { useState, useRef, useEffect, ChangeEvent } from "react";
import { CodeEditorState } from "./CodeEditorLayout";
import { BiCode, BiChevronRight, BiReset } from "react-icons/bi";
import { IoMdOptions } from "react-icons/io";
import { BsBookmarkFill, BsTrash } from "react-icons/bs";
import { FaDice } from "react-icons/fa";
import { toast } from "react-hot-toast";
import {
  fontFamilies,
  aspectRatios,
  shadowStyles,
  borderStyles,
  themesList,
  languagesList,
} from "../../data/codeEditor";
import BackgroundPicker, { BackgroundConfig } from "../common/BackgroundPicker";
import { boxShadows } from "@/data/gradients";
import { tiltDirectionArray } from "@/data/misc";
import { gereateRandomGradient } from "@/utils/randomGradient";
import useCustomPresets from "@/hooks/useCustomPresets";

interface Props {
  state: CodeEditorState;
  updateState: (key: keyof CodeEditorState, value: any) => void;
}

interface CodePresetData {
  theme: string;
  background: BackgroundConfig;
  windowStyle: "none" | "macos" | "windows";
  borderRadius: number;
  padding: number;
  shadowStyle: string;
  borderStyle: string;
  reflection: boolean;
  reflectionOpacity: number;
  scale: number;
  canvasRoundness: number;
}

const PRESET_STORAGE_KEY = "code-editor-presets";

// Custom hook for debounced text input to prevent cursor jumping
const useDebouncedInput = (
  value: string,
  onChange: (value: string) => void,
  delay: number = 500
) => {
  const [localValue, setLocalValue] = useState(value);
  const isTypingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local value with external value only when not typing
  useEffect(() => {
    if (!isTypingRef.current) {
      setLocalValue(value);
    }
  }, [value]);

  const handleChange = (newValue: string) => {
    isTypingRef.current = true;
    setLocalValue(newValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
      isTypingRef.current = false;
    }, delay);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { localValue, handleChange };
};

// Presets for quick styling
const presets = [
  {
    id: "modern-dark",
    name: "Modern Dark",
    preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    settings: {
      theme: "dracula",
      background: { type: "gradient" as const, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color1: "#667eea", color2: "#764ba2", direction: "to bottom right" },
      windowStyle: "macos" as const,
      borderRadius: 12,
      padding: 32,
      shadowStyle: "strong" as const,
      borderStyle: "none" as const,
      reflection: false,
      reflectionOpacity: 0.3,
    }
  },
  {
    id: "github-style",
    name: "GitHub",
    preview: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    settings: {
      theme: "github-dark",
      background: { type: "gradient" as const, background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color1: "#f093fb", color2: "#f5576c", direction: "to bottom right" },
      windowStyle: "macos" as const,
      borderRadius: 12,
      padding: 32,
      shadowStyle: "medium" as const,
      borderStyle: "none" as const,
      reflection: false,
      reflectionOpacity: 0.3,
    }
  },
  {
    id: "night-owl-style",
    name: "Night Owl",
    preview: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    settings: {
      theme: "night-owl",
      background: { type: "gradient" as const, background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", color1: "#4facfe", color2: "#00f2fe", direction: "to bottom right" },
      windowStyle: "macos" as const,
      borderRadius: 16,
      padding: 40,
      shadowStyle: "strong" as const,
      borderStyle: "glass" as const,
      reflection: true,
      reflectionOpacity: 0.3,
    }
  },
  {
    id: "synthwave",
    name: "Synthwave",
    preview: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
    settings: {
      theme: "synthwave-84",
      background: { type: "gradient" as const, background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)", color1: "#a855f7", color2: "#ec4899", direction: "to bottom right" },
      windowStyle: "macos" as const,
      borderRadius: 12,
      padding: 32,
      shadowStyle: "strong" as const,
      borderStyle: "gradient" as const,
      reflection: false,
      reflectionOpacity: 0.3,
    }
  },
  {
    id: "minimal-light",
    name: "Minimal Light",
    preview: "#f5f5f5",
    settings: {
      theme: "github-light",
      background: { type: "solid" as const, background: "#f5f5f5", color1: "#f5f5f5", color2: "#f5f5f5", direction: "to right" },
      windowStyle: "none" as const,
      borderRadius: 8,
      padding: 24,
      shadowStyle: "subtle" as const,
      borderStyle: "solid" as const,
      reflection: false,
      reflectionOpacity: 0.3,
    }
  },
  {
    id: "ocean-breeze",
    name: "Ocean",
    preview: "linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)",
    settings: {
      theme: "material-ocean",
      background: { type: "gradient" as const, background: "linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)", color1: "#2c3e50", color2: "#4ca1af", direction: "to bottom right" },
      windowStyle: "macos" as const,
      borderRadius: 16,
      padding: 40,
      shadowStyle: "bottom" as const,
      borderStyle: "glass" as const,
      reflection: true,
      reflectionOpacity: 0.4,
    }
  },
  {
    id: "aura-neon",
    name: "Aura Neon",
    preview: "linear-gradient(135deg, #15141b 0%, #a277ff 100%)",
    settings: {
      theme: "aura-dark",
      background: { type: "gradient" as const, background: "linear-gradient(135deg, #15141b 0%, #a277ff 100%)", color1: "#15141b", color2: "#a277ff", direction: "to bottom right" },
      windowStyle: "macos" as const,
      borderRadius: 12,
      padding: 32,
      shadowStyle: "strong" as const,
      borderStyle: "gradient" as const,
      reflection: false,
      reflectionOpacity: 0.3,
    }
  },
  {
    id: "panda-style",
    name: "Panda",
    preview: "linear-gradient(135deg, #292a2b 0%, #19f9d8 100%)",
    settings: {
      theme: "panda",
      background: { type: "gradient" as const, background: "linear-gradient(135deg, #292a2b 0%, #19f9d8 100%)", color1: "#292a2b", color2: "#19f9d8", direction: "to bottom right" },
      windowStyle: "macos" as const,
      borderRadius: 12,
      padding: 32,
      shadowStyle: "medium" as const,
      borderStyle: "none" as const,
      reflection: false,
      reflectionOpacity: 0.3,
    }
  },
];

const CodeControls: React.FC<Props> = ({ state, updateState }) => {
  const [selectedTab, setSelectedTab] = useState("code");
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const customBgInputRef = useRef<HTMLInputElement>(null);

  const { presets: customPresets, savePreset, deletePreset } = useCustomPresets<CodePresetData>(PRESET_STORAGE_KEY);

  // Debounced inputs for text fields to prevent cursor jumping
  const windowTitleInput = useDebouncedInput(
    state.windowTitle,
    (value) => updateState("windowTitle", value),
    500
  );

  const watermarkTextInput = useDebouncedInput(
    state.watermark.text,
    (value) => updateState("watermark", { ...state.watermark, text: value }),
    500
  );

  const getCurrentPresetData = (): CodePresetData => ({
    theme: state.theme,
    background: state.background,
    windowStyle: state.windowStyle,
    borderRadius: state.borderRadius,
    padding: state.padding,
    shadowStyle: state.shadowStyle,
    borderStyle: state.borderStyle,
    reflection: state.reflection,
    reflectionOpacity: state.reflectionOpacity,
    scale: state.scale,
    canvasRoundness: state.canvasRoundness,
  });

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast.error("Enter a preset name");
      return;
    }
    if (savePreset(newPresetName, getCurrentPresetData())) {
      setNewPresetName("");
      toast.success("Preset saved!");
    }
  };

  const applyCustomPreset = (data: CodePresetData) => {
    Object.entries(data).forEach(([key, value]) => {
      updateState(key as keyof CodeEditorState, value);
    });
    toast.success("Preset applied!");
  };

  const applyPreset = (preset: typeof presets[0]) => {
    Object.entries(preset.settings).forEach(([key, value]) => {
      updateState(key as keyof CodeEditorState, value);
    });
  };

  const handleRandomBackground = () => {
    const randomBg = gereateRandomGradient();
    updateState("background", {
      type: "gradient",
      background: randomBg.background,
      color1: randomBg.color1,
      color2: randomBg.color2,
      direction: randomBg.direction,
    });
  };

  const handleCustomBackgroundChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      updateState("background", {
        type: "custom",
        background: `url(${fileUrl}) center/cover`,
        color1: "#000",
        color2: "#000",
        direction: "custom",
      });
    }
  };

  const resetTransforms = () => {
    updateState("tilt", { name: "to center", value: "rotate(0)" });
    updateState("left", 0);
    updateState("top", 0);
    updateState("rotate", 0);
    updateState("scale", 1);
  };

  const PanelHeading = ({ title }: { title: string }) => (
    <h2 className="text-[0.75rem] uppercase tracking-wider font-semibold px-4 py-3 bg-gradient-to-r from-base-200/80 to-base-200/40 text-gray-600 border-b border-base-200/50 flex items-center gap-2">
      <span className="w-1 h-4 bg-primary rounded-full"></span>
      {title}
    </h2>
  );

  const Control = ({
    title,
    value,
    children,
    onTap,
  }: {
    title: string;
    value?: any;
    children?: React.ReactNode;
    onTap?: () => void;
  }) => (
    <div 
      className={`flex items-center justify-between py-3 px-4 border-b border-base-200/60 ${onTap ? "cursor-pointer hover:bg-base-200/30" : ""}`}
      onClick={onTap}
    >
      <div className="flex items-center gap-2">
        <span className="text-primary-content font-medium">{title}</span>
        {value !== undefined && (
          <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium text-gray-600">{value}</span>
        )}
      </div>
      {children}
    </div>
  );

  // Option button for tabs - matching other editors
  const OptionButton = ({
    title,
    children,
  }: {
    children: React.ReactNode;
    title: string;
  }) => {
    const triggerValue = title.toLowerCase();
    const isActive = selectedTab === triggerValue;
    return (
      <div
        className={`flex justify-center items-center gap-2 font-medium px-4 py-2.5 transition-all duration-200 cursor-pointer ${
          isActive
            ? "bg-base-100 rounded-lg shadow-sm text-primary"
            : "text-primary-content hover:text-primary"
        }`}
        onClick={() => setSelectedTab(triggerValue)}
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
      className="flex flex-col transition-opacity duration-300 opacity-100"
    >
      {/* Top Buttons Container - Code, Style, Presets */}
      <div className="grid grid-cols-3 bg-base-200/60 rounded-xl p-1 mb-3 cursor-pointer backdrop-blur-sm">
        <OptionButton title="Code">
          <BiCode />
        </OptionButton>
        <OptionButton title="Style">
          <IoMdOptions />
        </OptionButton>
        <OptionButton title="Presets">
          <BsBookmarkFill />
        </OptionButton>
      </div>

      {/* Panel Content */}
      <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
        {selectedTab === "code" ? (
          <div className="p-4">
            <textarea
              value={state.code}
              onChange={(e) => updateState("code", e.target.value)}
              className="w-full h-[calc(100vh-320px)] p-4 font-mono text-sm bg-base-200 rounded-lg border-2 border-base-300 focus:border-primary focus:outline-none resize-none"
              placeholder="Paste your code here..."
              spellCheck={false}
            />
          </div>
        ) : selectedTab === "style" ? (
          <div className="relative rounded-md">
            <PanelHeading title="Editor Settings" />
            
            {/* Language */}
            <Control title="Language" value={languagesList.find(l => l.id === state.language)?.name}>
              <select
                value={state.language}
                onChange={(e) => updateState("language", e.target.value)}
                className="select select-sm select-bordered max-w-[120px]"
              >
                {languagesList.map((lang) => (
                  <option key={lang.id} value={lang.id}>{lang.name}</option>
                ))}
              </select>
            </Control>

            {/* Theme */}
            <Control title="Theme" value={themesList.find(t => t.id === state.theme)?.name}>
              <select
                value={state.theme}
                onChange={(e) => updateState("theme", e.target.value)}
                className="select select-sm select-bordered max-w-[150px]"
              >
                <optgroup label="Dark Themes">
                  {themesList.filter(t => t.isDark).map((theme) => (
                    <option key={theme.id} value={theme.id}>{theme.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Light Themes">
                  {themesList.filter(t => !t.isDark).map((theme) => (
                    <option key={theme.id} value={theme.id}>{theme.name}</option>
                  ))}
                </optgroup>
              </select>
            </Control>

            {/* Font Size */}
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Font Size</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {state.fontSize}px
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="24"
                value={state.fontSize}
                onChange={(e) => updateState("fontSize", Number(e.target.value))}
                className="range range-xs range-primary w-full"
              />
            </div>

            {/* Font Family */}
            <Control title="Font Family" value={fontFamilies.find(f => f.value === state.fontFamily)?.name}>
              <select
                value={state.fontFamily}
                onChange={(e) => updateState("fontFamily", e.target.value)}
                className="select select-sm select-bordered max-w-[140px]"
              >
                {fontFamilies.map((font) => (
                  <option key={font.id} value={font.value}>{font.name}</option>
                ))}
              </select>
            </Control>

            {/* Line Numbers */}
            <Control title="Line Numbers">
              <label className="custom-toggle">
                <input
                  type="checkbox"
                  checked={state.lineNumbers}
                  onChange={(e) => updateState("lineNumbers", e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </Control>

            {/* Line Start */}
            <Control title="Line Start" value={state.lineStart}>
              <input
                type="number"
                min="1"
                value={state.lineStart}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  updateState("lineStart", value > 0 ? value : 1);
                }}
                className="input input-sm input-bordered max-w-[80px]"
              />
            </Control>

            {/* Ligatures */}
            <Control title="Ligatures">
              <label className="custom-toggle">
                <input
                  type="checkbox"
                  checked={state.ligatures}
                  onChange={(e) => updateState("ligatures", e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </Control>

            <PanelHeading title="Image Options" />

            {/* Aspect Ratio */}
            <Control title="Aspect Ratio" value={state.aspectRatio.name}>
              <select
                value={state.aspectRatio.value}
                onChange={(e) => {
                  const selected = aspectRatios.find(ar => ar.value === e.target.value);
                  if (selected) {
                    updateState("aspectRatio", { name: selected.name, value: selected.value });
                  }
                }}
                className="select select-sm select-bordered max-w-[120px]"
              >
                {aspectRatios.map((ratio) => (
                  <option key={ratio.id} value={ratio.value}>{ratio.name}</option>
                ))}
              </select>
            </Control>

            {/* Shadow - Grid like screenshot editor */}
            <div className="py-3 px-4 border-b border-base-200/60">
              <span className="text-primary-content font-medium block mb-2">Shadow</span>
              <div className="grid grid-cols-3 gap-2">
                {boxShadows.map((shadow) => (
                  <button
                    key={shadow.id}
                    onClick={() => updateState("shadow", shadow.value)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                      state.shadow === shadow.value ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"
                    }`}
                  >
                    {shadow.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale */}
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Scale</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {state.scale}
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={state.scale}
                onChange={(e) => updateState("scale", Number(e.target.value))}
                className="range range-xs range-primary w-full"
              />
            </div>

            {/* Border Radius */}
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Border Radius</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {state.borderRadius}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                value={state.borderRadius}
                onChange={(e) => updateState("borderRadius", Number(e.target.value))}
                className="range range-xs range-primary w-full"
              />
            </div>

            {/* Padding */}
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Padding</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {state.padding}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="160"
                value={state.padding}
                onChange={(e) => updateState("padding", Number(e.target.value))}
                className="range range-xs range-primary w-full"
              />
            </div>

            <PanelHeading title="Image Transforms" />

            {/* Tilt */}
            <Control title="Tilt">
              <div className="flex gap-1">
                {tiltDirectionArray.map((dir) => (
                  <span
                    className={`text-primary-content h-8 w-8 rounded-[4px] flex justify-center items-center border-2 border-base-200 cursor-pointer hover:bg-base-200 ${
                      state.tilt.name === dir.name && "bg-base-200"
                    }`}
                    key={dir.id}
                    onClick={() => updateState("tilt", { name: dir.name, value: dir.value })}
                  >
                    {dir.icon}
                  </span>
                ))}
              </div>
            </Control>

            {/* Left */}
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Left</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {state.left}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={state.left}
                onChange={(e) => updateState("left", Number(e.target.value))}
                className="range range-xs range-primary w-full"
              />
            </div>

            {/* Top */}
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Top</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {state.top}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={state.top}
                onChange={(e) => updateState("top", Number(e.target.value))}
                className="range range-xs range-primary w-full"
              />
            </div>

            {/* Rotate */}
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Rotate</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {state.rotate}°
                </span>
              </div>
              <input
                type="range"
                min="-90"
                max="90"
                step="5"
                value={state.rotate}
                onChange={(e) => updateState("rotate", Number(e.target.value))}
                className="range range-xs range-primary w-full"
              />
            </div>

            {/* Reset Transforms */}
            <Control title="Reset Transforms" onTap={resetTransforms}>
              <BiReset className="text-xl" />
            </Control>

            <PanelHeading title="Background Options" />

            {/* Background */}
            <div className="py-3 px-4 border-b border-base-200">
              <span className="text-primary-content block mb-2">Background</span>
              <div
                className="w-full h-12 rounded-lg border-2 border-base-200 cursor-pointer hover:border-primary transition-all mb-3"
                style={{ background: state.background.background }}
                onClick={() => setShowBgPicker(!showBgPicker)}
              />
              {showBgPicker && (
                <BackgroundPicker
                  background={state.background}
                  onBackgroundChange={(bg: BackgroundConfig) => updateState("background", bg)}
                  tilt={state.tilt}
                  onTiltChange={(tilt) => updateState("tilt", tilt)}
                  showTilt={false}
                />
              )}
            </div>

            {/* Canvas Roundness */}
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Roundness</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {state.canvasRoundness}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={state.canvasRoundness}
                onChange={(e) => updateState("canvasRoundness", Number(e.target.value))}
                className="range range-xs range-primary w-full"
              />
            </div>

            {/* Custom Background */}
            <label htmlFor="custom-background-code">
              <Control title="Custom Background">
                <input
                  ref={customBgInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  id="custom-background-code"
                  onChange={handleCustomBackgroundChange}
                />
                <BiChevronRight className="text-xl" />
              </Control>
            </label>

            {/* Random */}
            <Control title="Random" onTap={handleRandomBackground}>
              <FaDice className="text-xl" />
            </Control>

            <PanelHeading title="Miscellaneous" />

            {/* Noise Effect */}
            <Control title="Noise">
              <label className="custom-toggle">
                <input
                  type="checkbox"
                  checked={state.noise}
                  onChange={(e) => updateState("noise", e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </Control>

            {/* Frame Visibility */}
            <Control title="Frame Visible">
              <label className="custom-toggle">
                <input
                  type="checkbox"
                  checked={state.frameVisible}
                  onChange={(e) => updateState("frameVisible", e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </Control>

            <PanelHeading title="Window Settings" />

            {/* Window Style */}
            <Control title="Window Style">
              <div className="flex gap-1">
                {(["none", "macos", "windows"] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => updateState("windowStyle", style)}
                    className={`px-3 py-1 rounded text-xs capitalize ${
                      state.windowStyle === style
                        ? "bg-primary text-white"
                        : "bg-base-200 hover:bg-base-300"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </Control>

            {/* Window Title */}
            <Control title="Window Title">
              <input
                type="text"
                value={windowTitleInput.localValue}
                onChange={(e) => windowTitleInput.handleChange(e.target.value)}
                className="input input-sm input-bordered max-w-[140px]"
                placeholder="Title"
              />
            </Control>

            {/* Header Visibility */}
            <Control title="Header Visible">
              <label className="custom-toggle">
                <input
                  type="checkbox"
                  checked={state.headerVisible}
                  onChange={(e) => updateState("headerVisible", e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </Control>

            {/* Window Background */}
            <Control title="Window Background">
              <div className="flex gap-1">
                {(["default", "alternative"] as const).map((bg) => (
                  <button
                    key={bg}
                    onClick={() => updateState("windowBackground", bg)}
                    className={`px-3 py-1 rounded text-xs capitalize ${
                      state.windowBackground === bg
                        ? "bg-primary text-white"
                        : "bg-base-200 hover:bg-base-300"
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </Control>

            {/* Shadow Style */}
            <Control title="Shadow Style" value={shadowStyles.find(s => s.id === state.shadowStyle)?.name}>
              <select
                value={state.shadowStyle}
                onChange={(e) => updateState("shadowStyle", e.target.value as typeof state.shadowStyle)}
                className="select select-sm select-bordered max-w-[120px]"
              >
                {shadowStyles.map((shadow) => (
                  <option key={shadow.id} value={shadow.id}>{shadow.name}</option>
                ))}
              </select>
            </Control>

            {/* Border Style */}
            <Control title="Border Style">
              <div className="flex gap-1">
                {borderStyles.map((border) => (
                  <button
                    key={border.id}
                    onClick={() => updateState("borderStyle", border.id as typeof state.borderStyle)}
                    className={`px-3 py-1 rounded text-xs capitalize ${
                      state.borderStyle === border.id
                        ? "bg-primary text-white"
                        : "bg-base-200 hover:bg-base-300"
                    }`}
                  >
                    {border.name}
                  </button>
                ))}
              </div>
            </Control>

            {/* Reflection */}
            <Control title="Reflection">
              <label className="custom-toggle">
                <input
                  type="checkbox"
                  checked={state.reflection}
                  onChange={(e) => updateState("reflection", e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </Control>

            {/* Reflection Opacity - only show when reflection is enabled */}
            {state.reflection && (
              <div className="p-4 border-b border-base-200/60">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-gray-500 font-medium">Reflection Opacity</span>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {Math.round(state.reflectionOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={state.reflectionOpacity}
                  onChange={(e) => updateState("reflectionOpacity", parseFloat(e.target.value))}
                  className="range range-xs range-primary w-full"
                />
              </div>
            )}

            {/* Watermark */}
            <Control title="Watermark">
              <label className="custom-toggle">
                <input
                  type="checkbox"
                  checked={state.watermark.visible}
                  onChange={(e) => updateState("watermark", { ...state.watermark, visible: e.target.checked })}
                />
                <span className="slider"></span>
              </label>
            </Control>

            {/* Watermark Text */}
            {state.watermark.visible && (
              <Control title="Watermark Text">
                <input
                  type="text"
                  value={watermarkTextInput.localValue}
                  onChange={(e) => watermarkTextInput.handleChange(e.target.value)}
                  className="input input-sm input-bordered max-w-[140px]"
                  placeholder="Your watermark"
                />
              </Control>
            )}
          </div>
        ) : (
          <div className="p-4">
            {/* Save Custom Preset */}
            <div className="mb-4 p-3 bg-base-200/50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Save current style as preset</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Preset name"
                  className="input input-sm input-bordered flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
                />
                <button onClick={handleSavePreset} className="btn btn-sm btn-primary">Save</button>
              </div>
            </div>

            {/* Custom Presets */}
            {customPresets.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2 font-medium">Your Presets</p>
                <div className="grid grid-cols-2 gap-3">
                  {customPresets.map((preset) => (
                    <div key={preset.id} className="group relative">
                      <button
                        onClick={() => applyCustomPreset(preset.data)}
                        className="w-full overflow-hidden rounded-lg border-2 border-base-200 hover:border-primary transition-all"
                      >
                        <div 
                          className="h-16 w-full"
                          style={{ background: preset.data.background.background }}
                        />
                        <div className="p-2 bg-base-100 text-center">
                          <span className="text-xs font-medium text-primary-content">{preset.name}</span>
                        </div>
                      </button>
                      <button
                        onClick={() => deletePreset(preset.id)}
                        className="absolute top-1 right-1 w-6 h-6 bg-error text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/80"
                      >
                        <BsTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Default Presets */}
            <p className="text-xs text-gray-500 mb-2 font-medium">Default Presets</p>
            <div className="grid grid-cols-2 gap-3">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className="group relative overflow-hidden rounded-lg border-2 border-base-200 hover:border-primary transition-all"
                >
                  <div 
                    className="h-20 w-full"
                    style={{ background: preset.preview }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div 
                        className="w-3/4 h-10 rounded-md shadow-lg"
                        style={{ 
                          backgroundColor: preset.settings.theme.includes('light') ? '#fff' : '#1a1a2e',
                          opacity: 0.9
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-2 bg-base-100 text-center">
                    <span className="text-xs font-medium text-primary-content">{preset.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CodeControls;
