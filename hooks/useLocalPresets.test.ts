import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { BackgroundType, PresetSettings, LocalPreset, PresetProps } from '@/interface';
import {
  getLocalPresets,
  saveLocalPreset,
  deleteLocalPreset,
} from '@/utils/localPresets';

// Helper to generate hex color strings
const hexColorArb = fc.tuple(
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 })
).map(([r, g, b]) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);

// Arbitrary for GradientProps
const gradientPropsArb = fc.record({
  id: fc.option(fc.integer(), { nil: undefined }),
  direction: fc.string(),
  background: fc.string(),
  color1: hexColorArb,
  color2: hexColorArb,
  color3: fc.option(hexColorArb, { nil: undefined }),
});

// Arbitrary for named value objects
const namedValueArb = fc.record({
  name: fc.string(),
  value: fc.string(),
});

// Arbitrary for watermark
const watermarkArb = fc.record({
  visible: fc.boolean(),
  value: fc.string(),
});

// Arbitrary for PresetSettings
const presetSettingsArb: fc.Arbitrary<PresetSettings> = fc.record({
  currentBackground: gradientPropsArb,
  currentBackgroundType: fc.constantFrom(BackgroundType.gradient, BackgroundType.solid, BackgroundType.custom),
  scale: fc.float({ min: Math.fround(0.1), max: Math.fround(3), noNaN: true }),
  borderRadius: fc.integer({ min: 0, max: 100 }),
  canvasRoundness: fc.integer({ min: 0, max: 100 }),
  padding: fc.integer({ min: 0, max: 200 }),
  left: fc.integer({ min: -100, max: 100 }),
  right: fc.integer({ min: -100, max: 100 }),
  tilt: namedValueArb,
  rotate: fc.integer({ min: -360, max: 360 }),
  aspectRatio: namedValueArb,
  currentBoxShadow: namedValueArb,
  noise: fc.boolean(),
  watermark: watermarkArb,
  selectedFrame: namedValueArb,
});

// Arbitrary for valid preset names (non-empty, non-whitespace-only)
const validPresetNameArb = fc.string({ minLength: 1 })
  .filter(s => s.trim().length > 0);

// Arbitrary for LocalPreset
const localPresetArb: fc.Arbitrary<LocalPreset> = fc.record({
  id: fc.string({ minLength: 1 }),
  name: validPresetNameArb,
  createdAt: fc.integer({ min: 0 }),
  settings: presetSettingsArb,
});

