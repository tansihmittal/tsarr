// Push notification utilities for tsarr.in
// Supports both Web Push API and Firebase Cloud Messaging

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BDPdzSl1RhT8LgztbrQej6MLCe0gj9TyagpFrnE9PjjDuL25iRvPsVCYy2SpuBfVq8uAMEvx-ZRgCXfVnKNE5fM';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// Initialize Firebase Messaging and get FCM token
export async function initFirebaseMessaging(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    const { getMessaging, getToken } = await import('firebase/messaging');
    const firebaseConfig = await import('@/firebase.config');
    
    const messaging = getMessaging(firebaseConfig.app);
    const permission = await requestNotificationPermission();
    
    if (!permission) return null;
    
    // Register the Firebase messaging service worker first
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;
    
    // Get FCM token with the registered service worker
    const token = await getToken(messaging, {
      vapidKey: VAPID_PUBLIC_KEY,
      serviceWorkerRegistration: registration,
    });
    
    if (token) {
      // Save token to backend
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    }
    
    return token;
  } catch (error) {
    console.error('FCM initialization failed:', error);
    return null;
  }
}

// Subscribe to a topic (e.g., 'all', 'weekly-tips', 'new-features')
export async function subscribeToTopic(topic: string): Promise<boolean> {
  const token = await initFirebaseMessaging();
  if (!token) return false;
  
  try {
    await fetch('/api/notifications/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, topic, action: 'subscribe' }),
    });
    return true;
  } catch {
    return false;
  }
}

// Show a local notification (for testing or local reminders)
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!isNotificationSupported()) return;
  
  const permission = await requestNotificationPermission();
  if (!permission) return;

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(title, {
    icon: '/favicon-192x192.png',
    badge: '/favicon-192x192.png',
    ...options,
  });
}

// Schedule a reminder notification
export function scheduleReminder(
  title: string,
  body: string,
  delayMs: number,
  url?: string
): number {
  const timeoutId = window.setTimeout(() => {
    showLocalNotification(title, {
      body,
      data: { url: url || '/app' },
      tag: 'reminder',
    });
  }, delayMs);
  
  return timeoutId;
}

// Creative reminder messages
export const reminderMessages = [
  { title: "Time to create! ✨", body: "Your next design is waiting. Let's make something beautiful." },
  { title: "Design break? 🎨", body: "Take a moment to create something amazing." },
  { title: "Inspiration calling! 💡", body: "Got an idea? Turn it into a stunning visual." },
  { title: "Your canvas awaits 🖼️", body: "Screenshots, code images, carousels - what will you create?" },
  { title: "Creative time! 🚀", body: "Transform your ideas into shareable content." },
];

export function getRandomReminder() {
  return reminderMessages[Math.floor(Math.random() * reminderMessages.length)];
}
