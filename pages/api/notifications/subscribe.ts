// API route to save FCM tokens for push notifications
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';
import { isRateLimited } from '@/lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (isRateLimited(req, res, { limit: 20, windowMs: 60_000, keyPrefix: 'notif-subscribe' })) {
    return;
  }

  const { token, userId } = req.body;

  // FCM tokens are long opaque strings — a basic shape/length check filters
  // out junk without needing to know FCM's exact internal format.
  if (!token || typeof token !== 'string' || token.length < 32 || token.length > 4096) {
    return res.status(400).json({ error: 'FCM token is required' });
  }
  if (userId !== undefined && (typeof userId !== 'string' || userId.length > 128)) {
    return res.status(400).json({ error: 'Invalid userId' });
  }

  if (!firestore) {
    return res.status(500).json({ error: 'Firebase not configured' });
  }

  try {
    // Save token to Firestore
    await firestore.collection('fcm_tokens').doc(token).set({
      token,
      userId: userId || 'anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      platform: req.headers['user-agent']?.includes('Android') ? 'android' : 
                req.headers['user-agent']?.includes('iPhone') ? 'ios' : 'web',
    }, { merge: true });

    res.status(200).json({ success: true, message: 'Token saved' });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({ error: 'Failed to save token' });
  }
}
