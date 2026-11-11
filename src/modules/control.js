/**
 * 02 Control demo: three tabs, one player. Videos auto-advance to the next
 * tab when one ends (until the visitor takes over by clicking a tab).
 */

import { CONTROL_ITEMS, FLAGS } from '../data.js';
import { t, onLangChange } from '../i18n.js';
import { createPlayer } from './player.js';

export function initControl() {
  const mount = document.getElementById('control-demo');
  if (!mount) return;

  const tablist = document.createElement('div');
  tablist.className = 'tabs';
  tablist.setAttribute('role', 'tablist');

  const body = document.createElement('div');
  body.className = 'demo-body';
  const media = document.createElement('div');
  media.className = 'demo-media';
  body.append(media);

  mount.append(tablist, body);

  let autoplay = true; // auto-advance until the user picks a tab
  let visited = false; // has the user switched tabs at least once?

  const player = createPlayer(media, {
    src: CONTROL_ITEMS[0].src,
    poster: CONTROL_ITEMS[0].poster,
    loop: false,
    caption: true,
    onEnded: () => {
      if (!autoplay) return;
      const idx = CONTROL_ITEMS.findIndex((c) => c.controlType === current);
      const next = CONTROL_ITEMS[(idx + 1) % CONTROL_ITEMS.length];
      select(next.controlType);
    },
  });

  const buttons = CONTROL_ITEMS.map((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tab-btn';
    btn.dataset.control = item.controlType;
    btn.addEventListener('click', () => {
      autoplay = false;
      select(item.controlType);
    });
    tablist.append(btn);
    return btn;
  });

  let current = null;

  function renderLang() {
    buttons.forEach((btn) => {
      btn.textContent = t(`control.tab.${btn.dataset.control}`);
    });
    if (current) setCaption();
  }

  function setCaption() {
    const item = CONTROL_ITEMS.find((c) => c.controlType === current);
    player.root.setCaption?.(t('control.caption', { signal: t(`control.tab.${current}`) }), item?.src?.split('/').pop() || '');
  }

  function select(controlType) {
    current = controlType;
    buttons.forEach((btn) => btn.setAttribute('aria-selected', String(btn.dataset.control === controlType)));
    const item = CONTROL_ITEMS.find((c) => c.controlType === controlType);
    player.setSource(item.src);
    player.setLoop(!autoplay);
    setCaption();
    if (visited) player.play();
    visited = true;
  }

  renderLang();
  select(CONTROL_ITEMS[0].controlType);
  onLangChange(renderLang);

  // Play when scrolled into view.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            io.disconnect();
            player.play().catch(() => {});
          }
        }
      },
      { threshold: 0.35 },
    );
    io.observe(mount);
  }

  // Reference-clip notice
  if (FLAGS.showPlaceholderNotes) {
    const note = mount.parentElement.querySelector('[data-ref-note="control"]');
    if (note) note.hidden = false;
  }
}
