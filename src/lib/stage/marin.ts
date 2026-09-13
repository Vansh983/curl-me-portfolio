// The Marin Headlands, the Presidio bluffs and the shores of the Golden Gate from real elevation data (marin.json,
// scripts/stage-terrain.mjs: Mapzen Terrarium tiles over SRTM, sampled about Crissy Field). Built at 1:2 about that
// point so the bridge and the hills behind it sit inside the camera's far plane. Scene frame: the balcony looks down
// -z, which is the bearing from Crissy Field to the bridge's middle (37.5 degrees west of north); +x is to the right.
import type { V3 } from './rig.ts';
import marin from './marin.json' with { type: 'json' };
import { Sink } from './rig.ts';

const MARIN = marin as unknown as { n: number; m: number; east: [number, number]; north: [number, number]; heights: number[][] };
/** The bearing the balcony looks along, from Crissy Field to the bridge's middle: 37.5 degrees west of north. */
export const VIEW_BEARING = (-37.5 * Math.PI) / 180;
/** Real east and north metres about Crissy Field to the scene's x and z (before the 1:2). */
export const toScene = (e: number, n: number): [number, number] => [e * Math.cos(VIEW_BEARING) - n * Math.sin(VIEW_BEARING), -(e * Math.sin(VIEW_BEARING) + n * Math.cos(VIEW_BEARING))];

/** The land round the Golden Gate into `sink`, sea level at y 0, each vertex its own colour: summer grass, scrub in the folds, rock where it is steep, sand at the shore. */
export function marinHills(sink: Sink, scale = 0.5, nearest = 250): void {
  const { n, m, east: [e0, e1], north: [n0, n1], heights } = MARIN;
  const E = (i: number) => e0 + ((e1 - e0) * i) / (n - 1), Nn = (j: number) => n0 + ((n1 - n0) * j) / (m - 1);
  const de = (e1 - e0) / (n - 1), dn = (n1 - n0) / (m - 1);
  const hash = (a: number, b: number) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  const colour = (h: number, slope: number, i: number, j: number): V3 => {
    const k = (hash(i, j) - 0.5) * 0.07, scrub = hash(j * 3 + 1, i * 7 + 2); // the coastal scrub sits in patches
    if (h < 14) return [0.62 + k, 0.58 + k, 0.48 + k]; // the beach and the shore rock
    const grass: V3 = [0.62 + k, 0.55 + k, 0.33 + k], green: V3 = [0.33 + k, 0.42 + k, 0.24 + k], rock: V3 = [0.46 + k, 0.42 + k, 0.37 + k];
    const g = scrub < 0.35 ? 1 : 0, base: V3 = [grass[0] + (green[0] - grass[0]) * g, grass[1] + (green[1] - grass[1]) * g, grass[2] + (green[2] - grass[2]) * g];
    const r = Math.max(0, Math.min(1, (slope - 0.5) / 0.4));
    return [base[0] + (rock[0] - base[0]) * r, base[1] + (rock[1] - base[1]) * r, base[2] + (rock[2] - base[2]) * r];
  };
  const at = (j: number, i: number): V3 => {
    const h = heights[j][i];
    const gx = (heights[j][Math.min(n - 1, i + 1)] - heights[j][Math.max(0, i - 1)]) / (2 * de), gz = (heights[Math.min(m - 1, j + 1)][i] - heights[Math.max(0, j - 1)][i]) / (2 * dn);
    return colour(h, Math.min(1, Math.hypot(gx, gz) / 0.9), i, j);
  };
  const P = (j: number, i: number): V3 => { const [x, z] = toScene(E(i), Nn(j)); return [x * scale, heights[j][i] * scale, z * scale]; };
  for (let j = 0; j + 1 < m; j++) {
    for (let i = 0; i + 1 < n; i++) {
      const h00 = heights[j][i], h10 = heights[j][i + 1], h01 = heights[j + 1][i], h11 = heights[j + 1][i + 1];
      if (h00 + h10 + h01 + h11 < 8) continue; // the water: the sea plane is there already
      if (Math.hypot(E(i), Nn(j)) < nearest) continue; // the balcony stands here
      const a = P(j, i), b = P(j, i + 1), c = P(j + 1, i + 1), d = P(j + 1, i);
      const ca = at(j, i), cb = at(j, i + 1), cc = at(j + 1, i + 1), cd = at(j + 1, i);
      // wound to face up: the grid's north row is at -z, its east column at +x when the bearing is north
      sink.tric(a, c, b, ca, cc, cb);
      sink.tric(a, d, c, ca, cd, cc);
    }
  }
}
