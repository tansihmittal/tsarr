import type { MapOptions } from "./types";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface Props {
  options: MapOptions;
  onChange: (patch: Partial<MapOptions>) => void;
}

const label = "text-[11px] font-semibold text-[#4B5563]/60 uppercase tracking-wider";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-3 space-y-2.5">
      <p className={label}>{title}</p>
      {children}
    </div>
  );
}

function Toggle({
  text,
  checked,
  onChange,
}: {
  text: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#4B5563]/80">{text}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ColorRow({
  text,
  value,
  onChange,
}: {
  text: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-[#4B5563]/80">{text}</span>
      <div className="flex items-center gap-1.5">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-[78px] rounded-[8px] border border-[#E5E7EB] bg-white px-2 py-1 text-[11px] font-mono text-[#0A0A0A] focus:outline-none focus:border-[#60A5FA]"
        />
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded-[8px] border border-[#E5E7EB] bg-white p-0.5 cursor-pointer"
        />
      </div>
    </div>
  );
}

function RangeRow({
  text,
  value,
  min,
  max,
  step,
  onChange,
  suffix,
}: {
  text: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#4B5563]/80">{text}</span>
        <span className="text-[11px] font-mono text-[#4B5563]/60">
          {value}
          {suffix || ""}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  );
}

const ImapMapOptions: React.FC<Props> = ({ options: o, onChange }) => {
  return (
    <div className="space-y-3">
      <Section title="Behaviour">
        <Toggle
          text="Highlight spot on hover"
          checked={o.highlightOnHover}
          onChange={(v) => onChange({ highlightOnHover: v })}
        />
        <Toggle
          text="Animate spots on load"
          checked={o.pageloadAnimation}
          onChange={(v) => onChange({ pageloadAnimation: v })}
        />
        <Toggle
          text="Crisp spots when responsive"
          checked={o.scaleSpots}
          onChange={(v) => onChange({ scaleSpots: v })}
        />
      </Section>

      <Section title="Zoom & pan">
        <Toggle
          text="Enable zoom & pan"
          checked={o.zoom}
          onChange={(v) => onChange({ zoom: v })}
        />
        {o.zoom && (
          <>
            <Toggle
              text="Show zoom buttons"
              checked={o.zoomButtons}
              onChange={(v) => onChange({ zoomButtons: v })}
            />
            <RangeRow
              text="Max zoom"
              value={o.maxZoom}
              min={2}
              max={10}
              step={1}
              onChange={(v) => onChange({ maxZoom: v })}
              suffix="×"
            />
            <p className="text-[11px] text-[#4B5563]/45 leading-relaxed">
              Works in Preview and the exported embed (scroll to zoom, drag to
              pan).
            </p>
          </>
        )}
      </Section>

      <Section title="Glow">
        <Toggle
          text="Glow all spots"
          checked={o.glowAll}
          onChange={(v) => onChange({ glowAll: v })}
        />
        {o.glowAll && (
          <>
            <ColorRow
              text="Glow color"
              value={o.glowColor}
              onChange={(v) => onChange({ glowColor: v })}
            />
            <Toggle
              text="Stop glow on hover"
              checked={o.stopGlowOnHover}
              onChange={(v) => onChange({ stopGlowOnHover: v })}
            />
          </>
        )}
      </Section>

      <Section title="Canvas">
        <ColorRow
          text="Background"
          value={o.backgroundColor}
          onChange={(v) => onChange({ backgroundColor: v })}
        />
        <p className="text-[11px] text-[#4B5563]/45 leading-relaxed">
          Shows through transparent images and around letterboxed areas.
        </p>
      </Section>

      <Section title="Tooltip style">
        <ColorRow
          text="Background"
          value={o.tooltipBg}
          onChange={(v) => onChange({ tooltipBg: v })}
        />
        <ColorRow
          text="Text"
          value={o.tooltipColor}
          onChange={(v) => onChange({ tooltipColor: v })}
        />
        <RangeRow
          text="Corner radius"
          value={o.tooltipRadius}
          min={0}
          max={24}
          step={1}
          onChange={(v) => onChange({ tooltipRadius: v })}
        />
        <RangeRow
          text="Max width"
          value={o.tooltipMaxWidth}
          min={120}
          max={420}
          step={10}
          onChange={(v) => onChange({ tooltipMaxWidth: v })}
          suffix="px"
        />
      </Section>

      <Section title="Custom CSS">
        <textarea
          value={o.customCss}
          onChange={(e) => onChange({ customCss: e.target.value })}
          rows={4}
          spellCheck={false}
          placeholder={`.imap-spot { /* … */ }`}
          className="w-full rounded-[10px] border border-[#E5E7EB] bg-white px-2.5 py-2 text-[11px] font-mono text-[#0A0A0A] placeholder:text-[#4B5563]/40 focus:outline-none focus:border-[#60A5FA] resize-none"
        />
        <p className="text-[11px] text-[#4B5563]/45 leading-relaxed">
          Injected into preview &amp; exports. Style <code>.imap-spot</code>,{" "}
          <code>.imap-tt</code>, etc.
        </p>
      </Section>

      <Section title="Custom JS">
        <textarea
          value={o.customJs}
          onChange={(e) => onChange({ customJs: e.target.value })}
          rows={4}
          spellCheck={false}
          placeholder={`// runs in the embed`}
          className="w-full rounded-[10px] border border-[#E5E7EB] bg-white px-2.5 py-2 text-[11px] font-mono text-[#0A0A0A] placeholder:text-[#4B5563]/40 focus:outline-none focus:border-[#60A5FA] resize-none"
        />
        <p className="text-[11px] text-[#4B5563]/45 leading-relaxed">
          Runs in the exported embed only (not the editor). Wrapped in a
          try/catch.
        </p>
      </Section>
    </div>
  );
};

export default ImapMapOptions;
