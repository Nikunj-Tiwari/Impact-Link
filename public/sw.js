const CACHE_NAME = 'impactlink-v2-killswitch';

// ─── INSTALL: Skip waiting to immediately take over ───────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// ─── ACTIVATE: Nuke all old caches immediately ────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ─── FETCH: Always go to network (bypass cache) ───────────────────────────
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
