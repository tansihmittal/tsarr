// API route to verify admin API key
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  // Check against the server-side env variable
  if (apiKey !== process.env.NOTIFICATION_API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  res.status(200).json({ success: true });
}
