import { useRef } from "react";
import { WatermarkRemoverState } from "./WatermarkRemoverLayout";
import { BiEraser } from "react-icons/bi";
import { IoMdOptions } from "react-icons/io";
import { BsUpload, BsClipboard, BsDownload, BsTrash, BsMagic } from "react-icons/bs";
import { toast } from "react-hot-toast";
import ControlPanelHeading from "../common/ControlPanelHeading";
import ControlPanelRow from "../common/ControlPanelRow";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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


  return (
    <section className="flex flex-col transition-opacity duration-300 opacity-100">
      <Tabs defaultValue="selection">
      <TabsList className="w-full grid grid-cols-3 rounded-[12px] bg-[#F3F4F6] mb-3">
        <TabsTrigger value="selection" className="gap-1.5 rounded-[10px] text-xs"><BiEraser className="w-3.5 h-3.5" /> Select</TabsTrigger>
        <TabsTrigger value="process" className="gap-1.5 rounded-[10px] text-xs"><BsMagic className="w-3.5 h-3.5" /> Process</TabsTrigger>
        <TabsTrigger value="output" className="gap-1.5 rounded-[10px] text-xs"><IoMdOptions className="w-3.5 h-3.5" /> Output</TabsTrigger>
      </TabsList>

      <div className="rounded-[14px] border border-[#E5E7EB] bg-white shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
        <PanelHeading title="Image" />
        <div className="p-4 border-b border-[#E5E7EB]/60">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
              <BsUpload /> {state.originalImage ? "Change" : "Upload"}
            </Button>
            <Button variant="secondary" size="sm" onClick={handlePaste} className="gap-2">
              <BsClipboard /> Paste
            </Button>
          </div>
          {state.originalImage && (
            <div className="flex items-center gap-3">
              <img src={state.originalImage} alt="Preview" className="w-16 h-16 rounded-[10px] object-cover" />
              <div className="text-sm">
                <div className="font-medium text-[#0A0A0A]">{state.imageWidth} × {state.imageHeight}</div>
                <div className="text-gray-500">Original size</div>
              </div>
            </div>
          )}
        </div>

        <TabsContent value="selection">
          <div className="relative rounded-md">
            <PanelHeading title="Selection Tool" />
            <div className="p-4 border-b border-[#E5E7EB]/60">
              <p className="text-sm text-gray-600 mb-4">
                Click and drag on the image to select watermark areas you want to remove.
              </p>

              <div className="bg-[#EFF6FF] rounded-[10px] p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#0A0A0A]">Selected Areas</span>
                  <span className="text-xs bg-[#2563EB]/10 text-[#2563EB] px-2 py-1 rounded-full">
                    {state.selections.length} area{state.selections.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {state.selections.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {state.selections.map((sel, idx) => (
                      <div key={sel.id} className="flex items-center justify-between text-xs bg-white rounded px-2 py-1">
                        <span>Area {idx + 1}: {Math.round(sel.width)}×{Math.round(sel.height)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No areas selected yet</p>
                )}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={clearSelections}
                disabled={state.selections.length === 0}
                className="w-full gap-2"
              >
                <BsTrash /> Clear All Selections
              </Button>
            </div>

            <PanelHeading title="Tips" />
            <div className="p-4 border-b border-[#E5E7EB]/60">
              <ul className="text-xs text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#2563EB]">•</span>
                  <span>Select the watermark area as precisely as possible</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2563EB]">•</span>
                  <span>Works best on solid or gradient backgrounds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2563EB]">•</span>
                  <span>Multiple selections can be processed at once</span>
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="process">
          <div className="relative rounded-md">
            <PanelHeading title="Remove Watermark" />
            <div className="p-4 border-b border-[#E5E7EB]/60">
              <p className="text-sm text-gray-600 mb-4">
                Process the selected areas to remove watermarks using edge-aware interpolation.
              </p>

              {state.isProcessing && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Processing...</span>
                    <span>{state.processingProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2563EB] transition-all duration-300"
                      style={{ width: `${state.processingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={onProcess}
                disabled={!state.originalImage || state.selections.length === 0 || state.isProcessing}
                className="w-full gap-2 shadow-lg shadow-[#2563EB]/20"
              >
                {state.isProcessing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <BsMagic className="text-lg" />
                    Remove Watermark
                  </>
                )}
              </Button>

              {state.selections.length === 0 && state.originalImage && (
                <p className="text-xs text-amber-600 mt-2 text-center">
                  Please select watermark areas first
                </p>
              )}
            </div>

            <PanelHeading title="Tips" />
            <div className="p-4 border-b border-[#E5E7EB]/60">
              <ul className="text-xs text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#2563EB]">•</span>
                  <span>Works best on smooth gradients (sky, water, walls)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2563EB]">•</span>
                  <span>Select tightly around the watermark text</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2563EB]">•</span>
                  <span>For complex textures, try smaller selections</span>
                </li>
              </ul>
            </div>

            <PanelHeading title="Status" />
            <div className="p-4 border-b border-[#E5E7EB]/60">
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
        </TabsContent>

        <TabsContent value="output">
          <div className="relative rounded-md">
            <PanelHeading title="Format" />
            <div className="p-4 border-b border-[#E5E7EB]/60">
              <div className="grid grid-cols-3 gap-2">
                {outputFormats.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => updateState({ outputFormat: format.id as WatermarkRemoverState["outputFormat"] })}
                    className={`p-3 rounded-[10px] text-center transition-all ${state.outputFormat === format.id ? "bg-[#2563EB] text-white" : "bg-[#F9FAFB] hover:bg-[#F3F4F6]"}`}
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
                <div className="p-4 border-b border-[#E5E7EB]/60">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-gray-500 font-medium">Quality</span>
                    <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{state.quality}%</span>
                  </div>
                  <Slider
                    min={10}
                    max={100}
                    value={[state.quality]}
                    onValueChange={([v]) => updateState({ quality: v })}
                  />
                </div>
              </>
            )}

            <PanelHeading title="Export" />
            <div className="p-4 border-b border-[#E5E7EB]/60">
              <Button
                onClick={onExport}
                disabled={!state.originalImage}
                className="w-full gap-2 shadow-lg shadow-[#2563EB]/20"
              >
                <BsDownload className="text-lg" />
                Export {state.outputFormat.toUpperCase()}
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {state.processedImage ? "Exports processed image" : "Exports original image"}
              </p>
            </div>
          </div>
        </TabsContent>
      </div>
      </Tabs>
    </section>
  );
};

export default WatermarkRemoverControls;
