// The Studley campus under the port window: Dalhousie and King's from OpenStreetMap footprints with their
// names (scripts/stage-halifax.mjs writes dalhousie.json), built as the aerial view needs them: grey ironstone
// under slate hips for the old campus, concrete and brick flat roofs with their plant rooms, the Henry Hicks
// clock tower at the head of University Avenue, the Dalplex dome, the quad and Wickwire Field, the footpaths,
// the car parks and the trees. Every wall carries the facade tile in metres, tinted per building.
import dalhousie from './dalhousie.json' with { type: 'json' };
import { Sink, earcut } from './rig.ts';
import { ringOf } from './city.ts';

export type CampusKind = 'stone' | 'concrete' | 'brick' | 'glass' | 'house' | 'dome';
export interface CampusBuilding { n?: string; k: CampusKind; h: number; r: 'hip' | 'flat' | 'dome'; x?: 'tower'; p: number[] }
export interface CampusData {
  source: string; campus: number[]; buildings: CampusBuilding[]; greens: Array<{ n?: string; p: number[] }>;
  pitches: Array<{ s: string; p: number[] }>; parking: number[][]; paths: Array<{ w: number; a?: 1; p: number[] }>; trees: number[][];
}
export const DALHOUSIE = dalhousie as CampusData;

type Ring = Array<[number, number]>;
const hex = (c: number[]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(1, v)) ** (1 / 2.2) * 255).toString(16).padStart(2, '0')).join('');
const signedArea = (ring: Ring) => ring.reduce((s, p, i) => { const q = ring[(i + 1) % ring.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
const centroid = (ring: Ring): [number, number] => [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length];

/** A seeded uniform in 0..1, the same every build. */
export const rng = (seed: number) => () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };

export interface Obb { c: [number, number]; u: [number, number]; v: [number, number]; w: number; d: number; fill: number }
/** The smallest rectangle round a footprint (an edge direction is always one of its sides): centre, axes, sides, and how much of it the footprint fills. */
export function obb(ring: Ring): Obb {
  let best: Obb | undefined;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (l < 0.5) continue;
    const u: [number, number] = [(b[0] - a[0]) / l, (b[1] - a[1]) / l], v: [number, number] = [-u[1], u[0]];
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for (const p of ring) { const pu = p[0] * u[0] + p[1] * u[1], pv = p[0] * v[0] + p[1] * v[1]; u0 = Math.min(u0, pu); u1 = Math.max(u1, pu); v0 = Math.min(v0, pv); v1 = Math.max(v1, pv); }
    const w = u1 - u0, d = v1 - v0;
    if (!best || w * d < best.w * best.d) {
      const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
      best = { c: [u[0] * cu + v[0] * cv, u[1] * cu + v[1] * cv], u, v, w, d, fill: 0 };
    }
  }
  const box = best ?? { c: centroid(ring), u: [1, 0], v: [0, 1], w: 1, d: 1, fill: 1 };
  if (box.w < box.d) { const [u, v, w, d] = [box.v, box.u, box.d, box.w]; box.u = u; box.v = v; box.w = w; box.d = d; } // u along the long side
  box.fill = Math.abs(signedArea(ring)) / (box.w * box.d);
  return box;
}

/** A flat polygon at y, wound for +y. */
export function flat(sink: Sink, ring: Ring, y: number): void {
  if (ring.length < 3) return;
  const r = signedArea(ring) > 0 ? [...ring].reverse() : ring;
  for (const [a, b, c] of earcut(r)) sink.tri([r[a][0], y, r[a][1]], [r[b][0], y, r[b][1]], [r[c][0], y, r[c][1]]);
}

/** A line as a ribbon of quads, w wide, at y. */
export function ribbon(sink: Sink, line: Ring, w: number, y: number): void {
  for (let i = 0; i + 1 < line.length; i++) {
    const [x0, z0] = line[i], [x1, z1] = line[i + 1];
    const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1;
    const nx = (-dz / l) * (w / 2), nz = (dx / l) * (w / 2);
    sink.quad([x0 + nx, y, z0 + nz], [x0 - nx, y, z0 - nz], [x1 - nx, y, z1 - nz], [x1 + nx, y, z1 + nz]);
  }
}

/**
 * A hip roof on a rectangle: the eave at `eave`, the ridge along the long axis, rising at `pitch` radians and no
 * more than `maxRise` metres, the ends pyramidal. Four faces wound outward.
 */
export function hipRoof(sink: Sink, box: Obb, eave: number, pitch = 0.6, maxRise = 6, overhang = 0.4): void {
  const w = box.w + 2 * overhang, d = box.d + 2 * overhang;
  const rise = Math.min(maxRise, (d / 2) * Math.tan(pitch));
  const at = (pu: number, pv: number, y: number): [number, number, number] => [box.c[0] + box.u[0] * pu + box.v[0] * pv, y, box.c[1] + box.u[1] * pu + box.v[1] * pv];
  const hw = w / 2, hd = d / 2, rl = Math.max(0, hw - hd); // the ridge is the long side less the two pyramidal ends
  const A = at(-hw, -hd, eave), B = at(hw, -hd, eave), C = at(hw, hd, eave), D = at(-hw, hd, eave);
  const R0 = at(-rl, 0, eave + rise), R1 = at(rl, 0, eave + rise);
  // wound so each face looks outward and up: the winding depends on the axes' handedness
  const handed = box.u[0] * box.v[1] - box.u[1] * box.v[0] > 0;
  const face = (p: Array<[number, number, number]>) => { const q = handed ? [...p].reverse() : p; if (q.length === 3) sink.tri(q[0], q[1], q[2]); else sink.quad(q[0], q[1], q[2], q[3]); };
  face([A, B, R1, R0]); face([C, D, R0, R1]); face([B, C, R1]); face([D, A, R0]);
}

/** A tree seen from the air: a squat canopy on a stub of trunk, tinted a green of its own. */
export function treeBlob(canopy: Sink, trunk: Sink, x: number, z: number, r: number, h: number, rnd: () => number): void {
  const g = 0.22 + rnd() * 0.16;
  canopy.color(hex([g * 0.75, g, g * 0.45]));
  canopy.sphere(x, h, z, r, r * 0.8, r * (0.9 + rnd() * 0.2), 7, 4);
  trunk.color('#4A3A2A');
  trunk.box(x, h / 2, z, 0.5, h, 0.5);
}

const WALL_TINT: Record<CampusKind, () => number[]> = {
  stone: () => [0.5, 0.5, 0.47], concrete: () => [0.66, 0.65, 0.6], brick: () => [0.5, 0.31, 0.24], glass: () => [0.5, 0.62, 0.72], house: () => [0.8, 0.78, 0.72], dome: () => [0.86, 0.87, 0.85],
};
const ROOF_TINT: Record<CampusKind, number[]> = { stone: [0.33, 0.34, 0.36], concrete: [0.5, 0.5, 0.48], brick: [0.48, 0.47, 0.45], glass: [0.4, 0.42, 0.44], house: [0.3, 0.28, 0.27], dome: [0.92, 0.93, 0.92] };
const SLATE = [0.2, 0.21, 0.24], COPPER = '#5E8C7A', CLOCK = '#F4F1E6';

/**
 * The campus into its sinks: `walls` (facade tile in metres, tinted), `roofs` (flat roofs, hips, plant rooms, tinted),
 * `copper` (the Hicks tower's roof), `clock` (its faces), `lawn` (the campus ground and its greens), `paving` (footpaths),
 * `asphalt` (service roads, car parks), `turf` (Wickwire Field, uv 0..1 for its lines), `canopy` and `trunk` (the trees).
 */
export function dalhousieCampus(walls: Sink, roofs: Sink, copper: Sink, clock: Sink, lawn: Sink, paving: Sink, asphalt: Sink, turf: Sink, canopy: Sink, trunk: Sink): void {
  const rnd = rng(23);
  const wallUv = { u0: 0, v0: 0, perU: 1, perV: 1 };
  for (const b of DALHOUSIE.buildings) {
    const ring = ringOf(b.p);
    if (ring.length < 3) continue;
    const base = WALL_TINT[b.k]();
    const tint = b.k === 'house'
      ? (rnd() < 0.12 ? [[0.55, 0.16, 0.12], [0.16, 0.3, 0.5], [0.7, 0.55, 0.2], [0.2, 0.42, 0.28]][Math.floor(rnd() * 4)] : (() => { const g = 0.62 + rnd() * 0.3; return [g, g * (0.95 + rnd() * 0.06), g * (0.86 + rnd() * 0.1)]; })())
      : base.map((v) => v * (0.94 + rnd() * 0.12));
    walls.color(hex(tint));
    const box = obb(ring);
    const hip = b.r === 'hip' && box.fill > 0.72 && box.d > 5;
    if (b.r === 'dome') {
      walls.extrude(ring, 0, b.h, wallUv, roofs.color(hex(ROOF_TINT.dome)));
      roofs.color(hex(ROOF_TINT.dome)).sphere(box.c[0], b.h, box.c[1], box.w * 0.46, Math.min(12, box.d * 0.3), box.d * 0.46, 20, 6, undefined, 0.5);
      continue;
    }
    if (hip) {
      roofs.color(hex(b.k === 'house' ? ROOF_TINT.house.map((v) => v * (0.85 + rnd() * 0.3)) : SLATE));
      walls.extrude(ring, 0, b.h, wallUv, roofs); // the flat cap closes the eave under the hip
      hipRoof(roofs, box, b.h, b.k === 'house' ? 0.62 : 0.55, b.k === 'house' ? 3.2 : 6);
    } else {
      roofs.color(hex(ROOF_TINT[b.k].map((v) => v * (0.92 + rnd() * 0.16))));
      walls.extrude(ring, 0, b.h, wallUv, roofs);
      const a = Math.abs(signedArea(ring));
      if (a > 900) { // plant rooms and a parapet on the big flat roofs
        const n = a > 3000 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const pu = (rnd() - 0.5) * box.w * 0.4, pv = (rnd() - 0.5) * box.d * 0.4;
          const cx = box.c[0] + box.u[0] * pu + box.v[0] * pv, cz = box.c[1] + box.u[1] * pu + box.v[1] * pv;
          roofs.color(hex([0.58, 0.58, 0.56])).box(cx, b.h + 1.6, cz, 6 + rnd() * 5, 3.2, 4 + rnd() * 3).rotateY(cx, cz, Math.atan2(box.u[1], box.u[0]), roofs.count - 36);
        }
      }
    }
    if (b.x === 'tower') { // the Hicks clock tower: square, stone, a copper pyramid, four faces
      const tx = box.c[0] + box.u[0] * (box.w * 0.18), tz = box.c[1] + box.u[1] * (box.w * 0.18), top = 38;
      const sq: Ring = [[tx - 4.5, tz - 4.5], [tx + 4.5, tz - 4.5], [tx + 4.5, tz + 4.5], [tx - 4.5, tz + 4.5]];
      walls.color(hex([0.52, 0.52, 0.49])).extrude(sq, b.h, top, wallUv, roofs.color(hex(SLATE)));
      const cap: Ring = [[tx - 5, tz - 5], [tx + 5, tz - 5], [tx + 5, tz + 5], [tx - 5, tz + 5]];
      copper.color(COPPER).extrude(cap, top, top + 0.6, undefined, copper);
      const pyr = copper.count;
      copper.lathe([[7.2, 0], [0.35, 8], [0.35, 9.5]], tx, top + 0.6, tz, 1, 1, 0, 4).rotateY(tx, tz, Math.PI / 4, pyr); // four faces, the corners over the tower's
      clock.color(CLOCK);
      for (const [dx, dz, rot] of [[4.55, 0, 0], [-4.55, 0, 0], [0, 4.55, Math.PI / 2], [0, -4.55, Math.PI / 2]] as const) {
        const start = clock.count;
        clock.cylinder(tx + dx, top - 4, tz + dz, 1.9, 0.15, 16).rotateZ(tx + dx, top - 4, Math.PI / 2, start); // a disc on its side, facing ±x
        if (rot) clock.rotateY(tx + dx, tz + dz, rot, start); // then round to face ±z
      }
    }
  }
  // the ground: the campus lawn under everything, the quad and the greens on it, then paving, asphalt, the pitch
  flat(lawn, ringOf(DALHOUSIE.campus), 0.06);
  for (const g of DALHOUSIE.greens) flat(lawn, ringOf(g.p), 0.09);
  for (const p of DALHOUSIE.parking) flat(asphalt, ringOf(p), 0.11);
  for (const p of DALHOUSIE.paths) ribbon(p.a ? asphalt : paving, ringOf(p.p), p.w, p.a ? 0.12 : 0.14);
  for (const p of DALHOUSIE.pitches) {
    const ring = ringOf(p.p), box = obb(ring);
    const at = (pu: number, pv: number): [number, number, number] => [box.c[0] + box.u[0] * pu + box.v[0] * pv, 0.15, box.c[1] + box.u[1] * pu + box.v[1] * pv];
    const hw = box.w / 2, hd = box.d / 2, handed = box.u[0] * box.v[1] - box.u[1] * box.v[0] > 0;
    const q: Array<[number, number, number]> = [at(-hw, -hd), at(hw, -hd), at(hw, hd), at(-hw, hd)];
    const uv: Array<[number, number]> = [[0, 0], [1, 0], [1, 1], [0, 1]];
    if (handed) turf.quad(q[3], q[2], q[1], q[0], [uv[3], uv[2], uv[1], uv[0]]); else turf.quad(q[0], q[1], q[2], q[3], [uv[0], uv[1], uv[2], uv[3]]);
  }
  for (const [x, z] of campusTrees()) treeBlob(canopy, trunk, x, z, 3.2 + rnd() * 2.6, 5 + rnd() * 3, rnd);
}

