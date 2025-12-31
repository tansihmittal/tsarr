import { useState, useRef, useCallback } from "react";
import Navigation from "../common/Navigation";
import ImageTextEditorPreview from "./ImageTextEditorPreview";
import ImageTextEditorControls from "./ImageTextEditorControls";
import { createWorker, OEM, PSM } from "tesseract.js";

// ============ CONSTANTS ============
const OCR_CONFIG = {
  MIN_CONFIDENCE: 10,
  MIN_FONT_SIZE: 10,
  FONT_SIZE_RATIO: 0.65, // Reduced from 0.85 - fonts have internal padding
  BASELINE_RATIO: 0.8,
  DEFAULT_TEXT_COLOR: "#000000",
  DEFAULT_BG_COLOR: "#ffffff",
} as const;

const ERROR_MESSAGES = {
  CORS: "Image couldn't be loaded. Try downloading and re-uploading it.",
  NETWORK: "Network error. Check your connection and try again.",
  FORMAT: "Unsupported image format. Try PNG, JPG, or WebP.",
  NO_TEXT: "No text detected. Use 'Add Text Manually' to add text regions.",
  GENERIC: "OCR failed. Please try a different image.",
} as const;

export interface TextRegion {
  id: string;
  text: string;
  newText: string;
  x: number;
  y: number;
  width: number;
  height: number;
  baseline: number;
  lineHeight: number;
  confidence: number;
  fontSize: number;
  fontWeight: "normal" | "bold" | "bolder";
  fontStyle: "normal" | "italic";
  textColor: string; // Auto-detected text color
  bgColor: string;   // Auto-detected background color
  isEditing: boolean;
  isModified: boolean;
}

export interface ImageTextEditorState {
  image: string | null;
  imageWidth: number;
  imageHeight: number;
  textRegions: TextRegion[];
  selectedRegionId: string | null;
  editingRegionId: string | null;
  isProcessing: boolean;
  processingProgress: string;
  processingPercent: number;
  exportFormat: "png" | "jpeg" | "webp";
  exportScale: number;
  dominantTextColor: string;
  dominantBgColor: string;
  errorDetails: string | null;
}

