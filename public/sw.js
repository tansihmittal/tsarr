// tsarr.in Service Worker v4 - Enhanced for speed and reliability
const CACHE_VERSION = 'v4';
const CACHE_NAME = `tsarr-${CACHE_VERSION}`;
const STATIC_CACHE = `tsarr-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `tsarr-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `tsarr-images-${CACHE_VERSION}`;

// Core pages to pre-cache for instant loading
const PRECACHE_URLS = [
  '/',
  '/app',
  '/tools',
  '/editor',
  '/code',
  '/projects',
  '/settings',
  '/offline.html',
  '/favicon.ico',
  '/favicon-192x192.png',
  '/favicon-512x512.png',
  '/site.webmanifest'
];

// Static assets to cache aggressively
const STATIC_ASSETS = [
  '/images/noise.png'
];

// Install event - precache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v4...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Precaching core pages');
        return cache.addAll(PRECACHE_URLS);
      }),
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
    ])
    .then(() => self.skipWaiting())
    .catch((err) => {
      console.log('[SW] Precache failed:', err);
      return self.skipWaiting();
    })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v4...');
  const currentCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('tsarr-') && !currentCaches.includes(name))
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - optimized caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Handle external requests
  const isExternal = url.origin !== self.location.origin;
  const isFont = url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');
  const isCDN = url.hostname.includes('unpkg.com') || url.hostname.includes('cdn.jsdelivr.net');
  
  if (isExternal && !isFont && !isCDN) return;

  // Strategy 1: Cache-first for static assets (images, fonts, etc.)
  if (isStaticAsset(request, url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Strategy 2: Cache-first for fonts (they rarely change)
  if (isFont) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Strategy 3: Cache-first for CDN resources
  if (isCDN) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Strategy 4: Stale-while-revalidate for navigation (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
    return;
  }

  // Strategy 5: Network-first for API calls and dynamic content
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/data/')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Strategy 6: Stale-while-revalidate for JS/CSS bundles
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Default: Network first with cache fallback
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// Helper: Check if request is for static asset
function isStaticAsset(request, url) {
  return request.destination === 'image' || 
         request.destination === 'font' || 
         url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ico|css)$/);
}

// Strategy: Cache First (for static assets)
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return placeholder for images
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f0f0f0" width="100" height="100"/><text x="50" y="50" text-anchor="middle" fill="#999" font-size="12">Offline</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    throw error;
  }
}

// Strategy: Network First (for dynamic content)
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Strategy: Stale While Revalidate (for pages)
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Return cached immediately, update in background
  if (cached) {
    fetchPromise; // Fire and forget
    return cached;
  }

  // No cache, wait for network
  const response = await fetchPromise;
  if (response) return response;

  // Fallback to offline page
  return caches.match('/offline.html');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-projects') {
    event.waitUntil(syncProjects());
  }
});

async function syncProjects() {
  // Placeholder for syncing offline changes
  console.log('[SW] Syncing projects...');
}

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'tsarr.in', {
        body: data.body || 'New update available',
        icon: '/favicon-192x192.png',
        badge: '/favicon-192x192.png',
        tag: 'tsarr-notification',
        renotify: true,
        actions: [
          { action: 'open', title: 'Open' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes('tsarr.in') && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        return clients.openWindow('/app');
      })
  );
});

// Periodic background sync for cache updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-cache') {
    event.waitUntil(updateCache());
  }
});

async function updateCache() {
  console.log('[SW] Updating cache...');
  const cache = await caches.open(CACHE_NAME);
  
  // Update core pages in background
  for (const url of PRECACHE_URLS) {
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        await cache.put(url, response);
      }
    } catch (e) {
      // Ignore failures during background update
    }
  }
}

// Message handler for client communication
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  
  switch (type || event.data) {
    case 'skipWaiting':
      self.skipWaiting();
      break;
    case 'clearCache':
      caches.keys().then((names) => 
        Promise.all(names.map((name) => caches.delete(name)))
      ).then(() => {
        event.ports?.[0]?.postMessage({ success: true });
      });
      break;
    case 'getCacheSize':
      getCacheSize().then((size) => {
        event.ports?.[0]?.postMessage({ size });
      });
      break;
    case 'precache':
      if (payload?.urls) {
        caches.open(CACHE_NAME).then((cache) => cache.addAll(payload.urls));
      }
      break;
  }
});

// Get total cache size
async function getCacheSize() {
  let totalSize = 0;
  const cacheNames = await caches.keys();
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.clone().blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

console.log('[SW] Service worker v4 loaded');
