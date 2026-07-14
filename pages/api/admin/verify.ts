// API route to verify admin API key
import type { NextApiRequest, NextApiResponse } from 'next';
import { timingSafeEqual } from 'crypto';
import { isRateLimited } from '@/lib/rateLimit';

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Buffers must be equal length for timingSafeEqual; mismatch is already
  // not a match, but we still run a same-length comparison to avoid a
  // length-based timing signal.
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Narrow window, low limit — this endpoint exists solely to check a
  // shared secret, so it's a brute-force target if left unthrottled.
  if (isRateLimited(req, res, { limit: 5, windowMs: 60_000, keyPrefix: 'admin-verify' })) {
    return;
  }

  const { apiKey } = req.body;

  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'API key is required' });
  }

  const expected = process.env.NOTIFICATION_API_KEY;
  if (!expected || !safeCompare(apiKey, expected)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  res.status(200).json({ success: true });
}
