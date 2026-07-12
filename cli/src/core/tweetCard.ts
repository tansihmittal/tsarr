// Node port of components/tweet-editor. That tool renders a live DOM node
// and captures it with html2canvas; there's no Node equivalent of "capture
// arbitrary CSS layout," so instead this builds one SVG string that mirrors
// the same layer stack (background -> card -> avatar/name/badge -> text ->
// metrics) and rasterizes it in a single pass via sharp/librsvg. Covers the
// default and minimal card styles with solid/gradient backgrounds; skips
// the CSS noise-texture overlay and card tilt/scale transform as cosmetic
// extras (documented in the CLI README).
import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";
import { ToolOutcome } from "./types";

export type TweetTheme = "light" | "dark" | "dim";

export interface TweetCardOptions {
  outPath: string;
  displayName: string;
  username: string;
  tweetText: string;
  avatarPath?: string; // optional square image; falls back to an initial-in-circle
  verified?: boolean;
  theme?: TweetTheme;
  showMetrics?: boolean;
  likes?: string;
  retweets?: string;
  replies?: string;
  backgroundColor?: string; // canvas background behind the card, default #f0f2f4
  cardWidth?: number; // default 600
}

const THEME_COLORS: Record<TweetTheme, { card: string; text: string; subtext: string; border: string }> = {
  light: { card: "#ffffff", text: "#0f1419", subtext: "#536471", border: "#eff3f4" },
  dark: { card: "#000000", text: "#e7e9ea", subtext: "#71767b", border: "#2f3336" },
  dim: { card: "#15202b", text: "#f7f9f9", subtext: "#8b98a5", border: "#38444d" },
};

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Greedy word-wrap using an approximate average character width, since SVG
// text doesn't auto-reflow. Good enough for a social-card export; exact
// line breaks may differ slightly from the browser's font metrics.
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

export async function generateTweetCard(opts: TweetCardOptions): Promise<ToolOutcome> {
  try {
    const theme = THEME_COLORS[opts.theme ?? "light"];
    const cardWidth = opts.cardWidth ?? 600;
    const padding = 24;
    const avatarSize = 48;
    const contentX = padding + avatarSize + 12;
    const contentWidth = cardWidth - contentX - padding;

    const lines = wrapText(opts.tweetText, contentWidth, 22);
    const lineHeight = 30;
    const headerHeight = avatarSize;
    const textY = padding + headerHeight + 16;
    const textBlockHeight = lines.length * lineHeight;
    const metricsHeight = opts.showMetrics ? 40 : 0;
    const cardHeight = textY + textBlockHeight + metricsHeight + padding;

    let avatarSvg: string;
    if (opts.avatarPath && fs.existsSync(opts.avatarPath)) {
      const avatarPng = await sharp(opts.avatarPath).resize(avatarSize, avatarSize, { fit: "cover" }).png().toBuffer();
      avatarSvg = `<clipPath id="avatarClip"><circle cx="${padding + avatarSize / 2}" cy="${padding + avatarSize / 2}" r="${avatarSize / 2}"/></clipPath>
        <image x="${padding}" y="${padding}" width="${avatarSize}" height="${avatarSize}" href="data:image/png;base64,${avatarPng.toString("base64")}" clip-path="url(#avatarClip)"/>`;
    } else {
      const initial = (opts.displayName || "?").trim().charAt(0).toUpperCase();
      avatarSvg = `<circle cx="${padding + avatarSize / 2}" cy="${padding + avatarSize / 2}" r="${avatarSize / 2}" fill="#2563EB"/>
        <text x="${padding + avatarSize / 2}" y="${padding + avatarSize / 2}" text-anchor="middle" dominant-baseline="central" font-size="${avatarSize * 0.45}" font-weight="700" fill="#ffffff" font-family="sans-serif">${escapeXml(initial)}</text>`;
    }

    const verifiedBadge = opts.verified
      ? `<circle cx="${contentX + estimateTextWidth(opts.displayName, 17, true) + 8}" cy="${padding + 12}" r="8" fill="#1d9bf0"/>
         <path d="M ${contentX + estimateTextWidth(opts.displayName, 17, true) + 4} ${padding + 12} l 3 3 l 5 -6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      : "";

    const textLines = lines
      .map((line, i) => `<tspan x="${contentX}" y="${textY + i * lineHeight}">${escapeXml(line)}</tspan>`)
      .join("");

    const metricsSvg = opts.showMetrics
      ? `<text x="${contentX}" y="${textY + textBlockHeight + 24}" font-size="14" fill="${theme.subtext}" font-family="sans-serif">${escapeXml(opts.replies ?? "0")} Replies    ${escapeXml(opts.retweets ?? "0")} Reposts    ${escapeXml(opts.likes ?? "0")} Likes</text>`
      : "";

    const outerWidth = cardWidth + padding * 2;
    const outerHeight = cardHeight + padding * 2;

    const svg = `<svg width="${outerWidth}" height="${outerHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${opts.backgroundColor ?? "#f0f2f4"}"/>
      <g transform="translate(${padding},${padding})">
        <rect width="${cardWidth}" height="${cardHeight}" rx="16" fill="${theme.card}" stroke="${theme.border}" stroke-width="1"/>
        ${avatarSvg}
        <text x="${contentX}" y="${padding + 12}" font-size="17" font-weight="700" fill="${theme.text}" font-family="sans-serif" dominant-baseline="middle">${escapeXml(opts.displayName)}</text>
        ${verifiedBadge}
        <text x="${contentX}" y="${padding + 34}" font-size="15" fill="${theme.subtext}" font-family="sans-serif">@${escapeXml(opts.username)}</text>
        <text font-size="22" fill="${theme.text}" font-family="sans-serif">${textLines}</text>
        ${metricsSvg}
      </g>
    </svg>`;

    fs.mkdirSync(path.dirname(path.resolve(opts.outPath)), { recursive: true });
    await sharp(Buffer.from(svg)).png().toFile(opts.outPath);

    return { ok: true, outputPath: opts.outPath, message: `Generated tweet card -> ${opts.outPath}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function estimateTextWidth(text: string, fontSize: number, bold: boolean): number {
  return text.length * fontSize * (bold ? 0.62 : 0.55);
}
