// Fixed-count geometry. A rig is params in, positions out, and the vertex count never
// depends on the params. That is what lets station keys become GPU morph targets.
// Non-indexed triangles: three vertices each, so normals are flat per face.
// Every vertex also carries a uv (default: a white corner of the actor's texture) and a
// colour (default white), so one mesh can be many colours and carry painted detail.

export type V3 = [number, number, number];
export type UV = [number, number];
export type UVRect = [number, number, number, number]; // u0 v0 u1 v1
export type Geo = { pos: Float32Array; uv: Float32Array; col: Float32Array };

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => {
  const l = len(a);
  return l < 1e-9 ? [0, 1, 0] : [a[0] / l, a[1] / l, a[2] / l];
};
const madd = (a: V3, b: V3, k: number): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

/** sRGB hex to linear rgb 0..1 (three reads vertex colours as linear). */
export function linear(hex: string): V3 {
  const h = hex.replace('#', '');
  const c = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  const f = (i: number) => {
    const s = parseInt(c.slice(i, i + 2), 16) / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return [f(0), f(2), f(4)];
}

/** Standard uv corners for a quad a,b,c,d inside a rect: a bottom-left, c top-right. */
export const rect = (r: UVRect): [UV, UV, UV, UV] => [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]];
const WHITE: UV = [0.01, 0.01];

/** A local frame along d: side and up perpendicular, right-handed (side, up, d). */
function frame(d: V3): { side: V3; up: V3 } {
  const up0: V3 = Math.abs(d[1]) < 0.99 ? [0, 1, 0] : [0, 0, 1];
  const side = norm(cross(up0, d));
  return { side, up: cross(d, side) };
}

export class Sink {
  pos: number[] = [];
  uv: number[] = [];
  col: number[] = [];
  private c: V3 = [1, 1, 1];

