import { useRef, ChangeEvent, useCallback, useEffect, ReactNode } from "react";
import { BsClipboard, BsRepeat, BsUpload } from "react-icons/bs";
import { BiReset } from "react-icons/bi";
import { TfiExport } from "react-icons/tfi";
import { PolaroidState } from "./types";
import { toast } from "react-hot-toast";
import html2canvas from "html2canvas";
import { FileRejection, useDropzone } from "react-dropzone";

interface Props {
  state: PolaroidState;
  polaroidRef: React.RefObject<HTMLDivElement>;
  updateState: (updates: Partial<PolaroidState>) => void;
  onImageUpload: (imageUrl: string, width: number, height: number) => void;
  onReset: () => void;
}

const PolaroidPreview = ({ state, polaroidRef, onImageUpload, onReset }: Props) => {
  const handleDownload = async (scale: number = 2) => {
    if (!polaroidRef.current || !state.image) return;
    try {
      // Get the actual background color for html2canvas
      let bgColor: string | null = null;
      if (state.backgroundType === "transparent") {
        bgColor = null;
      } else if (state.backgroundType === "solid") {
        bgColor = state.backgroundColor;
      } else {
        // For gradients, we let html2canvas capture it naturally
        bgColor = undefined as any;
      }

      const canvas = await html2canvas(polaroidRef.current, {
        scale,
        backgroundColor: bgColor,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `tsarr-in-polaroid-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  const handleCopyToClipboard = async () => {
    if (!polaroidRef.current || !state.image) return;
    try {
      let bgColor: string | null = null;
      if (state.backgroundType === "transparent") {
        bgColor = null;
      } else if (state.backgroundType === "solid") {
        bgColor = state.backgroundColor;
      } else {
        bgColor = undefined as any;
      }

      const canvas = await html2canvas(polaroidRef.current, {
        scale: 2,
        backgroundColor: bgColor,
        useCORS: true,
        logging: false,
      });
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          toast.success("Copied to clipboard!");
        }
      });
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => onImageUpload(fileUrl, img.width, img.height);
      img.src = fileUrl;
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        toast.error("Please upload a valid image file");
        return;
      }
      const file = acceptedFiles[0];
      if (file) {
        const fileUrl = URL.createObjectURL(file);
        const img = new window.Image();
        img.onload = () => onImageUpload(fileUrl, img.width, img.height);
        img.src = fileUrl;
      }
    },
    [onImageUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] },
    maxSize: 30 * 1024 * 1024,
    noClick: !!state.image,
  });

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const fileUrl = URL.createObjectURL(blob);
            const img = new window.Image();
            img.onload = () => onImageUpload(fileUrl, img.width, img.height);
            img.src = fileUrl;
            toast.success("Image pasted from clipboard!");
          }
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onImageUpload]);

  const getFilterStyle = () => {
    const intensity = state.filterIntensity / 100;
    
    // Base manual adjustments
    const brightness = state.brightness / 100;
    const contrast = state.contrast / 100;
    const saturation = state.saturation / 100;
    const blur = state.blur;
    const fade = state.fade / 100;
    
    // Temperature and tint as hue-rotate approximation
    const tempHue = state.temperature * 0.3;
    const tintHue = state.tint * 0.2;
    
    // Exposure as brightness modifier
    const exposureMod = 1 + (state.exposure / 100);
    
    // Build base adjustments
    let baseFilter = `brightness(${brightness * exposureMod}) contrast(${contrast}) saturate(${saturation})`;
    
    if (tempHue !== 0 || tintHue !== 0) {
      baseFilter += ` hue-rotate(${tempHue + tintHue}deg)`;
    }
    
    if (blur > 0) {
      baseFilter += ` blur(${blur}px)`;
    }
    
    // Add fade effect (reduces contrast and adds slight brightness)
    if (fade > 0) {
      const fadeContrast = 1 - (fade * 0.3);
      const fadeBrightness = 1 + (fade * 0.1);
      baseFilter = `brightness(${brightness * exposureMod * fadeBrightness}) contrast(${contrast * fadeContrast}) saturate(${saturation})`;
      if (tempHue !== 0 || tintHue !== 0) {
        baseFilter += ` hue-rotate(${tempHue + tintHue}deg)`;
      }
      if (blur > 0) {
        baseFilter += ` blur(${blur}px)`;
      }
    }

    // Filter-specific adjustments layered on top
    switch (state.filter) {
      case "vintage": return `${baseFilter} sepia(${0.4 * intensity})`;
      case "sepia": return `${baseFilter} sepia(${intensity})`;
      case "bw": return `${baseFilter} grayscale(${intensity})`;
      case "faded": return `${baseFilter} contrast(${0.9 * intensity}) saturate(${0.8 * intensity})`;
      case "warm": return `${baseFilter} sepia(${0.2 * intensity}) saturate(${1.1 * intensity})`;
      case "cool": return `${baseFilter} saturate(${0.95 * intensity}) hue-rotate(${15 * intensity}deg)`;

      // Dazz Cam Popular
      case "cpm35":
        return `${baseFilter} sepia(${0.1 * intensity}) saturate(${1.1 * intensity})`;
      case "fqs":
        return `${baseFilter} sepia(${0.15 * intensity}) saturate(${1.15 * intensity}) hue-rotate(${5 * intensity}deg)`;
      case "hoga":
        return `${baseFilter} sepia(${0.12 * intensity}) saturate(${0.9 * intensity})`;
      case "fxn":
        return `${baseFilter} contrast(${1.15 * intensity}) saturate(${1.2 * intensity})`;
      case "nt16":
        return `${baseFilter} sepia(${0.08 * intensity}) saturate(${0.95 * intensity})`;
      case "grd":
        return `${baseFilter} contrast(${1.1 * intensity}) saturate(${0.85 * intensity}) grayscale(${0.1 * intensity})`;
      case "dClassic":
        return `${baseFilter} saturate(${1.05 * intensity}) sepia(${0.05 * intensity})`;
      case "135sr":
        return `${baseFilter} sepia(${0.18 * intensity}) saturate(${1.12 * intensity}) hue-rotate(${8 * intensity}deg)`;
      case "golf":
        return `${baseFilter} contrast(${0.92 * intensity}) saturate(${0.8 * intensity}) sepia(${0.08 * intensity})`;
      case "s67":
        return `${baseFilter} saturate(${1.2 * intensity}) contrast(${1.05 * intensity}) hue-rotate(${3 * intensity}deg)`;
      case "kino":
        return `${baseFilter} contrast(${1.08 * intensity}) saturate(${0.9 * intensity}) sepia(${0.1 * intensity})`;
      case "ct100":
        return `${baseFilter} saturate(${1.05 * intensity}) hue-rotate(${-10 * intensity}deg)`;

      // Film Stock Emulations
      case "portra":
        return `${baseFilter} contrast(${0.95 * intensity}) saturate(${0.95 * intensity}) sepia(${0.08 * intensity})`;
      case "ektar":
        return `${baseFilter} contrast(${1.1 * intensity}) saturate(${1.3 * intensity})`;
      case "velvia":
        return `${baseFilter} contrast(${1.2 * intensity}) saturate(${1.5 * intensity})`;
      case "provia":
        return `${baseFilter} contrast(${1.05 * intensity}) saturate(${1.08 * intensity})`;
      case "superia":
        return `${baseFilter} saturate(${1.1 * intensity}) sepia(${0.1 * intensity}) hue-rotate(${5 * intensity}deg)`;
      case "gold200":
        return `${baseFilter} sepia(${0.2 * intensity}) saturate(${1.15 * intensity}) hue-rotate(${10 * intensity}deg)`;
      case "ultramax":
        return `${baseFilter} contrast(${1.08 * intensity}) saturate(${1.25 * intensity})`;
      case "cinestill":
        return `${baseFilter} contrast(${1.1 * intensity}) saturate(${1.05 * intensity}) sepia(${0.05 * intensity})`;

      default: return baseFilter;
    }
  };

  const getLightLeakStyle = () => {
    switch (state.lightLeak) {
      case "warm":
        return "linear-gradient(135deg, rgba(255,150,50,0.25) 0%, transparent 50%, rgba(255,100,50,0.15) 100%)";
      case "cool":
        return "linear-gradient(225deg, rgba(100,150,255,0.2) 0%, transparent 50%, rgba(150,100,255,0.15) 100%)";
      case "rainbow":
        return "linear-gradient(135deg, rgba(255,100,100,0.15) 0%, rgba(255,200,100,0.1) 25%, rgba(100,255,150,0.1) 50%, rgba(100,150,255,0.15) 75%, rgba(200,100,255,0.1) 100%)";
      case "subtle":
        return "linear-gradient(180deg, rgba(255,200,150,0.1) 0%, transparent 30%, transparent 70%, rgba(255,150,100,0.08) 100%)";
      case "orange":
        return "linear-gradient(120deg, rgba(255,120,50,0.35) 0%, rgba(255,180,80,0.2) 30%, transparent 60%)";
      case "blue":
        return "linear-gradient(240deg, rgba(80,120,255,0.3) 0%, rgba(100,180,255,0.15) 30%, transparent 60%)";
      case "pink":
        return "linear-gradient(315deg, rgba(255,100,150,0.25) 0%, rgba(255,150,200,0.15) 40%, transparent 70%)";
      case "vintage":
        return "linear-gradient(45deg, rgba(255,200,100,0.2) 0%, transparent 40%, transparent 60%, rgba(255,150,80,0.25) 100%)";
      default:
        return "none";
    }
  };

  const getVignetteStyle = () => {
    if (!state.vignette) return "none";
    const intensity = state.vignetteIntensity / 100;
    return `radial-gradient(circle, transparent ${50 - intensity * 30}%, rgba(0,0,0,${intensity * 0.6}) 100%)`;
  };

  const getGrainOverlay = () => {
    if (!state.grain) return null;
    const noiseSvg = `data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E`;
    return {
      backgroundImage: `url("${noiseSvg}")`,
      opacity: state.grainIntensity / 100,
      mixBlendMode: 'overlay' as const,
    };
  };

  const getBackgroundStyle = () => {
    switch (state.backgroundType) {
      case "gradient": return `linear-gradient(${state.gradientAngle}deg, ${state.gradientFrom}, ${state.gradientTo})`;
      case "transparent": return "transparent";
      default: return state.backgroundColor;
    }
  };

  const getTextureStyle = () => {
    // Simple SVG noise pattern
    const noiseSvg = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E`;

    switch (state.frameTexture) {
      case "paper":
        return {
          backgroundImage: `url("${noiseSvg}")`,
          opacity: 0.05,
          mixBlendMode: 'multiply' as const
        };
      case "grain":
        return {
          backgroundImage: `url("${noiseSvg}")`,
          opacity: 0.15,
          mixBlendMode: 'overlay' as const
        };
      case "ragged":
        return {
          backgroundImage: `url("${noiseSvg}")`,
          opacity: 0.2,
          filter: 'contrast(150%)',
          mixBlendMode: 'multiply' as const
        };
      default: return { display: 'none' };
    }
  };

  const OptionButtonOutline = ({ title, onTap, children, disabled }: { children: ReactNode; title: string; onTap?: () => void; disabled?: boolean }) => (
    <div
      className={`text-primary-content bg-base-100 py-2.5 px-4 flex items-center justify-center gap-2.5 border border-base-200 rounded-lg transition-all duration-200 ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-base-200/50 hover:border-primary/20 hover:shadow-sm cursor-pointer press-effect"}`}
      onClick={disabled ? undefined : onTap}
    >
      <span className="text-lg">{children}</span>
      <span className="font-medium">{title}</span>
    </div>
  );

  return (
    <div className="flex items-center justify-start flex-col h-full w-full">
      <div style={{ pointerEvents: state.image ? "auto" : "none" }} className={`grid grid-cols-2 gap-2 w-full mb-3 lg:flex lg:justify-end lg:items-center ${state.image ? "opacity-100" : "opacity-80"}`}>
        <div className="dropdown">
          <label tabIndex={0}><OptionButtonOutline title="Export Image"><TfiExport /></OptionButtonOutline></label>
          <ul tabIndex={0} className="dropdown-content p-2 mt-1 menu bg-base-100 w-full min-w-[262px] border-2 rounded-md">
            <li onClick={() => handleDownload(1)}><a>Export as PNG 1x</a></li>
            <li onClick={() => handleDownload(2)}><a>Export as PNG 2x</a></li>
            <li onClick={() => handleDownload(4)}><a>Export as PNG 4x</a></li>
          </ul>
        </div>
        <OptionButtonOutline title="Copy to Clipboard" onTap={handleCopyToClipboard} disabled={!state.image}><BsClipboard className="icon" /></OptionButtonOutline>
        <label htmlFor="polaroid-image-reset">
          <input type="file" hidden accept="image/*" id="polaroid-image-reset" onChange={handleFileChange} />
          <OptionButtonOutline title="Reset Image"><BsRepeat className="icon" /></OptionButtonOutline>
        </label>
        <OptionButtonOutline title="Reset Canvas" onTap={onReset}><BiReset className="icon" /></OptionButtonOutline>
      </div>

      {state.image && state.imageWidth > 0 && (
        <div className="flex justify-end mb-2 w-full">
          <span className="text-xs text-gray-500 bg-base-200 px-3 py-1 rounded-full">{state.imageWidth} × {state.imageHeight} px</span>
        </div>
      )}

      <div {...getRootProps()} className="relative w-full min-h-[500px] lg:min-h-[600px] flex items-center justify-center rounded-2xl bg-base-200/30 border border-base-200/80 overflow-auto">
        <input {...getInputProps()} />
        {state.image ? (
          (() => {
            // Calculate scale to fit in preview while maintaining full size for export
            const maxPreviewWidth = 500;
            const maxPreviewHeight = 500;
            const totalWidth = state.imageWidth + (state.borderWidth * 2) + 96; // padding
            const totalHeight = state.imageHeight + state.borderWidth + state.bottomBorderWidth + 96;
            const scaleX = totalWidth > maxPreviewWidth ? maxPreviewWidth / totalWidth : 1;
            const scaleY = totalHeight > maxPreviewHeight ? maxPreviewHeight / totalHeight : 1;
            const displayScale = Math.min(scaleX, scaleY, 1);
            
            return (
              <div style={{ transform: `scale(${displayScale})`, transformOrigin: "center center" }}>
                <div 
                  ref={polaroidRef} 
                  className="flex items-center justify-center" 
                  style={{ 
                    background: getBackgroundStyle(), 
                    padding: "48px",
                  }}
                >
                  <div className="relative" style={{ transform: `rotate(${state.rotation}deg) perspective(1000px) rotateY(${state.tilt}deg)`, boxShadow: state.shadow ? `0 ${state.shadowIntensity / 2}px ${state.shadowIntensity}px rgba(0,0,0,${state.shadowIntensity / 100})` : "none", backgroundColor: state.frameColor, padding: `${state.borderWidth}px ${state.borderWidth}px ${state.bottomBorderWidth}px ${state.borderWidth}px` }}>
                    {/* Texture Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-10" style={getTextureStyle()} />

                    <div className="relative overflow-hidden" style={{ width: state.imageWidth, height: state.imageHeight }}>
                      {/* Vignette overlay */}
                      {state.vignette && (
                        <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: getVignetteStyle() }} />
                      )}
                      {/* Holga-style vignette for hoga filter */}
                      {state.filter === 'hoga' && (
                        <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.5) 100%)' }} />
                      )}
                      {/* Light leak overlay */}
                      {state.lightLeak !== 'none' && (
                        <div className="absolute inset-0 z-21 pointer-events-none" style={{ background: getLightLeakStyle() }} />
                      )}
                      {/* Film grain overlay */}
                      {state.grain && (
                        <div className="absolute inset-0 z-22 pointer-events-none" style={getGrainOverlay() || {}} />
                      )}
                      <img src={state.image} alt="Polaroid" className="w-full h-full object-cover" style={{ filter: getFilterStyle() }} />
                    </div>
                    {state.caption && (
                      <div className="absolute bottom-0 left-0 right-0 text-center" style={{ paddingBottom: `${(state.bottomBorderWidth - state.borderWidth) / 3}px`, fontFamily: state.captionFont, fontSize: `${state.captionSize}px`, color: state.captionColor }}>{state.caption}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <PolaroidDropZone isDragActive={isDragActive} />
        )}
      </div>
    </div>
  );
};

const PolaroidDropZone = ({ isDragActive }: { isDragActive: boolean }) => {
  return (
    <div className="p-6 sm:p-8 bg-base-100 relative z-20 rounded-2xl shadow-xl shadow-black/5 animate-fade-in-scale">
      <div className="flex gap-1 flex-col mb-6">
        <div className="flex items-start gap-4 sm:gap-6">
          <h2 className="font-bold text-2xl text-primary-content bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text">Create Polaroid Photo</h2>
          <div className="text-2xl text-primary animate-pulse-soft">✦</div>
        </div>
        <span className="text-sm text-gray-500 mt-1">Transform your images into vintage polaroid-style photos</span>
      </div>
      <div className={`flex flex-col items-center justify-center gap-3 aspect-[2/1] p-8 border-2 rounded-2xl border-dashed transition-all duration-300 cursor-pointer ${isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-gray-300 hover:border-primary/50 hover:bg-primary/5"}`}>
        <div className={`p-4 rounded-full bg-primary/10 transition-transform duration-300 ${isDragActive ? "scale-110" : ""}`}><BsUpload className="text-primary text-2xl" /></div>
        <h3 className="text-gray-700 font-medium"><span className="text-primary hover:underline cursor-pointer">Click to upload</span> or drag and drop</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500"><BsClipboard className="text-xs" /><span>or press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl+V</kbd> to paste</span></div>
        <span className="text-xs text-gray-400">PNG, JPG, WEBP up to 30MB</span>
      </div>
      <div className="mt-6"><button className="btn btn-primary rounded-xl font-semibold w-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5">{isDragActive ? "DROP TO UPLOAD" : "START CREATING"}</button></div>
    </div>
  );
};

export default PolaroidPreview;
