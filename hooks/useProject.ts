import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import {
  Project,
  saveProject,
  getProject,
  generateThumbnail,
  generateId,
} from "../utils/projectStorage";

interface UseProjectOptions {
  type: Project["type"];
  defaultName?: string;
  autoSaveInterval?: number; // ms, 0 to disable
}

interface UseProjectReturn {
  projectId: string | null;
  projectName: string;
  setProjectName: (name: string) => void;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  save: (data: any, element?: HTMLElement | null) => Promise<void>;
  saveAs: (name: string, data: any, element?: HTMLElement | null) => Promise<void>;
  loadProject: () => any | null;
  markChanged: () => void;
  isNewProject: boolean;
}

export const useProject = (options: UseProjectOptions): UseProjectReturn => {
  const router = useRouter();
  const { type, defaultName = "Untitled", autoSaveInterval = 30000 } = options;

  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState(defaultName);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isNewProject, setIsNewProject] = useState(true);

  const dataRef = useRef<any>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load project from URL on mount
  useEffect(() => {
    const { project: projectIdFromUrl } = router.query;
    
    if (projectIdFromUrl && typeof projectIdFromUrl === "string") {
      const existingProject = getProject(projectIdFromUrl);
      if (existingProject) {
        setProjectId(existingProject.id);
        setProjectName(existingProject.name);
        setIsNewProject(false);
        setLastSaved(new Date(existingProject.updatedAt));
      }
    } else {
      // New project
      setProjectId(null);
      setProjectName(defaultName);
      setIsNewProject(true);
    }
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

  const save = useCallback(
    async (data: any, element?: HTMLElement | null) => {
      setIsSaving(true);
      dataRef.current = data;
      if (element) elementRef.current = element;

      try {
        const thumbnail = await generateThumbnail(elementRef.current);
        
        const savedProject = saveProject({
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

        toast.success("Saved", { duration: 1500 });
      } catch (error) {
        console.error("Save failed:", error);
        toast.error("Failed to save");
      } finally {
        setIsSaving(false);
      }
    },
    [projectId, projectName, type, router]
  );

  const saveAs = useCallback(
    async (name: string, data: any, element?: HTMLElement | null) => {
      setProjectId(null); // Force new project
      setProjectName(name);
      await save(data, element);
    },
    [save]
  );

  const loadProject = useCallback((): any | null => {
    if (!projectId) return null;
    const project = getProject(projectId);
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
