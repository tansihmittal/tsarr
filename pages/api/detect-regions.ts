import type { NextApiRequest, NextApiResponse } from "next";

export interface DetectedRegion {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectRegionsResponse {
  regions?: DetectedRegion[];
  error?: string;
}

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

const PROMPT =
  'Analyze this image and identify all distinct objects, UI elements, faces, text areas, or regions that would make useful interactive hotspots for an image map. ' +
  'Return ONLY a valid JSON array, no markdown, no explanation. ' +
  'Format: [{"label": "string", "x": 0.0, "y": 0.0, "width": 0.0, "height": 0.0}]. ' +
  'All coordinates must be fractions between 0 and 1 relative to image dimensions. x,y is the top-left corner. ' +
  'Identify 5 to 15 regions sorted by visual importance. Return ONLY the JSON array, nothing else.';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DetectRegionsResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: "Missing imageBase64" });
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "REPLICATE_API_TOKEN not configured" });
  }

  // Use meta/llama-3.2-11b-vision-instruct — a proper vision model on Replicate
  // that accepts an `image` field as a data URI or URL.
  const createRes = await fetch(
    "https://api.replicate.com/v1/models/meta/llama-3.2-11b-vision-instruct/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        input: {
          image: imageBase64,
          prompt: PROMPT,
          max_tokens: 1024,
          temperature: 0.1,
        },
      }),
    }
  );

  if (!createRes.ok) {
    const err = await createRes.text();
    return res.status(502).json({ error: `Replicate error: ${err}` });
  }

  const prediction = await createRes.json();

  // `Prefer: wait` returns a completed prediction directly.
  // Fall back to polling if the model queues the job instead.
  let output = prediction.output;

  if (!output && prediction.urls?.get) {
    const pollUrl = prediction.urls.get;
    const deadline = Date.now() + 60_000; // vision models can take longer
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1500));
      const poll = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await poll.json();
      if (data.status === "succeeded") {
        output = data.output;
        break;
      }
      if (data.status === "failed" || data.status === "canceled") {
        return res.status(502).json({ error: "AI prediction failed" });
      }
    }
  }

  if (!output) {
    return res.status(504).json({ error: "Timed out waiting for AI response" });
  }

  // output is a string or array of strings
  const text = Array.isArray(output) ? output.join("") : String(output);

  try {
    // Strip any markdown code fences the model might add
    const clean = text.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
    const match = clean.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array in response");
    const regions: DetectedRegion[] = JSON.parse(match[0]);

    const valid = regions
      .filter(
        (r) =>
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

    return res.status(200).json({ regions: valid });
  } catch {
    return res.status(200).json({ error: "Could not parse AI response", regions: [] });
  }
}
