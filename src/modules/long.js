/**
 * 04 Post-training / long-horizon: sf vs csf comparison pairs.
 * All three scenes share one play/pause/seek state — starting any video
 * plays the whole comparison grid in sync.
 */

import { LONG_ITEMS } from '../data.js';
import { t, onLangChange } from '../i18n.js';

export function initLong() {
  const mount = document.getElementById('long-stage');
  if (!mount) return;

  const videos = [];

  for (const item of LONG_ITEMS) {
    const pair = document.createElement('div');
    pair.className = 'long-pair';

    const inner = document.createElement('div');
    inner.className = 'long-pair-inner';
    const sf = document.createElement('video');
    const csf = document.createElement('video');
    for (const v of [sf, csf]) {
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.preload = 'metadata';
    }
    sf.src = item.sf;
    csf.src = item.csf;
    inner.append(sf, csf);
    stylePair(inner);

    const cap = document.createElement('div');
    cap.className = 'long-pair-caption';
    cap.innerHTML = `<span></span><span class="mono"></span>`;

    pair.append(inner, cap);
    mount.append(pair);

    videos.push(sf, csf);

    const render = () => {
      cap.firstElementChild.textContent = `${t('long.sceneLabel')} ${item.id} — ${t('long.sfLabel')} / ${t('long.csfLabel')}`;
      cap.lastElementChild.textContent = `${item.id}`;
    };
    render();
    onLangChange(render);

    pair.addEventListener('click', () => toggle());
  }

  function stylePair(inner) {
    inner.style.cssText =
      'display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);';
    inner.querySelectorAll('video').forEach((v) => {
      v.style.cssText = 'width:100%;aspect-ratio:16/9;object-fit:cover;background:#0a141c;display:block;';
    });
  }

  function toggle() {
    const anyPlaying = videos.some((v) => !v.paused);
    videos.forEach((v) => (anyPlaying ? v.pause() : v.play().catch(() => {})));
  }

  // Shared progress: seeking any video seeks all.
  videos.forEach((v) => {
    v.addEventListener('timeupdate', () => {
      if (v !== currentLeader) return;
      const time = v.currentTime;
      videos.forEach((other) => {
        if (other !== v && Math.abs(other.currentTime - time) > 0.12) {
          other.currentTime = time;
        }
      });
    });
  });

  let currentLeader = videos[0];
  videos.forEach((v) => {
    v.addEventListener('playing', () => {
      currentLeader = v;
    });
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) videos.forEach((v) => v.play().catch(() => {}));
          else videos.forEach((v) => v.pause());
        }
      },
      { threshold: 0.25 },
    );
    io.observe(mount);
  }
}
