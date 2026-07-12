#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { generateAppIcons } from "./core/appIcon";
import { resizeImage } from "./core/resize";
import { convertImage } from "./core/convert";
import { extractPalette } from "./core/palette";
import { generateQr } from "./core/qr";
import { qrTypes } from "./core/qrTypes";
import { removeWatermark } from "./core/watermark";
import { captureScreenshot } from "./core/screenshot";
import { convertAspectRatio } from "./core/aspectRatio";
import { detectText, replaceText } from "./core/textEditor";
import { generateTweetCard } from "./core/tweetCard";
import { generatePolaroid } from "./core/polaroid";
import { generateCarousel } from "./core/carousel";

const server = new McpServer({ name: "tsarr-tools", version: "0.1.0" });

function textResult(payload: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
}

server.tool(
  "generate_app_icons",
  "Generate an iOS/Android/Web/macOS app icon set as a ZIP from one source image.",
  {
    inputPath: z.string().describe("Path to the source image (square recommended)"),
    outPath: z.string().describe("Path to write the output .zip"),
    backgroundColor: z.string().optional().describe("Hex color to flatten transparency onto, default #ffffff"),
    padding: z.number().min(0).max(20).optional().describe("Padding inset percent, 0-20"),
    ios: z.boolean().optional(),
    android: z.boolean().optional(),
    web: z.boolean().optional(),
    macos: z.boolean().optional(),
  },
  async (args) => textResult(await generateAppIcons({
    inputPath: args.inputPath,
    outPath: args.outPath,
    backgroundColor: args.backgroundColor,
    padding: args.padding,
    platforms: { ios: args.ios, android: args.android, web: args.web, macos: args.macos },
  }))
);

server.tool(
  "resize_image",
  "Resize an image by exact dimensions or by percentage.",
  {
    inputPath: z.string(),
    outPath: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
    percentage: z.number().optional(),
    maintainAspectRatio: z.boolean().optional(),
    format: z.enum(["png", "jpeg", "webp", "avif", "gif", "tiff"]).optional(),
    quality: z.number().min(1).max(100).optional(),
  },
  // zod validates inputPath/outPath as required strings before this handler
  // ever runs, but the SDK's inferred callback-arg type widens every field to
  // optional — the `!` below reflects that runtime guarantee, not a bypass.
  async (args) => textResult(await resizeImage({
    inputPath: args.inputPath!,
    outPath: args.outPath!,
    width: args.width,
    height: args.height,
    percentage: args.percentage,
    maintainAspectRatio: args.maintainAspectRatio,
    format: args.format,
    quality: args.quality,
  }))
);

server.tool(
  "convert_image",
  "Convert an image to another format (png/jpeg/webp/avif/gif/tiff/ico).",
  {
    inputPath: z.string(),
    outPath: z.string(),
    format: z.enum(["png", "jpeg", "webp", "avif", "gif", "tiff", "ico"]),
    quality: z.number().min(1).max(100).optional(),
  },
  async (args) => textResult(await convertImage({
    inputPath: args.inputPath!,
    outPath: args.outPath!,
    format: args.format!,
    quality: args.quality,
  }))
);

server.tool(
  "extract_palette",
  "Extract a dominant color palette (2-12 colors) from an image via k-means clustering.",
  {
    inputPath: z.string(),
    outPath: z.string().optional().describe("Optional .json output path"),
    count: z.number().min(2).max(12).optional(),
  },
  async (args) => textResult(await extractPalette({
    inputPath: args.inputPath!,
    outPath: args.outPath,
    count: args.count,
  }))
);

server.tool(
  "generate_qr",
  `Generate a QR code PNG. Supported types: ${qrTypes.map((t) => t.id).join(", ")}. Provide the relevant fields for the chosen type (e.g. type=wifi needs ssid/password/encryption; type=link needs url).`,
  {
    type: z.enum(qrTypes.map((t) => t.id) as [string, ...string[]]),
    fields: z.record(z.string()).describe("Field values for the chosen QR type"),
    outPath: z.string(),
    size: z.number().optional(),
    fgColor: z.string().optional(),
    bgColor: z.string().optional(),
    errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
  },
  async (args) => textResult(await generateQr({
    type: args.type as any,
    fields: args.fields,
    outPath: args.outPath,
    size: args.size,
    fgColor: args.fgColor,
    bgColor: args.bgColor,
    errorCorrectionLevel: args.errorCorrectionLevel,
  }))
);

