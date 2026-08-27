const CACHE_SHELL = 'gym-shell-v2';
const CACHE_API = 'gym-api-v1';
const CACHE_FONTS = 'gym-fonts-v1';

const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
];

// Pre-cache static assets at install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then((c) => c.addAll(SHELL)),
  );
  self.skipWaiting();
});

// Clean old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_SHELL && k !== CACHE_API && k !== CACHE_FONTS)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

// ---------- Fetch strategies ----------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin
  if (url.origin !== location.origin) return;

  // API requests: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    // Never cache auth endpoints
    if (url.pathname.includes('/auth/')) return;

    event.respondWith(networkFirstAPI(request));
    return;
  }

  // Font files: cache-first (immutable)
  if (/\.(woff2?|ttf|eot)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE_FONTS));
    return;
  }

  // Static assets (JS, CSS, images): cache-first
  if (/\.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE_SHELL));
    return;
  }

  // Navigation: network-first, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Everything else: cache-first
  event.respondWith(cacheFirst(request, CACHE_SHELL));
});

// ---------- Strategy: Network-first for API ----------
async function networkFirstAPI(request) {
  const cache = await caches.open(CACHE_API);
  try {
    const response = await fetch(request);
    // Cache successful GET responses (don't cache mutations)
    if (request.method === 'GET' && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Network failed — try cache
    const cached = await cache.match(request);
    if (cached) return cached;
    // Return a generic offline response
    return new Response(
      JSON.stringify({ message: 'Sin conexión', offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

// ---------- Strategy: Network-first for navigation ----------
async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    // Cache the index.html for offline SPA fallback
    const cache = await caches.open(CACHE_SHELL);
    cache.put('/index.html', response.clone());
    return response;
  } catch {
    const cached = await caches.match('/index.html');
    if (cached) return cached;
    return new Response('Sin conexión', { status: 503 });
  }
}

// ---------- Strategy: Cache-first ----------
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
  } catch {
    return new Response('', { status: 503 });
  }
}

// ---------- Background Sync ----------
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(syncPendingRequests());
  }
});

async function syncPendingRequests() {
  // Notify the main thread to process the sync queue
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_REQUESTED' });
  });
}

// ---------- Push notifications (future) ----------
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Gym', {
      body: data.body || '',
      icon: '/icon.svg',
      badge: '/icon.svg',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/'));
});
