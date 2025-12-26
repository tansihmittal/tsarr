import type { NextApiRequest, NextApiResponse } from "next";

interface TweetData {
  displayName: string;
  username: string;
  avatarUrl: string;
  verified: boolean;
  tweetText: string;
  date: string;
  likes: string;
  retweets: string;
  replies: string;
  views: string;
  bookmarks: string;
}

interface ErrorResponse {
  error: string;
}

// Extract tweet ID from various Twitter/X URL formats
function extractTweetId(url: string): string | null {
  const patterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
    /^(\d+)$/, // Just the ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Format large numbers (e.g., 1234 -> "1.2K")
function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TweetData | ErrorResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Tweet URL is required" });
  }

  const tweetId = extractTweetId(url);
  if (!tweetId) {
    return res.status(400).json({ error: "Invalid tweet URL" });
  }

  try {
    // Use Twitter's syndication API (no auth required)
    const response = await fetch(
      `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en&token=0`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: "Tweet not found" });
      }
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data = await response.json();

    // Log the response to debug (remove in production)
    console.log("Tweet API response:", JSON.stringify(data, null, 2));

    // Extract tweet data from syndication response
    // The syndication API uses different field names
    const tweetData: TweetData = {
      displayName: data.user?.name || "Unknown",
      username: data.user?.screen_name || "unknown",
      avatarUrl: data.user?.profile_image_url_https?.replace("_normal", "_400x400") || "",
      verified: data.user?.verified || data.user?.is_blue_verified || false,
      tweetText: data.text || "",
      date: data.created_at || new Date().toISOString(),
      likes: formatNumber(data.favorite_count),
      retweets: formatNumber(data.retweet_count),
      replies: formatNumber(data.reply_count || data.conversation_count),
      views: formatNumber(data.views?.count || data.view_count || data.viewCount),
      bookmarks: formatNumber(data.bookmark_count || data.bookmarkCount),
    };

    return res.status(200).json(tweetData);
  } catch (error) {
    console.error("Error fetching tweet:", error);
    return res.status(500).json({ error: "Failed to fetch tweet. Please try again." });
  }
}
