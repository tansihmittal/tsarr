import { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import Navigation from "../common/Navigation";
import TweetPreview from "./TweetPreview";
import TweetControls from "./TweetControls";
import {
  downloadimagePng,
  downloadimageJpeg,
  downloadimageSvg,
  copyToClipboard,
} from "../edtior/Editor/downloads";
import { BackgroundConfig } from "../common/BackgroundPicker";
import { useProject } from "@/hooks/useProject";
import { getProject } from "@/utils/projectStorage";
import { imageToBase64 } from "@/utils/imageStorage";

export interface TweetEditorState {
  displayName: string;
  username: string;
  avatarUrl: string;
  verified: boolean;
  tweetText: string;
  date: Date;
  likes: string;
  retweets: string;
  replies: string;
  views: string;
  bookmarks: string;
  theme: "light" | "dark" | "dim";
  background: BackgroundConfig;
  padding: number;
  borderRadius: number;
  cardStyle: "default" | "minimal" | "detailed";
  showMetrics: boolean;
  showTimestamp: boolean;
  showSource: boolean;
  frameVisible: boolean;
  tilt: { name: string; value: string };
  shadow: string;
  noise: boolean;
  left: number;
  top: number;
  rotate: number;
  source: "web" | "ios" | "android";
  scale: number;
  canvasRoundness: number;
}

const TweetEditorLayout: React.FC = () => {
  const previewRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [projectLoaded, setProjectLoaded] = useState(false);

  // Project system - Canva-style auto-save
  const project = useProject({
    type: "tweet",
    defaultName: "Untitled Tweet",
    silentSave: true,
  });

  const [state, setState] = useState<TweetEditorState>({
    displayName: "Your Name",
    username: "username",
    avatarUrl: "",
    verified: true,
    tweetText:
      "Just shipped something amazing! 🚀\n\nBuilding in public is the best way to learn and grow.",
    date: new Date(),
    likes: "1,234",
    retweets: "567",
    replies: "89",
    views: "45.6K",
    bookmarks: "123",
    theme: "dark",
    background: {
      type: "gradient",
      background: "linear-gradient(to right, #667eea, #764ba2, #f093fb)",
      color1: "#667eea",
      color2: "#764ba2",
      color3: "#f093fb",
      direction: "to right",
    },
    padding: 40,
    borderRadius: 16,
    cardStyle: "default",
    showMetrics: true,
    showTimestamp: true,
    showSource: true,
    frameVisible: true,
    tilt: { name: "to center", value: "rotate(0)" },
    shadow: "5px 20px 30px rgba(0, 0, 0, 0.3)",
    noise: false,
    left: 0,
    top: 0,
    rotate: 0,
    source: "web",
    scale: 1,
    canvasRoundness: 0,
  });

  // Load project data when project ID is in URL
  useEffect(() => {
    if (project.projectId && !projectLoaded) {
      const savedProject = getProject(project.projectId);
      if (savedProject?.data) {
        setState({ ...savedProject.data, date: new Date(savedProject.data.date) });
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
      // Convert blob URL to base64 for persistence (avatar image)
      if (stateToSave.avatarUrl && stateToSave.avatarUrl.startsWith('blob:')) {
        stateToSave.avatarUrl = await imageToBase64(stateToSave.avatarUrl);
      }
      project.save(stateToSave, previewRef.current);
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [state]);

  const updateState = (updates: Partial<TweetEditorState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleExport = (format: "png" | "jpeg" | "svg", scale: number = 2) => {
    if (!previewRef.current) return;
    if (format === "png") downloadimagePng(previewRef.current, scale);
    else if (format === "jpeg") downloadimageJpeg(previewRef.current, scale);
    else downloadimageSvg(previewRef.current, scale);
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
        <div className="grid gap-4 lg:gap-5 lg:grid-cols-[3fr_1.5fr]">
          <TweetPreview
            state={state}
            previewRef={previewRef}
            onExport={handleExport}
            onCopy={handleCopy}
            updateState={updateState}
            projectName={project.projectName}
            onProjectNameChange={project.setProjectName}
            isSaving={project.isSaving}
          />
          <TweetControls state={state} updateState={updateState} />
        </div>
      </section>
    </main>
  );
};

export default TweetEditorLayout;
