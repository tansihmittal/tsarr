import { BsDownload } from "react-icons/bs";
import ControlPanelHeading from "../common/ControlPanelHeading";
import { OutputFormat } from "./ClipboardSaverPreview";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const formats: { id: OutputFormat; name: string; desc: string; supportsQuality: boolean }[] = [
  { id: "png", name: "PNG", desc: "Lossless", supportsQuality: false },
  { id: "jpeg", name: "JPG", desc: "Smaller", supportsQuality: true },
  { id: "webp", name: "WebP", desc: "Modern", supportsQuality: true },
  { id: "avif", name: "AVIF", desc: "Best", supportsQuality: true },
  { id: "gif", name: "GIF", desc: "Animated", supportsQuality: false },
  { id: "bmp", name: "BMP", desc: "Raw", supportsQuality: false },
  { id: "ico", name: "ICO", desc: "Icon", supportsQuality: false },
];

interface Props {
  hasImage: boolean;
  outputFormat: OutputFormat;
  quality: number;
  onFormatChange: (format: OutputFormat) => void;
  onQualityChange: (quality: number) => void;
  onDownload: () => void;
}

const ClipboardSaverControls: React.FC<Props> = ({
  hasImage,
  outputFormat,
  quality,
  onFormatChange,
  onQualityChange,
  onDownload,
}) => {
  const selectedFormat = formats.find((f) => f.id === outputFormat);

  return (
    <section className="flex flex-col transition-opacity duration-300 opacity-100">
      <div className="rounded-[14px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
        <ControlPanelHeading title="Output Format" />
        <div className="p-4 border-b border-[#E5E7EB]/6 dark:border-gray-700/60 dark:border-gray-700/60">
          <div className="grid grid-cols-2 gap-2">
            {formats.map((format) => (
              <button
                key={format.id}
                onClick={() => onFormatChange(format.id)}
                className={`p-3 rounded-[10px] text-left transition-all ${
                  outputFormat === format.id
                    ? "bg-[#2563EB] text-white ring-2 ring-[#2563EB] ring-offset-2"
                    : "bg-[#F9FAFB] dark:bg-gray-800/50 hover:bg-[#E5E7EB] dark:hover:bg-gray-700"
                }`}
              >
                <div className="font-semibold text-sm">{format.name}</div>
                <div className={`text-xs ${outputFormat === format.id ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}>
                  {format.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedFormat?.supportsQuality && (
          <>
            <ControlPanelHeading title="Quality" />
            <div className="p-4 border-b border-[#E5E7EB]/6 dark:border-gray-700/60 dark:border-gray-700/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Quality</span>
                <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{quality}%</span>
              </div>
              <Slider
                min={10}
                max={100}
                value={[quality]}
                onValueChange={([v]) => onQualityChange(v)}
                className="w-full mb-2"
              />
              <div className="flex gap-2">
                {[50, 75, 90, 100].map((q) => (
                  <Button
                    key={q}
                    onClick={() => onQualityChange(q)}
                    variant={quality === q ? "default" : "secondary"}
                    className="h-7 text-xs px-3"
                  >
                    {q}%
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        <ControlPanelHeading title="Export" />
        <div className="p-4 border-b border-[#E5E7EB]/6 dark:border-gray-700/60 dark:border-gray-700/60">
          <Button
            onClick={onDownload}
            disabled={!hasImage}
            className="w-full gap-2 shadow-lg shadow-[#2563EB]/20"
          >
            <BsDownload className="text-lg" />
            Download as {outputFormat.toUpperCase()}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ClipboardSaverControls;
