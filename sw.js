const CACHE = 'flansch-scanner-v' + Date.now();
const ASSETS = [
  './index.html',
  './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: immer frisch laden, Cache nur als Fallback
self.addEventListener('fetch', e => {
  if (e.request.url.includes('unpkg.com')) {
    // Externe Bibliothek: Cache-first (ändert sich nicht)
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return response;
      }))
    );
  } else {
    // Eigene Dateien: immer Network-first
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  }
});
