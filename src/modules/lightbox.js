/** Lightbox: click any [data-lightbox] image to view it large. */

export function initLightbox() {
  const dialog = document.getElementById('lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const img = document.getElementById('lightbox-img');

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-lightbox]');
    if (!trigger) return;
    const src = trigger.getAttribute('data-lightbox') || trigger.currentSrc || trigger.src;
    if (!src) return;
    img.src = src;
    img.alt = trigger.getAttribute('data-lightbox-alt') || trigger.alt || '';
    dialog.showModal();
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('.lightbox-close')) dialog.close();
  });
}
