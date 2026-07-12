#!/usr/bin/env node
import { Command } from "commander";
import { generateAppIcons } from "./core/appIcon";
import { resizeImage, ImageFormat } from "./core/resize";
import { convertImage, ConvertFormat } from "./core/convert";
import { extractPalette } from "./core/palette";
import { generateQr } from "./core/qr";
import { qrTypes } from "./core/qrTypes";
import { removeWatermark } from "./core/watermark";
import { captureScreenshot, DeviceProfileId } from "./core/screenshot";
import { convertAspectRatio, FitMode, BackgroundType as ARBackgroundType, AspectRatioFormat } from "./core/aspectRatio";
import { detectText, replaceText } from "./core/textEditor";
import { generateTweetCard, TweetTheme } from "./core/tweetCard";
import { generatePolaroid, LightLeakId } from "./core/polaroid";
import { generateCarousel, CarouselSlide, SlideLayout } from "./core/carousel";
import * as fs from "fs";

const program = new Command();
program.name("tsarr").description("CLI for tsarr.in tools").version("0.1.0");

interface Reportable {
  ok: boolean;
  message?: string;
  error?: string;
  colors?: unknown;
}

function report(outcome: Reportable) {
  if (outcome.ok) {
    console.log(outcome.message);
    if (outcome.colors) {
      console.log(JSON.stringify(outcome.colors, null, 2));
    }
    process.exit(0);
  } else {
    console.error(`Error: ${outcome.error}`);
    process.exit(1);
  }
}

program
  .command("app-icon <input>")
  .description("Generate an iOS/Android/Web/macOS app icon set as a ZIP")
  .requiredOption("--out <path>", "output .zip path")
  .option("--platforms <list>", "comma-separated: ios,android,web,macos", "ios,android,web,macos")
  .option("--background <color>", "background color, e.g. #ffffff", "#ffffff")
  .option("--padding <percent>", "padding inset percent, 0-20", "0")
  .action(async (input, cmdOpts) => {
    const selected = new Set(cmdOpts.platforms.split(",").map((s: string) => s.trim()));
    const result = await generateAppIcons({
      inputPath: input,
      outPath: cmdOpts.out,
      backgroundColor: cmdOpts.background,
      padding: Number(cmdOpts.padding),
      platforms: {
        ios: selected.has("ios"),
        android: selected.has("android"),
        web: selected.has("web"),
        macos: selected.has("macos"),
      },
    });
    report(result);
  });

program
  .command("resize <input>")
  .description("Resize an image by dimensions or percentage")
  .requiredOption("--out <path>", "output file path")
  .option("--width <px>", "target width")
  .option("--height <px>", "target height")
  .option("--percentage <n>", "resize by percentage instead of exact dimensions")
  .option("--format <fmt>", "png|jpeg|webp|avif|gif|tiff", "png")
  .option("--quality <n>", "1-100, ignored for png/gif", "90")
  .option("--no-maintain-aspect-ratio", "stretch to exact width AND height instead of fitting inside")
  .action(async (input, cmdOpts) => {
    const result = await resizeImage({
      inputPath: input,
      outPath: cmdOpts.out,
      width: cmdOpts.width ? Number(cmdOpts.width) : undefined,
      height: cmdOpts.height ? Number(cmdOpts.height) : undefined,
      percentage: cmdOpts.percentage ? Number(cmdOpts.percentage) : undefined,
      maintainAspectRatio: cmdOpts.maintainAspectRatio,
      format: cmdOpts.format as ImageFormat,
      quality: Number(cmdOpts.quality),
    });
    report(result);
  });

program
  .command("convert <input>")
  .description("Convert an image to another format")
  .requiredOption("--out <path>", "output file path")
  .requiredOption("--format <fmt>", "png|jpeg|webp|avif|gif|tiff|ico")
  .option("--quality <n>", "1-100, ignored for png/gif/ico", "90")
  .action(async (input, cmdOpts) => {
    const result = await convertImage({
      inputPath: input,
      outPath: cmdOpts.out,
      format: cmdOpts.format as ConvertFormat,
      quality: Number(cmdOpts.quality),
    });
    report(result);
  });

