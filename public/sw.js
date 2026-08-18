const CACHE_NAME = 'flowstate-pwa-v5';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  'https://cdn.tailwindcss.com'
];

// Install: Cache critical app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-caching assets failed, continuing:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Remove stale caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Handle navigation and dynamic resources
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Handle SPA navigation requests (PWA launcher / direct link / page reload)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
          // If offline or request fails, serve cached index.html
          const cache = await caches.open(CACHE_NAME);
          return (
            (await cache.match(event.request)) ||
            (await cache.match('./index.html')) ||
            (await cache.match('./')) ||
            (await cache.match('/'))
          );
        })
    );
    return;
  }

  // Handle static assets & API fetches with Stale-While-Revalidate / Cache First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            event.request.url.startsWith('http')
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone).catch(() => {});
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
