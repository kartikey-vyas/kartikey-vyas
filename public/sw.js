// Service worker for Tabby PWA.
// Strategy: network-first for pages/API (always fresh data), cache-first
// for static assets (JS/CSS/images). Offline fallback shows a simple page.

const CACHE_NAME = "tabby-v1";

// Static assets to pre-cache on install.
const PRECACHE = ["/", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Clean up old caches.
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Static assets (JS, CSS, images, fonts) → cache-first.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Pages and API → network-first, fall back to cache.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() =>
        caches.match(request).then(
          (cached) =>
            cached ||
            new Response(
              "<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width'><title>Tabby</title></head>" +
                "<body style='font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100dvh;margin:0;background:#f8fafc'>" +
                "<div style='text-align:center;padding:2rem'><h1 style='font-size:2rem;margin:0'>Tabby</h1>" +
                "<p style='color:#64748b;margin-top:.5rem'>You're offline. Connect to the internet and try again.</p></div></body></html>",
              { headers: { "Content-Type": "text/html" } }
            )
        )
      )
  );
});