program
  .command("palette <input>")
  .description("Extract a dominant color palette from an image")
  .option("--count <n>", "number of colors, 2-12", "6")
  .option("--out <path>", "optional .json output path")
  .action(async (input, cmdOpts) => {
    const result = await extractPalette({
      inputPath: input,
      outPath: cmdOpts.out,
      count: Number(cmdOpts.count),
    });
    report(result);
  });

program
  .command("qr <data>")
  .description("Generate a QR code. <data> meaning depends on --type (see --help)")
  .requiredOption("--out <path>", "output .png path")
  .option("--type <type>", `one of: ${qrTypes.map((t) => t.id).join(", ")}`, "link")
  .option("--size <px>", "QR image size in pixels", "512")
  .option("--fg <color>", "foreground color", "#000000")
  .option("--bg <color>", "background color", "#ffffff")
  .option("--ecl <level>", "error correction level: L|M|Q|H", "M")
  .option("--field <key=value...>", "extra field for types beyond link/text, repeatable", (v: string, prev: string[]) => [...prev, v], [] as string[])
  .action(async (data, cmdOpts) => {
    const fields: Record<string, string> = {};
    for (const kv of cmdOpts.field as string[]) {
      const [k, ...rest] = kv.split("=");
      fields[k] = rest.join("=");
    }
    // Map the positional <data> argument onto the field the chosen type
    // actually reads (url/link uses "url", plain text uses "text", etc.)
    const primaryFieldByType: Record<string, string> = {
      text: "text",
      link: "url",
      file: "url",
      email: "to",
      phone: "phone",
      sms: "phone",
      whatsapp: "phone",
    };
    const primaryField = primaryFieldByType[cmdOpts.type];
    if (primaryField && !(primaryField in fields)) fields[primaryField] = data;

    const result = await generateQr({
      type: cmdOpts.type,
      fields,
      outPath: cmdOpts.out,
      size: Number(cmdOpts.size),
      fgColor: cmdOpts.fg,
      bgColor: cmdOpts.bg,
      errorCorrectionLevel: cmdOpts.ecl,
    });
    report(result);
  });

program
  .command("watermark-remove <input>")
  .description("Remove a watermark using a mask image (white = remove, black = keep)")
  .requiredOption("--mask <path>", "mask image, same dimensions as the input")
  .requiredOption("--out <path>", "output file path")
  .action(async (input, cmdOpts) => {
    const result = await removeWatermark({ inputPath: input, maskPath: cmdOpts.mask, outPath: cmdOpts.out });
    report(result);
  });

program
  .command("screenshot <url>")
  .description("Capture a screenshot of a webpage at a device viewport")
  .requiredOption("--out <path>", "output .jpg path")
  .option("--device <profile>", "desktop|tablet|mobile", "desktop")
  .option("--full-page", "capture the full scrollable page instead of just the viewport", false)
  .option("--width <px>", "override viewport width")
  .option("--height <px>", "override viewport height")
  .action(async (url, cmdOpts) => {
    const result = await captureScreenshot({
      url,
      outPath: cmdOpts.out,
      device: cmdOpts.device as DeviceProfileId,
      fullPage: cmdOpts.fullPage,
      width: cmdOpts.width ? Number(cmdOpts.width) : undefined,
      height: cmdOpts.height ? Number(cmdOpts.height) : undefined,
    });
    report(result);
  });

