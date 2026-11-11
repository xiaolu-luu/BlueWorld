/**
 * Landing stage: one hidden <video> source, seven <canvas> tiles that each draw
 * their own crop of the current frame — fully synchronized by construction.
 * The stage plays `opening` first, then switches to `synchronized` once the
 * visitor has scrolled a little past the top (mirroring the reference behaviour).
 */

import { LANDING } from '../data.js';
import { t } from '../i18n.js';

export function initLanding() {
  const stage = document.getElementById('landing-stage');
  const wrap = document.getElementById('landing-views');
  if (!stage || !wrap) return;

  const errorEl = document.getElementById('landing-error');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const isMobile = matchMedia('(max-width: 959px)');

  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'none';
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.tabIndex = -1;
  video.className = 'landing-source';

  const tiles = LANDING.views.map((view, index) => {
    const figure = document.createElement('figure');
    figure.className = `landing-view landing-view-${view.side}`;
    figure.dataset.view = view.id;
    figure.setAttribute('aria-label', t('landing.viewLabel', { n: view.id }));

    const poster = document.createElement('img');
    poster.alt = '';
    poster.decoding = 'async';
    if (index === 0) poster.src = view.poster;
    poster.fetchPriority = index === 0 ? 'high' : 'low';

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');

    figure.append(poster, canvas);
    wrap.append(figure);
    return { ...view, figure, canvas, poster };
  });

  stage.append(video);

  let activated = false; // user has interacted / scrolled far enough
  let source = null; // 'opening' | 'sync'
  let rafId = null;
  let hasFrames = false;
  let hasSideFrames = false;
  const hasRVFC = 'requestVideoFrameCallback' in video;

  function draw() {
    if (video.readyState < 2) return;
    const full = source === LANDING.src;
    for (const tile of tiles) {
      const crop = full ? tile.crop : [0, 0, video.videoWidth, video.videoHeight];
      const [sx, sy, sw, sh] = crop;
      if (sw === 0 || sh === 0) continue;
      if (tile.canvas.width !== sw || tile.canvas.height !== sh) {
        tile.canvas.width = sw;
        tile.canvas.height = sh;
      }
      const ctx = tile.canvas.getContext('2d', { alpha: false });
      if (ctx) ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
    }
    const landing = stage.closest('.landing');
    if (!hasFrames) {
      hasFrames = true;
      landing.classList.add('has-frames');
    }
    if (full && !hasSideFrames) {
      hasSideFrames = true;
      landing.classList.add('has-side-frames');
    }
  }

  function stopLoop() {
    if (rafId === null) return;
    if (hasRVFC) video.cancelVideoFrameCallback(rafId);
    else cancelAnimationFrame(rafId);
    rafId = null;
  }

  function loop() {
    if (rafId !== null || video.paused) return;
    const next = () => {
      rafId = null;
      draw();
      loop();
    };
    rafId = hasRVFC ? video.requestVideoFrameCallback(next) : requestAnimationFrame(next);
  }

  function showError() {
    if (errorEl) {
      errorEl.textContent = t('landing.loadError');
      errorEl.hidden = false;
    }
  }

  /** Which source should be playing right now? */
  function wantedSource() {
    const scrolled = scrollY > viewportFrac() && !isMobile.matches;
    return scrolled ? LANDING.src : LANDING.openingSrc;
  }

  function viewportFrac() {
    return Math.max(1, stage.offsetHeight * 0.12);
  }

  function syncSource() {
    const wanted = wantedSource();
    if (wanted === source) return;
    const rect = stage.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= innerHeight) return; // off-screen: skip work
    const time = video.currentTime;
    source = wanted;
    stopLoop();
    video.src = source;
    if (time > 0.1) video.currentTime = time;
    video.play().then(loop).catch(() => {});
  }

  video.addEventListener('loadeddata', () => {
    if (errorEl) errorEl.hidden = true;
    draw();
  });
  video.addEventListener('seeked', draw);
  video.addEventListener('play', loop);
  video.addEventListener('pause', stopLoop);
  video.addEventListener('error', () => {
    if (!source) return;
    showError();
  });

  function activate() {
    if (activated) return;
    activated = true;
    source = LANDING.openingSrc;
    video.src = source;
    video.play().then(loop).catch(() => {
      // Autoplay refused — retry muted (already muted, some browsers still need a tick).
      setTimeout(() => video.play().then(loop).catch(showError), 400);
    });
  }

  // Start when the landing first becomes visible.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            io.disconnect();
            activate();
          }
        }
      },
      { threshold: 0.2 },
    );
    io.observe(stage);
  } else {
    activate();
  }

  const markVisible = () => stage.closest('.landing').classList.toggle('is-visible', true);
  requestAnimationFrame(markVisible);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      video.pause();
    } else if (activated && !reducedMotion.matches) {
      syncSource();
      video.play().then(loop).catch(() => {});
    }
  });

  let scrollTick = false;
  addEventListener(
    'scroll',
    () => {
      if (scrollTick) return;
      scrollTick = true;
      requestAnimationFrame(() => {
        scrollTick = false;
        if (activated) syncSource();
      });
    },
    { passive: true },
  );

  // Expand button scrolls to the overview section.
  document.getElementById('landing-expand')?.addEventListener('click', () => {
    document.getElementById('overview')?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  });
  document.getElementById('landing-scroll')?.addEventListener('click', () => {
    document.getElementById('overview')?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  });

  // Side posters load lazily: only the main tile's poster is fetched up front.
  let sidePostersLoaded = false;
  function loadSidePosters() {
    if (sidePostersLoaded) return;
    sidePostersLoaded = true;
    tiles.slice(1).forEach((tile) => {
      tile.poster.src = tile.posterSrc;
    });
  }
  tiles.forEach((tile, i) => {
    tile.posterSrc = LANDING.views[i].poster;
    if (i > 0) tile.poster.removeAttribute('src');
  });
  addEventListener(
    'scroll',
    () => {
      if (scrollY > 40) loadSidePosters();
    },
    { passive: true, once: true },
  );
  setTimeout(loadSidePosters, 2500); // fallback
}
