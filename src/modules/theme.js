const KEY = 'bw.theme';

function currentTheme() {
  return document.documentElement.dataset.theme || 'light';
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#070b11' : '#ffffff';
  const btn = document.getElementById('theme-btn');
  if (btn) btn.setAttribute('aria-pressed', String(theme === 'dark'));
}

export function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    /* private mode */
  }
  const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));

  const btn = document.getElementById('theme-btn');
  btn?.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  });

  document.querySelectorAll('meta[name="color-scheme"]').forEach((m) => {
    m.setAttribute('content', 'light dark');
  });
}