server.tool(
  "remove_watermark",
  "Remove a watermark/object from an image using Telea-style inpainting, guided by a mask image (white = remove, black = keep, same dimensions as the input).",
  {
    inputPath: z.string(),
    maskPath: z.string(),
    outPath: z.string(),
  },
  async (args) => textResult(await removeWatermark({
    inputPath: args.inputPath!,
    maskPath: args.maskPath!,
    outPath: args.outPath!,
  }))
);

server.tool(
  "capture_screenshot",
  "Capture a screenshot of a webpage at a device viewport (desktop/tablet/mobile) using headless Chrome.",
  {
    url: z.string().describe("Full URL, including scheme"),
    outPath: z.string(),
    device: z.enum(["desktop", "tablet", "mobile"]).optional(),
    fullPage: z.boolean().optional().describe("Capture the full scrollable page instead of just the viewport"),
    width: z.number().optional(),
    height: z.number().optional(),
  },
  async (args) => textResult(await captureScreenshot({
    url: args.url!,
    outPath: args.outPath!,
    device: args.device,
    fullPage: args.fullPage,
    width: args.width,
    height: args.height,
  }))
);

server.tool(
  "convert_aspect_ratio",
  "Convert an image to a target aspect ratio (or custom size) with contain/cover/fill/crop fitting and a solid/blurred/transparent background.",
  {
    inputPath: z.string(),
    outPath: z.string(),
    aspectRatio: z.number().optional().describe("width/height, e.g. 1 for 1:1, 1.78 for 16:9"),
    width: z.number().optional().describe("custom output width, overrides aspectRatio"),
    height: z.number().optional(),
    outputScale: z.number().optional(),
    fitMode: z.enum(["contain", "cover", "fill", "crop"]).optional(),
    backgroundType: z.enum(["solid", "blur", "transparent"]).optional(),
    backgroundColor: z.string().optional(),
    cropX: z.number().min(0).max(100).optional(),
    cropY: z.number().min(0).max(100).optional(),
    format: z.enum(["png", "jpeg", "webp", "avif"]).optional(),
    quality: z.number().min(1).max(100).optional(),
  },
  async (args) => textResult(await convertAspectRatio({
    inputPath: args.inputPath!,
    outPath: args.outPath!,
    aspectRatio: args.aspectRatio,
    width: args.width,
    height: args.height,
    outputScale: args.outputScale,
    fitMode: args.fitMode,
    backgroundType: args.backgroundType,
    backgroundColor: args.backgroundColor,
    cropPosition: args.cropX != null || args.cropY != null ? { x: args.cropX ?? 50, y: args.cropY ?? 50 } : undefined,
    format: args.format,
    quality: args.quality,
  }))
);

server.tool(
  "detect_text",
  "OCR-detect text regions in an image (step 1 of 2 for in-image text replacement). Writes a JSON file listing each region's text, position, and detected style.",
  {
    inputPath: z.string(),
    outPath: z.string().describe("Output .json path"),
  },
  async (args) => textResult(await detectText({ inputPath: args.inputPath!, outPath: args.outPath! }))
);

server.tool(
  "replace_text",
  'Replace detected text in an image (step 2 of 2). Reads the JSON from detect_text — edit the "newText" field of whichever regions should change, then call this.',
  {
    inputPath: z.string(),
    regionsPath: z.string().describe("Regions .json from detect_text, with newText fields edited"),
    outPath: z.string(),
  },
  async (args) => textResult(await replaceText({ inputPath: args.inputPath!, regionsPath: args.regionsPath!, outPath: args.outPath! }))
);

