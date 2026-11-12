import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/landing.css';
import './styles/sections.css';

import { initLang, applyLang, setLang } from './i18n.js';
import { FLAGS, REPORT } from './data.js';

import { initNav } from './modules/nav.js';
import { initReveal } from './modules/reveal.js';
import { initLightbox } from './modules/lightbox.js';
import { initTheme } from './modules/theme.js';
import { initLanding } from './modules/landing.js';
import { initMethod } from './modules/method.js';
import { initControl } from './modules/control.js';
import { initWeather } from './modules/weather.js';
import { initGrounding } from './modules/grounding.js';
import { initLong } from './modules/long.js';
import { initRL } from './modules/rl.js';
import { initApplications } from './modules/applications.js';
import { initResources } from './modules/resources.js';
import { registerMediaCacheWorker } from './modules/media-cache.js';

/* ---------- boot ---------- */

initLang();
applyLang();

initTheme();
initNav();
initReveal();
initLightbox();
initLanding();
initMethod();
initControl();
initWeather();
initGrounding();
initLong();
initRL();
initApplications();
initResources();

if (FLAGS.registerMediaCacheWorker) registerMediaCacheWorker();

/* language buttons (header + drawer) */
document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
  btn.addEventListener('click', () => setLang(btn.dataset.langBtn));
});

/* report links share one source of truth */
document.querySelectorAll('.js-report-link').forEach((a) => {
  a.href = REPORT.url;
});
document.querySelector('.js-report-title').textContent = REPORT.title;
document.querySelector('.js-report-meta').textContent = REPORT.meta;
document.querySelector('.js-draft').hidden = !REPORT.isDraft;
