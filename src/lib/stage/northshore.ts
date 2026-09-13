// The North Shore mountains behind Vancouver from real elevation data (northshore.json, scripts/stage-northshore.mjs:
// Mapzen Terrarium tiles over SRTM, sampled about the Convention Centre West). Built at 1:6 so the whole range fits
// inside the sky dome: a mountain 1,200 m tall 10 km off and one 200 m tall 1.7 km off fill the same part of the eye.
// Scene frame: real north toward -x (across the water from the terrace), real east toward -z.
import type { V3 } from './rig.ts';
import northshore from './northshore.json' with { type: 'json' };
import { Sink } from './rig.ts';

interface Grid { source: string; n: number; m: number; x: [number, number]; z: [number, number]; heights: number[][] }
export const NORTHSHORE = northshore as Grid;

const hex = (c: number[]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(1, v)) ** (1 / 2.2) * 255).toString(16).padStart(2, '0')).join('');

/** The range as one mesh: forest below the tree line, rock above it, snow on the tops, the flats at the shore left out. */
export function northShore(sink: Sink, scale = 1 / 6, nearest = 150, rise = 1.35): void {
  const Y = (h: number) => h * scale * rise; // the range stood up a little, the way haze and distance make it read from the shore
  const { n, m, x: [x0, x1], z: [z0, z1], heights } = NORTHSHORE;
  const X = (j: number) => (x1 + ((x0 - x1) * j) / (m - 1)) * scale; // row 0 is the south edge (the near shore, x1), the last row the far north (x0)
  const Z = (i: number) => -(z0 + ((z1 - z0) * i) / (n - 1)) * scale; // real east toward -z
  // each vertex its own colour: conifer green up to the treeline, paler with height, bare rock where it is steep or high,
  // snow on the tops (lower on gentle ground), a little hash noise so the bands do not read as contour lines
  const hash = (a: number, b: number) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  const colour = (h: number, slope: number, i: number, j: number): V3 => {
    const n = (hash(i, j) - 0.5) * 0.08;
    if (h > 1250 - (1 - slope) * 150) return [0.86 + n, 0.88 + n, 0.9 + n];
    const rock: V3 = [0.42 + n, 0.4 + n, 0.37 + n];
    if (h > 1050) return rock;
    const t = Math.min(1, h / 1050), forest: V3 = [0.15 + t * 0.14 + n, 0.29 + t * 0.12 + n, 0.16 + t * 0.08 + n];
    const r = Math.max(0, Math.min(1, (slope - 0.55) / 0.35)); // the steep faces show rock through the trees
    return [forest[0] + (rock[0] - forest[0]) * r, forest[1] + (rock[1] - forest[1]) * r, forest[2] + (rock[2] - forest[2]) * r];
  };
  const dx = Math.abs(X(1) - X(0)) / scale, dz = Math.abs(Z(1) - Z(0)) / scale; // a cell in real metres
  const at = (j: number, i: number): V3 => {
    const h = heights[j][i];
    const gx = (heights[Math.min(m - 1, j + 1)][i] - heights[Math.max(0, j - 1)][i]) / (2 * dx), gz = (heights[j][Math.min(n - 1, i + 1)] - heights[j][Math.max(0, i - 1)]) / (2 * dz);
    return colour(h, Math.min(1, Math.hypot(gx, gz) / 0.9), i, j); // 0.9: a 42 degree face is as steep as it reads
  };
  for (let j = 0; j + 1 < m; j++) {
    for (let i = 0; i + 1 < n; i++) {
      const h00 = heights[j][i], h10 = heights[j][i + 1], h01 = heights[j + 1][i], h11 = heights[j + 1][i + 1];
      if (h00 + h10 + h01 + h11 < 8) continue; // the water and the flats: the water plane is there already
      const xa = X(j), xb = X(j + 1), za = Z(i), zb = Z(i + 1);
      if (Math.max(Math.abs(xa), Math.abs(xb)) < nearest) continue;
      const c00 = at(j, i), c10 = at(j, i + 1), c01 = at(j + 1, i), c11 = at(j + 1, i + 1);
      sink.tric([xa, Y(h00), za], [xa, Y(h10), zb], [xb, Y(h11), zb], c00, c10, c11);
      sink.tric([xa, Y(h00), za], [xb, Y(h11), zb], [xb, Y(h01), za], c00, c11, c01);
    }
  }
}
