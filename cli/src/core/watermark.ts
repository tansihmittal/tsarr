// Node port of components/watermark-remover/WatermarkRemoverLayout.tsx's
// Telea-style inpainting. The pixel math (insertSorted/solveEikonal/
// inpaintPixelImproved) is pure array arithmetic with no browser
// dependency, so it's copied verbatim, operating on a raw RGBA Buffer from
// sharp instead of a canvas ImageData. The only real behavioral change: the
// browser tool marks the "region to remove" from interactive brush-stroke
// rectangles; a CLI has no brush, so it takes a mask image instead (white
// pixels = remove, anything else = keep), and the "mark regions" step is
// generalized to read that mask per-pixel instead of testing a rectangle.
import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";
import { ToolOutcome } from "./types";

export interface WatermarkRemoveOptions {
  inputPath: string;
  maskPath: string;
  outPath: string;
}

function insertSorted(band: { x: number; y: number; dist: number }[], item: { x: number; y: number; dist: number }) {
  let low = 0,
    high = band.length;
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
  data: Buffer,
  w: number,
  h: number,
  px: number,
  py: number,
  flags: Uint8Array,
  dist: Float32Array,
  radius: number,
  KNOWN: number
): void {
  const idx = py * w + px;
  const d0 = dist[idx];

  let gradX = 0,
    gradY = 0;
  let gradCount = 0;

  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = px + dx,
        ny = py + dy;
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

  const gradMag = Math.sqrt(gradX * gradX + gradY * gradY) + 0.0001;
  const normGradX = gradX / gradMag;
  const normGradY = gradY / gradMag;

  let sumR = 0,
    sumG = 0,
    sumB = 0;
  let sumWeight = 0;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue;

      const nx = px + dx,
        ny = py + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;

      const nidx = ny * w + nx;
      if (flags[nidx] !== KNOWN) continue;

      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > radius) continue;

      const geomWeight = 1 / (distance * distance + 0.1);
      const levelWeight = 1 / (1 + Math.abs(dist[nidx] - d0) * 2);

      const dirX = dx / distance;
      const dirY = dy / distance;
      const dotProduct = Math.abs(dirX * -normGradY + dirY * normGradX);
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

// Generalized from the browser tool's rectangle-based version: `isInside(x,y)`
// replaces the selX/selY/selW/selH rectangle test so any mask shape works.
function teleaInpaintGeneralized(data: Buffer, w: number, h: number, isInside: (x: number, y: number) => boolean): void {
  const KNOWN = 0;
  const BAND = 1;
  const INSIDE = 2;

  const flags = new Uint8Array(w * h);
  const dist = new Float32Array(w * h);
  dist.fill(1e6);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (isInside(x, y)) {
        flags[idx] = INSIDE;
      } else {
        flags[idx] = KNOWN;
        dist[idx] = 0;
      }
    }
  }

  const band: { x: number; y: number; dist: number }[] = [];
  const neighbors = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (flags[idx] !== INSIDE) continue;
      let isBoundary = false;
      for (const [dx, dy] of neighbors) {
        const nx = x + dx,
          ny = y + dy;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h && flags[ny * w + nx] === KNOWN) {
          isBoundary = true;
          break;
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

  const radius = 8;

  while (band.length > 0) {
    const current = band.shift()!;
    const { x, y } = current;
    const idx = y * w + x;

    if (flags[idx] === KNOWN) continue;
    flags[idx] = KNOWN;

    inpaintPixelImproved(data, w, h, x, y, flags, dist, radius, KNOWN);

    for (const [dx, dy] of neighbors) {
      const nx = x + dx,
        ny = y + dy;
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

export async function removeWatermark(opts: WatermarkRemoveOptions): Promise<ToolOutcome> {
  try {
    if (!fs.existsSync(opts.inputPath)) return { ok: false, error: `Input file not found: ${opts.inputPath}` };
    if (!fs.existsSync(opts.maskPath)) return { ok: false, error: `Mask file not found: ${opts.maskPath}` };

    const { data: imgData, info } = await sharp(opts.inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { data: maskData, info: maskInfo } = await sharp(opts.maskPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    if (maskInfo.width !== info.width || maskInfo.height !== info.height) {
      return {
        ok: false,
        error: `Mask dimensions (${maskInfo.width}x${maskInfo.height}) must match the image (${info.width}x${info.height})`,
      };
    }

    const w = info.width;
    const h = info.height;
    const isInside = (x: number, y: number) => {
      const idx = (y * w + x) * 4;
      const brightness = (maskData[idx] + maskData[idx + 1] + maskData[idx + 2]) / 3;
      return brightness > 200; // white-ish = remove
    };

    teleaInpaintGeneralized(imgData, w, h, isInside);

    const outBuffer = await sharp(imgData, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
    fs.mkdirSync(path.dirname(path.resolve(opts.outPath)), { recursive: true });
    fs.writeFileSync(opts.outPath, outBuffer);

    return { ok: true, outputPath: opts.outPath, message: `Watermark removed -> ${opts.outPath}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
