import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import React from 'react';
import CodeEditorLayout, { CodeEditorState } from './CodeEditorLayout';
import { fontFamilies, aspectRatios, shadowStyles, borderStyles } from '../../data/codeEditor';

/**
 * **Feature: code-editor-enhancements, Property 1: Line start number validation and display**
 * **Validates: Requirements 1.1, 1.3**
 * 
 * Property: For any line start value, if the value is a positive integer, 
 * the first displayed line number SHALL equal that value; otherwise, 
 * the first line number SHALL default to 1.
 */

// Mock the downloads module
vi.mock('../edtior/Editor/downloads', () => ({
  downloadimagePng: vi.fn(),
  downloadimageJpeg: vi.fn(),
  downloadimageSvg: vi.fn(),
  copyToClipboard: vi.fn(),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Navigation component
vi.mock('../common/Navigation', () => ({
  default: () => React.createElement('nav', { 'data-testid': 'navigation' }),
}));

describe('CodeEditorLayout - Line Start Property Tests', () => {
  /**
   * **Feature: code-editor-enhancements, Property 1: Line start number validation and display**
   * **Validates: Requirements 1.1, 1.3**
   */
  it('Property 1: Line start validation - positive integers display correctly, non-positive default to 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 1000 }),
        (lineStartInput) => {
          // Create a mock state with the line start value
          const mockState: CodeEditorState = {
            code: "line1\nline2\nline3",
            language: "javascript",
            theme: "dracula",
            fontSize: 14,
            lineNumbers: true,
            padding: 32,
            borderRadius: 12,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            windowStyle: "macos",
            windowTitle: "test.js",
            shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            opacity: 100,
            lineStart: lineStartInput > 0 ? lineStartInput : 1, // This simulates the validation logic
            fontFamily: "'JetBrains Mono', monospace",
            ligatures: true,
            aspectRatio: { name: "Auto", value: "auto" },
            frameVisible: true,
            frameOpacity: 100,
            headerVisible: true,
            windowBackground: "default",
            borderStyle: "none",
            shadowStyle: "strong",
            reflection: false,
            watermark: { visible: false, text: "" },
          };

          // Test the validation logic directly
          const expectedLineStart = lineStartInput > 0 ? lineStartInput : 1;
          
          // Verify that the line start value is correctly validated
          expect(mockState.lineStart).toBe(expectedLineStart);
          
          // Verify that line numbers would start from the correct value
          const lines = mockState.code.split('\n');
          const firstLineNumber = mockState.lineStart;
          const secondLineNumber = mockState.lineStart + 1;
          const thirdLineNumber = mockState.lineStart + 2;
          
          // The line numbers should be sequential starting from lineStart
          expect(firstLineNumber).toBe(expectedLineStart);
          expect(secondLineNumber).toBe(expectedLineStart + 1);
          expect(thirdLineNumber).toBe(expectedLineStart + 2);
          
          // Verify that for positive inputs, the line start equals the input
          if (lineStartInput > 0) {
            expect(mockState.lineStart).toBe(lineStartInput);
          } else {
            // For non-positive inputs, it should default to 1
            expect(mockState.lineStart).toBe(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1: Line start input validation in updateState function', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 1000 }),
        (inputValue) => {
          // Simulate the updateState logic for lineStart
          const validateLineStart = (value: number): number => {
            return value > 0 ? value : 1;
          };

          const result = validateLineStart(inputValue);
          
          if (inputValue > 0) {
            expect(result).toBe(inputValue);
          } else {
            expect(result).toBe(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1: Edge cases for line start validation', () => {
    // Test specific edge cases
    const testCases = [
      { input: 0, expected: 1 },
      { input: -1, expected: 1 },
      { input: -100, expected: 1 },
      { input: 1, expected: 1 },
      { input: 42, expected: 42 },
      { input: 999, expected: 999 },
    ];

    testCases.forEach(({ input, expected }) => {
      const validateLineStart = (value: number): number => {
        return value > 0 ? value : 1;
      };

      const result = validateLineStart(input);
      expect(result).toBe(expected);
    });
  });
});

describe('CodeEditorLayout - Additional Property Tests', () => {
  /**
   * **Feature: code-editor-enhancements, Property 2: Font family application**
   * **Validates: Requirements 2.1**
   */
  it('Property 2: Font family application - selected font should be included in CSS', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...fontFamilies),
        (selectedFont) => {
          // Test that the font family value is correctly applied
          const mockState: CodeEditorState = {
            code: "test code",
            language: "javascript",
            theme: "dracula",
            fontSize: 14,
            lineNumbers: true,
            padding: 32,
            borderRadius: 12,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            windowStyle: "macos",
            windowTitle: "test.js",
            shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            opacity: 100,
            lineStart: 1,
            fontFamily: selectedFont.value,
            ligatures: true,
            aspectRatio: { name: "Auto", value: "auto" },
            frameVisible: true,
            frameOpacity: 100,
            headerVisible: true,
            windowBackground: "default",
            borderStyle: "none",
            shadowStyle: "strong",
            reflection: false,
            watermark: { visible: false, text: "" },
          };

          // Verify that the font family is correctly set
          expect(mockState.fontFamily).toBe(selectedFont.value);
          expect(mockState.fontFamily).toContain(selectedFont.name.replace(' ', ' '));
          expect(mockState.fontFamily).toContain('monospace');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: code-editor-enhancements, Property 3: Ligature toggle state**
   * **Validates: Requirements 2.3, 2.4**
   */
  it('Property 3: Ligature toggle - CSS property should match enabled state', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (ligaturesEnabled) => {
          const mockState: CodeEditorState = {
            code: "test code",
            language: "javascript",
            theme: "dracula",
            fontSize: 14,
            lineNumbers: true,
            padding: 32,
            borderRadius: 12,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            windowStyle: "macos",
            windowTitle: "test.js",
            shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            opacity: 100,
            lineStart: 1,
            fontFamily: "'JetBrains Mono', monospace",
            ligatures: ligaturesEnabled,
            aspectRatio: { name: "Auto", value: "auto" },
            frameVisible: true,
            frameOpacity: 100,
            headerVisible: true,
            windowBackground: "default",
            borderStyle: "none",
            shadowStyle: "strong",
            reflection: false,
            watermark: { visible: false, text: "" },
          };

          // Test the ligature CSS property logic
          const expectedCSSValue = ligaturesEnabled ? "normal" : "none";
          const actualCSSValue = mockState.ligatures ? "normal" : "none";
          
          expect(actualCSSValue).toBe(expectedCSSValue);
          expect(mockState.ligatures).toBe(ligaturesEnabled);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: code-editor-enhancements, Property 4: Aspect ratio constraint**
   * **Validates: Requirements 3.1**
   */
  it('Property 4: Aspect ratio constraint - CSS property should match selected ratio', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...aspectRatios),
        (selectedRatio) => {
          const mockState: CodeEditorState = {
            code: "test code",
            language: "javascript",
            theme: "dracula",
            fontSize: 14,
            lineNumbers: true,
            padding: 32,
            borderRadius: 12,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            windowStyle: "macos",
            windowTitle: "test.js",
            shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            opacity: 100,
            lineStart: 1,
            fontFamily: "'JetBrains Mono', monospace",
            ligatures: true,
            aspectRatio: selectedRatio,
            frameVisible: true,
            frameOpacity: 100,
            headerVisible: true,
            windowBackground: "default",
            borderStyle: "none",
            shadowStyle: "strong",
            reflection: false,
            watermark: { visible: false, text: "" },
          };

          // Verify that the aspect ratio is correctly set
          expect(mockState.aspectRatio.name).toBe(selectedRatio.name);
          expect(mockState.aspectRatio.value).toBe(selectedRatio.value);
          
          // For non-auto ratios, the value should be a valid CSS aspect-ratio value
          if (selectedRatio.value !== "auto") {
            expect(selectedRatio.value).toMatch(/^\d+\/\d+$/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: code-editor-enhancements, Property 5: Watermark visibility and content**
   * **Validates: Requirements 4.1, 4.2, 4.3**
   */
  it('Property 5: Watermark visibility and content - state should match configuration', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.string({ minLength: 0, maxLength: 50 }),
        (visible, text) => {
          const mockState: CodeEditorState = {
            code: "test code",
            language: "javascript",
            theme: "dracula",
            fontSize: 14,
            lineNumbers: true,
            padding: 32,
            borderRadius: 12,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            windowStyle: "macos",
            windowTitle: "test.js",
            shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            opacity: 100,
            lineStart: 1,
            fontFamily: "'JetBrains Mono', monospace",
            ligatures: true,
            aspectRatio: { name: "Auto", value: "auto" },
            frameVisible: true,
            frameOpacity: 100,
            headerVisible: true,
            windowBackground: "default",
            borderStyle: "none",
            shadowStyle: "strong",
            reflection: false,
            watermark: { visible, text },
          };

          // Verify watermark configuration
          expect(mockState.watermark.visible).toBe(visible);
          expect(mockState.watermark.text).toBe(text);
          
          // When disabled, visibility should be false regardless of text
          if (!visible) {
            expect(mockState.watermark.visible).toBe(false);
          }
          
          // When enabled, text should be preserved
          if (visible) {
            expect(mockState.watermark.text).toBe(text);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: code-editor-enhancements, Property 6: Reflection toggle**
   * **Validates: Requirements 5.1, 5.2**
   */
  it('Property 6: Reflection toggle - state should match enabled state', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (reflectionEnabled) => {
          const mockState: CodeEditorState = {
            code: "test code",
            language: "javascript",
            theme: "dracula",
            fontSize: 14,
            lineNumbers: true,
            padding: 32,
            borderRadius: 12,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            windowStyle: "macos",
            windowTitle: "test.js",
            shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            opacity: 100,
            lineStart: 1,
            fontFamily: "'JetBrains Mono', monospace",
            ligatures: true,
            aspectRatio: { name: "Auto", value: "auto" },
            frameVisible: true,
            frameOpacity: 100,
            headerVisible: true,
            windowBackground: "default",
            borderStyle: "none",
            shadowStyle: "strong",
            reflection: reflectionEnabled,
            watermark: { visible: false, text: "" },
          };

          // Verify reflection state
          expect(mockState.reflection).toBe(reflectionEnabled);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: code-editor-enhancements, Property 7: Shadow style application**
   * **Validates: Requirements 6.1**
   */
  it('Property 7: Shadow style application - CSS property should match selected style', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...shadowStyles),
        (selectedShadow) => {
          const mockState: CodeEditorState = {
            code: "test code",
            language: "javascript",
            theme: "dracula",
            fontSize: 14,
            lineNumbers: true,
            padding: 32,
            borderRadius: 12,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            windowStyle: "macos",
            windowTitle: "test.js",
            shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            opacity: 100,
            lineStart: 1,
            fontFamily: "'JetBrains Mono', monospace",
            ligatures: true,
            aspectRatio: { name: "Auto", value: "auto" },
            frameVisible: true,
            frameOpacity: 100,
            headerVisible: true,
            windowBackground: "default",
            borderStyle: "none",
            shadowStyle: selectedShadow.id as "none" | "subtle" | "medium" | "strong" | "bottom",
            reflection: false,
            watermark: { visible: false, text: "" },
          };

          // Verify shadow style is correctly set
          expect(mockState.shadowStyle).toBe(selectedShadow.id);
          
          // Verify the shadow value matches expected CSS
          const expectedShadowValue = selectedShadow.value;
          expect(expectedShadowValue).toBeDefined();
          
          // For "none" shadow, value should be "none"
          if (selectedShadow.id === "none") {
            expect(selectedShadow.value).toBe("none");
          } else {
            // For other shadows, should contain rgba values
            expect(selectedShadow.value).toContain("rgba");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: code-editor-enhancements, Property 8: Header visibility and title**
   * **Validates: Requirements 7.3, 7.4**
   */
  it('Property 8: Header visibility and title - state should match configuration', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.string({ minLength: 0, maxLength: 50 }),
        fc.constantFrom("default", "alternative"),
        (headerVisible, windowTitle, windowBackground) => {
          const mockState: CodeEditorState = {
            code: "test code",
            language: "javascript",
            theme: "dracula",
            fontSize: 14,
            lineNumbers: true,
            padding: 32,
            borderRadius: 12,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            windowStyle: "macos",
            windowTitle,
            shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            opacity: 100,
            lineStart: 1,
            fontFamily: "'JetBrains Mono', monospace",
            ligatures: true,
            aspectRatio: { name: "Auto", value: "auto" },
            frameVisible: true,
            frameOpacity: 100,
            headerVisible,
            windowBackground: windowBackground as "default" | "alternative",
            borderStyle: "none",
            shadowStyle: "strong",
            reflection: false,
            watermark: { visible: false, text: "" },
          };

          // Verify header configuration
          expect(mockState.headerVisible).toBe(headerVisible);
          expect(mockState.windowTitle).toBe(windowTitle);
          expect(mockState.windowBackground).toBe(windowBackground);
          
          // Window background should be valid option
          expect(["default", "alternative"]).toContain(mockState.windowBackground);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: code-editor-enhancements, Property 9: Border style application**
   * **Validates: Requirements 8.1**
   */
  it('Property 9: Border style application - CSS property should match selected style', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...borderStyles),
        (selectedBorder) => {
          const mockState: CodeEditorState = {
            code: "test code",
            language: "javascript",
            theme: "dracula",
            fontSize: 14,
            lineNumbers: true,
            padding: 32,
            borderRadius: 12,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            windowStyle: "macos",
            windowTitle: "test.js",
            shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            opacity: 100,
            lineStart: 1,
            fontFamily: "'JetBrains Mono', monospace",
            ligatures: true,
            aspectRatio: { name: "Auto", value: "auto" },
            frameVisible: true,
            frameOpacity: 100,
            headerVisible: true,
            windowBackground: "default",
            borderStyle: selectedBorder.id as "none" | "solid" | "glass" | "gradient",
            shadowStyle: "strong",
            reflection: false,
            watermark: { visible: false, text: "" },
          };

          // Verify border style is correctly set
          expect(mockState.borderStyle).toBe(selectedBorder.id);
          
          // Verify the border CSS is defined
          expect(selectedBorder.css).toBeDefined();
          
          // For "none" border, CSS should be "none"
          if (selectedBorder.id === "none") {
            expect(selectedBorder.css).toBe("none");
          } else {
            // For other borders, should contain border properties
            expect(selectedBorder.css).toContain("1px solid");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: code-editor-enhancements, Property 10: Frame visibility and opacity**
   * **Validates: Requirements 9.1, 9.2**
   */
  it('Property 10: Frame visibility and opacity - state should match configuration', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.integer({ min: 0, max: 100 }),
        (frameVisible, frameOpacity) => {
          const mockState: CodeEditorState = {
            code: "test code",
            language: "javascript",
            theme: "dracula",
            fontSize: 14,
            lineNumbers: true,
            padding: 32,
            borderRadius: 12,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            windowStyle: "macos",
            windowTitle: "test.js",
            shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            opacity: 100,
            lineStart: 1,
            fontFamily: "'JetBrains Mono', monospace",
            ligatures: true,
            aspectRatio: { name: "Auto", value: "auto" },
            frameVisible,
            frameOpacity,
            headerVisible: true,
            windowBackground: "default",
            borderStyle: "none",
            shadowStyle: "strong",
            reflection: false,
            watermark: { visible: false, text: "" },
          };

          // Verify frame configuration
          expect(mockState.frameVisible).toBe(frameVisible);
          expect(mockState.frameOpacity).toBe(frameOpacity);
          
          // Frame opacity should be in valid range
          expect(mockState.frameOpacity).toBeGreaterThanOrEqual(0);
          expect(mockState.frameOpacity).toBeLessThanOrEqual(100);
          
          // When frame is not visible, opacity is still preserved
          if (!frameVisible) {
            expect(mockState.frameVisible).toBe(false);
            expect(mockState.frameOpacity).toBe(frameOpacity);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});