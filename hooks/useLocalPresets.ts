import { useState, useEffect, useCallback } from "react";
import { LocalPreset, PresetSettings } from "@/interface";
import {
  getLocalPresets,
  saveLocalPreset as saveToStorage,
  deleteLocalPreset as deleteFromStorage,
  validatePresetName,
} from "@/utils/localPresets";
import { useEditorContext } from "@/context/Editor";

export interface SaveResult {
  success: boolean;
  error?: string;
}

export interface UseLocalPresetsReturn {
  presets: LocalPreset[];
  loading: boolean;
  savePreset: (name: string, settings: PresetSettings) => SaveResult;
  deletePreset: (id: string) => boolean;
  applyPreset: (preset: LocalPreset) => void;
  getPresetByName: (name: string) => LocalPreset | undefined;
}

/**
 * Custom hook for managing local presets.
 * Provides CRUD operations and integration with the Editor context.
 */
export function useLocalPresets(): UseLocalPresetsReturn {
  const [presets, setPresets] = useState<LocalPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const editorContext = useEditorContext();

  // Load presets from localStorage on mount
  useEffect(() => {
    const loadPresets = () => {
      const storedPresets = getLocalPresets();
      setPresets(storedPresets);
      setLoading(false);
    };

    loadPresets();
  }, []);

  /**
   * Saves a preset with the given name and settings.
   * Returns a SaveResult indicating success or failure.
   */
  const savePreset = useCallback(
    (name: string, settings: PresetSettings): SaveResult => {
      const validationError = validatePresetName(name);
      if (validationError) {
        return { success: false, error: validationError };
      }

      const savedPreset = saveToStorage(name, settings);
      if (!savedPreset) {
        return { success: false, error: "Failed to save preset" };
      }

      // Update local state with the new preset
      setPresets((prev) => {
        const existingIndex = prev.findIndex((p) => p.id === savedPreset.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = savedPreset;
          return updated;
        }
        return [...prev, savedPreset];
      });

      return { success: true };
    },
    []
  );

  /**
   * Deletes a preset by ID.
   * Returns true if deletion was successful.
   */
  const deletePreset = useCallback((id: string): boolean => {
    const success = deleteFromStorage(id);
    if (success) {
      setPresets((prev) => prev.filter((p) => p.id !== id));
    }
    return success;
  }, []);

  /**
   * Applies a preset's settings to the current editor state.
   */
  const applyPreset = useCallback(
    (preset: LocalPreset): void => {
      if (!editorContext.updatePreset) {
        console.error("Editor context updatePreset function not available");
        return;
      }

      const { settings } = preset;
      
      // Apply all settings from the preset to the editor
      editorContext.updatePreset({
        presetName: preset.name,
        currentBackground: settings.currentBackground,
        currentBackgroundType: settings.currentBackgroundType,
        scale: settings.scale,
        borderRadius: settings.borderRadius,
        canvasRoundness: settings.canvasRoundness,
        padding: settings.padding,
        left: settings.left,
        right: settings.right,
        tilt: settings.tilt,
        rotate: settings.rotate,
        aspectRatio: settings.aspectRatio,
        currentBoxShadow: settings.currentBoxShadow,
        noise: settings.noise,
        watermark: settings.watermark,
        selectedFrame: settings.selectedFrame,
      });
    },
    [editorContext]
  );

  /**
   * Finds a preset by name.
   * Returns undefined if not found.
   */
  const getPresetByName = useCallback(
    (name: string): LocalPreset | undefined => {
      return presets.find((p) => p.name === name.trim());
    },
    [presets]
  );

  return {
    presets,
    loading,
    savePreset,
    deletePreset,
    applyPreset,
    getPresetByName,
  };
}

export default useLocalPresets;
