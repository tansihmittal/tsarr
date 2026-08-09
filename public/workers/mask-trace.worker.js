// Web Worker: decodes a mask data URI and traces it into polygons/bbox.
// All CPU-heavy work (pixel threshold, connected components, Moore trace,
// Douglas-Peucker) runs off the main thread.

const TRACE_MAX = 600;
const SIMPLIFY_TOL = 2.5;
const MAX_POINTS = 60;
const MIN_AREA_FRAC = 0.004;
const MAX_BLOBS = 8;

// ── pixel helpers ────────────────────────────────────────────────────────────

function threshold(data, W, H) {
  const inside = new Uint8Array(W * H);
  let insideCount = 0;
  for (let i = 0; i < W * H; i++) {
    const lum = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    if (lum > 127) { inside[i] = 1; insideCount++; }
  }
  if (insideCount === 0) return null;
  if (insideCount > W * H * 0.6) {
    for (let i = 0; i < W * H; i++) inside[i] = inside[i] ? 0 : 1;
  }
  return inside;
}

function components(inside, W, H, minArea) {
  const labels = new Int32Array(W * H).fill(0);
  const sizes = [0];
  let label = 0;
  const stack = [];

  const push = (q) => { if (inside[q] && !labels[q]) { labels[q] = label; stack.push(q); } };

  for (let s = 0; s < W * H; s++) {
    if (!inside[s] || labels[s]) continue;
    label++;
    let size = 0;
    stack.length = 0;
    stack.push(s);
    labels[s] = label;
    while (stack.length) {
      const p = stack.pop();
      size++;
      const x = p % W, y = (p / W) | 0;
      if (x > 0) push(p - 1);
      if (x < W - 1) push(p + 1);
      if (y > 0) push(p - W);
      if (y < H - 1) push(p + W);
    }
    sizes[label] = size;
  }

  const kept = [];
  for (let l = 1; l <= label; l++) { if (sizes[l] >= minArea) kept.push(l); }
  kept.sort((a, b) => sizes[b] - sizes[a]);
  return kept.map((l) => {
    const out = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) out[i] = labels[i] === l ? 1 : 0;
    return out;
  });
}

const DIRS = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];

function mooreTrace(inside, W, H) {
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : inside[y * W + x];
  let sx = -1, sy = -1;
  for (let y = 0; y < H && sy < 0; y++) {
    for (let x = 0; x < W; x++) { if (inside[y * W + x]) { sx = x; sy = y; break; } }
  }
  if (sx < 0) return [];
  const pts = [{ x: sx, y: sy }];
  let cx = sx, cy = sy, px = sx - 1, py = sy;
  const maxIter = W * H * 4;
  for (let iter = 0; iter < maxIter; iter++) {
    let d = 0;
    for (let k = 0; k < 8; k++) {
      if (cx + DIRS[k][0] === px && cy + DIRS[k][1] === py) { d = k; break; }
    }
    let found = -1, prevX = px, prevY = py;
    for (let s = 1; s <= 8; s++) {
      const k = (d + s) % 8;
      const nx = cx + DIRS[k][0], ny = cy + DIRS[k][1];
      if (at(nx, ny)) { found = k; break; }
      prevX = nx; prevY = ny;
    }
    if (found < 0) break;
    px = prevX; py = prevY;
    cx = cx + DIRS[found][0]; cy = cy + DIRS[found][1];
    if (cx === sx && cy === sy) break;
    pts.push({ x: cx, y: cy });
    if (pts.length > W * H) break;
  }
  return pts;
}

function perpDist(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  return Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / len;
}

function douglasPeucker(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = 1; keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let maxD = 0, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = perpDist(pts[i], pts[a], pts[b]);
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > tol && idx > 0) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

function evenlySample(pts, n) {
  if (pts.length <= n) return pts;
  const out = [];
  const step = pts.length / n;
  for (let i = 0; i < n; i++) out.push(pts[Math.floor(i * step)]);
  return out;
}

// ── message handler ──────────────────────────────────────────────────────────

self.onmessage = function (e) {
  const { id, type, pixels, W, H, bgWidth, bgHeight, maxBlobs } = e.data;

  try {
    const inside = threshold(pixels, W, H);
    if (!inside) { self.postMessage({ id, result: [] }); return; }

    if (type === "bbox") {
      let minX = W, minY = H, maxX = -1, maxY = -1;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (inside[y * W + x]) {
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < 0) { self.postMessage({ id, result: null }); return; }
      self.postMessage({ id, result: {
        x: (minX / W) * bgWidth,
        y: (minY / H) * bgHeight,
        width: ((maxX - minX + 1) / W) * bgWidth,
        height: ((maxY - minY + 1) / H) * bgHeight,
      }});
      return;
    }

    // type === "polygons"
    const limit = maxBlobs ?? MAX_BLOBS;
    const minArea = Math.max(8, Math.floor(W * H * MIN_AREA_FRAC));
    const blobs = components(inside, W, H, minArea).slice(0, limit);

    const out = [];
    for (const blob of blobs) {
      const contour = mooreTrace(blob, W, H);
      if (contour.length < 3) continue;
      const simp = douglasPeucker(contour, SIMPLIFY_TOL);
      const pts = (simp.length > MAX_POINTS ? evenlySample(simp, MAX_POINTS) : simp)
        .map((p) => ({ x: (p.x / W) * bgWidth, y: (p.y / H) * bgHeight }));
      if (pts.length >= 3) out.push(pts);
    }
    self.postMessage({ id, result: out });
  } catch (err) {
    self.postMessage({ id, error: err.message });
  }
};
