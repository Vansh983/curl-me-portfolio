// Rooms as geometry: a floor, four walls with holes for doors and windows, a ceiling. Every
// vertex carries a normal facing into the room and a uv in metres, so a material's tile size
// means the same wherever the wall is.
import type { Shell, Opening, InnerWall } from './sets.ts';

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

/**
 * Splits a wall rectangle (u along the wall, v up) around its holes into solid rectangles, on one grid: every line a
 * hole's edge lies on runs the wall's whole length or height, so two rectangles that touch share a whole edge and
 * its two corners. Welded, the wall is one surface: baked, one island of the lightmap, with no seam up from a door's head.
 */
function cut(u0: number, u1: number, h: number, holes: Rect[]): Rect[] {
  const inside = holes.map(([a0, b0, a1, b1]): Rect => [Math.max(u0, a0), Math.max(0, b0), Math.min(u1, a1), Math.min(h, b1)]).filter(([a0, b0, a1, b1]) => a1 > a0 && b1 > b0);
  const lines = (ends: number[]): number[] => [...new Set(ends.map((v) => +v.toFixed(6)))].sort((a, b) => a - b);
  const us = lines([u0, u1, ...inside.flatMap((r) => [r[0], r[2]])]), vs = lines([0, h, ...inside.flatMap((r) => [r[1], r[3]])]);
  const rects: Rect[] = [];
  for (let i = 0; i + 1 < us.length; i++) for (let j = 0; j + 1 < vs.length; j++) {
    const cu = (us[i] + us[i + 1]) / 2, cv = (vs[j] + vs[j + 1]) / 2;
    if (!inside.some(([a0, b0, a1, b1]) => cu > a0 && cu < a1 && cv > b0 && cv < b1)) rects.push([us[i], vs[j], us[i + 1], vs[j + 1]]);
  }
  return rects;
}

interface Wall { id: Opening['wall']; o: P3; a: P3; n: P3; len: number; from: number }

export function buildShell(s: Shell): { floor: Slab; walls: Slab; ceiling: Slab } {
  const [x0, x1] = s.x, [z0, z1] = s.z, h = s.h, y0 = s.y ?? 0, tf = 1, tw = 1;
  const floor = new Bag(), ceiling = new Bag(), walls = new Bag();
  floor.rect([x0, y0, z0], [x1 - x0, 0, 0], [0, 0, z1 - z0], [0, 1, 0], [x0 / tf, z0 / tf], (x1 - x0) / tf, (z1 - z0) / tf);
  ceiling.rect([x0, y0 + h, z1], [x1 - x0, 0, 0], [0, 0, z0 - z1], [0, -1, 0], [x0 / tf, z1 / tf], (x1 - x0) / tf, (z0 - z1) / tf);
  // each wall: an origin, a unit vector along it, its inward normal; u runs along the wall in metres
  const WALLS: Wall[] = [
    { id: 'z-', o: [x0, y0, z0], a: [1, 0, 0], n: [0, 0, 1], len: x1 - x0, from: x0 },
    { id: 'x+', o: [x1, y0, z0], a: [0, 0, 1], n: [-1, 0, 0], len: z1 - z0, from: z0 },
    { id: 'z+', o: [x1, y0, z1], a: [-1, 0, 0], n: [0, 0, -1], len: x1 - x0, from: x1 },
    { id: 'x-', o: [x0, y0, z1], a: [0, 0, -1], n: [1, 0, 0], len: z1 - z0, from: z1 },
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
      const o: P3 = [w.o[0] + w.a[0] * u0, y0 + v0, w.o[2] + w.a[2] * u0]; // v runs from the floor: a raised floor lifts the wall and its openings
      walls.rect(o, [w.a[0] * (u1 - u0), 0, w.a[2] * (u1 - u0)], [0, v1 - v0, 0], w.n, [u0 / tw, v0 / tw], (u1 - u0) / tw, (v1 - v0) / tw);
    }
  }
  for (const w of s.walls ?? []) innerWall(walls, w, h, tw);
  return { floor: floor.out(), walls: walls.out(), ceiling: ceiling.out() };
}

/** A partition: both faces cut round its doors, the door reveals (two jambs and a lintel); its ends and top sit in other walls and the ceiling. */
function innerWall(walls: Bag, w: InnerWall, h: number, tw: number): void {
  const t = w.t ?? 0.12;
  const dx = w.to[0] - w.from[0], dz = w.to[1] - w.from[1], len = Math.hypot(dx, dz);
  const a: P3 = [dx / len, 0, dz / len], n: P3 = [a[2], 0, -a[0]];
  const holes: Rect[] = (w.doors ?? []).map((d) => [d.at - d.w / 2, 0, d.at + d.w / 2, d.h]);
  const at = (u: number, side: number, v = 0): P3 => [w.from[0] + a[0] * u + n[0] * side, v, w.from[1] + a[2] * u + n[2] * side];
  for (const side of [1, -1]) {
    const nn: P3 = [n[0] * side, 0, n[2] * side];
    for (const [u0, v0, u1, v1] of cut(0, len, h, holes))
      walls.rect(at(u0, (side * t) / 2, v0), [a[0] * (u1 - u0), 0, a[2] * (u1 - u0)], [0, v1 - v0, 0], nn, [u0 / tw, v0 / tw], (u1 - u0) / tw, (v1 - v0) / tw);
  }
  for (const d of w.doors ?? []) {
    const u0 = d.at - d.w / 2, u1 = d.at + d.w / 2, across: P3 = [n[0] * t, 0, n[2] * t];
    walls.rect(at(u0, -t / 2), across, [0, d.h, 0], a, [0, 0], t / tw, d.h / tw); // the jamb facing into the doorway from `from`'s side
    walls.rect(at(u1, -t / 2), across, [0, d.h, 0], [-a[0], 0, -a[2]], [0, 0], t / tw, d.h / tw);
    walls.rect(at(u0, -t / 2, d.h), [a[0] * d.w, 0, a[2] * d.w], across, [0, -1, 0], [u0 / tw, 0], d.w / tw, t / tw); // the lintel
  }
}
