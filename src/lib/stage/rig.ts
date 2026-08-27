// Fixed-count geometry. A rig is params in, positions out, and the vertex count never
// depends on the params. That is what lets station keys become GPU morph targets.
// Non-indexed triangles: three vertices each, so normals are flat per face.

export type V3 = [number, number, number];

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => {
  const l = len(a);
  return l < 1e-9 ? [0, 1, 0] : [a[0] / l, a[1] / l, a[2] / l];
};
const madd = (a: V3, b: V3, k: number): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

export class Sink {
  pos: number[] = [];

  tri(a: V3, b: V3, c: V3): this {
    this.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    return this;
  }
  /** a,b,c,d counter-clockwise seen from outside. */
  quad(a: V3, b: V3, c: V3, d: V3): this {
    return this.tri(a, b, c).tri(a, c, d);
  }
  /** Axis-aligned box, 36 vertices. Faces in order +z, -z, +x, -x, +y, -y. */
  box(cx: number, cy: number, cz: number, w: number, h: number, d: number): this {
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
    return this;
  }
  /** A box from a to b (a limb), half-widths rw (sideways) and rd (the other way). 36 vertices. */
  bone(a: V3, b: V3, rw: number, rd: number): this {
    const d = norm(sub(b, a));
    const up: V3 = Math.abs(d[1]) < 0.99 ? [0, 1, 0] : [0, 0, 1];
    const side = norm(cross(up, d));
    const up2 = cross(d, side);
    const c = (base: V3, s: number, u: number): V3 => madd(madd(base, side, s * rw), up2, u * rd);
    // local frame (side, up2, d) is right-handed, same face pattern as box with z = d
    const A = (s: number, u: number) => c(a, s, u), B = (s: number, u: number) => c(b, s, u);
    this.quad(B(-1, -1), B(1, -1), B(1, 1), B(-1, 1));
    this.quad(A(1, -1), A(-1, -1), A(-1, 1), A(1, 1));
    this.quad(B(1, -1), A(1, -1), A(1, 1), B(1, 1));
    this.quad(A(-1, -1), B(-1, -1), B(-1, 1), A(-1, 1));
    this.quad(B(-1, 1), B(1, 1), A(1, 1), A(-1, 1));
    this.quad(A(-1, -1), A(1, -1), B(1, -1), B(-1, -1));
    return this;
  }
  /** UV sphere, segsW * segsH * 6 vertices. Pole quads are degenerate so the count stays fixed. */
  sphere(cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, segsW = 8, segsH = 6): this {
    const p = (i: number, j: number): V3 => {
      const phi = (i / segsH) * Math.PI, th = (j / segsW) * Math.PI * 2;
      return [cx + rx * Math.sin(phi) * Math.cos(th), cy + ry * Math.cos(phi), cz + rz * Math.sin(phi) * Math.sin(th)];
    };
    for (let i = 0; i < segsH; i++) for (let j = 0; j < segsW; j++) this.quad(p(i, j), p(i, j + 1), p(i + 1, j + 1), p(i + 1, j));
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
  translate(dx: number, dy: number, dz: number, start = 0): this {
    for (let i = start * 3; i < this.pos.length; i += 3) {
      this.pos[i] += dx;
      this.pos[i + 1] += dy;
      this.pos[i + 2] += dz;
    }
    return this;
  }
  /** Vertex count so far (for rotateY/translate `start`). */
  get count(): number {
    return this.pos.length / 3;
  }
  out(): Float32Array {
    return Float32Array.from(this.pos);
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
