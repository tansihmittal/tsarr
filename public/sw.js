const CACHE_NAME = 'tsarr-v2';
const STATIC_CACHE = 'tsarr-static-v2';
const DYNAMIC_CACHE = 'tsarr-dynamic-v2';

// Core pages to pre-cache for offline use
const CORE_PAGES = [
  '/',
  '/app',
  '/tools',
  '/editor',
  '/code',
  '/blog',
  '/offline.html'
];

// All tool pages
const TOOL_PAGES = [
  '/tool/screenshot-editor',
  '/tool/code-screenshots',
  '/tool/text-behind-image',
  '/tool/video-captions',
  '/tool/tweet-editor',
  '/tool/carousel-editor',
  '/tool/aspect-ratio-converter',
  '/tool/image-resizer',
  '/tool/image-converter',
  '/tool/clipboard-saver',
  '/tool/video-converter',
  '/tool/chart-maker',
  '/tool/map-maker',
  '/tool/3d-globe',
  '/tool/polaroid-generator',
  '/tool/watermark-remover',
  '/tool/text-to-speech',
  '/tool/image-text-editor',
  '/tool/bubble-blaster',
  // Direct tool routes
  '/text-behind-image',
  '/captions',
  '/tweet',
  '/carousel',
  '/aspect-ratio',
  '/resize',
  '/convert',
  '/clipboard',
  '/video-convert',
  '/chart',
  '/map',
  '/globe',
  '/polaroid',
  '/watermark-remover',
  '/tts',
  '/image-text-editor',
  '/bubble-blaster'
];

// Static assets
const STATIC_ASSETS = [
  '/favicon.ico',
  '/favicon.png',
  '/favicon-192x192.png',
  '/favicon-512x512.png',
  '/site.webmanifest',
  '/images/noise.png',
  '/images/editor-preview.png'
];

// Install - pre-cache all core content
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
      caches.open(CACHE_NAME).then((cache) => cache.addAll([...CORE_PAGES, ...TOOL_PAGES]))
    ]).catch((err) => {
      console.log('Pre-cache failed for some resources:', err);
      // Still cache what we can
      return caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_PAGES));
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy: Cache-first for static, Network-first for pages
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests (except fonts)
  if (!url.origin.includes(self.location.origin) && !url.hostname.includes('fonts.googleapis.com') && !url.hostname.includes('fonts.gstatic.com')) {
    return;
  }

  // Cache-first for static assets (images, fonts, etc.)
  if (request.destination === 'image' || request.destination === 'font' || url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ico)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => {
          // Return placeholder for images if offline
          if (request.destination === 'image') {
            return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f0f0f0" width="100" height="100"/></svg>', {
              headers: { 'Content-Type': 'image/svg+xml' }
            });
          }
        });
      })
    );
    return;
  }

  // Network-first for HTML pages, cache as fallback
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Stale-while-revalidate for JS/CSS
  if (request.destination === 'script' || request.destination === 'style' || url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default: network with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    // Handle background sync
  }
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  // Force cache refresh
  if (event.data === 'clearCache') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});
