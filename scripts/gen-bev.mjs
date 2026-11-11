/**
 * Generates public/media/interaction/bev.json — synthetic BEV trajectory data
 * for the closed-loop "interaction avoidance" episode.
 *
 * Format (consumed by src/modules/applications.js):
 * {
 *   avoidance: {
 *     fps: 12,
 *     frames: [ { lanes: [[x,y],...][], actors: [x,y,w,h,heading][] } ],
 *     paths: [ [[x,y] per frame], [[x,y] per frame] ]   // two ego plans
 *   }
 * }
 *
 * World coords: x = forward distance (m), y = lateral (m).
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FPS = 12;
const DURATION = 6; // seconds — matches the placeholder avoidance clip
const FRAMES = FPS * DURATION;

const lanes = [];
for (let l = 0; l < 4; l++) {
  const y = -10.5 + l * 7;
  const lane = [];
  for (let x = 0; x <= 84; x += 6) lane.push([x, y]);
  lanes.push(lane);
}

const frames = [];
const paths = [[], []];

// Actor plan: a slow car sits in the ego lane ahead; the ego (path 2) swerves
// left to avoid it; path 1 is the straight plan that would collide.
const slowCarX = (t) => 26 + t * 3.2;

for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS;
  const egoX = t * 8;
  const straightY = 3.5;
  const swerveY = 3.5 - 6.5 * Math.min(1, Math.max(0, (t - 1.2) / 1.6));
  const swerveBackY = swerveY + 3.5 * Math.min(1, Math.max(0, (t - 3.6) / 1.8));
  const swerveY2 = Math.max(-6, Math.min(4, swerveBackY));

  paths[0].push([egoX, straightY]);
  paths[1].push([egoX, swerveY2]);

  const actors = [
    // slow car in the ego lane
    [slowCarX(t), 3.6, 1.9, 4.4, 0],
    // oncoming traffic, adjacent lane
    [64 - t * 9, -3.4, 1.9, 4.4, Math.PI],
    // a parked van by the curb
    [40, 11.0, 2.4, 5.4, 0],
  ];
  // one extra car crossing behind after t = 3s
  if (t > 3) actors.push([18 + (t - 3) * 4, -10.5 + (t - 3) * 1.2, 1.9, 4.4, 0.4]);

  frames.push({ lanes: lanes.map((lane) => lane.map((p) => [p[0], p[1]])), actors });
}

const out = {
  avoidance: {
    fps: FPS,
    frames,
    paths,
  },
};

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, '../public/media/interaction/bev.json');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify(out));
console.log(`bev.json written: ${frames.length} frames @ ${FPS}fps -> ${target}`);
