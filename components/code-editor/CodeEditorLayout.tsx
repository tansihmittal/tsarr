import { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import Navigation from "../common/Navigation";
import CodePreview from "./CodePreview";
import CodeControls from "./CodeControls";
import { downloadimagePng, downloadimageJpeg, downloadimageSvg, copyToClipboard } from "../edtior/Editor/downloads";
import { BackgroundConfig } from "../common/BackgroundPicker";
import { useProject } from "@/hooks/useProject";
import { getProject } from "@/utils/projectStorage";

export interface CodeEditorState {
  code: string;
  language: string;
  theme: string;
  fontSize: number;
  lineNumbers: boolean;
  padding: number;
  borderRadius: number;
  background: BackgroundConfig;
  windowStyle: "none" | "macos" | "windows";
  windowTitle: string;
  shadow: string;
  opacity: number;
  
  // Editor Settings
  lineStart: number;
  fontFamily: string;
  ligatures: boolean;

  // Frame Settings
  aspectRatio: { name: string; value: string };
  frameVisible: boolean;
  frameOpacity: number;

  // Window Settings
  headerVisible: boolean;
  windowBackground: "default" | "alternative";
  borderStyle: "none" | "solid" | "glass" | "gradient";
  shadowStyle: "none" | "subtle" | "medium" | "strong" | "bottom";
  reflection: boolean;
  reflectionOpacity: number;
  watermark: { visible: boolean; text: string };
  
  // New: Tilt and noise
  tilt: { name: string; value: string };
  noise: boolean;
  
  // Transforms (like screenshot editor)
  scale: number;
  canvasRoundness: number;
  left: number;
  top: number;
  rotate: number;
}

const defaultCode = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Calculate first 10 fibonacci numbers
const results = [];
for (let i = 0; i < 10; i++) {
  results.push(fibonacci(i));
}

console.log(results);
// Output: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]`;

const CodeEditorLayout: React.FC = () => {
  const previewRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [projectLoaded, setProjectLoaded] = useState(false);
  
  // Project system - Canva-style auto-save
  const project = useProject({
    type: "code",
    defaultName: "Untitled Code",
    silentSave: true,
  });

  const [state, setState] = useState<CodeEditorState>({
    code: defaultCode,
    language: "javascript",
    theme: "dracula",
    fontSize: 14,
    lineNumbers: true,
    padding: 32,
    borderRadius: 12,
    background: {
      type: "solid",
      background: "#f0eff5",
      color1: "#f0eff5",
      color2: "#f0eff5",
      direction: "to right",
    },
    windowStyle: "macos",
    windowTitle: "index.js",
    shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
    opacity: 100,
    
    // Editor Settings
    lineStart: 1,
    fontFamily: "'JetBrains Mono', monospace",
    ligatures: true,

    // Frame Settings
    aspectRatio: { name: "Auto", value: "auto" },
    frameVisible: true,
    frameOpacity: 100,

    // Window Settings
    headerVisible: true,
    windowBackground: "default",
    borderStyle: "none",
    shadowStyle: "strong",
    reflection: false,
    reflectionOpacity: 0.3,
    watermark: { visible: false, text: "" },
    
    // Tilt and noise
    tilt: { name: "to center", value: "rotate(0)" },
    noise: false,
    
    // Transforms
    scale: 1,
    canvasRoundness: 0,
    left: 0,
    top: 0,
    rotate: 0,
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
    if (!state.code || state.code === defaultCode) return;
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      project.save(state, previewRef.current);
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const updateState = (key: keyof CodeEditorState, value: any) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleExport = (format: "png" | "jpeg" | "svg", scale: number = 2) => {
    if (!previewRef.current) return;
    
    if (format === "png") {
      downloadimagePng(previewRef.current, scale);
    } else if (format === "jpeg") {
      downloadimageJpeg(previewRef.current, scale);
    } else {
      downloadimageSvg(previewRef.current, scale);
    }
  };

  const handleCopy = async () => {
    if (!previewRef.current) {
      toast.error("No preview to copy");
      return;
    }
    await copyToClipboard(previewRef.current);
  };

  return (
    <main className="min-h-[100vh] h-fit editor-bg relative pb-20 lg:pb-0">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-3 sm:px-4 lg:px-0 relative">
        <div className="flex flex-col lg:grid lg:gap-5 lg:grid-cols-[3fr_1.5fr]">
          <CodePreview 
            state={state} 
            previewRef={previewRef} 
            onExport={handleExport} 
            onCopy={handleCopy}
            projectName={project.projectName}
            onProjectNameChange={project.setProjectName}
            isSaving={project.isSaving}
          />
          <CodeControls state={state} updateState={updateState} />
        </div>
      </section>
    </main>
  );
};

export default CodeEditorLayout;
