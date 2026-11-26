// Downtown Toronto out of the condo window, from OpenStreetMap (scripts/stage-city.mjs writes
// toronto.json: footprints and heights in metres about the condo, x west, z north). The buildings
// are pulled up from their footprints with the window tile on every face; the CN Tower is built
// here from its real dimensions, since flat prisms do not read as its tapered legs and pod.
import toronto from './toronto.json' with { type: 'json' };
import { Sink } from './rig.ts';
import type { V3 } from './rig.ts';

interface CityBuilding { h: number; min: number; p: number[]; dome?: 1 }
interface CityData { source: string; condo: [number, number]; facing: number; cn: [number, number]; buildings: CityBuilding[]; roads: number[][] }
export const CITY = toronto as CityData;

/** The CN Tower as built here: 553 m is the truth, 470 the height he asked for, so the towers round it read as tall too. */
export const CN_HEIGHT = 470;

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
const centreOf = (r: Array<[number, number]>): [number, number] => [r.reduce((s, p) => s + p[0], 0) / r.length, r.reduce((s, p) => s + p[1], 0) / r.length];

/** Rogers Centre with its roof closed. The two barrel vaults slide on parallel tracks between
 * the fixed north cap and the rotating south cap. The track runs along the straight sides
 * of the mapped roof footprint, 28 degrees from the condo's +z axis. */
