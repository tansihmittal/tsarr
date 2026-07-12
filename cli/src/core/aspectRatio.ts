// Node port of components/aspect-ratio-converter/AspectRatioPreview.tsx's
// canvas drawing logic. Raw Canvas 2D fillRect/drawImage calls (not
// html2canvas), so the fit-mode math is copied verbatim and re-expressed as
// a sharp background layer + one composited foreground layer.
import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";
import { ToolOutcome } from "./types";

export type FitMode = "contain" | "cover" | "fill" | "crop";
export type BackgroundType = "solid" | "blur" | "transparent";
export type AspectRatioFormat = "png" | "jpeg" | "webp" | "avif";

export interface AspectRatioOptions {
  inputPath: string;
  outPath: string;
  aspectRatio?: number; // width/height, e.g. 1 for 1:1, 1.91 for 1.91:1. Ignored if width+height given.
  width?: number; // custom output size, takes priority over aspectRatio
  height?: number;
  outputScale?: number; // default 1, multiplies the 800px aspect-ratio base size
  fitMode?: FitMode; // default contain
  backgroundType?: BackgroundType; // default solid
  backgroundColor?: string; // default #ffffff
  cropPosition?: { x: number; y: number }; // percent 0-100, default {x:50,y:50}; used for cover/crop
  format?: AspectRatioFormat;
  quality?: number;
}

function hexToRgba(hex: string): { r: number; g: number; b: number; alpha: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
    alpha: 1,
  };
}

export async function convertAspectRatio(opts: AspectRatioOptions): Promise<ToolOutcome> {
  try {
    if (!fs.existsSync(opts.inputPath)) {
      return { ok: false, error: `Input file not found: ${opts.inputPath}` };
    }

    const meta = await sharp(opts.inputPath).metadata();
    const imgW = meta.width ?? 0;
    const imgH = meta.height ?? 0;
    if (!imgW || !imgH) return { ok: false, error: "Could not read source image dimensions" };

    let canvasWidth: number;
    let canvasHeight: number;
    if (opts.width && opts.height) {
      canvasWidth = opts.width;
      canvasHeight = opts.height;
    } else {
      const ratio = opts.aspectRatio ?? 1;
      const scale = opts.outputScale ?? 1;
      const baseSize = 800;
      if (ratio >= 1) {
        canvasWidth = baseSize * scale;
        canvasHeight = (baseSize / ratio) * scale;
      } else {
        canvasHeight = baseSize * scale;
        canvasWidth = baseSize * ratio * scale;
      }
    }
    canvasWidth = Math.round(canvasWidth);
    canvasHeight = Math.round(canvasHeight);

    const backgroundType = opts.backgroundType ?? "solid";
    const fitMode = opts.fitMode ?? "contain";
    const cropPosition = opts.cropPosition ?? { x: 50, y: 50 };

    // Background layer
    let base: sharp.Sharp;
    if (backgroundType === "transparent") {
      base = sharp({ create: { width: canvasWidth, height: canvasHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
    } else if (backgroundType === "blur") {
      const blurred = await sharp(opts.inputPath)
        .resize(canvasWidth, canvasHeight, { fit: "cover" })
        .blur(20)
        .png()
        .toBuffer();
      base = sharp(blurred);
    } else {
      base = sharp({
        create: { width: canvasWidth, height: canvasHeight, channels: 4, background: hexToRgba(opts.backgroundColor ?? "#ffffff") },
      });
    }

    // Foreground placement math, copied verbatim from the browser tool
    const imgAspect = imgW / imgH;
    let drawWidth: number, drawHeight: number, drawX: number, drawY: number;

    if (fitMode === "fill") {
      drawWidth = canvasWidth;
      drawHeight = canvasHeight;
      drawX = 0;
      drawY = 0;
    } else if (fitMode === "cover" || fitMode === "crop") {
      if (imgAspect > canvasWidth / canvasHeight) {
        drawHeight = canvasHeight;
        drawWidth = canvasHeight * imgAspect;
      } else {
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / imgAspect;
      }
      drawX = (canvasWidth - drawWidth) * (cropPosition.x / 100);
      drawY = (canvasHeight - drawHeight) * (cropPosition.y / 100);
    } else {
      if (imgAspect > canvasWidth / canvasHeight) {
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / imgAspect;
      } else {
        drawHeight = canvasHeight;
        drawWidth = canvasHeight * imgAspect;
      }
      drawX = (canvasWidth - drawWidth) / 2;
      drawY = (canvasHeight - drawHeight) / 2;
    }

    const drawWidthR = Math.round(drawWidth);
    const drawHeightR = Math.round(drawHeight);
    const drawXR = Math.round(drawX);
    const drawYR = Math.round(drawY);

    let resizedForeground = sharp(opts.inputPath).resize(drawWidthR, drawHeightR, { fit: "fill" });

    // sharp's composite() requires the overlay to fit within the base
    // canvas — but "cover"/"crop" fit modes deliberately overflow it (that's
    // what makes them crop). Pre-extract just the visible region instead of
    // relying on drawImage-style auto-clipping, which sharp doesn't do.
    const cropLeft = Math.max(0, -drawXR);
    const cropTop = Math.max(0, -drawYR);
    const visibleWidth = Math.min(drawWidthR - cropLeft, canvasWidth - Math.max(0, drawXR));
    const visibleHeight = Math.min(drawHeightR - cropTop, canvasHeight - Math.max(0, drawYR));
    const compositeLeft = Math.max(0, drawXR);
    const compositeTop = Math.max(0, drawYR);

    if (cropLeft > 0 || cropTop > 0 || visibleWidth < drawWidthR || visibleHeight < drawHeightR) {
      resizedForeground = resizedForeground.extract({
        left: cropLeft,
        top: cropTop,
        width: Math.max(1, visibleWidth),
        height: Math.max(1, visibleHeight),
      });
    }

    const foreground = await resizedForeground.png().toBuffer();

    let pipeline = base.composite([{ input: foreground, left: compositeLeft, top: compositeTop }]);

    const format = opts.format ?? "png";
    const quality = opts.quality ?? 90;
    switch (format) {
      case "jpeg":
        pipeline = pipeline.jpeg({ quality });
        break;
      case "webp":
        pipeline = pipeline.webp({ quality });
        break;
      case "avif":
        pipeline = pipeline.avif({ quality });
        break;
      default:
        pipeline = pipeline.png();
    }

    fs.mkdirSync(path.dirname(path.resolve(opts.outPath)), { recursive: true });
    await pipeline.toFile(opts.outPath);

    return { ok: true, outputPath: opts.outPath, message: `Converted to ${canvasWidth}x${canvasHeight} -> ${opts.outPath}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
