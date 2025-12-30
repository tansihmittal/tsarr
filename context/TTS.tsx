import React, { createContext, useState, useContext, ReactNode, useRef, useEffect } from "react";
import { getKokoroVoices, voiceProfiles } from "@/utils/kokoroTTS";

export interface TTSSettings {
  voice: string;
  voice2: string;       // Secondary voice for blending
  blendRatio: number;   // 0-1 blend ratio
  speed: number;
  pitch: number;        // -12 to +12 semitones
  reverb: number;       // 0-1
  voiceProfile: string; // Preset profile ID
}

export interface DeviceInfo {
  hasWebGPU: boolean;
  cores: number;
  memory: number | null;
  connectionType: string;
}

export interface Voice {
  id: string;
  name: string;
  lang: string;
  gender: string;
  desc: string;
}

export interface VoiceProfile {
  id: string;
  name: string;
  icon: string;
  pitch: number;
  reverb: number;
  desc: string;
}

export interface TTSContextProps {
  text: string;
  setText: (text: string) => void;
  settings: TTSSettings;
  updateSettings: (key: keyof TTSSettings, value: any) => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  audioUrl: string | null;
  setAudioUrl: (url: string | null) => void;
  audioBlob: Blob | null;
  setAudioBlob: (blob: Blob | null) => void;
  progress: number;
  setProgress: (value: number) => void;
  progressStatus: string;
  setProgressStatus: (status: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
  deviceInfo: DeviceInfo;
  resetAll: () => void;
  voices: Voice[];
  profiles: VoiceProfile[];
  applyProfile: (profileId: string) => void;
}

const defaultDeviceInfo: DeviceInfo = {
  hasWebGPU: false,
  cores: 4,
  memory: null,
  connectionType: "4g",
};

const defaultSettings: TTSSettings = {
  voice: "af_sky",
  voice2: "",
  blendRatio: 0,
  speed: 1.0,
  pitch: 0,
  reverb: 0,
  voiceProfile: "default",
};

const TTSContext = createContext<TTSContextProps | null>(null);

interface Props {
  children: ReactNode;
}

export const TTSContextProvider: React.FC<Props> = ({ children }) => {
  const [text, setText] = useState("");
  const [settings, setSettings] = useState<TTSSettings>(defaultSettings);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(defaultDeviceInfo);
  const audioRef = useRef<HTMLAudioElement>(null);

  const voices = getKokoroVoices();
  const profiles = voiceProfiles;

  // Detect device capabilities on mount
  useEffect(() => {
    const detectCapabilities = async () => {
      let hasWebGPU = false;
      if (typeof navigator !== "undefined" && "gpu" in navigator) {
        try {
          const adapter = await (navigator as any).gpu.requestAdapter();
          hasWebGPU = adapter !== null;
        } catch {}
      }
      
      const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4;
      const memory = typeof navigator !== "undefined" ? (navigator as any).deviceMemory || null : null;
      
      let connectionType = "4g";
      if (typeof navigator !== "undefined") {
        const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        if (conn) connectionType = conn.effectiveType || "4g";
      }
      
      setDeviceInfo({ hasWebGPU, cores, memory, connectionType });
    };
    
    detectCapabilities();
  }, []);

  const updateSettings = (key: keyof TTSSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const applyProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setSettings(prev => ({
        ...prev,
        voiceProfile: profileId,
        pitch: profile.pitch,
        reverb: profile.reverb,
      }));
    }
  };

  const resetAll = () => {
    setText("");
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setProgress(0);
    setProgressStatus("");
    setError(null);
    setIsPlaying(false);
  };

  return (
    <TTSContext.Provider
      value={{
        text, setText, settings, updateSettings,
        isGenerating, setIsGenerating,
        audioUrl, setAudioUrl,
        audioBlob, setAudioBlob,
        progress, setProgress,
        progressStatus, setProgressStatus,
        error, setError,
        audioRef, isPlaying, setIsPlaying,
        deviceInfo, resetAll,
        voices, profiles, applyProfile,
      }}
    >
      {children}
    </TTSContext.Provider>
  );
};

export function useTTSContext() {
  const context = useContext(TTSContext);
  if (!context) throw new Error("useTTSContext must be used within TTSContextProvider");
  return context;
}
