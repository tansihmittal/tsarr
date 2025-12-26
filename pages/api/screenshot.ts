import type { NextApiRequest, NextApiResponse } from "next";

// Screenshot capture API using external service
// This uses a free screenshot API service

interface ScreenshotOptions {
  url: string;
  width?: number;
  height?: number;
  fullPage?: boolean;
  device?: "desktop" | "tablet" | "mobile";
}

const deviceSizes = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url, device = "desktop", fullPage = false, width, height } = req.body as ScreenshotOptions;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // Get device dimensions
    const dimensions = width && height 
      ? { width, height }
      : deviceSizes[device] || deviceSizes.desktop;

    // Use screenshotone.com API (free tier available) or similar service
    // For now, we'll use a simple approach with urlbox or similar
    // You can replace this with your preferred screenshot service
    
    const screenshotUrl = `https://api.screenshotone.com/take?url=${encodeURIComponent(url)}&viewport_width=${dimensions.width}&viewport_height=${dimensions.height}&full_page=${fullPage}&format=png&access_key=${process.env.SCREENSHOT_API_KEY || "free"}`;

    // Alternative: Use microlink.io (has free tier)
    const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=${dimensions.width}&viewport.height=${dimensions.height}${fullPage ? "&screenshot.fullPage=true" : ""}`;

    // Fetch from microlink (free tier)
    const response = await fetch(microlinkUrl);
    const data = await response.json();

    if (data.status === "success" && data.data?.screenshot?.url) {
      return res.status(200).json({ 
        success: true, 
        imageUrl: data.data.screenshot.url,
        dimensions: dimensions
      });
    }

    // Fallback: Return the microlink URL for client-side fetching
    return res.status(200).json({ 
      success: true, 
      imageUrl: `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`,
      dimensions: dimensions
    });

  } catch (error) {
    console.error("Screenshot error:", error);
    return res.status(500).json({ error: "Failed to capture screenshot" });
  }
}
