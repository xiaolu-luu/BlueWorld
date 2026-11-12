/**
 * 05 Applications:
 *  - dashcam production: player + stats chips
 *  - closed-loop: episode clip beside a BEV canvas that replays the
 *    ground-truth trajectories from media/interaction/bev.json, in sync with
 *    the video clock.
 */

import { DASHCAM, CLOSED_LOOP } from '../data.js';
import { t, onLangChange } from '../i18n.js';
import { createPlayer } from './player.js';

export function initApplications() {
  initDashcam();
  initClosedLoop();
}

function initDashcam() {
  const stage = document.getElementById('dashcam-stage');
  if (!stage) return;

  const player = createPlayer(stage, {
    src: DASHCAM.src,
    poster: DASHCAM.poster,
    loop: true,
    caption: true,
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) player.play();
        else player.pause();
      },
      { threshold: 0.25 },
    );
    observer.observe(stage);
  }

  const meta = document.createElement('div');
  meta.className = 'dashcam-meta';
  const chips = [
    ['frames', DASHCAM.stats.frames],
    ['views', DASHCAM.stats.views],
    ['score', DASHCAM.stats.score],
  ];
  const render = () => {
    meta.replaceChildren();
    for (const [key, value] of chips) {
      const chip = document.createElement('span');
      chip.className = 'dashcam-chip';
      const label = document.createElement('b');
      label.textContent = `${t(`dashcam.chips.${key}`)}: `;
      chip.append(label);
      chip.append(document.createTextNode(String(value)));
      meta.append(chip);
    }
    const layout = document.createElement('span');
    layout.className = 'dashcam-chip';
    layout.innerHTML = `<b>${t('dashcam.chips.layout')}</b> <span class="ok">✓</span>`;
    meta.append(layout);
  };
  render();
  onLangChange(render);
  stage.parentElement.append(meta);
}

function initClosedLoop() {
  const mount = document.getElementById('applications-content');
  if (!mount) return;

  const layout = document.createElement('div');
  layout.className = 'closed-loop-layout';

  const videoCell = document.createElement('div');
  videoCell.className = 'cl-video';

  const bevCell = document.createElement('div');
  bevCell.className = 'cl-bev';
  const bevLabel = document.createElement('span');
  bevLabel.className = 'cl-bev-label';
  const bevCanvas = document.createElement('canvas');
  bevCell.append(bevLabel, bevCanvas);

  layout.append(videoCell, bevCell);
  mount.append(layout);

  const player = createPlayer(videoCell, {
    src: CLOSED_LOOP.clip,
    poster: CLOSED_LOOP.poster,
    loop: true,
    caption: true,
  });

  let data = null;
  let lastFrame = -1;

  const renderLabel = () => {
    bevLabel.textContent = t('closedLoop.bevLabel');
    player.root.setCaption?.(t('closedLoop.episodeLabel'), CLOSED_LOOP.clip.split('/').pop());
  };

  fetch(CLOSED_LOOP.bev)
    .then((r) => {
      if (!r.ok) throw new Error('bev fetch failed');
      return r.json();
    })
    .then((json) => {
      data = normalizeBev(json);
      drawFrame(Math.floor(player.video.currentTime * (data.fps ?? 12)));
    })
    .catch(() => {
      mapFailed = true;
      const note = document.createElement('p');
      note.className = 'demo-hint';
      note.dataset.i18n = 'closedLoop.mapError';
      bevCell.append(note);
      note.textContent = t('closedLoop.mapError');
    });

  renderLabel();
  onLangChange(renderLabel);

  function normalizeBev(json) {
    const episode = json?.avoidance ?? json;
    if (!episode?.frames?.length) throw new Error('bad bev data');
    return episode;
  }

  const ctx = bevCanvas.getContext('2d');

  function resizeBev() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const rect = bevCell.getBoundingClientRect();
    bevCanvas.width = Math.max(1, Math.round(rect.width * dpr));
    bevCanvas.height = Math.max(1, Math.round(rect.height * dpr));
    lastFrame = -1;
  }
  new ResizeObserver(resizeBev).observe(bevCell);

  function drawFrame(idx) {
    if (!data || !ctx) return;
    const i = Math.max(0, Math.min(data.frames.length - 1, idx));
    if (i === lastFrame) return;
    lastFrame = i;

    const W = bevCanvas.width;
    const H = bevCanvas.height;
    const s = Math.min(W / 220, H / 440);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#101e26';
    ctx.fillRect(0, 0, W, H);
    ctx.setTransform(s, 0, 0, s, (W - 220 * s) / 2, (H - 440 * s) / 2);

    const frame = data.frames[i];
    // world (x forward, y lateral) → 220x440 BEV canvas units, ego near the bottom
    const toXY = (p) => [110 - p[1] * 4, 400 - p[0] * 4];

    // lane lines
    ctx.strokeStyle = '#243a49';
    ctx.lineWidth = 0.8;
    for (const lane of frame.lanes ?? []) {
      ctx.beginPath();
      lane.forEach((p, j) => {
        const [x, y] = toXY(p);
        j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.stroke();
    }

    // actors
    for (const a of frame.actors ?? []) {
      const [x, y] = toXY(a);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-(a[4] ?? 0));
      ctx.fillStyle = '#60778480';
      ctx.fillRect(-(a[2] ?? 2) * 1.5, -(a[3] ?? 4) * 1.5, (a[2] ?? 2) * 3, (a[3] ?? 4) * 3);
      ctx.restore();
    }

    // ego paths: solid history, dashed future
    const colors = ['#58d5c0', '#ffb66b'];
    data.paths.forEach((path, k) => {
      const cur = path[i];
      if (!cur) return;
      const [ex, ey] = toXY(cur);
      ctx.strokeStyle = colors[k];
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      let started = false;
      for (let j = i; j < path.length; j++) {
        const [x, y] = toXY(path[j]);
        started ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        started = true;
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // ego marker
      ctx.fillStyle = colors[k];
      ctx.fillRect(ex - 3.4, ey - 3.4, 6.8, 6.8);
    });
  }

  // keep BEV in sync with the video clock
  let raf = null;
  const tick = () => {
    if (data && !player.video.paused) {
      drawFrame(Math.floor(player.video.currentTime * (data.fps ?? 12)));
    }
    if (!player.video.paused) raf = requestAnimationFrame(tick);
    else raf = null;
  };
  player.video.addEventListener('play', () => {
    if (!raf) raf = requestAnimationFrame(tick);
  });
  player.video.addEventListener('seeked', () => {
    if (data) drawFrame(Math.floor(player.video.currentTime * (data.fps ?? 12)));
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) player.play();
          else player.pause();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(videoCell);
  }
}
