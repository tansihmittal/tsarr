import { useState, useRef, useEffect, memo } from "react";
import { CarouselEditorState, SlideContent } from "./CarouselEditorLayout";
import { BiSlideshow, BiPlus, BiTrash, BiUser, BiChevronRight } from "react-icons/bi";
import { IoMdOptions } from "react-icons/io";
import { BsBookmarkFill, BsImage, BsLink, BsTrash } from "react-icons/bs";
import { FaDice } from "react-icons/fa";
import { toast } from "react-hot-toast";
import BackgroundPicker, { BackgroundConfig } from "../common/BackgroundPicker";
import { gereateRandomGradient } from "@/utils/randomGradient";
import useCustomPresets from "@/hooks/useCustomPresets";

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
  const [selectedTab, setSelectedTab] = useState("slides");
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [appIconUrlInput, setAppIconUrlInput] = useState("");
  const [newPresetName, setNewPresetName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const appIconInputRef = useRef<HTMLInputElement>(null);
  const profileImageRef = useRef<HTMLInputElement>(null);
  const customBgInputRef = useRef<HTMLInputElement>(null);

  const { presets: customPresets, savePreset, deletePreset } = useCustomPresets<CarouselPresetData>(PRESET_STORAGE_KEY);

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

  const PanelHeading = ({ title }: { title: string }) => (
    <h2 className="text-[0.75rem] uppercase tracking-wider font-semibold px-4 py-3 bg-gradient-to-r from-base-200/80 to-base-200/40 text-gray-600 border-b border-base-200/50 flex items-center gap-2">
      <span className="w-1 h-4 bg-primary rounded-full"></span>{title}
    </h2>
  );

  const Control = ({ title, children, onTap }: { title: string; children?: React.ReactNode; onTap?: () => void }) => (
    <div className={`flex items-center justify-between py-3 px-4 border-b border-base-200/60 ${onTap ? "cursor-pointer hover:bg-base-200/30" : ""}`} onClick={onTap}>
      <span className="text-primary-content font-medium text-sm">{title}</span>{children}
    </div>
  );

  const OptionButton = ({ title, children, tabKey }: { children: React.ReactNode; title: string; tabKey: string }) => {
    const isActive = selectedTab === tabKey;
    return (
      <div className={`flex justify-center items-center gap-2 font-medium px-3 py-2.5 transition-all duration-200 cursor-pointer ${isActive ? "bg-base-100 rounded-lg shadow-sm text-primary" : "text-primary-content hover:text-primary"}`} onClick={() => setSelectedTab(tabKey)}>
        <span className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>{children}</span><span className="text-sm">{title}</span>
      </div>
    );
  };

  return (
    <section className="flex flex-col transition-opacity duration-300 opacity-100">
      <div className="grid grid-cols-4 bg-base-200/60 rounded-xl p-1 mb-3 cursor-pointer backdrop-blur-sm">
        <OptionButton title="Slides" tabKey="slides"><BiSlideshow /></OptionButton>
        <OptionButton title="Profile" tabKey="profile"><BiUser /></OptionButton>
        <OptionButton title="Style" tabKey="style"><IoMdOptions /></OptionButton>
        <OptionButton title="Presets" tabKey="presets"><BsBookmarkFill /></OptionButton>
      </div>

      <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
        {selectedTab === "slides" ? (
          <div className="relative rounded-md">
            <PanelHeading title="Slides" />
            <div className="p-3 border-b border-base-200/60">
              <div className="flex flex-wrap gap-2 mb-3">
                {state.slides.map((slide, index) => (
                  <button key={slide.id} onClick={() => updateState({ currentSlide: index })} className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all ${index === state.currentSlide ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}>
                    {index + 1}
                    {state.slides.length > 1 && (
                      <span onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }} className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white rounded-full text-xs flex items-center justify-center hover:bg-error/80"><BiTrash className="text-[10px]" /></span>
                    )}
                  </button>
                ))}
                <button onClick={addSlide} className="px-3 py-2 rounded-lg text-sm font-medium bg-base-200 hover:bg-base-300 flex items-center gap-1"><BiPlus /> Add</button>
              </div>
            </div>

            <PanelHeading title="Content" />
            <div className="p-4 border-b border-base-200/60">
              <label className="text-xs text-gray-500 block mb-1">Headline</label>
              <DebouncedInput value={currentSlide.headline} onChange={(v) => updateSlide(currentSlide.id, { headline: v })} className="input input-sm input-bordered w-full mb-3" placeholder="Main headline" />
              <label className="text-xs text-gray-500 block mb-1">Subheadline</label>
              <DebouncedInput value={currentSlide.subheadline} onChange={(v) => updateSlide(currentSlide.id, { subheadline: v })} className="input input-sm input-bordered w-full mb-3" placeholder="Subheadline" />
              <label className="text-xs text-gray-500 block mb-1">Description</label>
              <DebouncedTextarea value={currentSlide.description} onChange={(v) => updateSlide(currentSlide.id, { description: v })} className="w-full h-20 p-3 text-sm bg-base-200 rounded-lg border-2 border-base-300 focus:border-primary focus:outline-none resize-none" placeholder="Description text" />
            </div>

            <PanelHeading title="App Showcase" />
            <Control title="Website URL">
              <DebouncedInput value={currentSlide.websiteUrl} onChange={(v) => updateSlide(currentSlide.id, { websiteUrl: v })} className="input input-sm input-bordered w-[140px]" placeholder="example.com" />
            </Control>
            <div className="p-4 border-b border-base-200/60">
              <label className="text-xs text-gray-500 block mb-2">App Icon</label>
              <div className="flex items-center gap-2 mb-2">
                {currentSlide.appIcon ? (
                  <img src={currentSlide.appIcon} alt="App Icon" className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-base-200 flex items-center justify-center text-gray-400"><BsImage /></div>
                )}
                <button onClick={() => appIconInputRef.current?.click()} className="btn btn-sm btn-outline">Upload</button>
                {currentSlide.appIcon && <button onClick={() => updateSlide(currentSlide.id, { appIcon: "" })} className="btn btn-sm btn-ghost text-error">Remove</button>}
              </div>
              <input ref={appIconInputRef} type="file" accept="image/*" onChange={handleAppIconUpload} className="hidden" />
              <div className="flex gap-2">
                <input type="text" value={appIconUrlInput} onChange={(e) => setAppIconUrlInput(e.target.value)} placeholder="Or paste image URL" className="input input-sm input-bordered flex-1" />
                <button onClick={handleAppIconUrl} className="btn btn-sm btn-primary"><BsLink /></button>
              </div>
            </div>

            <PanelHeading title="Slide Image" />
            <div className="p-4 border-b border-base-200/60">
              <div className="flex items-center gap-2 mb-3">
                {currentSlide.image ? (
                  <img src={currentSlide.image} alt="Slide" className="w-20 h-14 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-14 rounded-lg bg-base-200 flex items-center justify-center text-gray-400"><BsImage className="text-xl" /></div>
                )}
                <button onClick={() => fileInputRef.current?.click()} className="btn btn-sm btn-outline">Upload</button>
                {currentSlide.image && <button onClick={() => updateSlide(currentSlide.id, { image: "" })} className="btn btn-sm btn-ghost text-error">Remove</button>}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <div className="flex gap-2">
                <input type="text" value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} placeholder="Or paste image URL" className="input input-sm input-bordered flex-1" onKeyDown={(e) => e.key === "Enter" && handleImageUrl()} />
                <button onClick={handleImageUrl} className="btn btn-sm btn-primary"><BsLink /></button>
              </div>
            </div>

            <PanelHeading title="Number/Step" />
            <Control title="Show Number">
              <label className="custom-toggle">
                <input type="checkbox" checked={currentSlide.showNumber} onChange={(e) => updateSlide(currentSlide.id, { showNumber: e.target.checked })} />
                <span className="slider"></span>
              </label>
            </Control>
            {currentSlide.showNumber && (
              <Control title="Number Text">
                <DebouncedInput value={currentSlide.number} onChange={(v) => updateSlide(currentSlide.id, { number: v })} className="input input-sm input-bordered w-[80px]" placeholder="01" />
              </Control>
            )}

            <PanelHeading title="CTA Button" />
            <Control title="Show CTA">
              <label className="custom-toggle">
                <input type="checkbox" checked={currentSlide.ctaVisible} onChange={(e) => updateSlide(currentSlide.id, { ctaVisible: e.target.checked })} />
                <span className="slider"></span>
              </label>
            </Control>
            {currentSlide.ctaVisible && (
              <Control title="CTA Text">
                <DebouncedInput value={currentSlide.ctaText} onChange={(v) => updateSlide(currentSlide.id, { ctaText: v })} className="input input-sm input-bordered w-[120px]" placeholder="Swipe →" />
              </Control>
            )}
          </div>
        ) : selectedTab === "profile" ? (
          <div className="relative rounded-md">
            <PanelHeading title="Profile" />
            <Control title="Show Profile">
              <label className="custom-toggle">
                <input type="checkbox" checked={state.showProfile} onChange={(e) => updateState({ showProfile: e.target.checked })} />
                <span className="slider"></span>
              </label>
            </Control>
            {state.showProfile && (
              <>
                <div className="p-4 border-b border-base-200/60">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-base-200 flex items-center justify-center cursor-pointer hover:opacity-80" onClick={() => profileImageRef.current?.click()}>
                      {state.profileImage ? <img src={state.profileImage} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-2xl text-gray-400">+</span>}
                    </div>
                    <input ref={profileImageRef} type="file" accept="image/*" onChange={handleProfileImageUpload} className="hidden" />
                    <button onClick={() => profileImageRef.current?.click()} className="btn btn-sm btn-outline">Upload</button>
                    {state.profileImage && <button onClick={() => updateState({ profileImage: "" })} className="btn btn-sm btn-ghost text-error">Remove</button>}
                  </div>
                </div>
                <Control title="Name">
                  <DebouncedInput value={state.profileName} onChange={(v) => updateState({ profileName: v })} className="input input-sm input-bordered w-[140px]" placeholder="Your Name" />
                </Control>
                <Control title="Handle">
                  <DebouncedInput value={state.profileHandle} onChange={(v) => updateState({ profileHandle: v })} className="input input-sm input-bordered w-[140px]" placeholder="@username" />
                </Control>
                <Control title="Position">
                  <div className="flex gap-1">
                    {(["top", "bottom"] as const).map((pos) => (
                      <button key={pos} onClick={() => updateState({ profilePosition: pos })} className={`px-3 py-1 rounded text-xs capitalize ${state.profilePosition === pos ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}>{pos}</button>
                    ))}
                  </div>
                </Control>
              </>
            )}

            <PanelHeading title="Swipe Indicator" />
            <Control title="Show Indicator">
              <label className="custom-toggle">
                <input type="checkbox" checked={state.showSwipeIndicator} onChange={(e) => updateState({ showSwipeIndicator: e.target.checked })} />
                <span className="slider"></span>
              </label>
            </Control>
            {state.showSwipeIndicator && (
              <Control title="Style">
                <div className="flex gap-1">
                  {(["dots", "arrows", "numbers"] as const).map((style) => (
                    <button key={style} onClick={() => updateState({ swipeIndicatorStyle: style })} className={`px-2 py-1 rounded text-xs capitalize ${state.swipeIndicatorStyle === style ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}>{style}</button>
                  ))}
                </div>
              </Control>
            )}

            <PanelHeading title="Page Numbers" />
            <Control title="Show Page Number">
              <label className="custom-toggle">
                <input type="checkbox" checked={state.showPageNumber} onChange={(e) => updateState({ showPageNumber: e.target.checked })} />
                <span className="slider"></span>
              </label>
            </Control>
            {state.showPageNumber && (
              <Control title="Position">
                <select value={state.pageNumberPosition} onChange={(e) => updateState({ pageNumberPosition: e.target.value as CarouselEditorState["pageNumberPosition"] })} className="select select-sm select-bordered">
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </Control>
            )}
          </div>
        ) : selectedTab === "style" ? (
          <div className="relative rounded-md">
            <PanelHeading title="Background" />
            <div className="p-4 border-b border-base-200/60">
              <div className="w-full h-12 rounded-lg border-2 border-base-200 cursor-pointer hover:border-primary transition-all mb-3" style={{ background: state.background.background }} onClick={() => setShowBgPicker(!showBgPicker)} />
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
                  <button key={ar.id} onClick={() => updateState({ aspectRatio: { name: ar.name, value: ar.value } })} className={`px-2 py-1 rounded text-xs ${state.aspectRatio.value === ar.value ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}>{ar.name}</button>
                ))}
              </div>
            </Control>
            <Control title="Layout">
              <select value={state.slideLayout} onChange={(e) => updateState({ slideLayout: e.target.value as CarouselEditorState["slideLayout"] })} className="select select-sm select-bordered">
                <option value="app-showcase">App Showcase</option>
                <option value="text-only">Text Only</option>
                <option value="image-top">Image Top</option>
                <option value="image-bottom">Image Bottom</option>
              </select>
            </Control>
            <Control title="Text Align">
              <div className="flex gap-1">
                {(["left", "center", "right"] as const).map((align) => (
                  <button key={align} onClick={() => updateState({ textAlign: align })} className={`px-3 py-1 rounded text-xs capitalize ${state.textAlign === align ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}>{align}</button>
                ))}
              </div>
            </Control>

            <PanelHeading title="Image Settings" />
            <div className="py-3 px-4 border-b border-base-200/60">
              <span className="text-primary-content block mb-2 text-sm font-medium">Image Shadow</span>
              <div className="grid grid-cols-3 gap-2">
                {imageShadows.map((shadow) => (
                  <button key={shadow.id} onClick={() => updateState({ imageShadow: shadow.value })} className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${state.imageShadow === shadow.value ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}>{shadow.name}</button>
                ))}
              </div>
            </div>
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Image Radius</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{state.imageRadius}px</span>
              </div>
              <input type="range" min="0" max="32" value={state.imageRadius} onChange={(e) => updateState({ imageRadius: Number(e.target.value) })} className="range range-xs range-primary w-full" />
            </div>

            <PanelHeading title="Spacing" />
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Padding</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{state.padding}px</span>
              </div>
              <input type="range" min="0" max="80" value={state.padding} onChange={(e) => updateState({ padding: Number(e.target.value) })} className="range range-xs range-primary w-full" />
            </div>
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Border Radius</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{state.borderRadius}px</span>
              </div>
              <input type="range" min="0" max="48" value={state.borderRadius} onChange={(e) => updateState({ borderRadius: Number(e.target.value) })} className="range range-xs range-primary w-full" />
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
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Headline Size</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{state.headlineSize}px</span>
              </div>
              <input type="range" min="18" max="48" value={state.headlineSize} onChange={(e) => updateState({ headlineSize: Number(e.target.value) })} className="range range-xs range-primary w-full" />
            </div>
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Subheadline Size</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{state.subheadlineSize}px</span>
              </div>
              <input type="range" min="12" max="32" value={state.subheadlineSize} onChange={(e) => updateState({ subheadlineSize: Number(e.target.value) })} className="range range-xs range-primary w-full" />
            </div>
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Description Size</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{state.descriptionSize}px</span>
              </div>
              <input type="range" min="10" max="24" value={state.descriptionSize} onChange={(e) => updateState({ descriptionSize: Number(e.target.value) })} className="range range-xs range-primary w-full" />
            </div>
            <Control title="Headline Weight">
              <select value={state.headlineWeight} onChange={(e) => updateState({ headlineWeight: e.target.value })} className="select select-sm select-bordered">
                <option value="400">Normal</option>
                <option value="500">Medium</option>
                <option value="600">Semibold</option>
                <option value="700">Bold</option>
                <option value="800">Extra Bold</option>
              </select>
            </Control>
          </div>

        ) : (
          <div className="p-4">
            {/* Save Custom Preset */}
            <div className="mb-4 p-3 bg-base-200/50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Save current style as preset</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Preset name"
                  className="input input-sm input-bordered flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
                />
                <button onClick={handleSavePreset} className="btn btn-sm btn-primary">Save</button>
              </div>
            </div>

            {/* Custom Presets */}
            {customPresets.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2 font-medium">Your Presets</p>
                <div className="grid grid-cols-1 gap-3">
                  {customPresets.map((preset) => (
                    <div key={preset.id} className="group relative">
                      <button
                        onClick={() => applyCustomPreset(preset.data)}
                        className="w-full overflow-hidden rounded-lg border-2 border-base-200 hover:border-primary transition-all text-left"
                      >
                        <div className="flex items-center gap-3 p-3">
                          <div className="w-16 h-16 rounded-lg flex-shrink-0" style={{ background: preset.data.background.background }} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-primary-content">{preset.name}</div>
                            <div className="text-xs text-gray-500">{preset.data.slideLayout} • {preset.data.aspectRatio.name}</div>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => deletePreset(preset.id)}
                        className="absolute top-2 right-2 w-6 h-6 bg-error text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/80"
                      >
                        <BsTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Default Presets */}
            <p className="text-xs text-gray-500 mb-2 font-medium">Default Presets</p>
            <div className="grid grid-cols-1 gap-3">
              {presets.map((preset) => (
                <button key={preset.id} onClick={() => applyPreset(preset)} className="group relative overflow-hidden rounded-lg border-2 border-base-200 hover:border-primary transition-all text-left">
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-16 h-16 rounded-lg flex-shrink-0" style={{ background: preset.preview }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-primary-content">{preset.name}</div>
                      <div className="text-xs text-gray-500 truncate">{preset.slides.length} slides • {preset.slides[0].headline}</div>
                    </div>
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

export default CarouselControls;