/** Where the trees stand: the mapped ones, the avenue's rows and the quad's ring from the export, and a scatter over the lawns clear of the buildings. */
export function campusTrees(): Array<[number, number]> {
  const out: Array<[number, number]> = DALHOUSIE.trees.map(([x, z]) => [x, z]);
  const rnd = rng(101);
  const campus = ringOf(DALHOUSIE.campus);
  const inside = (ring: Ring, x: number, z: number) => {
    let hit = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, zi] = ring[i], [xj, zj] = ring[j];
      if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit;
    }
    return hit;
  };
  const buildings = DALHOUSIE.buildings.map((b) => ({ ring: ringOf(b.p), c: centroid(ringOf(b.p)) }));
  const xs = campus.map((p) => p[0]), zs = campus.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  for (let i = 0, placed = 0; i < 4000 && placed < 260; i++) {
    const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0);
    if (!inside(campus, x, z)) continue;
    if (buildings.some((b) => Math.hypot(b.c[0] - x, b.c[1] - z) < 60 && inside(b.ring, x, z))) continue;
    if (buildings.some((b) => Math.hypot(b.c[0] - x, b.c[1] - z) < 60 && b.ring.some(([bx, bz]) => Math.hypot(bx - x, bz - z) < 3.5))) continue;
    if (out.some(([ox, oz]) => Math.hypot(ox - x, oz - z) < 7)) continue;
    out.push([Math.round(x * 2) / 2, Math.round(z * 2) / 2]); placed++;
  }
  return out;
}
