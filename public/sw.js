// tsarr.in Service Worker v5 - Full Offline Support
const CACHE_VERSION = 'v5';
const CACHE_NAME = `tsarr-${CACHE_VERSION}`;
const STATIC_CACHE = `tsarr-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `tsarr-dynamic-${CACHE_VERSION}`;

// Core pages to pre-cache for offline use
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
  '/site.webmanifest',
  '/images/noise.png'
];

// Install - precache all core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[SW] Precache failed:', err);
        self.skipWaiting();
      })
  );
});

// Activate - clean old caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('tsarr-') && key !== CACHE_NAME && key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch - serve from cache, fallback to network, then offline page
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Only handle http/https
  if (!url.protocol.startsWith('http')) return;

  // Skip external requests except fonts/CDN
  const isExternal = url.origin !== self.location.origin;
  const isFont = url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');
  const isCDN = url.hostname.includes('unpkg.com') || url.hostname.includes('cdn.jsdelivr.net');
  if (isExternal && !isFont && !isCDN) return;

  // Navigation requests (HTML pages) - Network first, cache fallback, offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((cached) => cached || caches.match('/offline.html'));
        })
    );
    return;
  }

  // Static assets - Cache first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          });
        })
        .catch(() => {
          if (request.destination === 'image') {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f0f0f0" width="100" height="100"/></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
        })
    );
    return;
  }

  // Next.js static chunks - Cache first (immutable)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // API and dynamic content - Network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

function isStaticAsset(url) {
  return /\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|css|js)$/.test(url.pathname) ||
         url.pathname.startsWith('/images/');
}

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-projects') {
    event.waitUntil(Promise.resolve());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'tsarr.in', {
      body: data.body || 'New update',
      icon: '/favicon-192x192.png',
      badge: '/favicon-192x192.png'
    })
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/app'));
});

// Message handler
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
  if (event.data === 'clearCache') {
    caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
  }
});
