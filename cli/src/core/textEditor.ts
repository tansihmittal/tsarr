// Node port of components/image-text-editor/{Layout,Preview}.tsx. That tool
// runs Tesseract OCR to auto-detect text regions, lets the user edit any
// region's text in place, then re-renders: inpaint the old text's
// background (gradient sampled from the region's edges) and draw the new
// text in the auto-detected color/weight. tesseract.js itself is a genuine
// Node-portable OCR engine (unlike the WASM/WebGL models used by the tools
// deferred earlier), so this ports directly rather than needing a fallback.
//
// CLI shape: two steps, matching the browser tool's own detect-then-edit
// flow — `detectText` writes out the regions as JSON, the caller edits
// whichever `newText` fields they want changed, then `replaceText` renders
// the result from that edited JSON.
import sharp from "sharp";
import { createWorker, OEM, PSM } from "tesseract.js";
import * as fs from "fs";
import * as path from "path";
import { ToolOutcome } from "./types";

export interface TextRegion {
  id: string;
  text: string;
  newText: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  fontSize: number;
  fontWeight: "normal" | "bold";
  textColor: string;
  bgColor: string;
}

const OCR_CONFIG = {
  MIN_CONFIDENCE: 40,
  MIN_FONT_SIZE: 10,
  FONT_SIZE_RATIO: 0.75,
};

async function sampleRegionColors(
  data: Buffer,
  imgWidth: number,
  imgHeight: number,
  channels: number,
  region: { x: number; y: number; width: number; height: number }
): Promise<{ textColor: string; bgColor: string }> {
  const pad = 2;
  const x = Math.max(0, region.x - pad);
  const y = Math.max(0, region.y - pad);
  const w = Math.min(imgWidth - x, region.width + pad * 2);
  const h = Math.min(imgHeight - y, region.height + pad * 2);

  const colorMap = new Map<string, { r: number; g: number; b: number; count: number; brightness: number }>();

  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      const idx = (py * imgWidth + px) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;

      const qr = Math.round(r / 16) * 16;
      const qg = Math.round(g / 16) * 16;
      const qb = Math.round(b / 16) * 16;
      const key = `${qr},${qg},${qb}`;

      const existing = colorMap.get(key);
      if (existing) {
        existing.count++;
        existing.r = (existing.r * (existing.count - 1) + r) / existing.count;
        existing.g = (existing.g * (existing.count - 1) + g) / existing.count;
        existing.b = (existing.b * (existing.count - 1) + b) / existing.count;
      } else {
        colorMap.set(key, { r, g, b, count: 1, brightness });
      }
    }
  }

  const colors = Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
  const total = w * h;
  const bgCandidate = colors[0] || { r: 128, g: 128, b: 128, brightness: 128 };

  let textCandidate = { r: 255, g: 255, b: 255, brightness: 255 };
  for (const color of colors) {
    const contrast = Math.abs(color.brightness - bgCandidate.brightness);
    if (contrast > 50 && color.count > total / 20) {
      textCandidate = color;
      break;
    }
  }
  if (textCandidate.brightness === 255) {
    textCandidate = bgCandidate.brightness > 128 ? { r: 30, g: 30, b: 30, brightness: 30 } : { r: 255, g: 255, b: 255, brightness: 255 };
  }

  return {
    textColor: `rgb(${Math.round(textCandidate.r)}, ${Math.round(textCandidate.g)}, ${Math.round(textCandidate.b)})`,
    bgColor: `rgb(${Math.round(bgCandidate.r)}, ${Math.round(bgCandidate.g)}, ${Math.round(bgCandidate.b)})`,
  };
}

export interface DetectTextOptions {
  inputPath: string;
  outPath: string; // .json
}

export interface DetectTextOutcome {
  ok: true;
  outputPath: string;
  regionCount: number;
  message: string;
}

