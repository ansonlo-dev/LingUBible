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
  // Pass-through: no caching, no offline support.
  event.respondWith(fetch(event.request));
});
