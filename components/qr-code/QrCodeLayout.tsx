import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";
import Navigation from "../common/Navigation";
import { BsDownload, BsClipboard, BsQrCode } from "react-icons/bs";

const ERROR_LEVELS = ["L", "M", "Q", "H"] as const;
type ErrorLevel = (typeof ERROR_LEVELS)[number];

const PRESETS = [
  { label: "URL", placeholder: "https://example.com" },
  { label: "Text", placeholder: "Hello, World!" },
  { label: "Email", placeholder: "mailto:you@example.com" },
  { label: "Phone", placeholder: "tel:+1234567890" },
  { label: "WiFi", placeholder: "WIFI:S:MyNetwork;T:WPA;P:mypassword;;" },
];

const QrCodeLayout: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState("https://tsarr.in");
  const [size, setSize] = useState(300);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>("M");
  const [margin, setMargin] = useState(4);
  const [activePreset, setActivePreset] = useState(0);

  const generateQR = useCallback(async () => {
    if (!canvasRef.current || !text.trim()) return;
    try {
      const QRCode = (await import("qrcode")).default;
      await QRCode.toCanvas(canvasRef.current, text.trim(), {
        width: size,
        margin,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: errorLevel,
      });
    } catch (err: any) {
      if (err?.message?.includes("too long")) {
        toast.error("Text is too long for this error level. Try level L.");
      }
    }
  }, [text, size, fgColor, bgColor, errorLevel, margin]);

  useEffect(() => {
    generateQR();
  }, [generateQR]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "tsarr-qr-code.png";
    a.click();
    toast.success("Downloaded!");
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((r) =>
        canvas.toBlob(r, "image/png")
      );
      if (!blob) throw new Error();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <main className="min-h-[100vh] h-fit editor-bg relative pb-20 lg:pb-0">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-3 sm:px-4 lg:px-0 relative">
        <div className="flex flex-col lg:grid lg:gap-5 lg:grid-cols-[3fr_1.5fr]">
          {/* Preview */}
          <div className="flex flex-col gap-3 py-4">
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleCopy}
                className="btn btn-sm btn-outline gap-2"
              >
                <BsClipboard className="w-3.5 h-3.5" />
                Copy
              </button>
              <button
                onClick={handleDownload}
                className="btn btn-sm btn-primary gap-2"
              >
                <BsDownload className="w-3.5 h-3.5" />
                Download PNG
              </button>
            </div>
            <div className="flex items-center justify-center rounded-2xl border border-base-300 bg-base-200/40 min-h-[380px] py-8">
              <div className="shadow-2xl rounded-xl overflow-hidden">
                <canvas ref={canvasRef} />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3 py-4">
            {/* Preset type */}
            <div className="bg-base-200/60 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-3">
                Type
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {PRESETS.map((p, i) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setActivePreset(i);
                      setText(p.placeholder);
                    }}
                    className={`btn btn-xs ${
                      activePreset === i ? "btn-primary" : "btn-outline"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <textarea
                className="textarea textarea-bordered w-full text-sm resize-none"
                rows={3}
                placeholder={PRESETS[activePreset]?.placeholder ?? "Enter text or URL…"}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setActivePreset(-1);
                }}
              />
            </div>

            {/* Size */}
            <div className="bg-base-200/60 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                  Size
                </p>
                <span className="text-xs font-mono text-base-content/70">
                  {size}px
                </span>
              </div>
              <input
                type="range"
                min={128}
                max={1024}
                step={32}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="range range-xs range-primary"
              />
              <div className="flex justify-between text-xs text-base-content/40 mt-1">
                <span>128</span>
                <span>1024</span>
              </div>
            </div>

            {/* Margin */}
            <div className="bg-base-200/60 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                  Margin
                </p>
                <span className="text-xs font-mono text-base-content/70">
                  {margin}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="range range-xs range-primary"
              />
            </div>

            {/* Colors */}
            <div className="bg-base-200/60 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-3">
                Colors
              </p>
              <div className="flex flex-col gap-2">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-base-content/70">
                    Foreground
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-base-content/50">
                      {fgColor.toUpperCase()}
                    </span>
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-8 h-7 rounded cursor-pointer border border-base-300"
                    />
                  </div>
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-base-content/70">
                    Background
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-base-content/50">
                      {bgColor.toUpperCase()}
                    </span>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-7 rounded cursor-pointer border border-base-300"
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* Error correction */}
            <div className="bg-base-200/60 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-3">
                Error Correction
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {ERROR_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setErrorLevel(lvl)}
                    className={`btn btn-xs ${
                      errorLevel === lvl ? "btn-primary" : "btn-outline"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <p className="text-xs text-base-content/40 mt-2">
                H = most resilient · L = more data
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default QrCodeLayout;