server.tool(
  "generate_tweet_card",
  "Generate a tweet-style social card image.",
  {
    outPath: z.string(),
    displayName: z.string(),
    username: z.string(),
    tweetText: z.string(),
    avatarPath: z.string().optional(),
    verified: z.boolean().optional(),
    theme: z.enum(["light", "dark", "dim"]).optional(),
    showMetrics: z.boolean().optional(),
    likes: z.string().optional(),
    retweets: z.string().optional(),
    replies: z.string().optional(),
    backgroundColor: z.string().optional(),
    cardWidth: z.number().optional(),
  },
  async (args) => textResult(await generateTweetCard({
    outPath: args.outPath!,
    displayName: args.displayName!,
    username: args.username!,
    tweetText: args.tweetText!,
    avatarPath: args.avatarPath,
    verified: args.verified,
    theme: args.theme,
    showMetrics: args.showMetrics,
    likes: args.likes,
    retweets: args.retweets,
    replies: args.replies,
    backgroundColor: args.backgroundColor,
    cardWidth: args.cardWidth,
  }))
);

server.tool(
  "generate_polaroid",
  "Frame an image as a vintage polaroid photo, with caption, filters, vignette, light leak, and grain.",
  {
    inputPath: z.string(),
    outPath: z.string(),
    caption: z.string().optional(),
    captionFont: z.string().optional().describe("Must be installed as a system font on the host"),
    captionSize: z.number().optional(),
    captionColor: z.string().optional(),
    frameColor: z.string().optional(),
    borderWidth: z.number().optional(),
    bottomBorderWidth: z.number().optional(),
    rotation: z.number().optional(),
    shadow: z.boolean().optional(),
    backgroundColor: z.string().optional(),
    brightness: z.number().optional(),
    contrast: z.number().optional(),
    saturation: z.number().optional(),
    hueRotate: z.number().optional(),
    blur: z.number().optional(),
    vignette: z.boolean().optional(),
    vignetteIntensity: z.number().optional(),
    lightLeak: z.enum(["none", "warm", "cool", "rainbow", "subtle", "orange", "blue", "pink", "vintage"]).optional(),
    grain: z.boolean().optional(),
    grainIntensity: z.number().optional(),
  },
  async (args) => textResult(await generatePolaroid({
    inputPath: args.inputPath!,
    outPath: args.outPath!,
    caption: args.caption,
    captionFont: args.captionFont,
    captionSize: args.captionSize,
    captionColor: args.captionColor,
    frameColor: args.frameColor,
    borderWidth: args.borderWidth,
    bottomBorderWidth: args.bottomBorderWidth,
    rotation: args.rotation,
    shadow: args.shadow,
    backgroundColor: args.backgroundColor,
    brightness: args.brightness,
    contrast: args.contrast,
    saturation: args.saturation,
    hueRotate: args.hueRotate,
    blur: args.blur,
    vignette: args.vignette,
    vignetteIntensity: args.vignetteIntensity,
    lightLeak: args.lightLeak,
    grain: args.grain,
    grainIntensity: args.grainIntensity,
  }))
);

server.tool(
  "generate_carousel",
  "Generate a multi-slide social carousel (text-only/image-top/image-bottom layouts) as one PNG per slide.",
  {
    slides: z
      .array(
        z.object({
          headline: z.string().optional(),
          subheadline: z.string().optional(),
          description: z.string().optional(),
          image: z.string().optional().describe("Path to an image file, for image-top/image-bottom layouts"),
          ctaText: z.string().optional(),
          showNumber: z.boolean().optional(),
          number: z.number().optional(),
        })
      )
      .min(1),
    outDir: z.string(),
    layout: z.enum(["text-only", "image-top", "image-bottom"]).optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    backgroundColor: z.string().optional(),
  },
  async (args) => textResult(await generateCarousel({
    slides: args.slides!,
    outDir: args.outDir!,
    layout: args.layout,
    width: args.width,
    height: args.height,
    backgroundColor: args.backgroundColor,
  }))
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server failed to start:", err);
  process.exit(1);
});
