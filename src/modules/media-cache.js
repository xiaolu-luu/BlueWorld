/**
 * Registers the media-cache service worker (public/media-cache.js), which
 * caches video/poster assets as they are fetched so repeat visits play
 * instantly. Skipped when data-saver is on or the browser lacks SW support.
 */

export function registerMediaCacheWorker() {
  if (!('serviceWorker' in navigator) || !window.caches) return;
  if (navigator.connection?.saveData) return;

  navigator.serviceWorker.register('./media-cache.js').catch(() => {
    /* non-fatal: the site works without the cache */
  });
}
