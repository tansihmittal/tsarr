import { RefObject, useEffect, useState, ReactNode, useMemo, useRef } from "react";
import { BsPlayFill, BsPauseFill, BsUpload } from "react-icons/bs";
import { BiReset } from "react-icons/bi";
import { VideoCaptionsState, Caption, CaptionStyle } from "./VideoCaptionsLayout";

interface Props {
  state: VideoCaptionsState;
  videoRef: RefObject<HTMLVideoElement>;
  updateState: (updates: Partial<VideoCaptionsState>) => void;
  updateStyle: (updates: Partial<CaptionStyle>) => void;
  updateCaption: (captionId: string, updates: Partial<Caption>) => void;
  onVideoUpload: (file: File) => void;
  seekTo: (time: number) => void;
}

const VideoCaptionsEditor = ({ state, videoRef, updateState, updateStyle, updateCaption, onVideoUpload, seekTo }: Props) => {
  const [isDragging, setIsDragging] = useState(false);
  // Local time state for smoother caption updates during playback
  const [localTime, setLocalTime] = useState(0);
  
  // Dragging state for caption
  const [isDraggingCaption, setIsDraggingCaption] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  
  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, fontSize: 32 });
  const [isHoveringCaption, setIsHoveringCaption] = useState(false);

  // Get current caption based on local time (updates more frequently)
  // Use a key that changes when caption text changes to force re-render
  // Filter out empty/whitespace-only captions (silent parts)
  const currentCaption = useMemo((): Caption | null => {
    const caption = state.captions.find(
      (c) => {
        // Check if caption has actual text content (not just whitespace)
        const hasText = c.text && c.text.trim().length > 0;
        // Show caption 150ms earlier so it appears exactly when word is spoken
        const isInTimeRange = localTime >= (c.startTime - 0.15) && localTime <= c.endTime;
        return hasText && isInTimeRange;
      }
    ) || null;
    return caption;
  }, [state.captions, localTime]);

  // Force re-render when caption text changes
  const captionKey = currentCaption ? `${currentCaption.id}-${currentCaption.text}` : "none";

  // Sync local time with state time when seeking
  useEffect(() => {
    setLocalTime(state.currentTime);
  }, [state.currentTime]);

  // Initialize localTime to 0 when captions are loaded to show first caption
  useEffect(() => {
    if (state.captions.length > 0 && localTime === 0) {
      // Trigger a re-render to show caption at time 0
      setLocalTime(0.001);
      setTimeout(() => setLocalTime(0), 10);
    }
  }, [state.captions.length]);

  // Global mouse events for resize (so it works even when mouse leaves the container)
  useEffect(() => {
    if (!isResizing) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Calculate delta from start position (diagonal movement)
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      const delta = (deltaX + deltaY) / 4; // Average and scale down
      
      // Calculate new font size
      const newFontSize = Math.max(12, Math.min(150, resizeStart.fontSize + delta));
      updateStyle({ fontSize: Math.round(newFontSize) });
    };

    const handleGlobalMouseUp = () => {
      setIsResizing(false);
      setIsHoveringCaption(false);
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isResizing, resizeStart, updateStyle]);

  // Handle video time update with interval for reliable playbar updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let intervalId: NodeJS.Timeout | null = null;

    // Use interval for reliable time updates during playback
    const startInterval = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (video && !video.paused) {
          setLocalTime(video.currentTime);
        }
      }, 16); // Update every 16ms (~60fps) for instant caption sync
    };

    const stopInterval = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleTimeUpdate = () => {
      setLocalTime(video.currentTime);
      updateState({ currentTime: video.currentTime });
    };

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        updateState({ videoDuration: video.duration });
      }
    };

    const handleDurationChange = () => {
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        updateState({ videoDuration: video.duration });
      }
    };

    const handleCanPlay = () => {
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        updateState({ videoDuration: video.duration });
      }
    };

    const handleEnded = () => {
      stopInterval();
      updateState({ isPlaying: false });
    };

    const handlePlay = () => {
      updateState({ isPlaying: true });
      startInterval();
    };

    const handlePause = () => {
      stopInterval();
      updateState({ isPlaying: false });
    };

    // Also listen to seeking events
    const handleSeeking = () => {
      setLocalTime(video.currentTime);
    };

    const handleSeeked = () => {
      setLocalTime(video.currentTime);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("seeked", handleSeeked);

    // Try to get duration immediately if video is already loaded
    if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
      updateState({ videoDuration: video.duration });
    }

    // Start interval if video is already playing
    if (!video.paused) {
      startInterval();
    }

    return () => {
      stopInterval();
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("seeked", handleSeeked);
    };
  }, [videoRef, updateState, state.videoUrl]); // Re-run when video URL changes

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (state.isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    updateState({ isPlaying: !state.isPlaying });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      onVideoUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      onVideoUpload(file);
    }
  };

  const handleReset = () => {
    if (state.videoUrl) {
      URL.revokeObjectURL(state.videoUrl);
    }
    updateState({
      videoFile: null,
      videoUrl: null,
      videoDuration: 0,
      currentTime: 0,
      isPlaying: false,
      captions: [],
      selectedCaptionId: null,
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Caption style to CSS
  const getCaptionStyles = (style: CaptionStyle): React.CSSProperties => {
    const rgba = hexToRgba(style.backgroundColor, style.backgroundOpacity);
    
    // Build text shadow with optional stroke effect
    let textShadowValue = "";
    if (style.textShadow) {
      textShadowValue = "2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.5)";
    }
    if (style.strokeWidth > 0) {
      const strokeShadows = [];
      const sw = style.strokeWidth;
      for (let x = -sw; x <= sw; x++) {
        for (let y = -sw; y <= sw; y++) {
          if (x !== 0 || y !== 0) {
            strokeShadows.push(`${x}px ${y}px 0 ${style.strokeColor}`);
          }
        }
      }
      textShadowValue = textShadowValue 
        ? `${textShadowValue}, ${strokeShadows.join(", ")}`
        : strokeShadows.join(", ");
    }

    return {
      fontFamily: style.fontFamily,
      fontSize: `${style.fontSize}px`,
      fontWeight: style.fontWeight,
      color: style.textColor,
      backgroundColor: rgba,
      padding: `${style.padding}px ${style.padding * 2}px`,
      borderRadius: `${style.borderRadius}px`,
      textShadow: textShadowValue || "none",
      textTransform: style.textTransform,
      lineHeight: 1.2,
      letterSpacing: `${style.letterSpacing}px`,
      opacity: style.opacity / 100,
      transformStyle: (style.tiltX !== 0 || style.tiltY !== 0) ? "preserve-3d" : undefined,
    };
  };

  const getPositionStyles = (style: CaptionStyle): React.CSSProperties => {
    // Build transform with rotation and 3D tilt combined with position transform
    let transformParts: string[] = [];
    
    if (style.position === "custom") {
      transformParts.push("translate(-50%, -50%)");
    } else if (style.position === "center") {
      transformParts.push("translate(-50%, -50%)");
    } else {
      transformParts.push("translateX(-50%)");
    }
    
    if (style.rotation !== 0) {
      transformParts.push(`rotate(${style.rotation}deg)`);
    }
    if (style.tiltX !== 0 || style.tiltY !== 0) {
      transformParts.push(`perspective(500px) rotateX(${style.tiltX}deg) rotateY(${style.tiltY}deg)`);
    }

    const transform = transformParts.join(" ");

    if (style.position === "custom") {
      return {
        left: `${style.customX}%`,
        top: `${style.customY}%`,
        transform,
      };
    }
    switch (style.position) {
      case "top":
        return { top: "10%", left: "50%", transform };
      case "center":
        return { top: "50%", left: "50%", transform };
      default:
        return { bottom: "10%", left: "50%", transform };
    }
  };

  // Handle caption drag start
  const handleCaptionMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!videoContainerRef.current) return;
    
    setIsDraggingCaption(true);
  };

  // Handle caption drag
  const handleCaptionMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCaption || !videoContainerRef.current) return;
    
    const rect = videoContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Clamp values between 5 and 95 to keep caption visible
    const clampedX = Math.max(5, Math.min(95, x));
    const clampedY = Math.max(5, Math.min(95, y));
    
    updateStyle({ 
      position: "custom",
      customX: clampedX, 
      customY: clampedY 
    });
  };

  // Handle caption drag end
  const handleCaptionMouseUp = () => {
    setIsDraggingCaption(false);
  };

  // Handle double click to edit
  const handleCaptionDoubleClick = (caption: Caption) => {
    setIsEditing(true);
    setEditText(caption.text);
    updateState({ selectedCaptionId: caption.id });
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  // Handle edit submit
  const handleEditSubmit = () => {
    if (currentCaption && editText.trim()) {
      updateCaption(currentCaption.id, { text: editText.trim() });
    }
    setIsEditing(false);
    setEditText("");
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    setIsEditing(false);
    setEditText("");
  };

  // Handle resize start
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY, fontSize: state.style.fontSize });
  };

  // Handle resize move
  const handleResizeMouseMove = (e: React.MouseEvent) => {
    if (!isResizing) return;
    
    // Calculate delta from start position (diagonal movement)
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    const delta = (deltaX + deltaY) / 4; // Average and scale down
    
    // Calculate new font size
    const newFontSize = Math.max(12, Math.min(150, resizeStart.fontSize + delta));
    updateStyle({ fontSize: Math.round(newFontSize) });
  };

  // Handle resize end
  const handleResizeMouseUp = () => {
    setIsResizing(false);
  };

  // Handle key press in edit mode
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEditSubmit();
    } else if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  const getAnimationClass = (animation: string): string => {
    switch (animation) {
      case "fade": return "animate-caption-fade";
      case "slide": return "animate-caption-slide";
      case "typewriter": return "animate-caption-typewriter";
      case "bounce": return "animate-caption-bounce";
      case "highlight": return "animate-caption-highlight";
      case "pop": return "animate-caption-pop";
      case "karaoke": return "animate-caption-karaoke";
      case "glow": return "animate-caption-glow";
      case "shake": return "animate-caption-shake";
      case "wave": return "animate-caption-wave";
      case "zoom": return "animate-caption-zoom";
      case "flip": return "animate-caption-flip";
      case "swing": return "animate-caption-swing";
      case "elastic": return "animate-caption-elastic";
      case "neon": return "animate-caption-neon";
      default: return "";
    }
  };

  const OptionButtonOutline = ({
    title,
    onTap,
    children,
    disabled,
  }: {
    children: ReactNode;
    title: string;
    onTap?: () => void;
    disabled?: boolean;
  }) => (
    <div
      className={`text-primary-content bg-base-100 py-2.5 px-4 flex items-center justify-center gap-2.5 border border-base-200 rounded-lg transition-all duration-200 ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-base-200/50 hover:border-primary/20 hover:shadow-sm cursor-pointer press-effect"
      }`}
      onClick={disabled ? undefined : onTap}
    >
      <span className="text-lg">{children}</span>
      <span className="font-medium">{title}</span>
    </div>
  );

  return (
    <div className="flex items-center justify-start flex-col h-full w-full">
      {/* Top options */}
      <div
        style={{ pointerEvents: state.videoUrl ? "auto" : "none" }}
        className={`grid grid-cols-2 gap-2 w-full mb-3 lg:flex lg:justify-end lg:items-center ${
          state.videoUrl ? "opacity-100" : "opacity-80"
        }`}
      >
        <label htmlFor="video-upload-change">
          <input
            type="file"
            hidden
            accept="video/*"
            id="video-upload-change"
            onChange={handleFileChange}
          />
          <OptionButtonOutline title="Change Video">
            <BsUpload className="icon" />
          </OptionButtonOutline>
        </label>

        <OptionButtonOutline title="Reset" onTap={handleReset}>
          <BiReset className="icon" />
        </OptionButtonOutline>
      </div>

      {/* Editor Area */}
      <div
        className="relative w-full min-h-[500px] lg:min-h-[600px] flex items-center justify-center rounded-2xl bg-base-200/30 border border-base-200/80"
        style={{ overflow: "visible" }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {state.videoUrl ? (
          <div className="relative w-full h-full flex flex-col">
            {/* Video Container */}
            <div className="relative flex-1 flex items-center justify-center p-4">
              <div 
                ref={videoContainerRef}
                className="relative max-w-full max-h-[60vh] rounded-xl shadow-2xl overflow-hidden"
                onMouseMove={(e) => {
                  handleCaptionMouseMove(e);
                  handleResizeMouseMove(e);
                }}
                onMouseUp={() => {
                  handleCaptionMouseUp();
                  handleResizeMouseUp();
                }}
                onMouseLeave={() => {
                  handleCaptionMouseUp();
                  handleResizeMouseUp();
                }}
              >
                <video
                  ref={videoRef}
                  src={state.videoUrl}
                  preload="metadata"
                  className="max-w-full max-h-[60vh] rounded-xl"
                  onClick={togglePlay}
                  onLoadedMetadata={(e) => {
                    const video = e.currentTarget;
                    if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
                      updateState({ videoDuration: video.duration });
                    }
                  }}
                />
                
                {/* Caption Overlay - Draggable, Editable, and Resizable */}
                {currentCaption && (
                  <div
                    key={captionKey}
                    className={`absolute text-center select-none whitespace-nowrap ${
                      isDraggingCaption ? "cursor-grabbing" : "cursor-grab"
                    } ${!isEditing ? getAnimationClass(state.style.animation) : ""}`}
                    style={{
                      ...getCaptionStyles(state.style),
                      ...getPositionStyles(state.style),
                      zIndex: 20,
                      maxWidth: "none",
                    }}
                    onMouseDown={handleCaptionMouseDown}
                    onDoubleClick={() => handleCaptionDoubleClick(currentCaption)}
                    onMouseEnter={() => setIsHoveringCaption(true)}
                    onMouseLeave={() => !isResizing && setIsHoveringCaption(false)}
                  >
                    <span className="caption-text-wrapper">
                      {currentCaption.text.split(" ").map((word, idx, arr) => (
                        <span
                          key={idx}
                          className="caption-word"
                          style={{
                            display: "inline-block",
                          }}
                        >
                          {word}
                          {idx < arr.length - 1 ? "\u00A0" : ""}
                        </span>
                      ))}
                    </span>
                    
                    {/* Resize Handles - Show on hover */}
                    {(isHoveringCaption || isResizing) && !isEditing && (
                      <>
                        {/* Corner resize handles */}
                        <div
                          className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-nwse-resize hover:scale-125 transition-transform shadow-md"
                          onMouseDown={handleResizeMouseDown}
                        />
                        <div
                          className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-nesw-resize hover:scale-125 transition-transform shadow-md"
                          onMouseDown={handleResizeMouseDown}
                        />
                        <div
                          className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-nesw-resize hover:scale-125 transition-transform shadow-md"
                          onMouseDown={handleResizeMouseDown}
                        />
                        <div
                          className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-nwse-resize hover:scale-125 transition-transform shadow-md"
                          onMouseDown={handleResizeMouseDown}
                        />
                        {/* Border outline when hovering */}
                        <div className="absolute inset-0 border-2 border-primary/50 border-dashed rounded pointer-events-none" />
                      </>
                    )}
                  </div>
                )}

                {/* Play/Pause Overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity bg-black/20"
                  onClick={togglePlay}
                >
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    {state.isPlaying ? (
                      <BsPauseFill className="w-8 h-8 text-gray-800" />
                    ) : (
                      <BsPlayFill className="w-8 h-8 text-gray-800 ml-1" />
                    )}
                  </div>
                </div>

                {/* Transcription Progress Overlay - Veed.io style */}
                {state.isTranscribing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl min-w-[320px] text-center">
                      {/* Circular Progress */}
                      <div className="relative w-24 h-24 mx-auto mb-6">
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                          {/* Background circle */}
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                          />
                          {/* Progress circle */}
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="url(#progressGradient)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 45}`}
                            strokeDashoffset={`${2 * Math.PI * 45 * (1 - state.transcriptionPercent / 100)}`}
                            className="transition-all duration-500 ease-out"
                          />
                          <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#8b5cf6" />
                              <stop offset="100%" stopColor="#6366f1" />
                            </linearGradient>
                          </defs>
                        </svg>
                        {/* Percentage text */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-gray-800">
                            {Math.round(state.transcriptionPercent)}%
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Generating Subtitles
                      </h3>

                      {/* Status text */}
                      <p className="text-sm text-gray-500">
                        {state.transcriptionProgress || "...this may take a minute, hang tight!"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="p-4 bg-base-100 border-t border-base-200">
              {/* Time Display */}
              <div className="flex justify-between items-center mb-2 text-sm">
                <span className="font-mono text-primary">{formatTime(localTime)}</span>
                <span className="font-mono text-gray-500">{formatTime(state.videoDuration || 0)}</span>
              </div>

              {/* Progress Bar - Simplified for better performance */}
              <div 
                className="relative h-10 bg-gray-800 rounded-lg cursor-pointer overflow-hidden"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percent = x / rect.width;
                  const time = percent * (state.videoDuration || 0);
                  seekTo(Math.max(0, Math.min(state.videoDuration || 0, time)));
                }}
              >
                {/* Caption Markers - Rendered as a single layer */}
                <div className="absolute inset-0">
                  {state.videoDuration > 0 && state.captions.map((caption) => {
                    const left = (caption.startTime / state.videoDuration) * 100;
                    const width = Math.max(0.3, ((caption.endTime - caption.startTime) / state.videoDuration) * 100);
                    return (
                      <div
                        key={caption.id}
                        className={`absolute top-1 bottom-1 rounded-sm transition-colors ${
                          state.selectedCaptionId === caption.id
                            ? "bg-primary"
                            : "bg-primary/40 hover:bg-primary/60"
                        }`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          minWidth: "3px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateState({ selectedCaptionId: caption.id });
                          seekTo(caption.startTime);
                        }}
                      />
                    );
                  })}
                </div>
                
                {/* Progress fill */}
                <div
                  className="absolute top-0 bottom-0 left-0 bg-white/10 pointer-events-none"
                  style={{ 
                    width: state.videoDuration > 0 ? `${(localTime / state.videoDuration) * 100}%` : "0%",
                  }}
                />
                
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                  style={{ 
                    left: state.videoDuration > 0 ? `${(localTime / state.videoDuration) * 100}%` : "0%",
                    transform: "translateX(-50%)",
                  }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow" />
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex justify-center items-center gap-4 mt-3">
                <button
                  onClick={() => seekTo(Math.max(0, state.currentTime - 5))}
                  className="px-3 py-1.5 bg-base-200 hover:bg-base-300 rounded-lg text-sm font-medium transition-colors"
                >
                  -5s
                </button>
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-primary hover:bg-primary-focus text-white flex items-center justify-center shadow-lg transition-all"
                >
                  {state.isPlaying ? (
                    <BsPauseFill className="w-6 h-6" />
                  ) : (
                    <BsPlayFill className="w-6 h-6 ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => seekTo(Math.min(state.videoDuration || 0, state.currentTime + 5))}
                  className="px-3 py-1.5 bg-base-200 hover:bg-base-300 rounded-lg text-sm font-medium transition-colors"
                >
                  +5s
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Upload Prompt */
          <div className={`p-6 sm:p-8 bg-base-100 relative z-20 rounded-2xl shadow-xl shadow-black/5 animate-fade-in-scale ${isDragging ? "ring-2 ring-primary" : ""}`}>
            <div className="flex gap-1 flex-col mb-6">
              <div className="flex items-start gap-4 sm:gap-6">
                <h2 className="font-bold text-2xl text-primary-content bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text">
                  Upload Your Video
                </h2>
                <div className="text-2xl text-primary animate-pulse-soft">✦</div>
              </div>
              <span className="text-sm text-gray-500 mt-1">
                Add captions and subtitles to your videos
              </span>
            </div>

            <label
              htmlFor="video-upload-main"
              className="flex flex-col items-center justify-center gap-3 aspect-[2/1] p-8 border-2 rounded-2xl border-dashed transition-all duration-300 cursor-pointer border-gray-300 hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="p-4 rounded-full bg-primary/10 transition-transform duration-300">
                <BsUpload className="text-primary text-2xl" />
              </div>
              <input
                type="file"
                hidden
                accept="video/*"
                id="video-upload-main"
                onChange={handleFileChange}
              />
              <h3 className="text-gray-700 font-medium">
                <span className="text-primary hover:underline cursor-pointer">
                  Click to upload
                </span>{" "}
                or drag and drop
              </h3>
              <span className="text-xs text-gray-400">MP4, WebM, MOV, AVI, MKV, FLV, WMV, M4V</span>
            </label>

            <div className="grid grid-cols-1 gap-3 mt-6">
              <label
                htmlFor="video-upload-btn"
                className="btn btn-primary rounded-xl font-semibold w-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <input
                  type="file"
                  hidden
                  accept="video/*"
                  id="video-upload-btn"
                  onChange={handleFileChange}
                />
                START EDITING
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Floating Edit Modal - Outside video container to avoid clipping */}
      {isEditing && currentCaption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 min-w-[400px] max-w-[600px] mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Caption</h3>
            <input
              ref={editInputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors"
              style={{
                fontFamily: state.style.fontFamily,
                fontWeight: state.style.fontWeight,
              }}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={handleEditCancel}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-focus transition-colors"
              >
                Save
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Press Enter to save, Escape to cancel
            </p>
          </div>
        </div>
      )}

      {/* Caption Animation Styles */}
      <style jsx global>{`
        @keyframes caption-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes caption-slide {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes caption-bounce {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.05); }
        }
        @keyframes caption-highlight {
          0% { background-color: rgba(255, 255, 0, 0.8); }
          100% { background-color: inherit; }
        }
        @keyframes caption-pop {
          0% { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(0.5);
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1);
          }
        }
        @keyframes caption-karaoke {
          0% { 
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(0.95);
          }
          100% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1);
          }
        }
        @keyframes word-pop {
          0% { 
            transform: scale(0.8) translateY(3px);
          }
          60% { 
            transform: scale(1.1) translateY(-1px);
          }
          100% { 
            transform: scale(1) translateY(0);
          }
        }
        .animate-caption-fade { animation: caption-fade 0.15s ease-out forwards; }
        .animate-caption-slide { animation: caption-slide 0.15s ease-out forwards; }
        .animate-caption-bounce { animation: caption-bounce 0.2s ease-in-out forwards; }
        .animate-caption-highlight { animation: caption-highlight 0.25s ease-out forwards; }
        .animate-caption-pop { animation: caption-pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-caption-karaoke { animation: caption-karaoke 0.1s ease-out forwards; }
        
        .animate-caption-pop .caption-word,
        .animate-caption-karaoke .caption-word {
          animation: word-pop 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .animate-caption-typewriter { 
          overflow: hidden;
          white-space: nowrap;
          animation: typewriter 0.5s steps(20) forwards;
        }
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }

        /* New animations */
        @keyframes caption-glow {
          0% { opacity: 0; filter: blur(10px); }
          50% { filter: blur(0); text-shadow: 0 0 20px currentColor, 0 0 40px currentColor; }
          100% { opacity: 1; filter: blur(0); text-shadow: 0 0 10px currentColor; }
        }
        @keyframes caption-shake {
          0%, 100% { transform: translate(-50%, -50%) translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-50%, -50%) translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translate(-50%, -50%) translateX(5px); }
        }
        @keyframes caption-wave {
          0% { transform: translate(-50%, -50%) translateY(0); }
          25% { transform: translate(-50%, -50%) translateY(-8px); }
          50% { transform: translate(-50%, -50%) translateY(0); }
          75% { transform: translate(-50%, -50%) translateY(8px); }
          100% { transform: translate(-50%, -50%) translateY(0); }
        }
        @keyframes caption-zoom {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(2); filter: blur(5px); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: blur(0); }
        }
        @keyframes caption-flip {
          0% { opacity: 0; transform: translate(-50%, -50%) perspective(400px) rotateX(90deg); }
          100% { opacity: 1; transform: translate(-50%, -50%) perspective(400px) rotateX(0); }
        }
        @keyframes caption-swing {
          0% { transform: translate(-50%, -50%) rotate(-10deg); }
          25% { transform: translate(-50%, -50%) rotate(10deg); }
          50% { transform: translate(-50%, -50%) rotate(-5deg); }
          75% { transform: translate(-50%, -50%) rotate(5deg); }
          100% { transform: translate(-50%, -50%) rotate(0deg); }
        }
        @keyframes caption-elastic {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          50% { transform: translate(-50%, -50%) scale(1.15); }
          70% { transform: translate(-50%, -50%) scale(0.9); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes caption-neon {
          0%, 100% { 
            text-shadow: 0 0 5px currentColor, 0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px #ff00de, 0 0 80px #ff00de;
          }
          50% { 
            text-shadow: 0 0 2px currentColor, 0 0 5px currentColor, 0 0 10px currentColor, 0 0 20px #ff00de, 0 0 40px #ff00de;
          }
        }
        @keyframes word-wave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .animate-caption-glow { animation: caption-glow 0.25s ease-out forwards; }
        .animate-caption-shake { animation: caption-shake 0.3s ease-in-out forwards; }
        .animate-caption-wave { animation: caption-wave 0.4s ease-in-out infinite; }
        .animate-caption-zoom { animation: caption-zoom 0.2s ease-out forwards; }
        .animate-caption-flip { animation: caption-flip 0.25s ease-out forwards; }
        .animate-caption-swing { animation: caption-swing 0.3s ease-out forwards; }
        .animate-caption-elastic { animation: caption-elastic 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards; }
        .animate-caption-neon { animation: caption-neon 1.5s ease-in-out infinite; }

        .animate-caption-wave .caption-word {
          animation: word-wave 0.4s ease-in-out infinite;
        }
        .animate-caption-wave .caption-word:nth-child(odd) {
          animation-delay: 0.05s;
        }
        .animate-caption-wave .caption-word:nth-child(even) {
          animation-delay: 0.1s;
        }
        
        .caption-text-wrapper {
          display: inline-flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0;
        }
      `}</style>
    </div>
  );
};

export default VideoCaptionsEditor;
