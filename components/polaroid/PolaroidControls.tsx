import { useState, useRef, ChangeEvent, ReactNode } from "react";
import { IoMdOptions } from "react-icons/io";
import { BsBookmarkFill } from "react-icons/bs";
import { MdFilterVintage } from "react-icons/md";
import { FaDice } from "react-icons/fa";
import { BiReset, BiChevronRight } from "react-icons/bi";
import { PolaroidState } from "./types";
import BackgroundPicker, { BackgroundConfig } from "../common/BackgroundPicker";

interface Props {
  state: PolaroidState;
  updateState: (updates: Partial<PolaroidState>) => void;
  polaroidRef: React.RefObject<HTMLDivElement>;
}

const PolaroidControls = ({ state, updateState }: Props) => {
  const [selectedTab, setSelectedTab] = useState("options");
  const [showBgPicker, setShowBgPicker] = useState(false);
  const customBgInputRef = useRef<HTMLInputElement>(null);

  const filters = [
    { id: "none", name: "None" },
    { id: "vintage", name: "Vintage" },
    { id: "sepia", name: "Sepia" },
    { id: "bw", name: "B&W" },
    { id: "faded", name: "Faded" },
    { id: "warm", name: "Warm" },
    { id: "cool", name: "Cool" },
    { id: "cpm35", name: "CPM35 ⭐" },
    { id: "fqs", name: "FQS R" },
    { id: "hoga", name: "Hoga" },
    { id: "fxn", name: "FXN R" },
    { id: "nt16", name: "NT16" },
    { id: "grd", name: "GRD R" },
    { id: "dClassic", name: "D Classic" },
    { id: "135sr", name: "135 SR" },
    { id: "golf", name: "Golf" },
    { id: "s67", name: "S 67" },
    { id: "kino", name: "Kino" },
    { id: "ct100", name: "CT100" },
    { id: "portra", name: "Portra 400" },
    { id: "ektar", name: "Ektar 100" },
    { id: "velvia", name: "Velvia 50" },
    { id: "provia", name: "Provia 100" },
    { id: "superia", name: "Superia" },
    { id: "gold200", name: "Gold 200" },
    { id: "ultramax", name: "Ultramax" },
    { id: "cinestill", name: "CineStill" },
  ];

  const fonts = [
    { id: "Caveat", name: "Caveat" },
    { id: "Permanent Marker", name: "Marker" },
    { id: "Indie Flower", name: "Indie" },
    { id: "Shadows Into Light", name: "Shadows" },
    { id: "Patrick Hand", name: "Patrick" },
    { id: "Gloria Hallelujah", name: "Gloria" },
    { id: "Arial", name: "Arial" },
    { id: "Georgia", name: "Georgia" },
  ];

  const handleCustomBackgroundChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      updateState({
        backgroundType: "solid",
        backgroundColor: `url(${fileUrl}) center/cover`,
      });
    }
  };

  const resetAdjustments = () => {
    updateState({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      exposure: 0,
      highlights: 0,
      shadows: 0,
      temperature: 0,
      tint: 0,
      fade: 0,
      blur: 0,
    });
  };

  const OptionButton = ({ title, children }: { children: ReactNode; title: string }) => {
    const triggerValue = title.toLowerCase();
    const isActive = selectedTab === triggerValue;
    return (
      <div
        className={`flex justify-center items-center gap-2 font-medium px-4 py-2.5 transition-all duration-200 cursor-pointer ${isActive ? "bg-base-100 rounded-lg shadow-sm text-primary" : "text-primary-content hover:text-primary"}`}
        onClick={() => setSelectedTab(triggerValue)}
      >
        <span className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>{children}</span>
        <span>{title}</span>
      </div>
    );
  };

  const PanelHeading = ({ title }: { title: string }) => (
    <h2 className="text-[0.75rem] uppercase tracking-wider font-semibold px-4 py-3 bg-gradient-to-r from-base-200/80 to-base-200/40 text-gray-600 border-b border-base-200/50 flex items-center gap-2">
      <span className="w-1 h-4 bg-primary rounded-full"></span>
      {title}
    </h2>
  );

  const Control = ({ title, value, children, onTap }: { title: string; value?: string; children?: ReactNode; onTap?: () => void }) => (
    <div className={`flex items-center justify-between py-3 px-4 border-b border-base-200/60 ${onTap ? "cursor-pointer hover:bg-base-200/30" : ""}`} onClick={onTap}>
      <div className="flex items-center gap-2">
        <span className="text-primary-content font-medium">{title}</span>
        {value && <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium text-gray-600">{value}</span>}
      </div>
      {children}
    </div>
  );

  const RangeControl = ({ label, value, min, max, step = 1, unit = "", onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (value: number) => void }) => (
    <div className="p-4 border-b border-base-200/60">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} className="range range-xs range-primary w-full" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );

  return (
    <section style={{ pointerEvents: state.image ? "auto" : "none" }} className={`flex flex-col transition-opacity duration-300 ${state.image ? "opacity-100" : "opacity-90"}`}>
      <div className="grid grid-cols-3 bg-base-200/60 rounded-xl p-1 mb-3 cursor-pointer backdrop-blur-sm">
        <OptionButton title="Options"><IoMdOptions /></OptionButton>
        <OptionButton title="Filters"><MdFilterVintage /></OptionButton>
        <OptionButton title="Presets"><BsBookmarkFill /></OptionButton>
      </div>

      <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:max-h-[calc(100vh-150px)] lg:overflow-y-auto scrollbar-hide animate-fade-in">
        {selectedTab === "options" ? (
          <div className="relative rounded-md">
            <PanelHeading title="Frame Settings" />
            <Control title="Frame Color">
              <input type="color" value={state.frameColor} onChange={(e) => updateState({ frameColor: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0" />
            </Control>
            <RangeControl label="Border Width" value={state.borderWidth} min={10} max={50} unit="px" onChange={(value) => updateState({ borderWidth: value })} />
            <RangeControl label="Bottom Border" value={state.bottomBorderWidth} min={40} max={150} unit="px" onChange={(value) => updateState({ bottomBorderWidth: value })} />
            <Control title="Texture">
              <select value={state.frameTexture || 'smooth'} onChange={(e) => updateState({ frameTexture: e.target.value as any })} className="select select-sm select-bordered">
                <option value="smooth">Smooth</option>
                <option value="paper">Paper</option>
                <option value="grain">Grainy</option>
                <option value="ragged">Ragged</option>
              </select>
            </Control>

            <PanelHeading title="Caption" />
            <div className="p-4 border-b border-base-200/60">
              <input type="text" value={state.caption} onChange={(e) => updateState({ caption: e.target.value })} placeholder="Add a caption..." className="w-full px-3 py-2 border-2 border-base-200 rounded-lg focus:border-primary focus:outline-none text-sm bg-base-100" />
            </div>
            <Control title="Font">
              <select value={state.captionFont} onChange={(e) => updateState({ captionFont: e.target.value })} className="select select-sm select-bordered">
                {fonts.map((font) => (<option key={font.id} value={font.id}>{font.name}</option>))}
              </select>
            </Control>
            <RangeControl label="Caption Size" value={state.captionSize} min={12} max={48} unit="px" onChange={(value) => updateState({ captionSize: value })} />
            <Control title="Caption Color">
              <input type="color" value={state.captionColor} onChange={(e) => updateState({ captionColor: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0" />
            </Control>

            <PanelHeading title="Transform" />
            <RangeControl label="Rotation" value={state.rotation} min={-15} max={15} unit="°" onChange={(value) => updateState({ rotation: value })} />
            <RangeControl label="Tilt" value={state.tilt} min={-20} max={20} unit="°" onChange={(value) => updateState({ tilt: value })} />
            <Control title="Shadow">
              <label className="custom-toggle"><input type="checkbox" checked={state.shadow} onChange={(e) => updateState({ shadow: e.target.checked })} /><span className="slider"></span></label>
            </Control>
            {state.shadow && <RangeControl label="Shadow Intensity" value={state.shadowIntensity} min={10} max={60} unit="%" onChange={(value) => updateState({ shadowIntensity: value })} />}
          </div>
        ) : selectedTab === "filters" ? (
          <div className="relative rounded-md">
            <PanelHeading title="Film Filters" />
            <div className="p-4 border-b border-base-200/60">
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => updateState({ filter: filter.id as PolaroidState["filter"] })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${state.filter === filter.id ? "bg-primary text-primary-content shadow-md shadow-primary/20" : "bg-base-200 hover:bg-base-300"}`}
                  >
                    {filter.name}
                  </button>
                ))}
              </div>
            </div>
            {state.filter !== "none" && <RangeControl label="Filter Intensity" value={state.filterIntensity} min={20} max={100} step={5} unit="%" onChange={(value) => updateState({ filterIntensity: value })} />}

            <PanelHeading title="Film Effects" />
            <Control title="Light Leak">
              <select value={state.lightLeak || 'none'} onChange={(e) => updateState({ lightLeak: e.target.value as any })} className="select select-sm select-bordered">
                <option value="none">None</option>
                <option value="warm">Warm</option>
                <option value="cool">Cool</option>
                <option value="rainbow">Rainbow</option>
                <option value="subtle">Subtle</option>
                <option value="orange">Orange Flare</option>
                <option value="blue">Blue Flare</option>
                <option value="pink">Pink Glow</option>
                <option value="vintage">Vintage Burn</option>
              </select>
            </Control>
            <Control title="Vignette">
              <label className="custom-toggle"><input type="checkbox" checked={state.vignette} onChange={(e) => updateState({ vignette: e.target.checked })} /><span className="slider"></span></label>
            </Control>
            {state.vignette && <RangeControl label="Vignette Intensity" value={state.vignetteIntensity} min={10} max={80} unit="%" onChange={(value) => updateState({ vignetteIntensity: value })} />}
            <Control title="Film Grain">
              <label className="custom-toggle"><input type="checkbox" checked={state.grain} onChange={(e) => updateState({ grain: e.target.checked })} /><span className="slider"></span></label>
            </Control>
            {state.grain && <RangeControl label="Grain Intensity" value={state.grainIntensity} min={5} max={50} unit="%" onChange={(value) => updateState({ grainIntensity: value })} />}

            <PanelHeading title="Adjustments" />
            <RangeControl label="Brightness" value={state.brightness} min={50} max={150} unit="%" onChange={(value) => updateState({ brightness: value })} />
            <RangeControl label="Contrast" value={state.contrast} min={50} max={150} unit="%" onChange={(value) => updateState({ contrast: value })} />
            <RangeControl label="Saturation" value={state.saturation} min={0} max={200} unit="%" onChange={(value) => updateState({ saturation: value })} />
            <RangeControl label="Exposure" value={state.exposure} min={-50} max={50} step={5} onChange={(value) => updateState({ exposure: value })} />
            <RangeControl label="Temperature" value={state.temperature} min={-50} max={50} step={5} onChange={(value) => updateState({ temperature: value })} />
            <RangeControl label="Fade" value={state.fade} min={0} max={50} unit="%" onChange={(value) => updateState({ fade: value })} />
            <RangeControl label="Blur" value={state.blur} min={0} max={10} step={0.5} unit="px" onChange={(value) => updateState({ blur: value })} />
            <Control title="Reset Adjustments" onTap={resetAdjustments}>
              <BiReset className="text-xl" />
            </Control>
          </div>
        ) : (
          <div className="relative rounded-md">
            <PanelHeading title="📸 Dazz Cam Popular" />
            <div className="p-4 border-b border-base-200/60">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => updateState({ filter: "cpm35", filterIntensity: 85, lightLeak: "subtle", vignette: false, grain: true, grainIntensity: 15, frameColor: "#faf8f5", captionFont: "Caveat", brightness: 105, contrast: 95, saturation: 115, temperature: 5, fade: 8 })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">CPM35 ⭐</button>
                <button onClick={() => updateState({ filter: "fqs", filterIntensity: 80, lightLeak: "warm", vignette: false, grain: true, grainIntensity: 20, frameColor: "#f5f0e6", captionFont: "Indie Flower", brightness: 103, contrast: 105, saturation: 120, temperature: 15 })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">FQS R Green</button>
                <button onClick={() => updateState({ filter: "hoga", filterIntensity: 90, lightLeak: "rainbow", vignette: true, vignetteIntensity: 50, grain: true, grainIntensity: 25, frameColor: "#f8f4e8", captionFont: "Permanent Marker", brightness: 95, contrast: 110, saturation: 90, blur: 0.5 })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">Hoga Lo-Fi</button>
                <button onClick={() => updateState({ filter: "fxn", filterIntensity: 85, lightLeak: "none", vignette: false, grain: false, frameColor: "#ffffff", captionFont: "Arial", brightness: 98, contrast: 130, saturation: 135, shadows: -10 })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">FXN R Fuji</button>
                <button onClick={() => updateState({ filter: "nt16", filterIntensity: 80, lightLeak: "subtle", vignette: true, vignetteIntensity: 30, grain: true, grainIntensity: 18, frameColor: "#ffffff", captionFont: "Shadows Into Light", brightness: 102, contrast: 108, saturation: 95, fade: 12 })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">NT16 Polaroid</button>
                <button onClick={() => updateState({ filter: "grd", filterIntensity: 90, lightLeak: "cool", vignette: true, vignetteIntensity: 45, grain: true, grainIntensity: 22, frameColor: "#1a1a1a", captionColor: "#e0e0e0", captionFont: "Georgia", brightness: 90, contrast: 125, saturation: 85, shadows: 15 })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">GRD R Night</button>
                <button onClick={() => updateState({ filter: "kino", filterIntensity: 85, lightLeak: "orange", vignette: true, vignetteIntensity: 35, grain: true, grainIntensity: 20, frameColor: "#f5f0e6", brightness: 100, contrast: 115, saturation: 90, temperature: -5, fade: 15 })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">Kino Cinema</button>
                <button onClick={() => updateState({ filter: "ct100", filterIntensity: 80, lightLeak: "blue", vignette: false, grain: true, grainIntensity: 15, frameColor: "#ffffff", brightness: 102, contrast: 110, saturation: 105, temperature: -15, tint: 5 })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">CT100 Tungsten</button>
              </div>
            </div>

            <PanelHeading title="🎞️ Film Stocks" />
            <div className="p-4 border-b border-base-200/60">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => updateState({ filter: "portra", filterIntensity: 85, lightLeak: "subtle", vignette: false, grain: true, grainIntensity: 12, frameColor: "#faf8f5", brightness: 103, contrast: 95, saturation: 95, temperature: 8, highlights: -10, shadows: 15 })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">Portra 400</button>
                <button onClick={() => updateState({ filter: "ektar", filterIntensity: 90, lightLeak: "none", vignette: false, grain: true, grainIntensity: 10, frameColor: "#ffffff", brightness: 100, contrast: 115, saturation: 140, temperature: 5 })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">Ektar 100</button>
                <button onClick={() => updateState({ filter: "velvia", filterIntensity: 95, lightLeak: "none", vignette: false, grain: true, grainIntensity: 8, frameColor: "#ffffff", brightness: 98, contrast: 125, saturation: 160, shadows: -15 })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">Velvia 50</button>
                <button onClick={() => updateState({ filter: "provia", filterIntensity: 80, lightLeak: "none", vignette: false, grain: true, grainIntensity: 10, frameColor: "#ffffff", brightness: 100, contrast: 108, saturation: 110, temperature: 0 })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">Provia 100</button>
                <button onClick={() => updateState({ filter: "superia", filterIntensity: 85, lightLeak: "warm", vignette: false, grain: true, grainIntensity: 18, frameColor: "#f5f0e6", brightness: 102, contrast: 105, saturation: 115, temperature: 10, fade: 5 })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">Superia 400</button>
                <button onClick={() => updateState({ filter: "gold200", filterIntensity: 85, lightLeak: "warm", vignette: false, grain: true, grainIntensity: 20, frameColor: "#f8f4e8", brightness: 105, contrast: 100, saturation: 120, temperature: 20, fade: 8 })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">Gold 200</button>
                <button onClick={() => updateState({ filter: "ultramax", filterIntensity: 90, lightLeak: "subtle", vignette: false, grain: true, grainIntensity: 15, frameColor: "#ffffff", brightness: 103, contrast: 112, saturation: 130, temperature: 8 })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">Ultramax 400</button>
                <button onClick={() => updateState({ filter: "cinestill", filterIntensity: 90, lightLeak: "orange", vignette: true, vignetteIntensity: 25, grain: true, grainIntensity: 18, frameColor: "#1a1a1a", captionColor: "#e0e0e0", brightness: 100, contrast: 115, saturation: 105, temperature: 15, highlights: 20 })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">CineStill 800T</button>
              </div>
            </div>

            <PanelHeading title="✨ Quick Moods" />
            <div className="p-4 border-b border-base-200/60">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => updateState({ filter: "none", brightness: 110, contrast: 90, saturation: 80, fade: 25, temperature: 5, vignette: false, grain: true, grainIntensity: 15, lightLeak: "subtle" })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">Dreamy</button>
                <button onClick={() => updateState({ filter: "none", brightness: 95, contrast: 130, saturation: 120, fade: 0, temperature: -10, vignette: true, vignetteIntensity: 40, grain: false, lightLeak: "none" })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">Dramatic</button>
                <button onClick={() => updateState({ filter: "none", brightness: 108, contrast: 95, saturation: 110, fade: 10, temperature: 25, vignette: false, grain: true, grainIntensity: 12, lightLeak: "warm" })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">Golden Hour</button>
                <button onClick={() => updateState({ filter: "none", brightness: 100, contrast: 105, saturation: 0, fade: 5, temperature: 0, vignette: true, vignetteIntensity: 30, grain: true, grainIntensity: 20, lightLeak: "none" })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">Noir B&W</button>
                <button onClick={() => updateState({ filter: "none", brightness: 105, contrast: 100, saturation: 90, fade: 15, temperature: -15, vignette: false, grain: true, grainIntensity: 10, lightLeak: "cool" })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">Cool Breeze</button>
                <button onClick={() => updateState({ filter: "none", brightness: 102, contrast: 115, saturation: 140, fade: 0, temperature: 10, vignette: false, grain: false, lightLeak: "none" })} className="px-3 py-2.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium transition-all duration-200">Vibrant Pop</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PolaroidControls;
