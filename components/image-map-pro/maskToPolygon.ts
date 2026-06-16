// Traces a binary mask image (from grounded-SAM) into a simplified polygon
// outline. Runs entirely in the browser via <canvas>. Output points are scaled
// to the target image-pixel space (bgWidth × bgHeight) used by the editor.

export interface Pt {
  x: number;
  y: number;
}

const TRACE_MAX = 600; // cap longest mask side for speed
const SIMPLIFY_TOL = 2.5; // Douglas–Peucker tolerance in mask pixels
const MAX_POINTS = 60; // hard cap on vertices
const MIN_AREA_FRAC = 0.004; // ignore blobs smaller than this fraction of image
const MAX_BLOBS = 8; // cap polygons returned per mask

// Decoded + thresholded mask, downscaled for tracing.
interface Binary {
  inside: Uint8Array;
  W: number;
  H: number;
}

async function decodeMask(maskDataUri: string): Promise<Binary | null> {
  const img = await loadImage(maskDataUri);
  const natW = img.naturalWidth || img.width;
  const natH = img.naturalHeight || img.height;
  if (!natW || !natH) return null;

  const scale = Math.min(1, TRACE_MAX / Math.max(natW, natH));
  const W = Math.max(1, Math.round(natW * scale));
  const H = Math.max(1, Math.round(natH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, W, H);
  const { data } = ctx.getImageData(0, 0, W, H);

  const inside = new Uint8Array(W * H);
  let insideCount = 0;
  for (let i = 0; i < W * H; i++) {
    const lum =
      0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    if (lum > 127) {
      inside[i] = 1;
      insideCount++;
    }
  }
  if (insideCount === 0) return null;
  // If most of the image is "white", the mask is likely inverted.
  if (insideCount > W * H * 0.6) {
    for (let i = 0; i < W * H; i++) inside[i] = inside[i] ? 0 : 1;
  }
  return { inside, W, H };
}

/**
 * Trace a mask into ONE polygon (largest white blob). Points in bg-pixel space.
 * Returns null if nothing traceable.
 */
export async function maskToPolygon(
  maskDataUri: string,
  bgWidth: number,
  bgHeight: number
): Promise<Pt[] | null> {
  const polys = await maskToPolygons(maskDataUri, bgWidth, bgHeight, 1);
  return polys.length ? polys[0] : null;
}

/**
 * Trace a mask into MULTIPLE polygons — one per significant white blob (each
 * detected instance becomes its own outline). Points in bg-pixel space.
 */
export async function maskToPolygons(
  maskDataUri: string,
  bgWidth: number,
  bgHeight: number,
  maxBlobs = MAX_BLOBS
): Promise<Pt[][]> {
  const bin = await decodeMask(maskDataUri);
  if (!bin) return [];
  const { inside, W, H } = bin;

  const minArea = Math.max(8, Math.floor(W * H * MIN_AREA_FRAC));
  const blobs = components(inside, W, H, minArea).slice(0, maxBlobs);

  const out: Pt[][] = [];
  for (const blob of blobs) {
    const contour = mooreTrace(blob, W, H);
    if (contour.length < 3) continue;
    const simp = douglasPeucker(contour, SIMPLIFY_TOL);
    const pts = (simp.length > MAX_POINTS ? evenlySample(simp, MAX_POINTS) : simp).map(
      (p) => ({ x: (p.x / W) * bgWidth, y: (p.y / H) * bgHeight })
    );
    if (pts.length >= 3) out.push(pts);
  }
  return out;
}

/**
 * Bounding box of all white pixels in a mask, in bg-pixel space. Used to derive
 * a rect/ellipse from an open-vocab SAM mask. Null if mask is empty.
 */
export async function maskToBBox(
  maskDataUri: string,
  bgWidth: number,
  bgHeight: number
): Promise<{ x: number; y: number; width: number; height: number } | null> {
  const bin = await decodeMask(maskDataUri);
  if (!bin) return null;
  const { inside, W, H } = bin;
  let minX = W,
    minY = H,
    maxX = -1,
    maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (inside[y * W + x]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return {
    x: (minX / W) * bgWidth,
    y: (minY / H) * bgHeight,
    width: ((maxX - minX + 1) / W) * bgWidth,
    height: ((maxY - minY + 1) / H) * bgHeight,
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Label 4-connected white components and return a per-component binary mask for
 * each blob whose area ≥ minArea, sorted largest-first.
 */
function components(
  inside: Uint8Array,
  W: number,
  H: number,
  minArea: number
): Uint8Array[] {
  const labels = new Int32Array(W * H).fill(0);
  const sizes: number[] = [0]; // index 0 unused (label starts at 1)
  let label = 0;
  const stack: number[] = [];

  const push = (q: number) => {
    if (inside[q] && !labels[q]) {
      labels[q] = label;
      stack.push(q);
    }
  };

  for (let s = 0; s < W * H; s++) {
    if (!inside[s] || labels[s]) continue;
    label++;
    let size = 0;
    stack.length = 0;
    stack.push(s);
    labels[s] = label;
    while (stack.length) {
      const p = stack.pop()!;
      size++;
      const x = p % W,
        y = (p / W) | 0;
      if (x > 0) push(p - 1);
      if (x < W - 1) push(p + 1);
      if (y > 0) push(p - W);
      if (y < H - 1) push(p + W);
    }
    sizes[label] = size;
  }

  // Labels above the area threshold, sorted by area descending.
  const kept = [];
  for (let l = 1; l <= label; l++) {
    if (sizes[l] >= minArea) kept.push(l);
  }
  kept.sort((a, b) => sizes[b] - sizes[a]);

  return kept.map((l) => {
    const out = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) out[i] = labels[i] === l ? 1 : 0;
    return out;
  });
}

// Moore-neighbor boundary tracing (clockwise) with first-return stop.
const DIRS = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
];

function mooreTrace(inside: Uint8Array, W: number, H: number): Pt[] {
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= W || y >= H ? 0 : inside[y * W + x];

  // Find start: first foreground pixel in raster scan.
  let sx = -1,
    sy = -1;
  for (let y = 0; y < H && sy < 0; y++) {
    for (let x = 0; x < W; x++) {
      if (inside[y * W + x]) {
        sx = x;
        sy = y;
        break;
      }
    }
  }
  if (sx < 0) return [];

  const pts: Pt[] = [{ x: sx, y: sy }];
  let cx = sx,
    cy = sy;
  let px = sx - 1,
    py = sy; // backtrack pixel (background to the west)
  const maxIter = W * H * 4;

  for (let iter = 0; iter < maxIter; iter++) {
    // direction index from current → backtrack
    let d = 0;
    for (let k = 0; k < 8; k++) {
      if (cx + DIRS[k][0] === px && cy + DIRS[k][1] === py) {
        d = k;
        break;
      }
    }
    // scan clockwise from just past the backtrack
    let found = -1;
    let prevX = px,
      prevY = py;
    for (let s = 1; s <= 8; s++) {
      const k = (d + s) % 8;
      const nx = cx + DIRS[k][0],
        ny = cy + DIRS[k][1];
      if (at(nx, ny)) {
        found = k;
        break;
      }
      prevX = nx;
      prevY = ny;
    }
    if (found < 0) break; // isolated pixel
    px = prevX;
    py = prevY;
    cx = cx + DIRS[found][0];
    cy = cy + DIRS[found][1];
    if (cx === sx && cy === sy) break; // returned to start
    pts.push({ x: cx, y: cy });
    if (pts.length > W * H) break;
  }
  return pts;
}

// Ramer–Douglas–Peucker polyline simplification.
function douglasPeucker(pts: Pt[], tol: number): Pt[] {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];

  while (stack.length) {
    const [a, b] = stack.pop()!;
    let maxD = 0,
      idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = perpDist(pts[i], pts[a], pts[b]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > tol && idx > 0) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

function perpDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  return Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / len;
}

/** Reduce a point list to `n` roughly evenly-spaced vertices. */
function evenlySample(pts: Pt[], n: number): Pt[] {
  if (pts.length <= n) return pts;
  const out: Pt[] = [];
  const step = pts.length / n;
  for (let i = 0; i < n; i++) out.push(pts[Math.floor(i * step)]);
  return out;
}
