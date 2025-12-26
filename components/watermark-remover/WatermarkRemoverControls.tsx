import { useState, useRef } from "react";
import { WatermarkRemoverState } from "./WatermarkRemoverLayout";
import { BiEraser, BiImage } from "react-icons/bi";
import { IoMdOptions } from "react-icons/io";
import { BsUpload, BsClipboard, BsDownload, BsTrash, BsMagic } from "react-icons/bs";
import { toast } from "react-hot-toast";

interface Props {
  state: WatermarkRemoverState;
  updateState: (updates: Partial<WatermarkRemoverState>) => void;
  onImageUpload: (file: File) => void;
  onExport: () => void;
  onProcess: () => void;
  clearSelections: () => void;
}

const outputFormats = [
  { id: "png", name: "PNG", desc: "Lossless" },
  { id: "jpeg", name: "JPG", desc: "Smaller" },
  { id: "webp", name: "WebP", desc: "Modern" },
];

const WatermarkRemoverControls: React.FC<Props> = ({ 
  state, 
  updateState, 
  onImageUpload, 
  onExport, 
  onProcess,
  clearSelections 
}) => {
  const [selectedTab, setSelectedTab] = useState("selection");
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
      <div 
        className={`flex justify-center items-center gap-2 font-medium px-3 py-2.5 transition-all duration-200 cursor-pointer ${isActive ? "bg-base-100 rounded-lg shadow-sm text-primary" : "text-primary-content hover:text-primary"}`} 
        onClick={() => setSelectedTab(tabKey)}
      >
        <span className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>{children}</span>
        <span className="text-sm">{title}</span>
      </div>
    );
  };

  return (
    <section className="flex flex-col transition-opacity duration-300 opacity-100">
      <div className="grid grid-cols-3 bg-base-200/60 rounded-xl p-1 mb-3 cursor-pointer backdrop-blur-sm">
        <OptionButton title="Select" tabKey="selection"><BiEraser /></OptionButton>
        <OptionButton title="Process" tabKey="process"><BsMagic /></OptionButton>
        <OptionButton title="Output" tabKey="output"><IoMdOptions /></OptionButton>
      </div>

      <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
        <PanelHeading title="Image" />
        <div className="p-4 border-b border-base-200/60">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
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
                <div className="font-medium text-primary-content">{state.imageWidth} × {state.imageHeight}</div>
                <div className="text-gray-500">Original size</div>
              </div>
            </div>
          )}
        </div>

        {selectedTab === "selection" ? (
          <div className="relative rounded-md">
            <PanelHeading title="Selection Tool" />
            <div className="p-4 border-b border-base-200/60">
              <p className="text-sm text-gray-600 mb-4">
                Click and drag on the image to select watermark areas you want to remove.
              </p>
              
              <div className="bg-base-200/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary-content">Selected Areas</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {state.selections.length} area{state.selections.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {state.selections.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {state.selections.map((sel, idx) => (
                      <div key={sel.id} className="flex items-center justify-between text-xs bg-base-100 rounded px-2 py-1">
                        <span>Area {idx + 1}: {Math.round(sel.width)}×{Math.round(sel.height)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No areas selected yet</p>
                )}
              </div>

              <button 
                onClick={clearSelections} 
                disabled={state.selections.length === 0}
                className="btn btn-outline btn-sm w-full gap-2"
              >
                <BsTrash /> Clear All Selections
              </button>
            </div>

            <PanelHeading title="Tips" />
            <div className="p-4 border-b border-base-200/60">
              <ul className="text-xs text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Select the watermark area as precisely as possible</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Works best on solid or gradient backgrounds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Multiple selections can be processed at once</span>
                </li>
              </ul>
            </div>
          </div>

        ) : selectedTab === "process" ? (
          <div className="relative rounded-md">
            <PanelHeading title="Remove Watermark" />
            <div className="p-4 border-b border-base-200/60">
              <p className="text-sm text-gray-600 mb-4">
                Process the selected areas to remove watermarks using edge-aware interpolation.
              </p>
              
              {state.isProcessing && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Processing...</span>
                    <span>{state.processingProgress}%</span>
                  </div>
                  <progress 
                    className="progress progress-primary w-full" 
                    value={state.processingProgress} 
                    max="100"
                  ></progress>
                </div>
              )}
              
              <button 
                onClick={onProcess}
                disabled={!state.originalImage || state.selections.length === 0 || state.isProcessing}
                className="btn btn-primary w-full gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {state.isProcessing ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <BsMagic className="text-lg" />
                    Remove Watermark
                  </>
                )}
              </button>

              {state.selections.length === 0 && state.originalImage && (
                <p className="text-xs text-amber-600 mt-2 text-center">
                  Please select watermark areas first
                </p>
              )}
            </div>

            <PanelHeading title="Tips" />
            <div className="p-4 border-b border-base-200/60">
              <ul className="text-xs text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Works best on smooth gradients (sky, water, walls)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Select tightly around the watermark text</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>For complex textures, try smaller selections</span>
                </li>
              </ul>
            </div>

            <PanelHeading title="Status" />
            <div className="p-4 border-b border-base-200/60">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Image loaded</span>
                  <span className={state.originalImage ? "text-green-600" : "text-gray-400"}>
                    {state.originalImage ? "✓" : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Areas selected</span>
                  <span className={state.selections.length > 0 ? "text-green-600" : "text-gray-400"}>
                    {state.selections.length > 0 ? `✓ (${state.selections.length})` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Processed</span>
                  <span className={state.processedImage ? "text-green-600" : "text-gray-400"}>
                    {state.processedImage ? "✓" : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative rounded-md">
            <PanelHeading title="Format" />
            <div className="p-4 border-b border-base-200/60">
              <div className="grid grid-cols-3 gap-2">
                {outputFormats.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => updateState({ outputFormat: format.id as WatermarkRemoverState["outputFormat"] })}
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
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={state.quality} 
                    onChange={(e) => updateState({ quality: Number(e.target.value) })} 
                    className="range range-xs range-primary w-full" 
                  />
                </div>
              </>
            )}

            <PanelHeading title="Export" />
            <div className="p-4 border-b border-base-200/60">
              <button 
                onClick={onExport} 
                disabled={!state.originalImage} 
                className="btn btn-primary w-full gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                <BsDownload className="text-lg" />
                Export {state.outputFormat.toUpperCase()}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {state.processedImage ? "Exports processed image" : "Exports original image"}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default WatermarkRemoverControls;
