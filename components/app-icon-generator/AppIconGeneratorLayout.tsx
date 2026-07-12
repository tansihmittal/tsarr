import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import Navigation from "../common/Navigation";
import AppIconGeneratorPreview from "./AppIconGeneratorPreview";
import AppIconGeneratorControls from "./AppIconGeneratorControls";
import { normalizeImageFile } from "@/utils/imageFile";
import { AppIconGeneratorState, defaultAppIconState } from "./types";
import { generateIconZip } from "./generateIcons";

const AppIconGeneratorLayout: React.FC = () => {
  const [state, setState] = useState<AppIconGeneratorState>(defaultAppIconState);
  const [isGenerating, setIsGenerating] = useState(false);

  const updateState = useCallback((updates: Partial<AppIconGeneratorState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleImageUpload = useCallback(async (file: File) => {
    const normalized = await normalizeImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setState((prev) => ({
          ...prev,
          image: e.target?.result as string,
          imageWidth: img.width,
          imageHeight: img.height,
        }));
        toast.success("Image loaded!");
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(normalized);
  }, []);

  const handleReset = useCallback(() => {
    setState(defaultAppIconState);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!state.image) {
      toast.error("Upload an image first");
      return;
    }
    if (!state.platforms.ios && !state.platforms.android && !state.platforms.web && !state.platforms.macos) {
      toast.error("Select at least one platform");
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await generateIconZip(state);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tsarr-app-icons.zip";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Icons generated!");
    } catch (err) {
      console.error("Icon generation failed:", err);
      toast.error("Failed to generate icons");
    } finally {
      setIsGenerating(false);
    }
  }, [state]);

  return (
    <main className="min-h-[100vh] h-fit editor-bg relative pb-20 lg:pb-0" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-3 sm:px-4 lg:px-0 relative">
        <div className="flex flex-col lg:grid lg:gap-5 lg:grid-cols-[3fr_1.5fr]">
          <AppIconGeneratorPreview
            state={state}
            onImageUpload={handleImageUpload}
            onReset={handleReset}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
          <AppIconGeneratorControls
            state={state}
            updateState={updateState}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>
      </section>
    </main>
  );
};

export default AppIconGeneratorLayout;
