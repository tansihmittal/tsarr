// Node port of components/app-icon-generator/generateIcons.ts in the main app.
// Same algorithm and spec tables; the browser version composites via DOM
// Canvas 2D (fillRect + drawImage), this version does the equivalent with
// sharp: a solid-color background image + a cover-fit-resized copy of the
// source composited on top at the padding offset.
import sharp from "sharp";
import JSZip from "jszip";
import * as fs from "fs";
import * as path from "path";
import { ToolOutcome } from "./types";

export interface IosIconSpec {
  size: string;
  idiom: "iphone" | "ipad" | "ios-marketing";
  scale: "1x" | "2x" | "3x";
  pixels: number;
}

export const IOS_ICONS: IosIconSpec[] = [
  { size: "20x20", idiom: "iphone", scale: "2x", pixels: 40 },
  { size: "20x20", idiom: "iphone", scale: "3x", pixels: 60 },
  { size: "29x29", idiom: "iphone", scale: "2x", pixels: 58 },
  { size: "29x29", idiom: "iphone", scale: "3x", pixels: 87 },
  { size: "40x40", idiom: "iphone", scale: "2x", pixels: 80 },
  { size: "40x40", idiom: "iphone", scale: "3x", pixels: 120 },
  { size: "60x60", idiom: "iphone", scale: "2x", pixels: 120 },
  { size: "60x60", idiom: "iphone", scale: "3x", pixels: 180 },
  { size: "20x20", idiom: "ipad", scale: "1x", pixels: 20 },
  { size: "20x20", idiom: "ipad", scale: "2x", pixels: 40 },
  { size: "29x29", idiom: "ipad", scale: "1x", pixels: 29 },
  { size: "29x29", idiom: "ipad", scale: "2x", pixels: 58 },
  { size: "40x40", idiom: "ipad", scale: "1x", pixels: 40 },
  { size: "40x40", idiom: "ipad", scale: "2x", pixels: 80 },
  { size: "76x76", idiom: "ipad", scale: "1x", pixels: 76 },
  { size: "76x76", idiom: "ipad", scale: "2x", pixels: 152 },
  { size: "83.5x83.5", idiom: "ipad", scale: "2x", pixels: 167 },
  { size: "1024x1024", idiom: "ios-marketing", scale: "1x", pixels: 1024 },
];

export const iosFilename = (pixels: number) => `icon-${pixels}.png`;

export interface AndroidIconSpec {
  density: string;
  pixels: number;
}

export const ANDROID_ICONS: AndroidIconSpec[] = [
  { density: "mipmap-mdpi", pixels: 48 },
  { density: "mipmap-hdpi", pixels: 72 },
  { density: "mipmap-xhdpi", pixels: 96 },
  { density: "mipmap-xxhdpi", pixels: 144 },
  { density: "mipmap-xxxhdpi", pixels: 192 },
];

export const ANDROID_PLAYSTORE_PIXELS = 512;

export const WEB_ICON_SIZES = {
  favicon16: 16,
  favicon32: 32,
  faviconIco: [16, 32, 48] as number[],
  appleTouchIcon: 180,
  androidChromeSmall: 192,
  androidChromeLarge: 512,
};

export interface MacIconSpec {
  filename: string;
  pixels: number;
}

export const MACOS_ICONS: MacIconSpec[] = [
  { filename: "icon_16x16.png", pixels: 16 },
  { filename: "icon_16x16@2x.png", pixels: 32 },
  { filename: "icon_32x32.png", pixels: 32 },
  { filename: "icon_32x32@2x.png", pixels: 64 },
  { filename: "icon_128x128.png", pixels: 128 },
  { filename: "icon_128x128@2x.png", pixels: 256 },
  { filename: "icon_256x256.png", pixels: 256 },
  { filename: "icon_256x256@2x.png", pixels: 512 },
  { filename: "icon_512x512.png", pixels: 512 },
  { filename: "icon_512x512@2x.png", pixels: 1024 },
];

export interface AppIconOptions {
  inputPath: string;
  outPath: string; // .zip file path
  backgroundColor?: string; // default #ffffff
  padding?: number; // percent 0-20, default 0
  platforms?: {
    ios?: boolean;
    android?: boolean;
    web?: boolean;
    macos?: boolean;
  };
}

function hexToRgba(hex: string): { r: number; g: number; b: number; alpha: number } {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { r, g, b, alpha: 1 };
}

async function renderIcon(inputPath: string, pixels: number, backgroundColor: string, paddingPercent: number): Promise<Buffer> {
  const inset = Math.round((paddingPercent / 100) * pixels);
  const drawSize = pixels - inset * 2;

  const srcSquare = await sharp(inputPath)
    .resize(drawSize, drawSize, { fit: "cover" })
    .png()
    .toBuffer();

  return sharp({
    create: { width: pixels, height: pixels, channels: 4, background: hexToRgba(backgroundColor) },
  })
    .composite([{ input: srcSquare, left: inset, top: inset }])
    .png()
    .toBuffer();
}

