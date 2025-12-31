import { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import Navigation from "../common/Navigation";
import CarouselPreview from "./CarouselPreview";
import CarouselControls from "./CarouselControls";
import { downloadimagePng, downloadimageJpeg, downloadimageSvg, copyToClipboard } from "../edtior/Editor/downloads";
import { BackgroundConfig } from "../common/BackgroundPicker";
import { useProject } from "@/hooks/useProject";
import { getProject } from "@/utils/projectStorage";
import { imageToBase64 } from "@/utils/imageStorage";

export interface SlideContent {
  id: string;
  headline: string;
  subheadline: string;
  description: string;
  image: string;
  // New fields for app-style carousel
  appIcon: string;
  websiteUrl: string;
  ctaText: string;
  ctaVisible: boolean;
  showNumber: boolean;
  number: string;
}

export interface CarouselEditorState {
  slides: SlideContent[];
  currentSlide: number;
  // Profile/Branding
  profileName: string;
  profileHandle: string;
  profileImage: string;
  showProfile: boolean;
  profilePosition: "top" | "bottom";
  // Background
  background: BackgroundConfig;
  padding: number;
  borderRadius: number;
  // Typography
  headlineSize: number;
  headlineColor: string;
  headlineWeight: string;
  subheadlineSize: number;
  subheadlineColor: string;
  descriptionSize: number;
  descriptionColor: string;
  textAlign: "left" | "center" | "right";
  // Image settings
  imageShadow: string;
  imageRadius: number;
  // Slide Settings
  aspectRatio: { name: string; value: string };
  slideLayout: "text-only" | "image-top" | "image-bottom" | "app-showcase" | "split-left" | "split-right";
  // Swipe Indicator
  showSwipeIndicator: boolean;
  swipeIndicatorStyle: "dots" | "arrows" | "numbers";
  // Page numbers
  showPageNumber: boolean;
  pageNumberPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  // Website URL color
  websiteUrlColor: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultSlides: SlideContent[] = [
  { id: generateId(), headline: "Your Headline Here", subheadline: "Add your subheadline", description: "Add your description text here.", image: "", appIcon: "", websiteUrl: "yoursite.com", ctaText: "Swipe →", ctaVisible: true, showNumber: false, number: "1" },
  { id: generateId(), headline: "Feature Highlight", subheadline: "Why it's better", description: "Full features without the premium price tag.", image: "", appIcon: "", websiteUrl: "", ctaText: "Next →", ctaVisible: true, showNumber: true, number: "01" },
  { id: generateId(), headline: "Try It Today", subheadline: "Get started free", description: "Download now and see the difference.", image: "", appIcon: "", websiteUrl: "yoursite.com", ctaText: "Download", ctaVisible: true, showNumber: false, number: "3" },
];


const CarouselEditorLayout: React.FC = () => {
  const previewRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [projectLoaded, setProjectLoaded] = useState(false);

  // Project system - Canva-style auto-save
  const project = useProject({
    type: "carousel",
    defaultName: "Untitled Carousel",
    silentSave: true,
  });

  const [state, setState] = useState<CarouselEditorState>({
    slides: defaultSlides,
    currentSlide: 0,
    profileName: "Your Name",
    profileHandle: "@username",
    profileImage: "",
    showProfile: false,
    profilePosition: "bottom",
    background: {
      type: "solid",
      background: "#ffffff",
      color1: "#ffffff",
      color2: "#ffffff",
      direction: "to right",
    },
    padding: 32,
    borderRadius: 0,
    headlineSize: 32,
    headlineColor: "#1a1a2e",
    headlineWeight: "700",
    subheadlineSize: 18,
    subheadlineColor: "#6b7280",
    descriptionSize: 16,
    descriptionColor: "#374151",
    textAlign: "center",
    imageShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    imageRadius: 16,
    aspectRatio: { name: "4:5", value: "4/5" },
    slideLayout: "app-showcase",
    showSwipeIndicator: false,
    swipeIndicatorStyle: "dots",
    showPageNumber: false,
    pageNumberPosition: "top-right",
    websiteUrlColor: "#6b7280",
  });

  // Load project data when project ID is in URL
  useEffect(() => {
    if (project.projectId && !projectLoaded) {
      const savedProject = getProject(project.projectId);
      if (savedProject?.data) {
        setState(savedProject.data);
        setProjectLoaded(true);
      }
    }
  }, [project.projectId, projectLoaded]);

  // Auto-save with debounce (2 seconds after last change)
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      const stateToSave = { ...state };
      // Convert blob URLs to base64 for persistence (slide images, app icons, profile image)
      const slidesWithBase64 = await Promise.all(
        stateToSave.slides.map(async (slide) => {
          const updatedSlide = { ...slide };
          if (updatedSlide.image && updatedSlide.image.startsWith('blob:')) {
            updatedSlide.image = await imageToBase64(updatedSlide.image);
          }
          if (updatedSlide.appIcon && updatedSlide.appIcon.startsWith('blob:')) {
            updatedSlide.appIcon = await imageToBase64(updatedSlide.appIcon);
          }
          return updatedSlide;
        })
      );
      stateToSave.slides = slidesWithBase64;
      
      if (stateToSave.profileImage && stateToSave.profileImage.startsWith('blob:')) {
        stateToSave.profileImage = await imageToBase64(stateToSave.profileImage);
      }
      
      project.save(stateToSave, previewRef.current);
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [state]);

  const updateState = (updates: Partial<CarouselEditorState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleExport = async (format: "png" | "jpeg" | "svg", scale: number = 2) => {
    if (!previewRef.current) return;
    if (format === "png") downloadimagePng(previewRef.current, scale);
    else if (format === "jpeg") downloadimageJpeg(previewRef.current, scale);
    else downloadimageSvg(previewRef.current, scale);
  };

  const handleExportAll = async () => {
    const originalSlide = state.currentSlide;
    toast.loading("Exporting all slides...", { id: "export-all" });
    for (let i = 0; i < state.slides.length; i++) {
      setState(prev => ({ ...prev, currentSlide: i }));
      await new Promise(resolve => setTimeout(resolve, 300));
      if (previewRef.current) await downloadimagePng(previewRef.current, 2, `carousel-slide-${i + 1}`);
    }
    setState(prev => ({ ...prev, currentSlide: originalSlide }));
    toast.success("All slides exported!", { id: "export-all" });
  };

  const handleCopy = async () => {
    if (!previewRef.current) { toast.error("No preview to copy"); return; }
    await copyToClipboard(previewRef.current);
  };

  return (
    <main className="min-h-[100vh] h-fit editor-bg relative pb-20 lg:pb-0">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-3 sm:px-4 lg:px-0 relative">
        <div className="grid gap-4 lg:gap-5 lg:grid-cols-[3fr_1.5fr]">
          <CarouselPreview 
            state={state} 
            previewRef={previewRef} 
            onExport={handleExport} 
            onExportAll={handleExportAll} 
            onCopy={handleCopy} 
            updateState={updateState}
            projectName={project.projectName}
            onProjectNameChange={project.setProjectName}
            isSaving={project.isSaving}
          />
          <CarouselControls state={state} updateState={updateState} />
        </div>
      </section>
    </main>
  );
};

export default CarouselEditorLayout;
