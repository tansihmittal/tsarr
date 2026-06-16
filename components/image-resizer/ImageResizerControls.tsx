import { useState, useRef } from "react";
import { ImageResizerState } from "./ImageResizerLayout";
import { BiRuler, BiImage } from "react-icons/bi";
import { IoMdOptions } from "react-icons/io";
import { BsUpload, BsClipboard, BsDownload, BsLockFill, BsUnlock } from "react-icons/bs";
import { toast } from "react-hot-toast";
import ControlPanelHeading from "../common/ControlPanelHeading";
import ControlPanelRow from "../common/ControlPanelRow";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

interface Props {
  state: ImageResizerState;
  updateState: (updates: Partial<ImageResizerState>) => void;
  onImageUpload: (file: File) => void;
  onExport: () => void;
  getOutputDimensions: () => { width: number; height: number };
}

const presetSizes = [
  { id: 1, name: "HD", width: 1280, height: 720 },
  { id: 2, name: "Full HD", width: 1920, height: 1080 },
  { id: 3, name: "2K", width: 2560, height: 1440 },
  { id: 4, name: "4K", width: 3840, height: 2160 },
  { id: 5, name: "Instagram", width: 1080, height: 1080 },
  { id: 6, name: "Story", width: 1080, height: 1920 },
  { id: 7, name: "Twitter", width: 1200, height: 675 },
  { id: 8, name: "Facebook", width: 1200, height: 630 },
  { id: 9, name: "LinkedIn", width: 1200, height: 627 },
  { id: 10, name: "YouTube", width: 1280, height: 720 },
  { id: 11, name: "Thumbnail", width: 150, height: 150 },
  { id: 12, name: "Icon", width: 64, height: 64 },
];

const outputFormats = [
  { id: "png", name: "PNG", desc: "Lossless" },
  { id: "jpeg", name: "JPG", desc: "Smaller" },
  { id: "webp", name: "WebP", desc: "Modern" },
  { id: "avif", name: "AVIF", desc: "Best" },
];

