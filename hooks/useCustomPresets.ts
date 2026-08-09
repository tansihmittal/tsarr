import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import {
  getCloudPresetsForTool,
  saveCloudPresetForTool,
  deleteCloudPreset,
} from "@/utils/supabaseStorage";

export interface CustomPreset<T> {
  id: string;
  name: string;
  data: T;
  createdAt: number;
  cloudId?: string;
}

// Write the cloud ID back into localStorage after a successful cloud save
function patchCloudId<T>(storageKey: string, localId: string, cloudId: string) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    const saved: CustomPreset<T>[] = JSON.parse(raw);
    const patched = saved.map((p) => (p.id === localId ? { ...p, cloudId } : p));
    localStorage.setItem(storageKey, JSON.stringify(patched));
  } catch {
    // non-fatal
  }
}

export function useCustomPresets<T>(storageKey: string, tool?: string) {
  const [presets, setPresets] = useState<CustomPreset<T>[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setPresets(JSON.parse(saved));
    } catch {
      console.error("Failed to load presets from localStorage");
    }
  }, [storageKey]);

  // Merge cloud presets once after local load (if tool is provided)
  useEffect(() => {
    if (!tool) return;
    let cancelled = false;

    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const cloudPresets = await getCloudPresetsForTool(tool);
        if (cancelled) return;

        setPresets((prev) => {
          // Add cloud presets that don't exist locally (match by name, case-insensitive)
          const localNames = new Set(prev.map((p) => p.name.toLowerCase()));
          const cloudOnly = cloudPresets
            .filter((cp) => !localNames.has(cp.preset_name.toLowerCase()))
            .map((cp) => ({
              id: cp.id,
              name: cp.preset_name,
              data: cp.data as T,
              createdAt: new Date(cp.created_at).getTime(),
              cloudId: cp.id,
            }));

          if (cloudOnly.length === 0) return prev;

          // Also update local presets that are missing their cloudId
          const updated = prev.map((p) => {
            const match = cloudPresets.find(
              (cp) => cp.preset_name.toLowerCase() === p.name.toLowerCase()
            );
            return match && !p.cloudId ? { ...p, cloudId: match.id } : p;
          });

          const merged = [...updated, ...cloudOnly];
          localStorage.setItem(storageKey, JSON.stringify(merged));
          return merged;
        });
      } catch {
        // Cloud sync failure is non-fatal
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tool, storageKey]);

  const savePreset = useCallback(
    (name: string, data: T): boolean => {
      if (!name.trim()) return false;

      const localId = `preset-${Date.now()}`;
      const newPreset: CustomPreset<T> = {
        id: localId,
        name: name.trim(),
        data,
        createdAt: Date.now(),
      };

      const updated = [...presets, newPreset];
      setPresets(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));

      // Fire-and-forget cloud save
      if (tool) {
        (async () => {
          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;
            const cloudId = await saveCloudPresetForTool(tool, name.trim(), data as any);
            // Patch cloudId back into state + localStorage
            patchCloudId<T>(storageKey, localId, cloudId);
            setPresets((prev) =>
              prev.map((p) => (p.id === localId ? { ...p, cloudId } : p))
            );
          } catch {
            // non-fatal — preset is still saved locally
          }
        })();
      }

      return true;
    },
    [presets, storageKey, tool]
  );

  const deletePreset = useCallback(
    (id: string) => {
      const preset = presets.find((p) => p.id === id);
      const updated = presets.filter((p) => p.id !== id);
      setPresets(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));

      // Fire-and-forget cloud delete
      if (tool && preset?.cloudId) {
        const cloudId = preset.cloudId;
        (async () => {
          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;
            await deleteCloudPreset(cloudId);
          } catch {
            // non-fatal
          }
        })();
      }
    },
    [presets, storageKey, tool]
  );

  const updatePreset = useCallback(
    (id: string, name: string, data: T) => {
      const updated = presets.map((p) => (p.id === id ? { ...p, name, data } : p));
      setPresets(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    },
    [presets, storageKey]
  );

  return { presets, savePreset, deletePreset, updatePreset };
}

export default useCustomPresets;
