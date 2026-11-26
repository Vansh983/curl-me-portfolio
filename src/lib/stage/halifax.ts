// The Halifax peninsula under the aircraft window, from OpenStreetMap (scripts/stage-halifax.mjs writes
// halifax.json: footprints, streets, the sea from the coastline, parks and lakes, in metres about the
// point the aircraft passes with the campus abeam; x to starboard, z toward -ahead). Daylight, so the
// buildings are lit by the sun and only tinted here: painted wood under hip roofs, pale blocks, stone institutions;
// the Studley campus is dalhousie.ts.
import halifax from './halifax.json' with { type: 'json' };
import { Sink } from './rig.ts';
import { ringOf } from './city.ts';
import { flightPoint } from './flight-map.ts';

interface HalifaxBuilding { h: number; k?: number; p: number[] }
interface HalifaxRoad { w: number; p: number[] }
interface HalifaxGreen { wood: number; p: number[] }
interface HalifaxData { source: string; origin: [number, number]; heading: number; campus: [number, number]; buildings: HalifaxBuilding[]; roads: HalifaxRoad[]; water: number[][]; lakes: number[][]; greens: HalifaxGreen[] }
export const HALIFAX = halifax as HalifaxData;

import { obb, hipRoof, treeBlob, rng } from './dalhousie.ts';

/** A linear rgb triple as the sRGB hex Sink.color takes. */
const hex = (c: number[]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(1, v)) ** (1 / 2.2) * 255).toString(16).padStart(2, '0')).join('');

/**
 * The city into its sinks: `walls` (the facade tile in metres) and `roofs` tinted per building, the small wooden
 * houses under hip roofs, street trees along the nearer residential blocks. The map supplies the ground.
 */
export function halifaxCity(walls: Sink, glazing: Sink, roofs: Sink, canopy: Sink, trunk: Sink): void {
  const rnd = rng(7);
  const wallUv = { u0: 0, v0: 0, perU: 1, perV: 1 };
  for (const b of HALIFAX.buildings) {
    const [across, along] = flightPoint(b.p[0], b.p[1]);
    // At a distance the small roofs are already in the map. Keep substantial buildings on the skyline.
    if (b.h < 18 && (Math.abs(across) > 800 || along < -600)) continue;
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
    const skin = b.k === 1 && b.h >= 30 ? glazing : walls;
    skin.color(hex(tint));
    const box = obb(ring);
    if (!b.k && b.h <= 9 && box.fill > 0.74 && box.d > 5 && box.d < 22) { // a house: walls to the eave, a dark shingle hip over it
      const g = 0.16 + rnd() * 0.12;
      roofs.color(hex([g * 1.15, g, g * 0.95]));
      walls.extrude(ring, 0, b.h - 2, wallUv, roofs);
      hipRoof(roofs, box, b.h - 2, 0.62, 3.4, 0.35);
    } else {
      const grey = 0.24 + rnd() * 0.19;
      roofs.color(hex(b.k ? [grey, grey, grey * 0.97] : [0.22 + rnd() * 0.12, 0.17 + rnd() * 0.06, 0.14 + rnd() * 0.06]));
      skin.extrude(ring, 0, b.h, wallUv, roofs);
      // Service housings on broad, nearly rectangular roofs visible from the aircraft.
      if (box.fill > 0.89 && box.d > 18 && b.h >= 15 && Math.abs(across) < 750) {
        const start = roofs.count;
        roofs.color('#aaa9a1').box(box.c[0], b.h + 1.15, box.c[1], Math.min(14, box.w * 0.34), 2.3, Math.min(7, box.d * 0.23));
        roofs.rotateY(box.c[0], box.c[1], -Math.atan2(box.u[1], box.u[0]), start);
      }
    }
  }
  // street trees: the leafy blocks near the track, a tree every so often each side of the narrower streets
  for (const r of HALIFAX.roads) {
    if (r.w > 8) continue;
    const line = ringOf(r.p);
    for (let i = 0; i + 1 < line.length; i++) {
      const [x0, z0] = line[i], [x1, z1] = line[i + 1], l = Math.hypot(x1 - x0, z1 - z0);
      const [across, along] = flightPoint(x0, z0);
      if (Math.abs(across) > 450 || along < -350 || along > 1900) continue;
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
