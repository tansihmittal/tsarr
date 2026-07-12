import JSZip from "jszip";
import {
  AppIconGeneratorState,
  IOS_ICONS,
  iosFilename,
  ANDROID_ICONS,
  ANDROID_PLAYSTORE_PIXELS,
  WEB_ICON_SIZES,
  MACOS_ICONS,
} from "./types";

// Renders the source image onto a square canvas at the given pixel size,
// flattening transparency onto backgroundColor and applying the padding
// inset, then returns a PNG blob. Shared by every platform's export.
function renderIcon(
  img: HTMLImageElement,
  pixels: number,
  backgroundColor: string,
  paddingPercent: number
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = pixels;
  canvas.height = pixels;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, pixels, pixels);

  const inset = (paddingPercent / 100) * pixels;
  const drawSize = pixels - inset * 2;

  // Cover-fit the (already-square, since the caller crops to square first)
  // source image into the padded area.
  const srcSize = Math.min(img.width, img.height);
  const sx = (img.width - srcSize) / 2;
  const sy = (img.height - srcSize) / 2;
  ctx.drawImage(img, sx, sy, srcSize, srcSize, inset, inset, drawSize, drawSize);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png");
  });
}

async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

// Packs PNG-format frames directly into a valid .ico container. Since
// Windows Vista, ICO entries may hold raw PNG data instead of legacy BMP
// bitmaps, so no re-encoding is needed — just the ICONDIR header plus one
// ICONDIRENTRY per frame, followed by the PNG bytes back-to-back.
function packIco(frames: { pixels: number; png: Uint8Array }[]): Uint8Array {
  const headerSize = 6;
  const entrySize = 16;
  const dataOffsetStart = headerSize + entrySize * frames.length;

  const header = new Uint8Array(headerSize);
  const headerView = new DataView(header.buffer);
  headerView.setUint16(0, 0, true); // reserved
  headerView.setUint16(2, 1, true); // type: 1 = icon
  headerView.setUint16(4, frames.length, true);

  const entries = new Uint8Array(entrySize * frames.length);
  let offset = dataOffsetStart;
  frames.forEach((frame, i) => {
    const view = new DataView(entries.buffer, i * entrySize, entrySize);
    const dim = frame.pixels >= 256 ? 0 : frame.pixels; // 0 means 256 per ICO spec
    view.setUint8(0, dim); // width
    view.setUint8(1, dim); // height
    view.setUint8(2, 0); // color palette
    view.setUint8(3, 0); // reserved
    view.setUint16(4, 1, true); // color planes
    view.setUint16(6, 32, true); // bits per pixel
    view.setUint32(8, frame.png.byteLength, true); // data size
    view.setUint32(12, offset, true); // data offset
    offset += frame.png.byteLength;
  });

  const total = new Uint8Array(offset);
  total.set(header, 0);
  total.set(entries, headerSize);
  let cursor = dataOffsetStart;
  for (const frame of frames) {
    total.set(frame.png, cursor);
    cursor += frame.png.byteLength;
  }
  return total;
}

function buildIosContentsJson(): string {
  const images = IOS_ICONS.map((icon) => ({
    size: icon.size,
    idiom: icon.idiom,
    filename: iosFilename(icon.pixels),
    scale: icon.scale,
  }));
  return JSON.stringify(
    { images, info: { version: 1, author: "tsarr.in" } },
    null,
    2
  );
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

export async function generateIconZip(state: AppIconGeneratorState): Promise<Blob> {
  if (!state.image) throw new Error("No image to export");

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Failed to load source image"));
    el.src = state.image!;
  });

  const zip = new JSZip();
  // Cache renders by pixel size within a single export run — several specs
  // (iOS, favicon, web) request overlapping sizes.
  const cache = new Map<number, Promise<Blob>>();
  const renderCached = (pixels: number) => {
    if (!cache.has(pixels)) {
      cache.set(pixels, renderIcon(img, pixels, state.backgroundColor, state.padding));
    }
    return cache.get(pixels)!;
  };

  if (state.platforms.ios) {
    const ios = zip.folder("ios/AppIcon.appiconset")!;
    const uniquePixels = Array.from(new Set(IOS_ICONS.map((i) => i.pixels)));
    for (const pixels of uniquePixels) {
      ios.file(iosFilename(pixels), await renderCached(pixels));
    }
    ios.file("Contents.json", buildIosContentsJson());
  }

  if (state.platforms.android) {
    const android = zip.folder("android")!;
    for (const spec of ANDROID_ICONS) {
      const folder = android.folder(spec.density)!;
      folder.file("ic_launcher.png", await renderCached(spec.pixels));
    }
    android.file("playstore-icon.png", await renderCached(ANDROID_PLAYSTORE_PIXELS));
  }

  if (state.platforms.web) {
    const web = zip.folder("web")!;
    web.file("favicon-16x16.png", await renderCached(WEB_ICON_SIZES.favicon16));
    web.file("favicon-32x32.png", await renderCached(WEB_ICON_SIZES.favicon32));
    web.file("apple-touch-icon.png", await renderCached(WEB_ICON_SIZES.appleTouchIcon));
    web.file("android-chrome-192x192.png", await renderCached(WEB_ICON_SIZES.androidChromeSmall));
    web.file("android-chrome-512x512.png", await renderCached(WEB_ICON_SIZES.androidChromeLarge));
    web.file("site.webmanifest", buildWebManifest());

    const icoFrames = await Promise.all(
      WEB_ICON_SIZES.faviconIco.map(async (pixels) => ({
        pixels,
        png: await blobToUint8Array(await renderCached(pixels)),
      }))
    );
    web.file("favicon.ico", packIco(icoFrames));
  }

  if (state.platforms.macos) {
    const macos = zip.folder("macos/AppIcon.iconset")!;
    for (const spec of MACOS_ICONS) {
      macos.file(spec.filename, await renderCached(spec.pixels));
    }
  }

  return zip.generateAsync({ type: "blob" });
}
