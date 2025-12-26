import { useState, useRef } from "react";
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
    <main className="min-h-[100vh] h-fit editor-bg relative">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-4 lg:px-0 relative">
        <div className="grid gap-5 lg:grid-cols-[3fr_1.5fr]">
          <TweetPreview
            state={state}
            previewRef={previewRef}
            onExport={handleExport}
            onCopy={handleCopy}
            updateState={updateState}
          />
          <TweetControls state={state} updateState={updateState} />
        </div>
      </section>
    </main>
  );
};

export default TweetEditorLayout;
