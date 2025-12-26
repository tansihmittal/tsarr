import { useState, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";
import Navigation from "../common/Navigation";
import WatermarkRemoverPreview from "./WatermarkRemoverPreview";
import WatermarkRemoverControls from "./WatermarkRemoverControls";

export interface WatermarkRemoverState {
  originalImage: string;
  processedImage: string;
  imageWidth: number;
  imageHeight: number;
  isProcessing: boolean;
  processingProgress: number;
  brushSize: number;
  selections: SelectionArea[];
  currentSelection: SelectionArea | null;
  outputFormat: "png" | "jpeg" | "webp";
  quality: number;
}

export interface SelectionArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const WatermarkRemoverLayout: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<WatermarkRemoverState>({
    originalImage: "",
    processedImage: "",
    imageWidth: 0,
    imageHeight: 0,
    isProcessing: false,
    processingProgress: 0,
    brushSize: 30,
    selections: [],
    currentSelection: null,
    outputFormat: "png",
    quality: 90,
  });

  const updateState = (updates: Partial<WatermarkRemoverState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setState(prev => ({
          ...prev,
          originalImage: e.target?.result as string,
          processedImage: "",
          imageWidth: img.width,
          imageHeight: img.height,
          selections: [],
        }));
        toast.success("Image loaded!");
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const addSelection = useCallback((selection: SelectionArea) => {
    setState(prev => ({
      ...prev,
      selections: [...prev.selections, selection],
    }));
  }, []);

  const removeSelection = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      selections: prev.selections.filter(s => s.id !== id),
    }));
  }, []);

  const clearSelections = useCallback(() => {
    setState(prev => ({ ...prev, selections: [] }));
  }, []);

  const processWatermarkRemoval = useCallback(async () => {
    if (!state.originalImage || state.selections.length === 0) {
      toast.error("Please select watermark areas first");
      return;
    }

    updateState({ isProcessing: true, processingProgress: 0 });

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas not supported");

      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = state.originalImage;
      });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Process each selection
      const totalSelections = state.selections.length;
      for (let i = 0; i < totalSelections; i++) {
        updateState({ processingProgress: Math.round(((i + 0.5) / totalSelections) * 100) });
        await inpaintAreaFast(ctx, state.selections[i]);
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      const processedDataUrl = canvas.toDataURL("image/png");
      updateState({ processedImage: processedDataUrl, isProcessing: false, processingProgress: 100 });
      toast.success("Watermark removed!");
    } catch (error) {
      console.error("Processing error:", error);
      toast.error("Failed to process image");
      updateState({ isProcessing: false, processingProgress: 0 });
    }
  }, [state.originalImage, state.selections]);

  const handleExport = useCallback(async () => {
    const imageToExport = state.processedImage || state.originalImage;
    if (!imageToExport) {
      toast.error("No image to export");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.src = imageToExport;
    });

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const mimeTypes: Record<string, string> = {
      png: "image/png",
      jpeg: "image/jpeg",
      webp: "image/webp",
    };
    const mimeType = mimeTypes[state.outputFormat];
    const quality = state.outputFormat === "png" ? undefined : state.quality / 100;

    canvas.toBlob((blob) => {
      if (!blob) { toast.error("Failed to export"); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `watermark-removed.${state.outputFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Image exported!");
    }, mimeType, quality);
  }, [state]);

  const handleCopy = useCallback(async () => {
    const imageToExport = state.processedImage || state.originalImage;
    if (!imageToExport) { toast.error("No image to copy"); return; }
    
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = imageToExport;
      });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Failed to create blob");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Copied to clipboard!");
    } catch { toast.error("Failed to copy"); }
  }, [state]);

  return (
    <main className="min-h-[100vh] h-fit editor-bg relative">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-4 lg:px-0 relative">
        <div className="grid gap-5 lg:grid-cols-[3fr_1.5fr]">
          <WatermarkRemoverPreview 
            state={state} 
            canvasRef={canvasRef} 
            onExport={handleExport} 
            onCopy={handleCopy} 
            onImageUpload={handleImageUpload}
            addSelection={addSelection}
            removeSelection={removeSelection}
          />
          <WatermarkRemoverControls 
            state={state} 
            updateState={updateState} 
            onImageUpload={handleImageUpload} 
            onExport={handleExport}
            onProcess={processWatermarkRemoval}
            clearSelections={clearSelections}
          />
        </div>
      </section>
    </main>
  );
};

// Improved Telea inpainting with better edge preservation
async function inpaintAreaFast(
  ctx: CanvasRenderingContext2D,
  selection: SelectionArea
): Promise<void> {
  const { x, y, width, height } = selection;
  
  // Get the area with padding for context
  const padding = 25;
  const sx = Math.max(0, x - padding);
  const sy = Math.max(0, y - padding);
  const sw = Math.min(ctx.canvas.width - sx, width + padding * 2);
  const sh = Math.min(ctx.canvas.height - sy, height + padding * 2);
  
  const imageData = ctx.getImageData(sx, sy, sw, sh);
  const data = imageData.data;
  const w = imageData.width;
  const h = imageData.height;
  
  // Local selection coordinates
  const localX = x - sx;
  const localY = y - sy;
  
  // Use improved Telea algorithm
  await teleaInpaintImproved(data, w, h, localX, localY, width, height);
  
  ctx.putImageData(imageData, sx, sy);
}

// Improved Telea inpainting with gradient-based weighting
async function teleaInpaintImproved(
  data: Uint8ClampedArray,
  w: number, h: number,
  selX: number, selY: number,
  selW: number, selH: number
): Promise<void> {
  const KNOWN = 0;
  const BAND = 1;
  const INSIDE = 2;
  
  // Initialize arrays
  const flags = new Uint8Array(w * h);
  const dist = new Float32Array(w * h);
  dist.fill(1e6);
  
  // Mark regions
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (x >= selX && x < selX + selW && y >= selY && y < selY + selH) {
        flags[idx] = INSIDE;
      } else {
        flags[idx] = KNOWN;
        dist[idx] = 0;
      }
    }
  }
  
  // Initialize narrow band
  const band: { x: number; y: number; dist: number }[] = [];
  
  for (let y = selY; y < selY + selH; y++) {
    for (let x = selX; x < selX + selW; x++) {
      const idx = y * w + x;
      let isBoundary = false;
      const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dx, dy] of neighbors) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          if (flags[ny * w + nx] === KNOWN) {
            isBoundary = true;
            break;
          }
        }
      }
      if (isBoundary) {
        flags[idx] = BAND;
        dist[idx] = 1;
        band.push({ x, y, dist: 1 });
      }
    }
  }
  
  band.sort((a, b) => a.dist - b.dist);
  
  const radius = 8; // Larger radius for better context
  
  while (band.length > 0) {
    const current = band.shift()!;
    const { x, y } = current;
    const idx = y * w + x;
    
    if (flags[idx] === KNOWN) continue;
    flags[idx] = KNOWN;
    
    // Inpaint with gradient awareness
    inpaintPixelImproved(data, w, h, x, y, flags, dist, radius, KNOWN);
    
    // Update neighbors
    const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dx, dy] of neighbors) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nidx = ny * w + nx;
        if (flags[nidx] === INSIDE) {
          const newDist = solveEikonal(dist, w, h, nx, ny);
          if (newDist < dist[nidx]) {
            dist[nidx] = newDist;
            flags[nidx] = BAND;
            insertSorted(band, { x: nx, y: ny, dist: newDist });
          }
        }
      }
    }
  }
}

function insertSorted(band: { x: number; y: number; dist: number }[], item: { x: number; y: number; dist: number }) {
  let low = 0, high = band.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (band[mid].dist < item.dist) low = mid + 1;
    else high = mid;
  }
  band.splice(low, 0, item);
}

function solveEikonal(dist: Float32Array, w: number, h: number, x: number, y: number): number {
  const left = x > 0 ? dist[y * w + (x - 1)] : 1e6;
  const right = x < w - 1 ? dist[y * w + (x + 1)] : 1e6;
  const up = y > 0 ? dist[(y - 1) * w + x] : 1e6;
  const down = y < h - 1 ? dist[(y + 1) * w + x] : 1e6;
  
  const minH = Math.min(left, right);
  const minV = Math.min(up, down);
  
  if (Math.abs(minH - minV) >= 1) {
    return Math.min(minH, minV) + 1;
  } else {
    return (minH + minV + Math.sqrt(2 - (minH - minV) * (minH - minV))) / 2;
  }
}

function inpaintPixelImproved(
  data: Uint8ClampedArray,
  w: number, h: number,
  px: number, py: number,
  flags: Uint8Array,
  dist: Float32Array,
  radius: number,
  KNOWN: number
): void {
  const idx = py * w + px;
  const d0 = dist[idx];
  
  // Calculate gradient at this point from known neighbors
  let gradX = 0, gradY = 0;
  let gradCount = 0;
  
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = px + dx, ny = py + dy;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h && flags[ny * w + nx] === KNOWN) {
        const nidx = (ny * w + nx) * 4;
        const intensity = (data[nidx] + data[nidx + 1] + data[nidx + 2]) / 3;
        gradX += intensity * dx;
        gradY += intensity * dy;
        gradCount++;
      }
    }
  }
  
  if (gradCount > 0) {
    gradX /= gradCount;
    gradY /= gradCount;
  }
  
  // Normalize gradient
  const gradMag = Math.sqrt(gradX * gradX + gradY * gradY) + 0.0001;
  const normGradX = gradX / gradMag;
  const normGradY = gradY / gradMag;
  
  let sumR = 0, sumG = 0, sumB = 0;
  let sumWeight = 0;
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue;
      
      const nx = px + dx, ny = py + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      
      const nidx = ny * w + nx;
      if (flags[nidx] !== KNOWN) continue;
      
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > radius) continue;
      
      // Geometric weight (closer = more weight)
      const geomWeight = 1 / (distance * distance + 0.1);
      
      // Level set weight (similar distance from boundary = more weight)
      const levelWeight = 1 / (1 + Math.abs(dist[nidx] - d0) * 2);
      
      // Direction weight (perpendicular to gradient = more weight for edges)
      const dirX = dx / distance;
      const dirY = dy / distance;
      // Dot product with gradient normal (perpendicular)
      const dotProduct = Math.abs(dirX * (-normGradY) + dirY * normGradX);
      const dirWeight = 0.5 + dotProduct * 0.5;
      
      const weight = geomWeight * levelWeight * dirWeight;
      
      const srcIdx = nidx * 4;
      sumR += data[srcIdx] * weight;
      sumG += data[srcIdx + 1] * weight;
      sumB += data[srcIdx + 2] * weight;
      sumWeight += weight;
    }
  }
  
  if (sumWeight > 0) {
    const dstIdx = idx * 4;
    data[dstIdx] = Math.round(sumR / sumWeight);
    data[dstIdx + 1] = Math.round(sumG / sumWeight);
    data[dstIdx + 2] = Math.round(sumB / sumWeight);
  }
}

export default WatermarkRemoverLayout;
