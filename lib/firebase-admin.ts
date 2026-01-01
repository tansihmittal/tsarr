// Firebase Admin SDK for server-side operations (push notifications, etc.)
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  // Option 1: Use service account JSON file
  // Download from Firebase Console > Project Settings > Service Accounts
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } 
  // Option 2: Use individual environment variables
  else if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  // Option 3: Default credentials (for Google Cloud environments)
  else {
    try {
      admin.initializeApp();
    } catch {
      console.warn('Firebase Admin not initialized - missing credentials');
    }
  }
}

export const firebaseAdmin = admin;
export const messaging = admin.apps.length ? admin.messaging() : null;
export const firestore = admin.apps.length ? admin.firestore() : null;
