/* Dino Dominion — online-first PWA safety patch (October 2026).
 * The game requires the network for Cloud Kingdom, battles, chat and purchases.
 * Cache ONLY the offline explanation page. Game JS/CSS must not be held on an
 * older release by a cache-first service worker; the browser manages ordinary
 * HTTP caching of these files (including their ?v= release parameters).
 *
 * IMPORTANT: Don't force skipWaiting() during active battles/cloud saves.
 * A new worker activates after existing controlled pages have closed.
 */
'use strict';

const OWN_CACHE_PREFIX = 'dd-worldwide-';
const OFFLINE_CACHE = 'dd-worldwide-offline-1100';
const OFFLINE_URL = new URL('./offline.html', self.registration.scope).href;
const SCOPE_URL = new URL(self.registration.scope);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(OFFLINE_CACHE);
    // Installation must fail safely if the offline fallback is unavailable.
    // The previous worker remains installed rather than switching to a broken one.
    await cache.add(OFFLINE_URL);
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith(OWN_CACHE_PREFIX) && name !== OFFLINE_CACHE)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.mode !== 'navigate') return;

  const url = new URL(request.url);
  if (url.origin !== SCOPE_URL.origin || !url.pathname.startsWith(SCOPE_URL.pathname)) return;

  // Network-first navigation; no HTML, JS, CSS, API, or payment response caching.
  event.respondWith((async () => {
    try {
      return await fetch(request);
    } catch (_) {
      const cache = await caches.open(OFFLINE_CACHE);
      return (await cache.match(OFFLINE_URL)) || Response.error();
    }
  })());
});
