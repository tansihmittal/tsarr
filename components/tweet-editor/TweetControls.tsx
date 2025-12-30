import { useState, useRef, useEffect, useCallback, memo, ChangeEvent } from "react";
import { TweetEditorState } from "./TweetEditorLayout";
import { BiMessageRounded, BiReset, BiChevronRight, BiLink } from "react-icons/bi";
import { IoMdOptions } from "react-icons/io";
import { BsBookmarkFill, BsBookmark, BsTrash } from "react-icons/bs";
import { FaDice } from "react-icons/fa";
import { toast } from "react-hot-toast";
import BackgroundPicker, { BackgroundConfig } from "../common/BackgroundPicker";
import { boxShadows } from "@/data/gradients";
import { tiltDirectionArray } from "@/data/misc";
import { gereateRandomGradient } from "@/utils/randomGradient";
import useCustomPresets from "@/hooks/useCustomPresets";

interface Props {
  state: TweetEditorState;
  updateState: (updates: Partial<TweetEditorState>) => void;
}

interface TweetPresetData {
  theme: TweetEditorState["theme"];
  background: BackgroundConfig;
  cardStyle: TweetEditorState["cardStyle"];
  shadow: string;
  scale: number;
  borderRadius: number;
  padding: number;
  canvasRoundness: number;
}

const TWITTER_CHAR_LIMIT = 280;
const PRESET_STORAGE_KEY = "tweet-editor-presets";

