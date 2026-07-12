import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";
import { ToolOutcome } from "./types";
import { applyFormat, ImageFormat } from "./resize";
import { packIco } from "./appIcon";

export type ConvertFormat = ImageFormat | "ico";

export interface ConvertOptions {
  inputPath: string;
  outPath: string;
  format: ConvertFormat;
  quality?: number;
}

export async function convertImage(opts: ConvertOptions): Promise<ToolOutcome> {
  try {
    if (!fs.existsSync(opts.inputPath)) {
      return { ok: false, error: `Input file not found: ${opts.inputPath}` };
    }
    const quality = opts.quality ?? 90;
    fs.mkdirSync(path.dirname(path.resolve(opts.outPath)), { recursive: true });

    if (opts.format === "ico") {
      // .ico can't be produced by sharp directly (browsers can't do this
      // reliably either — see the app-icon-generator review). Render the
      // three conventional favicon sizes and pack them with the same
      // hand-rolled ICO packer used by the app-icon-generator tool.
      const sizes = [16, 32, 48];
      const frames = await Promise.all(
        sizes.map(async (pixels) => ({
          pixels,
          png: await sharp(opts.inputPath).resize(pixels, pixels, { fit: "cover" }).png().toBuffer(),
        }))
      );
      fs.writeFileSync(opts.outPath, packIco(frames));
      return { ok: true, outputPath: opts.outPath, message: `Converted to ICO (16/32/48px) -> ${opts.outPath}` };
    }

    let pipeline = sharp(opts.inputPath);
    pipeline = applyFormat(pipeline, opts.format, quality);
    await pipeline.toFile(opts.outPath);

    return { ok: true, outputPath: opts.outPath, message: `Converted to ${opts.format.toUpperCase()} -> ${opts.outPath}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
