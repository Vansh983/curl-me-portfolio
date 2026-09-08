// The Halifax peninsula under the aircraft window, from OpenStreetMap (scripts/stage-halifax.mjs writes
// halifax.json: footprints, streets, the sea from the coastline, parks and lakes, in metres about the
// point the aircraft passes with the campus abeam; x to starboard, z toward -ahead). Daylight, so the
// buildings are lit by the sun and only tinted here: painted wood, pale blocks, stone institutions.
import halifax from './halifax.json' with { type: 'json' };
import { Sink, earcut } from './rig.ts';
import { ringOf } from './city.ts';

export interface HalifaxBuilding { h: number; k?: number; p: number[] }
export interface HalifaxRoad { w: number; p: number[] }
export interface HalifaxGreen { wood: number; p: number[] }
export interface HalifaxData { source: string; origin: [number, number]; heading: number; campus: [number, number]; buildings: HalifaxBuilding[]; roads: HalifaxRoad[]; water: number[][]; lakes: number[][]; greens: HalifaxGreen[] }
export const HALIFAX = halifax as HalifaxData;

/** A linear rgb triple as the sRGB hex Sink.color takes. */
const hex = (c: number[]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(1, v)) ** (1 / 2.2) * 255).toString(16).padStart(2, '0')).join('');

/** A flat polygon at y, wound for +y, into `sink`. */
function flat(sink: Sink, ring: Array<[number, number]>, y: number): void {
  if (ring.length < 3) return;
  // the sea's rectangles and the lakes come from a map: a winding either way, so test the area's sign
  const area = ring.reduce((s, p, i) => { const q = ring[(i + 1) % ring.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
  const r = area > 0 ? [...ring].reverse() : ring;
  for (const [a, b, c] of earcut(r)) sink.tri([r[a][0], y, r[a][1]], [r[b][0], y, r[b][1]], [r[c][0], y, r[c][1]]);
}

/** A street as a ribbon of quads, w wide, at y. */
function ribbon(sink: Sink, line: Array<[number, number]>, w: number, y: number): void {
  for (let i = 0; i + 1 < line.length; i++) {
    const [x0, z0] = line[i], [x1, z1] = line[i + 1];
    const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1;
    const nx = (-dz / l) * (w / 2), nz = (dx / l) * (w / 2);
    sink.quad([x0 + nx, y, z0 + nz], [x0 - nx, y, z0 - nz], [x1 - nx, y, z1 - nz], [x1 + nx, y, z1 + nz]);
  }
}

/**
 * The city into its sinks: `walls` and `roofs` tinted per building, `sea` and `lakes` flat, `greens` the parks
 * and `woods` the darker forest, `roads` the streets a hair above the ground.
 */
export function halifaxCity(walls: Sink, roofs: Sink, sea: Sink, greens: Sink, woods: Sink, roads: Sink): void {
  let seed = 7;
  const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  for (const b of HALIFAX.buildings) {
    const ring = ringOf(b.p);
    if (ring.length < 3) continue;
    // painted wood in Halifax colours, the odd one bold; blocks pale; institutions in stone
    let tint: number[];
    if (b.k === 2) tint = [0.62 + rnd() * 0.08, 0.58 + rnd() * 0.06, 0.5 + rnd() * 0.05];
    else if (b.k === 1) { const g = 0.7 + rnd() * 0.2; tint = [g, g * (0.97 + rnd() * 0.03), g * 0.94]; }
    else {
      const bold = rnd() < 0.12;
      tint = bold ? [[0.55, 0.16, 0.12], [0.16, 0.3, 0.5], [0.7, 0.55, 0.2], [0.2, 0.42, 0.28]][Math.floor(rnd() * 4)]
        : (() => { const g = 0.62 + rnd() * 0.3; return [g, g * (0.95 + rnd() * 0.06), g * (0.86 + rnd() * 0.1)]; })();
    }
    walls.color(hex(tint));
    roofs.color(hex(b.k ? [0.28, 0.29, 0.3] : [0.22 + rnd() * 0.12, 0.17 + rnd() * 0.06, 0.14 + rnd() * 0.06])); // shingles dark, flat roofs grey
    walls.extrude(ring, 0, b.h, undefined, roofs);
  }
  for (const [x0, z0, x1, z1] of HALIFAX.water) sea.quad([x0, 0, z0], [x0, 0, z1], [x1, 0, z1], [x1, 0, z0]);
  for (const ring of HALIFAX.lakes) flat(sea, ringOf(ring), 0.05);
  for (const g of HALIFAX.greens) flat(g.wood ? woods : greens, ringOf(g.p), 0.08);
  for (const r of HALIFAX.roads) ribbon(roads, ringOf(r.p), r.w, 0.12);
}
