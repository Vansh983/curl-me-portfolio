// Downtown Toronto out of the condo window, from OpenStreetMap (scripts/stage-city.mjs writes
// toronto.json: footprints and heights in metres about the condo, x west, z north). The buildings
// are pulled up from their footprints with the window tile on every face; the CN Tower is built
// here from its real dimensions, since flat prisms do not read as its tapered legs and pod.
import toronto from './toronto.json' with { type: 'json' };
import { Sink } from './rig.ts';
import type { V3 } from './rig.ts';

export interface CityBuilding { h: number; min: number; p: number[]; dome?: 1 }
export interface CityData { source: string; condo: [number, number]; cn: [number, number]; buildings: CityBuilding[]; roads: number[][] }
export const CITY = toronto as CityData;

/** The window tile (stage-paint.ts windows): 24 bays by 20 floors in 96 by 70 metres. */
export const WINDOW_TILE = { perU: 96, perV: 70 };

/** A linear rgb triple as the sRGB hex Sink.color takes. */
const hex = (c: number[]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(1, v)) ** (1 / 2.2) * 255).toString(16).padStart(2, '0')).join('');

/**
 * Paints light onto a sink's vertex colours from the face normals: brightness = ambient + k * max(0, n . L),
 * so an unlit material still shows form (the CN Tower's fins, the faces of a tower) at no cost.
 */
export function shade(sink: Sink, L: V3, ambient: number, k: number): void {
  const l = Math.hypot(...L), lx = L[0] / l, ly = L[1] / l, lz = L[2] / l;
  const p = sink.pos, c = sink.col;
  for (let i = 0; i + 8 < p.length; i += 9) {
    const ax = p[i + 3] - p[i], ay = p[i + 4] - p[i + 1], az = p[i + 5] - p[i + 2];
    const bx = p[i + 6] - p[i], by = p[i + 7] - p[i + 1], bz = p[i + 8] - p[i + 2];
    let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    const n = Math.hypot(nx, ny, nz) || 1;
    nx /= n; ny /= n; nz /= n;
    const b = ambient + k * Math.max(0, nx * lx + ny * ly + nz * lz);
    for (let j = i; j < i + 9; j++) c[j] *= b;
  }
}

export const ringOf = (p: number[]): Array<[number, number]> => { const r: Array<[number, number]> = []; for (let i = 0; i + 1 < p.length; i += 2) r.push([p[i], p[i + 1]]); return r; };
export const centreOf = (r: Array<[number, number]>): [number, number] => [r.reduce((s, p) => s + p[0], 0) / r.length, r.reduce((s, p) => s + p[1], 0) / r.length];

/**
 * Every building into `near` or `far` (by distance), their roofs into `tops`, domes into `domes`.
 * Each takes a different patch of the window tile, its floors lined up with the tile's.
 */
export function cityBlocks(near: Sink, far: Sink, tops: Sink, domes: Sink, nearWithin = 800): void {
  let seed = 91;
  const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  for (const b of CITY.buildings) {
    const ring = ringOf(b.p);
    if (ring.length < 3) continue;
    const c = centreOf(ring);
    const uvs = { u0: rnd() * 4, v0: Math.floor(rnd() * 80) / 20, ...WINDOW_TILE };
    // each building its own evening: some mostly dark, a few bright, most between; offices cooler, homes warmer
    const bright = 0.6 + rnd() * rnd() * 0.8, warm = rnd() < 0.6;
    const tint = warm ? [bright, bright * 0.93, bright * 0.82] : [bright * 0.85, bright * 0.92, bright];
    near.color(hex(tint));
    far.color(hex(tint));
    if (b.dome) {
      // walls to a little under half, then an ellipsoid cap over the footprint
      const xs = ring.map((p) => p[0]), zs = ring.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
      const y0 = b.min || b.h * 0.42;
      near.extrude(ring, b.min, y0, uvs);
      domes.sphere((x0 + x1) / 2, y0, (z0 + z1) / 2, (x1 - x0) / 2, b.h - y0, (z1 - z0) / 2, 24, 8, undefined, 0.5);
      continue;
    }
    (Math.hypot(c[0], c[1]) < nearWithin ? near : far).extrude(ring, b.min, b.h, uvs, tops);
  }
  // the faces toward the window and the lake a touch brighter than the ones side-on, so a block has corners
  for (const s of [near, far]) shade(s, [0.3, 0.2, 1], 0.78, 0.3);
}

