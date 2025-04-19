const CACHE_NAME = "liquoly-cache-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE_ASSETS = [
  "/", // Home
  "/collections/all",
  OFFLINE_URL,
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install event: precache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch event: Network First strategy
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ignorar peticiones al checkout o admin
  if (url.pathname.startsWith("/checkout") || url.pathname.startsWith("/admin"))
    return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then((cached) => cached || caches.match(OFFLINE_URL))
      )
  );
});
