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

        // Log all FFmpeg events for debugging
        ffmpeg.on("log", ({ message }: { message: string }) => {
          console.log("[FFmpeg]", message);
        });

        ffmpeg.on("progress", ({ progress, time }: { progress: number; time: number }) => {
          console.log("[FFmpeg Progress]", progress, time);
          // Progress can be NaN or negative sometimes, handle it
          const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));
          setProgress(pct);
        });

        // Use single-threaded version for stability
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

        await ffmpeg.load({
          coreURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            "text/javascript"
          ),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            "application/wasm"
          ),
        });

        setFfmpegLoaded(true);
        setLoadError(null);
        console.log("FFmpeg loaded successfully");
      } catch (error) {
        console.error("Failed to load FFmpeg:", error);
        setLoadError(
          "Failed to load converter. Please refresh or try a different browser."
        );
        toast.error("Failed to load video converter");
      }
    };
    loadFFmpeg();
  }, []);


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

      console.log("Writing input file...");
      await ffmpeg.writeFile(inputName, await fetchFile(video.file));
      console.log("Input file written");

      // Build simpler FFmpeg arguments
      const args: string[] = ["-i", inputName];

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

      console.log("FFmpeg args:", args.join(" "));
      
      const result = await ffmpeg.exec(args);
      console.log("FFmpeg exec result:", result);

      const data = await ffmpeg.readFile(outputName);
      console.log("Output file size:", (data as Uint8Array).length);
      
      // eslint-disable-next-line
      const blob = new Blob([data as any], { 
        type: outputFormat === "mp3" ? "audio/mpeg" : outputFormat === "wav" ? "audio/wav" : `video/${outputFormat}` 
      });
      const downloadUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `converted.${outputFormat}`;
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
    <main className="min-h-[100vh] h-fit editor-bg relative">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-4 lg:px-0 relative py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-content mb-2">
              Video Converter
            </h1>
            <p className="text-primary-content/60">
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

          <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
            {/* Preview Area */}
            <div className="bg-base-100 rounded-2xl shadow-xl p-6">
              {!video ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-base-300 rounded-2xl p-12 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,audio/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <BsUpload className="text-4xl text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-primary-content mb-2">Upload Video</h2>
                  <p className="text-primary-content/60 mb-2">Drag & drop or click to browse</p>
                  <p className="text-xs text-primary-content/40">Supports MP4, WebM, AVI, MOV, MKV, and more</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Video Preview */}
                  <div className="relative bg-black rounded-xl overflow-hidden">
                    <video
                      ref={videoRef}
                      src={video.url}
                      className="w-full max-h-[400px] object-contain"
                      onEnded={() => setIsPlaying(false)}
                    />
                    <button
                      onClick={togglePlay}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      {isPlaying ? <BsPauseFill className="text-6xl text-white" /> : <BsPlayFill className="text-6xl text-white" />}
                    </button>
                    <button onClick={handleClear} className="absolute top-3 right-3 btn btn-sm btn-circle btn-ghost bg-base-100/80">
                      <BsTrash />
                    </button>
                  </div>

                  {/* Video Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="bg-base-200 rounded-lg p-3 text-center">
                      <div className="text-primary-content/60">Duration</div>
                      <div className="font-semibold text-primary-content">{formatTime(video.duration)}</div>
                    </div>
                    <div className="bg-base-200 rounded-lg p-3 text-center">
                      <div className="text-primary-content/60">Resolution</div>
                      <div className="font-semibold text-primary-content">{video.width}×{video.height}</div>
                    </div>
                    <div className="bg-base-200 rounded-lg p-3 text-center">
                      <div className="text-primary-content/60">Size</div>
                      <div className="font-semibold text-primary-content">{formatSize(video.size)}</div>
                    </div>
                    <div className="bg-base-200 rounded-lg p-3 text-center">
                      <div className="text-primary-content/60">Format</div>
                      <div className="font-semibold text-primary-content">{video.name.split(".").pop()?.toUpperCase()}</div>
                    </div>
                  </div>

                  {/* Trim Controls */}
                  <div className="bg-base-200 rounded-lg p-4">
                    <label className="text-sm font-medium text-primary-content/70 block mb-2">Trim Video</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-xs text-primary-content/60">Start: {formatTime(trimStart)}</label>
                        <input type="range" min="0" max={video.duration} step="0.1" value={trimStart} onChange={(e) => setTrimStart(Math.min(Number(e.target.value), trimEnd - 1))} className="range range-primary range-sm w-full" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-primary-content/60">End: {formatTime(trimEnd)}</label>
                        <input type="range" min="0" max={video.duration} step="0.1" value={trimEnd} onChange={(e) => setTrimEnd(Math.max(Number(e.target.value), trimStart + 1))} className="range range-primary range-sm w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="bg-base-100 rounded-2xl shadow-xl p-6 space-y-5">
              <h3 className="font-semibold text-primary-content flex items-center gap-2"><BsGear /> Conversion Settings</h3>

              {/* Output Format */}
              <div>
                <label className="text-sm font-medium text-primary-content/70 block mb-2">Output Format</label>
                <div className="grid grid-cols-4 gap-2">
                  {formats.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setOutputFormat(f.id)}
                      className={`p-2 rounded-lg text-center transition-all ${outputFormat === f.id ? "bg-primary text-white ring-2 ring-primary ring-offset-2 ring-offset-base-100" : "bg-base-200 hover:bg-base-300 text-primary-content"}`}
                    >
                      <div className="text-lg">{f.icon}</div>
                      <div className="text-xs font-semibold">{f.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution */}
              {!["mp3", "wav"].includes(outputFormat) && (
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Resolution</label>
                  <select value={resolution} onChange={(e) => setResolution(e.target.value as Resolution)} className="select select-bordered w-full">
                    {resolutions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              )}

              {/* Frame Rate */}
              {!["mp3", "wav"].includes(outputFormat) && (
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Frame Rate</label>
                  <select value={frameRate} onChange={(e) => setFrameRate(e.target.value as FrameRate)} className="select select-bordered w-full">
                    {frameRates.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              )}

              {/* Quality */}
              {!["gif", "mp3", "wav"].includes(outputFormat) && (
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Quality (CRF: {quality})</label>
                  <input type="range" min="0" max="51" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="range range-primary w-full" />
                  <div className="flex justify-between text-xs text-primary-content/50 mt-1">
                    <span>Best (larger file)</span>
                    <span>Worst (smaller file)</span>
                  </div>
                </div>
              )}

              {/* Remove Audio */}
              {!["mp3", "wav"].includes(outputFormat) && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={removeAudio} onChange={(e) => setRemoveAudio(e.target.checked)} className="checkbox checkbox-primary" />
                  <span className="text-sm text-primary-content">Remove audio track</span>
                </label>
              )}

              {/* Convert Button */}
              <button
                onClick={handleConvert}
                disabled={!video || isConverting || !ffmpegLoaded}
                className="btn btn-primary w-full gap-2"
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
              </button>

              {isConverting && (
                <div className="w-full bg-base-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
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
