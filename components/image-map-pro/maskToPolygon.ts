// Traces a binary mask image (from SAM3) into simplified polygon outlines.
// Image decode (canvas) runs on the main thread; all CPU-heavy work
// (threshold, connected components, Moore trace, Douglas-Peucker) runs in a
// Web Worker to keep the UI responsive during multi-mask AI detection.

export interface Pt {
  x: number;
  y: number;
}

const TRACE_MAX = 600;

// ── Worker pool (single persistent worker) ───────────────────────────────────

let _worker: Worker | null = null;
let _workerReady = false;
type PendingResolve = (value: any) => void;
type PendingReject = (reason?: any) => void;
const _pending = new Map<number, { resolve: PendingResolve; reject: PendingReject }>();
let _nextId = 1;

function getWorker(): Worker {
  if (_worker && _workerReady) return _worker;

  _worker = new Worker("/workers/mask-trace.worker.js");
  _workerReady = true;

  _worker.onmessage = (e) => {
    const { id, result, error } = e.data;
    const p = _pending.get(id);
    if (!p) return;
    _pending.delete(id);
    if (error) p.reject(new Error(error));
    else p.resolve(result);
  };

  _worker.onerror = (e) => {
    _pending.forEach((p) => p.reject(new Error(e.message)));
    _pending.clear();
    _worker = null;
    _workerReady = false;
  };

  return _worker;
}

function postToWorker(msg: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = _nextId++;
    _pending.set(id, { resolve, reject });
    try {
      getWorker().postMessage({ ...msg, id });
    } catch (err) {
      _pending.delete(id);
      reject(err);
    }
  });
}

// ── Canvas decode (main thread, needs DOM) ───────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function decodeToPixels(
  maskDataUri: string
): Promise<{ pixels: Uint8ClampedArray; W: number; H: number } | null> {
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
  return { pixels: data, W, H };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Trace a mask into ONE polygon (largest white blob). Points in bg-pixel space.
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
 * Trace a mask into MULTIPLE polygons — one per significant white blob.
 * Points in bg-pixel space.
 */
export async function maskToPolygons(
  maskDataUri: string,
  bgWidth: number,
  bgHeight: number,
  maxBlobs?: number
): Promise<Pt[][]> {
  const decoded = await decodeToPixels(maskDataUri);
  if (!decoded) return [];
  const { pixels, W, H } = decoded;
  return postToWorker({ type: "polygons", pixels, W, H, bgWidth, bgHeight, maxBlobs });
}

/**
 * Bounding box of all white pixels in a mask, in bg-pixel space.
 */
export async function maskToBBox(
  maskDataUri: string,
  bgWidth: number,
  bgHeight: number
): Promise<{ x: number; y: number; width: number; height: number } | null> {
  const decoded = await decodeToPixels(maskDataUri);
  if (!decoded) return null;
  const { pixels, W, H } = decoded;
  return postToWorker({ type: "bbox", pixels, W, H, bgWidth, bgHeight });
}
