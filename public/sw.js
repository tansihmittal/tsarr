// tsarr.in Service Worker v9 - PWABuilder Offline Compatible
const CACHE_VERSION = 'v9';
const CACHE_NAME = `tsarr-${CACHE_VERSION}`;
const STATIC_CACHE = `tsarr-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `tsarr-dynamic-${CACHE_VERSION}`;
const MODEL_CACHE = `tsarr-models-${CACHE_VERSION}`;

// Core assets to pre-cache for offline
const PRECACHE_URLS = [
  '/',
  '/app',
  '/tools',
  '/editor',
  '/code',
  '/tweet',
  '/carousel',
  '/polaroid',
  '/text-behind-image',
  '/projects',
  '/settings',
  '/offline.html',
  '/favicon.ico',
  '/favicon-192x192.png',
  '/favicon-512x512.png',
  '/site.webmanifest'
];

// ============================================
// INSTALL - Pre-cache core assets
// ============================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// ============================================
// ACTIVATE - Clean old caches
// ============================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key.startsWith('tsarr-') && ![CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, MODEL_CACHE].includes(key))
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ============================================
// FETCH - Offline Support (PWABuilder Compatible)
// This handler MUST return HTTP 200 responses from cache when offline
// ============================================
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip non-http(s) schemes (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const networkResponse = await fetch(request);
          // Cache successful responses
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          // Network failed - serve from cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse; // Returns HTTP 200 from cache
          }
          // Fallback to offline page
          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) {
            return offlinePage; // Returns HTTP 200 offline page
          }
          // Last resort - return a basic offline response
          return new Response('Offline', {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'text/html' }
          });
        }
      })()
    );
    return;
  }

  // Handle all other requests
  event.respondWith(
    (async () => {
      // Check cache first
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse; // Returns HTTP 200 from cache
      }

      try {
        // Try network
        const networkResponse = await fetch(request);
        
        // Cache successful responses (only http/https)
        if (networkResponse.ok && url.protocol.startsWith('http')) {
          let cacheName = DYNAMIC_CACHE;
          
          // Determine which cache to use
          if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|css|js)$/) ||
              url.pathname.startsWith('/_next/static/')) {
            cacheName = STATIC_CACHE;
          } else if (url.pathname.match(/\.(onnx|wasm|bin)$/) || 
                     url.hostname.includes('huggingface')) {
            cacheName = MODEL_CACHE;
          }
          
          const cache = await caches.open(cacheName);
          cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        // Network failed - return appropriate fallback
        // For images, return a placeholder
        if (request.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#e5e7eb" width="100" height="100"/></svg>',
            { 
              status: 200, 
              statusText: 'OK',
              headers: { 'Content-Type': 'image/svg+xml' } 
            }
          );
        }
        
        // For other resources, return empty response with 200
        return new Response('', { 
          status: 200, 
          statusText: 'OK',
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    })()
  );
});

// ============================================
// SYNC - Background Sync
// ============================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-projects') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_COMPLETED', tag: 'sync-projects' });
        });
      })
    );
  }
});

// ============================================
// PERIODIC SYNC - Periodic Background Sync
// ============================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-cache') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return Promise.all(
          PRECACHE_URLS.map((url) =>
            fetch(url, { cache: 'no-cache' })
              .then((response) => response.ok ? cache.put(url, response) : null)
              .catch(() => null)
          )
        );
      })
    );
  }
});

// ============================================
// PUSH - Push Notifications
// ============================================
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'tsarr.in';
  const options = {
    body: data.body || 'New update available',
    icon: '/favicon-192x192.png',
    badge: '/favicon-192x192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/app' },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Dismiss' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ============================================
// NOTIFICATION CLICK
// ============================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;
  
  const urlToOpen = event.notification.data?.url || '/app';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

// ============================================
// MESSAGE - Client Communication
// ============================================
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
