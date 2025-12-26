import { ChangeEvent, ReactNode, useState } from "react";
import { BiChevronRight, BiReset, BiTrash, BiText, BiEraser } from "react-icons/bi";
import {
  BsAspectRatio,
  BsBookmarkFill,
  BsCursor,
  BsPencil,
  BsSlash,
  BsArrowUpRight,
  BsSquare,
  BsCircle,
  BsDropletHalf,
} from "react-icons/bs";
import { TbHighlight } from "react-icons/tb";
import { SiShadow } from "react-icons/si";
import { FaDice } from "react-icons/fa";
import { IoMdOptions } from "react-icons/io";

// local
import BackgroundPickerWidget from "./BackgroundPicker";
import { useEditorContext } from "@/context/Editor";
import { BackgroundType } from "@/interface";
import { gereateRandomGradient } from "@/utils/randomGradient";

import CustomSelect from "./CustomSelect";
import IconTile from "../../common/IconTile";
import { aspectRatios, tiltDirectionArray } from "@/data/misc";
import { boxShadows } from "@/data/gradients";
import InputButton from "../../common/InputButton";
import Control from "./Control";
import PanelHeading from "./PanelHeading";
import BackgroundTile from "./BackgroundTile";
import Presets from "./Presets";
import LocalPresetsSection from "./LocalPresetsSection";
import { useAuthContext } from "@/context/User";
import FramePicker from "./FramePicker";

interface Props { }

