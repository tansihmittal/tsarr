import { useState, useRef, useEffect, memo } from "react";
import ControlPanelHeading from "../common/ControlPanelHeading";
import ControlPanelRow from "../common/ControlPanelRow";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CarouselEditorState, SlideContent } from "./CarouselEditorLayout";
import { BiSlideshow, BiPlus, BiTrash, BiUser, BiChevronRight } from "react-icons/bi";
import { IoMdOptions } from "react-icons/io";
import { BsBookmarkFill, BsImage, BsLink, BsTrash } from "react-icons/bs";
import { FaDice } from "react-icons/fa";
import { toast } from "react-hot-toast";
import BackgroundPicker, { BackgroundConfig } from "../common/BackgroundPicker";
import { gereateRandomGradient } from "@/utils/randomGradient";
import useCustomPresets from "@/hooks/useCustomPresets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface Props {
  state: CarouselEditorState;
  updateState: (updates: Partial<CarouselEditorState>) => void;
}

interface CarouselPresetData {
  background: BackgroundConfig;
  aspectRatio: { name: string; value: string };
  slideLayout: CarouselEditorState["slideLayout"];
  textAlign: "left" | "center" | "right";
  padding: number;
  borderRadius: number;
  headlineColor: string;
  subheadlineColor: string;
  descriptionColor: string;
  websiteUrlColor: string;
  headlineSize: number;
  subheadlineSize: number;
  descriptionSize: number;
  headlineWeight: string;
  imageShadow: string;
  imageRadius: number;
}

const PRESET_STORAGE_KEY = "carousel-editor-presets";

const generateId = () => Math.random().toString(36).substring(2, 11);

const DebouncedInput = memo(({ value, onChange, className, placeholder }: { value: string; onChange: (v: string) => void; className?: string; placeholder?: string }) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isTypingRef = useRef(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!isTypingRef.current && value !== localValue) setLocalValue(value); }, [value]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value); isTypingRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => { onChange(e.target.value); isTypingRef.current = false; }, 500);
  };
  const handleBlur = () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); if (localValue !== value) onChange(localValue); isTypingRef.current = false; };
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);
  return <input type="text" value={localValue} onChange={handleChange} onBlur={handleBlur} className={className} placeholder={placeholder} />;
});
DebouncedInput.displayName = "DebouncedInput";

const DebouncedTextarea = memo(({ value, onChange, className, placeholder }: { value: string; onChange: (v: string) => void; className?: string; placeholder?: string }) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isTypingRef = useRef(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!isTypingRef.current && value !== localValue) setLocalValue(value); }, [value]);
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value); isTypingRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => { onChange(e.target.value); isTypingRef.current = false; }, 500);
  };
  const handleBlur = () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); if (localValue !== value) onChange(localValue); isTypingRef.current = false; };
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);
  return <textarea value={localValue} onChange={handleChange} onBlur={handleBlur} className={className} placeholder={placeholder} />;
});
DebouncedTextarea.displayName = "DebouncedTextarea";

