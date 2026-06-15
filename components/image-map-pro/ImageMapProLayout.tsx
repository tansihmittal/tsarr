import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import Navigation from "../common/Navigation";
import { Button } from "@/components/ui/button";
import { BsStars, BsUpload, BsTrash, BsPlus, BsImage } from "react-icons/bs";
import type { DetectedRegion } from "@/pages/api/detect-regions";

const DB_KEY = "imp-projects";
const LAST_ID_KEY = "imp-last-id";

interface ProjectEntry {
  id: string;
  name: string;
  json: string;
  shortcode?: string;
  updatedAt: number;
}

function loadProjects(): ProjectEntry[] {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveProjects(projects: ProjectEntry[]) {
  localStorage.setItem(DB_KEY, JSON.stringify(projects));
}

const ImageMapProLayout: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);

  // Refresh sidebar project list
  const refreshProjects = useCallback(() => {
    setProjects(loadProjects());
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  // Send message to iframe editor
  const send = useCallback((data: object) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(data), "*");
  }, []);

  // Handle postMessage from the iframe editor
  useEffect(() => {
    const handler = async (e: MessageEvent) => {
      let data: any;
      try {
        data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (!data?.action) return;

      switch (data.action) {
        case "getLastProjectId": {
          const id = localStorage.getItem(LAST_ID_KEY) || "";
          send({ action: "getLastProjectId", id });
          break;
        }
        case "getProjectsList": {
          const list = loadProjects().map((p) => ({
            id: p.id,
            name: p.name,
            shortcode: p.shortcode || "",
          }));
          send({ action: "getProjectsList", projectsList: list });
          break;
        }
        case "getProject": {
          const found = loadProjects().find((p) => p.id === data.id);
          send({
            action: "getProject",
            project: found ? JSON.parse(found.json) : null,
          });
          break;
        }
        case "saveProject": {
          const projects = loadProjects();
          const idx = projects.findIndex((p) => p.id === data.id);
          const entry: ProjectEntry = {
            id: data.id,
            name: data.name || "Untitled",
            json: typeof data.json === "string" ? data.json : JSON.stringify(data.json),
            shortcode: data.shortcode || "",
            updatedAt: Date.now(),
          };
          if (idx >= 0) projects[idx] = entry;
          else projects.push(entry);
          saveProjects(projects);
          localStorage.setItem(LAST_ID_KEY, data.id);
          refreshProjects();
          send({ action: "saveProject", result: "success" });
          break;
        }
        case "deleteProject": {
          const projects = loadProjects().filter((p) => p.id !== data.id);
          saveProjects(projects);
          refreshProjects();
          send({ action: "deleteProject", result: "success" });
          break;
        }
        // Legacy actions
        case "save": {
          const projects = loadProjects();
          const idx = projects.findIndex((p) => p.id === data.id);
          const entry: ProjectEntry = {
            id: data.id,
            name: data.name || "Untitled",
            json: typeof data.json === "string" ? data.json : JSON.stringify(data.json),
            shortcode: data.shortcode || "",
            updatedAt: Date.now(),
          };
          if (idx >= 0) projects[idx] = entry;
          else projects.push(entry);
          saveProjects(projects);
          localStorage.setItem(LAST_ID_KEY, data.id);
          refreshProjects();
          send({ action: "save", result: "success" });
          break;
        }
        case "getSaves": {
          const maps = loadProjects().map((p) => {
            try {
              return JSON.parse(p.json);
            } catch {
              return null;
            }
          }).filter(Boolean);
          send({ action: "getSaves", maps });
          break;
        }
        case "getLastSave": {
          const lastId = localStorage.getItem(LAST_ID_KEY);
          const found = lastId ? loadProjects().find((p) => p.id === lastId) : null;
          send({
            action: "getLastSave",
            map: found ? JSON.parse(found.json) : false,
          });
          break;
        }
        case "deleteSave": {
          const projects = loadProjects().filter((p) => p.id !== data.id);
          saveProjects(projects);
          refreshProjects();
          send({ action: "deleteSave", result: "success" });
          break;
        }
        case "uploadImage": {
          // Trigger file picker
          fileInputRef.current?.click();
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [send, refreshProjects]);

  // After user picks an image for upload (triggered by editor)
  const handleEditorImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      send({ action: "uploadImage", url: reader.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // AI "Detect Regions" — user picks image, we call API, then inject spots into editor
  const handleAIDetect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setIsDetecting(true);
    const toastId = toast.loading("Detecting regions with AI...");

    try {
      const reader = new FileReader();
      const base64: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/detect-regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Detection failed");
      }

      const regions: DetectedRegion[] = data.regions || [];
      if (regions.length === 0) {
        toast.error("No regions detected — try a different image", { id: toastId });
        return;
      }

      // Inject detected regions into the editor via postMessage
      send({
        action: "addObjects",
        imageUrl: base64,
        objects: regions.map((r) => ({
          type: "rect",
          x: r.x * 100,
          y: r.y * 100,
          width: r.width * 100,
          height: r.height * 100,
          title: r.label,
        })),
      });

      toast.success(`Found ${regions.length} regions!`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "AI detection failed", { id: toastId });
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <Navigation />

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleEditorImageUpload}
      />
      <input
        ref={aiFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAIDetect}
      />

      {/* Toolbar */}
      <div className="border-b bg-white px-4 py-2 flex items-center gap-3 flex-wrap">
        <span className="font-semibold text-sm text-gray-700 flex items-center gap-1.5">
          <BsImage className="w-4 h-4" />
          Image Map Pro
        </span>
        <div className="flex-1" />
        <Button
          variant="secondary"
          size="sm"
          disabled={isDetecting}
          onClick={() => aiFileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-purple-700 border-purple-200 hover:bg-purple-50"
        >
          <BsStars className="w-3.5 h-3.5" />
          {isDetecting ? "Detecting…" : "AI Detect Regions"}
        </Button>
      </div>

      {/* Main: sidebar + editor */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 130px)" }}>
        {/* Saved projects sidebar */}
        <aside className="w-56 border-r bg-white flex flex-col shrink-0 overflow-hidden">
          <div className="px-3 py-2 border-b flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Projects</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {projects.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-4 px-2">
                No projects yet. Create one in the editor!
              </p>
            )}
            {projects
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => send({ action: "loadProject", id: p.id })}
                  className="w-full text-left text-xs px-2 py-2 rounded hover:bg-gray-100 text-gray-700 truncate border border-transparent hover:border-gray-200"
                  title={p.name}
                >
                  {p.name}
                </button>
              ))}
          </div>
        </aside>

        {/* Editor iframe */}
        <div className="flex-1 relative">
          {!iframeReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Loading editor…</span>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src="/imp-editor/index.html"
            className="w-full h-full border-0"
            onLoad={() => setIframeReady(true)}
            title="Image Map Pro Editor"
            allow="clipboard-read; clipboard-write"
          />
        </div>
      </div>
    </div>
  );
};

export default ImageMapProLayout;
