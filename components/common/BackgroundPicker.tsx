import { useState, useRef } from "react";
import { gradients, solidGradients } from "@/data/gradients";
import { directionArray } from "@/data/misc";
import {
  BsArrowUp,
  BsArrowDown,
  BsArrowLeft,
  BsArrowRight,
  BsArrowDownRight,
  BsArrowUpRight,
  BsArrowsFullscreen,
} from "react-icons/bs";
import { Button } from "@/components/ui/button";

export interface BackgroundConfig {
  type: "gradient" | "solid" | "custom";
  background: string;
  color1: string;
  color2: string;
  color3?: string;
  direction: string;
}

export const tiltOptions = [
  { id: "top", name: "to top", value: "rotateX(20deg)", icon: <BsArrowUp /> },
  { id: "bottom", name: "to bottom", value: "rotateX(-20deg)", icon: <BsArrowDown /> },
  { id: "center", name: "to center", value: "rotate(0)", icon: <BsArrowsFullscreen /> },
  { id: "left", name: "to left", value: "rotateY(-20deg)", icon: <BsArrowLeft /> },
  { id: "right", name: "to right", value: "rotateY(20deg)", icon: <BsArrowRight /> },
];

interface Props {
  background: BackgroundConfig;
  onBackgroundChange: (bg: BackgroundConfig) => void;
  tilt?: { name: string; value: string };
  onTiltChange?: (tilt: { name: string; value: string }) => void;
  showTilt?: boolean;
}

const BackgroundPicker: React.FC<Props> = ({
  background,
  onBackgroundChange,
  tilt,
  onTiltChange,
  showTilt = true,
}) => {
  const [activeTab, setActiveTab] = useState<"gradient" | "solid" | "custom">(background.type);
  const [customGradient, setCustomGradient] = useState({
    color1: background.color1 || "#667eea",
    color2: background.color2 || "#764ba2",
    color3: background.color3 || "",
    direction: background.direction || "to bottom right",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGradientSelect = (grad: typeof gradients[0]) => {
    onBackgroundChange({
      type: "gradient",
      background: grad.background,
      color1: grad.color1,
      color2: grad.color2,
      color3: grad.color3,
      direction: grad.direction,
    });
  };

  const handleSolidSelect = (solid: typeof solidGradients[0]) => {
    onBackgroundChange({
      type: "solid",
      background: solid.background,
      color1: solid.color1,
      color2: solid.color2,
      direction: solid.direction,
    });
  };

  const updateCustomGradient = (key: string, value: string) => {
    const updated = { ...customGradient, [key]: value };
    const bg = `linear-gradient(${updated.direction}, ${updated.color1}, ${updated.color2}${updated.color3 ? `, ${updated.color3}` : ""})`;
    setCustomGradient(updated);
    onBackgroundChange({
      type: "custom",
      background: bg,
      color1: updated.color1,
      color2: updated.color2,
      color3: updated.color3,
      direction: updated.direction,
    });
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      onBackgroundChange({
        type: "custom",
        background: `url(${fileUrl}) center/cover`,
        color1: "#000",
        color2: "#000",
        direction: "custom",
      });
    }
  };

  const dirIcons: Record<string, JSX.Element> = {
    "to top": <BsArrowUp />,
    "to bottom": <BsArrowDown />,
    "to left": <BsArrowLeft />,
    "to right": <BsArrowRight />,
    "to bottom right": <BsArrowDownRight />,
    "to top right": <BsArrowUpRight />,
  };

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="grid grid-cols-3 bg-[#F9FAFB] rounded-md p-0.5">
        {(["gradient", "solid", "custom"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-3 text-xs font-medium rounded-md capitalize transition-all ${
              activeTab === tab ? "bg-white shadow-sm" : "hover:bg-white/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Gradient presets */}
      {activeTab === "gradient" && (
        <div className="grid grid-cols-6 gap-1">
          {gradients.slice(0, 24).map((grad) => (
            <button
              key={grad.id}
              onClick={() => handleGradientSelect(grad)}
              className={`h-10 rounded-md border-2 transition-all hover:scale-105 ${
                background.background === grad.background ? "border-[#2563EB]" : "border-transparent"
              }`}
              style={{ background: grad.background }}
            />
          ))}
        </div>
      )}

      {/* Solid colors */}
      {activeTab === "solid" && (
        <div className="grid grid-cols-6 gap-1">
          {solidGradients.map((solid) => (
            <button
              key={solid.id}
              onClick={() => handleSolidSelect(solid)}
              className={`h-10 rounded-md border-2 transition-all hover:scale-105 ${
                background.background === solid.background ? "border-[#2563EB]" : "border-transparent"
              }`}
              style={{ background: solid.color1 }}
            />
          ))}
        </div>
      )}

      {/* Custom gradient */}
      {activeTab === "custom" && (
        <div className="space-y-3">
          {/* Preview */}
          <div
            className="w-full h-14 rounded-[10px] border-2 border-[#E5E7EB]"
            style={{ background: background.background }}
          />

          {/* Color pickers */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">C1</span>
              <input
                type="color"
                value={customGradient.color1}
                onChange={(e) => updateCustomGradient("color1", e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">C2</span>
              <input
                type="color"
                value={customGradient.color2}
                onChange={(e) => updateCustomGradient("color2", e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">C3</span>
              <input
                type="color"
                value={customGradient.color3 || "#ffffff"}
                onChange={(e) => updateCustomGradient("color3", e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
              />
            </div>
          </div>

          {/* Direction */}
          <div className="flex gap-1 flex-wrap">
            {directionArray.map((dir) => (
              <button
                key={dir.id}
                onClick={() => updateCustomGradient("direction", dir.name)}
                className={`h-8 w-8 flex items-center justify-center rounded-md border transition-all ${
                  customGradient.direction === dir.name
                    ? "bg-[#2563EB] text-white border-[#2563EB]"
                    : "border-[#E5E7EB] hover:bg-[#F9FAFB]"
                }`}
              >
                {dirIcons[dir.name]}
              </button>
            ))}
          </div>

          {/* Custom image upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCustomImageUpload}
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Custom Image
            </Button>
          </div>
        </div>
      )}

      {/* Tilt options */}
      {showTilt && onTiltChange && (
        <div className="pt-2 border-t border-[#E5E7EB]">
          <span className="text-xs text-gray-500 font-medium block mb-2">Tilt Effect</span>
          <div className="flex gap-1">
            {tiltOptions.map((t) => (
              <button
                key={t.id}
                onClick={() => onTiltChange({ name: t.name, value: t.value })}
                className={`h-8 w-8 flex items-center justify-center rounded-md border transition-all ${
                  tilt?.name === t.name
                    ? "bg-[#2563EB] text-white border-[#2563EB]"
                    : "border-[#E5E7EB] hover:bg-[#F9FAFB]"
                }`}
              >
                {t.icon}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundPicker;
