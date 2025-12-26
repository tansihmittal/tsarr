import { RefObject, useEffect, useCallback, useState, ReactNode } from "react";
import { ImageConverterState } from "./ImageConverterLayout";
import { TfiExport } from "react-icons/tfi";
import { BsClipboard, BsUpload, BsRepeat } from "react-icons/bs";
import { BiReset } from "react-icons/bi";
import { toast } from "react-hot-toast";

interface Props {
  state: ImageConverterState;
  canvasRef: RefObject<HTMLCanvasElement>;
  onExport: () => void;
  onCopy: () => void;
  onImageUpload: (file: File) => void;
}

const ImageConverterPreview: React.FC<Props> = ({ state, canvasRef, onExport, onCopy, onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const OptionButtonOutline = ({ title, onTap, children, disabled }: { children: ReactNode; title: string; onTap?: () => void; disabled?: boolean }) => (
    <div className={`text-primary-content bg-base-100 py-2.5 px-4 flex items-center justify-center gap-2.5 border border-base-200 rounded-lg transition-all duration-200 ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-base-200/50 hover:border-primary/20 hover:shadow-sm cursor-pointer press-effect"}`} onClick={disabled ? undefined : onTap}>
      <span className="text-lg">{children}</span>
      <span className="font-medium">{title}</span>
    </div>
  );

  const handleReset = () => { if (confirm("Reset all changes?")) window.location.reload(); };
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file?.type.startsWith("image/")) onImageUpload(file); }, [onImageUpload]);
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) onImageUpload(file); };

  const handlePaste = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(t => t.startsWith("image/"));
        if (imageType) { const blob = await item.getType(imageType); onImageUpload(new File([blob], "pasted.png", { type: imageType })); toast.success("Image pasted!"); return; }
      }
      toast.error("No image in clipboard");
    } catch { toast.error("Failed to paste"); }
  }, [onImageUpload]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "v") handlePaste(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handlePaste]);

  useEffect(() => {
    if (!state.originalImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (!state.preserveTransparency && state.outputFormat === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, img.width, img.height);
      }
      ctx.drawImage(img, 0, 0);
    };
    img.src = state.originalImage;
  }, [state, canvasRef]);

  const formatSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  if (!state.originalImage) {
    return (
      <div className="flex items-center justify-start flex-col h-full w-full">
        <div className="grid grid-cols-2 gap-2 w-full mb-3 lg:flex lg:justify-end lg:items-center opacity-80" style={{ pointerEvents: "none" }}>
          <div className="dropdown"><label tabIndex={0}><OptionButtonOutline title="Export Image" disabled><TfiExport /></OptionButtonOutline></label></div>
          <OptionButtonOutline title="Copy to Clipboard" disabled><BsClipboard /></OptionButtonOutline>
          <label><OptionButtonOutline title="Reset Image" disabled><BsRepeat /></OptionButtonOutline></label>
          <OptionButtonOutline title="Reset Canvas" disabled><BiReset /></OptionButtonOutline>
        </div>
        <div className="relative w-full min-h-[500px] lg:min-h-[600px] flex items-center justify-center rounded-2xl bg-base-200/30 border border-base-200/80 overflow-hidden">
          <div className={`p-6 sm:p-8 bg-base-100 relative z-20 rounded-2xl shadow-xl shadow-black/5 animate-fade-in-scale ${isDragging ? "ring-2 ring-primary" : ""}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
            <div className="flex gap-1 flex-col mb-6">
              <div className="flex items-start gap-4 sm:gap-6">
                <h2 className="font-bold text-2xl text-primary-content">Convert Image Format</h2>
                <div className="text-2xl text-primary animate-pulse-soft">✦</div>
              </div>
              <span className="text-sm text-gray-500 mt-1">Convert any image to PNG, JPG, WebP, AVIF, GIF, BMP, ICO</span>
            </div>
            <label className={`flex flex-col items-center justify-center gap-3 aspect-[2/1] p-8 border-2 rounded-2xl border-dashed transition-all duration-300 cursor-pointer ${isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-gray-300 hover:border-primary/50 hover:bg-primary/5"}`}>
              <div className={`p-4 rounded-full bg-primary/10 transition-transform duration-300 ${isDragging ? "scale-110" : ""}`}><BsUpload className="text-primary text-2xl" /></div>
              <input type="file" hidden accept="image/*" onChange={handleFileInput} />
              <h3 className="text-gray-700 font-medium"><span className="text-primary hover:underline">Click to upload</span> or drag and drop</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500"><BsClipboard className="text-xs" /><span>or press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl+V</kbd> to paste</span></div>
              <span className="text-xs text-gray-400">PNG, JPG, WebP, AVIF, GIF, BMP, ICO, TIFF, TGA, HEIC, SVG</span>
            </label>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <label className="btn btn-primary rounded-xl font-semibold w-full shadow-lg shadow-primary/20 cursor-pointer"><input type="file" hidden accept="image/*" onChange={handleFileInput} />{isDragging ? "DROP TO UPLOAD" : "SELECT IMAGE"}</label>
              <button onClick={handlePaste} className="btn btn-outline rounded-xl font-semibold w-full gap-2"><BsClipboard className="text-lg" />PASTE IMAGE</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-start flex-col h-full w-full">
      <div className="grid grid-cols-2 gap-2 w-full mb-3 lg:flex lg:justify-end lg:items-center">
        <div className="dropdown">
          <label tabIndex={0}><OptionButtonOutline title="Export Image"><TfiExport /></OptionButtonOutline></label>
          <ul tabIndex={0} className="dropdown-content p-2 mt-1 menu bg-base-100 w-full min-w-[262px] border-2 rounded-md z-50">
            <li onClick={onExport}><a>Convert to {state.outputFormat.toUpperCase()}</a></li>
          </ul>
        </div>
        <OptionButtonOutline title="Copy to Clipboard" onTap={onCopy}><BsClipboard /></OptionButtonOutline>
        <label htmlFor="converter-change"><input type="file" hidden accept="image/*" id="converter-change" onChange={handleFileInput} /><OptionButtonOutline title="Reset Image"><BsRepeat /></OptionButtonOutline></label>
        <OptionButtonOutline title="Reset Canvas" onTap={handleReset}><BiReset /></OptionButtonOutline>
      </div>
      <div className="flex justify-between mb-2 w-full">
        <span className="text-xs text-gray-500 bg-base-200 px-3 py-1 rounded-full">{state.originalFormat} • {formatSize(state.originalSize)}</span>
        <span className="text-xs text-gray-500 bg-base-200 px-3 py-1 rounded-full">{state.originalWidth} × {state.originalHeight} px</span>
      </div>
      <div className={`relative w-full min-h-[500px] lg:min-h-[600px] flex items-center justify-center rounded-2xl bg-base-200/30 border ${isDragging ? "border-primary border-dashed bg-primary/5" : "border-base-200/80"} overflow-hidden`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
        <div className="relative flex items-center justify-center p-4">
          <canvas ref={canvasRef} className="max-w-full max-h-[550px] rounded-lg shadow-2xl shadow-black/10" style={{ background: "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 20px 20px" }} />
        </div>
      </div>
    </div>
  );
};

export default ImageConverterPreview;
