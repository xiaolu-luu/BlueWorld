/**
 * 03 Grounding: three groups — reference frames, 3DGS renders, point cloud.
 * Each group is a gallery of small players; the reference group additionally
 * renders condition-vs-generation pairs for the G-scenes.
 */

import { GROUNDING_CAMS, GROUNDING_SCENES, GROUNDING_3DGS } from '../data.js';
import { t, onLangChange } from '../i18n.js';
import { createPlayer } from './player.js';

function groupShell(mount, key) {
  const section = document.createElement('section');
  section.className = 'grounding-group';
  section.dataset.category = key;

  const head = document.createElement('header');
  head.className = 'grounding-group-head';
  const h3 = document.createElement('h3');
  h3.dataset.i18n = `grounding.tab.${key}`;
  const summary = document.createElement('p');
  summary.className = 'grounding-group-summary';
  summary.dataset.i18n = `grounding.gallery.${key}.summary`;
  head.append(h3, summary);

  const videos = document.createElement('div');
  videos.className = 'grounding-videos';

  const footnote = document.createElement('p');
  footnote.className = 'grounding-footnote';
  footnote.dataset.i18n = `grounding.gallery.${key}.footnote`;

  section.append(head, videos, footnote);
  mount.append(section);
  return { section, videos };
}

function conditionGallery(videos) {
  // One representative pair per scene: condition cam0 vs generated cam0.
  for (const scene of GROUNDING_SCENES) {
    const cam = GROUNDING_CAMS[0];
    const cell = document.createElement('div');
    cell.className = 'grounding-pair';

    const pair = document.createElement('div');
    pair.className = 'pair-stack';
    const cond = document.createElement('div');
    const gen = document.createElement('div');
    pair.append(cond, gen);

    const cap = document.createElement('p');
    cap.className = 'grounding-pair-cap';

    cell.append(pair, cap);
    videos.append(cell);

    createPlayer(cond, { src: `${scene.base}/condition_cam${cam}.mp4`, loop: true });
    createPlayer(gen, { src: `${scene.base}/generated_cam${cam}.mp4`, loop: true });

    const render = () => {
      cap.textContent = `${t('grounding.condition')} → ${t('grounding.generated')} · ${scene.id} · cam ${cam}`;
    };
    render();
    onLangChange(render);
  }
}

function gallery(videos, items, labelKey) {
  for (const item of items) {
    const cell = document.createElement('div');
    videos.append(cell);
    const player = createPlayer(cell, { src: item.src, loop: true });
    const cap = document.createElement('p');
    cap.className = 'grounding-pair-cap';
    cap.style.cssText = 'font-size:12.5px;color:var(--text-3);margin-top:6px;';
    cell.append(cap);
    const render = () => {
      cap.textContent = `${t(labelKey)} · ${item.src.split('/').pop()}`;
    };
    render();
    onLangChange(render);
    cell._player = player;
  }
}

export function initGrounding() {
  const mount = document.getElementById('grounding-demo');
  if (!mount) return;

  const ref = groupShell(mount, 'reference_images');
  const gs = groupShell(mount, 'threeDGS');
  const pc = groupShell(mount, 'pointcloud');

  conditionGallery(ref.videos);
  gallery(gs.videos, GROUNDING_3DGS, 'grounding.generated');

  // Point-cloud group reuses the G-scene condition streams (RGB + depth premise).
  gallery(
    pc.videos,
    GROUNDING_SCENES.map((s) => ({
      src: `${s.base}/condition_cam${GROUNDING_CAMS[1]}.mp4`,
    })),
    'grounding.condition',
  );

  // Autoplay every gallery video when it enters the viewport.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target.querySelector('video');
          if (!video) continue;
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        }
      },
      { threshold: 0.3 },
    );
    mount.querySelectorAll('.grounding-videos > div').forEach((cell) => io.observe(cell));
  }
}
