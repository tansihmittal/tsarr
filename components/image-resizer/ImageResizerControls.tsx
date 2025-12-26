import { useState, useRef } from "react";
import { ImageResizerState } from "./ImageResizerLayout";
import { BiRuler, BiImage } from "react-icons/bi";
import { IoMdOptions } from "react-icons/io";
import { BsUpload, BsClipboard, BsDownload, BsLink, BsLockFill, BsUnlock } from "react-icons/bs";
import { toast } from "react-hot-toast";

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
  const [selectedTab, setSelectedTab] = useState("size");
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

  const PanelHeading = ({ title }: { title: string }) => (
    <h2 className="text-[0.75rem] uppercase tracking-wider font-semibold px-4 py-3 bg-gradient-to-r from-base-200/80 to-base-200/40 text-gray-600 border-b border-base-200/50 flex items-center gap-2">
      <span className="w-1 h-4 bg-primary rounded-full"></span>{title}
    </h2>
  );

  const Control = ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3 px-4 border-b border-base-200/60">
      <span className="text-primary-content font-medium text-sm">{title}</span>{children}
    </div>
  );

  const OptionButton = ({ title, children, tabKey }: { children: React.ReactNode; title: string; tabKey: string }) => {
    const isActive = selectedTab === tabKey;
    return (
      <div className={`flex justify-center items-center gap-2 font-medium px-3 py-2.5 transition-all duration-200 cursor-pointer ${isActive ? "bg-base-100 rounded-lg shadow-sm text-primary" : "text-primary-content hover:text-primary"}`} onClick={() => setSelectedTab(tabKey)}>
        <span className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>{children}</span><span className="text-sm">{title}</span>
      </div>
    );
  };

  const dims = getOutputDimensions();

  return (
    <section className="flex flex-col transition-opacity duration-300 opacity-100">
      <div className="grid grid-cols-3 bg-base-200/60 rounded-xl p-1 mb-3 cursor-pointer backdrop-blur-sm">
        <OptionButton title="Size" tabKey="size"><BiRuler /></OptionButton>
        <OptionButton title="Presets" tabKey="presets"><BiImage /></OptionButton>
        <OptionButton title="Output" tabKey="output"><IoMdOptions /></OptionButton>
      </div>

      <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
        <PanelHeading title="Image" />
        <div className="p-4 border-b border-base-200/60">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button onClick={() => fileInputRef.current?.click()} className="btn btn-outline btn-sm gap-2"><BsUpload /> {state.originalImage ? "Change" : "Upload"}</button>
            <button onClick={handlePaste} className="btn btn-outline btn-sm gap-2"><BsClipboard /> Paste</button>
          </div>
          {state.originalImage && (
            <div className="flex items-center gap-3">
              <img src={state.originalImage} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
              <div className="text-sm">
                <div className="font-medium text-primary-content">{state.originalWidth} × {state.originalHeight}</div>
                <div className="text-gray-500">Original size</div>
              </div>
            </div>
          )}
        </div>

        {selectedTab === "size" ? (
          <div className="relative rounded-md">
            <PanelHeading title="Resize Mode" />
            <div className="p-4 border-b border-base-200/60">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => updateState({ resizeMode: "pixels" })} className={`p-3 rounded-lg text-center transition-all ${state.resizeMode === "pixels" ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}>
                  <div className="font-semibold text-sm">Pixels</div>
                  <div className={`text-xs ${state.resizeMode === "pixels" ? "text-white/70" : "text-gray-500"}`}>Exact dimensions</div>
                </button>
                <button onClick={() => updateState({ resizeMode: "percentage" })} className={`p-3 rounded-lg text-center transition-all ${state.resizeMode === "percentage" ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}>
                  <div className="font-semibold text-sm">Percentage</div>
                  <div className={`text-xs ${state.resizeMode === "percentage" ? "text-white/70" : "text-gray-500"}`}>Scale by %</div>
                </button>
              </div>
            </div>

            {state.resizeMode === "pixels" ? (
              <>
                <PanelHeading title="Dimensions" />
                <Control title="Lock Aspect Ratio">
                  <button onClick={() => updateState({ maintainAspectRatio: !state.maintainAspectRatio })} className={`btn btn-sm ${state.maintainAspectRatio ? "btn-primary" : "btn-outline"} gap-1`}>
                    {state.maintainAspectRatio ? <BsLockFill /> : <BsUnlock />}
                    {state.maintainAspectRatio ? "Locked" : "Unlocked"}
                  </button>
                </Control>
                <div className="p-4 border-b border-base-200/60">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Width (px)</label>
                      <input type="number" value={state.targetWidth} onChange={(e) => updateState({ targetWidth: Number(e.target.value) })} className="input input-sm input-bordered w-full" min="1" max="8000" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Height (px)</label>
                      <input type="number" value={state.targetHeight} onChange={(e) => updateState({ targetHeight: Number(e.target.value) })} className="input input-sm input-bordered w-full" min="1" max="8000" />
                    </div>
                  </div>
                  {state.originalWidth > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => updateState({ targetWidth: state.originalWidth, targetHeight: state.originalHeight })} className="btn btn-xs btn-outline">Original</button>
                      <button onClick={() => updateState({ targetWidth: Math.round(state.originalWidth / 2), targetHeight: Math.round(state.originalHeight / 2) })} className="btn btn-xs btn-outline">50%</button>
                      <button onClick={() => updateState({ targetWidth: Math.round(state.originalWidth / 4), targetHeight: Math.round(state.originalHeight / 4) })} className="btn btn-xs btn-outline">25%</button>
                      <button onClick={() => updateState({ targetWidth: state.originalWidth * 2, targetHeight: state.originalHeight * 2 })} className="btn btn-xs btn-outline">2x</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <PanelHeading title="Scale Percentage" />
                <div className="p-4 border-b border-base-200/60">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-gray-500 font-medium">Scale</span>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{state.percentage}%</span>
                  </div>
                  <input type="range" min="10" max="200" value={state.percentage} onChange={(e) => updateState({ percentage: Number(e.target.value) })} className="range range-xs range-primary w-full mb-3" />
                  <div className="flex gap-2 flex-wrap">
                    {[25, 50, 75, 100, 150, 200].map(p => (
                      <button key={p} onClick={() => updateState({ percentage: p })} className={`btn btn-xs ${state.percentage === p ? "btn-primary" : "btn-outline"}`}>{p}%</button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Output: {dims.width} × {dims.height} px</p>
                </div>
              </>
            )}
          </div>

        ) : selectedTab === "presets" ? (
          <div className="relative rounded-md">
            <PanelHeading title="Preset Sizes" />
            <div className="p-4 border-b border-base-200/60">
              <div className="grid grid-cols-2 gap-2">
                {presetSizes.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => updateState({ targetWidth: preset.width, targetHeight: preset.height, resizeMode: "pixels", maintainAspectRatio: false })}
                    className={`p-3 rounded-lg text-left transition-all ${state.targetWidth === preset.width && state.targetHeight === preset.height ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}
                  >
                    <div className="font-semibold text-sm">{preset.name}</div>
                    <div className={`text-xs ${state.targetWidth === preset.width && state.targetHeight === preset.height ? "text-white/70" : "text-gray-500"}`}>{preset.width}×{preset.height}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative rounded-md">
            <PanelHeading title="Format" />
            <div className="p-4 border-b border-base-200/60">
              <div className="grid grid-cols-4 gap-2">
                {outputFormats.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => updateState({ outputFormat: format.id as ImageResizerState["outputFormat"] })}
                    className={`p-3 rounded-lg text-center transition-all ${state.outputFormat === format.id ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}
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
                <div className="p-4 border-b border-base-200/60">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-gray-500 font-medium">Quality</span>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{state.quality}%</span>
                  </div>
                  <input type="range" min="10" max="100" value={state.quality} onChange={(e) => updateState({ quality: Number(e.target.value) })} className="range range-xs range-primary w-full" />
                </div>
              </>
            )}

            <PanelHeading title="Export" />
            <div className="p-4 border-b border-base-200/60">
              <button onClick={onExport} disabled={!state.originalImage} className="btn btn-primary w-full gap-2 shadow-lg shadow-primary/20 disabled:opacity-50">
                <BsDownload className="text-lg" />
                Export {state.outputFormat.toUpperCase()} ({dims.width}×{dims.height})
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">{dims.width} × {dims.height} px</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ImageResizerControls;
