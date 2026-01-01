// API route to send push notifications via Firebase Cloud Messaging
// Protect this endpoint with authentication in production!
import type { NextApiRequest, NextApiResponse } from 'next';
import { messaging, firestore } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authentication check - use a secret API key
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.NOTIFICATION_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!messaging || !firestore) {
    return res.status(500).json({ error: 'Firebase not configured' });
  }

  const { title, body, url, imageUrl, topic, tokens } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const notification = {
      title,
      body: body || '',
      ...(imageUrl && { imageUrl }),
    };

    const data = {
      url: url || '/app',
      click_action: url || '/app',
    };

    let result;

    // Option 1: Send to a topic (all subscribers)
    if (topic) {
      result = await messaging.send({
        topic,
        notification,
        data,
        webpush: {
          fcmOptions: { link: url || '/app' },
          notification: {
            icon: '/favicon-192x192.png',
            badge: '/favicon-192x192.png',
          },
        },
      });
      
      return res.status(200).json({ 
        success: true, 
        message: `Sent to topic: ${topic}`,
        messageId: result,
      });
    }

    // Option 2: Send to specific tokens
    if (tokens && tokens.length > 0) {
      result = await messaging.sendEachForMulticast({
        tokens,
        notification,
        data,
        webpush: {
          fcmOptions: { link: url || '/app' },
          notification: {
            icon: '/favicon-192x192.png',
            badge: '/favicon-192x192.png',
          },
        },
      });

      return res.status(200).json({
        success: true,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });
    }

    // Option 3: Send to all registered tokens
    const tokensSnapshot = await firestore!.collection('fcm_tokens').get();
    const allTokens = tokensSnapshot.docs.map(doc => doc.data().token);

    if (allTokens.length === 0) {
      return res.status(200).json({ success: true, message: 'No subscribers yet' });
    }

    // Send in batches of 500 (FCM limit)
    const batchSize = 500;
    let totalSuccess = 0;
    let totalFailure = 0;
    const failedTokens: string[] = [];

    for (let i = 0; i < allTokens.length; i += batchSize) {
      const batch = allTokens.slice(i, i + batchSize);
      const batchResult = await messaging.sendEachForMulticast({
        tokens: batch,
        notification,
        data,
        webpush: {
          fcmOptions: { link: url || '/app' },
          notification: {
            icon: '/favicon-192x192.png',
            badge: '/favicon-192x192.png',
          },
        },
      });

      totalSuccess += batchResult.successCount;
      totalFailure += batchResult.failureCount;

      // Collect failed tokens for cleanup
      batchResult.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
          failedTokens.push(batch[idx]);
        }
      });
    }

    // Clean up invalid tokens
    if (failedTokens.length > 0) {
      const deleteBatch = firestore!.batch();
      failedTokens.forEach(token => {
        deleteBatch.delete(firestore!.collection('fcm_tokens').doc(token));
      });
      await deleteBatch.commit();
    }

    res.status(200).json({
      success: true,
      totalSubscribers: allTokens.length,
      successCount: totalSuccess,
      failureCount: totalFailure,
      cleanedUpTokens: failedTokens.length,
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: error.message || 'Failed to send notification' });
  }
}
