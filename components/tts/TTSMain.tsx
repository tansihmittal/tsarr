import { ReactNode, useEffect, useState } from "react";
import { BiReset, BiCopy, BiDownload } from "react-icons/bi";
import { BsPlay, BsPause, BsStop } from "react-icons/bs";
import { HiOutlineSpeakerWave } from "react-icons/hi2";
import { toast } from "react-hot-toast";
import { useTTSContext } from "@/context/TTS";
import { generateSpeech, preloadKokoroModel } from "@/utils/kokoroTTS";

interface Props {}

const TTSMain: React.FC<Props> = () => {
  const {
    text, setText, isGenerating, setIsGenerating,
    audioUrl, setAudioUrl, audioBlob, setAudioBlob,
    progress, setProgress, progressStatus, setProgressStatus,
    error, setError, audioRef, isPlaying, setIsPlaying,
    settings, resetAll, profiles, voices,
  } = useTTSContext();

  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Preload TTS model on mount for faster generation
  useEffect(() => {
    preloadKokoroModel();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioRef, setIsPlaying]);

  const handleGenerate = async () => {
    if (!text.trim()) { toast.error("Please enter some text"); return; }
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    setProgressStatus("Initializing...");
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    setAudioBlob(null);

    try {
      const result = await generateSpeech(
        text.trim(),
        { 
          voice: settings.voice, 
          voice2: settings.voice2 || undefined,
          blendRatio: settings.blendRatio,
          speed: settings.speed,
          pitch: settings.pitch,
          reverb: settings.reverb,
        },
        (pct, status) => { setProgress(pct); setProgressStatus(status); }
      );
      setAudioUrl(result.audioUrl);
      setAudioBlob(result.audioBlob);
      setProgress(100);
      setProgressStatus("Done!");
      toast.success("Speech generated!");
      setTimeout(() => { audioRef.current?.play().catch(() => {}); }, 100);
    } catch (err: any) {
      console.error("TTS Error:", err);
      setError(err.message || "Failed to generate speech");
      toast.error(err.message || "Failed to generate speech");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  const convertToFormat = async (format: string): Promise<Blob | null> => {
    if (!audioBlob) return null;
    if (format === "wav") return audioBlob;
    
    try {
      const audioContext = new AudioContext();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start();
      
      const renderedBuffer = await offlineContext.startRendering();
      
      if (format === "mp3" || format === "ogg") {
        const wavBlob = audioBufferToWav(renderedBuffer);
        return new Blob([wavBlob], { type: format === "mp3" ? "audio/mpeg" : "audio/ogg" });
      }
      
      return audioBlob;
    } catch (err) {
      console.error("Conversion error:", err);
      return audioBlob;
    }
  };

  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const samples = buffer.length;
    const dataSize = samples * blockAlign;
    const bufferSize = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, "RIFF");
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, "data");
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < samples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    return arrayBuffer;
  };

  const handleDownload = async (format: string = "wav") => {
    if (!audioBlob) return;
    setShowDownloadMenu(false);
    
    const blob = await convertToFormat(format);
    if (!blob) { toast.error("Failed to convert audio"); return; }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tsarr-in-tts-${settings.voice}-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded as ${format.toUpperCase()}`);
  };

  const handleCopyText = () => { navigator.clipboard.writeText(text); toast.success("Text copied!"); };
  const handleReset = () => { if (confirm("Reset everything?")) { resetAll(); toast.success("Reset!"); } };

  const currentProfile = profiles.find(p => p.id === settings.voiceProfile);
  const currentVoice = voices.find(v => v.id === settings.voice);

  const OptionButton = ({ title, onTap, children, disabled, loading }: {
    children: ReactNode; title: string; onTap?: () => void; disabled?: boolean; loading?: boolean;
  }) => (
    <div
      className={`text-primary-content bg-base-100 py-2.5 px-4 flex items-center justify-center gap-2.5 border border-base-200 rounded-lg transition-all duration-200 ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-base-200/50 hover:border-primary/20 hover:shadow-sm cursor-pointer"
      }`}
      onClick={disabled ? undefined : onTap}
    >
      {loading ? <span className="loading loading-spinner loading-sm"></span> : <span className="text-lg">{children}</span>}
      <span className="font-medium">{title}</span>
    </div>
  );

  return (
    <div className="flex items-center justify-start flex-col h-full w-full">
      {/* Top options */}
      <div className="flex flex-wrap gap-2 w-full mb-3 justify-end">
        <OptionButton title={isGenerating ? "Generating..." : "Generate"} onTap={handleGenerate} disabled={isGenerating || !text.trim()} loading={isGenerating}>
          <HiOutlineSpeakerWave />
        </OptionButton>
        <OptionButton title="Copy" onTap={handleCopyText} disabled={!text.trim()}><BiCopy /></OptionButton>
        
        <div className="relative">
          <OptionButton title="Download" onTap={() => setShowDownloadMenu(!showDownloadMenu)} disabled={!audioBlob}>
            <BiDownload />
          </OptionButton>
          {showDownloadMenu && audioBlob && (
            <div className="absolute top-full mt-2 right-0 bg-base-100 border border-base-200 rounded-lg shadow-lg z-50 min-w-[140px]">
              {["wav", "mp3", "ogg"].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleDownload(fmt)}
                  className="w-full px-4 py-2.5 text-left hover:bg-base-200 first:rounded-t-lg last:rounded-b-lg text-sm font-medium"
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <OptionButton title="Reset" onTap={handleReset}><BiReset /></OptionButton>
      </div>

      {/* Badge row */}
      <div className="flex justify-between items-center mb-2 w-full flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">🧠 Kokoro 82M</span>
          {currentVoice && (
            <span className="text-xs bg-base-200 text-primary-content px-3 py-1 rounded-full font-medium">
              🎤 {currentVoice.name}
            </span>
          )}
          {currentProfile && settings.voiceProfile !== "default" && (
            <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
              {currentProfile.icon} {currentProfile.name}
            </span>
          )}
          {settings.voice2 && (
            <span className="text-xs bg-info/10 text-info px-3 py-1 rounded-full font-medium">
              🔀 Blended
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500 bg-base-200 px-3 py-1 rounded-full">{text.length} chars</span>
      </div>

      {/* Main Editor Area */}
      <div className="relative w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] flex flex-col rounded-2xl bg-base-200/30 border border-base-200/80 overflow-hidden">
        <div className="flex-1 p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to convert to speech...

Examples:
• Hello! Welcome to our text-to-speech demo.
• The quick brown fox jumps over the lazy dog.
• Kokoro is an 82 million parameter neural TTS model.

Long text is automatically chunked into sentences for better quality."
            className="w-full h-full min-h-[300px] bg-transparent resize-none outline-none text-primary-content text-lg leading-relaxed placeholder:text-gray-400"
            disabled={isGenerating}
          />
        </div>

        {/* Progress Bar */}
        {isGenerating && (
          <div className="px-4 pb-4">
            <div className="w-full bg-base-300 rounded-full h-2.5 overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-secondary h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">{progressStatus}</p>
          </div>
        )}

        {/* Audio Player */}
        {audioUrl && !isGenerating && (
          <div className="border-t border-base-200/80 p-4 bg-base-100/50">
            <audio ref={audioRef} src={audioUrl} className="hidden" />
            <div className="flex items-center gap-4">
              <button onClick={handlePlayPause} className="w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/30">
                {isPlaying ? <BsPause className="text-xl" /> : <BsPlay className="text-xl ml-0.5" />}
              </button>
              <button onClick={handleStop} className="w-10 h-10 rounded-full bg-base-200 text-primary-content flex items-center justify-center hover:bg-base-300 transition-all">
                <BsStop className="text-lg" />
              </button>
              <div className="flex-1 h-10 bg-base-200 rounded-lg flex items-center justify-center gap-0.5 px-4 overflow-hidden">
                {[...Array(40)].map((_, i) => (
                  <div key={i} className={`w-1 bg-primary/60 rounded-full transition-all duration-150 ${isPlaying ? "animate-pulse" : ""}`}
                    style={{ height: `${Math.sin(i * 0.3) * 12 + 16}px`, animationDelay: `${i * 30}ms`, opacity: isPlaying ? 1 : 0.5 }} />
                ))}
              </div>
              <button onClick={() => setShowDownloadMenu(!showDownloadMenu)} className="w-10 h-10 rounded-full bg-base-200 text-primary-content flex items-center justify-center hover:bg-base-300 transition-all" title="Download">
                <BiDownload className="text-lg" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 pb-4">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              <p className="font-medium">Error</p>
              <p className="text-red-500 mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close download menu */}
      {showDownloadMenu && <div className="fixed inset-0 z-40" onClick={() => setShowDownloadMenu(false)} />}
    </div>
  );
};

export default TTSMain;
