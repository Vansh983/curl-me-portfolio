// Walking the story freely (the "Walk" mode, stage-roam.ts). Pure: the path the scroll's camera takes, cut into the
// legs a walker can be on, and where a walker is along it. The story stays the spine: wherever he stands, the nearest
// place on the path gives the stage its progress, and that progress drives everything the scroll drives (which sets
// are drawn, the light, the weather, what moves). Only the eye is his.
import type { Frame } from './dolly.ts';

/** The walker: sizes in metres, speeds in metres a second, turning in radians. */
export const ROAM = {
  eye: 1.6, // the eye over the floor, as the scroll's camera has it
  radius: 0.26, // the body, for walls and furniture
  clear: 0.27, // what passes under the body: a stair's step, a threshold
  step: 0.27, // the most the floor may rise in one stride: the wing's steps up to the stage are 0.25
  drop: 0.6, // the most it may fall: past that the edge holds him (a stage's front, a quay)
  walk: 3.5, run: 6.5, // a brisk walk; Shift (he asked for faster than 2.4 and 4.4)
  ease: 14, // how fast the pace follows the keys (1/s)
  turn: 2.8, // the arrow keys' turn, radians a second
  look: 0.0022, // the mouse, radians a pixel
  reach: 2.1, // how far a door is opened from
  seat: 2.6, // how far the seat on the flight, and the way back to it, are offered from
  /** Where the scroll's camera does not walk: he takes his seat and the flight plays to its end in the hall. Chapters. */
  rides: [{ from: 5.648, to: 6.4, rate: 0.12, prompt: 'Take your seat', back: 'Back to the flight', again: 5.6 }], // `again`: the chapter he is put at when he comes back
  fov: 74, // the frame's width in degrees, as the scroll's camera mostly has it
} as const;

/** A leg of the path a walker can be on: its samples `a` to `b`, the set it is in, and how it joins the next leg. */
export interface RoamRun { a: number; b: number; set: number; next: 'door' | 'ride' | 'end'; ride?: number }
export interface RoamPath { n: number; q: Float64Array; x: Float32Array; y: Float32Array; z: Float32Array; runs: RoamRun[] }

/**
 * The scroll's path, sampled, in legs. A leg ends where the camera passes into another set (a doorway: `door`),
 * or where the camera stops walking and something plays (`ride`). The last leg ends the story (`end`), in the room it began in.
 */
export function roamPath(dolly: (q: number) => Frame, span: number, n = 6400): RoamPath {
  const q = new Float64Array(n + 1), x = new Float32Array(n + 1), y = new Float32Array(n + 1), z = new Float32Array(n + 1), set = new Uint8Array(n + 1), runs: RoamRun[] = [];
  for (let i = 0; i <= n; i++) { const f = dolly(i / n); q[i] = i / n; x[i] = f.cam[0]; y[i] = f.cam[1]; z[i] = f.cam[2]; set[i] = f.set; }
  const rideOf = (i: number) => ROAM.rides.findIndex((r) => q[i] * span > r.from && q[i] * span < r.to);
  let a = -1;
  for (let i = 0; i <= n; i++) {
    const inRide = rideOf(i) >= 0;
    if (inRide) { if (a >= 0) { runs.push({ a, b: i - 1, set: set[a], next: 'ride', ride: rideOf(i) }); a = -1; } continue; }
    if (a < 0) { a = i; continue; }
    if (set[i] !== set[i - 1]) { runs.push({ a, b: i - 1, set: set[a], next: 'door' }); a = i; }
  }
  if (a >= 0) runs.push({ a, b: n, set: set[a], next: 'end' });
  return { n, q, x, y, z, runs };
}

/**
 * The sample of leg `run` nearest a point. It keeps to the stretch he is on (`hint`) unless somewhere else on the leg
 * is plainly nearer, so a path that doubles back through a room does not flicker between its two passes.
 */
export function roamNearest(p: RoamPath, run: RoamRun, px: number, py: number, pz: number, hint: number): number {
  const d2 = (i: number) => { const dx = p.x[i] - px, dy = (p.y[i] - py) * 0.4, dz = p.z[i] - pz; return dx * dx + dy * dy + dz * dz; };
  let best = run.a, bd = Infinity;
  for (let i = run.a; i <= run.b; i++) { const d = d2(i); if (d < bd) { bd = d; best = i; } }
  if (hint < run.a || hint > run.b) return best;
  let near = hint, nd = Infinity;
  for (let i = Math.max(run.a, hint - 60); i <= Math.min(run.b, hint + 60); i++) { const d = d2(i); if (d < nd) { nd = d; near = i; } }
  return Math.sqrt(nd) <= Math.sqrt(bd) + 0.6 ? near : best;
}

/** The way the path runs at a leg's end (`at` = its last sample) or beginning (its first), on the floor's plane: a unit vector. */
export function roamHeading(p: RoamPath, run: RoamRun, end: boolean): [number, number] {
  const at = end ? run.b : run.a, dir = end ? -1 : 1;
  for (let k = 1; at + dir * k >= run.a && at + dir * k <= run.b; k++) {
    const j = at + dir * k, dx = (p.x[at] - p.x[j]) * (end ? 1 : -1), dz = (p.z[at] - p.z[j]) * (end ? 1 : -1), l = Math.hypot(dx, dz);
    if (l > 0.2) return [dx / l, dz / l];
  }
  return [0, 1];
}

/** The progress at a point beside sample `i` of leg `run`: between the samples, so the stage does not move in steps. */
export function roamProgress(p: RoamPath, run: RoamRun, i: number, px: number, pz: number): number {
  let q = p.q[i], bd = Infinity;
  for (const j of [i - 1, i]) {
    if (j < run.a || j + 1 > run.b) continue;
    const ax = p.x[j], az = p.z[j], bx = p.x[j + 1] - ax, bz = p.z[j + 1] - az, l2 = bx * bx + bz * bz;
    if (l2 < 1e-10) continue;
    const t = Math.max(0, Math.min(1, ((px - ax) * bx + (pz - az) * bz) / l2)), d = Math.hypot(px - ax - bx * t, pz - az - bz * t);
    if (d < bd) { bd = d; q = p.q[j] + (p.q[j + 1] - p.q[j]) * t; }
  }
  return q;
}