  /** Colour for every vertex emitted after this call. */
  color(hex: string): this {
    this.c = linear(hex);
    return this;
  }
  private push(p: V3, u: UV) {
    this.pos.push(p[0], p[1], p[2]);
    this.uv.push(u[0], u[1]);
    this.col.push(this.c[0], this.c[1], this.c[2]);
  }
  tri(a: V3, b: V3, c: V3, uv: [UV, UV, UV] = [WHITE, WHITE, WHITE]): this {
    this.push(a, uv[0]);
    this.push(b, uv[1]);
    this.push(c, uv[2]);
    return this;
  }
  /** a,b,c,d counter-clockwise seen from outside. */
  quad(a: V3, b: V3, c: V3, d: V3, uv?: [UV, UV, UV, UV]): this {
    if (!uv) return this.tri(a, b, c).tri(a, c, d);
    return this.tri(a, b, c, [uv[0], uv[1], uv[2]]).tri(a, c, d, [uv[0], uv[2], uv[3]]);
  }
  /** Axis-aligned box, 36 vertices. Faces in order +z, -z, +x, -x, +y, -y. Optional uv rects per face. */
  box(cx: number, cy: number, cz: number, w: number, h: number, d: number, faces: Partial<Record<'pz' | 'nz' | 'px' | 'nx' | 'py' | 'ny', UVRect>> = {}): this {
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    const r = (k: keyof typeof faces) => (faces[k] ? rect(faces[k]!) : undefined);
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], r('pz'));
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], r('nz'));
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], r('px'));
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], r('nx'));
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], r('py'));
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], r('ny'));
    return this;
  }
  /** A box from a to b (a limb or a leaning slab), half-widths rw (sideways) and rd (the other way). 36 vertices. */
  bone(a: V3, b: V3, rw: number, rd: number): this {
    const d = norm(sub(b, a));
    const { side, up } = frame(d);
    const c = (base: V3, s: number, u: number): V3 => madd(madd(base, side, s * rw), up, u * rd);
    const A = (s: number, u: number) => c(a, s, u), B = (s: number, u: number) => c(b, s, u);
    this.quad(B(-1, -1), B(1, -1), B(1, 1), B(-1, 1));
    this.quad(A(1, -1), A(-1, -1), A(-1, 1), A(1, 1));
    this.quad(B(1, -1), A(1, -1), A(1, 1), B(1, 1));
    this.quad(A(-1, -1), B(-1, -1), B(-1, 1), A(-1, 1));
    this.quad(B(-1, 1), B(1, 1), A(1, 1), A(-1, 1));
    this.quad(A(-1, -1), A(1, -1), B(1, -1), B(-1, -1));
    return this;
  }
  /** A rounded limb from a to b, radius r: segs*6 side vertices plus two caps of rings*segs*6. */
  capsule(a: V3, b: V3, r: number, segs = 8, rings = 3): this {
    const d = norm(sub(b, a));
    const { side, up } = frame(d);
    const ring = (base: V3, j: number, alpha: number, sign: number): V3 => {
      const th = (j / segs) * Math.PI * 2;
      const rr = r * Math.cos(alpha);
      return madd(madd(madd(base, side, rr * Math.cos(th)), up, rr * Math.sin(th)), d, sign * r * Math.sin(alpha));
    };
    for (let j = 0; j < segs; j++) this.quad(ring(a, j, 0, 1), ring(a, j + 1, 0, 1), ring(b, j + 1, 0, 1), ring(b, j, 0, 1));
    for (let i = 0; i < rings; i++) {
      const a0 = (i / rings) * (Math.PI / 2), a1 = ((i + 1) / rings) * (Math.PI / 2);
      for (let j = 0; j < segs; j++) {
        this.quad(ring(b, j, a0, 1), ring(b, j + 1, a0, 1), ring(b, j + 1, a1, 1), ring(b, j, a1, 1));
        this.quad(ring(a, j + 1, a0, -1), ring(a, j, a0, -1), ring(a, j, a1, -1), ring(a, j + 1, a1, -1));
      }
    }
    return this;
  }
  /**
   * Sphere (or a cap of one), segsW * segsH * 6 vertices. phiMax 1 is the full sphere, 0.5 the top half.
   * uv is equirectangular inside `r`: u around (seam at +x), v from the bottom.
   */
  sphere(cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, segsW = 8, segsH = 6, r?: UVRect, phiMax = 1): this {
    const p = (i: number, j: number): V3 => {
      const phi = (i / segsH) * Math.PI * phiMax, th = (j / segsW) * Math.PI * 2;
      return [cx + rx * Math.sin(phi) * Math.cos(th), cy + ry * Math.cos(phi), cz + rz * Math.sin(phi) * Math.sin(th)];
    };
    const uv = (i: number, j: number): UV => (r ? [r[0] + (r[2] - r[0]) * (j / segsW), r[3] - (r[3] - r[1]) * (i / segsH)] : WHITE);
    for (let i = 0; i < segsH; i++)
      for (let j = 0; j < segsW; j++)
        this.quad(p(i, j), p(i, j + 1), p(i + 1, j + 1), p(i + 1, j), [uv(i, j), uv(i, j + 1), uv(i + 1, j + 1), uv(i + 1, j)]);
    return this;
  }
  /** Cylinder on the y axis, centre (cx, cy, cz), segs * 12 vertices. */
  cylinder(cx: number, cy: number, cz: number, r: number, h: number, segs = 8): this {
    const y0 = cy - h / 2, y1 = cy + h / 2;
    const ring = (j: number, y: number): V3 => {
      const th = (j / segs) * Math.PI * 2;
      return [cx + r * Math.cos(th), y, cz + r * Math.sin(th)];
    };
    for (let j = 0; j < segs; j++) {
      this.quad(ring(j, y0), ring(j, y1), ring(j + 1, y1), ring(j + 1, y0));
      this.tri([cx, y1, cz], ring(j + 1, y1), ring(j, y1));
      this.tri([cx, y0, cz], ring(j, y0), ring(j + 1, y0));
    }
    return this;
  }
  /**
   * Surface of revolution around a vertical axis at (cx, cz), base at cy. profile is [radius, height][]
   * from bottom to top, scaled by sx and sz (elliptical). shear leans the top toward -z.
   * (profile.length - 1) * segs * 6 vertices. uv: u around with the -z front at 0 and the +z back at 0.5,
   * v from bottom to top, inside `r`.
   */
  lathe(profile: [number, number][], cx: number, cy: number, cz: number, sx: number, sz: number, shear = 0, segs = 12, r?: UVRect): this {
    const n = profile.length - 1;
    const p = (i: number, j: number): V3 => {
      const th = (j / segs) * Math.PI * 2 - Math.PI / 2;
      const [rad, y] = profile[i];
      return [cx + rad * sx * Math.cos(th), cy + y, cz + rad * sz * Math.sin(th) - shear * y];
    };
    // u runs the other way round so lettering on the back reads correctly from behind
    const uv = (i: number, j: number): UV => (r ? [r[0] + (r[2] - r[0]) * (1 - j / segs), r[1] + (r[3] - r[1]) * (i / n)] : WHITE);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < segs; j++)
        this.quad(p(i, j), p(i + 1, j), p(i + 1, j + 1), p(i, j + 1), [uv(i, j), uv(i + 1, j), uv(i + 1, j + 1), uv(i, j + 1)]);
    return this;
  }
  /** Rotate every vertex from index `start` (in vertices) around the vertical line through (cx, cz). */
  rotateY(cx: number, cz: number, rad: number, start = 0): this {
    const c = Math.cos(rad), s = Math.sin(rad);
    for (let i = start * 3; i < this.pos.length; i += 3) {
      const x = this.pos[i] - cx, z = this.pos[i + 2] - cz;
      this.pos[i] = cx + x * c + z * s;
      this.pos[i + 2] = cz - x * s + z * c;
    }
    return this;
  }
  /** Rotate around the x axis through (cy, cz). */
  rotateX(cy: number, cz: number, rad: number, start = 0): this {
    const c = Math.cos(rad), s = Math.sin(rad);
    for (let i = start * 3; i < this.pos.length; i += 3) {
      const y = this.pos[i + 1] - cy, z = this.pos[i + 2] - cz;
      this.pos[i + 1] = cy + y * c - z * s;
      this.pos[i + 2] = cz + y * s + z * c;
    }
    return this;
  }
  /** Rotate around the z axis through (cx, cy). */
  rotateZ(cx: number, cy: number, rad: number, start = 0): this {
    const c = Math.cos(rad), s = Math.sin(rad);
    for (let i = start * 3; i < this.pos.length; i += 3) {
      const x = this.pos[i] - cx, y = this.pos[i + 1] - cy;
      this.pos[i] = cx + x * c - y * s;
      this.pos[i + 1] = cy + x * s + y * c;
    }
    return this;
  }
  translate(dx: number, dy: number, dz: number, start = 0): this {
    for (let i = start * 3; i < this.pos.length; i += 3) {
      this.pos[i] += dx;
      this.pos[i + 1] += dy;
      this.pos[i + 2] += dz;
    }
    return this;
  }
  /** Vertex count so far (for the `start` of the transforms). */
  get count(): number {
    return this.pos.length / 3;
  }
  out(): Geo {
    return { pos: Float32Array.from(this.pos), uv: Float32Array.from(this.uv), col: Float32Array.from(this.col) };
  }
}

/** One flat normal per triangle, repeated for its three vertices. Zero-area triangles get (0,1,0). */
export function flatNormals(pos: Float32Array): Float32Array {
  const n = new Float32Array(pos.length);
  for (let i = 0; i < pos.length; i += 9) {
    const a: V3 = [pos[i], pos[i + 1], pos[i + 2]];
    const b: V3 = [pos[i + 3], pos[i + 4], pos[i + 5]];
    const c: V3 = [pos[i + 6], pos[i + 7], pos[i + 8]];
    const v = cross(sub(b, a), sub(c, a));
    const l = len(v);
    const u: V3 = l < 1e-12 ? [0, 1, 0] : [v[0] / l, v[1] / l, v[2] / l];
    for (let k = 0; k < 3; k++) n.set(u, i + k * 3);
  }
  return n;
}