const aspectRatios = [{ id: 1, name: "1:1", value: "1/1" }, { id: 2, name: "4:5", value: "4/5" }, { id: 3, name: "9:16", value: "9/16" }, { id: 4, name: "16:9", value: "16/9" }];
const imageShadows = [
  { id: 1, name: "None", value: "none" },
  { id: 2, name: "Soft", value: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" },
  { id: 3, name: "Medium", value: "0 10px 25px -5px rgba(0, 0, 0, 0.2)" },
  { id: 4, name: "Strong", value: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" },
  { id: 5, name: "Heavy", value: "0 35px 60px -15px rgba(0, 0, 0, 0.35)" },
];

const presets = [
  {
    id: "tips",
    name: "Tips & Tricks",
    preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    slides: [
      { id: generateId(), headline: "5 Tips to Boost Productivity", subheadline: "Work smarter, not harder", description: "Simple changes that make a big difference", image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=300&fit=crop", appIcon: "", websiteUrl: "", ctaText: "Swipe →", ctaVisible: true, showNumber: true, number: "01" },
      { id: generateId(), headline: "Start Your Day Early", subheadline: "Morning routines matter", description: "Wake up 1 hour earlier to plan your day", image: "", appIcon: "", websiteUrl: "", ctaText: "Next →", ctaVisible: true, showNumber: true, number: "02" },
      { id: generateId(), headline: "Take Regular Breaks", subheadline: "Rest to perform better", description: "Use the Pomodoro technique: 25 min work, 5 min break", image: "", appIcon: "", websiteUrl: "", ctaText: "Next →", ctaVisible: true, showNumber: true, number: "03" },
    ],
    settings: { background: { type: "gradient" as const, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color1: "#667eea", color2: "#764ba2", direction: "135deg" }, headlineColor: "#ffffff", subheadlineColor: "#e0e0e0", descriptionColor: "#d0d0d0" }
  },
  {
    id: "story",
    name: "Story",
    preview: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    slides: [
      { id: generateId(), headline: "My Journey", subheadline: "From zero to hero", description: "How I built my first successful product", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop", appIcon: "", websiteUrl: "", ctaText: "Read more →", ctaVisible: true, showNumber: false, number: "" },
      { id: generateId(), headline: "The Beginning", subheadline: "Where it all started", description: "I had an idea but no resources", image: "", appIcon: "", websiteUrl: "", ctaText: "Continue →", ctaVisible: true, showNumber: false, number: "" },
      { id: generateId(), headline: "The Breakthrough", subheadline: "Everything changed", description: "One decision that transformed everything", image: "", appIcon: "", websiteUrl: "", ctaText: "Finish →", ctaVisible: true, showNumber: false, number: "" },
    ],
    settings: { background: { type: "gradient" as const, background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color1: "#f093fb", color2: "#f5576c", direction: "135deg" }, headlineColor: "#ffffff", subheadlineColor: "#fce4ec", descriptionColor: "#fce4ec" }
  },
  {
    id: "educational",
    name: "Educational",
    preview: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    slides: [
      { id: generateId(), headline: "Learn JavaScript", subheadline: "Master the basics", description: "The most popular programming language", image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=300&fit=crop", appIcon: "", websiteUrl: "", ctaText: "Start →", ctaVisible: true, showNumber: true, number: "1" },
      { id: generateId(), headline: "Variables & Types", subheadline: "Foundation concepts", description: "let, const, var - when to use each", image: "", appIcon: "", websiteUrl: "", ctaText: "Next →", ctaVisible: true, showNumber: true, number: "2" },
      { id: generateId(), headline: "Functions", subheadline: "Building blocks", description: "Create reusable code with functions", image: "", appIcon: "", websiteUrl: "", ctaText: "Practice →", ctaVisible: true, showNumber: true, number: "3" },
    ],
    settings: { background: { type: "gradient" as const, background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", color1: "#4facfe", color2: "#00f2fe", direction: "135deg" }, headlineColor: "#1a1a2e", subheadlineColor: "#374151", descriptionColor: "#4b5563" }
  },
  {
    id: "minimal",
    name: "Minimal",
    preview: "#f8fafc",
    slides: [
      { id: generateId(), headline: "Less is More", subheadline: "Embrace simplicity", description: "Clean design speaks louder", image: "", appIcon: "", websiteUrl: "", ctaText: "", ctaVisible: false, showNumber: false, number: "" },
      { id: generateId(), headline: "Focus on What Matters", subheadline: "Remove distractions", description: "Quality over quantity", image: "", appIcon: "", websiteUrl: "", ctaText: "", ctaVisible: false, showNumber: false, number: "" },
    ],
    settings: { background: { type: "solid" as const, background: "#f8fafc", color1: "#f8fafc", color2: "#f8fafc", direction: "to right" }, headlineColor: "#1a1a2e", subheadlineColor: "#6b7280", descriptionColor: "#9ca3af" }
  },
  {
    id: "app-showcase",
    name: "App Showcase",
    preview: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
    slides: [
      { id: generateId(), headline: "Introducing Our App", subheadline: "The better way to work", description: "100% free, no subscription needed", image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop", appIcon: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=64&h=64&fit=crop", websiteUrl: "yourapp.com", ctaText: "Download", ctaVisible: true, showNumber: false, number: "" },
      { id: generateId(), headline: "All Features Included", subheadline: "No premium tier", description: "Everything you need in one place", image: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop", appIcon: "", websiteUrl: "", ctaText: "Try it →", ctaVisible: true, showNumber: true, number: "01" },
      { id: generateId(), headline: "Get Started Today", subheadline: "Join 10k+ users", description: "Download now and see the difference", image: "", appIcon: "", websiteUrl: "yourapp.com", ctaText: "Download", ctaVisible: true, showNumber: false, number: "" },
    ],
    settings: { background: { type: "gradient" as const, background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)", color1: "#a855f7", color2: "#ec4899", direction: "135deg" }, headlineColor: "#ffffff", subheadlineColor: "#f3e8ff", descriptionColor: "#e9d5ff", slideLayout: "app-showcase" as const }
  },
];

const CarouselControls: React.FC<Props> = ({ state, updateState }) => {
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [appIconUrlInput, setAppIconUrlInput] = useState("");
  const [newPresetName, setNewPresetName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const appIconInputRef = useRef<HTMLInputElement>(null);
  const profileImageRef = useRef<HTMLInputElement>(null);
  const customBgInputRef = useRef<HTMLInputElement>(null);

  const { presets: customPresets, savePreset, deletePreset } = useCustomPresets<CarouselPresetData>(PRESET_STORAGE_KEY, "carousel-editor");

  const currentSlide = state.slides[state.currentSlide];

  const getCurrentPresetData = (): CarouselPresetData => ({
    background: state.background,
    aspectRatio: state.aspectRatio,
    slideLayout: state.slideLayout,
    textAlign: state.textAlign,
    padding: state.padding,
    borderRadius: state.borderRadius,
    headlineColor: state.headlineColor,
    subheadlineColor: state.subheadlineColor,
    descriptionColor: state.descriptionColor,
    websiteUrlColor: state.websiteUrlColor,
    headlineSize: state.headlineSize,
    subheadlineSize: state.subheadlineSize,
    descriptionSize: state.descriptionSize,
    headlineWeight: state.headlineWeight,
    imageShadow: state.imageShadow,
    imageRadius: state.imageRadius,
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

  const applyCustomPreset = (data: CarouselPresetData) => {
    updateState(data);
    toast.success("Preset applied!");
  };

  const updateSlide = (slideId: string, updates: Partial<SlideContent>) => {
    const newSlides = state.slides.map(s => s.id === slideId ? { ...s, ...updates } : s);
    updateState({ slides: newSlides });
  };

  const addSlide = () => {
    const newSlide: SlideContent = {
      id: generateId(), headline: "New Slide", subheadline: "Add your content", description: "",
      image: "", appIcon: "", websiteUrl: "", ctaText: "Next →",
      ctaVisible: true, showNumber: false, number: String(state.slides.length + 1),
    };
    updateState({ slides: [...state.slides, newSlide], currentSlide: state.slides.length });
    toast.success("Slide added");
  };

  const deleteSlide = (slideId: string) => {
    if (state.slides.length <= 1) { toast.error("Need at least one slide"); return; }
    const newSlides = state.slides.filter(s => s.id !== slideId);
    const newCurrentSlide = Math.min(state.currentSlide, newSlides.length - 1);
    updateState({ slides: newSlides, currentSlide: newCurrentSlide });
    toast.success("Slide deleted");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => updateSlide(currentSlide.id, { image: event.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrl = () => {
    if (imageUrlInput.trim()) {
      updateSlide(currentSlide.id, { image: imageUrlInput.trim() });
      setImageUrlInput("");
      toast.success("Image added from URL");
    }
  };

  const handleAppIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => updateSlide(currentSlide.id, { appIcon: event.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleAppIconUrl = () => {
    if (appIconUrlInput.trim()) {
      updateSlide(currentSlide.id, { appIcon: appIconUrlInput.trim() });
      setAppIconUrlInput("");
      toast.success("App icon added from URL");
    }
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => updateState({ profileImage: event.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      updateState({ background: { type: "custom", background: `url(${fileUrl}) center/cover`, color1: "#000", color2: "#000", direction: "custom" } });
    }
  };

  const handleRandomBackground = () => {
    const randomBg = gereateRandomGradient();
    updateState({ background: { type: "gradient", background: randomBg.background, color1: randomBg.color1, color2: randomBg.color2, direction: randomBg.direction } });
  };

  const applyPreset = (preset: typeof presets[0]) => {
    updateState({
      slides: preset.slides.map(s => ({ ...s, id: generateId() })),
      currentSlide: 0,
      background: preset.settings.background,
      headlineColor: preset.settings.headlineColor,
      subheadlineColor: preset.settings.subheadlineColor,
      descriptionColor: preset.settings.descriptionColor,
      ...(preset.settings.slideLayout && { slideLayout: preset.settings.slideLayout }),
    });
    toast.success(`Applied "${preset.name}" preset`);
  };

  const PanelHeading = ControlPanelHeading;
  const Control = ControlPanelRow;

  return (
    <section className="flex flex-col transition-opacity duration-300 opacity-100">
      <Tabs defaultValue="slides">
      <TabsList className="w-full grid grid-cols-4 rounded-[12px] bg-[#EFF6FF] mb-3">
        <TabsTrigger value="slides" className="gap-1 rounded-[10px] text-xs"><BiSlideshow className="w-3.5 h-3.5" /> Slides</TabsTrigger>
        <TabsTrigger value="profile" className="gap-1 rounded-[10px] text-xs"><BiUser className="w-3.5 h-3.5" /> Profile</TabsTrigger>
        <TabsTrigger value="style" className="gap-1 rounded-[10px] text-xs"><IoMdOptions className="w-3.5 h-3.5" /> Style</TabsTrigger>
        <TabsTrigger value="presets" className="gap-1 rounded-[10px] text-xs"><BsBookmarkFill className="w-3.5 h-3.5" /> Presets</TabsTrigger>
      </TabsList>

      <div className="rounded-[14px] border border-[#E5E7EB] bg-white shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
        <TabsContent value="slides">
          <div className="relative rounded-md">
            <PanelHeading title="Slides" />
            <div className="p-3 border-b border-[#E5E7EB]">
              <div className="flex flex-wrap gap-2 mb-3">
                {state.slides.map((slide, index) => (
                  <button key={slide.id} onClick={() => updateState({ currentSlide: index })} className={`relative px-3 py-2 rounded-[10px] text-sm font-medium transition-all ${index === state.currentSlide ? "bg-[#2563EB] text-white" : "bg-[#F9FAFB] hover:bg-[#E5E7EB]"}`}>
                    {index + 1}
                    {state.slides.length > 1 && (
                      <span onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }} className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] text-white rounded-full text-xs flex items-center justify-center hover:bg-[#DC2626]"><BiTrash className="text-[10px]" /></span>
                    )}
                  </button>
                ))}
                <button onClick={addSlide} className="px-3 py-2 rounded-[10px] text-sm font-medium bg-[#F9FAFB] hover:bg-[#E5E7EB] flex items-center gap-1"><BiPlus /> Add</button>
              </div>
            </div>

            <PanelHeading title="Content" />
            <div className="p-4 border-b border-[#E5E7EB]">
              <label className="text-xs text-[#4B5563] block mb-1">Headline</label>
              <DebouncedInput value={currentSlide.headline} onChange={(v) => updateSlide(currentSlide.id, { headline: v })} className="w-full mb-3 h-9 text-sm px-3 rounded-full bg-[#EFF6FF] border border-[#E5E7EB] focus:outline-none focus:border-[#2563EB]" placeholder="Main headline" />
              <label className="text-xs text-[#4B5563] block mb-1">Subheadline</label>
              <DebouncedInput value={currentSlide.subheadline} onChange={(v) => updateSlide(currentSlide.id, { subheadline: v })} className="w-full mb-3 h-9 text-sm px-3 rounded-full bg-[#EFF6FF] border border-[#E5E7EB] focus:outline-none focus:border-[#2563EB]" placeholder="Subheadline" />
              <label className="text-xs text-[#4B5563] block mb-1">Description</label>
              <DebouncedTextarea value={currentSlide.description} onChange={(v) => updateSlide(currentSlide.id, { description: v })} className="w-full h-20 p-3 text-sm bg-[#F9FAFB] rounded-[14px] border-2 border-[#E5E7EB] focus:border-[#2563EB] focus:outline-none resize-none" placeholder="Description text" />
            </div>

            <PanelHeading title="App Showcase" />
            <Control title="Website URL">
              <DebouncedInput value={currentSlide.websiteUrl} onChange={(v) => updateSlide(currentSlide.id, { websiteUrl: v })} className="w-[140px] h-9 text-sm px-3 rounded-full bg-[#EFF6FF] border border-[#E5E7EB] focus:outline-none focus:border-[#2563EB]" placeholder="example.com" />
            </Control>
            <div className="p-4 border-b border-[#E5E7EB]">
              <label className="text-xs text-[#4B5563] block mb-2">App Icon</label>
              <div className="flex items-center gap-2 mb-2">
                {currentSlide.appIcon ? (
                  <img src={currentSlide.appIcon} alt="App Icon" className="w-12 h-12 rounded-[14px] object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-[14px] bg-[#F9FAFB] flex items-center justify-center text-[#4B5563]"><BsImage /></div>
                )}
                <Button size="sm" variant="secondary" onClick={() => appIconInputRef.current?.click()}>Upload</Button>
                {currentSlide.appIcon && <Button size="sm" variant="ghost" className="text-[#EF4444]" onClick={() => updateSlide(currentSlide.id, { appIcon: "" })}>Remove</Button>}
              </div>
              <input ref={appIconInputRef} type="file" accept="image/*" onChange={handleAppIconUpload} className="hidden" />
              <div className="flex gap-2">
                <input type="text" value={appIconUrlInput} onChange={(e) => setAppIconUrlInput(e.target.value)} placeholder="Or paste image URL" className="flex-1 h-9 text-sm px-3 rounded-full bg-[#EFF6FF] border border-[#E5E7EB] focus:outline-none focus:border-[#2563EB]" />
                <Button size="sm" onClick={handleAppIconUrl}><BsLink /></Button>
              </div>
            </div>

            <PanelHeading title="Slide Image" />
            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2 mb-3">
                {currentSlide.image ? (
                  <img src={currentSlide.image} alt="Slide" className="w-20 h-14 rounded-[10px] object-cover" />
                ) : (
                  <div className="w-20 h-14 rounded-[10px] bg-[#F9FAFB] flex items-center justify-center text-[#4B5563]"><BsImage className="text-xl" /></div>
                )}
                <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>Upload</Button>
                {currentSlide.image && <Button size="sm" variant="ghost" className="text-[#EF4444]" onClick={() => updateSlide(currentSlide.id, { image: "" })}>Remove</Button>}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <div className="flex gap-2">
                <input type="text" value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} placeholder="Or paste image URL" className="flex-1 h-9 text-sm px-3 rounded-full bg-[#EFF6FF] border border-[#E5E7EB] focus:outline-none focus:border-[#2563EB]" onKeyDown={(e) => e.key === "Enter" && handleImageUrl()} />
                <Button size="sm" onClick={handleImageUrl}><BsLink /></Button>
              </div>
            </div>

            <PanelHeading title="Number/Step" />
            <Control title="Show Number">
              <Switch checked={currentSlide.showNumber} onCheckedChange={(v: boolean) => updateSlide(currentSlide.id, { showNumber: v })} />
            </Control>
            {currentSlide.showNumber && (
              <Control title="Number Text">
                <DebouncedInput value={currentSlide.number} onChange={(v) => updateSlide(currentSlide.id, { number: v })} className="w-[80px] h-9 text-sm px-3 rounded-full bg-[#EFF6FF] border border-[#E5E7EB] focus:outline-none focus:border-[#2563EB]" placeholder="01" />
              </Control>
            )}

            <PanelHeading title="CTA Button" />
            <Control title="Show CTA">
              <Switch checked={currentSlide.ctaVisible} onCheckedChange={(v: boolean) => updateSlide(currentSlide.id, { ctaVisible: v })} />
            </Control>
            {currentSlide.ctaVisible && (
              <Control title="CTA Text">
                <DebouncedInput value={currentSlide.ctaText} onChange={(v) => updateSlide(currentSlide.id, { ctaText: v })} className="w-[120px] h-9 text-sm px-3 rounded-full bg-[#EFF6FF] border border-[#E5E7EB] focus:outline-none focus:border-[#2563EB]" placeholder="Swipe →" />
              </Control>
            )}
          </div>
        </TabsContent>
        <TabsContent value="profile">
          <div className="relative rounded-md">
            <PanelHeading title="Profile" />
            <Control title="Show Profile">
              <Switch checked={state.showProfile} onCheckedChange={(v: boolean) => updateState({ showProfile: v })} />
            </Control>
            {state.showProfile && (
              <>
                <div className="p-4 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-[#F9FAFB] flex items-center justify-center cursor-pointer hover:opacity-80" onClick={() => profileImageRef.current?.click()}>
                      {state.profileImage ? <img src={state.profileImage} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-2xl text-[#4B5563]">+</span>}
                    </div>
                    <input ref={profileImageRef} type="file" accept="image/*" onChange={handleProfileImageUpload} className="hidden" />
                    <Button size="sm" variant="secondary" onClick={() => profileImageRef.current?.click()}>Upload</Button>
                    {state.profileImage && <Button size="sm" variant="ghost" className="text-[#EF4444]" onClick={() => updateState({ profileImage: "" })}>Remove</Button>}
                  </div>
                </div>
                <Control title="Name">
                  <DebouncedInput value={state.profileName} onChange={(v) => updateState({ profileName: v })} className="w-[140px] h-9 text-sm px-3 rounded-full bg-[#EFF6FF] border border-[#E5E7EB] focus:outline-none focus:border-[#2563EB]" placeholder="Your Name" />
                </Control>
                <Control title="Handle">
                  <DebouncedInput value={state.profileHandle} onChange={(v) => updateState({ profileHandle: v })} className="w-[140px] h-9 text-sm px-3 rounded-full bg-[#EFF6FF] border border-[#E5E7EB] focus:outline-none focus:border-[#2563EB]" placeholder="@username" />
                </Control>
                <Control title="Position">
                  <div className="flex gap-1">
                    {(["top", "bottom"] as const).map((pos) => (
                      <button key={pos} onClick={() => updateState({ profilePosition: pos })} className={`px-3 py-1 rounded text-xs capitalize ${state.profilePosition === pos ? "bg-[#2563EB] text-white" : "bg-[#F9FAFB] hover:bg-[#E5E7EB]"}`}>{pos}</button>
                    ))}
                  </div>
                </Control>
              </>
            )}

            <PanelHeading title="Swipe Indicator" />
            <Control title="Show Indicator">
              <Switch checked={state.showSwipeIndicator} onCheckedChange={(v: boolean) => updateState({ showSwipeIndicator: v })} />
            </Control>
            {state.showSwipeIndicator && (
              <Control title="Style">
                <div className="flex gap-1">
                  {(["dots", "arrows", "numbers"] as const).map((style) => (
                    <button key={style} onClick={() => updateState({ swipeIndicatorStyle: style })} className={`px-2 py-1 rounded text-xs capitalize ${state.swipeIndicatorStyle === style ? "bg-[#2563EB] text-white" : "bg-[#F9FAFB] hover:bg-[#E5E7EB]"}`}>{style}</button>
                  ))}
                </div>
              </Control>
            )}

            <PanelHeading title="Page Numbers" />
            <Control title="Show Page Number">
              <Switch checked={state.showPageNumber} onCheckedChange={(v: boolean) => updateState({ showPageNumber: v })} />
            </Control>
            {state.showPageNumber && (
              <Control title="Position">
                <Select value={state.pageNumberPosition} onValueChange={(v) => updateState({ pageNumberPosition: v as CarouselEditorState["pageNumberPosition"] })}>
                  <SelectTrigger className="w-[140px] h-9 text-sm rounded-full bg-[#EFF6FF] border-[#E5E7EB]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  </SelectContent>
                </Select>
              </Control>
            )}
          </div>
        </TabsContent>
        <TabsContent value="style">
          <div className="relative rounded-md">
            <PanelHeading title="Background" />
            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="w-full h-12 rounded-[10px] border-2 border-[#E5E7EB] cursor-pointer hover:border-[#2563EB] transition-all mb-3" style={{ background: state.background.background }} onClick={() => setShowBgPicker(!showBgPicker)} />
              {showBgPicker && (
                <BackgroundPicker background={state.background} onBackgroundChange={(bg: BackgroundConfig) => updateState({ background: bg })} tilt={{ name: "none", value: "none" }} onTiltChange={() => {}} showTilt={false} />
              )}
            </div>
            <label htmlFor="custom-bg-carousel">
              <Control title="Custom Background">
                <input ref={customBgInputRef} type="file" hidden accept="image/*" id="custom-bg-carousel" onChange={handleCustomBgUpload} />
                <BiChevronRight className="text-xl" />
              </Control>
            </label>
            <Control title="Random" onTap={handleRandomBackground}><FaDice className="text-xl" /></Control>

            <PanelHeading title="Layout" />
            <Control title="Aspect Ratio">
              <div className="flex gap-1">
                {aspectRatios.map((ar) => (
                  <button key={ar.id} onClick={() => updateState({ aspectRatio: { name: ar.name, value: ar.value } })} className={`px-2 py-1 rounded text-xs ${state.aspectRatio.value === ar.value ? "bg-[#2563EB] text-white" : "bg-[#F9FAFB] hover:bg-[#E5E7EB]"}`}>{ar.name}</button>
                ))}
              </div>
            </Control>
            <Control title="Layout">
              <Select value={state.slideLayout} onValueChange={(v) => updateState({ slideLayout: v as CarouselEditorState["slideLayout"] })}>
                <SelectTrigger className="w-[160px] h-9 text-sm rounded-full bg-[#EFF6FF] border-[#E5E7EB]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="app-showcase">App Showcase</SelectItem>
                  <SelectItem value="text-only">Text Only</SelectItem>
                  <SelectItem value="image-top">Image Top</SelectItem>
                  <SelectItem value="image-bottom">Image Bottom</SelectItem>
                </SelectContent>
              </Select>
            </Control>
            <Control title="Text Align">
              <div className="flex gap-1">
                {(["left", "center", "right"] as const).map((align) => (
                  <button key={align} onClick={() => updateState({ textAlign: align })} className={`px-3 py-1 rounded text-xs capitalize ${state.textAlign === align ? "bg-[#2563EB] text-white" : "bg-[#F9FAFB] hover:bg-[#E5E7EB]"}`}>{align}</button>
                ))}
              </div>
            </Control>

            <PanelHeading title="Image Settings" />
            <div className="py-3 px-4 border-b border-[#E5E7EB]">
              <span className="text-[#0A0A0A] block mb-2 text-sm font-medium">Image Shadow</span>
              <div className="grid grid-cols-3 gap-2">
                {imageShadows.map((shadow) => (
                  <button key={shadow.id} onClick={() => updateState({ imageShadow: shadow.value })} className={`py-2 px-3 rounded-[10px] text-xs font-medium transition-all ${state.imageShadow === shadow.value ? "bg-[#2563EB] text-white" : "bg-[#F9FAFB] hover:bg-[#E5E7EB]"}`}>{shadow.name}</button>
                ))}
              </div>
            </div>
            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-[#4B5563] font-medium">Image Radius</span>
                <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{state.imageRadius}px</span>
              </div>
              <Slider min={0} max={32} value={[state.imageRadius]} onValueChange={([v]) => updateState({ imageRadius: v })} />
            </div>

            <PanelHeading title="Spacing" />
            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-[#4B5563] font-medium">Padding</span>
                <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{state.padding}px</span>
              </div>
              <Slider min={0} max={80} value={[state.padding]} onValueChange={([v]) => updateState({ padding: v })} />
            </div>
            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-[#4B5563] font-medium">Border Radius</span>
                <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{state.borderRadius}px</span>
              </div>
              <Slider min={0} max={48} value={[state.borderRadius]} onValueChange={([v]) => updateState({ borderRadius: v })} />
            </div>

            <PanelHeading title="Colors" />
            <Control title="Headline Color">
              <input type="color" value={state.headlineColor} onChange={(e) => updateState({ headlineColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
            </Control>
            <Control title="Subheadline Color">
              <input type="color" value={state.subheadlineColor} onChange={(e) => updateState({ subheadlineColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
            </Control>
            <Control title="Description Color">
              <input type="color" value={state.descriptionColor} onChange={(e) => updateState({ descriptionColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
            </Control>
            <Control title="Website URL Color">
              <input type="color" value={state.websiteUrlColor} onChange={(e) => updateState({ websiteUrlColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
            </Control>

            <PanelHeading title="Typography" />
            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-[#4B5563] font-medium">Headline Size</span>
                <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{state.headlineSize}px</span>
              </div>
              <Slider min={18} max={48} value={[state.headlineSize]} onValueChange={([v]) => updateState({ headlineSize: v })} />
            </div>
            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-[#4B5563] font-medium">Subheadline Size</span>
                <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{state.subheadlineSize}px</span>
              </div>
              <Slider min={12} max={32} value={[state.subheadlineSize]} onValueChange={([v]) => updateState({ subheadlineSize: v })} />
            </div>
            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-[#4B5563] font-medium">Description Size</span>
                <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">{state.descriptionSize}px</span>
              </div>
              <Slider min={10} max={24} value={[state.descriptionSize]} onValueChange={([v]) => updateState({ descriptionSize: v })} />
            </div>
            <Control title="Headline Weight">
              <Select value={state.headlineWeight} onValueChange={(v) => updateState({ headlineWeight: v })}>
                <SelectTrigger className="w-[140px] h-9 text-sm rounded-full bg-[#EFF6FF] border-[#E5E7EB]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="400">Normal</SelectItem>
                  <SelectItem value="500">Medium</SelectItem>
                  <SelectItem value="600">Semibold</SelectItem>
                  <SelectItem value="700">Bold</SelectItem>
                  <SelectItem value="800">Extra Bold</SelectItem>
                </SelectContent>
              </Select>
            </Control>
          </div>

        </TabsContent>
        <TabsContent value="presets">
          <div className="p-4">
            {/* Save Custom Preset */}
            <div className="mb-4 p-3 bg-[#EFF6FF] rounded-[10px]">
              <p className="text-xs text-[#4B5563] mb-2">Save current style as preset</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Preset name"
                  className="flex-1 h-9 text-sm px-3 rounded-full bg-white border border-[#E5E7EB] focus:outline-none focus:border-[#2563EB]"
                  onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
                />
                <Button size="sm" onClick={handleSavePreset}>Save</Button>
              </div>
            </div>

            {/* Custom Presets */}
            {customPresets.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-[#4B5563] mb-2 font-medium">Your Presets</p>
                <div className="grid grid-cols-1 gap-3">
                  {customPresets.map((preset) => (
                    <div key={preset.id} className="group relative">
                      <button
                        onClick={() => applyCustomPreset(preset.data)}
                        className="w-full overflow-hidden rounded-[10px] border-2 border-[#E5E7EB] hover:border-[#2563EB] transition-all text-left"
                      >
                        <div className="flex items-center gap-3 p-3">
                          <div className="w-16 h-16 rounded-[10px] flex-shrink-0" style={{ background: preset.data.background.background }} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[#0A0A0A]">{preset.name}</div>
                            <div className="text-xs text-[#4B5563]">{preset.data.slideLayout} • {preset.data.aspectRatio.name}</div>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => deletePreset(preset.id)}
                        className="absolute top-2 right-2 w-6 h-6 bg-[#EF4444] text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#DC2626]"
                      >
                        <BsTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Default Presets */}
            <p className="text-xs text-[#4B5563] mb-2 font-medium">Default Presets</p>
            <div className="grid grid-cols-1 gap-3">
              {presets.map((preset) => (
                <button key={preset.id} onClick={() => applyPreset(preset)} className="group relative overflow-hidden rounded-[10px] border-2 border-[#E5E7EB] hover:border-[#2563EB] transition-all text-left">
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-16 h-16 rounded-[10px] flex-shrink-0" style={{ background: preset.preview }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[#0A0A0A]">{preset.name}</div>
                      <div className="text-xs text-[#4B5563] truncate">{preset.slides.length} slides • {preset.slides[0].headline}</div>
                    </div>
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

export default CarouselControls;