/**
 * The CN Tower on its real spot: a hexagonal core, three legs that sprawl 34 m at the ground and
 * taper into the core under the main pod (330 to 366 m, the skirt, the seven floors and the roof),
 * the shaft on to the SkyPod at 447 and the antenna to 553. `shaft`, `pod`, `lights` take the pieces.
 */
export function cnTower(shaft: Sink, pod: Sink, lights: Sink): void {
  const [tx, tz] = CITY.cn;
  shaft.lathe([[9, 0], [7.5, 120], [6.5, 330], [6.5, 368], [5.8, 440], [5.5, 457]], tx, 0, tz, 1, 1, 0, 12);
  // the legs: an ellipse of half-length along the leg and half-thickness across, at each height
  for (const th of [Math.PI / 2, Math.PI / 2 + (2 * Math.PI) / 3, Math.PI / 2 + (4 * Math.PI) / 3]) {
    const dir: V3 = [Math.cos(th), 0, Math.sin(th)], side: V3 = [-Math.sin(th), 0, Math.cos(th)];
    const rings = [];
    for (const [y, r0, r1, t] of [[0, 8, 34, 5.5], [60, 7.5, 27, 4.6], [140, 7, 19, 3.6], [230, 6.5, 12.5, 2.6], [300, 6.5, 8.5, 1.8], [326, 6.3, 6.8, 1.2]] as Array<[number, number, number, number]>) {
      const mid = (r0 + r1) / 2;
      rings.push({ c: [tx + dir[0] * mid, y, tz + dir[2] * mid] as V3, u: dir, v: side, ru: (r1 - r0) / 2, rv: t });
    }
    rings.push({ ...rings[rings.length - 1], c: [rings[rings.length - 1].c[0], 330, rings[rings.length - 1].c[2]] as V3, ru: 0.1, rv: 0.1 });
    shaft.loft(rings, 10);
  }
  pod.lathe([[6.5, 320], [9.5, 326], [17.5, 331], [18.5, 334], [18.5, 351], [16.5, 355], [10, 361], [6.5, 364]], tx, 0, tz, 1, 1, 0, 20);
  pod.lathe([[5.6, 442], [8.5, 445], [9, 449], [8.5, 453], [5.6, 456]], tx, 0, tz, 1, 1, 0, 14);
  shaft.lathe([[5.5, 457], [4, 490], [2.8, 510], [1.9, 535], [1.0, 553]], tx, 0, tz, 1, 1, 0, 8);
  lights.sphere(tx, 553, tz, 3.5, 3.5, 3.5, 8, 6).sphere(tx, 505, tz, 3, 3, 3, 8, 6).sphere(tx, 458, tz, 3, 3, 3, 8, 6);
  // lit from below and the front, as the floodlights do it: the fins' edges catch, the faces fall off
  shade(shaft, [-0.35, -0.25, 1], 0.28, 0.85);
  shade(pod, [-0.3, -0.6, 0.9], 0.3, 0.9);
}

/** Street lights: a point every `every` metres along each road, at `y`. Positions as x, y, z triples. */
export function streetLights(every = 28, y = 6): Float32Array {
  const out: number[] = [];
  for (const line of CITY.roads) {
    let carry = 0;
    for (let i = 0; i + 3 < line.length; i += 2) {
      const ax = line[i], az = line[i + 1], bx = line[i + 2], bz = line[i + 3];
      const l = Math.hypot(bx - ax, bz - az);
      for (let d = carry; d < l; d += every) out.push(ax + ((bx - ax) * d) / l, y, az + ((bz - az) * d) / l);
      carry = ((carry - l) % every + every) % every;
    }
  }
  return Float32Array.from(out);
}
