// tsarr.in Service Worker v7 - Enhanced PWA with Full Offline Support
const CACHE_VERSION = 'v7';
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
  'staticimgly.com'
];

// Install - precache all core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v7...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching core assets...');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Precache complete, activating immediately');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Precache failed:', err);
        return self.skipWaiting();
      })
  );
});

// Activate - clean old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v7...');
  const currentCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, MODEL_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('tsarr-') && !currentCaches.includes(key))
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      ))
      .then(() => {
        console.log('[SW] Taking control of all clients');
        return self.clients.claim();
      })
  );
});

// Fetch handler with smart caching strategies
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
         (path.endsWith('.json') && (url.hostname.includes('huggingface') || url.hostname.includes('imgly'))) ||
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
    // Return placeholder for images
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
    console.log('[SW] Network failed, trying cache for:', request.url);
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // Return offline page for navigation requests
    console.log('[SW] Serving offline page');
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
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// Background Sync - sync projects when back online
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-projects') {
    event.waitUntil(syncProjects());
  }
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncProjects() {
  console.log('[SW] Syncing projects...');
  // Notify clients that sync is happening
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_STARTED', tag: 'sync-projects' });
  });
  
  // Projects are stored in IndexedDB, no server sync needed
  // Just notify completion
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_COMPLETED', tag: 'sync-projects' });
  });
}

async function syncData() {
  console.log('[SW] Syncing data...');
  // Placeholder for future server sync
}

// Periodic Background Sync - refresh cache periodically
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag);
  
  if (event.tag === 'refresh-cache') {
    event.waitUntil(refreshCache());
  }
  
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

async function refreshCache() {
  console.log('[SW] Refreshing cache...');
  try {
    const cache = await caches.open(CACHE_NAME);
    
    // Re-fetch and update core pages
    for (const url of PRECACHE_URLS) {
      try {
        const response = await fetch(url, { cache: 'no-cache' });
        if (response.ok) {
          await cache.put(url, response);
          console.log('[SW] Refreshed:', url);
        }
      } catch (e) {
        console.log('[SW] Failed to refresh:', url);
      }
    }
    
    console.log('[SW] Cache refresh complete');
  } catch (error) {
    console.error('[SW] Cache refresh failed:', error);
  }
}

async function updateContent() {
  console.log('[SW] Updating content...');
  // Check for app updates
  try {
    const response = await fetch('/site.webmanifest', { cache: 'no-cache' });
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put('/site.webmanifest', response);
    }
  } catch (e) {
    console.log('[SW] Content update failed');
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'New update available',
    icon: '/favicon-192x192.png',
    badge: '/favicon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/app',
      dateOfArrival: Date.now()
    },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Dismiss' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'tsarr.in', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();
  
  if (event.action === 'close') return;
  
  const urlToOpen = event.notification.data?.url || '/app';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if app is already open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window
        return clients.openWindow(urlToOpen);
      })
  );
});

// Message handler for client communication
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  console.log('[SW] Message received:', type);
  
  switch (type || event.data) {
    case 'skipWaiting':
      self.skipWaiting();
      break;
      
    case 'clearCache':
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
        event.ports?.[0]?.postMessage({ success: true });
      });
      break;
      
    case 'clearModelCache':
      caches.delete(MODEL_CACHE).then(() => {
        event.ports?.[0]?.postMessage({ success: true });
      });
      break;
      
    case 'getModelCacheSize':
      getModelCacheSize().then((size) => {
        event.ports?.[0]?.postMessage({ size });
      });
      break;
      
    case 'precacheModels':
      if (payload?.urls) {
        precacheModels(payload.urls).then(() => {
          event.ports?.[0]?.postMessage({ success: true });
        });
      }
      break;
      
    case 'getCacheStatus':
      getCacheStatus().then((status) => {
        event.ports?.[0]?.postMessage(status);
      });
      break;
      
    case 'registerPeriodicSync':
      registerPeriodicSync(payload?.tag || 'refresh-cache', payload?.minInterval || 24 * 60 * 60 * 1000);
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

// Get cache status for debugging
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status[name] = keys.length;
  }
  
  return {
    version: CACHE_VERSION,
    caches: status,
    timestamp: Date.now()
  };
}

// Register periodic sync
async function registerPeriodicSync(tag, minInterval) {
  try {
    const registration = await self.registration;
    if ('periodicSync' in registration) {
      await registration.periodicSync.register(tag, { minInterval });
      console.log('[SW] Periodic sync registered:', tag);
    }
  } catch (e) {
    console.log('[SW] Periodic sync not supported');
  }
}

console.log('[SW] Service worker v7 loaded - Full offline support with background sync');
