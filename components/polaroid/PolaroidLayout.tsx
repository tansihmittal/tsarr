import { useState, useRef, useCallback, useEffect } from "react";
import Navigation from "../common/Navigation";
import { PolaroidState } from "./types";
import PolaroidPreview from "./PolaroidPreview";
import PolaroidControls from "./PolaroidControls";
import { useProject } from "@/hooks/useProject";
import { getProject } from "@/utils/projectStorage";
import { imageToBase64 } from "@/utils/imageStorage";

const PolaroidLayout = () => {
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [projectLoaded, setProjectLoaded] = useState(false);

  // Project system - Canva-style auto-save
  const project = useProject({
    type: "polaroid",
    defaultName: "Untitled Polaroid",
    silentSave: true,
  });

  const [state, setState] = useState<PolaroidState>({
    image: null,
    imageWidth: 400,
    imageHeight: 400,
    frameColor: "#ffffff",
    frameTexture: "smooth",
    borderWidth: 20,
    bottomBorderWidth: 80,
    caption: "",
    captionFont: "Caveat",
    captionSize: 24,
    captionColor: "#333333",
    rotation: 0,
    tilt: 0,
    shadow: true,
    shadowIntensity: 30,
    filter: "none",
    filterIntensity: 100,
    backgroundColor: "#f5f5f5",
    backgroundType: "solid",
    gradientFrom: "#667eea",
    gradientTo: "#764ba2",
    gradientAngle: 135,
    lightLeak: "none",
    vignette: false,
    vignetteIntensity: 40,
    grain: false,
    grainIntensity: 20,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    exposure: 0,
    highlights: 0,
    shadows: 0,
    temperature: 0,
    tint: 0,
    sharpness: 0,
    blur: 0,
    fade: 0,
  });

  const polaroidRef = useRef<HTMLDivElement>(null);

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
    if (!state.image) return;
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      const stateToSave = { ...state };
      // Convert blob URL to base64 for persistence
      if (stateToSave.image && stateToSave.image.startsWith('blob:')) {
        stateToSave.image = await imageToBase64(stateToSave.image);
      }
      project.save(stateToSave, polaroidRef.current);
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const updateState = useCallback((updates: Partial<PolaroidState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleImageUpload = useCallback((imageUrl: string, width: number, height: number) => {
    setState((prev) => ({
      ...prev,
      image: imageUrl,
      imageWidth: width,
      imageHeight: height,
    }));
  }, []);

  const handleReset = useCallback(() => {
    setState({
      image: null,
      imageWidth: 400,
      imageHeight: 400,
      frameColor: "#ffffff",
      frameTexture: "smooth",
      borderWidth: 20,
      bottomBorderWidth: 80,
      caption: "",
      captionFont: "Caveat",
      captionSize: 24,
      captionColor: "#333333",
      rotation: 0,
      tilt: 0,
      shadow: true,
      shadowIntensity: 30,
      filter: "none",
      filterIntensity: 100,
      backgroundColor: "#f5f5f5",
      backgroundType: "solid",
      gradientFrom: "#667eea",
      gradientTo: "#764ba2",
      gradientAngle: 135,
      lightLeak: "none",
      vignette: false,
      vignetteIntensity: 40,
      grain: false,
      grainIntensity: 20,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      exposure: 0,
      highlights: 0,
      shadows: 0,
      temperature: 0,
      tint: 0,
      sharpness: 0,
      blur: 0,
      fade: 0,
    });
  }, []);

  return (
    <main className="min-h-[100vh] h-fit editor-bg relative pb-20 lg:pb-0">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-3 sm:px-4 lg:px-0 relative">
        <div className="flex flex-col lg:grid lg:gap-5 lg:grid-cols-[3fr_1.5fr]">
          <PolaroidPreview
            state={state}
            polaroidRef={polaroidRef}
            updateState={updateState}
            onImageUpload={handleImageUpload}
            onReset={handleReset}
            projectName={project.projectName}
            onProjectNameChange={project.setProjectName}
            isSaving={project.isSaving}
          />
          <PolaroidControls
            state={state}
            updateState={updateState}
            polaroidRef={polaroidRef}
          />
        </div>
      </section>
    </main>
  );
};

export default PolaroidLayout;
