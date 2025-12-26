import { useState, useEffect, useCallback } from "react";

export interface CustomPreset<T> {
  id: string;
  name: string;
  data: T;
  createdAt: number;
}

export function useCustomPresets<T>(storageKey: string) {
  const [presets, setPresets] = useState<CustomPreset<T>[]>([]);

  // Load presets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setPresets(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load presets:", error);
    }
  }, [storageKey]);

  // Save preset
  const savePreset = useCallback((name: string, data: T): boolean => {
    if (!name.trim()) return false;
    
    const newPreset: CustomPreset<T> = {
      id: `preset-${Date.now()}`,
      name: name.trim(),
      data,
      createdAt: Date.now(),
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    return true;
  }, [presets, storageKey]);

  // Delete preset
  const deletePreset = useCallback((id: string) => {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }, [presets, storageKey]);

  // Update preset
  const updatePreset = useCallback((id: string, name: string, data: T) => {
    const updated = presets.map((p) =>
      p.id === id ? { ...p, name, data } : p
    );
    setPresets(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }, [presets, storageKey]);

  return {
    presets,
    savePreset,
    deletePreset,
    updatePreset,
  };
}

export default useCustomPresets;
