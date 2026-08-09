// Node port of components/polaroid. That tool renders a live DOM node
// (frame + CSS filter chain + several gradient/noise overlays) and captures
// it with html2canvas. This builds the same layer stack directly: sharp
// handles the photo's color adjustments (brightness/contrast/saturation/
// hue-rotate/blur, replacing the CSS `filter` chain) and an SVG composites
// the frame, vignette, light-leak, grain, and caption on top in one pass.
//
// Scoped out of this port (documented in the CLI README): the 29 named
// "filter" presets (vintage/sepia/etc — exposed instead as the underlying
// raw brightness/contrast/saturation/hue/blur numbers the presets are built
// from), the frame-texture overlays (paper/grain/ragged), and the
// hoga-specific extra vignette. Captions need the same Google Fonts
// (Caveat, Permanent Marker, etc.) installed as system fonts on the host
// running the CLI — librsvg resolves font-family the same way a browser
// resolves an unavailable font: silent fallback, not an error.
import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";
import { ToolOutcome } from "./types";

export type LightLeakId = "none" | "warm" | "cool" | "rainbow" | "subtle" | "orange" | "blue" | "pink" | "vintage";

export interface PolaroidOptions {
  inputPath: string;
  outPath: string;
  frameColor?: string; // default #ffffff
  borderWidth?: number; // default 20
  bottomBorderWidth?: number; // default 80
  caption?: string;
  captionFont?: string; // default Caveat (must be installed as a system font)
  captionSize?: number; // default 24
  captionColor?: string; // default #333333
  rotation?: number; // degrees, default 0
  shadow?: boolean; // default true
  backgroundColor?: string; // canvas behind the polaroid, default #f5f5f5
  brightness?: number; // percent, default 100
  contrast?: number; // percent, default 100
  saturation?: number; // percent, default 100
  hueRotate?: number; // degrees, default 0
  blur?: number; // px, default 0
  vignette?: boolean; // default false
  vignetteIntensity?: number; // percent 10-80, default 40
  lightLeak?: LightLeakId; // default none
  grain?: boolean; // default false
  grainIntensity?: number; // percent 5-50, default 20
}

const LIGHT_LEAKS: Record<Exclude<LightLeakId, "none">, { angle: number; stops: { offset: number; color: string }[] }> = {
  warm: { angle: 135, stops: [{ offset: 0, color: "rgba(255,150,50,0.25)" }, { offset: 0.5, color: "rgba(255,150,50,0)" }, { offset: 1, color: "rgba(255,100,50,0.15)" }] },
  cool: { angle: 225, stops: [{ offset: 0, color: "rgba(100,150,255,0.2)" }, { offset: 0.5, color: "rgba(100,150,255,0)" }, { offset: 1, color: "rgba(150,100,255,0.15)" }] },
  rainbow: { angle: 135, stops: [{ offset: 0, color: "rgba(255,100,100,0.15)" }, { offset: 0.25, color: "rgba(255,200,100,0.1)" }, { offset: 0.5, color: "rgba(100,255,150,0.1)" }, { offset: 0.75, color: "rgba(100,150,255,0.15)" }, { offset: 1, color: "rgba(200,100,255,0.1)" }] },
  subtle: { angle: 180, stops: [{ offset: 0, color: "rgba(255,200,150,0.1)" }, { offset: 0.3, color: "rgba(255,200,150,0)" }, { offset: 0.7, color: "rgba(255,150,100,0)" }, { offset: 1, color: "rgba(255,150,100,0.08)" }] },
  orange: { angle: 120, stops: [{ offset: 0, color: "rgba(255,120,50,0.35)" }, { offset: 0.3, color: "rgba(255,180,80,0.2)" }, { offset: 0.6, color: "rgba(255,180,80,0)" }] },
  blue: { angle: 240, stops: [{ offset: 0, color: "rgba(80,120,255,0.3)" }, { offset: 0.3, color: "rgba(100,180,255,0.15)" }, { offset: 0.6, color: "rgba(100,180,255,0)" }] },
  pink: { angle: 315, stops: [{ offset: 0, color: "rgba(255,100,150,0.25)" }, { offset: 0.4, color: "rgba(255,150,200,0.15)" }, { offset: 0.7, color: "rgba(255,150,200,0)" }] },
  vintage: { angle: 45, stops: [{ offset: 0, color: "rgba(255,200,100,0.2)" }, { offset: 0.4, color: "rgba(255,200,100,0)" }, { offset: 0.6, color: "rgba(255,150,80,0)" }, { offset: 1, color: "rgba(255,150,80,0.25)" }] },
};

function cssAngleToVector(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  return { x1: 0.5 - dx / 2, y1: 0.5 - dy / 2, x2: 0.5 + dx / 2, y2: 0.5 + dy / 2 };
}

function hexToRgba(hex: string): { r: number; g: number; b: number; alpha: number } {
  const clean = hex.replace("#", "");
  return { r: parseInt(clean.substring(0, 2), 16), g: parseInt(clean.substring(2, 4), 16), b: parseInt(clean.substring(4, 6), 16), alpha: 1 };
}

