// The hall on its feet (docs/rebuild/39-crowd-research.md): who stands where. A full house the way a convocation
// fills one: rows 0.9 m apart, three to a tier, seats 0.58 m wide, two aisles, the graduates in their gowns in a block
// at the front between the aisles, their families round and behind them, a seat empty here and there in clusters.
// Each person is a card cut from a render of a real figure (scripts/stage-crowd.mjs); the runtime draws them all in
// two calls (stage-run.ts). Pure: the same house every time, from a fixed seed.
import { STAGE, houseFloorY, type V3 } from './sets.ts';

export type CrowdKind = 'gown' | 'family';
export type CrowdAction = 'clap' | 'cheer' | 'phone' | 'idle';
/** One of the rendered loops in the atlas (public/assets/stage/crowd/people.json). */
export interface CrowdLoop { atlas: 'near' | 'far'; id: string; kind: CrowdKind; action: CrowdAction; x: number; y: number; frames: number; height: number }
export interface CrowdSheet { metres: [number, number]; feet: number; atlases: Record<'near' | 'far', { file: string; size: [number, number]; cell: [number, number] }>; people: CrowdLoop[] }
/** Someone in the house: where their feet are, which rows' atlas they are drawn from, who they are and what they do, and the numbers that keep them from their neighbours' step. */
export interface CrowdSeat { at: V3; row: number; seat: number; near: boolean; kind: CrowdKind; action: CrowdAction; pick: number; phase: number; rate: number; size: number; mirror: boolean; light: number; haze: number }

export const CROWD = {
  first: 2.6, // the front row, from the stage's edge
  pitch: 0.9, // row to row
  seat: 0.58,
  side: 1.0, // clear of the side walls
  aisle: [-4.5, 4.5] as [number, number], // the aisles, from the house's middle, each 1.2 m wide
  near: 4, // the rows on the flat floor, drawn from the larger renders
  gownRows: 9, // how deep the graduates' block runs
  /** A loop's length in seconds: a clap, an arm in the air, a slow shift of weight. */
  period: { clap: 0.52, cheer: 1.5, phone: 4.2, idle: 4.2 } as Record<CrowdAction, number>,
} as const;

export function crowdSeats(): CrowdSeat[] {
  let seed = 977;
  const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  const { hall: [h0, h1], hallZ: [z0, z1] } = STAGE, mid = (z0 + z1) / 2, out: CrowdSeat[] = [];
  // empty seats come in clusters: a coarse field over rows and seats, the same for every load
  const gaps = Array.from({ length: 64 }, () => rnd());
  const gap = (row: number, seat: number) => gaps[(Math.floor(row / 2) * 7 + Math.floor(seat / 3) * 13) % gaps.length];
  for (let row = 0, x = h0 + CROWD.first; x < h1 - 0.8; row++, x += CROWD.pitch) {
    const t = row / 31, full = row < 3 ? 0.97 : 0.9 - 0.12 * t; // the front rows are full; the back thins a little
    for (let seat = 0, z = z0 + CROWD.side; z < z1 - CROWD.side; seat++, z += CROWD.seat) {
      const r = [rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd()];
      if (CROWD.aisle.some((a) => Math.abs(z - mid - a) < 0.6)) continue;
      if (gap(row, seat) > full + 0.04 || r[0] > full + 0.06) continue;
      const kind: CrowdKind = row < CROWD.gownRows && Math.abs(z - mid) < CROWD.aisle[1] - 0.6 ? 'gown' : 'family';
      const a = r[1], action: CrowdAction = kind === 'gown' ? (a < 0.68 ? 'clap' : a < 0.84 ? 'cheer' : 'idle') : a < 0.55 ? 'clap' : a < 0.68 ? 'phone' : a < 0.8 ? 'cheer' : 'idle';
      const px = x + (r[2] - 0.5) * 0.22;
      out.push({
        at: [px, houseFloorY(x), z + (r[3] - 0.5) * 0.14], row, seat, near: row < CROWD.near, kind, action,
        pick: Math.floor(r[4] * 1000), phase: r[5] * 8, rate: 0.84 + r[6] * 0.34, mirror: r[4] * 1000 % 2 < 1,
        size: 0.92 + r[7] * 0.14, // the figures come in nearly two heights, the women's and the men's: the spread is given here
        light: (0.16 + 0.84 * Math.exp(-row / 6.5)) * (0.86 + 0.28 * r[6]), // the stage's light reaches the front rows and falls away row by row
        haze: Math.min(0.62, 0.02 + 0.66 * t), // the back of the house goes into the hall's dark air
      });
    }
  }
  return out;
}

/** The loop a seat is drawn from: one of its kind doing what it does, in its rows' atlas, and not the one beside it or in front of it when another will do. */
export function crowdLoop(sheet: CrowdSheet, s: CrowdSeat, taken: number[]): number {
  const atlas = s.near ? 'near' : 'far', all = sheet.people.map((p, i) => ({ p, i })).filter(({ p }) => p.atlas === atlas);
  const same = all.filter(({ p }) => p.kind === s.kind), pool = same.filter(({ p }) => p.action === s.action);
  const from = pool.length ? pool : same.length ? same : all;
  for (let k = 0; k < from.length; k++) { const c = from[(s.pick + k) % from.length]; if (!taken.includes(c.i)) return c.i; }
  return from[s.pick % from.length].i;
}