function stadiumRoof(roof: Sink, ring: Array<[number, number]>, eave: number, top: number): void {
  const angle = 28 * Math.PI / 180, c = Math.cos(angle), s = Math.sin(angle);
  const across = ring.map(([x, z]) => x * c + z * s);
  const along = ring.map(([x, z]) => -x * s + z * c);
  const mid = (xs: number[]) => (Math.max(...xs) + Math.min(...xs)) / 2;
  const u0 = mid(across), v0 = mid(along);
  const halfWidth = Math.max(...across) - u0, halfLength = Math.max(...along) - v0;
  for (const panel of [
    { from: -1, to: -0.52, cap: true, rise: 0.86, width: 0.93 },
    { from: -0.52, to: 0.05, cap: false, rise: 0.91, width: 1 },
    { from: 0.05, to: 0.55, cap: false, rise: 1, width: 0.95 },
    { from: 0.55, to: 1, cap: true, rise: 0.94, width: 0.92 },
  ]) {
    // Each section is an east-west arch. At the ends both its rise and span diminish.
    const capEdge = Math.min(Math.abs(panel.from), Math.abs(panel.to));
    const point = (v: number, a: number): V3 => {
      const section = panel.cap ? Math.sqrt(Math.max(0, (1 - v * v) / (1 - capEdge * capEdge))) : 1;
      const u = u0 + Math.cos(a) * halfWidth * panel.width * section, d = v0 + v * halfLength;
      return [u * c - d * s, eave + (top - eave) * Math.sin(a) * panel.rise * section, u * s + d * c];
    };
    const rows = panel.cap ? 12 : 4, bays = 24;
    for (let i = 0; i < rows; i++) {
      const v = panel.from + (panel.to - panel.from) * i / rows;
      const next = panel.from + (panel.to - panel.from) * (i + 1) / rows;
      for (let j = 0; j < bays; j++) {
        const a = Math.PI * j / bays, b = Math.PI * (j + 1) / bays;
        // The barrel vaults have parallel membrane laps. The end caps read as a smooth shell.
        const lap = panel.cap ? v : v + 0.008;
        if (!panel.cap) roof.color('#D6DCE4').quad(point(v, a), point(v, b), point(lap, b), point(lap, a));
        roof.color('#EEF1F6').quad(point(lap, a), point(lap, b), point(next, b), point(next, a));
      }
    }
    // The recessed panel ends show beneath the overlapping arches.
    for (const end of [panel.from, panel.to]) {
      if (Math.abs(end) === 1) continue;
      for (let j = 0; j < bays; j++) {
        const a = Math.PI * j / bays, b = Math.PI * (j + 1) / bays;
        const left = point(end, a), right = point(end, b);
        const leftFoot: V3 = [left[0], eave, left[2]], rightFoot: V3 = [right[0], eave, right[2]];
        roof.color('#A4B2C3');
        if (end === panel.from) roof.quad(right, left, leftFoot, rightFoot);
        else roof.quad(left, right, rightFoot, leftFoot);
      }
    }
  }
  shade(roof, [-0.5, 0.85, 0.05], 0.23, 0.64);
}

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
      const y0 = b.min || b.h * 0.42;
      near.extrude(ring, b.min, y0, uvs, tops);
      stadiumRoof(domes, ring, y0, b.h);
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
export function cnTower(shaft: Sink, pod: Sink, lights: Sink, height = CN_HEIGHT, closeUp = false): void {
  const [tx, tz] = CITY.cn, k = height / 553;
  const H = (y: number) => y * k; // he asked for it a little shorter: the towers round it should read as tall too
  const prof = (p: Array<[number, number]>): Array<[number, number]> => p.map(([r, y]) => [r, H(y)]);
  shaft.lathe(prof([[9, 0], [7.5, 120], [6.5, 330], [6.5, 368], [5.8, 440], [5.5, 457]]), tx, 0, tz, 1, 1, 0, 12);
  // the legs: an ellipse of half-length along the leg and half-thickness across, at each height
  for (const th of [Math.PI / 2, Math.PI / 2 + (2 * Math.PI) / 3, Math.PI / 2 + (4 * Math.PI) / 3]) {
    const dir: V3 = [Math.cos(th), 0, Math.sin(th)], side: V3 = closeUp ? [Math.sin(th), 0, -Math.cos(th)] : [-Math.sin(th), 0, Math.cos(th)];
    const rings = [];
    for (const [y, r0, r1, t] of [[0, 8, 34, 5.5], [60, 7.5, 27, 4.6], [140, 7, 19, 3.6], [230, 6.5, 12.5, 2.6], [300, 6.5, 8.5, 1.8], [326, 6.3, 6.8, 1.2]] as Array<[number, number, number, number]>) {
      const mid = (r0 + r1) / 2;
      rings.push({ c: [tx + dir[0] * mid, H(y), tz + dir[2] * mid] as V3, u: dir, v: side, ru: (r1 - r0) / 2, rv: t });
    }
    rings.push({ ...rings[rings.length - 1], c: [rings[rings.length - 1].c[0], H(330), rings[rings.length - 1].c[2]] as V3, ru: 0.1, rv: 0.1 });
    shaft.loft(rings, 10);
  }
  if (closeUp) {
    const point = (r: number, y: number, a: number): V3 => [tx + r * Math.cos(a), H(y), tz + r * Math.sin(a)];
    // The dark elevator runs sit between the three concrete buttresses.
    for (let side = 0; side < 3; side++) {
      const a = Math.PI / 6 + side * 2 * Math.PI / 3;
      shaft.color('#495466').quad(point(9.4, 0, a - 0.21), point(6.85, 330, a - 0.21), point(6.85, 330, a + 0.21), point(9.4, 0, a + 0.21));
    }
    const deck = (colour: string, profile: Array<[number, number]>, sides = 36) =>
      pod.color(colour).lathe(prof(profile), tx, 0, tz, 1, 1, 0, sides);
    // Build the two levels of glazing as bays between the pale deck edges and the round radome.
    const windows = (r0: number, y0: number, r1: number, y1: number) => {
      const panes = ['#77899C', '#536479', '#D8C8A6', '#788DA1', '#62778F', '#A5ADB5', '#566B81'];
      for (let j = 0; j < 36; j++) {
        const a = 2 * Math.PI * j / 36, b = 2 * Math.PI * (j + 1) / 36, post = a + (b - a) * 0.13;
        pod.color('#CBD2D8').quad(point(r0, y0, a), point(r1, y1, a), point(r1, y1, post), point(r0, y0, post));
        pod.color(panes[j % panes.length]).quad(point(r0, y0, post), point(r1, y1, post), point(r1, y1, b), point(r0, y0, b));
      }
    };
    deck('#939EAB', [[6.5, 320], [9, 324], [17, 329]]);
    deck('#F3F3F0', [[17, 329], [20.5, 329.7], [22, 332.1], [21.6, 334.6], [19.6, 336.5]]);
    deck('#6B7989', [[19.6, 336.5], [18.8, 337], [18.8, 340], [22, 340.8]]);
    deck('#E2E5E7', [[22, 340.8], [22.5, 342]]);
    windows(22.5, 342, 21.5, 346.8);
    deck('#D4DADF', [[21.5, 346.8], [22, 347.8]]);
    windows(22, 347.8, 21.2, 352);
    deck('#E6E8E9', [[21.2, 352], [22, 352.5], [21.8, 354], [19.5, 355.5], [10, 360], [6.5, 364]]);
    deck('#CAD1D8', [[5.6, 442], [8, 444], [9, 445.5]], 18);
    deck('#72879A', [[9, 445.5], [8.7, 450]], 18);
    deck('#EAEBE9', [[8.7, 450], [9, 451], [8.4, 452.8], [5.6, 455]], 18);
    // Stepped broadcast mast with its painted aviation bands.
    for (const [i, [radius, y, nextRadius, nextY]] of [
      [5.5, 457, 4.3, 478], [4.3, 478, 4.1, 490], [4.1, 490, 3.5, 504],
      [3.5, 504, 3, 513], [3, 513, 2.2, 528], [2.2, 528, 1.8, 538], [1.8, 538, 1, 553],
    ].entries()) {
      shaft.color(i % 2 ? '#C26F70' : '#F0F1F0').lathe(prof([[radius, y], [nextRadius, nextY]]), tx, 0, tz, 1, 1, 0, 12);
    }
  } else {
    pod.lathe(prof([[6.5, 320], [10, 326], [21, 331], [22, 334], [21, 351], [19, 355], [11, 361], [6.5, 364]]), tx, 0, tz, 1, 1, 0, 24);
    pod.lathe(prof([[5.6, 442], [8.5, 445], [9, 449], [8.5, 453], [5.6, 456]]), tx, 0, tz, 1, 1, 0, 14);
    shaft.lathe(prof([[5.5, 457], [4, 490], [2.8, 510], [1.9, 535], [1.0, 553]]), tx, 0, tz, 1, 1, 0, 8);
  }
  lights.sphere(tx, H(553), tz, 3.5, 3.5, 3.5, 8, 6).sphere(tx, H(505), tz, 3, 3, 3, 8, 6).sphere(tx, H(458), tz, 3, 3, 3, 8, 6);
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
