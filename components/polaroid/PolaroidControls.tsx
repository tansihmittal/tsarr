import { useState, useRef, ChangeEvent, ReactNode } from "react";
import ControlPanelHeading from "../common/ControlPanelHeading";
import ControlPanelRow from "../common/ControlPanelRow";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { IoMdOptions } from "react-icons/io";
import { BsBookmarkFill } from "react-icons/bs";
import { MdFilterVintage } from "react-icons/md";
import { FaDice } from "react-icons/fa";
import { BiReset, BiChevronRight } from "react-icons/bi";
import { PolaroidState } from "./types";
import BackgroundPicker, { BackgroundConfig } from "../common/BackgroundPicker";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Props {
  state: PolaroidState;
  updateState: (updates: Partial<PolaroidState>) => void;
  polaroidRef: React.RefObject<HTMLDivElement>;
}

const PolaroidControls = ({ state, updateState }: Props) => {
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
    { id: "cpm35", name: "CPM35" },
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


  const PanelHeading = ControlPanelHeading;
  const Control = ControlPanelRow;

  const RangeControl = ({ label, value, min, max, step = 1, unit = "", onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (value: number) => void }) => (
    <div className="p-4 border-b border-[#E5E7EB]/6 dark:border-gray-700/60 dark:border-gray-700">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</span>
        <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{value}{unit}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  );

  return (
    <section style={{ pointerEvents: state.image ? "auto" : "none" }} className={`flex flex-col transition-opacity duration-300 ${state.image ? "opacity-100" : "opacity-90"}`}>
      <Tabs defaultValue="options">
      <TabsList className="w-full grid grid-cols-3 rounded-[12px] bg-[#F3F4F6] dark:bg-gray-800 mb-3">
        <TabsTrigger value="options" className="gap-1.5 rounded-[10px] text-xs"><IoMdOptions className="w-3.5 h-3.5" /> Options</TabsTrigger>
        <TabsTrigger value="filters" className="gap-1.5 rounded-[10px] text-xs"><MdFilterVintage className="w-3.5 h-3.5" /> Filters</TabsTrigger>
        <TabsTrigger value="presets" className="gap-1.5 rounded-[10px] text-xs"><BsBookmarkFill className="w-3.5 h-3.5" /> Presets</TabsTrigger>
      </TabsList>

      <div className="rounded-[14px] border border-[#E5E7EB]/8 dark:border-gray-700/80 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm lg:max-h-[calc(100vh-150px)] lg:overflow-y-auto scrollbar-hide animate-fade-in">
        <TabsContent value="options">
          <div className="relative rounded-md">
            <PanelHeading title="Frame Settings" />
            <Control title="Frame Color">
              <input type="color" value={state.frameColor} onChange={(e) => updateState({ frameColor: e.target.value })} className="w-8 h-8 rounded-[10px] cursor-pointer border-0 p-0" />
            </Control>
            <RangeControl label="Border Width" value={state.borderWidth} min={10} max={50} unit="px" onChange={(value) => updateState({ borderWidth: value })} />
            <RangeControl label="Bottom Border" value={state.bottomBorderWidth} min={40} max={150} unit="px" onChange={(value) => updateState({ bottomBorderWidth: value })} />
            <Control title="Texture">
              <Select value={state.frameTexture || 'smooth'} onValueChange={(v) => updateState({ frameTexture: v as any })}>
                <SelectTrigger className="h-9 text-sm w-auto min-w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smooth">Smooth</SelectItem>
                  <SelectItem value="paper">Paper</SelectItem>
                  <SelectItem value="grain">Grainy</SelectItem>
                  <SelectItem value="ragged">Ragged</SelectItem>
                </SelectContent>
              </Select>
            </Control>

            <PanelHeading title="Caption" />
            <div className="p-4 border-b border-[#E5E7EB]/6 dark:border-gray-700/60 dark:border-gray-700">
              <input type="text" value={state.caption} onChange={(e) => updateState({ caption: e.target.value })} placeholder="Add a caption..." className="w-full px-3 py-2 border-2 border-[#E5E7EB] dark:border-gray-700 rounded-[10px] focus:border-[#2563EB] focus:outline-none text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
            </div>
            <Control title="Font">
              <Select value={state.captionFont} onValueChange={(v) => updateState({ captionFont: v })}>
                <SelectTrigger className="h-9 text-sm w-auto min-w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fonts.map((font) => (<SelectItem key={font.id} value={font.id}>{font.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </Control>
            <RangeControl label="Caption Size" value={state.captionSize} min={12} max={48} unit="px" onChange={(value) => updateState({ captionSize: value })} />
            <Control title="Caption Color">
              <input type="color" value={state.captionColor} onChange={(e) => updateState({ captionColor: e.target.value })} className="w-8 h-8 rounded-[10px] cursor-pointer border-0 p-0" />
            </Control>

            <PanelHeading title="Transform" />
            <RangeControl label="Rotation" value={state.rotation} min={-15} max={15} unit="°" onChange={(value) => updateState({ rotation: value })} />
            <RangeControl label="Tilt" value={state.tilt} min={-20} max={20} unit="°" onChange={(value) => updateState({ tilt: value })} />
            <Control title="Shadow">
              <Switch checked={state.shadow} onCheckedChange={(v) => updateState({ shadow: v })} />
            </Control>
            {state.shadow && <RangeControl label="Shadow Intensity" value={state.shadowIntensity} min={10} max={60} unit="%" onChange={(value) => updateState({ shadowIntensity: value })} />}
          </div>
        </TabsContent>
        <TabsContent value="filters">
          <div className="relative rounded-md">
            <PanelHeading title="Film Filters" />
            <div className="p-4 border-b border-[#E5E7EB]/6 dark:border-gray-700/60 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => updateState({ filter: filter.id as PolaroidState["filter"] })}
                    className={`px-3 py-1.5 rounded-[10px] text-xs font-medium transition-all duration-200 ${state.filter === filter.id ? "bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20" : "bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700"}`}
                  >
                    {filter.name}
                  </button>
                ))}
              </div>
            </div>
            {state.filter !== "none" && <RangeControl label="Filter Intensity" value={state.filterIntensity} min={20} max={100} step={5} unit="%" onChange={(value) => updateState({ filterIntensity: value })} />}

            <PanelHeading title="Film Effects" />
            <Control title="Light Leak">
              <Select value={state.lightLeak || 'none'} onValueChange={(v) => updateState({ lightLeak: v as any })}>
                <SelectTrigger className="h-9 text-sm w-auto min-w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cool">Cool</SelectItem>
                  <SelectItem value="rainbow">Rainbow</SelectItem>
                  <SelectItem value="subtle">Subtle</SelectItem>
                  <SelectItem value="orange">Orange Flare</SelectItem>
                  <SelectItem value="blue">Blue Flare</SelectItem>
                  <SelectItem value="pink">Pink Glow</SelectItem>
                  <SelectItem value="vintage">Vintage Burn</SelectItem>
                </SelectContent>
              </Select>
            </Control>
            <Control title="Vignette">
              <Switch checked={state.vignette} onCheckedChange={(v) => updateState({ vignette: v })} />
            </Control>
            {state.vignette && <RangeControl label="Vignette Intensity" value={state.vignetteIntensity} min={10} max={80} unit="%" onChange={(value) => updateState({ vignetteIntensity: value })} />}
            <Control title="Film Grain">
              <Switch checked={state.grain} onCheckedChange={(v) => updateState({ grain: v })} />
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
        </TabsContent>
        <TabsContent value="presets">
          <div className="relative rounded-md">
            <PanelHeading title="Dazz Cam Popular" />
            <div className="p-4 border-b border-[#E5E7EB]/6 dark:border-gray-700/60 dark:border-gray-700">
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => updateState({ filter: "cpm35", filterIntensity: 85, lightLeak: "subtle", vignette: false, grain: true, grainIntensity: 15, frameColor: "#faf8f5", captionFont: "Caveat", brightness: 105, contrast: 95, saturation: 115, temperature: 5, fade: 8 })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">CPM35</button>
                <button onClick={() => updateState({ filter: "fqs", filterIntensity: 80, lightLeak: "warm", vignette: false, grain: true, grainIntensity: 20, frameColor: "#f5f0e6", captionFont: "Indie Flower", brightness: 103, contrast: 105, saturation: 120, temperature: 15 })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">FQS R Green</button>
                <button onClick={() => updateState({ filter: "hoga", filterIntensity: 90, lightLeak: "rainbow", vignette: true, vignetteIntensity: 50, grain: true, grainIntensity: 25, frameColor: "#f8f4e8", captionFont: "Permanent Marker", brightness: 95, contrast: 110, saturation: 90, blur: 0.5 })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">Hoga Lo-Fi</button>
                <button onClick={() => updateState({ filter: "fxn", filterIntensity: 85, lightLeak: "none", vignette: false, grain: false, frameColor: "#ffffff", captionFont: "Arial", brightness: 98, contrast: 130, saturation: 135, shadows: -10 })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">FXN R Fuji</button>
                <button onClick={() => updateState({ filter: "nt16", filterIntensity: 80, lightLeak: "subtle", vignette: true, vignetteIntensity: 30, grain: true, grainIntensity: 18, frameColor: "#ffffff", captionFont: "Shadows Into Light", brightness: 102, contrast: 108, saturation: 95, fade: 12 })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">NT16 Polaroid</button>
                <button onClick={() => updateState({ filter: "grd", filterIntensity: 90, lightLeak: "cool", vignette: true, vignetteIntensity: 45, grain: true, grainIntensity: 22, frameColor: "#1a1a1a", captionColor: "#e0e0e0", captionFont: "Georgia", brightness: 90, contrast: 125, saturation: 85, shadows: 15 })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">GRD R Night</button>
                <button onClick={() => updateState({ filter: "kino", filterIntensity: 85, lightLeak: "orange", vignette: true, vignetteIntensity: 35, grain: true, grainIntensity: 20, frameColor: "#f5f0e6", brightness: 100, contrast: 115, saturation: 90, temperature: -5, fade: 15 })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">Kino Cinema</button>
                <button onClick={() => updateState({ filter: "ct100", filterIntensity: 80, lightLeak: "blue", vignette: false, grain: true, grainIntensity: 15, frameColor: "#ffffff", brightness: 102, contrast: 110, saturation: 105, temperature: -15, tint: 5 })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">CT100 Tungsten</button>
              </div>
            </div>

            <PanelHeading title="Film Stocks" />
            <div className="p-4 border-b border-[#E5E7EB]/6 dark:border-gray-700/60 dark:border-gray-700">
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => updateState({ filter: "portra", filterIntensity: 85, lightLeak: "subtle", vignette: false, grain: true, grainIntensity: 12, frameColor: "#faf8f5", brightness: 103, contrast: 95, saturation: 95, temperature: 8, highlights: -10, shadows: 15 })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">Portra 400</button>
                <button onClick={() => updateState({ filter: "ektar", filterIntensity: 90, lightLeak: "none", vignette: false, grain: true, grainIntensity: 10, frameColor: "#ffffff", brightness: 100, contrast: 115, saturation: 140, temperature: 5 })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">Ektar 100</button>
                <button onClick={() => updateState({ filter: "velvia", filterIntensity: 95, lightLeak: "none", vignette: false, grain: true, grainIntensity: 8, frameColor: "#ffffff", brightness: 98, contrast: 125, saturation: 160, shadows: -15 })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">Velvia 50</button>
                <button onClick={() => updateState({ filter: "provia", filterIntensity: 80, lightLeak: "none", vignette: false, grain: true, grainIntensity: 10, frameColor: "#ffffff", brightness: 100, contrast: 108, saturation: 110, temperature: 0 })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">Provia 100</button>
                <button onClick={() => updateState({ filter: "superia", filterIntensity: 85, lightLeak: "warm", vignette: false, grain: true, grainIntensity: 18, frameColor: "#f5f0e6", brightness: 102, contrast: 105, saturation: 115, temperature: 10, fade: 5 })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">Superia 400</button>
                <button onClick={() => updateState({ filter: "gold200", filterIntensity: 85, lightLeak: "warm", vignette: false, grain: true, grainIntensity: 20, frameColor: "#f8f4e8", brightness: 105, contrast: 100, saturation: 120, temperature: 20, fade: 8 })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">Gold 200</button>
                <button onClick={() => updateState({ filter: "ultramax", filterIntensity: 90, lightLeak: "subtle", vignette: false, grain: true, grainIntensity: 15, frameColor: "#ffffff", brightness: 103, contrast: 112, saturation: 130, temperature: 8 })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">Ultramax 400</button>
                <button onClick={() => updateState({ filter: "cinestill", filterIntensity: 90, lightLeak: "orange", vignette: true, vignetteIntensity: 25, grain: true, grainIntensity: 18, frameColor: "#1a1a1a", captionColor: "#e0e0e0", brightness: 100, contrast: 115, saturation: 105, temperature: 15, highlights: 20 })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">CineStill 800T</button>
              </div>
            </div>

            <PanelHeading title="Quick Moods" />
            <div className="p-4 border-b border-[#E5E7EB]/6 dark:border-gray-700/60 dark:border-gray-700">
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => updateState({ filter: "none", brightness: 110, contrast: 90, saturation: 80, fade: 25, temperature: 5, vignette: false, grain: true, grainIntensity: 15, lightLeak: "subtle" })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">Dreamy</button>
                <button onClick={() => updateState({ filter: "none", brightness: 95, contrast: 130, saturation: 120, fade: 0, temperature: -10, vignette: true, vignetteIntensity: 40, grain: false, lightLeak: "none" })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">Dramatic</button>
                <button onClick={() => updateState({ filter: "none", brightness: 108, contrast: 95, saturation: 110, fade: 10, temperature: 25, vignette: false, grain: true, grainIntensity: 12, lightLeak: "warm" })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">Golden Hour</button>
                <button onClick={() => updateState({ filter: "none", brightness: 100, contrast: 105, saturation: 0, fade: 5, temperature: 0, vignette: true, vignetteIntensity: 30, grain: true, grainIntensity: 20, lightLeak: "none" })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">Noir B&W</button>
                <button onClick={() => updateState({ filter: "none", brightness: 105, contrast: 100, saturation: 90, fade: 15, temperature: -15, vignette: false, grain: true, grainIntensity: 10, lightLeak: "cool" })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">Cool Breeze</button>
                <button onClick={() => updateState({ filter: "none", brightness: 102, contrast: 115, saturation: 140, fade: 0, temperature: 10, vignette: false, grain: false, lightLeak: "none" })} className="px-3 py-2.5 bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium transition-all duration-200">Vibrant Pop</button>
              </div>
            </div>
          </div>
        </TabsContent>
      </div>
      </Tabs>
    </section>
  );
};

export default PolaroidControls;
