import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { BackgroundType, PresetSettings, LocalPreset } from '@/interface';
import {
  getLocalPresets,
  saveLocalPreset,
  deleteLocalPreset,
  validatePresetName,
  presetNameExists,
} from './localPresets';

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

describe('localPresets - Property Tests', () => {
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
   * **Feature: custom-presets, Property 1: Preset Serialization Round-Trip**
   * **Validates: Requirements 1.2, 5.1, 5.2**
   * 
   * For any valid preset settings object, serializing to JSON and storing in localStorage,
   * then deserializing and loading, should produce an equivalent preset settings object.
   */
  it('Property 1: Preset serialization round-trip preserves all settings', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPresetNameArb,
        presetSettingsArb,
        async (name, settings) => {
          // Clear storage before each test
          localStorageMock = {};

          // Save the preset
          const savedPreset = saveLocalPreset(name, settings);
          expect(savedPreset).not.toBeNull();
          expect(savedPreset!.name).toBe(name.trim());

          // Load presets from storage
          const loadedPresets = getLocalPresets();
          expect(loadedPresets.length).toBe(1);

          const loadedPreset = loadedPresets[0];
          
          // Verify all settings are preserved
          expect(loadedPreset.settings.currentBackground).toEqual(settings.currentBackground);
          expect(loadedPreset.settings.currentBackgroundType).toBe(settings.currentBackgroundType);
          expect(loadedPreset.settings.scale).toBeCloseTo(settings.scale, 5);
          expect(loadedPreset.settings.borderRadius).toBe(settings.borderRadius);
          expect(loadedPreset.settings.canvasRoundness).toBe(settings.canvasRoundness);
          expect(loadedPreset.settings.padding).toBe(settings.padding);
          expect(loadedPreset.settings.left).toBe(settings.left);
          expect(loadedPreset.settings.right).toBe(settings.right);
          expect(loadedPreset.settings.tilt).toEqual(settings.tilt);
          expect(loadedPreset.settings.rotate).toBe(settings.rotate);
          expect(loadedPreset.settings.aspectRatio).toEqual(settings.aspectRatio);
          expect(loadedPreset.settings.currentBoxShadow).toEqual(settings.currentBoxShadow);
          expect(loadedPreset.settings.noise).toBe(settings.noise);
          expect(loadedPreset.settings.watermark).toEqual(settings.watermark);
          expect(loadedPreset.settings.selectedFrame).toEqual(settings.selectedFrame);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: custom-presets, Property 2: Whitespace Names Are Invalid**
   * **Validates: Requirements 1.3**
   * 
   * For any string composed entirely of whitespace characters (spaces, tabs, newlines),
   * attempting to save a preset with that name should be rejected and return an error.
   */
  it('Property 2: Whitespace-only names are rejected', async () => {
    // Arbitrary for whitespace-only strings
    const whitespaceOnlyArb = fc.array(
      fc.constantFrom(' ', '\t', '\n', '\r'),
      { minLength: 1, maxLength: 20 }
    ).map(arr => arr.join(''));

    await fc.assert(
      fc.asyncProperty(
        whitespaceOnlyArb,
        presetSettingsArb,
        async (whitespaceOnlyName: string, settings) => {
          // Clear storage before each test
          localStorageMock = {};

          // Validate the name - should return an error
          const validationError = validatePresetName(whitespaceOnlyName);
          expect(validationError).not.toBeNull();
          expect(validationError).toBe("Preset name cannot be empty");

          // Attempt to save - should return null
          const savedPreset = saveLocalPreset(whitespaceOnlyName, settings);
          expect(savedPreset).toBeNull();

          // Storage should remain empty
          const loadedPresets = getLocalPresets();
          expect(loadedPresets.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: custom-presets, Property 2: Whitespace Names Are Invalid**
   * **Validates: Requirements 1.3**
   * 
   * Empty string should also be rejected.
   */
  it('Property 2: Empty string name is rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        presetSettingsArb,
        async (settings) => {
          // Clear storage before each test
          localStorageMock = {};

          // Validate empty string - should return an error
          const validationError = validatePresetName('');
          expect(validationError).not.toBeNull();
          expect(validationError).toBe("Preset name cannot be empty");

          // Attempt to save - should return null
          const savedPreset = saveLocalPreset('', settings);
          expect(savedPreset).toBeNull();

          // Storage should remain empty
          const loadedPresets = getLocalPresets();
          expect(loadedPresets.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
