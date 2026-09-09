// The Halifax peninsula under the aircraft window, from OpenStreetMap (scripts/stage-halifax.mjs writes
// halifax.json: footprints, streets, the sea from the coastline, parks and lakes, in metres about the
// point the aircraft passes with the campus abeam; x to starboard, z toward -ahead). Daylight, so the
// buildings are lit by the sun and only tinted here: painted wood under hip roofs, pale blocks, stone institutions;
// the Studley campus is dalhousie.ts.
import halifax from './halifax.json' with { type: 'json' };
import { Sink } from './rig.ts';
import { ringOf } from './city.ts';

export interface HalifaxBuilding { h: number; k?: number; p: number[] }
export interface HalifaxRoad { w: number; p: number[] }
export interface HalifaxGreen { wood: number; p: number[] }
export interface HalifaxData { source: string; origin: [number, number]; heading: number; campus: [number, number]; buildings: HalifaxBuilding[]; roads: HalifaxRoad[]; water: number[][]; lakes: number[][]; greens: HalifaxGreen[] }
export const HALIFAX = halifax as HalifaxData;

import { obb, hipRoof, flat, ribbon, treeBlob, rng } from './dalhousie.ts';

/** A linear rgb triple as the sRGB hex Sink.color takes. */
const hex = (c: number[]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(1, v)) ** (1 / 2.2) * 255).toString(16).padStart(2, '0')).join('');

/**
 * The city into its sinks: `walls` (the facade tile in metres) and `roofs` tinted per building, the small wooden
 * houses under hip roofs; `sea` and `lakes` flat, `greens` the parks and `woods` the darker forest, `roads` the streets a
 * hair above the ground, `canopy` and `trunk` the street trees along the residential blocks near the track.
 */
export function halifaxCity(walls: Sink, roofs: Sink, sea: Sink, greens: Sink, woods: Sink, roads: Sink, canopy: Sink, trunk: Sink): void {
  const rnd = rng(7);
  const wallUv = { u0: 0, v0: 0, perU: 1, perV: 1 };
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
    const box = b.k ? undefined : obb(ring);
    if (box && b.h <= 9 && box.fill > 0.74 && box.d > 5 && box.d < 22) { // a house: walls to the eave, a dark shingle hip over it
      const g = 0.16 + rnd() * 0.12;
      roofs.color(hex([g * 1.15, g, g * 0.95]));
      walls.extrude(ring, 0, b.h - 2, wallUv, roofs);
      hipRoof(roofs, box, b.h - 2, 0.62, 3.4, 0.35);
    } else {
      roofs.color(hex(b.k ? [0.28, 0.29, 0.3] : [0.22 + rnd() * 0.12, 0.17 + rnd() * 0.06, 0.14 + rnd() * 0.06])); // shingles dark, flat roofs grey
      walls.extrude(ring, 0, b.h, wallUv, roofs);
    }
  }
  for (const [x0, z0, x1, z1] of HALIFAX.water) sea.quad([x0, 0, z0], [x0, 0, z1], [x1, 0, z1], [x1, 0, z0]);
  for (const ring of HALIFAX.lakes) flat(sea, ringOf(ring), 0.05);
  for (const g of HALIFAX.greens) flat(g.wood ? woods : greens, ringOf(g.p), 0.08);
  for (const r of HALIFAX.roads) ribbon(roads, ringOf(r.p), r.w, 0.12);
  // street trees: the leafy blocks near the track, a tree every so often each side of the narrower streets
  for (const r of HALIFAX.roads) {
    if (r.w > 8) continue;
    const line = ringOf(r.p);
    for (let i = 0; i + 1 < line.length; i++) {
      const [x0, z0] = line[i], [x1, z1] = line[i + 1], l = Math.hypot(x1 - x0, z1 - z0);
      if (Math.hypot(x0, z0) > 1500) continue;
      const nx = -(z1 - z0) / l, nz = (x1 - x0) / l;
      for (let d = 12; d < l - 6; d += 26) {
        const side = rnd() < 0.5 ? 1 : -1;
        if (rnd() < 0.3) continue;
        const off = r.w / 2 + 3.5;
        treeBlob(canopy, trunk, x0 + ((x1 - x0) * d) / l + nx * off * side, z0 + ((z1 - z0) * d) / l + nz * off * side, 2.6 + rnd() * 2, 4.5 + rnd() * 2.5, rnd);
      }
    }
  }
}
