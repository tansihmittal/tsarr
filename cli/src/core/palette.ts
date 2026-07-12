// Node port of components/color-palette/ColorPaletteLayout.tsx's quantizeColors.
// The clustering math is pure numeric logic with no browser dependency, so
// it's copied verbatim — only the image decode step changes (sharp raw
// buffer instead of canvas getImageData).
import sharp from "sharp";
import * as fs from "fs";
import { ToolOutcome } from "./types";

export interface PaletteColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
}

function componentToHex(c: number) {
  return c.toString(16).padStart(2, "0");
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

function colorDistance(a: [number, number, number], b: [number, number, number]) {
  return Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2);
}

function quantizeColors(pixelBuffer: Buffer, channels: number, numColors: number): PaletteColor[] {
  const pixels: [number, number, number][] = [];
  const stride = channels * 4; // sample every 4th pixel, matching the browser tool
  for (let i = 0; i + channels <= pixelBuffer.length; i += stride) {
    const r = pixelBuffer[i];
    const g = pixelBuffer[i + 1];
    const b = pixelBuffer[i + 2];
    const a = channels === 4 ? pixelBuffer[i + 3] : 255;
    if (a > 128) pixels.push([r, g, b]);
  }

  if (pixels.length === 0) return [];

  let centroids: [number, number, number][] = [];
  const step = Math.max(1, Math.floor(pixels.length / numColors));
  for (let i = 0; i < numColors; i++) {
    centroids.push([...pixels[Math.min(i * step, pixels.length - 1)]]);
  }

  const MAX_ITER = 15;
  for (let iter = 0; iter < MAX_ITER; iter++) {
    const clusters: [number, number, number][][] = Array.from({ length: numColors }, () => []);

    for (const px of pixels) {
      let minDist = Infinity;
      let idx = 0;
      for (let c = 0; c < centroids.length; c++) {
        const d = colorDistance(px, centroids[c]);
        if (d < minDist) {
          minDist = d;
          idx = c;
        }
      }
      clusters[idx].push(px);
    }

    let moved = false;
    for (let c = 0; c < numColors; c++) {
      if (clusters[c].length === 0) continue;
      const avg: [number, number, number] = [
        Math.round(clusters[c].reduce((s, p) => s + p[0], 0) / clusters[c].length),
        Math.round(clusters[c].reduce((s, p) => s + p[1], 0) / clusters[c].length),
        Math.round(clusters[c].reduce((s, p) => s + p[2], 0) / clusters[c].length),
      ];
      if (avg[0] !== centroids[c][0] || avg[1] !== centroids[c][1] || avg[2] !== centroids[c][2]) {
        centroids[c] = avg;
        moved = true;
      }
    }
    if (!moved) break;
  }

  return centroids
    .map((c) => ({ hex: rgbToHex(c[0], c[1], c[2]), rgb: { r: c[0], g: c[1], b: c[2] } }))
    .sort((a, b) => {
      const la = 0.299 * a.rgb.r + 0.587 * a.rgb.g + 0.114 * a.rgb.b;
      const lb = 0.299 * b.rgb.r + 0.587 * b.rgb.g + 0.114 * b.rgb.b;
      return lb - la;
    });
}

export interface PaletteOptions {
  inputPath: string;
  outPath?: string; // .json file; if omitted, result is only returned
  count?: number; // 2-12, default 6
}

export interface PaletteOutcome {
  ok: true;
  outputPath?: string;
  colors: PaletteColor[];
  message: string;
}

export async function extractPalette(opts: PaletteOptions): Promise<PaletteOutcome | { ok: false; error: string }> {
  try {
    if (!fs.existsSync(opts.inputPath)) {
      return { ok: false, error: `Input file not found: ${opts.inputPath}` };
    }
    const numColors = Math.min(12, Math.max(2, opts.count ?? 6));

    const MAX = 400;
    const img = sharp(opts.inputPath).ensureAlpha();
    const meta = await img.metadata();
    const scale = Math.min(1, MAX / Math.max(meta.width ?? MAX, meta.height ?? MAX));
    const resized = img.resize(Math.round((meta.width ?? MAX) * scale), Math.round((meta.height ?? MAX) * scale));
    const { data, info } = await resized.raw().toBuffer({ resolveWithObject: true });

    const colors = quantizeColors(data, info.channels, numColors);

    if (opts.outPath) {
      fs.writeFileSync(opts.outPath, JSON.stringify(colors, null, 2));
    }

    return {
      ok: true,
      outputPath: opts.outPath,
      colors,
      message: `Extracted ${colors.length} colors${opts.outPath ? ` -> ${opts.outPath}` : ""}`,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
