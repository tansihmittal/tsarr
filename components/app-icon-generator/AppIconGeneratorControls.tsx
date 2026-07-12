import { AppIconGeneratorState } from "./types";
import { BsApple, BsAndroid2, BsGlobe, BsWindowStack, BsLightning } from "react-icons/bs";
import ControlPanelHeading from "../common/ControlPanelHeading";
import ControlPanelRow from "../common/ControlPanelRow";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

interface Props {
  state: AppIconGeneratorState;
  updateState: (updates: Partial<AppIconGeneratorState>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const PLATFORM_ROWS: {
  key: keyof AppIconGeneratorState["platforms"];
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  { key: "ios", label: "iOS", desc: "Xcode AppIcon.appiconset + Contents.json", icon: <BsApple className="text-lg" /> },
  { key: "android", label: "Android", desc: "Launcher mipmaps + Play Store icon", icon: <BsAndroid2 className="text-lg" /> },
  { key: "web", label: "Web & Favicon", desc: "favicon.ico, apple-touch-icon, manifest", icon: <BsGlobe className="text-lg" /> },
  { key: "macos", label: "macOS", desc: "AppIcon.iconset (run iconutil to get .icns)", icon: <BsWindowStack className="text-lg" /> },
];

const AppIconGeneratorControls: React.FC<Props> = ({ state, updateState, onGenerate, isGenerating }) => {
  const PanelHeading = ControlPanelHeading;
  const Control = ControlPanelRow;

  const anyPlatformSelected = Object.values(state.platforms).some(Boolean);

  return (
    <section
      className={`flex flex-col transition-opacity duration-300 ${state.image ? "opacity-100" : "opacity-90"}`}
      style={{ pointerEvents: state.image ? "auto" : "none" }}
    >
      {state.image && (
        <button
          onClick={onGenerate}
          disabled={!anyPlatformSelected || isGenerating}
          className={`w-full py-4 mb-3 rounded-[14px] font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            anyPlatformSelected && !isGenerating
              ? "bg-gradient-to-r from-[#2563EB] to-purple-600 text-white shadow-lg shadow-[#2563EB]/30 hover:shadow-xl hover:scale-[1.02]"
              : "bg-[#F9FAFB] dark:bg-gray-800 text-gray-400 cursor-not-allowed"
          }`}
        >
          <BsLightning className="text-xl" />
          {isGenerating ? "Generating..." : "Download ZIP"}
        </button>
      )}

      <div className="rounded-[14px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm lg:h-[calc(100vh-200px)] lg:overflow-y-auto scrollbar-hide">
        <PanelHeading title="Appearance" />
        <Control title="Background Color">
          <input
            type="color"
            value={state.backgroundColor}
            onChange={(e) => updateState({ backgroundColor: e.target.value })}
            className="w-8 h-8 rounded-[10px] cursor-pointer border-0 p-0"
          />
        </Control>
        <div className="p-4 border-b border-[#E5E7EB]/60 dark:border-gray-700/60">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Padding</span>
            <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{state.padding}%</span>
          </div>
          <Slider min={0} max={20} step={1} value={[state.padding]} onValueChange={([v]) => updateState({ padding: v })} />
          <p className="text-xs text-gray-400 mt-1">Inset so edge-to-edge art isn&apos;t clipped by OS corner-rounding</p>
        </div>
        <Control title="Rounded Preview" noBorder>
          <Switch checked={state.roundedPreview} onCheckedChange={(v) => updateState({ roundedPreview: v })} />
        </Control>

        <PanelHeading title="Platforms" />
        <div className="p-3 flex flex-col gap-2">
          {PLATFORM_ROWS.map((row) => (
            <label
              key={row.key}
              className="flex items-center justify-between p-3 rounded-[10px] border border-[#E5E7EB] dark:border-gray-700 cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-[#2563EB]">{row.icon}</span>
                <div>
                  <span className="text-sm font-medium text-[#0A0A0A] dark:text-white block">{row.label}</span>
                  <span className="text-xs text-gray-400">{row.desc}</span>
                </div>
              </div>
              <Switch
                checked={state.platforms[row.key]}
                onCheckedChange={(v) => updateState({ platforms: { ...state.platforms, [row.key]: v } })}
              />
            </label>
          ))}
        </div>

        <PanelHeading title="Notes" />
        <div className="p-4 text-xs text-gray-500 dark:text-gray-400 space-y-2">
          <p>Android adaptive icons (foreground/background split) and Windows tiles aren&apos;t generated yet — this exports the classic launcher icon set, which works everywhere.</p>
          <p>For macOS, unzip and run <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">iconutil -c icns AppIcon.iconset</code> to get a real .icns file.</p>
        </div>
      </div>
    </section>
  );
};

export default AppIconGeneratorControls;
