// tsarr.in Service Worker v6 - Full Offline Support with AI Models
const CACHE_VERSION = 'v6';
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

// CDN domains to cache (models, libraries, fonts)
const CACHEABLE_CDN_HOSTS = [
  'unpkg.com',
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'huggingface.co',
  'cdn-lfs.huggingface.co',
  'cdn-lfs-us-1.huggingface.co',
  'staticimgly.com'  // imgly background removal models
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

// Fetch handler with smart caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Only handle http/https
  if (!url.protocol.startsWith('http')) return;

  const isExternal = url.origin !== self.location.origin;
  const isCacheableCDN = CACHEABLE_CDN_HOSTS.some(host => url.hostname.includes(host));

  // Skip external requests that aren't cacheable CDNs
  if (isExternal && !isCacheableCDN) return;

  // AI Models and WASM files - Cache first (they're large and don't change)
  if (isModelOrWasm(url)) {
    event.respondWith(cacheFirstForModels(request));
    return;
  }

  // CDN resources (fonts, libraries) - Cache first
  if (isCacheableCDN) {
    event.respondWith(cacheFirstForCDN(request));
    return;
  }

  // Navigation requests (HTML pages) - Network first, cache fallback, offline page
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOffline(request));
    return;
  }

  // Static assets - Cache first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Next.js static chunks - Cache first (immutable)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // API and dynamic content - Network first with cache fallback
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// Check if URL is for AI model or WASM file
function isModelOrWasm(url) {
  const path = url.pathname.toLowerCase();
  return path.endsWith('.onnx') ||
         path.endsWith('.wasm') ||
         path.endsWith('.bin') ||
         path.endsWith('.json') && (url.hostname.includes('huggingface') || url.hostname.includes('imgly')) ||
         path.includes('/models/') ||
         path.includes('/onnx/');
}

// Check if URL is for static asset
function isStaticAsset(url) {
  return /\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|css|js)$/.test(url.pathname) ||
         url.pathname.startsWith('/images/');
}

// Cache first strategy for AI models (with long-term caching)
async function cacheFirstForModels(request) {
  const cached = await caches.match(request);
  if (cached) {
    console.log('[SW] Model from cache:', request.url);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(MODEL_CACHE);
      cache.put(request, response.clone());
      console.log('[SW] Model cached:', request.url);
    }
    return response;
  } catch (error) {
    console.error('[SW] Model fetch failed:', request.url);
    throw error;
  }
}

// Cache first strategy for CDN resources
async function cacheFirstForCDN(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] CDN fetch failed:', request.url);
    throw error;
  }
}

// Cache first strategy for static assets
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f0f0f0" width="100" height="100"/></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    throw error;
  }
}

// Network first with offline fallback for navigation
async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('/offline.html');
  }
}

// Network first with cache fallback
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return caches.match(request);
  }
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
  const { type, payload } = event.data || {};
  
  switch (type || event.data) {
    case 'skipWaiting':
      self.skipWaiting();
      break;
    case 'clearCache':
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
      break;
    case 'clearModelCache':
      caches.delete(MODEL_CACHE);
      break;
    case 'getModelCacheSize':
      getModelCacheSize().then((size) => {
        event.ports?.[0]?.postMessage({ size });
      });
      break;
    case 'precacheModels':
      if (payload?.urls) {
        precacheModels(payload.urls);
      }
      break;
  }
});

// Get model cache size
async function getModelCacheSize() {
  try {
    const cache = await caches.open(MODEL_CACHE);
    const keys = await cache.keys();
    let totalSize = 0;
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.clone().blob();
        totalSize += blob.size;
      }
    }
    return totalSize;
  } catch {
    return 0;
  }
}

// Precache specific model URLs
async function precacheModels(urls) {
  const cache = await caches.open(MODEL_CACHE);
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log('[SW] Precached model:', url);
      }
    } catch (e) {
      console.error('[SW] Failed to precache:', url);
    }
  }
}

console.log('[SW] Service worker v6 loaded - AI models will be cached for offline use');
