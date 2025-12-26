import { useRef, useState } from "react";
import { ImageConverterState } from "./ImageConverterLayout";
import { BsUpload, BsClipboard, BsDownload, BsFileEarmarkImage } from "react-icons/bs";
import { toast } from "react-hot-toast";

interface Props {
  state: ImageConverterState;
  updateState: (updates: Partial<ImageConverterState>) => void;
  onImageUpload: (file: File) => void;
  onExport: () => void;
}

const allFormats = [
  { id: "png", name: "PNG", desc: "Lossless, transparency", icon: "🖼️", supportsQuality: false },
  { id: "jpeg", name: "JPG", desc: "Smaller file size", icon: "📷", supportsQuality: true },
  { id: "webp", name: "WebP", desc: "Modern, efficient", icon: "🌐", supportsQuality: true },
  { id: "avif", name: "AVIF", desc: "Best compression", icon: "✨", supportsQuality: true },
  { id: "gif", name: "GIF", desc: "Animation support", icon: "🎞️", supportsQuality: false },
  { id: "bmp", name: "BMP", desc: "Uncompressed", icon: "🎨", supportsQuality: false },
  { id: "ico", name: "ICO", desc: "Icon format", icon: "🔷", supportsQuality: false },
  { id: "tiff", name: "TIFF", desc: "Print quality", icon: "📄", supportsQuality: false },
  { id: "tga", name: "TGA", desc: "Game textures", icon: "🎮", supportsQuality: false },
  { id: "heic", name: "HEIC", desc: "Apple format", icon: "🍎", supportsQuality: true },
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
      <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-110px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
        <PanelHeading title="Image" />
        <div className="p-4 border-b border-base-200/60">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button onClick={() => fileInputRef.current?.click()} className="btn btn-outline btn-sm gap-2"><BsUpload /> {state.originalImage ? "Change" : "Upload"}</button>
            <button onClick={handlePaste} className="btn btn-outline btn-sm gap-2"><BsClipboard /> Paste</button>
          </div>
          {state.originalImage && (
            <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
              <img src={state.originalImage} alt="Preview" className="w-14 h-14 rounded-lg object-cover" />
              <div className="text-sm flex-1">
                <div className="font-medium text-primary-content flex items-center gap-2">
                  <BsFileEarmarkImage className="text-primary" />
                  {state.originalFormat}
                </div>
                <div className="text-gray-500">{state.originalWidth} × {state.originalHeight}</div>
                <div className="text-gray-400 text-xs">{formatSize(state.originalSize)}</div>
              </div>
            </div>
          )}
        </div>

        <PanelHeading title="Convert To" />
        <div className="p-4 border-b border-base-200/60">
          <div className="grid grid-cols-2 gap-2">
            {outputFormats.map((format) => (
              <button
                key={format.id}
                onClick={() => updateState({ outputFormat: format.id as ImageConverterState["outputFormat"] })}
                className={`p-2.5 rounded-lg text-left transition-all ${state.outputFormat === format.id ? "bg-primary text-white ring-2 ring-primary ring-offset-2" : "bg-base-200 hover:bg-base-300"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{format.icon}</span>
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
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Quality</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{state.quality}%</span>
              </div>
              <input type="range" min="10" max="100" value={state.quality} onChange={(e) => updateState({ quality: Number(e.target.value) })} className="range range-xs range-primary w-full mb-2" />
              <div className="flex gap-2">
                {[50, 75, 90, 100].map(q => (
                  <button key={q} onClick={() => updateState({ quality: q })} className={`btn btn-xs ${state.quality === q ? "btn-primary" : "btn-outline"}`}>{q}%</button>
                ))}
              </div>
            </div>
          </>
        )}

        {state.outputFormat === "jpeg" && (
          <Control title="White Background">
            <label className="custom-toggle">
              <input type="checkbox" checked={!state.preserveTransparency} onChange={(e) => updateState({ preserveTransparency: !e.target.checked })} />
              <span className="slider"></span>
            </label>
          </Control>
        )}

        <PanelHeading title="Convert" />
        <div className="p-4">
          <button onClick={onExport} disabled={!state.originalImage} className="btn btn-primary w-full gap-2 shadow-lg shadow-primary/20 disabled:opacity-50">
            <BsDownload className="text-lg" />
            Convert to {state.outputFormat.toUpperCase()}
          </button>
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
