// tsarr.in Service Worker v8 - PWABuilder Compatible
const CACHE_VERSION = 'v8';
const CACHE_NAME = `tsarr-${CACHE_VERSION}`;
const STATIC_CACHE = `tsarr-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `tsarr-dynamic-${CACHE_VERSION}`;
const MODEL_CACHE = `tsarr-models-${CACHE_VERSION}`;

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

// CDN domains to cache
const CACHEABLE_CDN_HOSTS = [
  'unpkg.com',
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'huggingface.co',
  'cdn-lfs.huggingface.co',
  'cdn-lfs-us-1.huggingface.co',
  'staticimgly.com'
];

// ============================================
// INSTALL EVENT - Precache assets for offline
// ============================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ============================================
// ACTIVATE EVENT - Clean old caches
// ============================================
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, MODEL_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('tsarr-') && !currentCaches.includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// ============================================
// FETCH EVENT - Offline Support
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  const isExternal = url.origin !== self.location.origin;
  const isCacheableCDN = CACHEABLE_CDN_HOSTS.some(host => url.hostname.includes(host));

  if (isExternal && !isCacheableCDN) return;

  // Navigation - Network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/offline.html')))
    );
    return;
  }

  // Models and WASM - Cache first
  if (isModelOrWasm(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(MODEL_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // CDN and static assets - Cache first
  if (isCacheableCDN || isStaticAsset(url) || url.pathname.startsWith('/_next/static/')) {
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

  // Default - Network first with cache fallback
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

function isModelOrWasm(url) {
  const path = url.pathname.toLowerCase();
  return path.endsWith('.onnx') || path.endsWith('.wasm') || path.endsWith('.bin') ||
         path.includes('/models/') || path.includes('/onnx/');
}

function isStaticAsset(url) {
  return /\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|css|js)$/.test(url.pathname);
}

// ============================================
// SYNC EVENT - Background Sync
// ============================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-projects') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SYNC_COMPLETED', tag: 'sync-projects' }));
      })
    );
  }
  if (event.tag === 'sync-data') {
    event.waitUntil(Promise.resolve());
  }
});

// ============================================
// PERIODIC SYNC EVENT - Periodic Background Sync
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
  if (event.tag === 'update-content') {
    event.waitUntil(
      fetch('/site.webmanifest', { cache: 'no-cache' })
        .then((response) => response.ok ? caches.open(CACHE_NAME).then((c) => c.put('/site.webmanifest', response)) : null)
        .catch(() => null)
    );
  }
});

// ============================================
// PUSH EVENT - Push Notifications
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
// NOTIFICATION CLICK EVENT
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
// MESSAGE EVENT - Client Communication
// ============================================
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  
  if (type === 'skipWaiting' || event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (type === 'clearCache') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => event.ports?.[0]?.postMessage({ success: true }));
  }
  
  if (type === 'getCacheStatus') {
    getCacheStatus().then((status) => event.ports?.[0]?.postMessage(status));
  }
  
  if (type === 'precacheModels' && payload?.urls) {
    caches.open(MODEL_CACHE).then((cache) => {
      Promise.all(payload.urls.map((url) => 
        fetch(url).then((r) => r.ok ? cache.put(url, r) : null).catch(() => null)
      )).then(() => event.ports?.[0]?.postMessage({ success: true }));
    });
  }
});

async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status[name] = keys.length;
  }
  return { version: CACHE_VERSION, caches: status };
}