// Packs PNG-format frames directly into a valid .ico container — same
// approach as the browser tool: since Vista, ICO entries may hold raw PNG
// data instead of legacy BMP bitmaps.
export function packIco(frames: { pixels: number; png: Buffer }[]): Buffer {
  const headerSize = 6;
  const entrySize = 16;
  const dataOffsetStart = headerSize + entrySize * frames.length;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);

  const entries = Buffer.alloc(entrySize * frames.length);
  let offset = dataOffsetStart;
  frames.forEach((frame, i) => {
    const base = i * entrySize;
    const dim = frame.pixels >= 256 ? 0 : frame.pixels;
    entries.writeUInt8(dim, base + 0);
    entries.writeUInt8(dim, base + 1);
    entries.writeUInt8(0, base + 2);
    entries.writeUInt8(0, base + 3);
    entries.writeUInt16LE(1, base + 4);
    entries.writeUInt16LE(32, base + 6);
    entries.writeUInt32LE(frame.png.length, base + 8);
    entries.writeUInt32LE(offset, base + 12);
    offset += frame.png.length;
  });

  return Buffer.concat([header, entries, ...frames.map((f) => f.png)]);
}

function buildIosContentsJson(): string {
  const images = IOS_ICONS.map((icon) => ({
    size: icon.size,
    idiom: icon.idiom,
    filename: iosFilename(icon.pixels),
    scale: icon.scale,
  }));
  return JSON.stringify({ images, info: { version: 1, author: "tsarr.in" } }, null, 2);
}

function buildWebManifest(): string {
  return JSON.stringify(
    {
      name: "App Name",
      short_name: "App",
      icons: [
        { src: `android-chrome-${WEB_ICON_SIZES.androidChromeSmall}x${WEB_ICON_SIZES.androidChromeSmall}.png`, sizes: `${WEB_ICON_SIZES.androidChromeSmall}x${WEB_ICON_SIZES.androidChromeSmall}`, type: "image/png" },
        { src: `android-chrome-${WEB_ICON_SIZES.androidChromeLarge}x${WEB_ICON_SIZES.androidChromeLarge}.png`, sizes: `${WEB_ICON_SIZES.androidChromeLarge}x${WEB_ICON_SIZES.androidChromeLarge}`, type: "image/png" },
      ],
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
    },
    null,
    2
  );
}

export async function generateAppIcons(opts: AppIconOptions): Promise<ToolOutcome> {
  try {
    if (!fs.existsSync(opts.inputPath)) {
      return { ok: false, error: `Input file not found: ${opts.inputPath}` };
    }
    const backgroundColor = opts.backgroundColor ?? "#ffffff";
    const padding = opts.padding ?? 0;
    const platforms = {
      ios: opts.platforms?.ios ?? true,
      android: opts.platforms?.android ?? true,
      web: opts.platforms?.web ?? true,
      macos: opts.platforms?.macos ?? true,
    };
    if (!platforms.ios && !platforms.android && !platforms.web && !platforms.macos) {
      return { ok: false, error: "No platforms selected" };
    }

    const zip = new JSZip();
    const cache = new Map<number, Promise<Buffer>>();
    const render = (pixels: number) => {
      if (!cache.has(pixels)) cache.set(pixels, renderIcon(opts.inputPath, pixels, backgroundColor, padding));
      return cache.get(pixels)!;
    };

    if (platforms.ios) {
      const ios = zip.folder("ios/AppIcon.appiconset")!;
      const uniquePixels = Array.from(new Set(IOS_ICONS.map((i) => i.pixels)));
      for (const pixels of uniquePixels) ios.file(iosFilename(pixels), await render(pixels));
      ios.file("Contents.json", buildIosContentsJson());
    }

    if (platforms.android) {
      const android = zip.folder("android")!;
      for (const spec of ANDROID_ICONS) {
        android.folder(spec.density)!.file("ic_launcher.png", await render(spec.pixels));
      }
      android.file("playstore-icon.png", await render(ANDROID_PLAYSTORE_PIXELS));
    }

    if (platforms.web) {
      const web = zip.folder("web")!;
      web.file("favicon-16x16.png", await render(WEB_ICON_SIZES.favicon16));
      web.file("favicon-32x32.png", await render(WEB_ICON_SIZES.favicon32));
      web.file("apple-touch-icon.png", await render(WEB_ICON_SIZES.appleTouchIcon));
      web.file("android-chrome-192x192.png", await render(WEB_ICON_SIZES.androidChromeSmall));
      web.file("android-chrome-512x512.png", await render(WEB_ICON_SIZES.androidChromeLarge));
      web.file("site.webmanifest", buildWebManifest());
      const icoFrames = await Promise.all(
        WEB_ICON_SIZES.faviconIco.map(async (pixels) => ({ pixels, png: await render(pixels) }))
      );
      web.file("favicon.ico", packIco(icoFrames));
    }

    if (platforms.macos) {
      const macos = zip.folder("macos/AppIcon.iconset")!;
      for (const spec of MACOS_ICONS) macos.file(spec.filename, await render(spec.pixels));
    }

    const buffer = await zip.generateAsync({ type: "nodebuffer" });
    fs.mkdirSync(path.dirname(path.resolve(opts.outPath)), { recursive: true });
    fs.writeFileSync(opts.outPath, buffer);

    return { ok: true, outputPath: opts.outPath, message: `Generated app icons -> ${opts.outPath}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
