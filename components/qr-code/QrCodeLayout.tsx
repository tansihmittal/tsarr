import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import Navigation from "../common/Navigation";
import { BsDownload, BsClipboard, BsSliders, BsQrCode } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getQrType } from "./qrTypes";
import QrTypeSelector from "./QrTypeSelector";
import QrDataForm from "./QrDataForm";
import QrCustomization from "./QrCustomization";
import { QrStyleState, defaultQrStyle } from "./qrStyle";
import { composeQrWithFrame } from "./drawFrame";
import { blendArtImage, loadImage } from "./blendArt";
import type { Options as QrOptions } from "qr-code-styling";

const EMPTY_FIELDS: Record<string, string> = {};

const QrCodeLayout: React.FC = () => {
  const previewRef = useRef<HTMLDivElement>(null);
  const finalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTokenRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeTypeId, setActiveTypeId] = useState("link");
  const [fieldValuesByType, setFieldValuesByType] = useState<Record<string, Record<string, string>>>({
    link: { url: "https://tsarr.in" },
  });
  const [style, setStyle] = useState<QrStyleState>(defaultQrStyle);
  const [panelTab, setPanelTab] = useState<"content" | "design">("content");
  const [isRendering, setIsRendering] = useState(false);

  const typeDef = getQrType(activeTypeId);
  const fieldValues = fieldValuesByType[activeTypeId] || EMPTY_FIELDS;

  const payload = useMemo(() => typeDef.buildPayload(fieldValues), [typeDef, fieldValues]);

  const updateField = useCallback(
    (key: string, value: string) => {
      setFieldValuesByType((prev) => ({
        ...prev,
        [activeTypeId]: { ...prev[activeTypeId], [key]: value },
      }));
    },
    [activeTypeId]
  );

  const updateStyle = useCallback((patch: Partial<QrStyleState>) => {
    setStyle((prev) => ({ ...prev, ...patch }));
  }, []);

  // ---------- render pipeline: qr-code-styling -> art blend -> frame ----------
  const render = useCallback(async () => {
    const container = previewRef.current;
    if (!container) return;

    if (!payload.trim()) {
      container.innerHTML = "";
      finalCanvasRef.current = null;
      return;
    }

    const token = ++renderTokenRef.current;
    setIsRendering(true);

    try {
      const { default: QRCodeStyling } = await import("qr-code-styling");

      const dotsOptions: QrOptions["dotsOptions"] =
        style.colorMode === "gradient"
          ? {
              type: style.dotsType,
              gradient: {
                type: style.gradientType,
                rotation: (style.gradientRotation * Math.PI) / 180,
                colorStops: [
                  { offset: 0, color: style.gradientFrom },
                  { offset: 1, color: style.gradientTo },
                ],
              },
            }
          : { type: style.dotsType, color: style.fgColor };

      const qr = new QRCodeStyling({
        width: style.size,
        height: style.size,
        type: "canvas",
        data: payload,
        margin: style.margin,
        shape: style.shape,
        qrOptions: { errorCorrectionLevel: style.errorCorrectionLevel },
        dotsOptions,
        cornersSquareOptions: { type: style.cornersSquareType, color: style.eyeFrameColor },
        cornersDotOptions: { type: style.cornersDotType, color: style.eyeColor },
        backgroundOptions: { color: style.artBlendImage ? "transparent" : style.bgColor },
        image: style.logoDataUrl || undefined,
        // qr-code-styling's internal option merge dereferences imageOptions
        // unconditionally, so this must always be a real object — never
        // `undefined` — even when there's no logo to embed.
        imageOptions: { imageSize: style.logoSizeRatio, margin: style.logoMargin, hideBackgroundDots: !style.logoEmbedded },
      });

      const blob = await qr.getRawData("png");
      if (token !== renderTokenRef.current) return; // superseded by a newer render
      if (!blob) throw new Error("Failed to render QR");

      const url = URL.createObjectURL(blob as Blob);
      const img = await loadImage(url);
      URL.revokeObjectURL(url);
      if (token !== renderTokenRef.current) return;

      const rawCanvas = document.createElement("canvas");
      rawCanvas.width = style.size;
      rawCanvas.height = style.size;
      rawCanvas.getContext("2d")!.drawImage(img, 0, 0, style.size, style.size);

      let composed = rawCanvas;
      if (style.artBlendImage) {
        const artImg = await loadImage(style.artBlendImage);
        if (token !== renderTokenRef.current) return;
        composed = blendArtImage(rawCanvas, artImg, style.artBlendOpacity);
      }
      composed = composeQrWithFrame(composed, style);

      if (token !== renderTokenRef.current) return;
      finalCanvasRef.current = composed;
      composed.className = "max-w-full h-auto";
      container.innerHTML = "";
      container.appendChild(composed);
    } catch (err: any) {
      console.error("QR render failed:", err);
      const message = typeof err === "string" ? err : err?.message;
      if (message?.includes("too long") || message?.includes("code length overflow")) {
        toast.error("Too much data for this error-correction level. Try a lower level or shorter content.");
      } else {
        toast.error("Couldn't generate the QR code. Please try again.");
      }
    } finally {
      if (token === renderTokenRef.current) setIsRendering(false);
    }
  }, [payload, style]);

  // debounce so dragging sliders doesn't hammer re-renders
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => render(), 80);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [render]);

  const handleDownload = () => {
    const canvas = finalCanvasRef.current;
    if (!canvas) {
      toast.error("Fill in the details first");
      return;
    }
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "tsarr-qr-code.png";
    a.click();
    toast.success("Downloaded!");
  };

  const handleCopy = async () => {
    const canvas = finalCanvasRef.current;
    if (!canvas) {
      toast.error("Fill in the details first");
      return;
    }
    try {
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
      if (!blob) throw new Error();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <main className="min-h-[100vh] h-fit editor-bg relative pb-20 lg:pb-0" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-3 sm:px-4 lg:px-0 relative">
        <div className="flex flex-col lg:grid lg:gap-5 lg:grid-cols-[3fr_1.5fr]">
          {/* Preview */}
          <div className="flex flex-col gap-3 py-4">
            <div className="flex items-center justify-end gap-2">
              <Button onClick={handleCopy} size="sm" variant="secondary" className="gap-2">
                <BsClipboard className="w-3.5 h-3.5" />
                Copy
              </Button>
              <Button onClick={handleDownload} size="sm" className="gap-2">
                <BsDownload className="w-3.5 h-3.5" />
                Download PNG
              </Button>
            </div>
            <div className="flex items-center justify-center rounded-[20px] border border-[#E5E7EB] dark:border-gray-700 bg-[#EFF6FF] dark:bg-blue-900/30 min-h-[380px] py-8 px-4">
              {payload.trim() ? (
                <div className={`shadow-2xl rounded-[10px] overflow-hidden transition-opacity ${isRendering ? "opacity-60" : "opacity-100"}`}>
                  <div ref={previewRef} />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 flex items-center justify-center">
                    <BsQrCode className="text-3xl text-[#2563EB]" />
                  </div>
                  <p className="text-sm text-[#4B5563] dark:text-gray-400">
                    Fill in the details on the right to generate your QR code.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3 py-4">
            <Tabs value={panelTab} onValueChange={(v) => setPanelTab(v as "content" | "design")}>
              <TabsList className="w-full">
                <TabsTrigger value="content" className="flex-1 gap-1.5">
                  <BsQrCode className="w-3.5 h-3.5" /> Content
                </TabsTrigger>
                <TabsTrigger value="design" className="flex-1 gap-1.5">
                  <BsSliders className="w-3.5 h-3.5" /> Design
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="mt-3 flex flex-col gap-3">
                <div className="bg-[#F3F4F6] dark:bg-gray-800 rounded-[20px] p-4 backdrop-blur-sm">
                  <QrTypeSelector activeId={activeTypeId} onSelect={setActiveTypeId} />
                </div>
                <div className="bg-[#F3F4F6] dark:bg-gray-800 rounded-[20px] p-4 backdrop-blur-sm">
                  <p className="text-xs font-semibold text-[#4B5563]/60 dark:text-gray-400/60 uppercase tracking-wider mb-3">
                    {typeDef.label} Details
                  </p>
                  <QrDataForm typeDef={typeDef} values={fieldValues} onChange={updateField} />
                  <p className="text-xs text-[#4B5563]/60 dark:text-gray-400/50 mt-3">{typeDef.describe(fieldValues)}</p>
                </div>
              </TabsContent>

              <TabsContent value="design" className="mt-3">
                <QrCustomization style={style} update={updateStyle} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </main>
  );
};

export default QrCodeLayout;
