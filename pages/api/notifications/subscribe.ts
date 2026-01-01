// API route to save FCM tokens for push notifications
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, userId } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'FCM token is required' });
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
