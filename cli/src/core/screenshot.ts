// Node port of pages/api/screenshot.ts's Puppeteer capture logic. That route
// uses puppeteer-core + @sparticuz/chromium-min specifically because it runs
// on Vercel's serverless functions (small filesystem, needs a remote
// Chromium binary fetched at cold-start). A local CLI has none of those
// constraints, so this uses plain `puppeteer`, which manages its own
// bundled/downloaded Chromium — no separate binary wiring needed.
import puppeteer from "puppeteer";
import * as fs from "fs";
import * as path from "path";
import { ToolOutcome } from "./types";

export type DeviceProfileId = "desktop" | "tablet" | "mobile";

interface DeviceProfile {
  viewport: { width: number; height: number };
  userAgent: string;
  isMobile: boolean;
  deviceScaleFactor: number;
}

const deviceProfiles: Record<DeviceProfileId, DeviceProfile> = {
  desktop: {
    viewport: { width: 1920, height: 1080 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    isMobile: false,
    deviceScaleFactor: 1,
  },
  tablet: {
    viewport: { width: 768, height: 1024 },
    userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/121.0.6167.57 Mobile/15E148 Safari/604.1",
    isMobile: true,
    deviceScaleFactor: 2,
  },
  mobile: {
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    isMobile: true,
    deviceScaleFactor: 3,
  },
};

export interface ScreenshotOptions {
  url: string;
  outPath: string;
  device?: DeviceProfileId; // default desktop
  fullPage?: boolean; // default false
  width?: number; // overrides device profile viewport width
  height?: number; // overrides device profile viewport height
}

export async function captureScreenshot(opts: ScreenshotOptions): Promise<ToolOutcome> {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  try {
    let validUrl: URL;
    try {
      validUrl = new URL(opts.url);
    } catch {
      return { ok: false, error: `Invalid URL: ${opts.url}` };
    }

    const profile = deviceProfiles[opts.device ?? "desktop"] ?? deviceProfiles.desktop;
    const viewport = opts.width && opts.height ? { width: opts.width, height: opts.height } : profile.viewport;

    browser = await puppeteer.launch({
      headless: true,
      protocolTimeout: 60000,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });
    const page = await browser.newPage();

    await page.setUserAgent(profile.userAgent);
    await page.setViewport({
      ...viewport,
      isMobile: profile.isMobile,
      deviceScaleFactor: profile.deviceScaleFactor,
      hasTouch: profile.isMobile,
    });

    await page.goto(validUrl.href, { waitUntil: "networkidle2", timeout: 25000 });
    await new Promise((r) => setTimeout(r, 500));

    const fullPage = opts.fullPage ?? false;
    const screenshot = await page.screenshot({
      type: "jpeg",
      quality: 85,
      fullPage,
      ...(!fullPage && { clip: { x: 0, y: 0, width: viewport.width, height: viewport.height } }),
    });

    fs.mkdirSync(path.dirname(path.resolve(opts.outPath)), { recursive: true });
    fs.writeFileSync(opts.outPath, screenshot);

    return { ok: true, outputPath: opts.outPath, message: `Captured ${opts.device ?? "desktop"} screenshot of ${opts.url} -> ${opts.outPath}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
