import { useState, useRef, useCallback, useEffect } from "react";
import Navigation from "../common/Navigation";
import VideoCaptionsEditor from "./VideoCaptionsEditor";
import VideoCaptionsControls from "./VideoCaptionsControls";
import { whisperTranscriber } from "../../utils/whisperTranscription";

export interface Caption {
  id: string;
  text: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
}

export interface CaptionStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  textColor: string;
  highlightColor: string; // Color for emphasis/highlight
  backgroundColor: string;
  backgroundOpacity: number;
  position: "bottom" | "top" | "center" | "custom";
  customX: number; // percentage 0-100
  customY: number; // percentage 0-100
  padding: number;
  borderRadius: number;
  textShadow: boolean;
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
  animation: "none" | "fade" | "slide" | "typewriter" | "bounce" | "highlight" | "pop" | "karaoke" | "glow" | "shake" | "wave" | "zoom" | "flip" | "swing" | "elastic" | "neon";
  strokeColor: string; // Text stroke/outline color
  strokeWidth: number; // Text stroke width
  // New properties
  letterSpacing: number; // px
  rotation: number; // degrees
  opacity: number; // 0-100
  tiltX: number; // 3D tilt X degrees
  tiltY: number; // 3D tilt Y degrees
  curve: number; // text curve amount
  reflection: boolean; // 3D reflection effect
  reflectionOpacity: number; // reflection opacity 0-1
}

export interface VideoCaptionsState {
  videoFile: File | null;
  videoUrl: string | null;
  videoDuration: number;
  currentTime: number;
  isPlaying: boolean;
  captions: Caption[];
  selectedCaptionId: string | null;
  style: CaptionStyle;
  exportFormat: "srt" | "vtt" | "json";
  // Transcription state
  isTranscribing: boolean;
  transcriptionProgress: string;
  transcriptionPercent: number;
  // Words per caption setting
  wordsPerCaption: number;
}

export const DEFAULT_STYLE: CaptionStyle = {
  fontFamily: "Montserrat",
  fontSize: 32,
  fontWeight: 900,
  textColor: "#ffffff",
  highlightColor: "#ffff00",
  backgroundColor: "#000000",
  backgroundOpacity: 0,
  position: "center",
  customX: 50,
  customY: 50,
  padding: 8,
  borderRadius: 0,
  textShadow: true,
  textTransform: "uppercase",
  animation: "pop",
  strokeColor: "#000000",
  strokeWidth: 0,
  // New defaults
  letterSpacing: 0,
  rotation: 0,
  opacity: 100,
  tiltX: 0,
  tiltY: 0,
  curve: 0,
  reflection: false,
  reflectionOpacity: 0.3,
};

export const createDefaultCaption = (startTime: number = 0): Caption => ({
  id: crypto.randomUUID(),
  text: "Your caption here",
  startTime,
  endTime: startTime + 3,
});