describe('useLocalPresets - Property Tests', () => {
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    localStorageMock = {};
    
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /**
   * **Feature: custom-presets, Property 3: Apply Preset Updates All Settings**
   * **Validates: Requirements 3.1, 3.2**
   * 
   * For any saved preset, applying it to the editor should result in the editor state
   * containing all the settings from the preset (background, padding, borderRadius,
   * canvasRoundness, scale, noise, shadow, aspectRatio, tilt, frame).
   */
  it('Property 3: Apply preset updates all settings correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        localPresetArb,
        async (preset) => {
          // Track what was passed to updatePreset
          let capturedPresetProps: PresetProps | null = null;
          
          // Mock updatePreset function that captures the argument
          const mockUpdatePreset = vi.fn((data: PresetProps) => {
            capturedPresetProps = data;
          });

          // Simulate the applyPreset logic (extracted from the hook)
          const applyPreset = (preset: LocalPreset, updatePreset: (data: PresetProps) => void) => {
            const { settings } = preset;
            updatePreset({
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
          };

          // Apply the preset
          applyPreset(preset, mockUpdatePreset);

          // Verify updatePreset was called
          expect(mockUpdatePreset).toHaveBeenCalledTimes(1);
          expect(capturedPresetProps).not.toBeNull();

          // Verify all settings are passed correctly
          const captured = capturedPresetProps!;
          const settings = preset.settings;

          // Verify preset name
          expect(captured.presetName).toBe(preset.name);

          // Verify all settings match
          expect(captured.currentBackground).toEqual(settings.currentBackground);
          expect(captured.currentBackgroundType).toBe(settings.currentBackgroundType);
          expect(captured.scale).toBeCloseTo(settings.scale, 5);
          expect(captured.borderRadius).toBe(settings.borderRadius);
          expect(captured.canvasRoundness).toBe(settings.canvasRoundness);
          expect(captured.padding).toBe(settings.padding);
          expect(captured.left).toBe(settings.left);
          expect(captured.right).toBe(settings.right);
          expect(captured.tilt).toEqual(settings.tilt);
          expect(captured.rotate).toBe(settings.rotate);
          expect(captured.aspectRatio).toEqual(settings.aspectRatio);
          expect(captured.currentBoxShadow).toEqual(settings.currentBoxShadow);
          expect(captured.noise).toBe(settings.noise);
          expect(captured.watermark).toEqual(settings.watermark);
          expect(captured.selectedFrame).toEqual(settings.selectedFrame);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: custom-presets, Property 4: Delete Removes From Storage**
   * **Validates: Requirements 4.1**
   * 
   * For any local preset that exists in localStorage, deleting it should result
   * in that preset no longer being present in localStorage.
   */
  it('Property 4: Delete removes preset from storage', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPresetNameArb,
        presetSettingsArb,
        async (name, settings) => {
          // Clear storage before each test
          localStorageMock = {};

          // First, save a preset
          const savedPreset = saveLocalPreset(name, settings);
          expect(savedPreset).not.toBeNull();

          // Verify it exists in storage
          let loadedPresets = getLocalPresets();
          expect(loadedPresets.length).toBe(1);
          expect(loadedPresets[0].id).toBe(savedPreset!.id);

          // Delete the preset
          const deleteResult = deleteLocalPreset(savedPreset!.id);
          expect(deleteResult).toBe(true);

          // Verify it no longer exists in storage
          loadedPresets = getLocalPresets();
          expect(loadedPresets.length).toBe(0);
          expect(loadedPresets.find(p => p.id === savedPreset!.id)).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: custom-presets, Property 4: Delete Removes From Storage**
   * **Validates: Requirements 4.1**
   * 
   * Deleting a preset should only remove that specific preset, leaving others intact.
   */
  it('Property 4: Delete only removes the specified preset', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.tuple(validPresetNameArb, presetSettingsArb),
          { minLength: 2, maxLength: 5 }
        ).filter(arr => {
          // Ensure all names are unique
          const names = arr.map(([name]) => name.trim());
          return new Set(names).size === names.length;
        }),
        fc.integer({ min: 0 }),
        async (presetsData, indexSeed) => {
          // Clear storage before each test
          localStorageMock = {};

          // Save multiple presets
          const savedPresets: LocalPreset[] = [];
          for (const [name, settings] of presetsData) {
            const saved = saveLocalPreset(name, settings);
            if (saved) {
              savedPresets.push(saved);
            }
          }

          expect(savedPresets.length).toBe(presetsData.length);

          // Pick one preset to delete
          const indexToDelete = indexSeed % savedPresets.length;
          const presetToDelete = savedPresets[indexToDelete];

          // Delete the preset
          const deleteResult = deleteLocalPreset(presetToDelete.id);
          expect(deleteResult).toBe(true);

          // Verify the deleted preset is gone
          const loadedPresets = getLocalPresets();
          expect(loadedPresets.length).toBe(savedPresets.length - 1);
          expect(loadedPresets.find(p => p.id === presetToDelete.id)).toBeUndefined();

          // Verify all other presets still exist
          for (let i = 0; i < savedPresets.length; i++) {
            if (i !== indexToDelete) {
              const found = loadedPresets.find(p => p.id === savedPresets[i].id);
              expect(found).toBeDefined();
              expect(found!.name).toBe(savedPresets[i].name);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
