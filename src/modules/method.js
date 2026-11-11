/**
 * Method figure: a small interactive architecture diagram.
 * Four conditioning routes (dashcam / reference frames / 3DGS / point cloud);
 * selecting one highlights the path evidence takes through the stack.
 */

import { t, onLangChange } from '../i18n.js';

const ROUTES = ['dashcam', 'reference', 'threeDGS', 'pointcloud'];

export function initMethod() {
  const mount = document.getElementById('method-figure');
  const detailsMount = document.getElementById('foundation-details');
  if (!mount) return;

  const frame = document.createElement('div');
  frame.className = 'method-figure';

  // Route selector
  const routeBar = document.createElement('div');
  routeBar.className = 'mf-routes';
  routeBar.setAttribute('role', 'tablist');

  const canvas = document.createElement('div');
  canvas.className = 'mf-canvas';

  const note = document.createElement('p');
  note.className = 'mf-note';

  frame.append(routeBar, canvas, note);
  mount.append(frame);

  const buttons = ROUTES.map((route) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mf-route';
    btn.dataset.route = route;
    btn.setAttribute('role', 'tab');
    btn.addEventListener('click', () => select(route));
    routeBar.append(btn);
    return btn;
  });

  function renderLang() {
    buttons.forEach((btn) => {
      btn.textContent = t(`method.routes.${btn.dataset.route}`);
    });
  }

  function buildDiagram(route) {
    // A simple three-column SVG: evidence → interface → core → output.
    const W = 960;
    const H = 320;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'mf-svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('role', 'img');

    const boxes = [
      { x: 24, w: 190, label: t('method.fig.sceneEvidence'), sub: routeLabel(route) },
      { x: 270, w: 190, label: t('method.fig.conditioning'), sub: t('method.fig.inject') },
      { x: 516, w: 190, label: t('method.fig.core'), sub: t('method.fig.crossView') },
      { x: 762, w: 174, label: t('method.fig.output'), sub: `7 × ${t('method.fig.views')}` },
    ];

    const mk = (name, attrs) => {
      const el = document.createElementNS(ns, name);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      return el;
    };

    // connectors
    boxes.slice(0, -1).forEach((b, i) => {
      const next = boxes[i + 1];
      const y = 118;
      svg.append(
        mk('line', {
          x1: b.x + b.w,
          y1: y,
          x2: next.x,
          y2: y,
          stroke: 'var(--accent-line)',
          'stroke-width': 2,
          'marker-end': 'url(#mf-arrow)',
        }),
      );
      // small animated dash to suggest flow
      const flow = mk('line', {
        x1: b.x + b.w,
        y1: y,
        x2: next.x,
        y2: y,
        stroke: 'var(--accent)',
        'stroke-width': 2,
        'stroke-dasharray': '4 10',
        class: 'mf-flow',
      });
      svg.append(flow);
    });

    // defs: arrow head
    const defs = mk('defs', {});
    const marker = mk('marker', {
      id: 'mf-arrow',
      viewBox: '0 0 10 10',
      refX: 9,
      refY: 5,
      markerWidth: 7,
      markerHeight: 7,
      orient: 'auto-start-reverse',
    });
    const path = mk('path', { d: 'M0 0L10 5L0 10z', fill: 'var(--accent-line)' });
    marker.append(path);
    defs.append(marker);
    svg.prepend(defs);

    // boxes
    boxes.forEach((b, i) => {
      const g = mk('g', { class: `mf-box mf-box-${i}` });
      g.append(
        mk('rect', {
          x: b.x,
          y: 78,
          width: b.w,
          height: 80,
          rx: 8,
          fill: 'var(--surface-2)',
          stroke: i === 0 ? 'var(--accent)' : 'var(--line-2)',
          'stroke-width': 1.4,
        }),
      );
      const title = mk('text', {
        x: b.x + b.w / 2,
        y: 112,
        'text-anchor': 'middle',
        'font-size': 14,
        'font-weight': 600,
        fill: 'var(--text)',
      });
      title.textContent = b.label;
      const sub = mk('text', {
        x: b.x + b.w / 2,
        y: 134,
        'text-anchor': 'middle',
        'font-size': 11.5,
        fill: 'var(--text-3)',
      });
      sub.textContent = b.sub;
      g.append(title, sub);
      svg.append(g);
    });

    // time axis under the core
    const axis = mk('text', {
      x: 516 + 95,
      y: 196,
      'text-anchor': 'middle',
      'font-size': 11,
      fill: 'var(--text-3)',
      'font-family': 'var(--font-mono)',
    });
    axis.textContent = t('method.fig.time');
    svg.append(axis);

    // route-specific evidence chips
    const chips = evidenceChips(route);
    chips.forEach((chip, i) => {
      const chipRect = mk('rect', {
        x: 24,
        y: 210 + i * 34,
        width: 190,
        height: 26,
        rx: 13,
        fill: 'var(--accent-soft)',
        stroke: 'var(--accent-line)',
      });
      const chipText = mk('text', {
        x: 119,
        y: 227 + i * 34,
        'text-anchor': 'middle',
        'font-size': 11.5,
        fill: 'var(--accent)',
        'font-weight': 600,
      });
      chipText.textContent = chip;
      svg.append(chipRect, chipText);
    });

    // output thumbnails strip
    for (let v = 0; v < 7; v++) {
      svg.append(
        mk('rect', {
          x: 762 + (v % 4) * 44,
          y: 210 + Math.floor(v / 4) * 40,
          width: 36,
          height: 32,
          rx: 4,
          fill: 'var(--accent-2-soft)',
          stroke: 'var(--accent-2-line)',
        }),
      );
      svg.append(
        Object.assign(mk('text', {
          x: 762 + (v % 4) * 44 + 18,
          y: 230 + Math.floor(v / 4) * 40,
          'text-anchor': 'middle',
          'font-size': 10,
          fill: 'var(--accent-2)',
          'font-family': 'var(--font-mono)',
        }), { textContent: `v${v}` }),
      );
    }

    canvas.replaceChildren(svg);
  }

  function evidenceChips(route) {
    const common = t('common.placeholder');
    switch (route) {
      case 'dashcam':
        return ['D · dashcam stream', '7 · target streams'];
      case 'reference':
        return ['R · reference frames', 'S · shared state'];
      case 'threeDGS':
        return ['G · 3DGS render', 'P · pose offset'];
      case 'pointcloud':
        return ['C · point cloud', 'Z · RGB + depth'];
      default:
        return [common];
    }
  }

  function routeLabel(route) {
    return t(`method.routes.${route}`);
  }

  function select(route) {
    buttons.forEach((btn) => btn.setAttribute('aria-selected', String(btn.dataset.route === route)));
    buildDiagram(route);
    note.innerHTML = `<strong>${routeLabel(route)}:</strong> `;
    note.append(document.createTextNode(t(`method.fig.notes.${route}`)));
  }

  renderLang();
  select('dashcam');
  onLangChange(() => {
    renderLang();
    const active = routeBar.querySelector('[aria-selected="true"]')?.dataset.route || 'dashcam';
    select(active);
  });

  // Data & training facts
  if (detailsMount) {
    const dl = document.createElement('dl');
    dl.className = 'foundation-details';
    const entries = ['views', 'clips', 'hours', 'steps', 'resolution', 'posttraining'];
    const render = () => {
      dl.replaceChildren();
      for (const key of entries) {
        const item = document.createElement('div');
        item.className = 'fd-item';
        const dt = document.createElement('dt');
        dt.textContent = t(`method.details.${key}.label`);
        const dd = document.createElement('dd');
        dd.textContent = t(`method.details.${key}.value`);
        item.append(dt, dd);
        dl.append(item);
      }
    };
    render();
    detailsMount.append(dl);
    onLangChange(render);
  }
}
