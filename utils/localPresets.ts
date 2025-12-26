import { LocalPreset, PresetSettings } from "@/interface";

const STORAGE_KEY = "snappy-presets";

/**
 * Validates a preset name.
 * Returns an error message if invalid, or null if valid.
 */
export function validatePresetName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return "Preset name cannot be empty";
  }
  return null;
}

/**
 * Retrieves all local presets from localStorage.
 * Returns an empty array if no presets exist or if data is corrupted.
 */
export function getLocalPresets(): LocalPreset[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      console.error("Invalid preset data format in localStorage");
      return [];
    }
    return parsed as LocalPreset[];
  } catch (error) {
    console.error("Failed to parse presets from localStorage:", error);
    return [];
  }
}

/**
 * Saves a preset to localStorage.
 * If a preset with the same name exists, it will be overwritten.
 * Returns the saved preset on success, or null on failure.
 */
export function saveLocalPreset(
  name: string,
  settings: PresetSettings
): LocalPreset | null {
  const validationError = validatePresetName(name);
  if (validationError) {
    console.error(validationError);
    return null;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const presets = getLocalPresets();
    const trimmedName = name.trim();
    
    // Check if preset with same name exists
    const existingIndex = presets.findIndex((p) => p.name === trimmedName);
    
    const newPreset: LocalPreset = {
      id: existingIndex >= 0 ? presets[existingIndex].id : generateId(),
      name: trimmedName,
      createdAt: Date.now(),
      settings,
    };

    if (existingIndex >= 0) {
      // Overwrite existing preset
      presets[existingIndex] = newPreset;
    } else {
      // Add new preset
      presets.push(newPreset);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    return newPreset;
  } catch (error) {
    console.error("Failed to save preset to localStorage:", error);
    return null;
  }
}

/**
 * Deletes a preset from localStorage by ID.
 * Returns true if deletion was successful, false otherwise.
 */
export function deleteLocalPreset(id: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const presets = getLocalPresets();
    const filteredPresets = presets.filter((p) => p.id !== id);
    
    if (filteredPresets.length === presets.length) {
      // Preset not found
      return false;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPresets));
    return true;
  } catch (error) {
    console.error("Failed to delete preset from localStorage:", error);
    return false;
  }
}

/**
 * Generates a unique ID for a preset.
 */
function generateId(): string {
  return `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Checks if a preset with the given name already exists.
 */
export function presetNameExists(name: string): boolean {
  const presets = getLocalPresets();
  return presets.some((p) => p.name === name.trim());
}
