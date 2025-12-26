import { useState, useRef } from "react";
import { AspectRatioState } from "./AspectRatioLayout";
import { BiCrop, BiImage } from "react-icons/bi";
import { IoMdOptions } from "react-icons/io";
import { BsUpload, BsClipboard, BsDownload } from "react-icons/bs";
import { toast } from "react-hot-toast";

interface Props {
  state: AspectRatioState;
  updateState: (updates: Partial<AspectRatioState>) => void;
  onImageUpload: (file: File) => void;
  onExport: () => void;
}

const aspectRatios = [
  { id: 1, name: "1:1", value: 1, desc: "Square" },
  { id: 2, name: "4:3", value: 4 / 3, desc: "Standard" },
  { id: 3, name: "3:4", value: 3 / 4, desc: "Portrait" },
  { id: 4, name: "16:9", value: 16 / 9, desc: "Widescreen" },
  { id: 5, name: "9:16", value: 9 / 16, desc: "Story/Reel" },
  { id: 6, name: "4:5", value: 4 / 5, desc: "Instagram" },
  { id: 7, name: "5:4", value: 5 / 4, desc: "Landscape" },
  { id: 8, name: "3:2", value: 3 / 2, desc: "Photo" },
  { id: 9, name: "2:3", value: 2 / 3, desc: "Portrait Photo" },
  { id: 10, name: "21:9", value: 21 / 9, desc: "Ultrawide" },
  { id: 11, name: "2:1", value: 2, desc: "Twitter Header" },
  { id: 12, name: "1:2", value: 0.5, desc: "Tall" },
];

const outputScales = [
  { id: 1, name: "0.5x", value: 0.5 },
  { id: 2, name: "1x", value: 1 },
  { id: 3, name: "2x", value: 2 },
  { id: 4, name: "3x", value: 3 },
  { id: 5, name: "4x", value: 4 },
];

const fitModes = [
  { id: "contain", name: "Contain", desc: "Fit entire image" },
  { id: "cover", name: "Cover", desc: "Fill & crop edges" },
  { id: "fill", name: "Stretch", desc: "Stretch to fit" },
  { id: "crop", name: "Crop", desc: "Crop with position" },
];

const outputFormats = [
  { id: "png", name: "PNG", desc: "Lossless, transparency" },
  { id: "jpeg", name: "JPG", desc: "Smaller size" },
  { id: "webp", name: "WebP", desc: "Modern, efficient" },
  { id: "avif", name: "AVIF", desc: "Best compression" },
];