export async function generatePolaroid(opts: PolaroidOptions): Promise<ToolOutcome> {
  try {
    if (!fs.existsSync(opts.inputPath)) return { ok: false, error: `Input file not found: ${opts.inputPath}` };

    const meta = await sharp(opts.inputPath).metadata();
    const imgWidth = meta.width ?? 0;
    const imgHeight = meta.height ?? 0;
    if (!imgWidth || !imgHeight) return { ok: false, error: "Could not read source image dimensions" };

    // Color adjustments, replacing the CSS filter chain
    let photo = sharp(opts.inputPath).modulate({
      brightness: (opts.brightness ?? 100) / 100,
      saturation: (opts.saturation ?? 100) / 100,
      hue: opts.hueRotate ?? 0,
    });
    const contrast = (opts.contrast ?? 100) / 100;
    if (contrast !== 1) {
      photo = photo.linear(contrast, 128 * (1 - contrast));
    }
    if (opts.blur && opts.blur > 0) {
      photo = photo.blur(Math.max(0.3, opts.blur));
    }
    const photoBuffer = await photo.png().toBuffer();

    // Overlays composited directly on top of the photo, at photo size
    const overlays: string[] = [];
    if (opts.vignette) {
      const intensity = (opts.vignetteIntensity ?? 40) / 100;
      const innerPct = Math.max(0, 50 - intensity * 30);
      overlays.push(`<radialGradient id="vignette" cx="50%" cy="50%" r="70.7%">
        <stop offset="${innerPct}%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,${intensity * 0.6})"/>
      </radialGradient>
      <rect width="100%" height="100%" fill="url(#vignette)"/>`);
    }
    if (opts.lightLeak && opts.lightLeak !== "none") {
      const leak = LIGHT_LEAKS[opts.lightLeak];
      const vec = cssAngleToVector(leak.angle);
      const stops = leak.stops.map((s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`).join("");
      overlays.push(`<linearGradient id="leak" x1="${vec.x1}" y1="${vec.y1}" x2="${vec.x2}" y2="${vec.y2}">${stops}</linearGradient>
      <rect width="100%" height="100%" fill="url(#leak)"/>`);
    }
    if (opts.grain) {
      const grainOpacity = (opts.grainIntensity ?? 20) / 100;
      overlays.push(`<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/></filter>
      <rect width="100%" height="100%" filter="url(#grain)" opacity="${grainOpacity}"/>`);
    }

    const overlaidPhoto = overlays.length
      ? await sharp(photoBuffer)
          .composite([
            {
              input: Buffer.from(
                `<svg width="${imgWidth}" height="${imgHeight}" xmlns="http://www.w3.org/2000/svg"><defs></defs>${overlays.join("\n")}</svg>`
              ),
            },
          ])
          .png()
          .toBuffer()
      : photoBuffer;

    // Frame + caption
    const borderWidth = opts.borderWidth ?? 20;
    const bottomBorderWidth = opts.bottomBorderWidth ?? 80;
    const frameWidth = imgWidth + borderWidth * 2;
    const frameHeight = imgHeight + borderWidth + bottomBorderWidth;
    const rotation = opts.rotation ?? 0;

    const captionSvg = opts.caption
      ? `<text x="${frameWidth / 2}" y="${imgHeight + borderWidth + (bottomBorderWidth - borderWidth) / 2 + (opts.captionSize ?? 24) / 3}"
          text-anchor="middle" font-family="${opts.captionFont ?? "Caveat"}" font-size="${opts.captionSize ?? 24}"
          fill="${opts.captionColor ?? "#333333"}">${opts.caption.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</text>`
      : "";

    const frameSvg = `<svg width="${frameWidth}" height="${frameHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${opts.frameColor ?? "#ffffff"}"/>
      ${captionSvg}
    </svg>`;

    let framed = sharp(Buffer.from(frameSvg)).composite([{ input: overlaidPhoto, left: borderWidth, top: borderWidth }]);
    if (opts.shadow !== false) {
      // Approximate the CSS box-shadow with an extruded, blurred dark copy
      // composited underneath — good enough for a drop-shadow silhouette.
      framed = framed; // shadow handled at the canvas-composite step below for correct stacking under rotation
    }
    const framedBuffer = await framed.png().toBuffer();

    const rotatedBuffer =
      rotation !== 0
        ? await sharp(framedBuffer)
            .rotate(rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer()
        : framedBuffer;
    const rotatedMeta = await sharp(rotatedBuffer).metadata();

    const canvasPadding = 48;
    const canvasWidth = (rotatedMeta.width ?? frameWidth) + canvasPadding * 2;
    const canvasHeight = (rotatedMeta.height ?? frameHeight) + canvasPadding * 2;

    let canvas = sharp({
      create: { width: canvasWidth, height: canvasHeight, channels: 4, background: hexToRgba(opts.backgroundColor ?? "#f5f5f5") },
    });

    const compositeLayers: sharp.OverlayOptions[] = [];
    if (opts.shadow !== false) {
      const shadowBuffer = await sharp(rotatedBuffer)
        .ensureAlpha()
        .tint({ r: 0, g: 0, b: 0 })
        .blur(12)
        .toBuffer();
      compositeLayers.push({ input: shadowBuffer, left: canvasPadding + 6, top: canvasPadding + 10, blend: "over" });
    }
    compositeLayers.push({ input: rotatedBuffer, left: canvasPadding, top: canvasPadding });

    canvas = canvas.composite(compositeLayers);

    fs.mkdirSync(path.dirname(path.resolve(opts.outPath)), { recursive: true });
    await canvas.png().toFile(opts.outPath);

    return { ok: true, outputPath: opts.outPath, message: `Generated polaroid -> ${opts.outPath}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
