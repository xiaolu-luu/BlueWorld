/**
 * createPlayer — shared video player with custom controls:
 * play/pause overlay, seek bar, time readout, speed toggle, frame step,
 * replay and fullscreen. Returns an API the sections can drive.
 */

import { t } from '../i18n.js';

const SPEEDS = [1, 0.5, 2];

export function createPlayer(host, opts = {}) {
  const { src, poster, loop = true, muted = true, caption, onEnded } = opts;

  const root = document.createElement('div');
  root.className = 'media-player';

  const video = document.createElement('video');
  video.src = src;
  if (poster) video.poster = poster;
  video.loop = loop;
  video.muted = muted;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.preload = 'metadata';
  root.append(video);

  // Play overlay
  const overlay = document.createElement('button');
  overlay.type = 'button';
  overlay.className = 'mp-overlay';
  overlay.innerHTML =
    '<span class="mp-play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg></span>';
  overlay.setAttribute('aria-label', t('common.play'));
  overlay.addEventListener('click', () => video.play().catch(() => {}));
  root.append(overlay);

  // Controls
  const controls = document.createElement('div');
  controls.className = 'mp-controls';

  const playBtn = ctrlBtn(
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
    t('common.play'),
  );
  const prevBtn = ctrlBtn(
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM19 5v14L9.5 12z"/></svg>',
    t('common.prevFrame'),
  );
  const nextBtn = ctrlBtn(
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM5 5v14l9.5-7z"/></svg>',
    t('common.nextFrame'),
  );
  const seek = document.createElement('input');
  seek.type = 'range';
  seek.className = 'mp-seek';
  seek.min = 0;
  seek.max = 1000;
  seek.value = 0;
  seek.setAttribute('aria-label', t('common.seek'));
  seek.step = 1;
  const time = document.createElement('span');
  time.className = 'mp-time';
  time.textContent = '0:00 / 0:00';
  const speedBtn = document.createElement('button');
  speedBtn.type = 'button';
  speedBtn.className = 'mp-speed';
  speedBtn.textContent = '1×';
  const fullBtn = ctrlBtn(
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    t('common.fullscreen'),
  );

  controls.append(playBtn, prevBtn, nextBtn, seek, time, speedBtn, fullBtn);
  root.append(controls);

  // Optional caption bar
  if (caption) {
    const bar = document.createElement('div');
    bar.className = 'media-caption';
    bar.innerHTML = `<strong></strong><span class="mono"></span>`;
    root.append(bar);
    const setCaption = (text, right) => {
      bar.querySelector('strong').textContent = text || '';
      bar.querySelector('.mono').textContent = right || '';
    };
    root.setCaption = setCaption;
  }

  let speedIdx = 0;
  let seeking = false;

  function fmt(s) {
    if (!Number.isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function renderTime() {
    time.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
  }

  function renderPlayState() {
    const playing = !video.paused && !video.ended;
    root.classList.toggle('is-playing', playing);
    playBtn.innerHTML = playing
      ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>';
    playBtn.setAttribute('aria-label', playing ? t('common.pause') : t('common.play'));
  }

  function ctrlBtn(svg, label) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mp-btn';
    b.innerHTML = svg;
    b.setAttribute('aria-label', label);
    return b;
  }

  playBtn.addEventListener('click', () => {
    if (video.paused || video.ended) video.play().catch(() => {});
    else video.pause();
  });
  prevBtn.addEventListener('click', () => {
    video.pause();
    video.currentTime = Math.max(0, video.currentTime - 1 / 30);
  });
  nextBtn.addEventListener('click', () => {
    video.pause();
    video.currentTime = Math.min(video.duration || 0, video.currentTime + 1 / 30);
  });
  seek.addEventListener('input', () => {
    seeking = true;
    if (video.duration) video.currentTime = (seek.value / 1000) * video.duration;
  });
  seek.addEventListener('change', () => {
    seeking = false;
  });
  speedBtn.addEventListener('click', () => {
    speedIdx = (speedIdx + 1) % SPEEDS.length;
    video.playbackRate = SPEEDS[speedIdx];
    speedBtn.textContent = `${SPEEDS[speedIdx]}×`;
  });
  fullBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else root.requestFullscreen?.();
  });

  video.addEventListener('play', renderPlayState);
  video.addEventListener('pause', renderPlayState);
  video.addEventListener('ended', () => {
    renderPlayState();
    onEnded?.();
  });
  video.addEventListener('timeupdate', () => {
    if (!seeking && video.duration) seek.value = String(Math.round((video.currentTime / video.duration) * 1000));
    renderTime();
  });
  video.addEventListener('loadedmetadata', renderTime);
  video.addEventListener('error', () => {
    const err = document.createElement('div');
    err.className = 'mp-error';
    err.textContent = t('common.loadError');
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'btn btn-outline btn-sm';
    retry.textContent = t('common.retry');
    retry.addEventListener('click', () => {
      err.remove();
      video.load();
      video.play().catch(() => {});
    });
    err.append(retry);
    root.append(err);
  });

  host.append(root);

  renderPlayState();
  renderTime();

  return {
    root,
    video,
    setSource(nextSrc, { keepTime = false } = {}) {
      const ct = video.currentTime;
      video.src = nextSrc;
      if (keepTime && ct > 0) {
        video.addEventListener(
          'loadedmetadata',
          () => {
            try {
              video.currentTime = ct;
            } catch {
              /* seek not ready — ignore */
            }
          },
          { once: true },
        );
      }
    },
    setLoop(v) {
      video.loop = v;
    },
    play: () => video.play().catch(() => {}),
    pause: () => video.pause(),
    destroy: () => root.remove(),
  };
}
