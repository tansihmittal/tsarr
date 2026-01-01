import { useState, useRef, useCallback } from "react";
import Navigation from "../common/Navigation";
import BubbleBlasterPreview from "./BubbleBlasterPreview";
import BubbleBlasterControls from "./BubbleBlasterControls";

export interface BubbleRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
  isProcessed: boolean;
}

export interface BubbleBlasterState {
  image: string | null;
  originalImage: string | null;
  processedImageData: ImageData | null;
  imageWidth: number;
  imageHeight: number;
  bubbles: BubbleRegion[];
  selectedBubbleId: string | null;
  isProcessing: boolean;
  processingProgress: string;
  processingPercent: number;
  sensitivity: number;
  textThreshold: number;
  brushSize: number;
  mode: "select" | "draw";
}

const BubbleBlasterLayout = () => {
  const [state, setState] = useState<BubbleBlasterState>({
    image: null,
    originalImage: null,
    processedImageData: null,
    imageWidth: 800,
    imageHeight: 600,
    bubbles: [],
    selectedBubbleId: null,
    isProcessing: false,
    processingProgress: "",
    processingPercent: 0,
    sensitivity: 80,
    textThreshold: 100,
    brushSize: 20,
    mode: "select",
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workingCanvasRef = useRef<HTMLCanvasElement>(null);

  const updateState = useCallback((updates: Partial<BubbleBlasterState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const detectBubbles = useCallback(
    async (imageUrl: string) => {
      updateState({
        isProcessing: true,
        processingProgress: "Analyzing image...",
        processingPercent: 10,
      });

      return new Promise<BubbleRegion[]>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) {
            resolve([]);
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          updateState({
            processingProgress: "Finding speech bubbles...",
            processingPercent: 30,
          });

          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const pixels = imageData.data;

          const whiteThreshold = 255 - (100 - state.sensitivity) * 2;
          const mask = new Uint8Array(img.width * img.height);

          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const isWhite = r > whiteThreshold && g > whiteThreshold && b > whiteThreshold;
            mask[i / 4] = isWhite ? 1 : 0;
          }

          updateState({
            processingProgress: "Detecting bubble regions...",
            processingPercent: 50,
          });

          const visited = new Uint8Array(img.width * img.height);
          const regions: BubbleRegion[] = [];
          const minBubbleArea = 1500;
          const maxBubbleArea = img.width * img.height * 0.2;
          const minDimension = 30;

          const floodFill = (startX: number, startY: number) => {
            const stack: [number, number][] = [[startX, startY]];
            let minX = startX, minY = startY, maxX = startX, maxY = startY;
            let area = 0;

            while (stack.length > 0 && area < maxBubbleArea) {
              const [cx, cy] = stack.pop()!;
              const idx = cy * img.width + cx;

              if (cx < 0 || cx >= img.width || cy < 0 || cy >= img.height) continue;
              if (visited[idx] || !mask[idx]) continue;

              visited[idx] = 1;
              area++;
              minX = Math.min(minX, cx);
              minY = Math.min(minY, cy);
              maxX = Math.max(maxX, cx);
              maxY = Math.max(maxY, cy);

              stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
            }

            if (area < minBubbleArea) return null;
            return { minX, minY, maxX, maxY, area };
          };

          for (let sy = 0; sy < img.height; sy += 2) {
            for (let sx = 0; sx < img.width; sx += 2) {
              const idx = sy * img.width + sx;
              if (mask[idx] && !visited[idx]) {
                const region = floodFill(sx, sy);
                if (region) {
                  const width = region.maxX - region.minX;
                  const height = region.maxY - region.minY;
                  const boundingArea = width * height;
                  const fillRatio = region.area / boundingArea;
                  const aspectRatio = Math.max(width, height) / Math.min(width, height);

                  if (aspectRatio < 5 && fillRatio > 0.35 && width >= minDimension && height >= minDimension) {
                    regions.push({
                      id: crypto.randomUUID(),
                      x: region.minX,
                      y: region.minY,
                      width,
                      height,
                      isSelected: true,
                      isProcessed: false,
                    });
                  }
                }
              }
            }
          }

          updateState({ processingProgress: "Done!", processingPercent: 100 });
          resolve(regions);
        };

        img.onerror = () => resolve([]);
        img.src = imageUrl;
      });
    },
    [state.sensitivity, updateState]
  );

  // Text removal - removes dark grayscale pixels inside bubbles
  const processSelectedBubbles = useCallback(async () => {
    if (!workingCanvasRef.current || !state.image) return;

    const selectedBubbles = state.bubbles.filter((b) => b.isSelected && !b.isProcessed);
    if (selectedBubbles.length === 0) return;

    updateState({
      isProcessing: true,
      processingProgress: "Removing text...",
      processingPercent: 0,
    });

    const canvas = workingCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    for (let i = 0; i < selectedBubbles.length; i++) {
      const bubble = selectedBubbles[i];
      const progress = Math.round(((i + 1) / selectedBubbles.length) * 100);

      updateState({
        processingProgress: `Processing bubble ${i + 1}/${selectedBubbles.length}...`,
        processingPercent: progress,
      });

      // Use margin to stay away from bubble outline
      const margin = 5;
      const bx = Math.max(0, Math.floor(bubble.x + margin));
      const by = Math.max(0, Math.floor(bubble.y + margin));
      const bw = Math.max(1, Math.ceil(bubble.width - margin * 2));
      const bh = Math.max(1, Math.ceil(bubble.height - margin * 2));

      if (bw <= 0 || bh <= 0) continue;

      const regionData = ctx.getImageData(bx, by, bw, bh);
      const pixels = regionData.data;

      // Find the background color (sample from very light pixels)
      let bgR = 255, bgG = 255, bgB = 255;
      let lightPixelCount = 0;
      let sumR = 0, sumG = 0, sumB = 0;

      for (let j = 0; j < pixels.length; j += 4) {
        const r = pixels[j];
        const g = pixels[j + 1];
        const b = pixels[j + 2];
        const brightness = (r + g + b) / 3;

        if (brightness > 240) {
          sumR += r;
          sumG += g;
          sumB += b;
          lightPixelCount++;
        }
      }

      if (lightPixelCount > 0) {
        bgR = Math.round(sumR / lightPixelCount);
        bgG = Math.round(sumG / lightPixelCount);
        bgB = Math.round(sumB / lightPixelCount);
      }

      // Replace dark grayscale pixels (text) with background color
      const textThreshold = state.textThreshold;

      for (let j = 0; j < pixels.length; j += 4) {
        const r = pixels[j];
        const g = pixels[j + 1];
        const b = pixels[j + 2];
        const brightness = (r + g + b) / 3;

        // Calculate color variance - text is grayscale (low variance)
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const colorVariance = maxC - minC;

        // Remove if: dark AND grayscale (text is typically black/dark gray)
        if (brightness < textThreshold && colorVariance < 40) {
          pixels[j] = bgR;
          pixels[j + 1] = bgG;
          pixels[j + 2] = bgB;
        }
      }

      ctx.putImageData(regionData, bx, by);

      setState((prev) => ({
        ...prev,
        bubbles: prev.bubbles.map((b) =>
          b.id === bubble.id ? { ...b, isProcessed: true } : b
        ),
      }));

      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    const processedData = ctx.getImageData(0, 0, state.imageWidth, state.imageHeight);
    updateState({
      isProcessing: false,
      processingProgress: `Processed ${selectedBubbles.length} bubbles`,
      processingPercent: 100,
      processedImageData: processedData,
    });
  }, [state.bubbles, state.image, state.imageWidth, state.imageHeight, state.textThreshold, updateState]);

  const handleImageUpload = useCallback(
    async (imageUrl: string, width: number, height: number) => {
      updateState({
        image: imageUrl,
        originalImage: imageUrl,
        processedImageData: null,
        imageWidth: width,
        imageHeight: height,
        bubbles: [],
        selectedBubbleId: null,
        processingProgress: "",
        processingPercent: 0,
      });

      const detectedBubbles = await detectBubbles(imageUrl);
      updateState({
        bubbles: detectedBubbles,
        isProcessing: false,
        processingProgress:
          detectedBubbles.length > 0
            ? `Found ${detectedBubbles.length} speech bubble${detectedBubbles.length > 1 ? "s" : ""}`
            : "No bubbles detected. Try Draw mode to select manually.",
      });
    },
    [detectBubbles, updateState]
  );

  const addManualBubble = useCallback((bx: number, by: number, bw: number, bh: number) => {
    setState((prev) => ({
      ...prev,
      bubbles: [
        ...prev.bubbles,
        {
          id: crypto.randomUUID(),
          x: bx, y: by, width: bw, height: bh,
          isSelected: true,
          isProcessed: false,
        },
      ],
    }));
  }, []);

  const toggleBubbleSelection = useCallback((bubbleId: string) => {
    setState((prev) => ({
      ...prev,
      bubbles: prev.bubbles.map((b) =>
        b.id === bubbleId ? { ...b, isSelected: !b.isSelected } : b
      ),
    }));
  }, []);

  const deleteBubble = useCallback((bubbleId: string) => {
    setState((prev) => ({
      ...prev,
      bubbles: prev.bubbles.filter((b) => b.id !== bubbleId),
    }));
  }, []);

  const selectAllBubbles = useCallback(() => {
    setState((prev) => ({
      ...prev,
      bubbles: prev.bubbles.map((b) => ({ ...b, isSelected: true })),
    }));
  }, []);

  const deselectAllBubbles = useCallback(() => {
    setState((prev) => ({
      ...prev,
      bubbles: prev.bubbles.map((b) => ({ ...b, isSelected: false })),
    }));
  }, []);

  const redetectBubbles = useCallback(async () => {
    if (!state.originalImage) return;
    updateState({ processedImageData: null, bubbles: [] });

    const detectedBubbles = await detectBubbles(state.originalImage);
    updateState({
      bubbles: detectedBubbles,
      isProcessing: false,
      processingProgress:
        detectedBubbles.length > 0
          ? `Found ${detectedBubbles.length} speech bubble${detectedBubbles.length > 1 ? "s" : ""}`
          : "No bubbles detected",
    });
  }, [state.originalImage, detectBubbles, updateState]);

  const resetToOriginal = useCallback(() => {
    if (state.originalImage) {
      updateState({
        processedImageData: null,
        bubbles: state.bubbles.map((b) => ({ ...b, isProcessed: false })),
      });
    }
  }, [state.originalImage, state.bubbles, updateState]);

  return (
    <main className="min-h-[100vh] h-fit editor-bg relative pb-20 lg:pb-0">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-3 sm:px-4 lg:px-0 relative">
        <div className="flex flex-col lg:grid lg:gap-5 lg:grid-cols-[3fr_1.5fr]">
          <BubbleBlasterPreview
            state={state}
            canvasRef={canvasRef}
            workingCanvasRef={workingCanvasRef}
            updateState={updateState}
            onImageUpload={handleImageUpload}
            addManualBubble={addManualBubble}
            toggleBubbleSelection={toggleBubbleSelection}
          />
          <BubbleBlasterControls
            state={state}
            updateState={updateState}
            processSelectedBubbles={processSelectedBubbles}
            redetectBubbles={redetectBubbles}
            resetToOriginal={resetToOriginal}
            selectAllBubbles={selectAllBubbles}
            deselectAllBubbles={deselectAllBubbles}
            deleteBubble={deleteBubble}
            canvasRef={canvasRef}
            workingCanvasRef={workingCanvasRef}
          />
        </div>
      </section>
    </main>
  );
};

export default BubbleBlasterLayout;