const VideoCaptionsLayout = () => {
  const [state, setState] = useState<VideoCaptionsState>({
    videoFile: null,
    videoUrl: null,
    videoDuration: 0,
    currentTime: 0,
    isPlaying: false,
    captions: [],
    selectedCaptionId: null,
    style: DEFAULT_STYLE,
    exportFormat: "srt",
    // Transcription state
    isTranscribing: false,
    transcriptionProgress: "",
    transcriptionPercent: 0,
    // Words per caption
    wordsPerCaption: 0, // 0 = auto mode (default)
  });

  const videoRef = useRef<HTMLVideoElement>(null);

  // Preload Whisper model when component mounts
  useEffect(() => {
    whisperTranscriber.preloadModel();
  }, []);

  const updateState = useCallback((updates: Partial<VideoCaptionsState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateStyle = useCallback((updates: Partial<CaptionStyle>) => {
    setState((prev) => ({
      ...prev,
      style: { ...prev.style, ...updates },
    }));
  }, []);

  const handleVideoUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    updateState({
      videoFile: file,
      videoUrl: url,
      captions: [],
      selectedCaptionId: null,
      currentTime: 0,
      isPlaying: false,
    });
  }, [updateState]);

  const addCaption = useCallback(() => {
    const newCaption = createDefaultCaption(state.currentTime);
    setState((prev) => ({
      ...prev,
      captions: [...prev.captions, newCaption].sort((a, b) => a.startTime - b.startTime),
      selectedCaptionId: newCaption.id,
    }));
  }, [state.currentTime]);

  const updateCaption = useCallback((captionId: string, updates: Partial<Caption>) => {
    setState((prev) => ({
      ...prev,
      captions: prev.captions
        .map((c) => (c.id === captionId ? { ...c, ...updates } : c))
        .sort((a, b) => a.startTime - b.startTime),
    }));
  }, []);

  const deleteCaption = useCallback((captionId: string) => {
    setState((prev) => ({
      ...prev,
      captions: prev.captions.filter((c) => c.id !== captionId),
      selectedCaptionId: prev.selectedCaptionId === captionId ? null : prev.selectedCaptionId,
    }));
  }, []);

  const duplicateCaption = useCallback((captionId: string) => {
    const caption = state.captions.find((c) => c.id === captionId);
    if (!caption) return;
    
    const newCaption: Caption = {
      ...caption,
      id: crypto.randomUUID(),
      startTime: caption.endTime,
      endTime: caption.endTime + (caption.endTime - caption.startTime),
    };
    
    setState((prev) => ({
      ...prev,
      captions: [...prev.captions, newCaption].sort((a, b) => a.startTime - b.startTime),
      selectedCaptionId: newCaption.id,
    }));
  }, [state.captions]);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      updateState({ currentTime: time });
    }
  }, [updateState]);

  // Play video from a specific caption
  const playFromCaption = useCallback((captionId: string) => {
    const caption = state.captions.find((c) => c.id === captionId);
    if (!caption || !videoRef.current) return;
    
    videoRef.current.currentTime = caption.startTime;
    videoRef.current.play();
    updateState({ 
      currentTime: caption.startTime,
      isPlaying: true,
      selectedCaptionId: captionId,
    });
  }, [state.captions, updateState]);

  // Auto-transcribe video using Whisper
  const transcribeVideo = useCallback(async () => {
    if (!videoRef.current || state.isTranscribing) return;

    updateState({
      isTranscribing: true,
      transcriptionProgress: "Initializing...",
      transcriptionPercent: 0,
    });

    try {
      const result = await whisperTranscriber.transcribeVideo(
        videoRef.current,
        state.wordsPerCaption,
        (status, progress) => {
          updateState({
            transcriptionProgress: status,
            transcriptionPercent: progress || 0,
          });
        }
      );

      // Convert transcription segments to captions
      const newCaptions: Caption[] = result.segments.map((segment) => ({
        id: crypto.randomUUID(),
        text: segment.text,
        startTime: segment.start,
        endTime: segment.end,
      }));

      updateState({
        captions: newCaptions,
        isTranscribing: false,
        transcriptionProgress: "Complete!",
        transcriptionPercent: 100,
      });
    } catch (error) {
      console.error("Transcription failed:", error);
      updateState({
        isTranscribing: false,
        transcriptionProgress: "Transcription failed. Please try again.",
        transcriptionPercent: 0,
      });
    }
  }, [state.isTranscribing, state.wordsPerCaption, updateState]);

  return (
    <main className="min-h-[100vh] h-fit editor-bg relative">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-4 lg:px-0 relative">
        <div className="grid gap-5 lg:grid-cols-[3fr_1.5fr]">
          <VideoCaptionsEditor
            state={state}
            videoRef={videoRef}
            updateState={updateState}
            updateStyle={updateStyle}
            updateCaption={updateCaption}
            onVideoUpload={handleVideoUpload}
            seekTo={seekTo}
          />
          <VideoCaptionsControls
            state={state}
            updateState={updateState}
            updateStyle={updateStyle}
            addCaption={addCaption}
            updateCaption={updateCaption}
            deleteCaption={deleteCaption}
            duplicateCaption={duplicateCaption}
            seekTo={seekTo}
            transcribeVideo={transcribeVideo}
            playFromCaption={playFromCaption}
            videoRef={videoRef}
          />
        </div>
      </section>
    </main>
  );
};

export default VideoCaptionsLayout;