const ControlPanel: React.FC<Props> = () => {
  const [picker, setPicker] = useState<String | null>(null);
  const [selectedOption, setSelectedOption] = useState("options");

  const {
    currentBackground: { background },
    updateBackground,
    selectedImage,
    padding,
    scale,
    borderRadius,
    canvasRoundness,
    updateData,
    currentBackgroundType,
    tilt,
    aspectRatio,
    currentBoxShadow,
    noise,
    watermark,
    left,
    right,
    rotate,
    selectedFrame,
    showAnnotations,
    drawingTool,
    strokeColor,
    strokeWidth,
    fillColor,
    opacity,
    strokeStyle,
    sloppiness,
  } = useEditorContext();
  const { currentUser } = useAuthContext();

  const closePicker = () => {
    setPicker(null);
  };

  const handleRandom = () => {
    updateBackground && updateBackground(gereateRandomGradient());
    if (currentBackgroundType != BackgroundType.gradient)
      updateData &&
        updateData("currentBackgroundType", BackgroundType.gradient);
  };

  const onValueChanged = (name: string, value: string) => {
    updateData && updateData(name, Number(value));
  };

  const applyCustomBoxShadow = (value: String) => {
    if (updateData) {
      updateData("currentBoxShadow", {
        name: "custom",
        value,
      });

      closePicker();
    }
  };

  const handleCustomBackgroundChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);

      const background = {
        background: `url(${fileUrl})`,
        color1: "#242424",
        color2: "#a4a4a4",
        direction: "custom",
      };

      updateBackground && updateBackground(background);
      updateData && updateData("currentBackgroundType", BackgroundType.custom);
    }
  };

  const handleNoiseToggle = (value: boolean) => {
    updateData && updateData("noise", value);
  };

  const handleWatermarkToggle = (value: boolean) => {
    updateData &&
      updateData("watermark", {
        ...watermark,
        visible: value,
      });
  };

  const clearAnnotations = () => {
    updateData && updateData("annotationElements", []);
  };

  const setDrawingTool = (tool: string) => {
    updateData && updateData("drawingTool", tool);
  };

  const setStrokeColor = (color: string) => {
    updateData && updateData("strokeColor", color);
  };

  const setStrokeWidth = (width: number) => {
    updateData && updateData("strokeWidth", width);
  };

  const setFillColor = (color: string) => {
    updateData && updateData("fillColor", color);
  };

  const setOpacity = (value: number) => {
    updateData && updateData("opacity", value);
  };

  const setStrokeStyle = (style: "solid" | "dashed" | "dotted") => {
    updateData && updateData("strokeStyle", style);
  };

  const setSloppiness = (value: number) => {
    updateData && updateData("sloppiness", value);
  };

  const strokeColors = ["#1e1e1e", "#e03131", "#2f9e44", "#1971c2", "#f08c00", "#e64980"];
  const fillColors = ["transparent", "#ffe3e3", "#d3f9d8", "#d0ebff", "#fff3bf", "#fcc2d7"];

  const drawingTools = [
    { id: "select", icon: <BsCursor />, title: "Select & Move (V)" },
    { id: "rectangle", icon: <BsSquare />, title: "Rectangle (R)" },
    { id: "ellipse", icon: <BsCircle />, title: "Ellipse (O)" },
    { id: "arrow", icon: <BsArrowUpRight />, title: "Arrow (A)" },
    { id: "line", icon: <BsSlash />, title: "Line (L)" },
    { id: "pen", icon: <BsPencil />, title: "Pen (P)" },
    { id: "text", icon: <BiText />, title: "Text (T)" },
    { id: "highlighter", icon: <TbHighlight />, title: "Highlighter (H)" },
    { id: "blur", icon: <BsDropletHalf />, title: "Blur Area (B)" },
    { id: "eraser", icon: <BiEraser />, title: "Eraser (E)" },
  ];

  const openPicker = (picker: string) => {
    setPicker((val) => (val != null ? null : picker));
  };

  const resetTransforms = () => {
    if (updateData) {
      updateData("rotate", 0);
      updateData("left", 0);
      updateData("right", 0);
      updateData("tilt", {
        name: "to center",
        value: "rotate(0)",
      });
    }
  };

  // elements
  const OptionButton = ({
    title,
    children,
  }: {
    children: ReactNode;
    title: string;
  }) => {
    const triggerValue = title.toLocaleLowerCase();
    const isActive = selectedOption == triggerValue;
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

  const TileWrapper = ({ children }: { children: ReactNode }) => {
    return (
      <div className="grid-cols-3 gap-2 grid p-[1rem] pt-2">{children}</div>
    );
  };

  const NullScreen = () => {
    return (
      <div
        className="fixed inset-0 bg-transparent z-10"
        onClick={closePicker}
      />
    );
  };

  return (
    <section
      style={{ pointerEvents: selectedImage ? "auto" : "none" }}
      className={`flex flex-col transition-opacity duration-300 ${selectedImage ? "opacity-100" : "opacity-90"
        }`}
    >
      {/* Top Buttons Container */}
      <div className="grid grid-cols-2 bg-base-200/60 rounded-xl p-1 mb-3 cursor-pointer backdrop-blur-sm">
        <OptionButton title="Options">
          <IoMdOptions />
        </OptionButton>
        <OptionButton title="Presets">
          <BsBookmarkFill />
        </OptionButton>
      </div>

      {/* options panel wrapper */}
      {selectedOption == "options" ? (
        <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
          {picker != null && <NullScreen />}
          {/* inner scrolling wrapper */}
          <div className="relative rounded-xl">
            {/* Drawing Tools Section - Visible when drawing mode is active */}
            {showAnnotations && (
              <>
                <PanelHeading title="Drawing Tools" />
                <div className="p-3 pb-2 animate-fade-in">
                  {/* Tools grid */}
                  <div className="flex flex-wrap items-center justify-start gap-1.5 mb-4">
                    {drawingTools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => setDrawingTool(tool.id)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 text-sm ${
                          drawingTool === tool.id
                            ? "bg-primary text-primary-content shadow-md shadow-primary/30 scale-105"
                            : "hover:bg-base-200 text-primary-content hover:scale-105"
                        }`}
                        title={tool.title}
                      >
                        {tool.icon}
                      </button>
                    ))}
                  </div>

                  {/* Stroke Color */}
                  <div className="mb-4">
                    <span className="text-xs text-gray-500 font-medium block mb-2">Stroke</span>
                    <div className="flex gap-2 items-center">
                      {strokeColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setStrokeColor(color)}
                          className={`w-7 h-7 rounded-lg transition-all duration-200 ${
                            strokeColor === color
                              ? "ring-2 ring-primary ring-offset-2 scale-110"
                              : "hover:scale-110 hover:shadow-md"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <input
                        type="color"
                        value={strokeColor}
                        onChange={(e) => setStrokeColor(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0"
                      />
                    </div>
                  </div>

                  {/* Fill Color */}
                  <div className="mb-4">
                    <span className="text-xs text-gray-500 font-medium block mb-2">Fill</span>
                    <div className="flex gap-2 items-center">
                      {fillColors.map((color, i) => (
                        <button
                          key={i}
                          onClick={() => setFillColor(color)}
                          className={`w-7 h-7 rounded-lg transition-all duration-200 border ${
                            fillColor === color
                              ? "ring-2 ring-primary ring-offset-2 scale-110"
                              : "hover:scale-110 hover:shadow-md"
                          } ${
                            color === "transparent"
                              ? "border-dashed border-gray-300"
                              : "border-transparent"
                          }`}
                          style={{
                            backgroundColor: color === "transparent" ? "#fff" : color,
                            backgroundImage:
                              color === "transparent"
                                ? "linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)"
                                : undefined,
                            backgroundSize: "6px 6px",
                            backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0px",
                          }}
                        />
                      ))}
                      <input
                        type="color"
                        value={fillColor === "transparent" ? "#ffffff" : fillColor}
                        onChange={(e) => setFillColor(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0"
                      />
                    </div>
                  </div>

                  {/* Stroke Width & Style Row */}
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1">
                      <span className="text-xs text-gray-500 font-medium block mb-2">Width</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 4].map((w) => (
                          <button
                            key={w}
                            onClick={() => setStrokeWidth(w)}
                            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center transition-all duration-200 ${
                              strokeWidth === w
                                ? "bg-primary text-primary-content shadow-md shadow-primary/20"
                                : "bg-base-200 hover:bg-base-300"
                            }`}
                          >
                            <div
                              className="rounded-full"
                              style={{ 
                                width: w * 3 + 4, 
                                height: w + 1,
                                backgroundColor: strokeWidth === w ? "currentColor" : "#666"
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-gray-500 font-medium block mb-2">Style</span>
                      <div className="flex gap-1.5">
                        {(["solid", "dashed", "dotted"] as const).map((style) => (
                          <button
                            key={style}
                            onClick={() => setStrokeStyle(style)}
                            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center transition-all duration-200 ${
                              strokeStyle === style
                                ? "bg-primary text-primary-content shadow-md shadow-primary/20"
                                : "bg-base-200 hover:bg-base-300"
                            }`}
                          >
                            <svg width="20" height="2" viewBox="0 0 20 2">
                              <line
                                x1="0"
                                y1="1"
                                x2="20"
                                y2="1"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeDasharray={
                                  style === "dashed" ? "4,2" : style === "dotted" ? "1,2" : "none"
                                }
                              />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sloppiness */}
                  <div className="mb-4">
                    <span className="text-xs text-gray-500 font-medium block mb-2">Sloppiness</span>
                    <div className="flex gap-1.5">
                      {[
                        { value: 0, label: "None" },
                        { value: 1, label: "Low" },
                        { value: 2, label: "High" },
                      ].map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setSloppiness(item.value)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                            sloppiness === item.value
                              ? "bg-primary text-primary-content shadow-md shadow-primary/20"
                              : "bg-base-200 hover:bg-base-300"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Opacity */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500 font-medium">Opacity</span>
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{opacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      className="range range-xs range-primary w-full"
                    />
                  </div>

                  {/* Clear Button */}
                  <button
                    onClick={clearAnnotations}
                    className="w-full py-2.5 rounded-lg bg-base-200 hover:bg-red-50 hover:text-red-500 text-xs font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-sm"
                  >
                    <BiTrash className="text-sm" /> Clear All Annotations
                  </button>
                </div>
              </>
            )}

            <PanelHeading title="Image Options" />
            <div
              className="dropdown dropdown-end w-full"
              onClick={() => openPicker("frame-picker")}
            >
              <Control title="Frame" value={selectedFrame.name}>
                <BiChevronRight className="text-xl" />
              </Control>

              {picker == "frame-picker" && <FramePicker />}
            </div>
            <div
              className="dropdown dropdown-end w-full"
              onClick={() => openPicker("ratio-picker")}
            >
              <Control title="Aspect Ratio" value={aspectRatio.name}>
                <BiChevronRight className="text-xl" />
              </Control>

              {picker == "ratio-picker" && (
                <CustomSelect
                  title="Select Aspect Ratio"
                  icon={<BsAspectRatio className="text-[1rem]" />}
                >
                  <TileWrapper>
                    {aspectRatios.map((ratio) => (
                      <IconTile
                        active={aspectRatio.name == ratio.name}
                        key={ratio.id}
                        title={ratio.name}
                        onTap={() => {
                          let { id, ...data } = ratio;
                          updateData && updateData("aspectRatio", data);
                        }}
                      />
                    ))}
                  </TileWrapper>
                </CustomSelect>
              )}
            </div>
            <div className="relative">
              <Control
                title="Shadow"
                value={currentBoxShadow.name}
                onTap={() => openPicker("shadow-picker")}
              >
                <BiChevronRight className="text-xl" />
              </Control>
              {picker == "shadow-picker" && (
                <CustomSelect
                  title="Select Box Shadow"
                  icon={<SiShadow className="text-[1rem]" />}
                >
                  <TileWrapper>
                    {boxShadows.map((shadow) => (
                      <IconTile
                        active={currentBoxShadow.name == shadow.name}
                        key={shadow.id}
                        title={shadow.name}
                        onTap={() => {
                          let { id, ...data } = shadow;
                          if (updateData) {
                            updateData("currentBoxShadow", data);
                            closePicker();
                          }
                        }}
                      />
                    ))}
                  </TileWrapper>
                  <InputButton
                    title="Apply Shadow"
                    onTap={applyCustomBoxShadow}
                    value={currentBoxShadow.value}
                  />
                </CustomSelect>
              )}
            </div>

            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Scale</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {scale}
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step=".05"
                className="range range-xs range-primary w-full"
                name="scale"
                value={scale}
                onChange={(e) => onValueChanged(e.target.name, e.target.value)}
              />
            </div>
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Border Radius</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {borderRadius}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                name="borderRadius"
                className="range range-xs range-primary w-full"
                value={borderRadius}
                onChange={(e) => onValueChanged(e.target.name, e.target.value)}
              />
            </div>
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Padding</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {padding}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="160"
                step="1"
                name="padding"
                className="range range-xs range-primary w-full"
                value={padding}
                onChange={(e) => onValueChanged(e.target.name, e.target.value)}
              />
            </div>

            <PanelHeading title="Image Transforms" />
            <Control title="Tilt">
              <div className="flex gap-1">
                {tiltDirectionArray.map((dir) => (
                  <span
                    className={`text-primary-content h-8 w-8 rounded-[4px] flex justify-center items-center border-2 border-base-200 ${tilt.name == dir.name && "bg-base-200"
                      }`}
                    key={dir.id}
                    onClick={() => {
                      const { name, value } = dir;
                      updateData && updateData("tilt", { name, value });
                    }}
                  >
                    {dir.icon}
                  </span>
                ))}
              </div>
            </Control>
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Left</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {left}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                name="left"
                className="range range-xs range-primary w-full"
                value={left}
                onChange={(e) => onValueChanged(e.target.name, e.target.value)}
              />
            </div>
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Top</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {right}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                name="right"
                className="range range-xs range-primary w-full"
                value={right}
                onChange={(e) => onValueChanged(e.target.name, e.target.value)}
              />
            </div>
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Rotate</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {rotate}°
                </span>
              </div>
              <input
                type="range"
                min="-90"
                max="90"
                step="5"
                name="rotate"
                className="range range-xs range-primary w-full"
                value={rotate}
                onChange={(e) => onValueChanged(e.target.name, e.target.value)}
              />
            </div>

            <Control title="Reset transforms" onTap={resetTransforms}>
              <BiReset className="text-xl" />
            </Control>
            <PanelHeading title="Background options" />
            <div className="relative">
              <Control
                title="Background"
                value={BackgroundType[currentBackgroundType]}
              >
                <BackgroundTile
                  background={background}
                  onTap={() => openPicker("bg-picker")}
                />
              </Control>
              {picker == "bg-picker" && (
                <>
                  <BackgroundPickerWidget closePicker={closePicker} />
                </>
              )}
            </div>
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Roundness</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {canvasRoundness}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                name="canvasRoundness"
                className="range range-xs range-primary w-full"
                value={canvasRoundness}
                onChange={(e) => onValueChanged(e.target.name, e.target.value)}
              />
            </div>
            <label htmlFor="custom-background">
              <Control title="Custom Background">
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  id="custom-background"
                  onChange={(e) => handleCustomBackgroundChange(e)}
                />
                <BiChevronRight className="text-xl" />
              </Control>
            </label>
            <Control title="Random" onTap={() => handleRandom()}>
              <FaDice className="text-xl" />
            </Control>

            <PanelHeading title="Miscellaneous" />
            <Control title="Noise">
              <label className="custom-toggle">
                <input
                  type="checkbox"
                  checked={noise}
                  onChange={(e) => handleNoiseToggle(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </Control>
            <Control title="Watermark">
              <label className="custom-toggle">
                <input
                  type="checkbox"
                  checked={watermark.visible}
                  onChange={(e) => handleWatermarkToggle(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </Control>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
          <PanelHeading title="Quick Presets" />
          {/* Built-in quick presets */}
          <QuickPresets />
          
          <PanelHeading title="Your Local Presets" />
          {/* User's local presets stored in localStorage */}
          <LocalPresetsSection />
          
          <PanelHeading title="Cloud Presets" />
          {currentUser ? (
            <Presets />
          ) : (
            <div className="h-[60px] flex items-center justify-center w-full">
              <span className="text-sm text-gray-500">
                Login to save cloud presets
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

// Built-in quick presets that work without login
const quickPresets = [
  {
    id: "clean-minimal",
    name: "Clean Minimal",
    preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    settings: {
      padding: 40,
      borderRadius: 12,
      canvasRoundness: 8,
      scale: 1,
      noise: false,
    }
  },
  {
    id: "soft-shadow",
    name: "Soft Shadow",
    preview: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    settings: {
      padding: 48,
      borderRadius: 16,
      canvasRoundness: 12,
      scale: 0.95,
      noise: false,
    }
  },
  {
    id: "dark-mode",
    name: "Dark Mode",
    preview: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    settings: {
      padding: 32,
      borderRadius: 8,
      canvasRoundness: 4,
      scale: 1,
      noise: true,
    }
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    preview: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    settings: {
      padding: 56,
      borderRadius: 20,
      canvasRoundness: 16,
      scale: 0.9,
      noise: false,
    }
  },
  {
    id: "sunset-glow",
    name: "Sunset Glow",
    preview: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    settings: {
      padding: 44,
      borderRadius: 14,
      canvasRoundness: 10,
      scale: 0.95,
      noise: false,
    }
  },
  {
    id: "forest-green",
    name: "Forest Green",
    preview: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    settings: {
      padding: 36,
      borderRadius: 10,
      canvasRoundness: 6,
      scale: 1,
      noise: false,
    }
  },
];

// Default values for resetting when applying presets
const getDefaultEditorValues = () => ({
  padding: 40,
  borderRadius: 12,
  canvasRoundness: 8,
  scale: 1,
  noise: false,
  left: 0,
  right: 0,
  rotate: 0,
  tilt: { name: "to center", value: "rotate(0)" },
});

const QuickPresets: React.FC = () => {
  const { updateData, updateBackground } = useEditorContext();

  const applyPreset = (preset: typeof quickPresets[0]) => {
    if (updateData && updateBackground) {
      // Apply background
      updateBackground({
        background: preset.preview,
        color1: "#667eea",
        color2: "#764ba2",
        direction: "135deg",
      });
      updateData("currentBackgroundType", BackgroundType.gradient);
      
      // Reset all values to defaults first, then apply preset settings
      const defaults = getDefaultEditorValues();
      const mergedSettings = { ...defaults, ...preset.settings };
      
      Object.entries(mergedSettings).forEach(([key, value]) => {
        updateData(key, value);
      });
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 p-3">
      {quickPresets.map((preset, index) => (
        <button
          key={preset.id}
          onClick={() => applyPreset(preset)}
          className="group relative overflow-hidden rounded-xl border border-base-200/80 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 press-effect stagger-item"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div 
            className="h-20 w-full relative"
            style={{ background: preset.preview }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="w-3/4 h-10 rounded-lg shadow-xl bg-white/95 transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </div>
          <div className="p-2 bg-base-100 text-center border-t border-base-200/50">
            <span className="text-xs font-semibold text-primary-content group-hover:text-primary transition-colors">{preset.name}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ControlPanel;
