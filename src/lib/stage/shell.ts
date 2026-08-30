// Rooms as geometry: a floor, four walls with holes for doors and windows, a ceiling. Every
// vertex carries a normal facing into the room and a uv in metres, so a material's tile size
// means the same wherever the wall is.
import type { Shell, Opening } from './sets.ts';

export interface Slab { pos: Float32Array; nor: Float32Array; uv: Float32Array }

type P3 = [number, number, number];
type Rect = [number, number, number, number]; // u0, v0, u1, v1 in the wall's own 2d frame

class Bag {
  pos: number[] = [];
  nor: number[] = [];
  uv: number[] = [];
  /** A rectangle from a corner, two edge vectors (a along u, b along v), a normal, and uv (origin, extent along a, extent along b). */
  rect(o: P3, a: P3, b: P3, n: P3, uv0: [number, number], uvA: number, uvB: number): void {
    const p = (s: number, t: number): P3 => [o[0] + a[0] * s + b[0] * t, o[1] + a[1] * s + b[1] * t, o[2] + a[2] * s + b[2] * t];
    const tri = (...pts: [number, number][]) => {
      for (const [s, t] of pts) {
        this.pos.push(...p(s, t));
        this.nor.push(...n);
        this.uv.push(uv0[0] + uvA * s, uv0[1] + uvB * t);
      }
    };
    // counter-clockwise seen from the side the normal points to, when a x b runs along n
    const cx = a[1] * b[2] - a[2] * b[1], cy = a[2] * b[0] - a[0] * b[2], cz = a[0] * b[1] - a[1] * b[0];
    const along = cx * n[0] + cy * n[1] + cz * n[2] > 0;
    if (along) { tri([0, 0], [1, 0], [1, 1]); tri([0, 0], [1, 1], [0, 1]); }
    else { tri([0, 0], [1, 1], [1, 0]); tri([0, 0], [0, 1], [1, 1]); }
  }
  out(): Slab {
    return { pos: new Float32Array(this.pos), nor: new Float32Array(this.nor), uv: new Float32Array(this.uv) };
  }
}

/** Splits a wall rectangle (u along the wall, v up) around its holes into solid rectangles. */
function cut(u0: number, u1: number, h: number, holes: Rect[]): Rect[] {
  let rects: Rect[] = [[u0, 0, u1, h]];
  for (const [hu0, hv0, hu1, hv1] of holes) {
    const next: Rect[] = [];
    for (const [a0, b0, a1, b1] of rects) {
      const ou0 = Math.max(a0, hu0), ou1 = Math.min(a1, hu1), ov0 = Math.max(b0, hv0), ov1 = Math.min(b1, hv1);
      if (ou0 >= ou1 || ov0 >= ov1) { next.push([a0, b0, a1, b1]); continue; }
      if (ou0 > a0) next.push([a0, b0, ou0, b1]);
      if (ou1 < a1) next.push([ou1, b0, a1, b1]);
      if (ov0 > b0) next.push([ou0, b0, ou1, ov0]);
      if (ov1 < b1) next.push([ou0, ov1, ou1, b1]);
    }
    rects = next;
  }
  return rects;
}

interface Wall { id: Opening['wall']; o: P3; a: P3; n: P3; len: number; from: number }

export function buildShell(s: Shell): { floor: Slab; walls: Slab; ceiling: Slab } {
  const [x0, x1] = s.x, [z0, z1] = s.z, h = s.h, tf = 1, tw = 1;
  const floor = new Bag(), ceiling = new Bag(), walls = new Bag();
  floor.rect([x0, 0, z0], [x1 - x0, 0, 0], [0, 0, z1 - z0], [0, 1, 0], [x0 / tf, z0 / tf], (x1 - x0) / tf, (z1 - z0) / tf);
  ceiling.rect([x0, h, z1], [x1 - x0, 0, 0], [0, 0, z0 - z1], [0, -1, 0], [x0 / tf, z1 / tf], (x1 - x0) / tf, (z0 - z1) / tf);
  // each wall: an origin, a unit vector along it, its inward normal; u runs along the wall in metres
  const WALLS: Wall[] = [
    { id: 'z-', o: [x0, 0, z0], a: [1, 0, 0], n: [0, 0, 1], len: x1 - x0, from: x0 },
    { id: 'x+', o: [x1, 0, z0], a: [0, 0, 1], n: [-1, 0, 0], len: z1 - z0, from: z0 },
    { id: 'z+', o: [x1, 0, z1], a: [-1, 0, 0], n: [0, 0, -1], len: x1 - x0, from: x1 },
    { id: 'x-', o: [x0, 0, z1], a: [0, 0, -1], n: [1, 0, 0], len: z1 - z0, from: z1 },
  ];
  for (const w of WALLS) {
    const sign = w.a[0] + w.a[2]; // +1 when u grows with the world axis, -1 otherwise
    const holes: Rect[] = s.openings
      .filter((o) => o.wall === w.id)
      .map((o) => {
        const c = (o.at - w.from) * sign;
        const sill = o.sill ?? 0;
        return [c - o.w / 2, sill, c + o.w / 2, sill + o.h];
      });
    for (const [u0, v0, u1, v1] of cut(0, w.len, h, holes)) {
      const o: P3 = [w.o[0] + w.a[0] * u0, v0, w.o[2] + w.a[2] * u0];
      walls.rect(o, [w.a[0] * (u1 - u0), 0, w.a[2] * (u1 - u0)], [0, v1 - v0, 0], w.n, [u0 / tw, v0 / tw], (u1 - u0) / tw, (v1 - v0) / tw);
    }
  }
  return { floor: floor.out(), walls: walls.out(), ceiling: ceiling.out() };
}
