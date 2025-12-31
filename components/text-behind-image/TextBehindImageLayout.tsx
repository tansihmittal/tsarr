import { useState, useRef, useCallback, useEffect } from "react";
import Navigation from "../common/Navigation";
import TextBehindImageEditor from "./TextBehindImageEditor";
import TextBehindImageControls from "./TextBehindImageControls";
import { backgroundRemover } from "../../utils/backgroundRemoval";
import { FONT_FAMILIES } from "../../data/fonts";
import { useProject } from "@/hooks/useProject";
import { getProject } from "@/utils/projectStorage";
import { imageToBase64 } from "@/utils/imageStorage";

export { FONT_FAMILIES };

export interface TextLayer {
  id: string;
  text: string;
  fontSize: number;
  fontFamily: string;
  textColor: string;
  fontWeight: number;
  opacity: number;
  rotation: number;
  x: number;
  y: number;
  letterSpacing: number;
  tiltX: number;
  tiltY: number;
  // Curve and reflection
  curve: number;
  reflection: boolean;
  reflectionOpacity: number;
  // Shadow
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

export interface TextBehindImageState {
  image: string | null;
  imageWidth: number;
  imageHeight: number;
  backgroundColor: string;
  textLayers: TextLayer[];
  selectedLayerId: string | null;
  exportFormat: "png" | "jpeg" | "webp";
  exportScale: number;
  // Background removal
  foregroundImage: string | null;
  isProcessing: boolean;
  processingProgress: string;
}

export const EXPORT_SCALES = [
  { label: "1x", value: 1 },
  { label: "2x", value: 2 },
  { label: "3x", value: 3 },
  { label: "4x", value: 4 },
];

export const createDefaultLayer = (): TextLayer => ({
  id: crypto.randomUUID(),
  text: "YOUR TEXT",
  fontSize: 120,
  fontFamily: "Inter",
  textColor: "#ffffff",
  fontWeight: 800,
  opacity: 1,
  rotation: 0,
  x: 50,
  y: 50,
  letterSpacing: 0,
  tiltX: 0,
  tiltY: 0,
  curve: 0,
  reflection: false,
  reflectionOpacity: 0.3,
  shadowEnabled: false,
  shadowColor: "rgba(0, 0, 0, 0.8)",
  shadowBlur: 10,
  shadowOffsetX: 4,
  shadowOffsetY: 4,
});

const TextBehindImageLayout = () => {
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Project system - Canva-style auto-save
  const project = useProject({
    type: "text-behind-image",
    defaultName: "Untitled Text Behind Image",
    silentSave: true,
  });

  const [state, setState] = useState<TextBehindImageState>({
    image: null,
    imageWidth: 800,
    imageHeight: 600,
    backgroundColor: "#1a1a1a",
    textLayers: [createDefaultLayer()],
    selectedLayerId: null,
    exportFormat: "png",
    exportScale: 2,
    // Background removal
    foregroundImage: null,
    isProcessing: false,
    processingProgress: "",
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      // Convert blob URLs to base64 for persistence
      if (stateToSave.image && stateToSave.image.startsWith('blob:')) {
        stateToSave.image = await imageToBase64(stateToSave.image);
      }
      if (stateToSave.foregroundImage && stateToSave.foregroundImage.startsWith('blob:')) {
        stateToSave.foregroundImage = await imageToBase64(stateToSave.foregroundImage);
      }
      // Pass canvas element for thumbnail generation
      project.save(stateToSave, canvasRef.current);
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Preload AI model when page loads for faster processing
  useEffect(() => {
    backgroundRemover.preloadModel();
  }, []);

  const updateState = (updates: Partial<TextBehindImageState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  // Auto-process image when uploaded
  const processImage = useCallback(async (imageUrl: string) => {
    updateState({
      isProcessing: true,
      processingProgress: "Loading: 5%",
    });

    try {
      // Pass the image URL directly to the background remover
      const result = await backgroundRemover.processImage(imageUrl, (status) => {
        updateState({ processingProgress: status });
      });

      updateState({
        foregroundImage: result.foregroundUrl,
        isProcessing: false,
        processingProgress: "Complete: 100%",
      });
    } catch (error) {
      console.error("Processing failed:", error);
      updateState({
        isProcessing: false,
        processingProgress: "Processing failed. Using original image.",
      });
    }
  }, []);

  // Handle image upload with auto-processing
  const handleImageUpload = useCallback(
    (imageUrl: string, width: number, height: number) => {
      // First update the image
      updateState({
        image: imageUrl,
        imageWidth: width,
        imageHeight: height,
        foregroundImage: null,
        processingProgress: "",
      });

      // Then auto-process
      processImage(imageUrl);
    },
    [processImage]
  );

  // Manual re-process
  const reprocessImage = useCallback(() => {
    if (state.image && !state.isProcessing) {
      processImage(state.image);
    }
  }, [state.image, state.isProcessing, processImage]);

  const updateLayer = (layerId: string, updates: Partial<TextLayer>) => {
    setState((prev) => ({
      ...prev,
      textLayers: prev.textLayers.map((layer) =>
        layer.id === layerId ? { ...layer, ...updates } : layer
      ),
    }));
  };

  const addLayer = () => {
    const newLayer = createDefaultLayer();
    setState((prev) => ({
      ...prev,
      textLayers: [...prev.textLayers, newLayer],
      selectedLayerId: newLayer.id,
    }));
  };

  const duplicateLayer = (layerId: string) => {
    const layerToDuplicate = state.textLayers.find((l) => l.id === layerId);
    if (layerToDuplicate) {
      const newLayer: TextLayer = {
        ...layerToDuplicate,
        id: crypto.randomUUID(),
        x: Math.min(layerToDuplicate.x + 5, 100),
        y: Math.min(layerToDuplicate.y + 5, 100),
      };
      setState((prev) => ({
        ...prev,
        textLayers: [...prev.textLayers, newLayer],
        selectedLayerId: newLayer.id,
      }));
    }
  };

  const removeLayer = (layerId: string) => {
    if (state.textLayers.length <= 1) return;
    setState((prev) => ({
      ...prev,
      textLayers: prev.textLayers.filter((l) => l.id !== layerId),
      selectedLayerId:
        prev.selectedLayerId === layerId ? null : prev.selectedLayerId,
    }));
  };

  return (
    <main className="min-h-[100vh] h-fit editor-bg relative pb-20 lg:pb-0">
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-3 sm:px-4 lg:px-0 relative">
        <div className="flex flex-col lg:grid lg:gap-5 lg:grid-cols-[3fr_1.5fr]">
          <TextBehindImageEditor
            state={state}
            canvasRef={canvasRef}
            updateState={updateState}
            onImageUpload={handleImageUpload}
            updateLayer={updateLayer}
            projectName={project.projectName}
            onProjectNameChange={project.setProjectName}
            isSaving={project.isSaving}
          />
          <TextBehindImageControls
            state={state}
            updateState={updateState}
            updateLayer={updateLayer}
            addLayer={addLayer}
            duplicateLayer={duplicateLayer}
            removeLayer={removeLayer}
            onImageUpload={handleImageUpload}
            reprocessImage={reprocessImage}
            canvasRef={canvasRef}
          />
        </div>
      </section>
    </main>
  );
};

export default TextBehindImageLayout;
