import { useState, useRef, useEffect, useCallback, memo, ChangeEvent } from "react";
import { TweetEditorState } from "./TweetEditorLayout";
import ControlPanelHeading from "../common/ControlPanelHeading";
import ControlPanelRow from "../common/ControlPanelRow";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

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
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [tweetUrl, setTweetUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customBgInputRef = useRef<HTMLInputElement>(null);

  const { presets: customPresets, savePreset, deletePreset } = useCustomPresets<TweetPresetData>(PRESET_STORAGE_KEY, "tweet-editor");

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

  const PanelHeading = ControlPanelHeading;
  const Control = ControlPanelRow;

  return (
    <section className="flex flex-col transition-opacity duration-300 opacity-100">
      <Tabs defaultValue="content">
      <TabsList className="w-full grid grid-cols-3 rounded-[12px] bg-[#F9FAFB] mb-3">
        <TabsTrigger value="content" className="gap-1.5 rounded-[10px] text-xs"><BiMessageRounded className="w-3.5 h-3.5" /> Content</TabsTrigger>
        <TabsTrigger value="style" className="gap-1.5 rounded-[10px] text-xs"><IoMdOptions className="w-3.5 h-3.5" /> Style</TabsTrigger>
        <TabsTrigger value="presets" className="gap-1.5 rounded-[10px] text-xs"><BsBookmarkFill className="w-3.5 h-3.5" /> Presets</TabsTrigger>
      </TabsList>

      <div className="rounded-[14px] border border-[#E5E7EB] bg-white shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
        <TabsContent value="content">
          <div className="relative rounded-md">
            <PanelHeading title="Import Tweet" />

            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={tweetUrl}
                  onChange={(e) => setTweetUrl(e.target.value)}
                  placeholder="Paste tweet URL (twitter.com or x.com)"
                  className="h-9 text-sm flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleImportTweet()}
                />
                <Button
                  onClick={handleImportTweet}
                  disabled={isImporting}
                  size="sm"
                >
                  {isImporting ? "" : <BiLink className="text-lg" />}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Paste a tweet link to auto-fill all fields
              </p>
            </div>

            <PanelHeading title="Profile" />

            <div className="py-3 px-4 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full overflow-hidden bg-[#F9FAFB] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {state.avatarUrl ? (
                    <img src={state.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-gray-400">+</span>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                <Button onClick={() => fileInputRef.current?.click()} variant="secondary" size="sm">Upload</Button>
                {state.avatarUrl && <Button onClick={() => updateState({ avatarUrl: "" })} variant="ghost" size="sm" className="text-[#EF4444]">Remove</Button>}
              </div>
            </div>

            <Control title="Display Name">
              <DebouncedInput value={state.displayName} onChange={(v) => updateState({ displayName: v })} className="h-9 text-sm px-3 rounded-full bg-[#EFF6FF] border border-[#E5E7EB] w-[140px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20" placeholder="Your Name" maxLength={50} />
            </Control>

            <Control title="Username">
              <div className="flex items-center">
                <span className="text-gray-400 mr-1">@</span>
                <DebouncedInput value={state.username} onChange={(v) => updateState({ username: v })} className="h-9 text-sm px-3 rounded-full bg-[#EFF6FF] border border-[#E5E7EB] w-[120px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20" placeholder="username" maxLength={15} />
              </div>
            </Control>

            <Control title="Verified">
              <Switch checked={state.verified} onCheckedChange={(v: boolean) => updateState({ verified: v })} />
            </Control>

            <PanelHeading title="Tweet" />

            <div className="p-4 border-b border-[#E5E7EB]">
              <DebouncedTextarea
                value={state.tweetText}
                onChange={(v) => updateState({ tweetText: v })}
                className="w-full h-28 p-3 text-sm bg-[#F9FAFB] rounded-[10px] border-2 border-[#E5E7EB] focus:border-[#2563EB] focus:outline-none resize-none"
                placeholder="What's happening?"
                maxLength={TWITTER_CHAR_LIMIT}
              />
            </div>

            <PanelHeading title="Date & Time" />

            <div className="py-3 px-4 border-b border-[#E5E7EB]">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Date</label>
                  <input type="date" value={formatDateForInput(state.date)} onChange={(e) => handleDateChange(e.target.value)} className="h-9 text-sm px-3 rounded-full bg-[#EFF6FF] border border-[#E5E7EB] w-full focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Time</label>
                  <input type="time" value={formatTimeForInput(state.date)} onChange={(e) => handleTimeChange(e.target.value)} className="h-9 text-sm px-3 rounded-full bg-[#EFF6FF] border border-[#E5E7EB] w-full focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20" />
                </div>
              </div>
            </div>

            <PanelHeading title="Metrics" />

            <Control title="Likes">
              <DebouncedInput value={state.likes} onChange={(v) => updateState({ likes: v })} className="h-9 text-sm px-3 rounded-full bg-[#EFF6FF] border border-[#E5E7EB] w-[100px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20" />
            </Control>
            <Control title="Reposts">
              <DebouncedInput value={state.retweets} onChange={(v) => updateState({ retweets: v })} className="h-9 text-sm px-3 rounded-full bg-[#EFF6FF] border border-[#E5E7EB] w-[100px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20" />
            </Control>
            <Control title="Replies">
              <DebouncedInput value={state.replies} onChange={(v) => updateState({ replies: v })} className="h-9 text-sm px-3 rounded-full bg-[#EFF6FF] border border-[#E5E7EB] w-[100px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20" />
            </Control>
            <Control title="Views">
              <DebouncedInput value={state.views} onChange={(v) => updateState({ views: v })} className="h-9 text-sm px-3 rounded-full bg-[#EFF6FF] border border-[#E5E7EB] w-[100px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20" />
            </Control>
            <Control title="Bookmarks">
              <DebouncedInput value={state.bookmarks} onChange={(v) => updateState({ bookmarks: v })} className="h-9 text-sm px-3 rounded-full bg-[#EFF6FF] border border-[#E5E7EB] w-[100px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20" />
            </Control>
          </div>
        </TabsContent>
        <TabsContent value="style">
          <div className="relative rounded-md">
            <PanelHeading title="Theme" />

            <Control title="Theme">
              <div className="flex gap-1">
                {(["light", "dark", "dim"] as const).map((theme) => (
                  <button key={theme} onClick={() => updateState({ theme })} className={`px-3 py-1 rounded text-xs capitalize ${state.theme === theme ? "bg-[#2563EB] text-white" : "bg-[#F9FAFB] hover:bg-[#E5E7EB]"}`}>
                    {theme}
                  </button>
                ))}
              </div>
            </Control>

            <Control title="Card Style">
              <div className="flex gap-1">
                {(["minimal", "default", "detailed"] as const).map((cardStyle) => (
                  <button key={cardStyle} onClick={() => updateState({ cardStyle })} className={`px-3 py-1 rounded text-xs capitalize ${state.cardStyle === cardStyle ? "bg-[#2563EB] text-white" : "bg-[#F9FAFB] hover:bg-[#E5E7EB]"}`}>
                    {cardStyle}
                  </button>
                ))}
              </div>
            </Control>

            <PanelHeading title="Display" />

            <Control title="Show Metrics">
              <Switch checked={state.showMetrics} onCheckedChange={(v: boolean) => updateState({ showMetrics: v })} />
            </Control>
            <Control title="Show Timestamp">
              <Switch checked={state.showTimestamp} onCheckedChange={(v: boolean) => updateState({ showTimestamp: v })} />
            </Control>
            <Control title="Show Source">
              <Switch checked={state.showSource} onCheckedChange={(v: boolean) => updateState({ showSource: v })} />
            </Control>

            <Control title="Source Device">
              <div className="flex gap-1">
                {(["web", "ios", "android"] as const).map((src) => (
                  <button key={src} onClick={() => updateState({ source: src })} className={`px-2 py-1 rounded text-xs capitalize ${state.source === src ? "bg-[#2563EB] text-white" : "bg-[#F9FAFB] hover:bg-[#E5E7EB]"}`}>
                    {src === "web" ? "Web" : src === "ios" ? "iOS" : "Android"}
                  </button>
                ))}
              </div>
            </Control>

            <PanelHeading title="Image Options" />

            {/* Shadow */}
            <div className="py-3 px-4 border-b border-[#E5E7EB]">
              <span className="text-[#0A0A0A] block mb-2">Shadow</span>
              <div className="grid grid-cols-3 gap-2">
                {boxShadows.map((shadow) => (
                  <button
                    key={shadow.id}
                    onClick={() => updateState({ shadow: shadow.value })}
                    className={`py-2 px-3 rounded-[10px] text-xs font-medium transition-all ${state.shadow === shadow.value ? "bg-[#2563EB] text-white" : "bg-[#F9FAFB] hover:bg-[#E5E7EB]"}`}
                  >
                    {shadow.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale */}
            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Scale</span>
                <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{state.scale}</span>
              </div>
              <Slider min={0.5} max={1.5} step={0.05} value={[state.scale]} onValueChange={([v]: number[]) => updateState({ scale: v })} />
            </div>

            {/* Border Radius */}
            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Border Radius</span>
                <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{state.borderRadius}</span>
              </div>
              <Slider min={0} max={32} value={[state.borderRadius]} onValueChange={([v]: number[]) => updateState({ borderRadius: v })} />
            </div>

            {/* Padding */}
            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Padding</span>
                <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{state.padding}</span>
              </div>
              <Slider min={0} max={160} value={[state.padding]} onValueChange={([v]: number[]) => updateState({ padding: v })} />
            </div>

            <PanelHeading title="Image Transforms" />

            <Control title="Tilt">
              <div className="flex gap-1">
                {tiltDirectionArray.map((dir) => (
                  <span
                    className={`text-[#0A0A0A] h-8 w-8 rounded-[4px] flex justify-center items-center border-2 border-[#E5E7EB] cursor-pointer hover:bg-[#F9FAFB] ${state.tilt.name === dir.name && "bg-[#F9FAFB]"}`}
                    key={dir.id}
                    onClick={() => updateState({ tilt: { name: dir.name, value: dir.value } })}
                  >
                    {dir.icon}
                  </span>
                ))}
              </div>
            </Control>

            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Left</span>
                <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{state.left}</span>
              </div>
              <Slider min={-100} max={100} step={5} value={[state.left]} onValueChange={([v]: number[]) => updateState({ left: v })} />
            </div>

            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Top</span>
                <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{state.top}</span>
              </div>
              <Slider min={-100} max={100} step={5} value={[state.top]} onValueChange={([v]: number[]) => updateState({ top: v })} />
            </div>

            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Rotate</span>
                <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{state.rotate}°</span>
              </div>
              <Slider min={-90} max={90} step={5} value={[state.rotate]} onValueChange={([v]: number[]) => updateState({ rotate: v })} />
            </div>

            <Control title="Reset Transforms" onTap={() => updateState({ tilt: { name: "to center", value: "rotate(0)" }, left: 0, top: 0, rotate: 0, scale: 1 })}>
              <BiReset className="text-xl" />
            </Control>

            <PanelHeading title="Background Options" />

            <div className="p-4 border-b border-[#E5E7EB]">
              <span className="text-[#0A0A0A] block mb-2">Background</span>
              <div
                className="w-full h-12 rounded-[10px] border-2 border-[#E5E7EB] cursor-pointer hover:border-[#2563EB] transition-all mb-3"
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
            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Roundness</span>
                <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{state.canvasRoundness}</span>
              </div>
              <Slider min={0} max={20} step={1} value={[state.canvasRoundness]} onValueChange={([v]: number[]) => updateState({ canvasRoundness: v })} />
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
              <Switch checked={state.noise} onCheckedChange={(v: boolean) => updateState({ noise: v })} />
            </Control>

            <Control title="Frame Visible">
              <Switch checked={state.frameVisible} onCheckedChange={(v: boolean) => updateState({ frameVisible: v })} />
            </Control>
          </div>
        </TabsContent>
        <TabsContent value="presets">
          <div className="p-4">
            {/* Save Current as Preset */}
            <div className="mb-6">
              <p className="text-sm font-medium text-[#0A0A0A] mb-2">Save Current Style</p>
              <div className="flex gap-2">
                <Input type="text" value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} className="h-9 text-sm flex-1" placeholder="Preset name" />
                <Button onClick={handleSavePreset} size="sm" className="gap-1"><BsBookmark /> Save</Button>
              </div>
            </div>

            {/* Custom Presets */}
            {customPresets.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-[#0A0A0A] mb-2">Your Presets</p>
                <div className="grid grid-cols-2 gap-2">
                  {customPresets.map((preset) => (
                    <div key={preset.id} className="relative group">
                      <button onClick={() => applyCustomPreset(preset.data)} className="w-full group relative overflow-hidden rounded-[10px] border-2 border-[#E5E7EB] hover:border-[#2563EB] transition-all">
                        <div className="h-12 w-full" style={{ background: preset.data.background.background }} />
                        <div className="p-2 bg-white text-center">
                          <span className="text-xs font-medium text-[#0A0A0A] flex items-center justify-center gap-1"><BsBookmarkFill className="text-[#2563EB]" /> {preset.name}</span>
                        </div>
                      </button>
                      <button onClick={() => { deletePreset(preset.id); toast.success("Preset deleted"); }} className="absolute top-1 right-1 h-7 w-7 flex items-center justify-center rounded-full text-[#EF4444] opacity-0 group-hover:opacity-100 bg-white/80 hover:bg-white transition-opacity"><BsTrash className="text-xs" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Default Presets */}
            <p className="text-sm font-medium text-[#0A0A0A] mb-2">Templates</p>
            <div className="grid grid-cols-2 gap-3">
              {defaultPresets.map((preset) => (
                <button key={preset.id} onClick={() => updateState(preset.settings)} className="group relative overflow-hidden rounded-[10px] border-2 border-[#E5E7EB] hover:border-[#2563EB] transition-all">
                  <div className="h-20 w-full" style={{ background: preset.preview }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3/4 h-10 rounded-md shadow-lg" style={{ backgroundColor: preset.settings.theme === "light" ? "#fff" : "#15202b", opacity: 0.9 }} />
                    </div>
                  </div>
                  <div className="p-2 bg-white text-center">
                    <span className="text-xs font-medium text-[#0A0A0A]">{preset.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>
      </div>
      </Tabs>
    </section>
  );
};

export default TweetControls;
