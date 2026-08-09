// Node port of components/carousel-editor — another html2canvas-based DOM
// capture tool, rebuilt here as one SVG per slide. Scoped to the
// text-only/image-top/image-bottom layouts (documented in the CLI README);
// the "app-showcase" layout (pill, app icon, giant faded slide number,
// screenshot composition) is a materially bigger, more special-cased layout
// and is deferred rather than rushed.
import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";
import { ToolOutcome } from "./types";

export type SlideLayout = "text-only" | "image-top" | "image-bottom";

export interface CarouselSlide {
  headline?: string;
  subheadline?: string;
  description?: string;
  image?: string; // path to an image file, required for image-top/image-bottom
  ctaText?: string;
  showNumber?: boolean;
  number?: number;
}

export interface CarouselOptions {
  slides: CarouselSlide[];
  outDir: string;
  layout?: SlideLayout; // default text-only
  width?: number; // default 1080
  height?: number; // default 1350 (4:5, a common carousel ratio)
  backgroundColor?: string; // default #ffffff
  padding?: number; // default 48
  borderRadius?: number; // default 24
  headlineColor?: string; // default #0A0A0A
  headlineSize?: number; // default 48
  subheadlineColor?: string; // default #4B5563
  subheadlineSize?: number; // default 24
  descriptionColor?: string; // default #6B7280
  descriptionSize?: number; // default 18
  textAlign?: "left" | "center"; // default left
  ctaColor?: string; // default #2563EB
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const avgCharWidth = fontSize * 0.55;
  const maxChars = Math.max(4, Math.floor(maxWidth / avgCharWidth));
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(" ")) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > maxChars && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

async function renderSlide(slide: CarouselSlide, opts: CarouselOptions): Promise<Buffer> {
  const width = opts.width ?? 1080;
  const height = opts.height ?? 1350;
  const padding = opts.padding ?? 48;
  const layout = opts.layout ?? "text-only";
  const textAlign = opts.textAlign ?? "left";
  const anchor = textAlign === "center" ? "middle" : "start";
  const textX = textAlign === "center" ? width / 2 : padding;
  const textWidth = width - padding * 2;

  let imageBuffer: Buffer | null = null;
  let imageHeight = 0;
  if ((layout === "image-top" || layout === "image-bottom") && slide.image && fs.existsSync(slide.image)) {
    imageHeight = Math.round(height * 0.45);
    imageBuffer = await sharp(slide.image)
      .resize(width - padding * 2, imageHeight, { fit: "cover" })
      .png()
      .toBuffer();
  }

  let cursorY = layout === "image-top" && imageBuffer ? padding + imageHeight + 32 : padding + 8;

  const headlineSize = opts.headlineSize ?? 48;
  const headlineLines = slide.headline ? wrapText(slide.headline, textWidth, headlineSize) : [];
  const headlineSvg = headlineLines
    .map((line, i) => `<tspan x="${textX}" y="${cursorY + headlineSize + i * headlineSize * 1.15}">${escapeXml(line)}</tspan>`)
    .join("");
  const headlineBlockHeight = headlineLines.length * headlineSize * 1.15;
  const headlineY = cursorY;
  cursorY += headlineLines.length ? headlineBlockHeight + 16 : 0;

  const subSize = opts.subheadlineSize ?? 24;
  const subLines = slide.subheadline ? wrapText(slide.subheadline, textWidth, subSize) : [];
  const subSvg = subLines
    .map((line, i) => `<tspan x="${textX}" y="${cursorY + subSize + i * subSize * 1.3}">${escapeXml(line)}</tspan>`)
    .join("");
  const subBlockHeight = subLines.length * subSize * 1.3;
  const subY = cursorY;
  cursorY += subLines.length ? subBlockHeight + 20 : 0;

  const descSize = opts.descriptionSize ?? 18;
  const descLines = slide.description ? wrapText(slide.description, textWidth, descSize) : [];
  const descSvg = descLines
    .map((line, i) => `<tspan x="${textX}" y="${cursorY + descSize + i * descSize * 1.4}">${escapeXml(line)}</tspan>`)
    .join("");
  const descBlockHeight = descLines.length * descSize * 1.4;
  const descY = cursorY;
  cursorY += descLines.length ? descBlockHeight + 24 : 0;

  const ctaSvg = slide.ctaText
    ? `<rect x="${textAlign === "center" ? width / 2 - 90 : padding}" y="${cursorY}" width="180" height="52" rx="26" fill="${opts.ctaColor ?? "#2563EB"}"/>
       <text x="${textAlign === "center" ? width / 2 : padding + 90}" y="${cursorY + 33}" text-anchor="middle" font-size="16" font-weight="700" fill="#ffffff" font-family="sans-serif">${escapeXml(slide.ctaText)}</text>`
    : "";

  const numberBadge = slide.showNumber && slide.number != null
    ? `<circle cx="${width - padding - 24}" cy="${padding + 24}" r="24" fill="rgba(0,0,0,0.6)"/>
       <text x="${width - padding - 24}" y="${padding + 30}" text-anchor="middle" font-size="20" font-weight="700" fill="#ffffff" font-family="sans-serif">${slide.number}</text>`
    : "";

  const imageY = layout === "image-bottom" ? height - padding - imageHeight : padding;
  const imageSvg =
    imageBuffer && layout === "image-top"
      ? `<image x="${padding}" y="${padding}" width="${width - padding * 2}" height="${imageHeight}" href="data:image/png;base64,${imageBuffer.toString("base64")}"/>`
      : imageBuffer && layout === "image-bottom"
      ? `<image x="${padding}" y="${imageY}" width="${width - padding * 2}" height="${imageHeight}" href="data:image/png;base64,${imageBuffer.toString("base64")}"/>`
      : "";

  const borderRadius = opts.borderRadius ?? 24;
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="cardClip"><rect width="${width}" height="${height}" rx="${borderRadius}"/></clipPath>
    </defs>
    <g clip-path="url(#cardClip)">
      <rect width="100%" height="100%" fill="${opts.backgroundColor ?? "#ffffff"}"/>
      ${layout === "image-top" ? imageSvg : ""}
      <text font-family="sans-serif" font-weight="800" fill="${opts.headlineColor ?? "#0A0A0A"}" font-size="${headlineSize}">${headlineSvg}</text>
      <text font-family="sans-serif" font-weight="500" fill="${opts.subheadlineColor ?? "#4B5563"}" font-size="${subSize}">${subSvg}</text>
      <text font-family="sans-serif" fill="${opts.descriptionColor ?? "#6B7280"}" font-size="${descSize}">${descSvg}</text>
      ${ctaSvg}
      ${layout === "image-bottom" ? imageSvg : ""}
      ${numberBadge}
    </g>
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function generateCarousel(opts: CarouselOptions): Promise<ToolOutcome> {
  try {
    if (!opts.slides || opts.slides.length === 0) {
      return { ok: false, error: "Provide at least one slide" };
    }
    fs.mkdirSync(path.resolve(opts.outDir), { recursive: true });

    const written: string[] = [];
    for (let i = 0; i < opts.slides.length; i++) {
      const buffer = await renderSlide(opts.slides[i], opts);
      const filePath = path.join(opts.outDir, `slide-${i + 1}.png`);
      fs.writeFileSync(filePath, buffer);
      written.push(filePath);
    }

    return { ok: true, outputPath: opts.outDir, message: `Generated ${written.length} slide(s) -> ${opts.outDir}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
