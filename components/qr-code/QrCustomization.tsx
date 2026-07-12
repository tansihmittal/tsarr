import { useRef } from "react";
import { toast } from "react-hot-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BsUpload, BsX, BsImage } from "react-icons/bs";
import {
  QrStyleState,
  DOT_TYPES,
  CORNER_SQUARE_TYPES,
  CORNER_DOT_TYPES,
  FRAME_STYLES,
  FONT_OPTIONS,
} from "./qrStyle";

interface Props {
  style: QrStyleState;
  update: (patch: Partial<QrStyleState>) => void;
}

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-semibold text-[#4B5563]/60 dark:text-gray-400/60 uppercase tracking-wider mb-3">
    {children}
  </p>
);

const ColorField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <label className="flex items-center justify-between">
    <span className="text-sm text-[#4B5563] dark:text-gray-400">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono text-[#4B5563]/60 dark:text-gray-400/60">
        {value.toUpperCase()}
      </span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-7 rounded cursor-pointer border border-[#E5E7EB] dark:border-gray-700"
      />
    </div>
  </label>
);

// Small CSS-drawn preview swatch so shape pickers don't need icon assets.
const ShapePreview: React.FC<{ kind: string }> = ({ kind }) => {
  const base = "w-5 h-5 bg-current";
  const styleMap: Record<string, React.CSSProperties> = {
    square: {},
    dots: { borderRadius: "50%" },
    dot: { borderRadius: "50%" },
    rounded: { borderRadius: "30%" },
    "extra-rounded": { borderRadius: "45%" },
    classy: { clipPath: "polygon(30% 0,100% 0,100% 70%,70% 100%,0 100%,0 30%)" },
    "classy-rounded": { clipPath: "polygon(30% 0,100% 0,100% 70%,70% 100%,0 100%,0 30%)", borderRadius: "18%" },
  };
  return <span className={base} style={styleMap[kind] || {}} />;
};

const ShapePicker = <T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) => (
  <div className="grid grid-cols-4 gap-1.5">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        title={opt.label}
        onClick={() => onChange(opt.value)}
        className={`flex items-center justify-center h-11 rounded-[10px] border transition-all ${
          value === opt.value
            ? "border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB] ring-1 ring-[#2563EB]"
            : "border-[#E5E7EB] dark:border-gray-700 text-[#374151] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        }`}
      >
        <ShapePreview kind={opt.value} />
      </button>
    ))}
  </div>
);