export async function detectText(opts: DetectTextOptions): Promise<DetectTextOutcome | { ok: false; error: string }> {
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    if (!fs.existsSync(opts.inputPath)) return { ok: false, error: `Input file not found: ${opts.inputPath}` };

    const { data, info } = await sharp(opts.inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    worker = await createWorker("eng", OEM.LSTM_ONLY);
    await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
    const result = await worker.recognize(opts.inputPath);

    const ocrData = result.data as unknown as {
      text: string;
      lines?: { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }[];
    };

    const regions: TextRegion[] = [];
    for (const line of ocrData.lines ?? []) {
      if (!line.text?.trim() || line.confidence < OCR_CONFIG.MIN_CONFIDENCE) continue;
      const bbox = line.bbox;
      const height = bbox.y1 - bbox.y0;
      const width = bbox.x1 - bbox.x0;
      const fontSize = Math.max(OCR_CONFIG.MIN_FONT_SIZE, Math.round(height * OCR_CONFIG.FONT_SIZE_RATIO));
      const colors = await sampleRegionColors(data, info.width, info.height, info.channels, {
        x: bbox.x0,
        y: bbox.y0,
        width,
        height,
      });

      regions.push({
        id: `region_${regions.length + 1}`,
        text: line.text.trim(),
        newText: line.text.trim(),
        x: bbox.x0,
        y: bbox.y0,
        width,
        height,
        confidence: line.confidence,
        fontSize,
        fontWeight: height > 20 ? "bold" : "normal",
        textColor: colors.textColor,
        bgColor: colors.bgColor,
      });
    }

    fs.mkdirSync(path.dirname(path.resolve(opts.outPath)), { recursive: true });
    fs.writeFileSync(opts.outPath, JSON.stringify(regions, null, 2));

    return {
      ok: true,
      outputPath: opts.outPath,
      regionCount: regions.length,
      message: regions.length > 0
        ? `Detected ${regions.length} text region(s) -> ${opts.outPath}. Edit "newText" in that file, then run replace-text.`
        : `No text detected in ${opts.inputPath}`,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    if (worker) await worker.terminate().catch(() => {});
  }
}

export interface ReplaceTextOptions {
  inputPath: string;
  regionsPath: string; // JSON produced by detectText, with newText fields edited
  outPath: string;
}

function isColorLight(color: string): boolean {
  const m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/) || color.match(/#([0-9a-f]{6})/i);
  let r: number, g: number, b: number;
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else if (m) {
    [, r, g, b] = m.map(Number) as unknown as [string, number, number, number];
  } else {
    return false;
  }
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

export async function replaceText(opts: ReplaceTextOptions): Promise<ToolOutcome> {
  try {
    if (!fs.existsSync(opts.inputPath)) return { ok: false, error: `Input file not found: ${opts.inputPath}` };
    if (!fs.existsSync(opts.regionsPath)) return { ok: false, error: `Regions file not found: ${opts.regionsPath}` };

    const regions: TextRegion[] = JSON.parse(fs.readFileSync(opts.regionsPath, "utf8"));
    const meta = await sharp(opts.inputPath).metadata();
    const imgWidth = meta.width ?? 0;
    const imgHeight = meta.height ?? 0;

    const overlays: sharp.OverlayOptions[] = [];
    let changedCount = 0;

    for (const region of regions) {
      if (region.newText === region.text) continue;
      changedCount++;

      const pad = 2;
      const x = Math.max(0, region.x - pad);
      const y = Math.max(0, region.y - pad);
      const w = Math.min(imgWidth - x, region.width + pad * 2);
      const h = Math.min(imgHeight - y, region.height + pad * 2);

      // Inpaint: sample the 4 edges just outside the region and fill with a
      // gradient built from them — same recipe as the browser tool.
      const edgeSize = 3;
      const sampleEdge = async (sx: number, sy: number, sw: number, sh: number) => {
        const cx = Math.max(0, Math.min(imgWidth - sw, sx));
        const cy = Math.max(0, Math.min(imgHeight - sh, sy));
        const { data } = await sharp(opts.inputPath)
          .extract({ left: Math.round(cx), top: Math.round(cy), width: Math.max(1, Math.round(sw)), height: Math.max(1, Math.round(sh)) })
          .raw()
          .toBuffer({ resolveWithObject: true });
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i + 3 <= data.length; i += 3) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        return count > 0 ? [r / count, g / count, b / count] : [128, 128, 128];
      };

      const [leftColor, rightColor, topColor, bottomColor] = await Promise.all([
        sampleEdge(x - edgeSize * 2, y, edgeSize, h),
        sampleEdge(x + w + edgeSize, y, edgeSize, h),
        sampleEdge(x, y - edgeSize * 2, w, edgeSize),
        sampleEdge(x, y + h + edgeSize, w, edgeSize),
      ]);
      const avgLeft = [(leftColor[0] + topColor[0]) / 2, (leftColor[1] + topColor[1]) / 2, (leftColor[2] + topColor[2]) / 2];
      const avgRight = [(rightColor[0] + bottomColor[0]) / 2, (rightColor[1] + bottomColor[1]) / 2, (rightColor[2] + bottomColor[2]) / 2];

      const shadow = isColorLight(region.textColor) ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.3)";
      const escapedText = region.newText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="rgb(${avgLeft.join(",")})"/>
            <stop offset="1" stop-color="rgb(${avgRight.join(",")})"/>
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="${shadow}"/>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg)"/>
        <text x="${pad}" y="${h / 2}" dominant-baseline="middle" text-anchor="start"
          font-family="-apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif"
          font-size="${region.fontSize}" font-weight="${region.fontWeight}"
          fill="${region.textColor}" filter="url(#shadow)">${escapedText}</text>
      </svg>`;

      overlays.push({ input: Buffer.from(svg), left: Math.round(x), top: Math.round(y) });
    }

    if (changedCount === 0) {
      return { ok: false, error: 'No regions have a "newText" different from "text" — nothing to replace' };
    }

    fs.mkdirSync(path.dirname(path.resolve(opts.outPath)), { recursive: true });
    await sharp(opts.inputPath).composite(overlays).toFile(opts.outPath);

    return { ok: true, outputPath: opts.outPath, message: `Replaced text in ${changedCount} region(s) -> ${opts.outPath}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
