// A built prop is a list of pieces, one per material. Shared by built.ts and walk-built.ts.
import { smoothNormals, flatNormals, type Geo } from './rig.ts';

export type BuiltSurface =
  | { mat: string } // a designed material from materials.ts
  | { paint: string }; // a canvas painted at runtime, 'name' or 'name:frame' (window, whiteboard, banner, poster:0, poster:1, sign)

/** `aux` is four numbers a vertex for a material's own use (the leaves: three randoms a card, the same at its six corners). */
export interface Built { pos: Float32Array; nor: Float32Array; uv: Float32Array; surface: BuiltSurface; col?: Float32Array; aux?: Float32Array }
export type BuiltPart = Built[];

/** Sink geometry to a piece. `smooth` welds and averages normals under 62 degrees; `metres` sets uv from world metres, u from the first axis named and v from the second (xz for floors, xy for hanging things, zy for a wall along z, yz for boards upright on it). */
export function piece(g: Geo, surface: BuiltSurface, o: { smooth?: boolean; metres?: 'xz' | 'xy' | 'zy' | 'zx' | 'yz' | 'yx'; tint?: boolean } = {}): Built {
  const nor = o.smooth ? smoothNormals(g.pos, 62) : flatNormals(g.pos);
  let uv = g.uv;
  if (o.metres) {
    uv = new Float32Array((g.pos.length / 3) * 2);
    for (let i = 0; i < g.pos.length / 3; i++) {
      const x = g.pos[i * 3], y = g.pos[i * 3 + 1], z = g.pos[i * 3 + 2];
      const at = (k: string) => (k === 'x' ? x : k === 'y' ? y : z);
      uv[i * 2] = at(o.metres[0]);
      uv[i * 2 + 1] = at(o.metres[1]);
    }
  }
  return { pos: g.pos, nor, uv, surface, ...(o.tint ? { col: g.col } : {}) };
}

export const M = (mat: string): BuiltSurface => ({ mat });
