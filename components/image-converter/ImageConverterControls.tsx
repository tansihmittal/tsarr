import { useRef, useState } from "react";
import { ImageConverterState } from "./ImageConverterLayout";
import { BsUpload, BsClipboard, BsDownload, BsFileEarmarkImage, BsImage, BsCamera, BsGlobe2, BsStars, BsCameraReels, BsPalette, BsDiamond, BsFileEarmark, BsController, BsPhone } from "react-icons/bs";
import { IMAGE_ACCEPT } from "@/utils/imageFile";
import { toast } from "react-hot-toast";
import ControlPanelHeading from "../common/ControlPanelHeading";
import ControlPanelRow from "../common/ControlPanelRow";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface Props {
  state: ImageConverterState;
  updateState: (updates: Partial<ImageConverterState>) => void;
  onImageUpload: (file: File) => void;
  onExport: () => void;
}

const allFormats = [
  { id: "png",  name: "PNG",  desc: "Lossless, transparency", icon: <BsImage />,      supportsQuality: false },
  { id: "jpeg", name: "JPG",  desc: "Smaller file size",      icon: <BsCamera />,     supportsQuality: true  },
  { id: "webp", name: "WebP", desc: "Modern, efficient",      icon: <BsGlobe2 />,     supportsQuality: true  },
  { id: "avif", name: "AVIF", desc: "Best compression",       icon: <BsStars />,      supportsQuality: true  },
  { id: "gif",  name: "GIF",  desc: "Animation support",      icon: <BsCameraReels />,supportsQuality: false },
  { id: "bmp",  name: "BMP",  desc: "Uncompressed",           icon: <BsPalette />,    supportsQuality: false },
  { id: "ico",  name: "ICO",  desc: "Icon format",            icon: <BsDiamond />,    supportsQuality: false },
  { id: "tiff", name: "TIFF", desc: "Print quality",          icon: <BsFileEarmark />,supportsQuality: false },
  { id: "tga",  name: "TGA",  desc: "Game textures",          icon: <BsController />, supportsQuality: false },
  { id: "heic", name: "HEIC", desc: "Apple format",           icon: <BsPhone />,      supportsQuality: true  },
];

const inputFormats = ["PNG", "JPG", "JPEG", "WEBP", "AVIF", "GIF", "BMP", "ICO", "TIFF", "TIF", "TGA", "HEIC", "HEIF", "SVG"];

const ImageConverterControls: React.FC<Props> = ({ state, updateState, onImageUpload, onExport }) => {
  const [filterFormat, setFilterFormat] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageUpload(file);
  };

  const handlePaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(t => t.startsWith("image/"));
        if (imageType) { const blob = await item.getType(imageType); onImageUpload(new File([blob], "pasted.png", { type: imageType })); toast.success("Image pasted!"); return; }
      }
      toast.error("No image in clipboard");
    } catch { toast.error("Failed to paste"); }
  };

  const PanelHeading = ControlPanelHeading;
  const Control = ControlPanelRow;

  const formatSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  const selectedFormat = allFormats.find(f => f.id === state.outputFormat);

  // Filter output formats based on input format (exclude same format)
  const outputFormats = allFormats.filter(f => {
    const inputNorm = state.originalFormat?.toUpperCase().replace("JPEG", "JPG");
    const outputNorm = f.name.toUpperCase();
    return inputNorm !== outputNorm;
  });

  return (
    <section className="flex flex-col transition-opacity duration-300 opacity-100">
      <div className="rounded-[14px] border border-[#E5E7EB] bg-white shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
        <PanelHeading title="Image" />
        <div className="p-4 border-b border-[#E5E7EB]/60">
          <input ref={fileInputRef} type="file" accept={IMAGE_ACCEPT} onChange={handleFileChange} className="hidden" />
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2"><BsUpload /> {state.originalImage ? "Change" : "Upload"}</Button>
            <Button variant="secondary" size="sm" onClick={handlePaste} className="gap-2"><BsClipboard /> Paste</Button>
          </div>
          {state.originalImage && (
            <div className="flex items-center gap-3 p-3 bg-[#EFF6FF] rounded-[10px]">
              <img src={state.originalImage} alt="Preview" className="w-14 h-14 rounded-[10px] object-cover" />
              <div className="text-sm flex-1">
                <div className="font-medium text-[#0A0A0A] flex items-center gap-2">
                  <BsFileEarmarkImage className="text-[#2563EB]" />
                  {state.originalFormat}
                </div>
                <div className="text-gray-500">{state.originalWidth} × {state.originalHeight}</div>
                <div className="text-gray-400 text-xs">{formatSize(state.originalSize)}</div>
              </div>
            </div>
          )}
        </div>

        <PanelHeading title="Convert To" />
        <div className="p-4 border-b border-[#E5E7EB]/60">
          <div className="grid grid-cols-2 gap-2">
            {outputFormats.map((format) => (
              <button
                key={format.id}
                onClick={() => updateState({ outputFormat: format.id as ImageConverterState["outputFormat"] })}
                className={`p-2.5 rounded-[10px] text-left transition-all ${state.outputFormat === format.id ? "bg-[#2563EB] text-white ring-2 ring-[#2563EB] ring-offset-2" : "bg-[#F9FAFB] hover:bg-[#E5E7EB]"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base flex items-center">{format.icon}</span>
                  <div>
                    <div className="font-semibold text-sm">{format.name}</div>
                    <div className={`text-[10px] ${state.outputFormat === format.id ? "text-white/70" : "text-gray-500"}`}>{format.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {state.originalImage && (
            <p className="text-xs text-center mt-3 text-gray-500">
              {state.originalFormat} → {state.outputFormat.toUpperCase()}
            </p>
          )}
        </div>

        {selectedFormat?.supportsQuality && (
          <>
            <PanelHeading title="Quality" />
            <div className="p-4 border-b border-[#E5E7EB]/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Quality</span>
                <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{state.quality}%</span>
              </div>
              <Slider min={10} max={100} value={[state.quality]} onValueChange={([v]) => updateState({ quality: v })} className="w-full mb-2" />
              <div className="flex gap-2">
                {[50, 75, 90, 100].map(q => (
                  <Button key={q} size="sm" variant={state.quality === q ? "default" : "secondary"} className="h-7 text-xs px-3" onClick={() => updateState({ quality: q })}>{q}%</Button>
                ))}
              </div>
            </div>
          </>
        )}

        {state.outputFormat === "jpeg" && (
          <Control title="White Background">
            <Switch checked={!state.preserveTransparency} onCheckedChange={(v: boolean) => updateState({ preserveTransparency: !v })} />
          </Control>
        )}

        <PanelHeading title="Convert" />
        <div className="p-4">
          <Button onClick={onExport} disabled={!state.originalImage} className="w-full gap-2 shadow-lg shadow-[#2563EB]/20">
            <BsDownload className="text-lg" />
            Convert to {state.outputFormat.toUpperCase()}
          </Button>
          {state.originalImage && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              {state.originalFormat} → {state.outputFormat.toUpperCase()}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ImageConverterControls;
