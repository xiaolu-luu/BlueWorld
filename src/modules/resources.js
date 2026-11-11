/**
 * 06 Resources: report card (driven by REPORT in data.js), resource links,
 * related work list, and a BibTeX block with copy-to-clipboard.
 */

import { REPORT, RESOURCE_LINKS, RELATED } from '../data.js';
import { t, onLangChange } from '../i18n.js';

export function initResources() {
  const links = document.getElementById('res-links');
  const related = document.getElementById('related-list');
  const citeBlock = document.getElementById('cite-block');
  if (!links || !related) return;

  /* resource links */
  for (const item of RESOURCE_LINKS) {
    const a = document.createElement('a');
    a.className = 'res-link';
    a.dataset.key = item.key;
    if (item.href) {
      a.href = item.href;
      a.target = '_blank';
      a.rel = 'noopener';
    } else {
      a.dataset.disabled = 'true';
      a.setAttribute('aria-disabled', 'true');
    }
    links.append(a);
  }

  /* related work */
  for (const item of RELATED) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.href;
    if (/^https?:/.test(item.href)) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    const title = document.createElement('span');
    const src = document.createElement('span');
    src.className = 'related-src';
    a.append(title, src);
    li.append(a);
    related.append(li);
    li._render = () => {
      title.textContent = item.title;
      src.textContent = item.src;
    };
    li._render();
  }

  /* cite block */
  if (citeBlock) {
    citeBlock.hidden = false;
    const text = document.getElementById('cite-text');
    const copyBtn = document.getElementById('cite-copy');
    text.textContent = REPORT.bibtex;
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(REPORT.bibtex);
      } catch {
        // Fallback for non-secure contexts.
        const sel = document.getSelection();
        const range = document.createRange();
        range.selectNodeContents(text);
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand?.('copy');
        sel.removeAllRanges();
      }
      const prev = copyBtn.textContent;
      copyBtn.textContent = t('resources.copied');
      setTimeout(() => {
        copyBtn.textContent = prev;
      }, 1600);
    });
  }

  const render = () => {
    links.querySelectorAll('.res-link').forEach((a) => {
      const key = a.dataset.key;
      a.textContent = a.dataset.disabled === 'true'
        ? `${t(`resources.links.${key}`)} · ${t('resources.links.soon')}`
        : t(`resources.links.${key}`);
    });
    related.querySelectorAll('li').forEach((li) => li._render?.());
  };
  render();
  onLangChange(render);
}