const AspectRatioControls: React.FC<Props> = ({ state, updateState, onImageUpload, onExport }) => {
  const [selectedTab, setSelectedTab] = useState("ratio");
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
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
          toast.success("Image pasted from clipboard!");
          return;
        }
      }
      toast.error("No image found in clipboard");
    } catch {
      toast.error("Failed to paste from clipboard");
    }
  };

  const applyCustomRatio = () => {
    const w = parseFloat(customWidth);
    const h = parseFloat(customHeight);
    if (w > 0 && h > 0) {
      updateState({ targetAspectRatio: { name: `${w}:${h}`, value: w / h } });
      toast.success(`Custom ratio ${w}:${h} applied`);
    }
  };

  const PanelHeading = ({ title }: { title: string }) => (
    <h2 className="text-[0.75rem] uppercase tracking-wider font-semibold px-4 py-3 bg-gradient-to-r from-base-200/80 to-base-200/40 text-gray-600 border-b border-base-200/50 flex items-center gap-2">
      <span className="w-1 h-4 bg-primary rounded-full"></span>{title}
    </h2>
  );

  const Control = ({ title, children, onTap }: { title: string; children?: React.ReactNode; onTap?: () => void }) => (
    <div className={`flex items-center justify-between py-3 px-4 border-b border-base-200/60 ${onTap ? "cursor-pointer hover:bg-base-200/30" : ""}`} onClick={onTap}>
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

  return (
    <section className="flex flex-col transition-opacity duration-300 opacity-100">
      <div className="grid grid-cols-3 bg-base-200/60 rounded-xl p-1 mb-3 cursor-pointer backdrop-blur-sm">
        <OptionButton title="Ratio" tabKey="ratio"><BiCrop /></OptionButton>
        <OptionButton title="Fit" tabKey="fit"><BiImage /></OptionButton>
        <OptionButton title="Output" tabKey="output"><IoMdOptions /></OptionButton>
      </div>

      <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
        {/* Upload Section - Always visible */}
        <PanelHeading title="Image" />
        <div className="p-4 border-b border-base-200/60">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/gif,image/svg+xml" onChange={handleFileChange} className="hidden" />
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button onClick={() => fileInputRef.current?.click()} className="btn btn-outline btn-sm gap-2">
              <BsUpload /> {state.originalImage ? "Change" : "Upload"}
            </button>
            <button onClick={handlePaste} className="btn btn-outline btn-sm gap-2">
              <BsClipboard /> Paste
            </button>
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

        {selectedTab === "ratio" ? (
          <div className="relative rounded-md">
            <PanelHeading title="Aspect Ratio" />
            <div className="p-4 border-b border-base-200/60">
              <div className="grid grid-cols-3 gap-2">
                {aspectRatios.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => updateState({ targetAspectRatio: { name: ratio.name, value: ratio.value } })}
                    className={`p-3 rounded-lg text-center transition-all ${state.targetAspectRatio.name === ratio.name ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}
                  >
                    <div className="font-semibold text-sm">{ratio.name}</div>
                    <div className={`text-xs ${state.targetAspectRatio.name === ratio.name ? "text-white/70" : "text-gray-500"}`}>{ratio.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <PanelHeading title="Common Presets" />
            <div className="p-4 border-b border-base-200/60">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => updateState({ targetAspectRatio: { name: "1:1", value: 1 } })} className="btn btn-sm btn-outline">Instagram Post</button>
                <button onClick={() => updateState({ targetAspectRatio: { name: "9:16", value: 9/16 } })} className="btn btn-sm btn-outline">Story/Reel</button>
                <button onClick={() => updateState({ targetAspectRatio: { name: "16:9", value: 16/9 } })} className="btn btn-sm btn-outline">YouTube</button>
                <button onClick={() => updateState({ targetAspectRatio: { name: "2:1", value: 2 } })} className="btn btn-sm btn-outline">Twitter Header</button>
                <button onClick={() => updateState({ targetAspectRatio: { name: "4:5", value: 4/5 } })} className="btn btn-sm btn-outline">Instagram Portrait</button>
                <button onClick={() => updateState({ targetAspectRatio: { name: "3:2", value: 3/2 } })} className="btn btn-sm btn-outline">Photo Print</button>
              </div>
            </div>

            <PanelHeading title="Custom Ratio" />
            <div className="p-4 border-b border-base-200/60">
              <div className="flex gap-2 items-center">
                <input type="number" value={customWidth} onChange={(e) => setCustomWidth(e.target.value)} placeholder="W" className="input input-sm input-bordered w-20" min="1" />
                <span className="text-gray-500">:</span>
                <input type="number" value={customHeight} onChange={(e) => setCustomHeight(e.target.value)} placeholder="H" className="input input-sm input-bordered w-20" min="1" />
                <button onClick={applyCustomRatio} className="btn btn-sm btn-primary">Apply</button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Current: {state.targetAspectRatio.name}</p>
            </div>
          </div>
        ) : selectedTab === "fit" ? (
          <div className="relative rounded-md">
            <PanelHeading title="Fit Mode" />
            <div className="p-4 border-b border-base-200/60">
              <div className="grid grid-cols-2 gap-2">
                {fitModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => updateState({ fitMode: mode.id as AspectRatioState["fitMode"] })}
                    className={`p-3 rounded-lg text-left transition-all ${state.fitMode === mode.id ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}
                  >
                    <div className="font-semibold text-sm">{mode.name}</div>
                    <div className={`text-xs ${state.fitMode === mode.id ? "text-white/70" : "text-gray-500"}`}>{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {(state.fitMode === "cover" || state.fitMode === "crop") && (
              <>
                <PanelHeading title="Crop Position" />
                <div className="p-4 border-b border-base-200/60">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-gray-500 font-medium">Horizontal</span>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{state.cropPosition.x}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={state.cropPosition.x} onChange={(e) => updateState({ cropPosition: { ...state.cropPosition, x: Number(e.target.value) } })} className="range range-xs range-primary w-full mb-4" />
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-gray-500 font-medium">Vertical</span>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{state.cropPosition.y}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={state.cropPosition.y} onChange={(e) => updateState({ cropPosition: { ...state.cropPosition, y: Number(e.target.value) } })} className="range range-xs range-primary w-full" />
                </div>
              </>
            )}

            {state.fitMode === "contain" && (
              <>
                <PanelHeading title="Background" />
                <Control title="Type">
                  <div className="flex gap-1">
                    {(["solid", "blur", "transparent"] as const).map((type) => (
                      <button key={type} onClick={() => updateState({ backgroundType: type })} className={`px-2 py-1 rounded text-xs capitalize ${state.backgroundType === type ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}>{type}</button>
                    ))}
                  </div>
                </Control>
                {state.backgroundType === "solid" && (
                  <Control title="Color">
                    <input type="color" value={state.backgroundColor} onChange={(e) => updateState({ backgroundColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
                  </Control>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="relative rounded-md">
            <PanelHeading title="Size Mode" />
            <Control title="Use Custom Size">
              <label className="custom-toggle">
                <input type="checkbox" checked={state.useCustomSize} onChange={(e) => updateState({ useCustomSize: e.target.checked })} />
                <span className="slider"></span>
              </label>
            </Control>

            {state.useCustomSize ? (
              <>
                <PanelHeading title="Custom Output Size" />
                <div className="p-4 border-b border-base-200/60">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Width (px)</label>
                      <input type="number" value={state.customOutputWidth} onChange={(e) => updateState({ customOutputWidth: Number(e.target.value) })} className="input input-sm input-bordered w-full" min="1" max="8000" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Height (px)</label>
                      <input type="number" value={state.customOutputHeight} onChange={(e) => updateState({ customOutputHeight: Number(e.target.value) })} className="input input-sm input-bordered w-full" min="1" max="8000" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => updateState({ customOutputWidth: 1080, customOutputHeight: 1080 })} className="btn btn-xs btn-outline">1080×1080</button>
                    <button onClick={() => updateState({ customOutputWidth: 1920, customOutputHeight: 1080 })} className="btn btn-xs btn-outline">1920×1080</button>
                    <button onClick={() => updateState({ customOutputWidth: 1080, customOutputHeight: 1920 })} className="btn btn-xs btn-outline">1080×1920</button>
                    <button onClick={() => updateState({ customOutputWidth: 1200, customOutputHeight: 630 })} className="btn btn-xs btn-outline">1200×630</button>
                    <button onClick={() => updateState({ customOutputWidth: 800, customOutputHeight: 600 })} className="btn btn-xs btn-outline">800×600</button>
                    <button onClick={() => updateState({ customOutputWidth: 2048, customOutputHeight: 2048 })} className="btn btn-xs btn-outline">2048×2048</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <PanelHeading title="Output Scale" />
                <div className="p-4 border-b border-base-200/60">
                  <div className="flex flex-wrap gap-2">
                    {outputScales.map((scale) => (
                      <button
                        key={scale.id}
                        onClick={() => updateState({ outputScale: scale.value })}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${state.outputScale === scale.value ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}
                      >
                        {scale.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Output: ~{Math.round(800 * state.outputScale * (state.targetAspectRatio.value >= 1 ? 1 : state.targetAspectRatio.value))} × {Math.round(800 * state.outputScale / (state.targetAspectRatio.value >= 1 ? state.targetAspectRatio.value : 1))} px
                  </p>
                </div>
              </>
            )}

            <PanelHeading title="Format" />
            <div className="p-4 border-b border-base-200/60">
              <div className="grid grid-cols-3 gap-2">
                {outputFormats.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => updateState({ outputFormat: format.id as AspectRatioState["outputFormat"] })}
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
              <button
                onClick={onExport}
                disabled={!state.originalImage}
                className="btn btn-primary w-full gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50"
              >
                <BsDownload className="text-lg" />
                Export {state.outputFormat.toUpperCase()} {state.useCustomSize ? `(${state.customOutputWidth}×${state.customOutputHeight})` : `(${state.outputScale}x)`}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {state.useCustomSize 
                  ? `${state.customOutputWidth} × ${state.customOutputHeight} px`
                  : `~${Math.round(800 * state.outputScale * (state.targetAspectRatio.value >= 1 ? 1 : state.targetAspectRatio.value))} × ${Math.round(800 * state.outputScale / (state.targetAspectRatio.value >= 1 ? state.targetAspectRatio.value : 1))} px`
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AspectRatioControls;
