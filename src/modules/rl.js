/**
 * 04 Post-training / RL: an in-page interactive demo — a tiny closed-loop
 * driving sim. Steer the ego car with ← → (or on-screen buttons); reactive
 * agents keep their lanes. HUD shows speed / reward / collisions.
 * The sim runs entirely on canvas; no external app needed.
 */

import { t, onLangChange } from '../i18n.js';
import { RL_DEMO } from '../data.js';

export function initRL() {
  const frame = document.getElementById('rl-frame');
  const body = document.getElementById('rl-frame-body');
  const status = document.getElementById('rl-frame-status');
  if (!frame || !body) return;

  try {
    buildSim(body, status);
  } catch {
    status.textContent = t('rl.error');
    status.hidden = false;
  }
}

function buildSim(body, status) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canvas = document.createElement('canvas');
  canvas.className = 'rl-sim';
  canvas.setAttribute('role', 'img');
  body.append(canvas);
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('no 2d context');

  /* HUD */
  const hud = document.createElement('div');
  hud.className = 'rl-hud';
  const steerLabel = document.createElement('span');
  const steerText = document.createElement('span');
  const keys = document.createElement('span');
  keys.className = 'rl-keys';
  const keyL = document.createElement('kbd');
  keyL.className = 'rl-key';
  keyL.textContent = '←';
  const keyR = document.createElement('kbd');
  keyR.className = 'rl-key';
  keyR.textContent = '→';
  keys.append(keyL, keyR);
  steerLabel.append(steerText, keys);

  const statSpeed = document.createElement('span');
  const statReward = document.createElement('span');
  const statCollision = document.createElement('span');
  statSpeed.className = statReward.className = statCollision.className = 'rl-stat';

  const pauseBtn = document.createElement('button');
  pauseBtn.type = 'button';
  pauseBtn.className = 'rl-btn';
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'rl-btn';
  resetBtn.textContent = t('rl.reset');

  hud.append(steerLabel, statSpeed, statReward, statCollision, pauseBtn, resetBtn);
  body.parentElement.append(hud);

  const renderLang = () => {
    steerText.textContent = t('rl.keysHint');
    statSpeed.dataset.label = t('rl.speed');
    statReward.dataset.label = t('rl.reward');
    statCollision.dataset.label = t('rl.collision');
    pauseBtn.textContent = paused ? t('rl.resume') : t('rl.pause');
    resetBtn.textContent = t('rl.reset');
  };

  /* state */
  const ROAD_W = 360;
  const LANES = 3;
  const laneW = ROAD_W / LANES;
  let ego, agents, reward, collisions, paused, raf, last, steerInput;
  let running = false;

  function reset() {
    ego = { x: laneW * 1.5, y: 300, v: 130, targetLane: 1, angle: 0 };
    agents = [];
    for (let i = 0; i < RL_DEMO.agents; i++) {
      const lane = i % LANES;
      agents.push({
        lane,
        x: laneW * (lane + 0.5),
        y: ((i * 977) % 2000) - 700,
        v: 60 + ((i * 37) % 60),
        reactive: i % 3 === 0,
      });
    }
    reward = 0;
    collisions = 0;
    steerInput = 0;
  }

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = body.clientWidth || 640;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(w * 0.62 * dpr));
    canvas.style.height = `${Math.round(w * 0.62)}px`;
  }
  new ResizeObserver(resize).observe(body);
  resize();

  /* control */
  let focused = false;
  canvas.tabIndex = 0;
  canvas.style.outline = 'none';
  canvas.addEventListener('focus', () => (focused = true));
  canvas.addEventListener('blur', () => {
    focused = false;
    steerInput = 0;
  });
  canvas.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      steerInput = -1;
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      steerInput = 1;
      e.preventDefault();
    } else if (e.key === ' ') {
      togglePause();
      e.preventDefault();
    }
  });
  canvas.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') steerInput = 0;
  });

  /* on-screen steering for touch */
  let pointerSteer = 0;
  const press = (dir) => (e) => {
    e.preventDefault();
    pointerSteer = dir;
  };
  const release = () => (pointerSteer = 0);
  for (const dir of [-1, 1]) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rl-btn';
    btn.textContent = dir < 0 ? '←' : '→';
    btn.addEventListener('pointerdown', press(dir));
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);
    hud.append(btn);
  }

  function togglePause() {
    paused = !paused;
    pauseBtn.textContent = paused ? t('rl.resume') : t('rl.pause');
  }
  pauseBtn.addEventListener('click', togglePause);
  resetBtn.addEventListener('click', () => reset());

  /* world coords: x across road, y along route; canvas shows y increasing downward */
  function toScreen(p) {
    const scale = canvas.width / ROAD_W;
    return [p.x * scale, (p.y - ego.y + 240) * scale * 0.55 + 60];
  }

  function step(dt) {
    const steer = steerInput || pointerSteer;
    ego.targetLane = Math.max(0, Math.min(LANES - 1, ego.targetLane + steer * dt * 1.6));
    const targetX = laneW * (ego.targetLane + 0.5);
    const dx = targetX - ego.x;
    ego.x += Math.max(-140 * dt, Math.min(140 * dt, dx));
    ego.angle = Math.max(-0.3, Math.min(0.3, dx * 0.01));
    ego.y += ego.v * dt;
    reward += (Math.abs(dx) < 8 ? 2 : -1) * dt;

    for (const a of agents) {
      a.y += a.v * dt;
      // reactive agents drift away from the ego's lane
      if (a.reactive) {
        const near = Math.abs(a.y - ego.y) < 90 && Math.abs(a.x - ego.x) < laneW;
        if (near) a.x += (a.x >= ego.x ? 1 : -1) * 26 * dt;
      } else {
        a.x = laneW * (a.lane + 0.5);
      }
      if (a.y - ego.y > 900) a.y -= 1800;
      if (ego.y - a.y > 900) a.y += 1800;
      if (Math.hypot(a.x - ego.x, a.y - ego.y) < 26) {
        collisions++;
        a.y -= 120; // separate
      }
    }
  }

  function draw() {
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = '#0b141d';
    ctx.fillRect(0, 0, W, H);

    // road
    const scale = W / ROAD_W;
    ctx.fillStyle = '#13202b';
    ctx.fillRect(0, 0, W, H);
    // lane lines
    ctx.strokeStyle = '#22323f';
    ctx.lineWidth = Math.max(1, 2 * scale);
    for (let i = 1; i < LANES; i++) {
      ctx.beginPath();
      ctx.moveTo(i * laneW * scale, 0);
      ctx.lineTo(i * laneW * scale, H);
      ctx.stroke();
    }
    // edge lines
    ctx.strokeStyle = '#31485a';
    ctx.lineWidth = Math.max(2, 3 * scale);
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(2, H);
    ctx.moveTo(W - 2, 0);
    ctx.lineTo(W - 2, H);
    ctx.stroke();

    // dashed center markers scrolling by
    ctx.strokeStyle = '#1c2c39';
    const dash = 46 * scale;
    const off = (ego.y * 0.55 * scale) % (dash * 2);
    for (let y = -dash * 2; y < H + dash; y += dash * 2) {
      for (let i = 1; i < LANES; i++) {
        ctx.beginPath();
        ctx.moveTo(i * laneW * scale, y + off);
        ctx.lineTo(i * laneW * scale, y + off + dash);
        ctx.stroke();
      }
    }

    const car = (p, color, w = 16, h = 30) => {
      const [sx, sy] = toScreen(p);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(p.angle || 0);
      ctx.fillStyle = color;
      ctx.beginPath();
      const cw = w * scale;
      const ch = h * scale;
      if (ctx.roundRect) ctx.roundRect(-cw * 0.5, -ch * 0.5, cw, ch, 4 * scale);
      else ctx.rect(-cw * 0.5, -ch * 0.5, cw, ch);
      ctx.fill();
      ctx.restore();
    };

    for (const a of agents) car(a, a.reactive ? '#e2a34b' : '#4e6d84', 15, 28);
    car(ego, '#58c8f0', 17, 32);

    // HUD stats
    statSpeed.textContent = `${statSpeed.dataset.label ?? ''} ${Math.round(ego.v / 3.6)} m/s`;
    statReward.textContent = `${statReward.dataset.label ?? ''} ${reward.toFixed(1)}`;
    statCollision.textContent = `${statCollision.dataset.label ?? ''} ${collisions}`;
  }

  function loop(ts) {
    raf = requestAnimationFrame(loop);
    if (last == null) last = ts;
    const dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;
    if (!paused) step(dt);
    draw();
    if (!running) {
      running = true;
      status.hidden = true;
    }
  }

  reset();
  paused = false;
  renderLang();
  onLangChange(renderLang);

  // Only animate while visible.
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && !raf) {
        last = null;
        raf = requestAnimationFrame(loop);
      } else if (!entry.isIntersecting && raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    }
  });
  io.observe(body);

  canvas.addEventListener('pointerdown', () => canvas.focus());

  if (reduced) {
    paused = true;
  }
}
