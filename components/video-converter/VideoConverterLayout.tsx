import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import Navigation from "../common/Navigation";
import {
  BsUpload,
  BsDownload,
  BsTrash,
  BsPlayFill,
  BsPauseFill,
  BsGear,
} from "react-icons/bs";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type OutputFormat =
  | "mp4"
  | "webm"
  | "avi"
  | "mov"
  | "mkv"
  | "gif"
  | "mp3"
  | "wav";
type Resolution = "original" | "4k" | "1080p" | "720p" | "480p" | "360p";
type FrameRate = "original" | "60" | "30" | "24" | "15";

interface VideoInfo {
  file: File;
  url: string;
  name: string;
  size: number;
  duration: number;
  width: number;
  height: number;
}

// eslint-disable-next-line
type FFmpegInstance = any;

const formats: {
  id: OutputFormat;
  name: string;
  icon: string;
  type: "video" | "audio";
}[] = [
  { id: "mp4", name: "MP4", icon: "🎬", type: "video" },
  { id: "webm", name: "WebM", icon: "🌐", type: "video" },
  { id: "avi", name: "AVI", icon: "📹", type: "video" },
  { id: "mov", name: "MOV", icon: "🎥", type: "video" },
  { id: "mkv", name: "MKV", icon: "🎞️", type: "video" },
  { id: "gif", name: "GIF", icon: "✨", type: "video" },
  { id: "mp3", name: "MP3", icon: "🎵", type: "audio" },
  { id: "wav", name: "WAV", icon: "🔊", type: "audio" },
];

const resolutions: { id: Resolution; name: string; width: number; height: number }[] = [
  { id: "original", name: "Original", width: 0, height: 0 },
  { id: "4k", name: "4K (2160p)", width: 3840, height: 2160 },
  { id: "1080p", name: "Full HD (1080p)", width: 1920, height: 1080 },
  { id: "720p", name: "HD (720p)", width: 1280, height: 720 },
  { id: "480p", name: "SD (480p)", width: 854, height: 480 },
  { id: "360p", name: "Low (360p)", width: 640, height: 360 },
];

const frameRates: { id: FrameRate; name: string }[] = [
  { id: "original", name: "Original" },
  { id: "60", name: "60 fps" },
  { id: "30", name: "30 fps" },
  { id: "24", name: "24 fps (Cinema)" },
  { id: "15", name: "15 fps" },
];