program
  .command("aspect-ratio <input>")
  .description("Convert an image to a target aspect ratio or custom size")
  .requiredOption("--out <path>", "output file path")
  .option("--ratio <w:h>", "target ratio, e.g. 1:1, 16:9, 4:5", "1:1")
  .option("--width <px>", "custom output width (overrides --ratio)")
  .option("--height <px>", "custom output height (overrides --ratio)")
  .option("--scale <n>", "output scale multiplier (ignored with --width/--height)", "1")
  .option("--fit <mode>", "contain|cover|fill|crop", "contain")
  .option("--background-type <type>", "solid|blur|transparent", "solid")
  .option("--background <color>", "background color for solid type", "#ffffff")
  .option("--crop-x <percent>", "crop anchor x, 0-100 (cover/crop fit)", "50")
  .option("--crop-y <percent>", "crop anchor y, 0-100 (cover/crop fit)", "50")
  .option("--format <fmt>", "png|jpeg|webp|avif", "png")
  .option("--quality <n>", "1-100, ignored for png", "90")
  .action(async (input, cmdOpts) => {
    const [rw, rh] = cmdOpts.ratio.split(":").map(Number);
    const result = await convertAspectRatio({
      inputPath: input,
      outPath: cmdOpts.out,
      aspectRatio: rw && rh ? rw / rh : 1,
      width: cmdOpts.width ? Number(cmdOpts.width) : undefined,
      height: cmdOpts.height ? Number(cmdOpts.height) : undefined,
      outputScale: Number(cmdOpts.scale),
      fitMode: cmdOpts.fit as FitMode,
      backgroundType: cmdOpts.backgroundType as ARBackgroundType,
      backgroundColor: cmdOpts.background,
      cropPosition: { x: Number(cmdOpts.cropX), y: Number(cmdOpts.cropY) },
      format: cmdOpts.format as AspectRatioFormat,
      quality: Number(cmdOpts.quality),
    });
    report(result);
  });

program
  .command("text-detect <input>")
  .description("OCR-detect text regions in an image (step 1 of 2 for text replacement)")
  .requiredOption("--out <path>", "output .json path listing detected regions")
  .action(async (input, cmdOpts) => {
    const result = await detectText({ inputPath: input, outPath: cmdOpts.out });
    report(result as any);
  });

program
  .command("text-replace <input>")
  .description('Replace detected text (step 2 of 2 — edit "newText" fields in the JSON from text-detect first)')
  .requiredOption("--regions <path>", "regions .json from text-detect, with newText fields edited")
  .requiredOption("--out <path>", "output file path")
  .action(async (input, cmdOpts) => {
    const result = await replaceText({ inputPath: input, regionsPath: cmdOpts.regions, outPath: cmdOpts.out });
    report(result);
  });

program
  .command("tweet-card <text>")
  .description("Generate a tweet-style social card image")
  .requiredOption("--out <path>", "output .png path")
  .requiredOption("--name <name>", "display name")
  .requiredOption("--username <handle>", "@username (without the @)")
  .option("--avatar <path>", "optional avatar image; falls back to an initial")
  .option("--verified", "show a verified badge", false)
  .option("--theme <theme>", "light|dark|dim", "light")
  .option("--metrics", "show a Replies/Reposts/Likes row", false)
  .option("--likes <n>", "likes count to display", "0")
  .option("--retweets <n>", "reposts count to display", "0")
  .option("--replies <n>", "replies count to display", "0")
  .option("--background <color>", "canvas background behind the card", "#f0f2f4")
  .option("--width <px>", "card width", "600")
  .action(async (text, cmdOpts) => {
    const result = await generateTweetCard({
      outPath: cmdOpts.out,
      displayName: cmdOpts.name,
      username: cmdOpts.username,
      tweetText: text,
      avatarPath: cmdOpts.avatar,
      verified: cmdOpts.verified,
      theme: cmdOpts.theme as TweetTheme,
      showMetrics: cmdOpts.metrics,
      likes: cmdOpts.likes,
      retweets: cmdOpts.retweets,
      replies: cmdOpts.replies,
      backgroundColor: cmdOpts.background,
      cardWidth: Number(cmdOpts.width),
    });
    report(result);
  });

