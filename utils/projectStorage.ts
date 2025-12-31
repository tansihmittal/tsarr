// Project storage utility for saving/loading designs locally

export interface Project {
  id: string;
  name: string;
  type: 'screenshot' | 'code' | 'tweet' | 'carousel' | 'polaroid' | 'text-behind-image';
  thumbnail: string;
  data: any;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'tsarr_projects';
const RECENT_KEY = 'tsarr_recent_projects';
const MAX_RECENT = 10;

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get all projects
export const getProjects = (): Project[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Get projects by type
export const getProjectsByType = (type: Project['type']): Project[] => {
  return getProjects().filter(p => p.type === type);
};

// Get recent projects
export const getRecentProjects = (): Project[] => {
  if (typeof window === 'undefined') return [];
  try {
    const recentIds = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    const projects = getProjects();
    return recentIds
      .map((id: string) => projects.find(p => p.id === id))
      .filter(Boolean)
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
};

// Save project
export const saveProject = (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Project => {
  const projects = getProjects();
  const now = Date.now();
  
  let savedProject: Project;
  
  if (project.id) {
    // Update existing
    const index = projects.findIndex(p => p.id === project.id);
    if (index >= 0) {
      savedProject = {
        ...projects[index],
        ...project,
        updatedAt: now,
      };
      projects[index] = savedProject;
    } else {
      savedProject = {
        ...project,
        id: project.id,
        createdAt: now,
        updatedAt: now,
      } as Project;
      projects.unshift(savedProject);
    }
  } else {
    // Create new
    savedProject = {
      ...project,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    } as Project;
    projects.unshift(savedProject);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  addToRecent(savedProject.id);
  
  return savedProject;
};

// Get single project
export const getProject = (id: string): Project | null => {
  const projects = getProjects();
  return projects.find(p => p.id === id) || null;
};

// Delete project
export const deleteProject = (id: string): void => {
  const projects = getProjects().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  removeFromRecent(id);
};

// Duplicate project
export const duplicateProject = (id: string): Project | null => {
  const project = getProject(id);
  if (!project) return null;
  
  return saveProject({
    name: `${project.name} (Copy)`,
    type: project.type,
    thumbnail: project.thumbnail,
    data: { ...project.data },
  });
};

// Rename project
export const renameProject = (id: string, name: string): Project | null => {
  const project = getProject(id);
  if (!project) return null;
  
  return saveProject({ ...project, name });
};

// Add to recent
const addToRecent = (id: string): void => {
  try {
    let recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    recent = [id, ...recent.filter((r: string) => r !== id)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {}
};

// Remove from recent
const removeFromRecent = (id: string): void => {
  try {
    let recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    recent = recent.filter((r: string) => r !== id);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {}
};

// Generate thumbnail from canvas/element
export const generateThumbnail = async (element: HTMLElement | null): Promise<string> => {
  if (!element) return '';
  
  try {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(element, {
      scale: 0.3,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });
    return canvas.toDataURL('image/jpeg', 0.6);
  } catch {
    return '';
  }
};

// Get storage usage
export const getStorageUsage = (): { used: number; total: number; percentage: number } => {
  try {
    const data = localStorage.getItem(STORAGE_KEY) || '';
    const used = new Blob([data]).size;
    const total = 5 * 1024 * 1024; // 5MB typical limit
    return {
      used,
      total,
      percentage: Math.round((used / total) * 100),
    };
  } catch {
    return { used: 0, total: 5 * 1024 * 1024, percentage: 0 };
  }
};

// Clear all projects
export const clearAllProjects = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(RECENT_KEY);
};
