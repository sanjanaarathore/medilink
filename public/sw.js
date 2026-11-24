/**
 * @file sw.js
 * @description Production Progressive Web App Service Worker for MediLink Offline.
 * Enforces strict offline-first asset caching, safe application updates,
 * and zero-leak policy (never caches confidential patient records in HTTP cache).
 */

const CACHE_VERSION = 'medilink-v1.0.0';
const STATIC_CACHE_NAME = `medilink-static-${CACHE_VERSION}`;

// Pre-cached core application shell assets
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './favicon.svg',
  './manifest.json',
  './dist/bundle.js',
  './dist/bundle.css'
];

// Install: Pre-cache core shell resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate: Clean up legacy caches and take control of all clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('medilink-') && name !== STATIC_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: Strategic routing
// 1. Navigation requests: Network-First with Cache Fallback -> offline.html
// 2. Static assets (JS, CSS, fonts, SVG): Cache-First with Network Fallback
// 3. API / Clinical requests: Bypass HTTP cache (clinical data lives strictly in IndexedDB)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Strictly NEVER cache sensitive API or clinical paths in HTTP Cache Storage
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/clinical/') || url.pathname.includes('/referrals/')) {
    event.respondWith(fetch(request));
    return;
  }

  // HTML Page Navigation: Network-First with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('./index.html').then((cachedResponse) => {
          return cachedResponse || caches.match('./offline.html');
        });
      })
    );
    return;
  }

  // Static Assets (JS, CSS, images, SVGs, web fonts)
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.json')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached asset immediately
          return cachedResponse;
        }
        // Fetch from network, store in cache, and return
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // If offline and request is an image or SVG, return favicon
          if (request.headers.get('accept')?.includes('image')) {
            return caches.match('./favicon.svg');
          }
        });
      })
    );
    return;
  }

  // Default: Network with Cache Fallback
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

