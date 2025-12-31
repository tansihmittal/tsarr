import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import {
  Project,
  saveProjectAsync,
  getProjectAsync,
  generateThumbnail,
  generateId,
  updateProjectName,
} from "../utils/projectStorage";

interface UseProjectOptions {
  type: Project["type"];
  defaultName?: string;
  autoSaveInterval?: number; // ms, 0 to disable
  silentSave?: boolean; // Don't show toast on save
}

interface UseProjectReturn {
  projectId: string | null;
  projectName: string;
  setProjectName: (name: string) => void;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  save: (data: any, element?: HTMLElement | HTMLCanvasElement | null) => Promise<void>;
  saveAs: (name: string, data: any, element?: HTMLElement | HTMLCanvasElement | null) => Promise<void>;
  loadProject: () => Promise<any | null>;
  markChanged: () => void;
  isNewProject: boolean;
}

export const useProject = (options: UseProjectOptions): UseProjectReturn => {
  const router = useRouter();
  const { type, defaultName = "Untitled", autoSaveInterval = 30000, silentSave = true } = options;

  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectNameState] = useState(defaultName);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isNewProject, setIsNewProject] = useState(true);

  const dataRef = useRef<any>(null);
  const elementRef = useRef<HTMLElement | HTMLCanvasElement | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load project from URL on mount
  useEffect(() => {
    const loadFromUrl = async () => {
      const { project: projectIdFromUrl } = router.query;
      
      if (projectIdFromUrl && typeof projectIdFromUrl === "string") {
        const existingProject = await getProjectAsync(projectIdFromUrl);
        if (existingProject) {
          setProjectId(existingProject.id);
          setProjectNameState(existingProject.name);
          setIsNewProject(false);
          setLastSaved(new Date(existingProject.updatedAt));
        }
      } else {
        // New project
        setProjectId(null);
        setProjectNameState(defaultName);
        setIsNewProject(true);
      }
    };
    
    loadFromUrl();
  }, [router.query, defaultName]);

  // Auto-save timer
  useEffect(() => {
    if (autoSaveInterval > 0 && hasUnsavedChanges && dataRef.current) {
      autoSaveTimerRef.current = setTimeout(() => {
        save(dataRef.current, elementRef.current);
      }, autoSaveInterval);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, autoSaveInterval]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Set project name with immediate DB update
  const setProjectName = useCallback(async (name: string) => {
    setProjectNameState(name);
    if (projectId) {
      await updateProjectName(projectId, name);
    }
  }, [projectId]);

  const save = useCallback(
    async (data: any, element?: HTMLElement | HTMLCanvasElement | null) => {
      setIsSaving(true);
      dataRef.current = data;
      if (element) elementRef.current = element;

      try {
        const thumbnail = await generateThumbnail(elementRef.current);
        
        const savedProject = await saveProjectAsync({
          id: projectId || undefined,
          name: projectName,
          type,
          thumbnail,
          data,
        });

        setProjectId(savedProject.id);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        setIsNewProject(false);

        // Update URL without reload
        if (!router.query.project) {
          router.replace(
            { pathname: router.pathname, query: { project: savedProject.id } },
            undefined,
            { shallow: true }
          );
        }

        // Only show toast if not silent (for manual saves)
        if (!silentSave) {
          toast.success("Saved", { duration: 1500 });
        }
      } catch (error) {
        console.error("Save failed:", error);
        toast.error("Failed to save");
      } finally {
        setIsSaving(false);
      }
    },
    [projectId, projectName, type, router, silentSave]
  );

  const saveAs = useCallback(
    async (name: string, data: any, element?: HTMLElement | HTMLCanvasElement | null) => {
      setProjectId(null); // Force new project
      setProjectNameState(name);
      await save(data, element);
    },
    [save]
  );

  const loadProject = useCallback(async (): Promise<any | null> => {
    if (!projectId) return null;
    const project = await getProjectAsync(projectId);
    return project?.data || null;
  }, [projectId]);

  const markChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  return {
    projectId,
    projectName,
    setProjectName,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    save,
    saveAs,
    loadProject,
    markChanged,
    isNewProject,
  };
};
