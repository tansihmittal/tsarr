import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";
import { ToolOutcome } from "./types";

export type ImageFormat = "png" | "jpeg" | "webp" | "avif" | "gif" | "tiff";

export interface ResizeOptions {
  inputPath: string;
  outPath: string;
  width?: number;
  height?: number;
  percentage?: number; // alternative to width/height
  maintainAspectRatio?: boolean; // default true when only one of width/height given
  format?: ImageFormat;
  quality?: number; // 1-100, ignored for png
}

export async function resizeImage(opts: ResizeOptions): Promise<ToolOutcome> {
  try {
    if (!fs.existsSync(opts.inputPath)) {
      return { ok: false, error: `Input file not found: ${opts.inputPath}` };
    }
    if (!opts.width && !opts.height && !opts.percentage) {
      return { ok: false, error: "Provide --width, --height, or --percentage" };
    }

    let pipeline = sharp(opts.inputPath);
    const meta = await pipeline.metadata();

    let targetWidth: number | undefined = opts.width;
    let targetHeight: number | undefined = opts.height;

    if (opts.percentage) {
      const scale = opts.percentage / 100;
      targetWidth = Math.round((meta.width ?? 0) * scale);
      targetHeight = Math.round((meta.height ?? 0) * scale);
    }

    pipeline = pipeline.resize({
      width: targetWidth,
      height: targetHeight,
      fit: opts.maintainAspectRatio === false ? "fill" : "inside",
      withoutEnlargement: false,
    });

    const format = opts.format ?? "png";
    const quality = opts.quality ?? 90;
    pipeline = applyFormat(pipeline, format, quality);

    fs.mkdirSync(path.dirname(path.resolve(opts.outPath)), { recursive: true });
    const info = await pipeline.toFile(opts.outPath);

    return {
      ok: true,
      outputPath: opts.outPath,
      message: `Resized to ${info.width}x${info.height} -> ${opts.outPath}`,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function applyFormat(pipeline: sharp.Sharp, format: ImageFormat, quality: number): sharp.Sharp {
  switch (format) {
    case "jpeg":
      return pipeline.jpeg({ quality });
    case "webp":
      return pipeline.webp({ quality });
    case "avif":
      return pipeline.avif({ quality });
    case "gif":
      return pipeline.gif();
    case "tiff":
      return pipeline.tiff({ quality });
    case "png":
    default:
      return pipeline.png();
  }
}
