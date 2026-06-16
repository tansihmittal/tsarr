import type { Shape } from "./types";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  BsTrash,
  BsFiles,
  BsArrowUp,
  BsArrowDown,
  BsLink45Deg,
  BsImage,
} from "react-icons/bs";

interface Props {
  shape: Shape | null;
  onUpdate: (id: string, patch: Partial<Shape>, recordHistory?: boolean) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onReorder: (id: string, dir: "front" | "back") => void;
  onReplaceImage: (id: string) => void;
}

const labelCls =
  "text-[11px] font-semibold text-[#4B5563]/60 uppercase tracking-wider";
const fieldCls =
  "w-full rounded-[10px] border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-xs text-[#0A0A0A] placeholder:text-[#4B5563]/40 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#60A5FA]";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-3 space-y-2.5">
      <p className={labelCls}>{title}</p>
      {children}
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#2563EB";
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-[#4B5563]/80">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="text"
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

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#4B5563]/80">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function RangeRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix,
}: {
  label: string;
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
        <span className="text-xs text-[#4B5563]/80">{label}</span>
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

const ImapProperties: React.FC<Props> = ({
  shape,
  onUpdate,
  onDelete,
  onDuplicate,
  onReorder,
  onReplaceImage,
}) => {
  if (!shape) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 px-4">
        <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center mb-3">
          <BsLink45Deg className="w-5 h-5 text-[#2563EB]/50" />
        </div>
        <p className="text-sm text-[#4B5563]/70 font-medium">No selection</p>
        <p className="text-xs text-[#4B5563]/45 mt-1">
          Pick a tool and draw on the image, or click a shape to edit it.
        </p>
      </div>
    );
  }

  const s = shape;
  const set = (patch: Partial<Shape>) => onUpdate(s.id, patch, true);

  return (
    <div className="space-y-3">
      {/* header / actions */}
      <div className="flex items-center gap-1.5">
        <input
          value={s.name}
          onChange={(e) => onUpdate(s.id, { name: e.target.value }, false)}
          onBlur={(e) => onUpdate(s.id, { name: e.target.value }, true)}
          className="flex-1 rounded-[10px] border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-sm font-medium text-[#0A0A0A] focus:outline-none focus:border-[#60A5FA]"
        />
        <button
          title="Bring forward"
          onClick={() => onReorder(s.id, "front")}
          className="w-8 h-8 rounded-[10px] border border-[#E5E7EB] flex items-center justify-center text-[#4B5563] hover:bg-[#F9FAFB]"
        >
          <BsArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          title="Send backward"
          onClick={() => onReorder(s.id, "back")}
          className="w-8 h-8 rounded-[10px] border border-[#E5E7EB] flex items-center justify-center text-[#4B5563] hover:bg-[#F9FAFB]"
        >
          <BsArrowDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* text-specific */}
      {s.type === "text" && (
        <Section title="Text">
          <textarea
            value={s.text || ""}
            onChange={(e) => onUpdate(s.id, { text: e.target.value }, false)}
            onBlur={() => onUpdate(s.id, {}, true)}
            rows={2}
            className={`${fieldCls} resize-none`}
          />
          <RangeRow
            label="Font size"
            value={s.fontSize || 28}
            min={8}
            max={160}
            step={1}
            onChange={(v) => set({ fontSize: v })}
            suffix="px"
          />
          <div className="flex gap-1.5">
            {(["start", "middle", "end"] as const).map((a) => (
              <button
                key={a}
                onClick={() => set({ textAlign: a })}
                className={`flex-1 py-1.5 rounded-[8px] text-[11px] capitalize border ${
                  (s.textAlign || "start") === a
                    ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                    : "bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#60A5FA]"
                }`}
              >
                {a === "start" ? "Left" : a === "middle" ? "Center" : "Right"}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* image-specific */}
      {s.type === "image" && (
        <Section title="Image">
          <button
            onClick={() => onReplaceImage(s.id)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-[10px] border border-[#E5E7EB] bg-white text-xs font-medium text-[#4B5563] hover:border-[#60A5FA]"
          >
            <BsImage className="w-3.5 h-3.5" />
            Replace image
          </button>
        </Section>
      )}

      {/* pin-specific */}
      {s.type === "pin" && (
        <Section title="Marker">
          <div>
            <label className="text-xs text-[#4B5563]/80 block mb-1">
              Label (number, letter or emoji)
            </label>
            <input
              value={s.pinLabel || ""}
              onChange={(e) => onUpdate(s.id, { pinLabel: e.target.value }, false)}
              onBlur={() => onUpdate(s.id, {}, true)}
              maxLength={3}
              placeholder="e.g. 1"
              className={fieldCls}
            />
          </div>
          <ColorRow label="Pin color" value={s.pinColor || "#2563EB"} onChange={(v) => set({ pinColor: v })} />
          <ColorRow label="Label color" value={s.pinTextColor || "#ffffff"} onChange={(v) => set({ pinTextColor: v })} />
        </Section>
      )}

      {/* interactivity */}
      <Section title="Interactivity">
        <div>
          <label className="text-xs text-[#4B5563]/80 block mb-1.5">
            On click / hover
          </label>
          <div className="flex gap-1.5">
            {(["link", "tooltip", "none"] as const).map((a) => (
              <button
                key={a}
                onClick={() => set({ action: a })}
                className={`flex-1 py-1.5 rounded-[8px] text-[11px] capitalize border ${
                  (s.action || "link") === a
                    ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                    : "bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#60A5FA]"
                }`}
              >
                {a === "link" ? "Open link" : a === "tooltip" ? "Tooltip" : "None"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-[#4B5563]/80 block mb-1">
            Tooltip title
          </label>
          <input
            value={s.title || ""}
            onChange={(e) => onUpdate(s.id, { title: e.target.value }, false)}
            onBlur={() => onUpdate(s.id, {}, true)}
            placeholder="Shown on hover"
            className={fieldCls}
          />
        </div>
        <div>
          <label className="text-xs text-[#4B5563]/80 block mb-1">
            Description
          </label>
          <textarea
            value={s.description || ""}
            onChange={(e) =>
              onUpdate(s.id, { description: e.target.value }, false)
            }
            onBlur={() => onUpdate(s.id, {}, true)}
            rows={2}
            placeholder="Tooltip body / caption"
            className={`${fieldCls} resize-none`}
          />
        </div>
        {(s.title || s.description) && (s.action ?? "link") !== "none" && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[#4B5563]/80 block mb-1">
                Tooltip at
              </label>
              <select
                value={s.tooltipPosition || "auto"}
                onChange={(e) => set({ tooltipPosition: e.target.value as any })}
                className="w-full rounded-[8px] border border-[#E5E7EB] bg-white px-2 py-1.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#60A5FA] capitalize"
              >
                {["auto", "top", "right", "bottom", "left"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#4B5563]/80 block mb-1">
                Opens on
              </label>
              <select
                value={s.tooltipTrigger || "hover"}
                onChange={(e) => set({ tooltipTrigger: e.target.value as any })}
                className="w-full rounded-[8px] border border-[#E5E7EB] bg-white px-2 py-1.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#60A5FA]"
              >
                <option value="hover">Hover</option>
                <option value="click">Click (sticky)</option>
              </select>
            </div>
          </div>
        )}
        {(s.action ?? "link") === "link" && (
          <>
            <div>
              <label className="text-xs text-[#4B5563]/80 block mb-1">Link URL</label>
              <input
                value={s.link || ""}
                onChange={(e) => onUpdate(s.id, { link: e.target.value }, false)}
                onBlur={() => onUpdate(s.id, {}, true)}
                placeholder="https://…"
                className={fieldCls}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#4B5563]/80">Open link in</span>
              <select
                value={s.linkTarget || "_blank"}
                onChange={(e) => set({ linkTarget: e.target.value as any })}
                className="rounded-[8px] border border-[#E5E7EB] bg-white px-2 py-1 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#60A5FA]"
              >
                <option value="_blank">New tab</option>
                <option value="_self">Same tab</option>
              </select>
            </div>
          </>
        )}
      </Section>

      {/* style */}
      <Section title="Style">
        {s.type !== "image" && (
          <ColorRow
            label={s.type === "text" ? "Text color" : "Fill"}
            value={s.fill}
            onChange={(v) => set({ fill: v })}
          />
        )}
        {s.type !== "image" && s.type !== "text" && (
          <RangeRow
            label="Fill opacity"
            value={Math.round(s.fillOpacity * 100)}
            min={0}
            max={100}
            step={1}
            onChange={(v) => set({ fillOpacity: v / 100 })}
            suffix="%"
          />
        )}
        {s.type !== "text" && s.type !== "image" && s.type !== "pin" && (
          <>
            <ColorRow
              label="Stroke"
              value={s.stroke}
              onChange={(v) => set({ stroke: v })}
            />
            <RangeRow
              label="Stroke width"
              value={s.strokeWidth}
              min={0}
              max={20}
              step={1}
              onChange={(v) => set({ strokeWidth: v })}
            />
            <RangeRow
              label="Stroke opacity"
              value={Math.round((s.strokeOpacity ?? 1) * 100)}
              min={0}
              max={100}
              step={1}
              onChange={(v) => set({ strokeOpacity: v / 100 })}
              suffix="%"
            />
            <ToggleRow
              label="Dashed border"
              checked={!!s.strokeDasharray}
              onChange={(v) => set({ strokeDasharray: v ? "8 5" : "" })}
            />
          </>
        )}
        {s.type === "rect" && (
          <RangeRow
            label="Corner radius"
            value={s.cornerRadius || 0}
            min={0}
            max={120}
            step={1}
            onChange={(v) => set({ cornerRadius: v })}
          />
        )}
        <RangeRow
          label="Opacity"
          value={Math.round(s.opacity * 100)}
          min={0}
          max={100}
          step={1}
          onChange={(v) => set({ opacity: v / 100 })}
          suffix="%"
        />
        <ToggleRow
          label="Drop shadow"
          checked={!!s.shadow}
          onChange={(v) => set({ shadow: v })}
        />
      </Section>

      {/* attention animation (hotspots + pins) */}
      {s.type !== "text" && s.type !== "image" && (
        <Section title="Animation">
          <div className="flex gap-1.5">
            {(["none", "pulse", "glow"] as const).map((a) => (
              <button
                key={a}
                onClick={() => set({ animation: a })}
                className={`flex-1 py-1.5 rounded-[8px] text-[11px] capitalize border ${
                  (s.animation || "none") === a
                    ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                    : "bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#60A5FA]"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#4B5563]/45">
            Plays in Preview and exports — draws attention to the spot.
          </p>
        </Section>
      )}

      {/* hover (for hotspots) */}
      {s.type !== "text" && s.type !== "image" && (
        <Section title="Hover effect">
          {s.type !== "pin" && (
            <>
              <ColorRow
                label="Hover fill"
                value={s.hoverFill || "#2563EB"}
                onChange={(v) => set({ hoverFill: v })}
              />
              <RangeRow
                label="Hover fill opacity"
                value={Math.round((s.hoverFillOpacity ?? 0.4) * 100)}
                min={0}
                max={100}
                step={1}
                onChange={(v) => set({ hoverFillOpacity: v / 100 })}
                suffix="%"
              />
              <ColorRow
                label="Hover stroke"
                value={s.hoverStroke || s.stroke}
                onChange={(v) => set({ hoverStroke: v })}
              />
            </>
          )}
          <RangeRow
            label="Hover scale"
            value={Math.round((s.hoverScale ?? 1) * 100)}
            min={80}
            max={140}
            step={1}
            onChange={(v) => set({ hoverScale: v / 100 })}
            suffix="%"
          />
        </Section>
      )}

      {/* delete / duplicate */}
      <div className="flex gap-2">
        <button
          onClick={() => onDuplicate(s.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] border border-[#E5E7EB] bg-white text-xs font-medium text-[#4B5563] hover:border-[#60A5FA]"
        >
          <BsFiles className="w-3.5 h-3.5" />
          Duplicate
        </button>
        <button
          onClick={() => onDelete(s.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] border border-red-200 bg-white text-xs font-medium text-red-500 hover:bg-red-50"
        >
          <BsTrash className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
};

export default ImapProperties;
