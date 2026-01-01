import { ReactNode, useState, useEffect } from "react";
import {
  BsPlus,
  BsTrash,
  BsFiles,
  BsBookmarkFill,
  BsDownload,
  BsPlayFill,
  BsMagic,
  BsCameraVideo,
} from "react-icons/bs";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";
import { MdSubtitles, MdStyle } from "react-icons/md";
import {
  VideoCaptionsState,
  Caption,
  CaptionStyle,
  DEFAULT_STYLE,
} from "./VideoCaptionsLayout";
import { GOOGLE_FONTS, loadFont } from "../../data/fonts";

interface Props {
  state: VideoCaptionsState;
  updateState: (updates: Partial<VideoCaptionsState>) => void;
  updateStyle: (updates: Partial<CaptionStyle>) => void;
  addCaption: () => void;
  updateCaption: (captionId: string, updates: Partial<Caption>) => void;
  deleteCaption: (captionId: string) => void;
  duplicateCaption: (captionId: string) => void;
  seekTo: (time: number) => void;
  transcribeVideo: () => void;
  playFromCaption: (captionId: string) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

// Style presets - TikTok viral styles (epic-captions inspired)
const STYLE_PRESETS = [
  // Epic Pop Styles
  {
    id: "epic-pop-white",
    name: "Epic Pop",
    style: {
      fontFamily: "Montserrat",
      fontSize: 36,
      fontWeight: 900,
      textColor: "#ffffff",
      highlightColor: "#ffff00",
      backgroundColor: "#000000",
      backgroundOpacity: 0,
      borderRadius: 0,
      textShadow: true,
      textTransform: "uppercase" as const,
      animation: "pop" as const,
      strokeColor: "#000000",
      strokeWidth: 0,
      letterSpacing: 1,
      rotation: 0,
      opacity: 100,
      tiltX: 0,
      tiltY: 0,
      curve: 0,
      reflection: false,
    },
  },
  {
    id: "epic-pop-yellow",
    name: "Epic Yellow",
    style: {
      fontFamily: "Montserrat",
      fontSize: 36,
      fontWeight: 900,
      textColor: "#ffff00",
      highlightColor: "#ffffff",
      backgroundColor: "#000000",
      backgroundOpacity: 0,
      borderRadius: 0,
      textShadow: true,
      textTransform: "uppercase" as const,
      animation: "pop" as const,
      strokeColor: "#000000",
      strokeWidth: 2,
      letterSpacing: 1,
      rotation: 0,
      opacity: 100,
      tiltX: 0,
      tiltY: 0,
      curve: 0,
      reflection: false,
    },
  },
  {
    id: "epic-gradient",
    name: "Neon Pop",
    style: {
      fontFamily: "Montserrat",
      fontSize: 34,
      fontWeight: 900,
      textColor: "#00ffff",
      highlightColor: "#ff00ff",
      backgroundColor: "#000000",
      backgroundOpacity: 0,
      borderRadius: 0,
      textShadow: true,
      textTransform: "uppercase" as const,
      animation: "neon" as const,
      strokeColor: "#ff00ff",
      strokeWidth: 1,
      letterSpacing: 2,
      rotation: 0,
      opacity: 100,
      tiltX: 0,
      tiltY: 0,
      curve: 0,
      reflection: false,
    },
  },
  // TikTok Styles
  {
    id: "tiktok-white",
    name: "TikTok White",
    style: {
      fontFamily: "Montserrat",
      fontSize: 32,
      fontWeight: 900,
      textColor: "#ffffff",
      highlightColor: "#ffff00",
      backgroundColor: "#000000",
      backgroundOpacity: 0,
      borderRadius: 0,
      textShadow: true,
      textTransform: "uppercase" as const,
      animation: "pop" as const,
      strokeColor: "#000000",
      strokeWidth: 0,
      letterSpacing: 0,
      rotation: 0,
      opacity: 100,
      tiltX: 0,
      tiltY: 0,
      curve: 0,
      reflection: false,
    },
  },
  {
    id: "tiktok-yellow",
    name: "TikTok Yellow",
    style: {
      fontFamily: "Montserrat",
      fontSize: 32,
      fontWeight: 900,
      textColor: "#ffff00",
      highlightColor: "#ffffff",
      backgroundColor: "#000000",
      backgroundOpacity: 0,
      borderRadius: 0,
      textShadow: true,
      textTransform: "uppercase" as const,
      animation: "pop" as const,
      strokeColor: "#000000",
      strokeWidth: 0,
      letterSpacing: 0,
      rotation: 0,
      opacity: 100,
      tiltX: 0,
      tiltY: 0,
      curve: 0,
      reflection: false,
    },
  },
  {
    id: "tiktok-neon-green",
    name: "Neon Green",
    style: {
      fontFamily: "Montserrat",
      fontSize: 30,
      fontWeight: 800,
      textColor: "#00ff00",
      highlightColor: "#ffffff",
      backgroundColor: "#000000",
      backgroundOpacity: 0,
      borderRadius: 0,
      textShadow: true,
      textTransform: "uppercase" as const,
      animation: "glow" as const,
      strokeColor: "#00ff00",
      strokeWidth: 1,
      letterSpacing: 1,
      rotation: 0,
      opacity: 100,
      tiltX: 0,
      tiltY: 0,
      curve: 0,
      reflection: false,
    },
  },
  {
    id: "tiktok-pink",
    name: "Hot Pink",
    style: {
      fontFamily: "Montserrat",
      fontSize: 30,
      fontWeight: 800,
      textColor: "#ff1493",
      highlightColor: "#ffffff",
      backgroundColor: "#000000",
      backgroundOpacity: 0,
      borderRadius: 0,
      textShadow: true,
      textTransform: "uppercase" as const,
      animation: "elastic" as const,
      strokeColor: "#ff1493",
      strokeWidth: 1,
      letterSpacing: 0,
      rotation: 0,
      opacity: 100,
      tiltX: 0,
      tiltY: 0,
      curve: 0,
      reflection: false,
    },
  },
  {
    id: "tiktok-cyan",
    name: "Cyan Pop",
    style: {
      fontFamily: "Montserrat",
      fontSize: 30,
      fontWeight: 800,
      textColor: "#00ffff",
      highlightColor: "#ff00ff",
      backgroundColor: "#000000",
      backgroundOpacity: 0,
      borderRadius: 0,
      textShadow: true,
      textTransform: "uppercase" as const,
      animation: "wave" as const,
      strokeColor: "#00ffff",
      strokeWidth: 1,
      letterSpacing: 1,
      rotation: 0,
      opacity: 100,
      tiltX: 0,
      tiltY: 0,
      curve: 0,
      reflection: false,
    },
  },
  {
    id: "tiktok-orange",
    name: "Fire Orange",
    style: {
      fontFamily: "Montserrat",
      fontSize: 30,
      fontWeight: 800,
      textColor: "#ff6600",
      highlightColor: "#ffff00",
      backgroundColor: "#000000",
      backgroundOpacity: 0,
      borderRadius: 0,
      textShadow: true,
      textTransform: "uppercase" as const,
      animation: "shake" as const,
      strokeColor: "#ff6600",
      strokeWidth: 1,
      letterSpacing: 0,
      rotation: 0,
      opacity: 100,
      tiltX: 0,
      tiltY: 0,
      curve: 0,
      reflection: false,
    },
  },
  {
    id: "hormozi-white",
    name: "Hormozi White",
    style: {
      fontFamily: "Arial",
      fontSize: 36,
      fontWeight: 900,
      textColor: "#ffffff",
      highlightColor: "#ffff00",
      backgroundColor: "#000000",
      backgroundOpacity: 0,
      borderRadius: 0,
      textShadow: true,
      textTransform: "uppercase" as const,
      animation: "pop" as const,
      strokeColor: "#000000",
      strokeWidth: 2,
      letterSpacing: 0,
      rotation: 0,
      opacity: 100,
      tiltX: 0,
      tiltY: 0,
      curve: 0,
      reflection: false,
    },
  },
  {
    id: "hormozi-yellow",
    name: "Hormozi Yellow",
    style: {
      fontFamily: "Arial",
      fontSize: 36,
      fontWeight: 900,
      textColor: "#ffd700",
      highlightColor: "#ffffff",
      backgroundColor: "#000000",
      backgroundOpacity: 0,
      borderRadius: 0,
      textShadow: true,
      textTransform: "uppercase" as const,
      animation: "pop" as const,
      strokeColor: "#000000",
      strokeWidth: 2,
      letterSpacing: 0,
      rotation: 0,
      opacity: 100,
      tiltX: 0,
      tiltY: 0,
      curve: 0,
      reflection: false,
    },
  },
  // Classic Styles
  {
    id: "classic-white",
    name: "Classic White",
    style: {
      fontFamily: "Inter",
      fontSize: 22,
      fontWeight: 600,
      textColor: "#ffffff",
      highlightColor: "#ffff00",
      backgroundColor: "#000000",
      backgroundOpacity: 0.7,
      borderRadius: 4,
      textShadow: false,
      textTransform: "none" as const,
      animation: "fade" as const,
      strokeColor: "#000000",
      strokeWidth: 0,
      letterSpacing: 0,
      rotation: 0,
      opacity: 100,
      tiltX: 0,
      tiltY: 0,
      curve: 0,
      reflection: false,
    },
  },
  {
    id: "netflix",
    name: "Netflix",
    style: {
      fontFamily: "Arial",
      fontSize: 24,
      fontWeight: 700,
      textColor: "#ffffff",
      highlightColor: "#e50914",
      backgroundColor: "#000000",
      backgroundOpacity: 0,
      borderRadius: 0,
      textShadow: true,
      textTransform: "none" as const,
      animation: "fade" as const,
      strokeColor: "#000000",
      strokeWidth: 0,
      letterSpacing: 0,
      rotation: 0,
      opacity: 100,
      tiltX: 0,
      tiltY: 0,
      curve: 0,
      reflection: false,
    },
  },
  {
    id: "youtube",
    name: "YouTube",
    style: {
      fontFamily: "Roboto",
      fontSize: 20,
      fontWeight: 500,
      textColor: "#ffffff",
      highlightColor: "#ff0000",
      backgroundColor: "#000000",
      backgroundOpacity: 0.75,
      borderRadius: 4,
      textShadow: false,
      textTransform: "none" as const,
      animation: "fade" as const,
      strokeColor: "#000000",
      strokeWidth: 0,
      letterSpacing: 0,
      rotation: 0,
      opacity: 100,
      tiltX: 0,
      tiltY: 0,
      curve: 0,
      reflection: false,
    },
  },
  // More TikTok Viral Styles
  {
    id: "mr-beast",
    name: "MrBeast",
    style: {
      fontFamily: "Impact",
      fontSize: 34,
      fontWeight: 700,
      textColor: "#ffffff",
      highlightColor: "#ffff00",
      backgroundColor: "#000000", // Fixed: No red background
      backgroundOpacity: 0, // Fixed: No background
      borderRadius: 0,
      textShadow: true,
      textTransform: "uppercase" as const,
      animation: "pop" as const,
      strokeColor: "#000000",
      strokeWidth: 3, // Bold stroke for MrBeast style
      letterSpacing: 1,
      rotation: 0,
      opacity: 100,
      tiltX: 0,
      tiltY: 0,
      curve: 0,
      reflection: false,
    },
  },
  {
    id: "karaoke-style",
    name: "Karaoke",
    style: {
      fontFamily: "Arial",
      fontSize: 28,
      fontWeight: 700,
      textColor: "#00ffff",
      highlightColor: "#ffff00",
      backgroundColor: "#000000",
      backgroundOpacity: 0.6,
      borderRadius: 8,
      textShadow: true,
      textTransform: "none" as const,
      animation: "karaoke" as const,
      strokeColor: "#000000",
      strokeWidth: 0,
      letterSpacing: 0,
      rotation: 0,
      opacity: 100,
      tiltX: 0,
      tiltY: 0,
      curve: 0,
      reflection: false,
    },
  },
  {
    id: "glitch",
    name: "Glitch",
    style: {
      fontFamily: "Courier New",
      fontSize: 28,
      fontWeight: 700,
      textColor: "#00ff00",
      highlightColor: "#ff0000",
      backgroundColor: "#000000",
      backgroundOpacity: 0.8,
      borderRadius: 0,
      textShadow: true,
      textTransform: "uppercase" as const,
      animation: "shake" as const,
      strokeColor: "#00ff00",
      strokeWidth: 1,
      letterSpacing: 2,
      rotation: 0,
      opacity: 100,
      tiltX: 0,
      tiltY: 0,
      curve: 0,
      reflection: false,
    },
  },
  {
    id: "retro",
    name: "Retro",
    style: {
      fontFamily: "Georgia",
      fontSize: 22,
      fontWeight: 700,
      textColor: "#ff69b4",
      highlightColor: "#ffff00",
      backgroundColor: "#000000",
      backgroundOpacity: 0,
      borderRadius: 0,
      textShadow: true,
      textTransform: "none" as const,
      animation: "fade" as const,
      strokeColor: "#ff69b4",
      strokeWidth: 0,
      letterSpacing: 0,
      rotation: 0,
      opacity: 100,
      tiltX: 0,
      tiltY: 0,
      curve: 0,
      reflection: false,
    },
  },
  // New 3D and Advanced Presets
  {
    id: "3d-tilt-left",
    name: "3D Tilt Left",
    style: {
      fontFamily: "Montserrat",
      fontSize: 32,
      fontWeight: 900,
      textColor: "#ffffff",
      highlightColor: "#ffff00",
      backgroundColor: "#000000",
      backgroundOpacity: 0,
      borderRadius: 0,
      textShadow: true,
      textTransform: "uppercase" as const,
      animation: "flip" as const,
      strokeColor: "#000000",
      strokeWidth: 1,
      letterSpacing: 1,
      rotation: 0,
      opacity: 100,
      tiltX: 10,
      tiltY: -20,
      curve: 0,
      reflection: true,
      reflectionOpacity: 0.4,
    },
  },
  {
    id: "3d-dramatic",
    name: "3D Dramatic",
    style: {
      fontFamily: "Impact",
      fontSize: 38,
      fontWeight: 900,
      textColor: "#ff0066",
      highlightColor: "#ffffff",
      backgroundColor: "#000000",
      backgroundOpacity: 0,
      borderRadius: 0,
      textShadow: true,
      textTransform: "uppercase" as const,
      animation: "zoom" as const,
      strokeColor: "#ffffff",
      strokeWidth: 2,
      letterSpacing: 2,
      rotation: -5,
      opacity: 100,
      tiltX: 20,
      tiltY: -30,
      curve: 0,
      reflection: true,
      reflectionOpacity: 0.5,
    },
  },
  {
    id: "neon-glow",
    name: "Neon Glow",
    style: {
      fontFamily: "Orbitron",
      fontSize: 30,
      fontWeight: 800,
      textColor: "#00ffff",
      highlightColor: "#ff00ff",
      backgroundColor: "#000000",
      backgroundOpacity: 0,
      borderRadius: 0,
      textShadow: false,
      textTransform: "uppercase" as const,
      animation: "neon" as const,
      strokeColor: "#00ffff",
      strokeWidth: 0,
      letterSpacing: 3,
      rotation: 0,
      opacity: 100,
      tiltX: 0,
      tiltY: 0,
      curve: 0,
      reflection: false,
    },
  },
];

const Control = ({
  title,
  value,
  children,
  onTap,
}: {
  title: string;
  value?: string | number | null;
  children: ReactNode;
  onTap?: () => void;
}) => (
  <div
    className="control-item flex justify-between items-center p-[1rem] border-b border-base-200/60 cursor-pointer overflow-hidden group"
    onClick={onTap}
  >
    <div className="flex justify-between items-center gap-2 shrink-0">
      <span className="text-primary-content font-medium">{title}</span>
      {value != null && (
        <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium text-gray-600 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
          {value}
        </span>
      )}
    </div>
    <div className="flex items-center overflow-hidden">{children}</div>
  </div>
);

const PanelHeading = ({ title }: { title: string }) => (
  <h2 className="text-[0.75rem] uppercase tracking-wider font-semibold px-4 py-3 bg-gradient-to-r from-base-200/80 to-base-200/40 text-gray-600 border-b border-base-200/50 flex items-center gap-2">
    <span className="w-1 h-4 bg-primary rounded-full"></span>
    {title}
  </h2>
);

const VideoCaptionsControls = ({
  state,
  updateState,
  updateStyle,
  addCaption,
  updateCaption,
  deleteCaption,
  duplicateCaption,
  seekTo,
  transcribeVideo,
  playFromCaption,
  videoRef,
}: Props) => {
  const [selectedTab, setSelectedTab] = useState("captions");
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportQuality, setExportQuality] = useState<"720p" | "1080p" | "4k" | "original">("original");
  const [exportFormat, setExportFormat] = useState<"webm" | "mp4" | "mov" | "avi" | "mkv" | "gif">("webm");

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(":");
    if (parts.length !== 2) return 0;
    const [mins, secMs] = parts;
    const [secs, ms] = secMs.split(".");
    return parseInt(mins) * 60 + parseInt(secs) + (parseInt(ms || "0") / 100);
  };

  // Export functions
  const exportSRT = () => {
    let srt = "";
    state.captions.forEach((caption, index) => {
      const startTime = formatSRTTime(caption.startTime);
      const endTime = formatSRTTime(caption.endTime);
      srt += `${index + 1}\n${startTime} --> ${endTime}\n${caption.text}\n\n`;
    });
    downloadFile(srt, "captions.srt", "text/plain");
  };

  const exportVTT = () => {
    let vtt = "WEBVTT\n\n";
    state.captions.forEach((caption, index) => {
      const startTime = formatVTTTime(caption.startTime);
      const endTime = formatVTTTime(caption.endTime);
      vtt += `${index + 1}\n${startTime} --> ${endTime}\n${caption.text}\n\n`;
    });
    downloadFile(vtt, "captions.vtt", "text/vtt");
  };

  const exportJSON = () => {
    const json = JSON.stringify({ captions: state.captions, style: state.style }, null, 2);
    downloadFile(json, "captions.json", "application/json");
  };

  // Export as plain text
  const exportTXT = () => {
    const txt = state.captions.map((c) => c.text).join("\n\n");
    downloadFile(txt, "captions.txt", "text/plain");
  };

  // Export as CSV
  const exportCSV = () => {
    let csv = "Index,Start Time,End Time,Text\n";
    state.captions.forEach((caption, index) => {
      csv += `${index + 1},${caption.startTime.toFixed(2)},${caption.endTime.toFixed(2)},"${caption.text.replace(/"/g, '""')}"\n`;
    });
    downloadFile(csv, "captions.csv", "text/csv");
  };

  // Export as ASS (Advanced SubStation Alpha)
  const exportASS = () => {
    let ass = `[Script Info]
Title: Captions
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${state.style.fontFamily},${state.style.fontSize},&H00FFFFFF,&H000000FF,&H00000000,&H00000000,${state.style.fontWeight >= 700 ? 1 : 0},0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
    state.captions.forEach((caption) => {
      const start = formatASSTime(caption.startTime);
      const end = formatASSTime(caption.endTime);
      ass += `Dialogue: 0,${start},${end},Default,,0,0,0,,${caption.text}\n`;
    });
    downloadFile(ass, "captions.ass", "text/plain");
  };

  const formatASSTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
  };

  const formatSRTTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
  };

  const formatVTTTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper functions for video export
  const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Export as GIF (simplified - captures frames as animated GIF)
  const exportAsGif = async (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // For GIF, we'll export as WebM and let user convert, or use a simpler frame-based approach
    // Since browser GIF encoding is complex, we'll export as WebM with a note
    setExportProgress(10);
    
    const stream = canvas.captureStream(10); // Lower FPS for GIF-like feel
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 2000000, // Lower bitrate for smaller file
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tsarr-in-video-captions-${exportQuality}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExportingVideo(false);
      setExportProgress(100);
      alert("GIF export creates a WebM file. Use an online converter to convert to GIF if needed.");
    };

    // Get caption at specific time
    const getCaptionAtTime = (time: number): Caption | null => {
      return state.captions.find(
        (c) => time >= c.startTime && time <= c.endTime
      ) || null;
    };

    // Draw caption on canvas (reuse the same logic)
    const drawCaptionOnCanvas = (caption: Caption | null) => {
      if (!caption) return;
      const style = state.style;
      const text = style.textTransform === "uppercase" 
        ? caption.text.toUpperCase()
        : style.textTransform === "lowercase"
        ? caption.text.toLowerCase()
        : style.textTransform === "capitalize"
        ? caption.text.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
        : caption.text;

      const scaleFactor = canvas.height / 720;
      const fontSize = style.fontSize * scaleFactor;

      ctx.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = style.opacity / 100;

      let x = canvas.width / 2;
      let y = canvas.height * 0.9;
      
      if (style.position === "custom") {
        x = (style.customX / 100) * canvas.width;
        y = (style.customY / 100) * canvas.height;
      } else if (style.position === "top") {
        y = canvas.height * 0.1;
      } else if (style.position === "center") {
        y = canvas.height / 2;
      }

      ctx.save();
      ctx.translate(x, y);
      if (style.rotation !== 0) ctx.rotate((style.rotation * Math.PI) / 180);

      if (style.textShadow) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillText(text, 2 * scaleFactor, 2 * scaleFactor);
      }

      ctx.fillStyle = style.textColor;
      ctx.fillText(text, 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    mediaRecorder.start(100);
    video.currentTime = 0;
    await new Promise(resolve => setTimeout(resolve, 100));

    const renderFrame = () => {
      if (video.ended || video.paused) {
        mediaRecorder.stop();
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      drawCaptionOnCanvas(getCaptionAtTime(video.currentTime));
      setExportProgress(Math.round((video.currentTime / video.duration) * 100));
      requestAnimationFrame(renderFrame);
    };

    video.play();
    renderFrame();
    video.onended = () => mediaRecorder.stop();
  };

  // Export video with burned-in captions
  const exportVideoWithCaptions = async () => {
    if (!videoRef.current || state.captions.length === 0) return;

    setIsExportingVideo(true);
    setExportProgress(0);

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsExportingVideo(false);
      return;
    }

    // Set canvas size based on quality
    let targetWidth = video.videoWidth;
    let targetHeight = video.videoHeight;
    
    if (exportQuality === "720p") {
      const aspectRatio = video.videoWidth / video.videoHeight;
      targetHeight = 720;
      targetWidth = Math.round(720 * aspectRatio);
    } else if (exportQuality === "1080p") {
      const aspectRatio = video.videoWidth / video.videoHeight;
      targetHeight = 1080;
      targetWidth = Math.round(1080 * aspectRatio);
    } else if (exportQuality === "4k") {
      const aspectRatio = video.videoWidth / video.videoHeight;
      targetHeight = 2160;
      targetWidth = Math.round(2160 * aspectRatio);
    }
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // For GIF export, we'll collect frames and use a different approach
    if (exportFormat === "gif") {
      await exportAsGif(video, canvas, ctx, targetWidth, targetHeight);
      return;
    }

    // Create a MediaRecorder to capture the canvas
    const stream = canvas.captureStream(30); // 30 FPS
    
    // Try to get audio from the video
    let audioTrack: MediaStreamTrack | null = null;
    try {
      // Create an audio context to capture video audio
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(video);
      const destination = audioCtx.createMediaStreamDestination();
      source.connect(destination);
      source.connect(audioCtx.destination); // Also play through speakers
      audioTrack = destination.stream.getAudioTracks()[0];
      if (audioTrack) {
        stream.addTrack(audioTrack);
      }
    } catch (e) {
      console.log("Could not capture audio:", e);
    }

    // Determine mime type based on format
    const mimeType = exportFormat === "mp4" 
      ? "video/mp4;codecs=avc1" 
      : "video/webm;codecs=vp9";
    
    // Check if the format is supported, fallback to webm
    const supportedMimeType = MediaRecorder.isTypeSupported(mimeType) 
      ? mimeType 
      : "video/webm;codecs=vp9";

    // Set bitrate based on quality
    let bitrate = 6000000;
    if (exportQuality === "4k") bitrate = 20000000;
    else if (exportQuality === "1080p") bitrate = 8000000;
    else if (exportQuality === "720p") bitrate = 5000000;

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: supportedMimeType,
      videoBitsPerSecond: bitrate,
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    // Use the selected format as extension (browser exports as WebM/MP4 internally)
    const fileExtension = exportFormat;
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: supportedMimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tsarr-in-video-with-captions-${exportQuality}.${fileExtension}`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExportingVideo(false);
      setExportProgress(100);
    };

    // Get caption at specific time
    const getCaptionAtTime = (time: number): Caption | null => {
      return state.captions.find(
        (c) => time >= c.startTime && time <= c.endTime
      ) || null;
    };

    // Draw caption on canvas
    const drawCaption = (caption: Caption | null) => {
      if (!caption) return;

      const style = state.style;
      const text = style.textTransform === "uppercase" 
        ? caption.text.toUpperCase()
        : style.textTransform === "lowercase"
        ? caption.text.toLowerCase()
        : style.textTransform === "capitalize"
        ? caption.text.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
        : caption.text;

      // Scale font size based on video resolution
      const scaleFactor = canvas.height / 720; // Base on 720p
      const fontSize = style.fontSize * scaleFactor;

      ctx.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = style.opacity / 100;

      // Measure text
      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      const textHeight = fontSize;
      const padding = style.padding * scaleFactor;

      // Calculate position based on style.position
      let x: number;
      let y: number;
      
      if (style.position === "custom") {
        x = (style.customX / 100) * canvas.width;
        y = (style.customY / 100) * canvas.height;
      } else {
        x = canvas.width / 2;
        switch (style.position) {
          case "top":
            y = canvas.height * 0.1;
            break;
          case "center":
            y = canvas.height / 2;
            break;
          default:
            y = canvas.height * 0.9;
        }
      }

      // Save context for transforms
      ctx.save();
      ctx.translate(x, y);
      
      // Apply rotation
      if (style.rotation !== 0) {
        ctx.rotate((style.rotation * Math.PI) / 180);
      }

      // Draw background
      if (style.backgroundOpacity > 0) {
        ctx.fillStyle = hexToRgba(style.backgroundColor, style.backgroundOpacity);
        const bgX = -textWidth / 2 - padding * 1.5;
        const bgY = -textHeight / 2 - padding;
        const bgWidth = textWidth + padding * 3;
        const bgHeight = textHeight + padding * 2;
        const radius = style.borderRadius * scaleFactor;

        ctx.beginPath();
        ctx.roundRect(bgX, bgY, bgWidth, bgHeight, radius);
        ctx.fill();
      }

      // Draw text stroke
      if (style.strokeWidth > 0) {
        ctx.strokeStyle = style.strokeColor;
        ctx.lineWidth = style.strokeWidth * scaleFactor;
        ctx.strokeText(text, 0, 0);
      }

      // Draw text shadow
      if (style.textShadow) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillText(text, 2 * scaleFactor, 2 * scaleFactor);
      }

      // Draw text
      ctx.fillStyle = style.textColor;
      ctx.fillText(text, 0, 0);
      
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    // Start recording
    mediaRecorder.start(100); // Collect data every 100ms

    // Reset video to start
    video.currentTime = 0;
    await new Promise(resolve => setTimeout(resolve, 100));

    // Play video and render frames
    const renderFrame = () => {
      if (video.ended || video.paused) {
        mediaRecorder.stop();
        return;
      }

      // Draw video frame (scaled to target size)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Draw caption
      const caption = getCaptionAtTime(video.currentTime);
      drawCaption(caption);

      // Update progress
      const progress = (video.currentTime / video.duration) * 100;
      setExportProgress(Math.round(progress));

      requestAnimationFrame(renderFrame);
    };

    video.play();
    renderFrame();

    // Handle video end
    video.onended = () => {
      mediaRecorder.stop();
    };
  };

  const TabButton = ({ id, icon, label }: { id: string; icon: ReactNode; label: string }) => (
    <div
      className={`flex justify-center items-center gap-2 font-medium px-4 py-2.5 transition-all duration-200 cursor-pointer ${
        selectedTab === id
          ? "bg-base-100 rounded-lg shadow-sm text-primary"
          : "text-primary-content hover:text-primary"
      }`}
      onClick={() => setSelectedTab(id)}
    >
      <span className={`transition-transform duration-200 ${selectedTab === id ? "scale-110" : ""}`}>
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );

  return (
    <section className={`flex flex-col transition-opacity duration-300 ${state.videoUrl ? "opacity-100" : "opacity-90"}`}>
      {/* Tab Buttons */}
      <div className="grid grid-cols-3 bg-base-200/60 rounded-xl p-1 mb-3 cursor-pointer backdrop-blur-sm">
        <TabButton id="captions" icon={<MdSubtitles />} label="Captions" />
        <TabButton id="style" icon={<MdStyle />} label="Style" />
        <TabButton id="presets" icon={<BsBookmarkFill />} label="Presets" />
      </div>

      {/* Captions Panel */}
      {selectedTab === "captions" && (
        <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
          <PanelHeading title="Captions" />

          {/* Auto-Transcribe Button */}
          <div className="p-3 border-b border-base-200/60">
            {/* Words per caption setting */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-primary-content font-medium">Words per Caption</span>
                <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full font-semibold">
                  {state.wordsPerCaption === 0 ? "Auto" : `${state.wordsPerCaption} ${state.wordsPerCaption === 1 ? "word" : "words"}`}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateState({ wordsPerCaption: 0 })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    state.wordsPerCaption === 0
                      ? "bg-primary text-white"
                      : "bg-base-200 hover:bg-base-300 text-primary-content"
                  }`}
                >
                  Auto
                </button>
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => updateState({ wordsPerCaption: num })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      state.wordsPerCaption === num
                        ? "bg-primary text-white"
                        : "bg-base-200 hover:bg-base-300 text-primary-content"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                {state.wordsPerCaption === 0 ? "✨ AI picks optimal words based on speech rhythm" : state.wordsPerCaption <= 2 ? "⚡ Fast, punchy TikTok style" : state.wordsPerCaption <= 3 ? "📱 Balanced for social media" : "📺 Traditional subtitle style"}
              </p>
            </div>

            <button
              onClick={transcribeVideo}
              disabled={!state.videoUrl || state.isTranscribing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BsMagic className="w-5 h-5" />
              {state.isTranscribing ? "Transcribing..." : "Auto-Generate Captions"}
            </button>
            
            {/* Progress indicator */}
            {state.isTranscribing && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500">{state.transcriptionProgress}</span>
                  <span className="text-xs font-semibold text-primary">{Math.round(state.transcriptionPercent)}%</span>
                </div>
                <div className="h-2 bg-base-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${state.transcriptionPercent}%` }}
                  />
                </div>
              </div>
            )}
            
            <p className="text-xs text-gray-400 mt-2 text-center">
              Uses AI (Whisper) to auto-detect speech • Runs locally in browser
            </p>
          </div>

          {/* Add Caption Button */}
          <div className="p-3">
            <button
              onClick={addCaption}
              disabled={!state.videoUrl}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-focus text-primary-content rounded-xl transition-all duration-200 font-medium shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BsPlus className="w-5 h-5" />
              Add Caption at {formatTime(state.currentTime)}
            </button>
          </div>

          {/* Caption List */}
          <div className="px-3 pb-3 space-y-2">
            {state.captions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MdSubtitles className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No captions yet</p>
                <p className="text-xs mt-1">Click &quot;Add Caption&quot; to get started</p>
              </div>
            ) : (
              state.captions.map((caption, index) => (
                <CaptionItem
                  key={caption.id}
                  caption={caption}
                  index={index}
                  isSelected={state.selectedCaptionId === caption.id}
                  videoDuration={state.videoDuration}
                  onSelect={() => {
                    updateState({ selectedCaptionId: caption.id });
                    seekTo(caption.startTime);
                  }}
                  onPlay={() => playFromCaption(caption.id)}
                  onUpdate={(updates) => updateCaption(caption.id, updates)}
                  onDuplicate={() => duplicateCaption(caption.id)}
                  onDelete={() => deleteCaption(caption.id)}
                  formatTime={formatTime}
                  parseTime={parseTime}
                />
              ))
            )}
          </div>

          {/* Export Section */}
          {state.captions.length > 0 && (
            <>
              <PanelHeading title="Export Video" />
              <div className="p-3">
                {/* Quality Selection */}
                <div className="mb-3">
                  <span className="text-xs text-gray-500 font-medium block mb-1.5">Quality</span>
                  <div className="grid grid-cols-4 gap-2">
                    {(["720p", "1080p", "4k", "original"] as const).map((quality) => (
                      <button
                        key={quality}
                        onClick={() => setExportQuality(quality)}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                          exportQuality === quality
                            ? "bg-primary text-white"
                            : "bg-base-200 hover:bg-base-300"
                        }`}
                      >
                        {quality === "original" ? "Orig" : quality}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format Selection */}
                <div className="mb-3">
                  <span className="text-xs text-gray-500 font-medium block mb-1.5">Format</span>
                  <div className="grid grid-cols-3 gap-1.5 mb-1">
                    {(["webm", "mp4", "mov"] as const).map((format) => (
                      <button
                        key={format}
                        onClick={() => setExportFormat(format)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors uppercase ${
                          exportFormat === format
                            ? "bg-primary text-white"
                            : "bg-base-200 hover:bg-base-300"
                        }`}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["avi", "mkv", "gif"] as const).map((format) => (
                      <button
                        key={format}
                        onClick={() => setExportFormat(format)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors uppercase ${
                          exportFormat === format
                            ? "bg-primary text-white"
                            : "bg-base-200 hover:bg-base-300"
                        }`}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    {exportFormat === "gif" 
                      ? "GIF: No audio, optimized for sharing" 
                      : exportFormat === "webm" 
                      ? "WebM: Best browser support, smaller size"
                      : `${exportFormat.toUpperCase()}: Exported as WebM (rename to .${exportFormat})`}
                  </p>
                </div>

                <button
                  onClick={exportVideoWithCaptions}
                  disabled={isExportingVideo || !state.videoUrl}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                >
                  <BsCameraVideo className="w-5 h-5" />
                  {isExportingVideo ? `Exporting... ${exportProgress}%` : `Export ${exportQuality} ${exportFormat.toUpperCase()}`}
                </button>
                
                {isExportingVideo && (
                  <div className="mb-3">
                    <div className="h-2 bg-base-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      Rendering video with burned-in captions...
                    </p>
                  </div>
                )}
                
                <p className="text-xs text-gray-400 text-center mb-3">
                  Captions will be burned into the video
                </p>
              </div>

              <PanelHeading title="Export Subtitles" />
              <div className="p-3 grid grid-cols-3 gap-2">
                <button
                  onClick={exportSRT}
                  className="flex flex-col items-center gap-1 p-3 bg-base-200/50 hover:bg-base-200 rounded-xl transition-colors"
                >
                  <BsDownload className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium">SRT</span>
                </button>
                <button
                  onClick={exportVTT}
                  className="flex flex-col items-center gap-1 p-3 bg-base-200/50 hover:bg-base-200 rounded-xl transition-colors"
                >
                  <BsDownload className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium">VTT</span>
                </button>
                <button
                  onClick={exportASS}
                  className="flex flex-col items-center gap-1 p-3 bg-base-200/50 hover:bg-base-200 rounded-xl transition-colors"
                >
                  <BsDownload className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium">ASS</span>
                </button>
                <button
                  onClick={exportJSON}
                  className="flex flex-col items-center gap-1 p-3 bg-base-200/50 hover:bg-base-200 rounded-xl transition-colors"
                >
                  <BsDownload className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium">JSON</span>
                </button>
                <button
                  onClick={exportCSV}
                  className="flex flex-col items-center gap-1 p-3 bg-base-200/50 hover:bg-base-200 rounded-xl transition-colors"
                >
                  <BsDownload className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium">CSV</span>
                </button>
                <button
                  onClick={exportTXT}
                  className="flex flex-col items-center gap-1 p-3 bg-base-200/50 hover:bg-base-200 rounded-xl transition-colors"
                >
                  <BsDownload className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium">TXT</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Style Panel */}
      {selectedTab === "style" && (
        <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
          <PanelHeading title="Caption Style" />
          
          {/* Font Family */}
          <Control title="Font" value={`${state.style.fontFamily} (${GOOGLE_FONTS.length})`}>
            <select
              value={state.style.fontFamily}
              onChange={(e) => {
                loadFont(e.target.value);
                updateStyle({ fontFamily: e.target.value });
              }}
              className="select select-sm bg-base-200/50 border-0 text-sm max-w-[150px]"
            >
              {GOOGLE_FONTS.map((font) => (
                <option key={font.name} value={font.name}>{font.name}</option>
              ))}
            </select>
          </Control>

          {/* Font Size */}
          <div className="p-4 border-b border-base-200/60">
            <div className="flex justify-between items-center mb-2">
              <span className="text-primary-content font-medium">Font Size</span>
              <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium">
                {state.style.fontSize}px
              </span>
            </div>
            <input
              type="range"
              min="16"
              max="150"
              value={state.style.fontSize}
              onChange={(e) => updateStyle({ fontSize: parseInt(e.target.value) })}
              className="range range-xs range-primary w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>16px</span>
              <span>150px</span>
            </div>
          </div>

          {/* Font Weight */}
          <div className="p-4 border-b border-base-200/60">
            <div className="flex justify-between items-center mb-2">
              <span className="text-primary-content font-medium">Font Weight</span>
              <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium">
                {state.style.fontWeight}
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="900"
              step="100"
              value={state.style.fontWeight}
              onChange={(e) => updateStyle({ fontWeight: parseInt(e.target.value) })}
              className="range range-xs range-primary w-full"
            />
          </div>

          {/* Text Color */}
          <Control title="Text Color" value={state.style.textColor}>
            <input
              type="color"
              value={state.style.textColor}
              onChange={(e) => updateStyle({ textColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
          </Control>

          {/* Background Color */}
          <Control title="Background" value={state.style.backgroundColor}>
            <input
              type="color"
              value={state.style.backgroundColor}
              onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
          </Control>

          {/* Background Opacity */}
          <div className="p-4 border-b border-base-200/60">
            <div className="flex justify-between items-center mb-2">
              <span className="text-primary-content font-medium">Background Opacity</span>
              <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium">
                {Math.round(state.style.backgroundOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={state.style.backgroundOpacity}
              onChange={(e) => updateStyle({ backgroundOpacity: parseFloat(e.target.value) })}
              className="range range-xs range-primary w-full"
            />
          </div>

          {/* Position */}
          <Control title="Position" value={state.style.position}>
            <div className="flex gap-1">
              {(["top", "center", "bottom", "custom"] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => updateStyle({ position: pos })}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${
                    state.style.position === pos
                      ? "bg-primary text-white"
                      : "bg-base-200 hover:bg-base-300"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </Control>

          {/* Custom Position Controls */}
          {state.style.position === "custom" && (
            <>
              <div className="p-4 border-b border-base-200/60">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-primary-content font-medium">Horizontal (X)</span>
                  <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium">
                    {Math.round(state.style.customX)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={state.style.customX}
                  onChange={(e) => updateStyle({ customX: parseInt(e.target.value) })}
                  className="range range-xs range-primary w-full"
                />
              </div>
              <div className="p-4 border-b border-base-200/60">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-primary-content font-medium">Vertical (Y)</span>
                  <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium">
                    {Math.round(state.style.customY)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={state.style.customY}
                  onChange={(e) => updateStyle({ customY: parseInt(e.target.value) })}
                  className="range range-xs range-primary w-full"
                />
              </div>
            </>
          )}

          {/* Animation */}
          <Control title="Animation" value={state.style.animation}>
            <select
              value={state.style.animation}
              onChange={(e) => updateStyle({ animation: e.target.value as CaptionStyle["animation"] })}
              className="select select-sm bg-base-200/50 border-0 text-sm"
            >
              <option value="none">None</option>
              <option value="pop">Pop ⭐</option>
              <option value="karaoke">Karaoke</option>
              <option value="fade">Fade</option>
              <option value="slide">Slide</option>
              <option value="bounce">Bounce</option>
              <option value="highlight">Highlight</option>
              <option value="glow">Glow ✨</option>
              <option value="shake">Shake</option>
              <option value="wave">Wave 🌊</option>
              <option value="zoom">Zoom</option>
              <option value="flip">Flip 3D</option>
              <option value="swing">Swing</option>
              <option value="elastic">Elastic</option>
              <option value="neon">Neon 💡</option>
            </select>
          </Control>

          {/* Highlight Color */}
          <Control title="Highlight Color" value={state.style.highlightColor}>
            <input
              type="color"
              value={state.style.highlightColor}
              onChange={(e) => updateStyle({ highlightColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
          </Control>

          {/* Text Stroke */}
          <div className="p-4 border-b border-base-200/60">
            <div className="flex justify-between items-center mb-2">
              <span className="text-primary-content font-medium">Text Stroke</span>
              <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium">
                {state.style.strokeWidth}px
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min="0"
                max="4"
                value={state.style.strokeWidth}
                onChange={(e) => updateStyle({ strokeWidth: parseInt(e.target.value) })}
                className="range range-xs range-primary flex-1"
              />
              <input
                type="color"
                value={state.style.strokeColor}
                onChange={(e) => updateStyle({ strokeColor: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border-0"
              />
            </div>
          </div>

          {/* Text Transform */}
          <Control title="Text Case" value={state.style.textTransform}>
            <select
              value={state.style.textTransform}
              onChange={(e) => updateStyle({ textTransform: e.target.value as CaptionStyle["textTransform"] })}
              className="select select-sm bg-base-200/50 border-0 text-sm"
            >
              <option value="none">Normal</option>
              <option value="uppercase">UPPERCASE</option>
              <option value="lowercase">lowercase</option>
              <option value="capitalize">Capitalize</option>
            </select>
          </Control>

          {/* Text Shadow Toggle */}
          <Control title="Text Shadow">
            <label className="custom-toggle">
              <input
                type="checkbox"
                checked={state.style.textShadow}
                onChange={(e) => updateStyle({ textShadow: e.target.checked })}
              />
              <span className="slider"></span>
            </label>
          </Control>

          {/* Border Radius */}
          <div className="p-4 border-b border-base-200/60">
            <div className="flex justify-between items-center mb-2">
              <span className="text-primary-content font-medium">Border Radius</span>
              <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium">
                {state.style.borderRadius}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              value={state.style.borderRadius}
              onChange={(e) => updateStyle({ borderRadius: parseInt(e.target.value) })}
              className="range range-xs range-primary w-full"
            />
          </div>

          {/* Padding */}
          <div className="p-4 border-b border-base-200/60">
            <div className="flex justify-between items-center mb-2">
              <span className="text-primary-content font-medium">Padding</span>
              <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium">
                {state.style.padding}px
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="32"
              value={state.style.padding}
              onChange={(e) => updateStyle({ padding: parseInt(e.target.value) })}
              className="range range-xs range-primary w-full"
            />
          </div>

          <PanelHeading title="Advanced Text Options" />

          {/* Opacity */}
          <div className="p-4 border-b border-base-200/60">
            <div className="flex justify-between items-center mb-2">
              <span className="text-primary-content font-medium">Opacity</span>
              <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium">
                {state.style.opacity}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={state.style.opacity}
              onChange={(e) => updateStyle({ opacity: parseInt(e.target.value) })}
              className="range range-xs range-primary w-full"
            />
          </div>

          {/* Letter Spacing */}
          <div className="p-4 border-b border-base-200/60">
            <div className="flex justify-between items-center mb-2">
              <span className="text-primary-content font-medium">Letter Spacing</span>
              <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium">
                {state.style.letterSpacing}px
              </span>
            </div>
            <input
              type="range"
              min="-5"
              max="20"
              value={state.style.letterSpacing}
              onChange={(e) => updateStyle({ letterSpacing: parseInt(e.target.value) })}
              className="range range-xs range-primary w-full"
            />
          </div>

          {/* Rotation */}
          <div className="p-4 border-b border-base-200/60">
            <div className="flex justify-between items-center mb-2">
              <span className="text-primary-content font-medium">Rotation</span>
              <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium">
                {state.style.rotation}°
              </span>
            </div>
            <input
              type="range"
              min="-45"
              max="45"
              value={state.style.rotation}
              onChange={(e) => updateStyle({ rotation: parseInt(e.target.value) })}
              className="range range-xs range-primary w-full"
            />
          </div>

          <PanelHeading title="3D Tilt Effects" />

          {/* 3D Tilt Presets */}
          <div className="p-4 border-b border-base-200/60">
            <span className="text-primary-content font-medium text-sm block mb-2">Tilt Presets</span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "none", name: "None", tiltX: 0, tiltY: 0 },
                { id: "tilt-left", name: "Tilt Left", tiltX: 0, tiltY: -15 },
                { id: "tilt-right", name: "Tilt Right", tiltX: 0, tiltY: 15 },
                { id: "tilt-up", name: "Tilt Up", tiltX: -15, tiltY: 0 },
                { id: "tilt-down", name: "Tilt Down", tiltX: 15, tiltY: 0 },
                { id: "perspective-left", name: "Persp. L", tiltX: 10, tiltY: -20 },
                { id: "perspective-right", name: "Persp. R", tiltX: 10, tiltY: 20 },
                { id: "dramatic-left", name: "Drama L", tiltX: 20, tiltY: -30 },
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => updateStyle({ tiltX: preset.tiltX, tiltY: preset.tiltY })}
                  className={`px-2 py-1.5 rounded text-[10px] font-medium transition-colors ${
                    state.style.tiltX === preset.tiltX && state.style.tiltY === preset.tiltY
                      ? "bg-primary text-white"
                      : "bg-base-200 hover:bg-base-300"
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tilt X */}
          <div className="p-4 border-b border-base-200/60">
            <div className="flex justify-between items-center mb-2">
              <span className="text-primary-content font-medium">Tilt X</span>
              <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium">
                {state.style.tiltX}°
              </span>
            </div>
            <input
              type="range"
              min="-45"
              max="45"
              value={state.style.tiltX}
              onChange={(e) => updateStyle({ tiltX: parseInt(e.target.value) })}
              className="range range-xs range-primary w-full"
            />
          </div>

          {/* Tilt Y */}
          <div className="p-4 border-b border-base-200/60">
            <div className="flex justify-between items-center mb-2">
              <span className="text-primary-content font-medium">Tilt Y</span>
              <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium">
                {state.style.tiltY}°
              </span>
            </div>
            <input
              type="range"
              min="-45"
              max="45"
              value={state.style.tiltY}
              onChange={(e) => updateStyle({ tiltY: parseInt(e.target.value) })}
              className="range range-xs range-primary w-full"
            />
          </div>

          {/* 3D Reflection Toggle */}
          <Control title="3D Reflection">
            <label className="custom-toggle">
              <input
                type="checkbox"
                checked={state.style.reflection}
                onChange={(e) => updateStyle({ reflection: e.target.checked })}
              />
              <span className="slider"></span>
            </label>
          </Control>

          {/* Reflection Opacity - only show when reflection is enabled */}
          {state.style.reflection && (
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Reflection Opacity</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {Math.round((state.style.reflectionOpacity || 0.3) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={state.style.reflectionOpacity || 0.3}
                onChange={(e) => updateStyle({ reflectionOpacity: parseFloat(e.target.value) })}
                className="range range-xs range-primary w-full"
              />
            </div>
          )}
        </div>
      )}

      {/* Presets Panel */}
      {selectedTab === "presets" && (
        <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
          <PanelHeading title="Style Presets" />
          <p className="text-xs text-gray-500 px-4 py-2">
            Click a preset to apply it to your captions
          </p>
          <div className="grid grid-cols-2 gap-3 p-3">
            {STYLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => updateStyle(preset.style as Partial<CaptionStyle>)}
                className="group relative overflow-hidden rounded-xl border border-base-200/80 hover:border-primary transition-all hover:shadow-lg"
              >
                <div className="h-16 w-full flex items-center justify-center bg-gray-900">
                  <span
                    className="text-lg font-bold"
                    style={{
                      fontFamily: preset.style.fontFamily,
                      fontWeight: preset.style.fontWeight,
                      color: preset.style.textColor,
                      textShadow: preset.style.textShadow ? "2px 2px 4px rgba(0,0,0,0.8)" : "none",
                      textTransform: preset.style.textTransform || "none",
                    }}
                  >
                    Sample
                  </span>
                </div>
                <div className="p-2 bg-base-100 text-center border-t border-base-200/50">
                  <span className="text-xs font-medium text-primary-content">
                    {preset.name}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Reset to Default */}
          <div className="p-3 border-t border-base-200/50">
            <button
              onClick={() => updateStyle(DEFAULT_STYLE)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-base-200 hover:bg-base-300 text-primary-content rounded-lg transition-all duration-200 text-sm"
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

// Caption Item Component
interface CaptionItemProps {
  caption: Caption;
  index: number;
  isSelected: boolean;
  videoDuration: number;
  onSelect: () => void;
  onPlay: () => void;
  onUpdate: (updates: Partial<Caption>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  formatTime: (seconds: number) => string;
  parseTime: (timeStr: string) => number;
}

const CaptionItem = ({
  caption,
  index,
  isSelected,
  videoDuration,
  onSelect,
  onPlay,
  onUpdate,
  onDuplicate,
  onDelete,
  formatTime,
  parseTime,
}: CaptionItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isSelected) setIsExpanded(true);
  }, [isSelected]);

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${isSelected ? "border-primary bg-primary/5" : "border-base-200/80 bg-base-100"}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-base-200/50 transition-colors"
        onClick={() => { setIsExpanded(!isExpanded); onSelect(); }}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <BiChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <BiChevronDown className="w-4 h-4 text-gray-500" />
          )}
          <span className="font-medium text-sm">#{index + 1}</span>
          <span className="text-xs text-gray-400 truncate max-w-[100px]">
            {caption.text}
          </span>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onPlay}
            className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors"
            title="Play from here"
          >
            <BsPlayFill className="w-4 h-4 text-primary" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-1.5 hover:bg-base-200 rounded-lg transition-colors"
            title="Duplicate"
          >
            <BsFiles className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
            title="Delete"
          >
            <BsTrash className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 pt-0 space-y-3 border-t border-base-200/60">
          {/* Text */}
          <div>
            <span className="text-xs text-gray-500 font-medium block mb-1.5">Caption Text</span>
            <textarea
              value={caption.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full px-3 py-2 bg-base-200/50 border-0 rounded-lg focus:ring-2 focus:ring-primary text-sm resize-none"
              rows={2}
              placeholder="Enter caption text"
            />
          </div>

          {/* Timing */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-gray-500 font-medium block mb-1.5">Start Time</span>
              <input
                type="text"
                value={formatTime(caption.startTime)}
                onChange={(e) => {
                  const time = parseTime(e.target.value);
                  if (!isNaN(time) && time >= 0 && time < caption.endTime) {
                    onUpdate({ startTime: time });
                  }
                }}
                className="w-full px-3 py-2 bg-base-200/50 border-0 rounded-lg focus:ring-2 focus:ring-primary text-sm font-mono"
              />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-medium block mb-1.5">End Time</span>
              <input
                type="text"
                value={formatTime(caption.endTime)}
                onChange={(e) => {
                  const time = parseTime(e.target.value);
                  if (!isNaN(time) && time > caption.startTime && time <= videoDuration) {
                    onUpdate({ endTime: time });
                  }
                }}
                className="w-full px-3 py-2 bg-base-200/50 border-0 rounded-lg focus:ring-2 focus:ring-primary text-sm font-mono"
              />
            </div>
          </div>

          {/* Duration Display */}
          <div className="text-xs text-gray-400 text-center">
            Duration: {(caption.endTime - caption.startTime).toFixed(2)}s
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCaptionsControls;