const defaultPresets = [
  { id: "modern-dark", name: "Modern Dark", preview: "linear-gradient(to right, #667eea, #764ba2)", settings: { theme: "dark" as const, background: { type: "gradient" as const, background: "linear-gradient(to right, #667eea, #764ba2)", color1: "#667eea", color2: "#764ba2", direction: "to right" }, cardStyle: "default" as const, shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", scale: 1, borderRadius: 16, padding: 64, canvasRoundness: 8 } },
  { id: "twitter-blue", name: "Twitter Blue", preview: "linear-gradient(to right, #1da1f2, #0d8bd9)", settings: { theme: "dark" as const, background: { type: "gradient" as const, background: "linear-gradient(to right, #1da1f2, #0d8bd9)", color1: "#1da1f2", color2: "#0d8bd9", direction: "to right" }, cardStyle: "default" as const, shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", scale: 1, borderRadius: 16, padding: 64, canvasRoundness: 8 } },
  { id: "sunset", name: "Sunset", preview: "linear-gradient(to right, #fa709a, #fee140)", settings: { theme: "light" as const, background: { type: "gradient" as const, background: "linear-gradient(to right, #fa709a, #fee140)", color1: "#fa709a", color2: "#fee140", direction: "to right" }, cardStyle: "default" as const, shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", scale: 1, borderRadius: 16, padding: 64, canvasRoundness: 8 } },
  { id: "ocean", name: "Ocean", preview: "linear-gradient(to right, #2c3e50, #4ca1af)", settings: { theme: "dark" as const, background: { type: "gradient" as const, background: "linear-gradient(to right, #2c3e50, #4ca1af)", color1: "#2c3e50", color2: "#4ca1af", direction: "to right" }, cardStyle: "default" as const, shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", scale: 1, borderRadius: 16, padding: 64, canvasRoundness: 8 } },
  { id: "minimal-light", name: "Minimal Light", preview: "#f5f5f5", settings: { theme: "light" as const, background: { type: "solid" as const, background: "#f5f5f5", color1: "#f5f5f5", color2: "#f5f5f5", direction: "to right" }, cardStyle: "minimal" as const, shadow: "none", scale: 1, borderRadius: 16, padding: 64, canvasRoundness: 8 } },
  { id: "neon", name: "Neon", preview: "linear-gradient(to right, #a855f7, #ec4899)", settings: { theme: "dim" as const, background: { type: "gradient" as const, background: "linear-gradient(to right, #a855f7, #ec4899)", color1: "#a855f7", color2: "#ec4899", direction: "to right" }, cardStyle: "default" as const, shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", scale: 1, borderRadius: 16, padding: 64, canvasRoundness: 8 } },
  { id: "forest", name: "Forest", preview: "linear-gradient(to right, #134e5e, #71b280)", settings: { theme: "dark" as const, background: { type: "gradient" as const, background: "linear-gradient(to right, #134e5e, #71b280)", color1: "#134e5e", color2: "#71b280", direction: "to right" }, cardStyle: "default" as const, shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", scale: 1, borderRadius: 16, padding: 64, canvasRoundness: 8 } },
  { id: "midnight", name: "Midnight", preview: "linear-gradient(to right, #232526, #414345)", settings: { theme: "dark" as const, background: { type: "gradient" as const, background: "linear-gradient(to right, #232526, #414345)", color1: "#232526", color2: "#414345", direction: "to right" }, cardStyle: "detailed" as const, shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", scale: 1, borderRadius: 16, padding: 64, canvasRoundness: 8 } },
];

// Debounced input - stores local value and syncs after delay
const DebouncedInput = memo(({ value, onChange, className, placeholder, maxLength }: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  maxLength?: number;
}) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const isTypingRef = useRef(false);

  // Only sync from parent when not actively typing
  useEffect(() => {
    if (!isTypingRef.current && value !== localValue) {
      setLocalValue(value);
    }
  }, [value, localValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = maxLength ? e.target.value.slice(0, maxLength) : e.target.value;
    setLocalValue(newValue);
    isTypingRef.current = true;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
      isTypingRef.current = false;
    }, 500);
  };

  const handleBlur = () => {
    // Immediately sync on blur
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (localValue !== value) {
      onChange(localValue);
    }
    isTypingRef.current = false;
  };

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return <input ref={inputRef} type="text" value={localValue} onChange={handleChange} onBlur={handleBlur} className={className} placeholder={placeholder} />;
});
DebouncedInput.displayName = "DebouncedInput";

// Debounced textarea with character limit
const DebouncedTextarea = memo(({ value, onChange, className, placeholder, maxLength }: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  maxLength?: number;
}) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!isTypingRef.current && value !== localValue) {
      setLocalValue(value);
    }
  }, [value, localValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    isTypingRef.current = true;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
      isTypingRef.current = false;
    }, 500);
  };

  const handleBlur = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (localValue !== value) {
      onChange(localValue);
    }
    isTypingRef.current = false;
  };

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const charCount = localValue.length;
  const isOverLimit = maxLength ? charCount > maxLength : false;

  return (
    <div className="relative">
      <textarea value={localValue} onChange={handleChange} onBlur={handleBlur} className={className} placeholder={placeholder} />
      {maxLength && (
        <div className={`absolute bottom-2 right-2 text-xs ${isOverLimit ? "text-red-500 font-bold" : "text-gray-400"}`}>
          {charCount}/{maxLength}
        </div>
      )}
    </div>
  );
});
DebouncedTextarea.displayName = "DebouncedTextarea";

const TweetControls: React.FC<Props> = ({ state, updateState }) => {
  const [selectedTab, setSelectedTab] = useState("content");
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [tweetUrl, setTweetUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customBgInputRef = useRef<HTMLInputElement>(null);

  const { presets: customPresets, savePreset, deletePreset } = useCustomPresets<TweetPresetData>(PRESET_STORAGE_KEY);

  const getCurrentPresetData = (): TweetPresetData => ({
    theme: state.theme,
    background: state.background,
    cardStyle: state.cardStyle,
    shadow: state.shadow,
    scale: state.scale,
    borderRadius: state.borderRadius,
    padding: state.padding,
    canvasRoundness: state.canvasRoundness,
  });

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast.error("Enter a preset name");
      return;
    }
    if (savePreset(newPresetName, getCurrentPresetData())) {
      setNewPresetName("");
      toast.success("Preset saved!");
    }
  };

  const applyCustomPreset = (data: TweetPresetData) => {
    updateState(data);
    toast.success("Preset applied!");
  };

  const handleImportTweet = async () => {
    if (!tweetUrl.trim()) {
      toast.error("Please enter a tweet URL");
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch("/api/fetch-tweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: tweetUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tweet");
      }

      // Update state with fetched tweet data
      updateState({
        displayName: data.displayName,
        username: data.username,
        avatarUrl: data.avatarUrl,
        verified: data.verified,
        tweetText: data.tweetText,
        date: new Date(data.date),
        likes: data.likes,
        retweets: data.retweets,
        replies: data.replies,
        views: data.views,
        bookmarks: data.bookmarks,
      });

      setTweetUrl("");
      toast.success("Tweet imported successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import tweet");
    } finally {
      setIsImporting(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => updateState({ avatarUrl: event.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleRandomBackground = () => {
    const randomBg = gereateRandomGradient();
    updateState({
      background: {
        type: "gradient",
        background: randomBg.background,
        color1: randomBg.color1,
        color2: randomBg.color2,
        direction: randomBg.direction,
      }
    });
  };

  const handleCustomBackgroundChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      updateState({
        background: {
          type: "custom",
          background: `url(${fileUrl}) center/cover`,
          color1: "#000",
          color2: "#000",
          direction: "custom",
        }
      });
    }
  };

  const formatDateForInput = (date: Date) => date.toISOString().split("T")[0];
  const formatTimeForInput = (date: Date) => date.toTimeString().slice(0, 5);

  const handleDateChange = (dateStr: string) => {
    const newDate = new Date(state.date);
    const [year, month, day] = dateStr.split("-").map(Number);
    newDate.setFullYear(year, month - 1, day);
    updateState({ date: newDate });
  };

  const handleTimeChange = (timeStr: string) => {
    const newDate = new Date(state.date);
    const [hours, minutes] = timeStr.split(":").map(Number);
    newDate.setHours(hours, minutes);
    updateState({ date: newDate });
  };

  const PanelHeading = ({ title }: { title: string }) => (
    <h2 className="text-[0.75rem] uppercase tracking-wider font-semibold px-4 py-3 bg-gradient-to-r from-base-200/80 to-base-200/40 text-gray-600 border-b border-base-200/50 flex items-center gap-2">
      <span className="w-1 h-4 bg-primary rounded-full"></span>
      {title}
    </h2>
  );

  const Control = ({ title, children, onTap }: { title: string; children?: React.ReactNode; onTap?: () => void }) => (
    <div className={`flex items-center justify-between py-3 px-4 border-b border-base-200/60 ${onTap ? "cursor-pointer hover:bg-base-200/30" : ""}`} onClick={onTap}>
      <span className="text-primary-content font-medium text-sm">{title}</span>
      {children}
    </div>
  );

  const OptionButton = ({ title, children }: { children: React.ReactNode; title: string }) => {
    const triggerValue = title.toLowerCase();
    const isActive = selectedTab === triggerValue;
    return (
      <div
        className={`flex justify-center items-center gap-2 font-medium px-4 py-2.5 transition-all duration-200 cursor-pointer ${
          isActive ? "bg-base-100 rounded-lg shadow-sm text-primary" : "text-primary-content hover:text-primary"
        }`}
        onClick={() => setSelectedTab(triggerValue)}
      >
        <span className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>{children}</span>
        <span>{title}</span>
      </div>
    );
  };

  return (
    <section className="flex flex-col transition-opacity duration-300 opacity-100">
      <div className="grid grid-cols-3 bg-base-200/60 rounded-xl p-1 mb-3 cursor-pointer backdrop-blur-sm">
        <OptionButton title="Content"><BiMessageRounded /></OptionButton>
        <OptionButton title="Style"><IoMdOptions /></OptionButton>
        <OptionButton title="Presets"><BsBookmarkFill /></OptionButton>
      </div>

      <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
        {selectedTab === "content" ? (
          <div className="relative rounded-md">
            <PanelHeading title="Import Tweet" />

            <div className="p-4 border-b border-base-200/60">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tweetUrl}
                  onChange={(e) => setTweetUrl(e.target.value)}
                  placeholder="Paste tweet URL (twitter.com or x.com)"
                  className="input input-sm input-bordered flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleImportTweet()}
                />
                <button
                  onClick={handleImportTweet}
                  disabled={isImporting}
                  className={`btn btn-sm btn-primary ${isImporting ? "loading" : ""}`}
                >
                  {isImporting ? "" : <BiLink className="text-lg" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Paste a tweet link to auto-fill all fields
              </p>
            </div>

            <PanelHeading title="Profile" />

            <div className="py-3 px-4 border-b border-base-200/60">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full overflow-hidden bg-base-200 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {state.avatarUrl ? (
                    <img src={state.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-gray-400">+</span>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="btn btn-sm btn-outline">Upload</button>
                {state.avatarUrl && <button onClick={() => updateState({ avatarUrl: "" })} className="btn btn-sm btn-ghost text-error">Remove</button>}
              </div>
            </div>

            <Control title="Display Name">
              <DebouncedInput value={state.displayName} onChange={(v) => updateState({ displayName: v })} className="input input-sm input-bordered w-[140px]" placeholder="Your Name" maxLength={50} />
            </Control>

            <Control title="Username">
              <div className="flex items-center">
                <span className="text-gray-400 mr-1">@</span>
                <DebouncedInput value={state.username} onChange={(v) => updateState({ username: v })} className="input input-sm input-bordered w-[120px]" placeholder="username" maxLength={15} />
              </div>
            </Control>

            <Control title="Verified">
              <label className="custom-toggle">
                <input type="checkbox" checked={state.verified} onChange={(e) => updateState({ verified: e.target.checked })} />
                <span className="slider"></span>
              </label>
            </Control>

            <PanelHeading title="Tweet" />

            <div className="p-4 border-b border-base-200/60">
              <DebouncedTextarea
                value={state.tweetText}
                onChange={(v) => updateState({ tweetText: v })}
                className="w-full h-28 p-3 text-sm bg-base-200 rounded-lg border-2 border-base-300 focus:border-primary focus:outline-none resize-none"
                placeholder="What's happening?"
                maxLength={TWITTER_CHAR_LIMIT}
              />
            </div>

            <PanelHeading title="Date & Time" />

            <div className="py-3 px-4 border-b border-base-200/60">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Date</label>
                  <input type="date" value={formatDateForInput(state.date)} onChange={(e) => handleDateChange(e.target.value)} className="input input-sm input-bordered w-full" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Time</label>
                  <input type="time" value={formatTimeForInput(state.date)} onChange={(e) => handleTimeChange(e.target.value)} className="input input-sm input-bordered w-full" />
                </div>
              </div>
            </div>

            <PanelHeading title="Metrics" />

            <Control title="Likes">
              <DebouncedInput value={state.likes} onChange={(v) => updateState({ likes: v })} className="input input-sm input-bordered w-[100px]" />
            </Control>
            <Control title="Reposts">
              <DebouncedInput value={state.retweets} onChange={(v) => updateState({ retweets: v })} className="input input-sm input-bordered w-[100px]" />
            </Control>
            <Control title="Replies">
              <DebouncedInput value={state.replies} onChange={(v) => updateState({ replies: v })} className="input input-sm input-bordered w-[100px]" />
            </Control>
            <Control title="Views">
              <DebouncedInput value={state.views} onChange={(v) => updateState({ views: v })} className="input input-sm input-bordered w-[100px]" />
            </Control>
            <Control title="Bookmarks">
              <DebouncedInput value={state.bookmarks} onChange={(v) => updateState({ bookmarks: v })} className="input input-sm input-bordered w-[100px]" />
            </Control>
          </div>
        ) : selectedTab === "style" ? (
          <div className="relative rounded-md">
            <PanelHeading title="Theme" />

            <Control title="Theme">
              <div className="flex gap-1">
                {(["light", "dark", "dim"] as const).map((theme) => (
                  <button key={theme} onClick={() => updateState({ theme })} className={`px-3 py-1 rounded text-xs capitalize ${state.theme === theme ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}>
                    {theme}
                  </button>
                ))}
              </div>
            </Control>

            <Control title="Card Style">
              <div className="flex gap-1">
                {(["minimal", "default", "detailed"] as const).map((cardStyle) => (
                  <button key={cardStyle} onClick={() => updateState({ cardStyle })} className={`px-3 py-1 rounded text-xs capitalize ${state.cardStyle === cardStyle ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}>
                    {cardStyle}
                  </button>
                ))}
              </div>
            </Control>

            <PanelHeading title="Display" />

            <Control title="Show Metrics">
              <label className="custom-toggle">
                <input type="checkbox" checked={state.showMetrics} onChange={(e) => updateState({ showMetrics: e.target.checked })} />
                <span className="slider"></span>
              </label>
            </Control>
            <Control title="Show Timestamp">
              <label className="custom-toggle">
                <input type="checkbox" checked={state.showTimestamp} onChange={(e) => updateState({ showTimestamp: e.target.checked })} />
                <span className="slider"></span>
              </label>
            </Control>
            <Control title="Show Source">
              <label className="custom-toggle">
                <input type="checkbox" checked={state.showSource} onChange={(e) => updateState({ showSource: e.target.checked })} />
                <span className="slider"></span>
              </label>
            </Control>

            <Control title="Source Device">
              <div className="flex gap-1">
                {(["web", "ios", "android"] as const).map((src) => (
                  <button key={src} onClick={() => updateState({ source: src })} className={`px-2 py-1 rounded text-xs capitalize ${state.source === src ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}>
                    {src === "web" ? "Web" : src === "ios" ? "iOS" : "Android"}
                  </button>
                ))}
              </div>
            </Control>

            <PanelHeading title="Image Options" />

            {/* Shadow */}
            <div className="py-3 px-4 border-b border-base-200/60">
              <span className="text-primary-content block mb-2">Shadow</span>
              <div className="grid grid-cols-3 gap-2">
                {boxShadows.map((shadow) => (
                  <button
                    key={shadow.id}
                    onClick={() => updateState({ shadow: shadow.value })}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${state.shadow === shadow.value ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}
                  >
                    {shadow.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale */}
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Scale</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{state.scale}</span>
              </div>
              <input type="range" min="0.5" max="1.5" step="0.05" value={state.scale} onChange={(e) => updateState({ scale: Number(e.target.value) })} className="range range-xs range-primary w-full" />
            </div>

            {/* Border Radius */}
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Border Radius</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{state.borderRadius}</span>
              </div>
              <input type="range" min="0" max="32" value={state.borderRadius} onChange={(e) => updateState({ borderRadius: Number(e.target.value) })} className="range range-xs range-primary w-full" />
            </div>

            {/* Padding */}
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Padding</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{state.padding}</span>
              </div>
              <input type="range" min="0" max="160" value={state.padding} onChange={(e) => updateState({ padding: Number(e.target.value) })} className="range range-xs range-primary w-full" />
            </div>

            <PanelHeading title="Image Transforms" />

            <Control title="Tilt">
              <div className="flex gap-1">
                {tiltDirectionArray.map((dir) => (
                  <span
                    className={`text-primary-content h-8 w-8 rounded-[4px] flex justify-center items-center border-2 border-base-200 cursor-pointer hover:bg-base-200 ${state.tilt.name === dir.name && "bg-base-200"}`}
                    key={dir.id}
                    onClick={() => updateState({ tilt: { name: dir.name, value: dir.value } })}
                  >
                    {dir.icon}
                  </span>
                ))}
              </div>
            </Control>

            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Left</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{state.left}</span>
              </div>
              <input type="range" min="-100" max="100" step="5" value={state.left} onChange={(e) => updateState({ left: Number(e.target.value) })} className="range range-xs range-primary w-full" />
            </div>

            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Top</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{state.top}</span>
              </div>
              <input type="range" min="-100" max="100" step="5" value={state.top} onChange={(e) => updateState({ top: Number(e.target.value) })} className="range range-xs range-primary w-full" />
            </div>

            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Rotate</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{state.rotate}°</span>
              </div>
              <input type="range" min="-90" max="90" step="5" value={state.rotate} onChange={(e) => updateState({ rotate: Number(e.target.value) })} className="range range-xs range-primary w-full" />
            </div>

            <Control title="Reset Transforms" onTap={() => updateState({ tilt: { name: "to center", value: "rotate(0)" }, left: 0, top: 0, rotate: 0, scale: 1 })}>
              <BiReset className="text-xl" />
            </Control>

            <PanelHeading title="Background Options" />

            <div className="p-4 border-b border-base-200/60">
              <span className="text-primary-content block mb-2">Background</span>
              <div
                className="w-full h-12 rounded-lg border-2 border-base-200 cursor-pointer hover:border-primary transition-all mb-3"
                style={{ background: state.background.background }}
                onClick={() => setShowBgPicker(!showBgPicker)}
              />
              {showBgPicker && (
                <BackgroundPicker
                  background={state.background}
                  onBackgroundChange={(bg: BackgroundConfig) => updateState({ background: bg })}
                  tilt={state.tilt}
                  onTiltChange={(tilt) => updateState({ tilt })}
                  showTilt={false}
                />
              )}
            </div>

            {/* Canvas Roundness */}
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Roundness</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{state.canvasRoundness}</span>
              </div>
              <input type="range" min="0" max="20" step="1" value={state.canvasRoundness} onChange={(e) => updateState({ canvasRoundness: Number(e.target.value) })} className="range range-xs range-primary w-full" />
            </div>

            {/* Custom Background */}
            <label htmlFor="custom-background-tweet">
              <Control title="Custom Background">
                <input
                  ref={customBgInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  id="custom-background-tweet"
                  onChange={handleCustomBackgroundChange}
                />
                <BiChevronRight className="text-xl" />
              </Control>
            </label>

            {/* Random */}
            <Control title="Random" onTap={handleRandomBackground}>
              <FaDice className="text-xl" />
            </Control>

            <PanelHeading title="Miscellaneous" />

            <Control title="Noise">
              <label className="custom-toggle">
                <input type="checkbox" checked={state.noise} onChange={(e) => updateState({ noise: e.target.checked })} />
                <span className="slider"></span>
              </label>
            </Control>

            <Control title="Frame Visible">
              <label className="custom-toggle">
                <input type="checkbox" checked={state.frameVisible} onChange={(e) => updateState({ frameVisible: e.target.checked })} />
                <span className="slider"></span>
              </label>
            </Control>
          </div>
        ) : (
          <div className="p-4">
            {/* Save Current as Preset */}
            <div className="mb-6">
              <p className="text-sm font-medium text-primary-content mb-2">Save Current Style</p>
              <div className="flex gap-2">
                <input type="text" value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} className="input input-sm input-bordered flex-1" placeholder="Preset name" />
                <button onClick={handleSavePreset} className="btn btn-sm btn-primary gap-1"><BsBookmark /> Save</button>
              </div>
            </div>

            {/* Custom Presets */}
            {customPresets.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-primary-content mb-2">Your Presets</p>
                <div className="grid grid-cols-2 gap-2">
                  {customPresets.map((preset) => (
                    <div key={preset.id} className="relative group">
                      <button onClick={() => applyCustomPreset(preset.data)} className="w-full group relative overflow-hidden rounded-lg border-2 border-base-200 hover:border-primary transition-all">
                        <div className="h-12 w-full" style={{ background: preset.data.background.background }} />
                        <div className="p-2 bg-base-100 text-center">
                          <span className="text-xs font-medium text-primary-content flex items-center justify-center gap-1"><BsBookmarkFill className="text-primary" /> {preset.name}</span>
                        </div>
                      </button>
                      <button onClick={() => { deletePreset(preset.id); toast.success("Preset deleted"); }} className="absolute top-1 right-1 btn btn-xs btn-circle btn-ghost text-error opacity-0 group-hover:opacity-100 bg-base-100/80"><BsTrash /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Default Presets */}
            <p className="text-sm font-medium text-primary-content mb-2">Templates</p>
            <div className="grid grid-cols-2 gap-3">
              {defaultPresets.map((preset) => (
                <button key={preset.id} onClick={() => updateState(preset.settings)} className="group relative overflow-hidden rounded-lg border-2 border-base-200 hover:border-primary transition-all">
                  <div className="h-20 w-full" style={{ background: preset.preview }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3/4 h-10 rounded-md shadow-lg" style={{ backgroundColor: preset.settings.theme === "light" ? "#fff" : "#15202b", opacity: 0.9 }} />
                    </div>
                  </div>
                  <div className="p-2 bg-base-100 text-center">
                    <span className="text-xs font-medium text-primary-content">{preset.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default TweetControls;
