import { BsDownload } from "react-icons/bs";
import ControlPanelHeading from "../common/ControlPanelHeading";
import { OutputFormat } from "./ClipboardSaverPreview";

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
      <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
        <ControlPanelHeading title="Output Format" />
        <div className="p-4 border-b border-base-200/60">
          <div className="grid grid-cols-2 gap-2">
            {formats.map((format) => (
              <button
                key={format.id}
                onClick={() => onFormatChange(format.id)}
                className={`p-3 rounded-lg text-left transition-all ${
                  outputFormat === format.id
                    ? "bg-primary text-white ring-2 ring-primary ring-offset-2"
                    : "bg-base-200 hover:bg-base-300"
                }`}
              >
                <div className="font-semibold text-sm">{format.name}</div>
                <div className={`text-xs ${outputFormat === format.id ? "text-white/70" : "text-gray-500"}`}>
                  {format.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedFormat?.supportsQuality && (
          <>
            <ControlPanelHeading title="Quality" />
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Quality</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => onQualityChange(Number(e.target.value))}
                className="range range-xs range-primary w-full mb-2"
              />
              <div className="flex gap-2">
                {[50, 75, 90, 100].map((q) => (
                  <button
                    key={q}
                    onClick={() => onQualityChange(q)}
                    className={`btn btn-xs ${quality === q ? "btn-primary" : "btn-outline"}`}
                  >
                    {q}%
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <ControlPanelHeading title="Export" />
        <div className="p-4 border-b border-base-200/60">
          <button
            onClick={onDownload}
            disabled={!hasImage}
            className="btn btn-primary w-full gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            <BsDownload className="text-lg" />
            Download as {outputFormat.toUpperCase()}
          </button>
        </div>
      </div>
    </section>
  );
};

export default ClipboardSaverControls;