const ImageResizerControls: React.FC<Props> = ({ state, updateState, onImageUpload, onExport, getOutputDimensions }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageUpload(file);
  };

  const handlePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], "pasted-image.png", { type: imageType });
          onImageUpload(file);
          toast.success("Image pasted!");
          return;
        }
      }
      toast.error("No image in clipboard");
    } catch { toast.error("Failed to paste"); }
  };

  const PanelHeading = ControlPanelHeading;
  const Control = ControlPanelRow;


  const dims = getOutputDimensions();

  return (
    <section className="flex flex-col transition-opacity duration-300 opacity-100">
      <Tabs defaultValue="size">
      <TabsList className="w-full grid grid-cols-3 rounded-[12px] bg-[#F3F4F6] mb-3">
        <TabsTrigger value="size" className="gap-1.5 rounded-[10px] text-xs"><BiRuler className="w-3.5 h-3.5" /> Size</TabsTrigger>
        <TabsTrigger value="presets" className="gap-1.5 rounded-[10px] text-xs"><BiImage className="w-3.5 h-3.5" /> Presets</TabsTrigger>
        <TabsTrigger value="output" className="gap-1.5 rounded-[10px] text-xs"><IoMdOptions className="w-3.5 h-3.5" /> Output</TabsTrigger>
      </TabsList>

      <div className="rounded-[14px] border border-[#E5E7EB] bg-white shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
        <PanelHeading title="Image" />
        <div className="p-4 border-b border-[#E5E7EB]">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2"><BsUpload /> {state.originalImage ? "Change" : "Upload"}</Button>
            <Button variant="secondary" size="sm" onClick={handlePaste} className="gap-2"><BsClipboard /> Paste</Button>
          </div>
          {state.originalImage && (
            <div className="flex items-center gap-3">
              <img src={state.originalImage} alt="Preview" className="w-16 h-16 rounded-[10px] object-cover" />
              <div className="text-sm">
                <div className="font-medium text-[#0A0A0A]">{state.originalWidth} × {state.originalHeight}</div>
                <div className="text-gray-500">Original size</div>
              </div>
            </div>
          )}
        </div>

        <TabsContent value="size">
          <div className="relative rounded-md">
            <PanelHeading title="Resize Mode" />
            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => updateState({ resizeMode: "pixels" })} className={`p-3 rounded-[10px] text-center transition-all ${state.resizeMode === "pixels" ? "bg-[#2563EB] text-white" : "bg-[#F9FAFB] hover:bg-[#E5E7EB]"}`}>
                  <div className="font-semibold text-sm">Pixels</div>
                  <div className={`text-xs ${state.resizeMode === "pixels" ? "text-white/70" : "text-gray-500"}`}>Exact dimensions</div>
                </button>
                <button onClick={() => updateState({ resizeMode: "percentage" })} className={`p-3 rounded-[10px] text-center transition-all ${state.resizeMode === "percentage" ? "bg-[#2563EB] text-white" : "bg-[#F9FAFB] hover:bg-[#E5E7EB]"}`}>
                  <div className="font-semibold text-sm">Percentage</div>
                  <div className={`text-xs ${state.resizeMode === "percentage" ? "text-white/70" : "text-gray-500"}`}>Scale by %</div>
                </button>
              </div>
            </div>

            {state.resizeMode === "pixels" ? (
              <>
                <PanelHeading title="Dimensions" />
                <Control title="Lock Aspect Ratio">
                  <Button
                    size="sm"
                    variant={state.maintainAspectRatio ? "default" : "secondary"}
                    onClick={() => updateState({ maintainAspectRatio: !state.maintainAspectRatio })}
                    className="gap-1"
                  >
                    {state.maintainAspectRatio ? <BsLockFill /> : <BsUnlock />}
                    {state.maintainAspectRatio ? "Locked" : "Unlocked"}
                  </Button>
                </Control>
                <div className="p-4 border-b border-[#E5E7EB]">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Width (px)</label>
                      <Input type="number" value={state.targetWidth} onChange={(e) => updateState({ targetWidth: Number(e.target.value) })} className="h-9 text-sm w-full" min="1" max="8000" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Height (px)</label>
                      <Input type="number" value={state.targetHeight} onChange={(e) => updateState({ targetHeight: Number(e.target.value) })} className="h-9 text-sm w-full" min="1" max="8000" />
                    </div>
                  </div>
                  {state.originalWidth > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="secondary" className="h-7 text-xs px-3" onClick={() => updateState({ targetWidth: state.originalWidth, targetHeight: state.originalHeight })}>Original</Button>
                      <Button size="sm" variant="secondary" className="h-7 text-xs px-3" onClick={() => updateState({ targetWidth: Math.round(state.originalWidth / 2), targetHeight: Math.round(state.originalHeight / 2) })}>50%</Button>
                      <Button size="sm" variant="secondary" className="h-7 text-xs px-3" onClick={() => updateState({ targetWidth: Math.round(state.originalWidth / 4), targetHeight: Math.round(state.originalHeight / 4) })}>25%</Button>
                      <Button size="sm" variant="secondary" className="h-7 text-xs px-3" onClick={() => updateState({ targetWidth: state.originalWidth * 2, targetHeight: state.originalHeight * 2 })}>2x</Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <PanelHeading title="Scale Percentage" />
                <div className="p-4 border-b border-[#E5E7EB]">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-gray-500 font-medium">Scale</span>
                    <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{state.percentage}%</span>
                  </div>
                  <Slider min={10} max={200} value={[state.percentage]} onValueChange={([v]) => updateState({ percentage: v })} className="w-full mb-3" />
                  <div className="flex gap-2 flex-wrap">
                    {[25, 50, 75, 100, 150, 200].map(p => (
                      <Button key={p} size="sm" variant={state.percentage === p ? "default" : "secondary"} className="h-7 text-xs px-3" onClick={() => updateState({ percentage: p })}>{p}%</Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Output: {dims.width} × {dims.height} px</p>
                </div>
              </>
            )}
          </div>
        </TabsContent>
        <TabsContent value="presets">
          <div className="relative rounded-md">
            <PanelHeading title="Preset Sizes" />
            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="grid grid-cols-2 gap-2">
                {presetSizes.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => updateState({ targetWidth: preset.width, targetHeight: preset.height, resizeMode: "pixels", maintainAspectRatio: false })}
                    className={`p-3 rounded-[10px] text-left transition-all ${state.targetWidth === preset.width && state.targetHeight === preset.height ? "bg-[#2563EB] text-white" : "bg-[#F9FAFB] hover:bg-[#E5E7EB]"}`}
                  >
                    <div className="font-semibold text-sm">{preset.name}</div>
                    <div className={`text-xs ${state.targetWidth === preset.width && state.targetHeight === preset.height ? "text-white/70" : "text-gray-500"}`}>{preset.width}×{preset.height}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="output">
          <div className="relative rounded-md">
            <PanelHeading title="Format" />
            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="grid grid-cols-4 gap-2">
                {outputFormats.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => updateState({ outputFormat: format.id as ImageResizerState["outputFormat"] })}
                    className={`p-3 rounded-[10px] text-center transition-all ${state.outputFormat === format.id ? "bg-[#2563EB] text-white" : "bg-[#F9FAFB] hover:bg-[#E5E7EB]"}`}
                  >
                    <div className="font-semibold text-sm">{format.name}</div>
                    <div className={`text-xs ${state.outputFormat === format.id ? "text-white/70" : "text-gray-500"}`}>{format.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {state.outputFormat !== "png" && (
              <>
                <PanelHeading title="Quality" />
                <div className="p-4 border-b border-[#E5E7EB]">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-gray-500 font-medium">Quality</span>
                    <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{state.quality}%</span>
                  </div>
                  <Slider min={10} max={100} value={[state.quality]} onValueChange={([v]) => updateState({ quality: v })} className="w-full" />
                </div>
              </>
            )}

            <PanelHeading title="Export" />
            <div className="p-4 border-b border-[#E5E7EB]">
              <Button onClick={onExport} disabled={!state.originalImage} className="w-full gap-2 shadow-lg shadow-[#2563EB]/20">
                <BsDownload className="text-lg" />
                Export {state.outputFormat.toUpperCase()} ({dims.width}×{dims.height})
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">{dims.width} × {dims.height} px</p>
            </div>
          </div>
        </TabsContent>
      </div>
      </Tabs>
    </section>
  );
};

export default ImageResizerControls;