const ImageTextEditorLayout = () => {
  const [state, setState] = useState<ImageTextEditorState>({
    image: null,
    imageWidth: 800,
    imageHeight: 600,
    textRegions: [],
    selectedRegionId: null,
    editingRegionId: null,
    isProcessing: false,
    processingProgress: "",
    processingPercent: 0,
    exportFormat: "png",
    exportScale: 2,
    dominantTextColor: OCR_CONFIG.DEFAULT_TEXT_COLOR,
    dominantBgColor: OCR_CONFIG.DEFAULT_BG_COLOR,
    errorDetails: null,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const updateState = useCallback((updates: Partial<ImageTextEditorState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Sample text and background colors from a specific region
  const sampleRegionColors = useCallback((
    imageUrl: string,
    region: { x: number; y: number; width: number; height: number }
  ): Promise<{ textColor: string; bgColor: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ textColor: "#ffffff", bgColor: "#000000" });
          return;
        }

        // Sample a slightly larger area for better color detection
        const pad = 2;
        const x = Math.max(0, region.x - pad);
        const y = Math.max(0, region.y - pad);
        const w = Math.min(img.width - x, region.width + pad * 2);
        const h = Math.min(img.height - y, region.height + pad * 2);

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, x, y, w, h, 0, 0, w, h);

        const imageData = ctx.getImageData(0, 0, w, h);
        const pixels = imageData.data;

        // Collect all pixel colors and their frequencies
        const colorMap: Map<string, { r: number; g: number; b: number; count: number; brightness: number }> = new Map();
        
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const brightness = (r * 299 + g * 587 + b * 114) / 1000; // Perceived brightness
          
          // Quantize colors to reduce noise (group similar colors)
          const qr = Math.round(r / 16) * 16;
          const qg = Math.round(g / 16) * 16;
          const qb = Math.round(b / 16) * 16;
          const key = `${qr},${qg},${qb}`;
          
          if (colorMap.has(key)) {
            const existing = colorMap.get(key)!;
            existing.count++;
            existing.r = (existing.r * (existing.count - 1) + r) / existing.count;
            existing.g = (existing.g * (existing.count - 1) + g) / existing.count;
            existing.b = (existing.b * (existing.count - 1) + b) / existing.count;
          } else {
            colorMap.set(key, { r, g, b, count: 1, brightness });
          }
        }

        // Sort by frequency and find the most common dark and light colors
        const colors = Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
        
        // Background is usually the most common color
        const bgCandidate = colors[0] || { r: 128, g: 128, b: 128, brightness: 128 };
        
        // Text color is the most common color that contrasts with background
        let textCandidate = { r: 255, g: 255, b: 255, brightness: 255 };
        for (const color of colors) {
          const contrast = Math.abs(color.brightness - bgCandidate.brightness);
          if (contrast > 50 && color.count > pixels.length / 4 / 20) {
            textCandidate = color;
            break;
          }
        }
        
        // If no contrasting color found, use white or black based on bg brightness
        if (textCandidate.brightness === 255) {
          textCandidate = bgCandidate.brightness > 128 
            ? { r: 30, g: 30, b: 30, brightness: 30 }
            : { r: 255, g: 255, b: 255, brightness: 255 };
        }

        resolve({
          textColor: `rgb(${Math.round(textCandidate.r)}, ${Math.round(textCandidate.g)}, ${Math.round(textCandidate.b)})`,
          bgColor: `rgb(${Math.round(bgCandidate.r)}, ${Math.round(bgCandidate.g)}, ${Math.round(bgCandidate.b)})`,
        });
      };

      img.onerror = () => {
        resolve({ textColor: "#ffffff", bgColor: "#000000" });
      };

      img.src = imageUrl;
    });
  }, []);

  // Main OCR extraction function using Tesseract.js v7 worker API
  const extractText = useCallback(async (imageUrl: string) => {
    updateState({
      isProcessing: true,
      processingProgress: "Starting OCR...",
      processingPercent: 5,
      errorDetails: null,
    });

    let worker: Awaited<ReturnType<typeof createWorker>> | null = null;

    try {
      console.log("Creating Tesseract worker...");
      
      // Create worker with proper configuration for v7
      worker = await createWorker("eng", OEM.LSTM_ONLY, {
        logger: (m) => {
          console.log("Tesseract progress:", m);
          if (m.status === "recognizing text") {
            updateState({
              processingProgress: "Recognizing text...",
              processingPercent: 40 + Math.round(m.progress * 50),
            });
          } else if (m.status === "loading language traineddata") {
            updateState({
              processingProgress: "Loading language data...",
              processingPercent: 10 + Math.round(m.progress * 20),
            });
          } else if (m.status === "initializing api") {
            updateState({
              processingProgress: "Initializing...",
              processingPercent: 30,
            });
          }
        },
      });

      // Set parameters for better text detection
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
      });

      updateState({
        processingProgress: "Analyzing image...",
        processingPercent: 35,
      });

      const result = await worker.recognize(imageUrl);

      console.log("OCR Result:", result);
      console.log("Data keys:", Object.keys(result.data));
      console.log("Text found:", result.data.text);

      // Type definitions for Tesseract.js v7 data structure
      interface TesseractWord {
        text: string;
        confidence: number;
        bbox: { x0: number; y0: number; x1: number; y1: number };
      }
      interface TesseractLine {
        text: string;
        confidence: number;
        bbox: { x0: number; y0: number; x1: number; y1: number };
        words?: TesseractWord[];
      }
      interface TesseractData {
        text: string;
        lines?: TesseractLine[];
        words?: TesseractWord[];
      }

      // Cast to access the full data structure
      const data = result.data as unknown as TesseractData;
      console.log("Lines:", data.lines);
      console.log("Words:", data.words);

      const regions: TextRegion[] = [];

      // In Tesseract.js v7, lines and words should be available
      if (data.lines && data.lines.length > 0) {
        console.log(`Found ${data.lines.length} lines`);
        
        for (const line of data.lines) {
          if (!line.text || !line.text.trim()) continue;
          if (line.confidence < OCR_CONFIG.MIN_CONFIDENCE) continue;

          const bbox = line.bbox;
          const height = bbox.y1 - bbox.y0;
          const width = bbox.x1 - bbox.x0;
          const fontSize = Math.max(OCR_CONFIG.MIN_FONT_SIZE, Math.round(height * OCR_CONFIG.FONT_SIZE_RATIO));

          // Detect if text is bold based on stroke width estimation
          const isBold = height > 20; // Larger text tends to be bold headers

          regions.push({
            id: crypto.randomUUID(),
            text: line.text.trim(),
            newText: line.text.trim(),
            x: bbox.x0,
            y: bbox.y0,
            width: width,
            height: height,
            baseline: bbox.y1,
            lineHeight: height,
            confidence: line.confidence,
            fontSize,
            fontWeight: isBold ? "bold" : "normal",
            fontStyle: "normal",
            textColor: "#ffffff", // Will be detected later
            bgColor: "#000000",   // Will be detected later
            isEditing: false,
            isModified: false,
          });
        }
      } else if (data.words && data.words.length > 0) {
        // Fallback to words if lines aren't available
        console.log(`Found ${data.words.length} words, grouping into lines`);
        
        // Group words by Y position to form lines
        const lineGroups: Record<number, TesseractWord[]> = {};
        const lineThreshold = 15;

        for (const word of data.words) {
          if (!word.text || !word.text.trim()) continue;
          if (word.confidence < OCR_CONFIG.MIN_CONFIDENCE) continue;

          const wordY = Math.round(word.bbox.y0 / lineThreshold) * lineThreshold;
          
          if (!lineGroups[wordY]) {
            lineGroups[wordY] = [];
          }
          lineGroups[wordY].push(word);
        }

        // Create regions from grouped words
        for (const yKey of Object.keys(lineGroups)) {
          const words = lineGroups[Number(yKey)];
          if (!words || words.length === 0) continue;

          // Sort words by x position
          words.sort((a, b) => a.bbox.x0 - b.bbox.x0);

          // Calculate bounding box for the line
          let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
          let totalConfidence = 0;
          const textParts: string[] = [];

          for (const word of words) {
            x0 = Math.min(x0, word.bbox.x0);
            y0 = Math.min(y0, word.bbox.y0);
            x1 = Math.max(x1, word.bbox.x1);
            y1 = Math.max(y1, word.bbox.y1);
            totalConfidence += word.confidence;
            textParts.push(word.text);
          }

          const lineText = textParts.join(" ");
          const height = y1 - y0;
          const fontSize = Math.max(OCR_CONFIG.MIN_FONT_SIZE, Math.round(height * OCR_CONFIG.FONT_SIZE_RATIO));
          const isBold = height > 20;

          regions.push({
            id: crypto.randomUUID(),
            text: lineText,
            newText: lineText,
            x: x0,
            y: y0,
            width: x1 - x0,
            height: height,
            baseline: y1,
            lineHeight: height,
            confidence: totalConfidence / words.length,
            fontSize,
            fontWeight: isBold ? "bold" : "normal",
            fontStyle: "normal",
            textColor: "#ffffff",
            bgColor: "#000000",
            isEditing: false,
            isModified: false,
          });
        }
      } else if (data.text && data.text.trim()) {
        // Last resort: parse raw text and estimate positions
        console.log("Falling back to text-based parsing");
        
        const text = data.text.trim();
        const lines = text.split('\n').filter(l => l.trim());
        
        // Get image dimensions
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = imageUrl;
        });
        
        const imgWidth = img.width || state.imageWidth;
        const imgHeight = img.height || state.imageHeight;
        const lineHeight = Math.round(imgHeight / (lines.length + 2));
        const fontSize = Math.max(OCR_CONFIG.MIN_FONT_SIZE, Math.round(lineHeight * 0.7));
        
        lines.forEach((lineText, index) => {
          if (!lineText.trim()) return;
          
          regions.push({
            id: crypto.randomUUID(),
            text: lineText.trim(),
            newText: lineText.trim(),
            x: 20,
            y: 20 + index * lineHeight,
            width: imgWidth - 40,
            height: lineHeight,
            baseline: 20 + (index + 1) * lineHeight - 5,
            lineHeight,
            confidence: 50,
            fontSize,
            fontWeight: "bold",
            fontStyle: "normal",
            textColor: "#ffffff",
            bgColor: "#000000",
            isEditing: false,
            isModified: false,
          });
        });
        
        console.log("Created regions from text lines:", regions.length);
      }

      console.log(`Created ${regions.length} text regions`);

      // Detect colors for each region
      updateState({ processingProgress: "Detecting text colors...", processingPercent: 92 });
      
      for (const region of regions) {
        try {
          const colors = await sampleRegionColors(imageUrl, region);
          region.textColor = colors.textColor;
          region.bgColor = colors.bgColor;
        } catch (e) {
          console.warn("Color detection failed for region:", e);
        }
      }

      // Sample colors from first region for global defaults
      let dominantTextColor: string = OCR_CONFIG.DEFAULT_TEXT_COLOR;
      let dominantBgColor: string = OCR_CONFIG.DEFAULT_BG_COLOR;

      if (regions.length > 0) {
        dominantTextColor = regions[0].textColor;
        dominantBgColor = regions[0].bgColor;
      }

      updateState({
        textRegions: regions,
        isProcessing: false,
        processingProgress: regions.length > 0 
          ? `Found ${regions.length} text region${regions.length > 1 ? "s" : ""}` 
          : ERROR_MESSAGES.NO_TEXT,
        processingPercent: 100,
        dominantTextColor,
        dominantBgColor,
        errorDetails: regions.length === 0 ? `Raw text: "${data.text?.substring(0, 200) || 'none'}"` : null,
      });

    } catch (error) {
      console.error("OCR failed:", error);
      updateState({
        isProcessing: false,
        processingProgress: ERROR_MESSAGES.GENERIC,
        processingPercent: 0,
        errorDetails: String(error),
      });
    } finally {
      // Always terminate the worker to prevent memory leaks
      if (worker) {
        try {
          await worker.terminate();
        } catch (e) {
          console.warn("Failed to terminate worker:", e);
        }
      }
    }
  }, [updateState, sampleRegionColors, state.imageWidth, state.imageHeight]);

  // Handle image upload
  const handleImageUpload = useCallback(
    (imageUrl: string, width: number, height: number) => {
      updateState({
        image: imageUrl,
        imageWidth: width,
        imageHeight: height,
        textRegions: [],
        selectedRegionId: null,
        editingRegionId: null,
        processingProgress: "",
        processingPercent: 0,
      });

      // Auto-extract text
      extractText(imageUrl);
    },
    [extractText, updateState]
  );

  // Update a specific text region
  const updateRegion = useCallback((regionId: string, updates: Partial<TextRegion>) => {
    setState((prev) => ({
      ...prev,
      textRegions: prev.textRegions.map((region) =>
        region.id === regionId 
          ? { 
              ...region, 
              ...updates,
              isModified: updates.newText !== undefined 
                ? updates.newText !== region.text 
                : region.isModified
            } 
          : region
      ),
    }));
  }, []);

  // Delete a text region
  const deleteRegion = useCallback((regionId: string) => {
    setState((prev) => ({
      ...prev,
      textRegions: prev.textRegions.filter((r) => r.id !== regionId),
      selectedRegionId:
        prev.selectedRegionId === regionId ? null : prev.selectedRegionId,
      editingRegionId:
        prev.editingRegionId === regionId ? null : prev.editingRegionId,
    }));
  }, []);

  // Start editing a region
  const startEditing = useCallback((regionId: string) => {
    setState((prev) => ({
      ...prev,
      editingRegionId: regionId,
      selectedRegionId: regionId,
      textRegions: prev.textRegions.map((r) => ({
        ...r,
        isEditing: r.id === regionId,
      })),
    }));
  }, []);

  // Stop editing
  const stopEditing = useCallback(() => {
    setState((prev) => ({
      ...prev,
      editingRegionId: null,
      textRegions: prev.textRegions.map((r) => ({
        ...r,
        isEditing: false,
      })),
    }));
  }, []);

  // Add a new text region manually
  const addManualRegion = useCallback(() => {
    const newRegion: TextRegion = {
      id: crypto.randomUUID(),
      text: "",
      newText: "New Text",
      x: state.imageWidth / 2 - 75,
      y: state.imageHeight / 2 - 15,
      width: 150,
      height: 30,
      baseline: state.imageHeight / 2 + 10,
      lineHeight: 30,
      confidence: 100,
      fontSize: 24,
      fontWeight: "bold",
      fontStyle: "normal",
      textColor: state.dominantTextColor || "#ffffff",
      bgColor: state.dominantBgColor || "#000000",
      isEditing: true,
      isModified: true,
    };

    setState((prev) => ({
      ...prev,
      textRegions: [...prev.textRegions, newRegion],
      selectedRegionId: newRegion.id,
      editingRegionId: newRegion.id,
    }));
  }, [state.imageWidth, state.imageHeight, state.dominantTextColor, state.dominantBgColor]);

  // Re-run OCR
  const reprocessImage = useCallback(() => {
    if (state.image && !state.isProcessing) {
      extractText(state.image);
    }
  }, [state.image, state.isProcessing, extractText]);

  return (
    <main className="min-h-[100vh] h-fit editor-bg relative pb-20 lg:pb-0">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-3 sm:px-4 lg:px-0 relative">
        <div className="grid gap-4 lg:gap-5 lg:grid-cols-[3fr_1.5fr]">
          <ImageTextEditorPreview
            state={state}
            canvasRef={canvasRef}
            updateState={updateState}
            onImageUpload={handleImageUpload}
            updateRegion={updateRegion}
            startEditing={startEditing}
            stopEditing={stopEditing}
          />
          <ImageTextEditorControls
            state={state}
            updateState={updateState}
            updateRegion={updateRegion}
            deleteRegion={deleteRegion}
            onImageUpload={handleImageUpload}
            reprocessImage={reprocessImage}
            addManualRegion={addManualRegion}
            canvasRef={canvasRef}
            startEditing={startEditing}
          />
        </div>
      </section>
    </main>
  );
};

export default ImageTextEditorLayout;
