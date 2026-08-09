import type { NextApiRequest, NextApiResponse } from "next";

// Best-effort in-memory sliding-window rate limiter, keyed by client IP.
//
// Serverless functions are not guaranteed to stay warm or share memory across
// invocations, so this does NOT provide a hard distributed guarantee — a cold
// start or a request routed to a different instance resets its own counter.
// It's still real protection against the common case (bursty abuse from a
// single client hitting a warm instance) and costs nothing to run. For a
// hard guarantee across all instances, back this with Upstash Redis
// (@upstash/ratelimit) instead.
const hits = new Map<string, number[]>();

// Periodically drop stale entries so this doesn't grow unbounded on a
// long-lived warm instance.
const MAX_TRACKED_KEYS = 5000;

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0].trim();
  return ip || req.socket.remoteAddress || "unknown";
}

export interface RateLimitOptions {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
  /** Optional extra key suffix (e.g. route name) to scope limits per-route. */
  keyPrefix?: string;
}

/**
 * Returns true and sends a 429 if the caller is over the limit. Call this
 * first thing in a handler and `return` if it's true:
 *
 *   if (isRateLimited(req, res, { limit: 10, windowMs: 60_000 })) return;
 */
export function isRateLimited(
  req: NextApiRequest,
  res: NextApiResponse,
  { limit, windowMs, keyPrefix = "" }: RateLimitOptions
): boolean {
  const key = `${keyPrefix}:${getClientIp(req)}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  if (hits.size > MAX_TRACKED_KEYS) hits.clear();

  const timestamps = (hits.get(key) || []).filter((t) => t > windowStart);
  timestamps.push(now);
  hits.set(key, timestamps);

  if (timestamps.length > limit) {
    const retryAfterSec = Math.ceil((timestamps[0] + windowMs - now) / 1000);
    res.setHeader("Retry-After", String(Math.max(retryAfterSec, 1)));
    res.status(429).json({ error: "Too many requests. Please try again shortly." });
    return true;
  }

  return false;
}
