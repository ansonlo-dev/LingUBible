// Minimal Service Worker for LingUBible
// IMPORTANT: This SW is intentionally cache-free. The project's free-plan request
// quota was previously blown by background-refresh loops; we never want a SW
// caching layer that quietly re-fetches in the background. This SW exists only
// to satisfy the PWA install criteria (a registered SW with a fetch handler),
// so it just passes every request straight through to the network.

self.addEventListener('install', () => {
  // Activate immediately on first install so the page becomes installable
  // without requiring a manual reload.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Only intercept same-origin GET requests. We deliberately DON'T touch:
  //  - non-GET requests,
  //  - cross-origin requests (e.g. Appwrite, embedded audio on gochi.ln.edu.hk),
  //  - range requests (media streaming).
  // Re-issuing a cross-origin media *range* request from inside the SW
  // (event.respondWith(fetch(req))) makes <audio>/<video> fail with a
  // "network error response: the promise was rejected". By returning without
  // calling respondWith, the browser handles those itself (native range /
  // streaming), which is exactly what media playback needs. The handler still
  // exists, so PWA installability is unaffected.
  if (
    req.method !== 'GET' ||
    new URL(req.url).origin !== self.location.origin ||
    req.headers.has('range')
  ) {
    return;
  }
  // Pass-through: no caching, no offline support.
  event.respondWith(fetch(req));
});
