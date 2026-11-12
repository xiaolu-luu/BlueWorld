/**
 * Landing sequence: seven synchronized camera views, each with GT, HDMap and
 * prediction layers. A shared video clock drives every visual transition so
 * the three representations blend without source swaps or black frames.
 */

import { LANDING } from '../data.js';
import { t } from '../i18n.js';

const KINDS = ['gt', 'hdmap', 'pred'];

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

function transitionState(time, reducedMotion) {
  const state = Object.fromEntries(KINDS.map((kind) => [kind, { opacity: 0, blur: 0, scale: 1 }]));
  let phase = 'gt';
  let transition = 0;

  const hold = (kind) => {
    state[kind].opacity = 1;
    phase = kind;
  };

  const blend = (from, to, start, end) => {
    const progress = smoothstep((time - start) / (end - start));
    const incoming = state[to];
    const outgoing = state[from];
    outgoing.opacity = 1 - progress;
    incoming.opacity = progress;
    transition = Math.sin(Math.PI * progress);
    phase = progress < 0.5 ? from : to;

    if (!reducedMotion) {
      outgoing.blur = progress * 7;
      outgoing.scale = 1 + progress * 0.025;
      incoming.blur = (1 - progress) * 9;
      incoming.scale = 0.985 + progress * 0.015;
    }
  };

  if (time < 1.5) hold('gt');
  else if (time < 3) blend('gt', 'hdmap', 1.5, 3);
  else if (time < 4) hold('hdmap');
  else if (time < 5.5) blend('hdmap', 'pred', 4, 5.5);
  else if (time < 25.5) hold('pred');
  else blend('pred', 'gt', 25.5, LANDING.duration);

  return { state, phase, transition };
}

export function initLanding() {
  const stage = document.getElementById('landing-stage');
  const wrap = document.getElementById('landing-views');
  if (!stage || !wrap) return;

  const landing = stage.closest('.landing');
  const errorEl = document.getElementById('landing-error');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const phaseEls = [...stage.querySelectorAll('[data-landing-phase]')];
  const videos = [];
  let master;

  const tiles = LANDING.views.map((view, index) => {
    const figure = document.createElement('figure');
    figure.className = `landing-view landing-view-${view.position}`;
    figure.style.setProperty('--view-index', index);
    figure.setAttribute('aria-label', t('landing.viewLabel', { n: index + 1 }));

    const poster = document.createElement('img');
    poster.src = view.poster;
    poster.alt = '';
    poster.decoding = 'async';
    poster.fetchPriority = index === 0 ? 'high' : 'low';
    figure.append(poster);

    for (const kind of KINDS) {
      const video = document.createElement('video');
      video.className = `landing-media landing-media-${kind}`;
      video.src = view.sources[kind];
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.disablePictureInPicture = true;
      video.preload = kind === 'gt' ? 'auto' : 'metadata';
      video.setAttribute('playsinline', '');
      video.setAttribute('aria-hidden', 'true');
      video.tabIndex = -1;

      video.addEventListener('loadeddata', () => {
        if (kind === 'gt') figure.classList.add('is-ready');
        if (kind === 'gt' && index === 0) landing.classList.add('has-frames');
      });
      video.addEventListener('error', () => {
        if (kind === 'gt') figure.classList.add('has-media-error');
        if (video === master && errorEl) {
          errorEl.textContent = t('landing.loadError');
          errorEl.hidden = false;
        }
      });

      figure.append(video);
      videos.push(video);
      if (kind === 'gt' && index === 0) master = video;
    }

    wrap.append(figure);
    return figure;
  });

  let activated = false;
  let inView = false;
  let rafId = null;
  let currentPhase = '';
  let lastSyncAt = 0;

  function render(time) {
    const timeline = transitionState(time % LANDING.duration, reducedMotion.matches);

    for (const kind of KINDS) {
      const values = timeline.state[kind];
      stage.style.setProperty(`--${kind}-opacity`, values.opacity.toFixed(4));
      stage.style.setProperty(`--${kind}-blur`, `${values.blur.toFixed(2)}px`);
      stage.style.setProperty(`--${kind}-scale`, values.scale.toFixed(4));
    }
    stage.style.setProperty('--copy-blur', reducedMotion.matches ? '0px' : `${(timeline.transition * 0.45).toFixed(2)}px`);
    stage.style.setProperty('--copy-opacity', (1 - timeline.transition * 0.06).toFixed(3));
    stage.classList.toggle('is-transitioning', timeline.transition > 0.05);

    if (timeline.phase !== currentPhase) {
      currentPhase = timeline.phase;
      stage.dataset.phase = currentPhase;
      for (const item of phaseEls) item.classList.toggle('is-active', item.dataset.landingPhase === currentPhase);
    }
  }

  function synchronize(now) {
    if (!master || master.readyState < 2 || now - lastSyncAt < 500) return;
    lastSyncAt = now;
    const masterTime = master.currentTime;

    for (const video of videos) {
      if (video === master || video.readyState < 2) continue;
      const drift = video.currentTime - masterTime;
      if (Math.abs(drift) > 0.14) {
        video.currentTime = masterTime;
        video.playbackRate = 1;
      } else {
        video.playbackRate = Math.min(1.025, Math.max(0.975, 1 - drift * 0.12));
      }
      if (video.paused && inView && !document.hidden) video.play().catch(() => {});
    }
  }

  function tick(now) {
    rafId = null;
    if (!master || master.paused || !inView || document.hidden) return;
    render(master.currentTime);
    synchronize(now);
    rafId = requestAnimationFrame(tick);
  }

  function startTicking() {
    if (rafId === null) rafId = requestAnimationFrame(tick);
  }

  function stopTicking() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
  }

  async function playAll() {
    if (!activated || !inView || document.hidden) return;
    const results = await Promise.allSettled(videos.map((video) => video.play()));
    if (results.every((result) => result.status === 'rejected') && errorEl) {
      errorEl.textContent = t('landing.loadError');
      errorEl.hidden = false;
    } else if (errorEl) {
      errorEl.hidden = true;
    }
    startTicking();
  }

  function pauseAll() {
    videos.forEach((video) => video.pause());
    stopTicking();
  }

  function activate() {
    if (activated) return;
    activated = true;
    for (const video of videos) {
      video.preload = 'auto';
      video.load();
    }
    playAll();
  }

  render(0);
  requestAnimationFrame(() => landing.classList.add('is-visible'));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) {
          activate();
          playAll();
        } else if (activated) {
          pauseAll();
        }
      },
      { threshold: 0.08 },
    );
    observer.observe(stage);
  } else {
    inView = true;
    activate();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseAll();
    else if (inView) playAll();
  });

  master?.addEventListener('play', startTicking);
  master?.addEventListener('seeked', () => render(master.currentTime));

  document.getElementById('landing-expand')?.addEventListener('click', () => {
    document.getElementById('overview')?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  });
  document.getElementById('landing-scroll')?.addEventListener('click', () => {
    document.getElementById('overview')?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  });

  return { tiles, videos };
}