const QrCustomization: React.FC<Props> = ({ style, update }) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const artInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined, onLoaded: (dataUrl: string) => void) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is too large (max 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onLoaded(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Colors */}
      <div className="bg-[#F3F4F6] dark:bg-gray-800 rounded-[20px] p-4 backdrop-blur-sm">
        <SectionHeading>Colors</SectionHeading>
        <Tabs
          value={style.colorMode}
          onValueChange={(v) => update({ colorMode: v as QrStyleState["colorMode"] })}
          className="mb-3"
        >
          <TabsList className="w-full">
            <TabsTrigger value="single" className="flex-1">
              Single Color
            </TabsTrigger>
            <TabsTrigger value="gradient" className="flex-1">
              Gradient Color
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-2">
          <ColorField label="Background" value={style.bgColor} onChange={(v) => update({ bgColor: v })} />
          {style.colorMode === "single" ? (
            <ColorField label="Foreground" value={style.fgColor} onChange={(v) => update({ fgColor: v })} />
          ) : (
            <>
              <ColorField label="Gradient From" value={style.gradientFrom} onChange={(v) => update({ gradientFrom: v })} />
              <ColorField label="Gradient To" value={style.gradientTo} onChange={(v) => update({ gradientTo: v })} />
              <label className="flex items-center justify-between">
                <span className="text-sm text-[#4B5563] dark:text-gray-400">Gradient Type</span>
                <Select value={style.gradientType} onValueChange={(v) => update({ gradientType: v as "linear" | "radial" })}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="radial">Radial</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </>
          )}
          <div className="h-px bg-[#E5E7EB] dark:bg-gray-700 my-1" />
          <ColorField label="Eye Frame Color" value={style.eyeFrameColor} onChange={(v) => update({ eyeFrameColor: v })} />
          <ColorField label="Eye Color" value={style.eyeColor} onChange={(v) => update({ eyeColor: v })} />
        </div>
      </div>

      {/* Logo / Design */}
      <div className="bg-[#F3F4F6] dark:bg-gray-800 rounded-[20px] p-4 backdrop-blur-sm">
        <SectionHeading>Design</SectionHeading>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0], (url) => update({ logoDataUrl: url }))}
        />
        {style.logoDataUrl ? (
          <div className="flex items-center gap-3 mb-3">
            <img src={style.logoDataUrl} alt="Logo" className="w-12 h-12 rounded-lg object-contain border border-[#E5E7EB] dark:border-gray-700 bg-white" />
            <div className="flex-1">
              <Button size="sm" variant="secondary" onClick={() => logoInputRef.current?.click()} className="gap-1.5 text-xs">
                <BsUpload className="w-3 h-3" /> Change
              </Button>
            </div>
            <button
              onClick={() => update({ logoDataUrl: null })}
              className="p-1.5 text-[#4B5563]/60 hover:text-red-500 rounded-lg transition-colors"
            >
              <BsX className="text-lg" />
            </button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => logoInputRef.current?.click()}
            className="w-full gap-2 mb-3 justify-center"
          >
            <BsImage className="w-3.5 h-3.5" /> Choose Logo
          </Button>
        )}

        {style.logoDataUrl && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#4B5563] dark:text-gray-400">Size</span>
              <span className="text-xs font-mono text-[#4B5563]/60 dark:text-gray-400/60">
                {Math.round(style.logoSizeRatio * 100)}%
              </span>
            </div>
            <Slider
              min={0.1}
              max={0.4}
              step={0.02}
              value={[style.logoSizeRatio]}
              onValueChange={([v]) => update({ logoSizeRatio: v })}
              className="mb-3"
            />
            <label className="flex items-start justify-between gap-3">
              <span>
                <span className="text-sm text-[#4B5563] dark:text-gray-400 block">Embedded Logo</span>
                <span className="text-xs text-[#4B5563]/60 dark:text-gray-400/50 block mt-0.5">
                  Logo sits on top of the pattern instead of clearing space behind it — can sometimes make the code harder to scan, so test it.
                </span>
              </span>
              <Switch checked={style.logoEmbedded} onCheckedChange={(c) => update({ logoEmbedded: c })} />
            </label>
          </>
        )}
      </div>

      {/* Matrix Style */}
      <div className="bg-[#F3F4F6] dark:bg-gray-800 rounded-[20px] p-4 backdrop-blur-sm">
        <SectionHeading>Matrix Style</SectionHeading>
        <ShapePicker options={DOT_TYPES} value={style.dotsType} onChange={(v) => update({ dotsType: v })} />
      </div>

      {/* Eye Frame */}
      <div className="bg-[#F3F4F6] dark:bg-gray-800 rounded-[20px] p-4 backdrop-blur-sm">
        <SectionHeading>Eye Frame</SectionHeading>
        <ShapePicker options={CORNER_SQUARE_TYPES} value={style.cornersSquareType} onChange={(v) => update({ cornersSquareType: v })} />
      </div>

      {/* Eye Style */}
      <div className="bg-[#F3F4F6] dark:bg-gray-800 rounded-[20px] p-4 backdrop-blur-sm">
        <SectionHeading>Eye Style</SectionHeading>
        <ShapePicker options={CORNER_DOT_TYPES} value={style.cornersDotType} onChange={(v) => update({ cornersDotType: v })} />
      </div>

      {/* Frame Style */}
      <div className="bg-[#F3F4F6] dark:bg-gray-800 rounded-[20px] p-4 backdrop-blur-sm">
        <SectionHeading>Frame Style</SectionHeading>
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {FRAME_STYLES.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => update({ frameStyle: f.value })}
              className={`h-9 rounded-[10px] border text-[11px] font-medium transition-all ${
                style.frameStyle === f.value
                  ? "border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB] ring-1 ring-[#2563EB]"
                  : "border-[#E5E7EB] dark:border-gray-700 text-[#374151] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {style.frameStyle !== "none" && (
          <div className="flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-[#4B5563] dark:text-gray-400 block mb-1">Text</span>
                <Input
                  value={style.frameText}
                  maxLength={20}
                  onChange={(e) => update({ frameText: e.target.value })}
                  placeholder="e.g. Scan me"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <span className="text-xs text-[#4B5563] dark:text-gray-400 block mb-1">Font</span>
                <Select value={style.frameFont} onValueChange={(v) => update({ frameFont: v })}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-[10px] text-[#4B5563]/60 dark:text-gray-400/50">Limit of 20 characters</p>
            <ColorField label="Frame Color" value={style.frameColor} onChange={(v) => update({ frameColor: v })} />
            <ColorField label="Text Color" value={style.frameTextColor} onChange={(v) => update({ frameTextColor: v })} />
          </div>
        )}
      </div>

      {/* Artistic image blend */}
      <div className="bg-[#F3F4F6] dark:bg-gray-800 rounded-[20px] p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-1">
          <SectionHeading>Artistic Image Blend</SectionHeading>
        </div>
        <p className="text-xs text-[#4B5563]/60 dark:text-gray-400/50 mb-3">
          Blend a photo behind the pattern for a stylized look. This composites your real QR
          modules over the image (multiply blend) — it&apos;s not generative AI art, so always
          test-scan the result before printing.
        </p>
        <input
          ref={artInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0], (url) => update({ artBlendImage: url }))}
        />
        {style.artBlendImage ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img
                src={style.artBlendImage}
                alt="Blend background"
                className="w-12 h-12 rounded-lg object-cover border border-[#E5E7EB] dark:border-gray-700"
              />
              <Button size="sm" variant="secondary" onClick={() => artInputRef.current?.click()} className="gap-1.5 text-xs">
                <BsUpload className="w-3 h-3" /> Change
              </Button>
              <button
                onClick={() => update({ artBlendImage: null })}
                className="p-1.5 text-[#4B5563]/60 hover:text-red-500 rounded-lg transition-colors ml-auto"
              >
                <BsX className="text-lg" />
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#4B5563] dark:text-gray-400">Image Visibility</span>
                <span className="text-xs font-mono text-[#4B5563]/60 dark:text-gray-400/60">
                  {Math.round(style.artBlendOpacity * 100)}%
                </span>
              </div>
              <Slider
                min={0.1}
                max={0.7}
                step={0.05}
                value={[style.artBlendOpacity]}
                onValueChange={([v]) => update({ artBlendOpacity: v })}
              />
            </div>
          </div>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => artInputRef.current?.click()} className="w-full gap-2 justify-center">
            <BsImage className="w-3.5 h-3.5" /> Choose Background Image
          </Button>
        )}
      </div>

      {/* Margin */}
      <div className="bg-[#F3F4F6] dark:bg-gray-800 rounded-[20px] p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <SectionHeading>Margin</SectionHeading>
          <span className="text-xs font-mono text-[#4B5563] dark:text-gray-400">{style.margin}px</span>
        </div>
        <Slider min={0} max={40} step={1} value={[style.margin]} onValueChange={([v]) => update({ margin: v })} />
      </div>

      {/* Error correction */}
      <div className="bg-[#F3F4F6] dark:bg-gray-800 rounded-[20px] p-4 backdrop-blur-sm">
        <SectionHeading>Error Correction</SectionHeading>
        <div className="grid grid-cols-4 gap-1.5">
          {(["L", "M", "Q", "H"] as const).map((lvl) => (
            <Button
              key={lvl}
              size="sm"
              className="h-7 text-xs px-2"
              variant={style.errorCorrectionLevel === lvl ? "default" : "secondary"}
              onClick={() => update({ errorCorrectionLevel: lvl })}
            >
              {lvl}
            </Button>
          ))}
        </div>
        <p className="text-xs text-[#4B5563]/60 dark:text-gray-400/60 mt-2">
          Higher levels stay scannable when the code is damaged, dirty, or partly covered by a
          logo — but they pack in more data density. Use Q or H when adding a logo or image blend.
        </p>
      </div>
    </div>
  );
};

export default QrCustomization;