const VideoConverterLayout: React.FC = () => {
  const ffmpegRef = useRef<FFmpegInstance>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("mp4");
  const [resolution, setResolution] = useState<Resolution>("original");
  const [frameRate, setFrameRate] = useState<FrameRate>("original");
  const [quality, setQuality] = useState(23); // CRF value (lower = better, 0-51)
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [removeAudio, setRemoveAudio] = useState(false);

  // Load FFmpeg dynamically
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        // Dynamic imports to avoid SSR issues
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { toBlobURL } = await import("@ffmpeg/util");

        const ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;

        ffmpeg.on("progress", ({ progress }: { progress: number; time: number }) => {
          const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));
          setProgress(pct);
        });

        // Check if SharedArrayBuffer is available (required for multi-threading)
        const supportsMultiThread = typeof SharedArrayBuffer !== "undefined";

        // Use multi-threaded version if supported, otherwise fall back to single-threaded
        const baseURL = supportsMultiThread
          ? "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/umd"
          : "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

        try {
          const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript");
          const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm");

          if (supportsMultiThread) {
            const workerURL = await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, "text/javascript");
            await ffmpeg.load({ coreURL, wasmURL, workerURL });
          } else {
            await ffmpeg.load({ coreURL, wasmURL });
          }
        } catch (e) {
          throw new Error("Failed to load FFmpeg core files");
        }

        setFfmpegLoaded(true);
        setLoadError(null);
      } catch (error) {
        console.error("Failed to load FFmpeg:", error);
        setLoadError(
          "Failed to load converter. Please refresh the page or try a different browser."
        );
        toast.error("Failed to load video converter");
      }
    };
    loadFFmpeg();
  }, []);


  // Revoke video blob URL when it changes or on unmount (handles both new uploads and page exit)
  useEffect(() => {
    const url = video?.url;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [video?.url]);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) {
      toast.error("Please upload a video or audio file");
      return;
    }
    setIsLoading(true);
    const url = URL.createObjectURL(file);
    const videoEl = document.createElement("video");
    videoEl.onloadedmetadata = () => {
      setVideo({
        file,
        url,
        name: file.name,
        size: file.size,
        duration: videoEl.duration,
        width: videoEl.videoWidth,
        height: videoEl.videoHeight,
      });
      setTrimEnd(videoEl.duration);
      setIsLoading(false);
      toast.success("Video loaded!");
    };
    videoEl.onerror = () => {
      setIsLoading(false);
      URL.revokeObjectURL(url);
      toast.error("Failed to load video");
    };
    videoEl.src = url;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleConvert = useCallback(async () => {
    if (!video || !ffmpegRef.current || !ffmpegLoaded) {
      toast.error("Please wait for converter to load");
      return;
    }

    setIsConverting(true);
    setProgress(0);

    try {
      const { fetchFile } = await import("@ffmpeg/util");
      const ffmpeg = ffmpegRef.current;

      // Simple input/output names
      const inputExt = video.name.split(".").pop() || "mp4";
      const inputName = `input.${inputExt}`;
      const outputName = `output.${outputFormat}`;

      await ffmpeg.writeFile(inputName, await fetchFile(video.file));

      // Build simpler FFmpeg arguments
      // Use all available threads for faster encoding
      const args: string[] = ["-threads", "0", "-i", inputName];

      // Trim - put -ss before input for faster seeking
      if (trimStart > 0) {
        args.splice(0, 0, "-ss", trimStart.toString());
      }
      if (trimEnd < video.duration) {
        args.push("-t", (trimEnd - trimStart).toString());
      }

      // Resolution
      if (resolution !== "original") {
        const res = resolutions.find((r) => r.id === resolution);
        if (res) {
          args.push("-vf", `scale=${res.width}:${res.height}:force_original_aspect_ratio=decrease`);
        }
      }

      // Frame rate
      if (frameRate !== "original") args.push("-r", frameRate);

      // Audio
      if (removeAudio) args.push("-an");

      // Format specific options - simplified for compatibility
      if (outputFormat === "mp4") {
        args.push("-c:v", "libx264", "-crf", quality.toString(), "-preset", "veryfast");
        if (!removeAudio) args.push("-c:a", "aac");
      } else if (outputFormat === "webm") {
        args.push("-c:v", "libvpx", "-crf", quality.toString(), "-b:v", "1M");
        if (!removeAudio) args.push("-c:a", "libvorbis");
      } else if (outputFormat === "gif") {
        const fps = frameRate !== "original" ? frameRate : "10";
        const width = resolution !== "original"
          ? resolutions.find((r) => r.id === resolution)?.width || 320
          : 320;
        args.push("-vf", `fps=${fps},scale=${width}:-1:flags=lanczos`);
      } else if (outputFormat === "mp3") {
        args.push("-vn", "-c:a", "libmp3lame", "-q:a", "2");
      } else if (outputFormat === "wav") {
        args.push("-vn");
      } else {
        // avi, mov, mkv
        args.push("-c:v", "libx264", "-crf", quality.toString(), "-preset", "veryfast");
        if (!removeAudio) args.push("-c:a", "aac");
      }

      args.push("-y", outputName); // -y to overwrite

      await ffmpeg.exec(args);
      const data = await ffmpeg.readFile(outputName);

      // eslint-disable-next-line
      const blob = new Blob([data as any], {
        type: outputFormat === "mp3" ? "audio/mpeg" : outputFormat === "wav" ? "audio/wav" : `video/${outputFormat}`
      });
      const downloadUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `tsarr-in-converted.${outputFormat}`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      toast.success(`Converted to ${outputFormat.toUpperCase()}!`);
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Conversion failed: " + (error as Error).message);
    } finally {
      setIsConverting(false);
      setProgress(0);
    }
  }, [video, ffmpegLoaded, outputFormat, resolution, frameRate, quality, trimStart, trimEnd, removeAudio]);

  const handleClear = () => {
    if (video?.url) URL.revokeObjectURL(video.url);
    setVideo(null);
    setTrimStart(0);
    setTrimEnd(0);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };


  return (
    <main className="min-h-[100vh] h-fit editor-bg relative pb-20 lg:pb-0" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-3 sm:px-4 lg:px-0 relative py-4 sm:py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-5 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] mb-1 sm:mb-2">
              Video Converter
            </h1>
            <p className="text-[#4B5563] text-sm sm:text-base">
              Convert videos to any format with custom resolution, frame rate &
              more
            </p>
            {!ffmpegLoaded && !loadError && (
              <p className="text-sm text-warning mt-2">
                <span className="loading loading-spinner loading-xs mr-2"></span>
                Loading converter engine...
              </p>
            )}
            {loadError && (
              <p className="text-sm text-error mt-2">{loadError}</p>
            )}
          </div>

          <div className="grid lg:grid-cols-[2fr_1fr] gap-4 lg:gap-6">
            {/* Preview Area */}
            <div className="bg-white rounded-[20px] shadow-xl p-4 sm:p-6">
              {!video ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#E5E7EB] rounded-[20px] p-8 sm:p-12 cursor-pointer hover:border-[#2563EB] hover:bg-[#2563EB]/5 transition-all text-center active:scale-[0.99]"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,audio/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
                    <BsUpload className="text-3xl sm:text-4xl text-[#2563EB]" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-[#0A0A0A] mb-2">Upload Video</h2>
                  <p className="text-[#4B5563] mb-2 text-sm sm:text-base">Drag & drop or tap to browse</p>
                  <p className="text-xs text-[#4B5563]/60">Supports MP4, WebM, AVI, MOV, MKV, and more</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {/* Video Preview */}
                  <div className="relative bg-black rounded-[10px] overflow-hidden">
                    <video
                      ref={videoRef}
                      src={video.url}
                      className="w-full max-h-[300px] sm:max-h-[400px] object-contain"
                      onEnded={() => setIsPlaying(false)}
                    />
                    <button
                      onClick={togglePlay}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 sm:opacity-0 sm:hover:opacity-100 transition-opacity"
                    >
                      {isPlaying ? <BsPauseFill className="text-5xl sm:text-6xl text-white" /> : <BsPlayFill className="text-5xl sm:text-6xl text-white" />}
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleClear}
                      className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/80 hover:bg-white"
                    >
                      <BsTrash />
                    </Button>
                  </div>

                  {/* Video Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-sm">
                    <div className="bg-[#F9FAFB] rounded-[10px] p-2.5 sm:p-3 text-center">
                      <div className="text-[#4B5563] text-xs">Duration</div>
                      <div className="font-semibold text-[#0A0A0A] text-sm">{formatTime(video.duration)}</div>
                    </div>
                    <div className="bg-[#F9FAFB] rounded-[10px] p-2.5 sm:p-3 text-center">
                      <div className="text-[#4B5563] text-xs">Resolution</div>
                      <div className="font-semibold text-[#0A0A0A] text-sm">{video.width}×{video.height}</div>
                    </div>
                    <div className="bg-[#F9FAFB] rounded-[10px] p-2.5 sm:p-3 text-center">
                      <div className="text-[#4B5563] text-xs">Size</div>
                      <div className="font-semibold text-[#0A0A0A] text-sm">{formatSize(video.size)}</div>
                    </div>
                    <div className="bg-[#F9FAFB] rounded-[10px] p-2.5 sm:p-3 text-center">
                      <div className="text-[#4B5563] text-xs">Format</div>
                      <div className="font-semibold text-[#0A0A0A] text-sm">{video.name.split(".").pop()?.toUpperCase()}</div>
                    </div>
                  </div>

                  {/* Trim Controls */}
                  <div className="bg-[#F9FAFB] rounded-[10px] p-3 sm:p-4">
                    <Label className="text-sm font-medium text-[#4B5563] block mb-2">Trim Video</Label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                      <div className="flex-1">
                        <Label className="text-xs text-[#4B5563]">Start: {formatTime(trimStart)}</Label>
                        <Slider
                          min={0}
                          max={video.duration}
                          step={0.1}
                          value={[trimStart]}
                          onValueChange={([v]) => setTrimStart(Math.min(v, trimEnd - 1))}
                          className="w-full mt-1"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-[#4B5563]">End: {formatTime(trimEnd)}</Label>
                        <Slider
                          min={0}
                          max={video.duration}
                          step={0.1}
                          value={[trimEnd]}
                          onValueChange={([v]) => setTrimEnd(Math.max(v, trimStart + 1))}
                          className="w-full mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="bg-white rounded-[20px] shadow-xl p-4 sm:p-6 space-y-4 sm:space-y-5">
              <h3 className="font-semibold text-[#0A0A0A] flex items-center gap-2"><BsGear /> Conversion Settings</h3>

              {/* Output Format */}
              <div>
                <Label className="text-sm font-medium text-[#4B5563] block mb-2">Output Format</Label>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {formats.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setOutputFormat(f.id)}
                      className={`p-1.5 sm:p-2 rounded-[10px] text-center transition-all active:scale-95 ${outputFormat === f.id ? "bg-[#2563EB] text-white ring-2 ring-[#2563EB] ring-offset-2 ring-offset-white" : "bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#0A0A0A]"}`}
                    >
                      <div className="text-base sm:text-lg">{f.icon}</div>
                      <div className="text-[10px] sm:text-xs font-semibold">{f.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution */}
              {!["mp3", "wav"].includes(outputFormat) && (
                <div>
                  <Label className="text-sm font-medium text-[#4B5563] block mb-2">Resolution</Label>
                  <Select value={resolution} onValueChange={(v) => setResolution(v as Resolution)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {resolutions.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Frame Rate */}
              {!["mp3", "wav"].includes(outputFormat) && (
                <div>
                  <Label className="text-sm font-medium text-[#4B5563] block mb-2">Frame Rate</Label>
                  <Select value={frameRate} onValueChange={(v) => setFrameRate(v as FrameRate)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frameRates.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Quality */}
              {!["gif", "mp3", "wav"].includes(outputFormat) && (
                <div>
                  <Label className="text-sm font-medium text-[#4B5563] block mb-2">Quality (CRF: {quality})</Label>
                  <Slider
                    min={0}
                    max={51}
                    value={[quality]}
                    onValueChange={([v]) => setQuality(v)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-[#4B5563] mt-1">
                    <span>Best</span>
                    <span>Smallest</span>
                  </div>
                </div>
              )}

              {/* Remove Audio */}
              {!["mp3", "wav"].includes(outputFormat) && (
                <div className="flex items-center gap-3 py-1">
                  <Switch
                    checked={removeAudio}
                    onCheckedChange={setRemoveAudio}
                    id="remove-audio"
                  />
                  <Label htmlFor="remove-audio" className="text-sm text-[#0A0A0A] cursor-pointer">Remove audio track</Label>
                </div>
              )}

              {/* Convert Button */}
              <Button
                onClick={handleConvert}
                disabled={!video || isConverting || !ffmpegLoaded}
                className="w-full gap-2 h-12"
              >
                {isConverting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Converting... {progress}%
                  </>
                ) : (
                  <>
                    <BsDownload /> Convert to {outputFormat.toUpperCase()}
                  </>
                )}
              </Button>

              {isConverting && (
                <div className="w-full bg-[#F9FAFB] rounded-full h-2">
                  <div className="bg-[#2563EB] h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default VideoConverterLayout;
