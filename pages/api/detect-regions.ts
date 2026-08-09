import type { NextApiRequest, NextApiResponse } from "next";
import { isRateLimited } from "@/lib/rateLimit";

// Two server-side modes for AI Detect:
//   • "enumerate" → GPT-4o-mini VLM lists & boxes all distinct parts/objects in
//     a novel image (e.g. label every component on a circuit board). This is the
//     open-vocab *labeling* path that neither YOLO (80 classes) nor SAM3
//     (segments a thing you name) can do alone.
//   • "segment"   → SAM3 turns a text prompt into a binary mask, which the
//     client traces into a polygon outline (or a bounding box).
// Fast common-object detection happens entirely in-browser (utils/yoloDetection).

export interface LabeledBox {
  label: string;
  x: number; // all fractions 0–1, x,y = top-left
  y: number;
  width: number;
  height: number;
}

export interface SegmentedMask {
  label: string;
  maskBase64: string; // black-and-white mask data URI (white = subject)
}

interface DetectResponse {
  boxes?: LabeledBox[];
  masks?: SegmentedMask[];
  error?: string;
}

export const config = {
  api: { bodyParser: { sizeLimit: "20mb" } },
};

// mattsays/sam3-image — prompt-based segmentation.
const SAM3_VERSION =
  "d73db077226443ba4fafd34e233b3626b552eac2a433f90c7c32a9ac89bd9e72";

// ─── Replicate helpers ───────────────────────────────────────────────────────

async function pollPrediction(
  prediction: any,
  token: string,
  timeoutMs: number
): Promise<unknown> {
  let output = prediction.output;
  if (!output && prediction.urls?.get) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1500));
      const poll = await fetch(prediction.urls.get, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await poll.json();
      if (data.status === "succeeded") { output = data.output; break; }
      if (data.status === "failed" || data.status === "canceled") {
        throw new Error("Prediction failed");
      }
    }
  }
  if (!output) throw new Error("Timed out waiting for AI");
  return output;
}

// ─── Enumerate: GPT-4o-mini → labeled boxes ──────────────────────────────────

function enumeratePrompt(instruction?: string): string {
  const inst = instruction?.trim();
  const focus =
    inst && inst.length > 0
      ? `The user said: "${inst}". Identify and label the distinct regions they mean. `
      : "";
  return (
    "Analyze this image and identify all distinct, meaningful regions to turn into labeled hotspots. " +
    focus +
    "If it is a device, circuit board, diagram, product, map, or UI, label each visible COMPONENT or PART " +
    "(e.g. ports, connectors, chips, headers, buttons, sections). Otherwise label each distinct object. " +
    "Return ONLY a valid JSON array, no markdown, no explanation. " +
    'Format: [{"label":"string","x":0.0,"y":0.0,"width":0.0,"height":0.0}]. ' +
    "All coordinates are fractions (0–1) of image dimensions; x,y is the top-left corner. " +
    "Each box must tightly enclose its part. Short descriptive label per region. " +
    "Up to 15 regions, most important first. Return ONLY the JSON array."
  );
}

async function enumerateBoxes(
  imageBase64: string,
  instruction: string | undefined,
  token: string
): Promise<LabeledBox[]> {
  const res = await fetch(
    "https://api.replicate.com/v1/models/openai/gpt-4o-mini/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        input: {
          prompt: enumeratePrompt(instruction),
          image_input: [imageBase64],
          max_completion_tokens: 1024,
          temperature: 0.2,
        },
      }),
    }
  );
  if (!res.ok) throw new Error(`Replicate error: ${await res.text()}`);
  const out = await pollPrediction(await res.json(), token, 60_000);
  const text = Array.isArray(out) ? out.join("") : String(out);
  const clean = text.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
  const match = clean.match(/\[[\s\S]*\]/);
  if (!match) return [];
  let raw: any[];
  try {
    raw = JSON.parse(match[0]);
  } catch {
    return [];
  }
  return raw
    .filter(
      (r) =>
        r &&
        typeof r.label === "string" &&
        typeof r.x === "number" &&
        typeof r.y === "number" &&
        typeof r.width === "number" &&
        typeof r.height === "number"
    )
    .map((r) => ({
      label: r.label,
      x: Math.min(Math.max(r.x, 0), 1),
      y: Math.min(Math.max(r.y, 0), 1),
      width: Math.min(Math.max(r.width, 0.01), 1),
      height: Math.min(Math.max(r.height, 0.01), 1),
    }));
}

// ─── Segment: SAM3 → binary mask ──────────────────────────────────────────────

async function sam3Mask(
  imageBase64: string,
  prompt: string,
  token: string
): Promise<string | null> {
  try {
    const res = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        version: SAM3_VERSION,
        input: {
          image: imageBase64,
          prompt,
          mask_only: true,
          return_zip: false,
          threshold: 0.5,
        },
      }),
    });
    if (!res.ok) return null;
    const out = await pollPrediction(await res.json(), token, 90_000);
    const url = typeof out === "string" ? out : Array.isArray(out) ? out[0] : null;
    if (!url) return null;
    const img = await fetch(url);
    if (!img.ok) return null;
    const buf = await img.arrayBuffer();
    const mime = img.headers.get("content-type") || "image/png";
    return `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DetectResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  // Every call here is billed (Replicate: GPT-4o-mini + SAM3) — keep the
  // ceiling tight since there's no per-user auth/quota in front of it.
  if (isRateLimited(req, res, { limit: 10, windowMs: 60_000, keyPrefix: "detect-regions" })) {
    return;
  }

  const { imageBase64, prompts, instruction, mode } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: "Missing imageBase64" });
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "REPLICATE_API_TOKEN not configured" });
  }

  try {
    // ── ENUMERATE: VLM labeled boxes ──────────────────────────────────────
    if (mode === "enumerate") {
      const boxes = await enumerateBoxes(
        imageBase64,
        typeof instruction === "string" ? instruction.slice(0, 300) : undefined,
        token
      );
      return res.status(200).json({ boxes });
    }

    // ── SEGMENT (default): SAM3 masks per prompt ──────────────────────────
    const list: string[] = Array.isArray(prompts)
      ? prompts
      : typeof prompts === "string" && prompts.trim()
      ? [prompts]
      : [];
    const clean = Array.from(
      new Set(list.map((p) => String(p).trim().slice(0, 100)).filter(Boolean))
    ).slice(0, 8);

    if (clean.length === 0) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    const results = await Promise.all(
      clean.map(async (p) => {
        const mask = await sam3Mask(imageBase64, p, token);
        return mask ? { label: p, maskBase64: mask } : null;
      })
    );
    const masks = results.filter((m): m is SegmentedMask => m !== null);
    if (masks.length === 0) {
      return res
        .status(200)
        .json({ error: "Nothing could be segmented", masks: [] });
    }
    return res.status(200).json({ masks });
  } catch (err: unknown) {
    return res
      .status(502)
      .json({ error: (err as Error).message || "AI detection failed" });
  }
}
