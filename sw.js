const CACHE_NAME = 'edunexus-v2';
const STATIC_CACHE = 'edunexus-static-v2';
const DYNAMIC_CACHE = 'edunexus-dynamic-v2';

const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/router.js',
  '/js/data.js',
  '/js/settings.js',
  '/js/screenreader.js',
  '/js/db.js',
  '/js/offline.js',
  '/js/lazy.js',
  '/js/supabase.js',
  '/js/eduInsights.js',
  '/js/recommendations.js',
  '/js/native.js',
  '/js/animations.js',
  '/js/accessibility.js',
  '/js/personality.js',
  '/js/utils/sanitize.js',
  '/js/utils/errorHandler.js',
  '/js/utils/validation.js',
  '/manifest.json'
];

const allowedVideoOrigins = [
  'https://www.w3schools.com',
  'https://via.placeholder.com'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
        .map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  if (url.pathname.endsWith('.mp4') || url.pathname.includes('/video/')) {
    const isAllowedOrigin = allowedVideoOrigins.some(origin => url.origin === origin);
    if (isAllowedOrigin || url.origin === self.location.origin) {
      event.respondWith(
        fetch(event.request)
          .then(response => {
            const cloned = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, cloned));
            return response;
          })
          .catch(() => caches.match(event.request))
      );
      return;
    }
  }
  
  if (url.origin !== self.location.origin && 
      !url.href.includes('fonts.googleapis.com') &&
      !url.href.includes('cdnjs.cloudflare.com')) {
    return;
  }
  
  if (urlsToCache.some(asset => url.pathname === asset)) {
    event.respondWith(
      caches.match(event.request).then(response => response || fetch(event.request))
    );
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        const responseToCache = networkResponse.clone();
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => null);
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});