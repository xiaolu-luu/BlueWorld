/*
 * media-cache.js — service worker that caches BlueWorld media assets.
 * Strategy: cache-first for media files, plain network for everything else.
 * Entries are cached lazily as they are fetched, so repeat visits play instantly.
 */

const CACHE = 'blueworld-media-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (!/\.(mp4|webm|m4v|jpe?g|png|svg|json)$/i.test(url.pathname)) return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone()).catch(() => {});
        return fresh;
      } catch {
        return cached || Response.error();
      }
    })(),
  );
});
