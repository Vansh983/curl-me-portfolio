// The North Shore mountains behind Vancouver from real elevation data (northshore.json, scripts/stage-northshore.mjs:
// Mapzen Terrarium tiles over SRTM, sampled about the Convention Centre West). Built at 1:6 so the whole range fits
// inside the sky dome: a mountain 1,200 m tall 10 km off and one 200 m tall 1.7 km off fill the same part of the eye.
// Scene frame: real north toward -x (across the water from the terrace), real east toward -z.
import northshore from './northshore.json' with { type: 'json' };
import { Sink } from './rig.ts';

interface Grid { source: string; n: number; m: number; x: [number, number]; z: [number, number]; heights: number[][] }
export const NORTHSHORE = northshore as Grid;

const hex = (c: number[]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(1, v)) ** (1 / 2.2) * 255).toString(16).padStart(2, '0')).join('');

/** The range as one mesh: forest below the tree line, rock above it, snow on the tops, the flats at the shore left out. */
export function northShore(sink: Sink, scale = 1 / 6, nearest = 150): void {
  const { n, m, x: [x0, x1], z: [z0, z1], heights } = NORTHSHORE;
  const X = (j: number) => (x1 + ((x0 - x1) * j) / (m - 1)) * scale; // row 0 is the south edge (the near shore, x1), the last row the far north (x0)
  const Z = (i: number) => -(z0 + ((z1 - z0) * i) / (n - 1)) * scale; // real east toward -z
  const colour = (h: number, slope: number): number[] => {
    if (h > 1250 - slope * 300) return [0.86, 0.88, 0.9]; // snow on the tops, less where it is steep
    if (h > 1050) return [0.46, 0.44, 0.4]; // rock and alpine meadow
    const t = Math.min(1, h / 1050);
    return [0.16 + t * 0.14, 0.3 + t * 0.12, 0.17 + t * 0.08]; // conifer green, paler up the slope
  };
  for (let j = 0; j + 1 < m; j++) {
    for (let i = 0; i + 1 < n; i++) {
      const h00 = heights[j][i], h10 = heights[j][i + 1], h01 = heights[j + 1][i], h11 = heights[j + 1][i + 1];
      if (h00 + h10 + h01 + h11 < 8) continue; // the water and the flats: the water plane is there already
      const xa = X(j), xb = X(j + 1), za = Z(i), zb = Z(i + 1);
      if (Math.max(Math.abs(xa), Math.abs(xb)) < nearest) continue;
      const slope = Math.abs(h10 - h00) + Math.abs(h01 - h00);
      sink.color(hex(colour((h00 + h10 + h01 + h11) / 4, Math.min(1, slope / 120))));
      sink.tri([xa, h00 * scale, za], [xa, h10 * scale, zb], [xb, h11 * scale, zb]);
      sink.tri([xa, h00 * scale, za], [xb, h11 * scale, zb], [xb, h01 * scale, za]);
    }
  }
}
