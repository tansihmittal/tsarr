// Project storage utility for saving/loading designs locally
// Uses IndexedDB for larger storage capacity (no 5MB limit)

export interface Project {
  id: string;
  name: string;
  type: 'screenshot' | 'code' | 'tweet' | 'carousel' | 'polaroid' | 'text-behind-image';
  thumbnail: string;
  data: any;
  createdAt: number;
  updatedAt: number;
}

const DB_NAME = 'tsarr_db';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const RECENT_KEY = 'tsarr_recent_projects';
const MAX_RECENT = 10;

// IndexedDB helper
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('No window'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
    };
  });
};

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get all projects (async)
export const getProjectsAsync = async (): Promise<Project[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.index('updatedAt').getAll();
      request.onsuccess = () => {
        const projects = request.result || [];
        resolve(projects.sort((a, b) => b.updatedAt - a.updatedAt));
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
};

// Sync version for backward compatibility
export const getProjects = (): Project[] => {
  if (typeof window === 'undefined') return [];
  // Return cached projects or empty array (async load happens separately)
  try {
    const cached = sessionStorage.getItem('tsarr_projects_cache');
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
};

// Cache projects to session storage for sync access
export const cacheProjects = async (): Promise<Project[]> => {
  const projects = await getProjectsAsync();
  try {
    sessionStorage.setItem('tsarr_projects_cache', JSON.stringify(projects));
  } catch {}
  return projects;
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

// Save project (async)
export const saveProjectAsync = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Project> => {
  const db = await openDB();
  const now = Date.now();
  
  let savedProject: Project;
  
  if (project.id) {
    // Check if exists
    const existing = await getProjectAsync(project.id);
    if (existing) {
      savedProject = { ...existing, ...project, updatedAt: now };
    } else {
      savedProject = { ...project, id: project.id, createdAt: now, updatedAt: now } as Project;
    }
  } else {
    savedProject = { ...project, id: generateId(), createdAt: now, updatedAt: now } as Project;
  }
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(savedProject);
    request.onsuccess = () => {
      addToRecent(savedProject.id);
      cacheProjects(); // Update cache
      resolve(savedProject);
    };
    request.onerror = () => reject(request.error);
  });
};

// Sync wrapper for backward compatibility
export const saveProject = (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Project => {
  const now = Date.now();
  const savedProject: Project = {
    ...project,
    id: project.id || generateId(),
    createdAt: now,
    updatedAt: now,
  } as Project;
  
  // Fire async save
  saveProjectAsync(project).catch(console.error);
  
  return savedProject;
};

// Get single project (async)
export const getProjectAsync = async (id: string): Promise<Project | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
};

// Sync version
export const getProject = (id: string): Project | null => {
  const projects = getProjects();
  return projects.find(p => p.id === id) || null;
};

// Delete project
export const deleteProject = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => {
        removeFromRecent(id);
        cacheProjects();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch {}
};

// Duplicate project
export const duplicateProject = async (id: string): Promise<Project | null> => {
  const project = await getProjectAsync(id);
  if (!project) return null;
  
  return saveProjectAsync({
    name: `${project.name} (Copy)`,
    type: project.type,
    thumbnail: project.thumbnail,
    data: { ...project.data },
  });
};

// Rename project
export const renameProject = async (id: string, name: string): Promise<Project | null> => {
  const project = await getProjectAsync(id);
  if (!project) return null;
  
  return saveProjectAsync({ ...project, name });
};

// Update project name only (optimized)
export const updateProjectName = async (id: string, name: string): Promise<void> => {
  try {
    const db = await openDB();
    const project = await getProjectAsync(id);
    if (!project) return;
    
    project.name = name;
    project.updatedAt = Date.now();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(project);
      request.onsuccess = () => {
        cacheProjects();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch {}
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
export const generateThumbnail = async (element: HTMLElement | HTMLCanvasElement | null): Promise<string> => {
  if (!element) return '';
  
  try {
    // If it's already a canvas, use it directly
    if (element instanceof HTMLCanvasElement) {
      const tempCanvas = document.createElement('canvas');
      const scale = 0.3;
      tempCanvas.width = element.width * scale;
      tempCanvas.height = element.height * scale;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(element, 0, 0, tempCanvas.width, tempCanvas.height);
        return tempCanvas.toDataURL('image/jpeg', 0.6);
      }
    }
    
    // Otherwise use html2canvas
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

// Get storage usage (IndexedDB has much larger limits)
export const getStorageUsage = async (): Promise<{ used: number; total: number; percentage: number }> => {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const total = estimate.quota || 100 * 1024 * 1024; // Default 100MB
      return {
        used,
        total,
        percentage: Math.round((used / total) * 100),
      };
    }
  } catch {}
  return { used: 0, total: 100 * 1024 * 1024, percentage: 0 };
};

// Clear all projects
export const clearAllProjects = async (): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => {
        localStorage.removeItem(RECENT_KEY);
        sessionStorage.removeItem('tsarr_projects_cache');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch {}
};

// Initialize - call on app load
export const initProjectStorage = async (): Promise<void> => {
  await cacheProjects();
};
