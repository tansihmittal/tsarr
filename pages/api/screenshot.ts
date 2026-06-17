import type { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer-core";

const CHROMIUM_CDN =
  "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.tar";

const MAC_CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const deviceProfiles = {
  desktop: {
    viewport: { width: 1920, height: 1080 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    isMobile: false,
    deviceScaleFactor: 1,
  },
  tablet: {
    viewport: { width: 768, height: 1024 },
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/121.0.6167.57 Mobile/15E148 Safari/604.1",
    isMobile: true,
    deviceScaleFactor: 2,
  },
  mobile: {
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    isMobile: true,
    deviceScaleFactor: 3,
  },
};

async function getExecutablePath(): Promise<string> {
  if (process.env.NODE_ENV !== "production") {
    return process.env.CHROME_PATH || MAC_CHROME;
  }
  const chromium = (await import("@sparticuz/chromium-min")).default;
  chromium.setGraphicsMode = false;
  return chromium.executablePath(process.env.CHROMIUM_URL || CHROMIUM_CDN);
}

async function getLaunchArgs(): Promise<string[]> {
  if (process.env.NODE_ENV !== "production") {
    return [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ];
  }
  const chromium = (await import("@sparticuz/chromium-min")).default;
  return chromium.args;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let browser = null;
  try {
    const { url, device = "desktop", fullPage = false, width, height } =
      req.body as {
        url: string;
        device?: "desktop" | "tablet" | "mobile";
        fullPage?: boolean;
        width?: number;
        height?: number;
      };

    if (!url) return res.status(400).json({ error: "URL is required" });

    let validUrl: URL;
    try {
      validUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    const profile = deviceProfiles[device] ?? deviceProfiles.desktop;
    const viewport =
      width && height
        ? { width: Number(width), height: Number(height) }
        : profile.viewport;

    const [executablePath, args] = await Promise.all([
      getExecutablePath(),
      getLaunchArgs(),
    ]);

    browser = await puppeteer.launch({
      args,
      executablePath,
      headless: true,
      defaultViewport: null,
    });

    const page = await browser.newPage();

    await page.setUserAgent(profile.userAgent);
    await page.setViewport({
      ...viewport,
      isMobile: profile.isMobile,
      deviceScaleFactor: profile.deviceScaleFactor,
      hasTouch: profile.isMobile,
    });

    await page.goto(validUrl.href, {
      waitUntil: "networkidle2",
      timeout: 25000,
    });

    // Brief pause for deferred rendering / CSS transitions
    await new Promise((r) => setTimeout(r, 500));

    const screenshot = await page.screenshot({
      type: "jpeg",
      quality: 85,
      fullPage,
      ...(!fullPage && {
        clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
      }),
    });

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(Buffer.from(screenshot));
  } catch (error) {
    console.error("Screenshot error:", error);
    return res.status(500).json({ error: "Failed to capture screenshot" });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
