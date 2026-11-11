/** Sticky header: scroll shadow, read-progress bar, section scroll-spy, mobile drawer. */

import { t } from '../i18n.js';

const SECTIONS = ['overview', 'method', 'control', 'grounding', 'posttraining', 'applications', 'resources'];

function updateProgress() {
  const bar = document.getElementById('read-progress-bar');
  if (!bar) return;
  const doc = document.documentElement;
  const max = doc.scrollHeight - innerHeight;
  const ratio = max > 0 ? Math.min(1, scrollY / max) : 0;
  bar.style.width = `${(ratio * 100).toFixed(2)}%`;
}

function updateSpy() {
  const links = [...document.querySelectorAll('[data-nav]')];
  if (!links.length) return;
  const probe = scrollY + innerHeight * 0.32;
  let active = SECTIONS[0];
  for (const id of SECTIONS) {
    const el = document.getElementById(id);
    if (el && el.offsetTop <= probe) active = id;
  }
  if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4) active = SECTIONS[SECTIONS.length - 1];
  for (const link of links) {
    if (link.dataset.nav === active) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
}

function updateHeader() {
  const header = document.getElementById('site-header');
  header?.classList.toggle('is-scrolled', scrollY > 8);
}

function onScroll() {
  updateProgress();
  updateSpy();
  updateHeader();
}

function closeDrawer(drawer, btn) {
  drawer.hidden = true;
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', t('a11y.menuOpen'));
  document.body.style.overflow = '';
}

export function initNav() {
  const drawer = document.getElementById('drawer');
  const menuBtn = document.getElementById('menu-btn');

  let ticking = false;
  addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
    },
    { passive: true },
  );
  onScroll();

  if (drawer && menuBtn) {
    menuBtn.addEventListener('click', () => {
      const open = drawer.hidden;
      if (open) {
        drawer.hidden = false;
        menuBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      } else {
        closeDrawer(drawer, menuBtn);
      }
    });

    drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => closeDrawer(drawer, menuBtn)));

    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !drawer.hidden) closeDrawer(drawer, menuBtn);
    });

    matchMedia('(min-width: 960px)').addEventListener('change', (e) => {
      if (e.matches) closeDrawer(drawer, menuBtn);
    });
  }
}
