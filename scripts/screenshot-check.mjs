/**
 * screenshot-check.mjs — drives headless Chrome over CDP to verify the built
 * site: scrolls to every section, waits for reveal animations and video first
 * frames, captures screenshots, switches language, and reports console errors.
 *
 * Usage: node scripts/screenshot-check.mjs [baseURL] [outDir]
 * Requires: Google Chrome (macOS path below).
 */

import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:4173/';
const OUT = process.argv[3] || '/tmp/bw-shots';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;

mkdirSync(OUT, { recursive: true });

const chrome = spawn(
  CHROME,
  [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--mute-audio',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=/tmp/bw-chrome-profile',
    '--window-size=1440,960',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/json/list`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === 'page');
      if (page) return page;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error('Chrome DevTools endpoint never came up');
}

let msgId = 0;
const pending = new Map();
const consoleErrors = [];

function send(ws, method, params = {}) {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => pending.set(id, { res, rej }));
}

async function main() {
  const target = await getTarget();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(`EXCEPTION: ${msg.params.exceptionDetails.text} ${msg.params.exceptionDetails.exception?.description || ''}`);
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(`console.error: ${msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ')}`);
    } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      consoleErrors.push(`LOG: ${msg.params.entry.text} (${msg.params.entry.url || ''})`);
    }
  };

  await send(ws, 'Page.enable');
  await send(ws, 'Runtime.enable');
  await send(ws, 'Log.enable');

  const loaded = new Promise((r) => {
    const prev = ws.onmessage;
    ws.onmessage = (ev) => {
      prev(ev);
      const msg = JSON.parse(ev.data);
      if (msg.method === 'Page.loadEventFired') r();
    };
  });
  await send(ws, 'Page.navigate', { url: BASE });
  await loaded;
  await sleep(2500); // landing video init + first frames

  const shot = async (name) => {
    const { data } = await send(ws, 'Page.captureScreenshot', { format: 'png' });
    writeFileSync(resolve(OUT, `${name}.png`), Buffer.from(data, 'base64'));
    console.log(`  ✓ ${name}.png`);
  };

  const scrollTo = async (selector) => {
    await send(ws, 'Runtime.evaluate', {
      expression: `document.querySelector('${selector}').scrollIntoView({behavior:'instant', block:'start'}); window.scrollBy(0, -60);`,
    });
    await sleep(1600); // reveal transition + video start
  };

  await shot('01-landing');

  const sections = ['overview', 'method', 'control', 'grounding', 'posttraining', 'applications', 'resources'];
  for (const id of sections) {
    await scrollTo(`#${id}`);
    await shot(`sec-${id}`);
  }

  // sub-parts
  await scrollTo('#rl');
  await shot('sec-rl');
  await scrollTo('#closed-loop');
  await shot('sec-closed-loop');

  // switch to English and re-shoot the landing + one section
  await send(ws, 'Runtime.evaluate', {
    expression: `document.querySelector('[data-lang-btn="en"]').click(); window.scrollTo(0, 0);`,
  });
  await sleep(1200);
  await shot('en-landing');
  await scrollTo('#control');
  await shot('en-control');

  // sanity probes
  const probe = await send(ws, 'Runtime.evaluate', {
    expression: `JSON.stringify({
      lang: document.documentElement.lang,
      navCurrent: document.querySelector('.nav-links a[aria-current]')?.dataset.nav || null,
      videos: document.querySelectorAll('video').length,
      playingVideos: [...document.querySelectorAll('video')].filter(v => !v.paused).length,
      canvasTiles: document.querySelectorAll('.landing-view canvas').length,
      citeVisible: !document.getElementById('cite-block')?.hidden,
      tabCount: document.querySelectorAll('#control-demo .tab-btn').length,
    })`,
    returnByValue: true,
  });
  console.log('\nprobe:', probe.result.value);
  console.log('console errors:', consoleErrors.length ? consoleErrors : 'none');

  ws.close();
  chrome.kill();
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  chrome.kill();
  process.exit(1);
});