program
  .command("polaroid <input>")
  .description("Frame an image as a vintage polaroid photo with caption/filters")
  .requiredOption("--out <path>", "output .png path")
  .option("--caption <text>", "caption text")
  .option("--caption-font <font>", "font family; must be installed as a system font", "Caveat")
  .option("--caption-size <px>", "caption font size", "24")
  .option("--caption-color <color>", "caption color", "#333333")
  .option("--frame-color <color>", "polaroid frame color", "#ffffff")
  .option("--border-width <px>", "top/side border width", "20")
  .option("--bottom-border-width <px>", "bottom border width (caption area)", "80")
  .option("--rotation <deg>", "rotation in degrees", "0")
  .option("--no-shadow", "disable the drop shadow")
  .option("--background <color>", "canvas background behind the polaroid", "#f5f5f5")
  .option("--brightness <percent>", "default 100", "100")
  .option("--contrast <percent>", "default 100", "100")
  .option("--saturation <percent>", "default 100", "100")
  .option("--hue-rotate <deg>", "default 0", "0")
  .option("--blur <px>", "default 0", "0")
  .option("--vignette", "enable vignette", false)
  .option("--vignette-intensity <percent>", "10-80", "40")
  .option("--light-leak <id>", "none|warm|cool|rainbow|subtle|orange|blue|pink|vintage", "none")
  .option("--grain", "enable film grain", false)
  .option("--grain-intensity <percent>", "5-50", "20")
  .action(async (input, cmdOpts) => {
    const result = await generatePolaroid({
      inputPath: input,
      outPath: cmdOpts.out,
      caption: cmdOpts.caption,
      captionFont: cmdOpts.captionFont,
      captionSize: Number(cmdOpts.captionSize),
      captionColor: cmdOpts.captionColor,
      frameColor: cmdOpts.frameColor,
      borderWidth: Number(cmdOpts.borderWidth),
      bottomBorderWidth: Number(cmdOpts.bottomBorderWidth),
      rotation: Number(cmdOpts.rotation),
      shadow: cmdOpts.shadow,
      backgroundColor: cmdOpts.background,
      brightness: Number(cmdOpts.brightness),
      contrast: Number(cmdOpts.contrast),
      saturation: Number(cmdOpts.saturation),
      hueRotate: Number(cmdOpts.hueRotate),
      blur: Number(cmdOpts.blur),
      vignette: cmdOpts.vignette,
      vignetteIntensity: Number(cmdOpts.vignetteIntensity),
      lightLeak: cmdOpts.lightLeak as LightLeakId,
      grain: cmdOpts.grain,
      grainIntensity: Number(cmdOpts.grainIntensity),
    });
    report(result);
  });

program
  .command("carousel <slidesJson>")
  .description("Generate a multi-slide social carousel from a JSON array of slides")
  .requiredOption("--out-dir <dir>", "output directory, one slide-N.png per slide")
  .option("--layout <layout>", "text-only|image-top|image-bottom", "text-only")
  .option("--width <px>", "slide width", "1080")
  .option("--height <px>", "slide height", "1350")
  .option("--background <color>", "slide background color", "#ffffff")
  .action(async (slidesJson, cmdOpts) => {
    if (!fs.existsSync(slidesJson)) {
      report({ ok: false, error: `Slides JSON not found: ${slidesJson}` });
      return;
    }
    const slides: CarouselSlide[] = JSON.parse(fs.readFileSync(slidesJson, "utf8"));
    const result = await generateCarousel({
      slides,
      outDir: cmdOpts.outDir,
      layout: cmdOpts.layout as SlideLayout,
      width: Number(cmdOpts.width),
      height: Number(cmdOpts.height),
      backgroundColor: cmdOpts.background,
    });
    report(result);
  });

program.parse();
