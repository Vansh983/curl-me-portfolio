// The tour's walk, built: the promenade and what stands along it and beyond it (walk.ts is its script, sets.ts places
// these). World metres unless a builder says it stands at its own origin. The walk runs north along +z at WALK.x: the
// harbour is toward -x, on the right of the walk; the land toward +x, on the left.
import { Sink, tube, type V3 } from './rig.ts';
import { piece, M, type Built, type BuiltPart } from './part.ts';
import { WALK, STRETCH, TRACK, SIGNS, VOLTA_VIEW, VOLTA_LINES, VOLTA_PROJECTOR, VOLTA_RECEPTION, voltaViewBridge } from './walk.ts';
import { CITY, cnTower, ringOf } from './city.ts';
import { HALIFAX } from './halifax.ts';
import { rng, obb, hipRoof } from './dalhousie.ts';

const [P0, P1] = WALK.path, TOP = 0.02, SOUTH = WALK.south;
const J1 = STRETCH.toronto[0], J2 = STRETCH.halifax[0]; // where the paving changes: Vancouver's stone to Toronto's, Toronto's to Halifax's boards
const V0 = WALK.volta.z[0], V1 = WALK.volta.z[1], VX0 = WALK.volta.x[0], VX1 = WALK.volta.x[1], VH = WALK.volta.h;
const EDGE = P0 - 0.36; // the quay's face on the water
const STEP = V0 - 1.5; // where the quay steps out west to carry Volta's glass wall
/** The Bean house's footprint from outside, a wall's thickness beyond the room's. */
const HOUSE = { x0: -7.52, x1: -1.28, z0: -18.32, z1: -13.08, h: 3.05 };
/** Volta's building: over the room and on to the east and north of it, four floors. */
export const BLOCK = { x0: VX0 - 0.2, x1: -5.3, z0: V0 - 0.25, z1: V1 + 2.0, h: 26.4, top: 22.9 }; // eight storeys, the eighth (from `top`) glass; its east wall clear of the streetcar's track

const hex3 = (c: number[]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');
const mixc = (a: number[], b: number[], t: number): number[] => a.map((v, i) => v + (b[i] - v) * t);
const smooth = (t: number): number => { const k = Math.min(1, Math.max(0, t)); return k * k * (3 - 2 * k); };

/** A wall in the plane x = `x`, from z0 to z1 and y0 to y1, facing `face` (+1 toward +x, -1 toward -x), cut round its holes ([z0, y0, z1, y1]), each hole with a reveal `depth` deep behind the face. */
function wallX(wall: Sink, reveal: Sink, x: number, face: 1 | -1, z0: number, z1: number, y0: number, y1: number, holes: Array<[number, number, number, number]> = [], depth = 0.12): void {
  let rects: Array<[number, number, number, number]> = [[z0, y0, z1, y1]];
  for (const [a0, b0, a1, b1] of holes) {
    const next: typeof rects = [];
    for (const [u0, v0, u1, v1] of rects) {
      const ou0 = Math.max(u0, a0), ou1 = Math.min(u1, a1), ov0 = Math.max(v0, b0), ov1 = Math.min(v1, b1);
      if (ou0 >= ou1 || ov0 >= ov1) { next.push([u0, v0, u1, v1]); continue; }
      if (ou0 > u0) next.push([u0, v0, ou0, v1]);
      if (ou1 < u1) next.push([ou1, v0, u1, v1]);
      if (ov0 > v0) next.push([ou0, v0, ou1, ov0]);
      if (ov1 < v1) next.push([ou0, ov1, ou1, v1]);
    }
    rects = next;
  }
  for (const [u0, v0, u1, v1] of rects) {
    if (face > 0) wall.quad([x, v0, u1], [x, v0, u0], [x, v1, u0], [x, v1, u1]);
    else wall.quad([x, v0, u0], [x, v0, u1], [x, v1, u1], [x, v1, u0]);
  }
  const xi = x - face * depth; // the reveal runs back from the face into the wall
  for (const [a0, b0, a1, b1] of holes) {
    const q = (a: V3, b: V3, c: V3, d: V3) => (face > 0 ? reveal.quad(a, b, c, d) : reveal.quad(d, c, b, a));
    q([x, b0, a0], [xi, b0, a0], [xi, b1, a0], [x, b1, a0]); // the jamb at a0, facing into the opening
    q([xi, b0, a1], [x, b0, a1], [x, b1, a1], [xi, b1, a1]);
    q([x, b1, a0], [xi, b1, a0], [xi, b1, a1], [x, b1, a1]); // the head, facing down
    if (b0 > y0 + 1e-6) q([xi, b0, a0], [x, b0, a0], [x, b0, a1], [xi, b0, a1]); // the sill, facing up
  }
}
/** The same in the plane z = `z`, from x0 to x1, facing `face` (+1 toward +z, -1 toward -z). Holes are [x0, y0, x1, y1]. */
function wallZ(wall: Sink, reveal: Sink, z: number, face: 1 | -1, x0: number, x1: number, y0: number, y1: number, holes: Array<[number, number, number, number]> = [], depth = 0.12): void {
  const w = new Sink(), r = new Sink();
  wallX(w, r, z, face, -x1, -x0, y0, y1, holes.map(([a0, b0, a1, b1]) => [-a1, b0, -a0, b1]), depth);
  // the plane x = z0 over (z, y) turned into the plane z = z0 over (x, y): (x, y, z) -> (-z, y, x) is a quarter turn about y
  for (const [from, to] of [[w, wall], [r, reveal]] as const) for (let i = 0; i < from.pos.length; i += 9) {
    const p = (k: number): V3 => [-from.pos[i + k * 3 + 2], from.pos[i + k * 3 + 1], from.pos[i + k * 3]];
    to.tri(p(0), p(1), p(2));
  }
}

/** A flat blob on the ground at y: a ragged patch of snow, `r` across, wound for +y. */
function patch(sink: Sink, x: number, z: number, r: number, y: number, rnd: () => number, stretch = 1): void {
  const n = 9, pts: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) { const th = (i / n) * Math.PI * 2, rr = r * (0.62 + rnd() * 0.5); pts.push([x + Math.cos(th) * rr, z + Math.sin(th) * rr * stretch]); }
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; sink.tri([x, y, z], [b[0], y, b[1]], [a[0], y, a[1]]); }
}
/** A low mound of drifted snow along a line: a flattened half capsule. */
function drift(sink: Sink, a: V3, b: V3, r: number, h: number): void {
  const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[2] - a[2]) / 0.8)), start = sink.count;
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n, p = (t: number): V3 => [a[0] + (b[0] - a[0]) * t, 0, a[2] + (b[2] - a[2]) * t];
    const k = (t: number) => 0.55 + 0.45 * Math.sin(Math.PI * t) * (0.8 + 0.2 * Math.sin(t * 17));
    const A = p(t0), B = p(t1), dx = B[0] - A[0], dz = B[2] - A[2], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
    for (let j = 0; j < 6; j++) {
      const th0 = (j / 6) * Math.PI, th1 = ((j + 1) / 6) * Math.PI;
      const at = (q: V3, kk: number, th: number): V3 => [q[0] + nx * Math.cos(th) * r * kk, Math.sin(th) * h * kk, q[2] + nz * Math.cos(th) * r * kk];
      sink.quad(at(A, k(t0), th1), at(A, k(t0), th0), at(B, k(t1), th0), at(B, k(t1), th1));
    }
  }
  sink.translate(0, a[1], 0, start);
}

/** A quad lying flat, turned to face up whichever way round its corners are given. */
function flatUp(sink: Sink, a: V3, b: V3, c: V3, d: V3): void {
  const up = (b[2] - a[2]) * (d[0] - a[0]) - (b[0] - a[0]) * (d[2] - a[2]);
  if (up > 0) sink.quad(a, b, c, d); else sink.quad(b, a, d, c);
}
/**
 * A street along z out of one of Volta's windows (walk.ts VOLTA_VIEW): the sidewalk from the window's line `e0` to the
 * near kerb `e1`, the road to the far kerb `e2`, the far sidewalk to `e3`, from z0 to z1; the road at `y`, the sidewalks
 * a kerb's height over it; the banks of snow the plough leaves along both kerbs, broken now and then.
 */
function streetAlong(walk: Sink, road: Sink, kerb: Sink, bank: Sink, [e0, e1, e2, e3]: readonly number[], z0: number, z1: number, y: number, rnd: () => number): void {
  const k = 0.12, flat = (sk: Sink, xa: number, xb: number, yy: number) => flatUp(sk, [xa, yy, z1], [xb, yy, z1], [xb, yy, z0], [xa, yy, z0]);
  flat(walk, e0, e1, y + k); flat(road, e1, e2, y); flat(walk, e2, e3, y + k);
  for (const x of [e1, e2]) kerb.box(x, y + k / 2 + 0.01, (z0 + z1) / 2, 0.16, k + 0.02, z1 - z0);
  const into = Math.sign(e2 - e1); // from the near kerb toward the far
  for (const [x, side] of [[e1 + into * 0.55, -into], [e2 - into * 0.55, into]] as Array<[number, number]>) {
    for (let z = z0; z < z1; z += 26 + rnd() * 14) drift(bank, [x + side * 0.05, y, z], [x, y, z + 14 + rnd() * 8], 0.55, 0.42);
  }
}
/**
 * A front row of blocks along the far sidewalk of such a street: three to six storeys, each 11 to 26 m along the
 * street and 14 to 26 deep, its face `front` (x) set back a little and running away from the window by `dir`, from z0
 * to z1; a block goes up only where `ok` says its box is clear. `block` builds it.
 */
function frontRow(front: number, dir: 1 | -1, z0: number, z1: number, rnd: () => number, ok: (x0: number, za: number, x1: number, zb: number, h: number) => boolean, block: (ring: Array<[number, number]>, h: number, g: number) => void): void {
  for (let z = z0; z < z1;) {
    const w = 11 + rnd() * 15, d = 14 + rnd() * 12, h = 9 + Math.floor(rnd() * 5) * 3, xf = front + dir * (0.8 + rnd() * 1.2), xb = xf + dir * d;
    const [x0, x1] = [Math.min(xf, xb), Math.max(xf, xb)], ring: Array<[number, number]> = dir < 0 ? [[x1, z], [x1, z + w], [x0, z + w], [x0, z]] : [[x0, z + w], [x0, z], [x1, z], [x1, z + w]];
    if (ok(x0, z, x1, z + w, h)) block(ring, h, 0.45 + rnd() * 0.45);
    z += w + (rnd() < 0.25 ? 3 + rnd() * 4 : 0.4);
  }
}

/**
 * A street tree, a maple's habit: a trunk clear to 2.3 m, five limbs up and out, each forking twice, and leaves as
 * cards on the twigs (the painted sprigs, `leafSprig`), their normals from the crown's middle outward so the crown
 * shades as one mass. The season is the walk's, not the tree's: a card carries three randoms (`aux`) and the leaves'
 * material turns it, browns it and drops it by them as the year goes; the snow that lies along the limbs in winter
 * (`snowForm`) comes on the same way. About 6.4 m tall, the crown 5 m across. Standing at the origin. Four of them.
 */
function tree(variant: number): BuiltPart {
  const rnd = rng(9176 + variant * 131), bark = new Sink(), snow = new Sink();
  const lp: number[] = [], ln: number[] = [], lu: number[] = [], la: number[] = [];
  const crown: V3 = [0, 4.6, 0];
  const card = (p: V3, size: number) => {
    // a card facing mostly outward and up, turned about its own normal; both faces draw
    const out: V3 = [p[0] - crown[0] + (rnd() - 0.5) * 1.2, (p[1] - crown[1]) * 0.6 + 0.9 + (rnd() - 0.5), p[2] - crown[2] + (rnd() - 0.5) * 1.2];
    const l = Math.hypot(...out) || 1, n: V3 = [out[0] / l, out[1] / l, out[2] / l];
    const ref: V3 = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let u: V3 = [ref[1] * n[2] - ref[2] * n[1], ref[2] * n[0] - ref[0] * n[2], ref[0] * n[1] - ref[1] * n[0]];
    const ul = Math.hypot(...u) || 1; u = [u[0] / ul, u[1] / ul, u[2] / ul];
    let v: V3 = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
    const th = rnd() * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
    [u, v] = [[u[0] * c + v[0] * s, u[1] * c + v[1] * s, u[2] * c + v[2] * s], [v[0] * c - u[0] * s, v[1] * c - u[1] * s, v[2] * c - u[2] * s]];
    const h = size / 2, cell = Math.floor(rnd() * 4), cu = (cell % 2) * 0.5, cv = Math.floor(cell / 2) * 0.5;
    const at = (a: number, b: number): V3 => [p[0] + u[0] * a * h + v[0] * b * h, p[1] + u[1] * a * h + v[1] * b * h, p[2] + u[2] * a * h + v[2] * b * h];
    const tone = rnd(), hold = rnd(), shade = rnd(); // which colour it turns, how long it holds on, how dark it is
    // the crown's shading normal: from its middle outward, a little up, so no card goes black edge on
    const sn: V3 = [p[0] - crown[0], (p[1] - crown[1]) * 0.7 + 1.4, p[2] - crown[2]], sl = Math.hypot(...sn) || 1;
    for (const [a, b, uu, vv] of [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, -1, 0, 0], [1, 1, 1, 1], [-1, 1, 0, 1]] as Array<[number, number, number, number]>) {
      lp.push(...at(a, b)); ln.push(sn[0] / sl, sn[1] / sl, sn[2] / sl); lu.push(cu + uu * 0.5, cv + vv * 0.5); la.push(tone, hold, shade, 0);
    }
  };
  const limb = (from: V3, dir: V3, length: number, r0: number, depth: number) => {
    const n = 4, pts: V3[] = [from], rad: Array<[number, number]> = [[r0, r0]];
    let d: V3 = dir, p: V3 = from;
    for (let i = 1; i <= n; i++) {
      // a limb bends up toward the light as it goes, and wanders a little
      d = [d[0] + (rnd() - 0.5) * 0.3, d[1] + 0.1 + (rnd() - 0.5) * 0.16, d[2] + (rnd() - 0.5) * 0.3];
      const l = Math.hypot(...d); d = [d[0] / l, d[1] / l, d[2] / l];
      p = [p[0] + d[0] * (length / n), p[1] + d[1] * (length / n), p[2] + d[2] * (length / n)];
      pts.push(p);
      const r = r0 * (1 - (i / n) * 0.62);
      rad.push([r, r]);
      if (depth >= 1) for (let k = 0; k < (depth === 2 ? 3 : 2); k++) card([p[0] + (rnd() - 0.5) * 0.7, p[1] + (rnd() - 0.3) * 0.6, p[2] + (rnd() - 0.5) * 0.7], 0.75 + rnd() * 0.5);
    }
    bark.loft(tube(pts, rad, [1, 0, 0]), depth === 0 ? 8 : depth === 1 ? 6 : 5);
    if (depth <= 1) for (let i = 0; i < n; i++) { // the snow that lies along the top of the limb in winter
      const a = pts[i], b = pts[i + 1], r = rad[i][0];
      if (Math.abs(b[1] - a[1]) < 0.75 * (length / n)) snow.bone([a[0], a[1] + r * 0.95, a[2]], [b[0], b[1] + rad[i + 1][0] * 0.95, b[2]], r * 0.75, r * 0.35);
    }
    if (depth < 2) {
      for (let k = 0; k < 3; k++) {
        const at = pts[2 + Math.floor(rnd() * 3)], th = rnd() * Math.PI * 2;
        limb(at, [d[0] * 0.5 + Math.cos(th) * 0.75, 0.35 + rnd() * 0.3, d[2] * 0.5 + Math.sin(th) * 0.75], length * (0.55 + rnd() * 0.2), r0 * 0.42, depth + 1);
      }
    }
  };
  // the trunk: a slight lean, a flare at the root
  const lean = (rnd() - 0.5) * 0.16, top: V3 = [lean * 2.4, 2.45, (rnd() - 0.5) * 0.2];
  bark.loft(tube([[0, -0.05, 0], [0, 0.18, 0], [lean * 0.8, 1.0, 0.02], [lean * 1.6, 1.8, 0.04], top, [top[0], top[1] + 0.5, top[2]]], [[0.2, 0.2], [0.14, 0.14], [0.12, 0.12], [0.115, 0.115], [0.12, 0.12], [0.1, 0.1]], [1, 0, 0]), 10);
  for (let k = 0; k < 5; k++) {
    const th = (k / 5) * Math.PI * 2 + rnd() * 0.7;
    limb([top[0], top[1] - 0.05 + rnd() * 0.45, top[2]], [Math.cos(th) * 0.8, 0.62 + rnd() * 0.2, Math.sin(th) * 0.8], 2.3 + rnd() * 0.7, 0.085, 0);
  }
  for (let i = 0; i < 150; i++) { // the crown filled out between the limbs
    const th = rnd() * Math.PI * 2, ph = Math.acos(1 - rnd() * 1.5), r = 1.5 + rnd() * 1.1;
    card([crown[0] + Math.sin(ph) * Math.cos(th) * r * 1.1, crown[1] + Math.cos(ph) * r * 0.72, crown[2] + Math.sin(ph) * Math.sin(th) * r * 1.1], 0.85 + rnd() * 0.5);
  }
  return [piece(bark.out(), M('walkBark'), { smooth: true, metres: 'xy' }),
    { pos: Float32Array.from(lp), nor: Float32Array.from(ln), uv: Float32Array.from(lu), aux: Float32Array.from(la), surface: { paint: 'leafSprig' } },
    piece(snow.out(), M('snowForm'), { smooth: true })];
}
const trees = Object.fromEntries(Array.from({ length: 4 }, (_, i) => [`walkTree${i}`, () => tree(i)])) as Record<string, () => BuiltPart>;

export const WALK_BUILT: Record<string, () => BuiltPart> = {
  ...trees,
  /**
   * The promenade: the paving in three lengths (Vancouver's grey granite, Toronto's warm paving, Halifax's boards with
   * the snow on them), a granite band where one gives way to the next, the coping along the water, the quay's wall
   * down into the harbour, the kerb along the planting on the land side.
   */
  promenade: () => {
    const van = new Sink(), tor = new Sink(), hal = new Sink(), stone = new Sink(), quay = new Sink(), snow = new Sink();
    const slab = (s: Sink, x0: number, x1: number, z0: number, z1: number) => s.box((x0 + x1) / 2, TOP - 0.04, (z0 + z1) / 2, x1 - x0, 0.08, z1 - z0);
    slab(van, P0, P1, SOUTH, J1 - 0.3);
    slab(van, P1, HOUSE.x1 + 0.1, SOUTH, HOUSE.z0); // the leg along the house's south wall, from its door
    slab(tor, P0, P1, J1 + 0.3, J2 - 0.3);
    slab(hal, P0, P1, J2 + 0.3, V0 - 0.02);
    slab(hal, VX0 - 0.15, P0, STEP, V0 - 0.02); // the boards out to the corner of Volta's glass
    for (const z of [J1, J2]) stone.rbox((P0 + P1) / 2, TOP - 0.03, z, P1 - P0, 0.1, 0.6, 0.012, 1);
    // the coping along the water, up the walk, along the step, and along the south end
    stone.rbox(P0 - 0.16, 0.1, (SOUTH + STEP) / 2 - 0.1, 0.4, 0.24, STEP - SOUTH + 0.2, 0.03, 2);
    stone.rbox((VX0 - 0.35 + P0) / 2, 0.1, STEP - 0.16, P0 - VX0 + 0.35, 0.24, 0.4, 0.03, 2);
    stone.rbox(VX0 - 0.3, 0.1, (STEP + V0) / 2, 0.4, 0.24, V0 - STEP, 0.03, 2);
    stone.rbox((P0 + 9) / 2, 0.1, SOUTH - 0.16, 9 - P0 + 0.7, 0.24, 0.4, 0.03, 2);
    // the kerb between the paving and the planting, from the house's corner to Volta's
    stone.rbox(P1 + 0.07, 0.07, (HOUSE.z1 + V0) / 2, 0.14, 0.16, V0 - HOUSE.z1 - 0.6, 0.02, 2);
    // the quay under it all, down into the harbour
    quay.box((EDGE + 40) / 2, -5.08, (SOUTH - 0.36 + STEP - 0.36) / 2, 40 - EDGE, 10, STEP - SOUTH); // its top 8 cm under the paving and the floors: nothing of it in them
    quay.box((VX0 - 0.5 + 40) / 2, -5.08, (STEP - 0.36 + 90) / 2, 40 - VX0 + 0.5, 10, 90 - STEP + 0.36);
    // the snow lies on the paving by the material's own cover (stage-run.ts); along the kerb and the coping it drifts, in its season
    drift(snow, [P0 + 0.3, TOP, SOUTH + 1], [P0 + 0.3, TOP, STEP - 0.5], 0.36, 0.11);
    drift(snow, [P1 - 0.22, TOP, HOUSE.z1 + 1], [P1 - 0.22, TOP, V0 - 0.4], 0.42, 0.13);
    drift(snow, [P0 - 0.16, 0.22, SOUTH + 1], [P0 - 0.16, 0.22, STEP - 0.6], 0.17, 0.07);
    // October's leaves down on the paving and the grass beside it: small, lying flat, there in their season, under the snow after it (as sprigs a hand across they read as things left on the walk)
    const lp: number[] = [], ln: number[] = [], lu: number[] = [], la: number[] = [], rnd = rng(6113);
    for (let i = 0; i < 520; i++) {
      const onPath = rnd() < 0.55, x = onPath ? P0 + 0.4 + rnd() * (P1 - P0 - 0.5) : P1 + 0.2 + rnd() * rnd() * 9, z = SOUTH + 2 + rnd() * (V0 - SOUTH - 3);
      if (!onPath && z < HOUSE.z1 + 0.5) continue;
      const size = 0.06 + rnd() * 0.07, th = rnd() * Math.PI * 2, c = Math.cos(th) * size, s2 = Math.sin(th) * size, y = (onPath ? TOP : 0) + 0.006 + rnd() * 0.004;
      const cell = Math.floor(rnd() * 4), cu = (cell % 2) * 0.5, cv = Math.floor(cell / 2) * 0.5, tone = rnd(), hold = rnd(), shade = rnd();
      const at = (a: number, b: number): V3 => [x + a * c - b * s2, y, z + a * s2 + b * c];
      for (const [a, b, uu, vv] of [[-1, 1, 0, 0], [1, 1, 1, 0], [1, -1, 1, 1], [-1, 1, 0, 0], [1, -1, 1, 1], [-1, -1, 0, 1]] as Array<[number, number, number, number]>) { lp.push(...at(a, b)); ln.push(0, 1, 0); lu.push(cu + uu * 0.5, cv + vv * 0.5); la.push(tone, hold, shade, 1); }
    }
    const litter: Built = { pos: Float32Array.from(lp), nor: Float32Array.from(ln), uv: Float32Array.from(lu), aux: Float32Array.from(la), surface: { paint: 'leafLitter' } };
    return [litter, piece(van.out(), M('paveVancouver'), { metres: 'xz' }), piece(tor.out(), M('paveToronto'), { metres: 'xz' }), piece(hal.out(), M('paveHalifax'), { metres: 'zx' }),
      piece(stone.out(), M('walkGranite'), { smooth: true, metres: 'xz' }), piece(quay.out(), M('quayWall'), { metres: 'zy' }), piece(snow.out(), M('snowForm'), { smooth: true, metres: 'xz' })];
  },
  /**
   * The land beside the walk and away behind it: lawn from the kerb out. Its season is the walk's: the material
   * takes it green in May, gone to gold by October, and under Halifax's snow (stage-run.ts).
   */
  walkLand: () => {
    const lawn = new Sink(), x0 = P1 + 0.14;
    const strip = (s: Sink, xa: number, xb: number, za: number, zb: number, y: number) => s.quad([xa, y, zb], [xb, y, zb], [xb, y, za], [xa, y, za]);
    // north of the house's line the lawn comes to the kerb; south of it the house and the paved leg stand in its place
    const cols: Array<[number, number]> = [[x0, 60], [60, 2400]];
    for (let z = -600; z < 1900; z += z < -40 || z >= 80 ? 60 : 4) {
      const zb = z + (z < -40 || z >= 80 ? 60 : 4);
      for (const [xa, xb] of cols) {
        const a = Math.max(xa, z < HOUSE.z1 ? HOUSE.x1 + 0.1 : xa);
        if (a >= xb) continue;
        strip(lawn, a, xb, z, zb, 0);
      }
    }
    return [piece(lawn.out(), M('walkLawn'), { metres: 'xz' })];
  },
  /**
   * The Bean house from outside: dark timber boards upright on its walls, the window's and the door's reveals cut
   * through them, a plinth, and a flat roof with its eaves out over the walk. The room inside is its own set.
   */
  beanHouse: () => {
    const boards = new Sink(), boardsZ = new Sink(), trim = new Sink(), roof = new Sink(), soffit = new Sink(), plinth = new Sink(), { x0, x1, z0, z1, h } = HOUSE;
    wallX(boards, trim, x0, -1, z0, z1, 0.14, h, [[-17.72, 0.75, -13.68, 2.32]], 0.13); // the west wall: the window on the harbour
    wallX(boards, trim, x1, 1, z0, z1, 0.14, h);
    wallZ(boardsZ, trim, z0, -1, x0, x1, 0.14, h, [[-7.32, 0, -6.38, 2.07]], 0.13); // the south wall: the door
    wallZ(boardsZ, trim, z1, 1, x0, x1, 0.14, h);
    plinth.box((x0 + x1) / 2, 0.07, (z0 + z1) / 2, x1 - x0 + 0.06, 0.14, z1 - z0 + 0.06);
    roof.rbox((x0 + x1) / 2, h + 0.13, (z0 + z1) / 2, x1 - x0 + 1.1, 0.26, z1 - z0 + 1.1, 0.02, 1);
    soffit.quad([x0 - 0.5, h, z0 - 0.5], [x1 + 0.5, h, z0 - 0.5], [x1 + 0.5, h, z1 + 0.5], [x0 - 0.5, h, z1 + 0.5]);
    return [piece(boards.out(), M('houseBoards'), { metres: 'yz' }), piece(boardsZ.out(), M('houseBoards'), { metres: 'yx' }), piece(trim.out(), M('windowFrame')),
      piece(plinth.out(), M('concrete'), { metres: 'xz' }), piece(roof.out(), M('houseRoof'), { smooth: true }), piece(soffit.out(), M('houseSoffit'), { metres: 'xz' })];
  },
  /**
   * The rail along the water: steel flats every 1.6 m, a pane of glass between each pair, an oak rail on top. Up the
   * walk from the south end to the step, along the step to the corner of Volta's glass, and along the south end.
   */
  quayRail: () => {
    const steel = new Sink(), glass = new Sink(), oak = new Sink();
    const run = (a: [number, number], b: [number, number]) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / len, uz = (b[1] - a[1]) / len, n = Math.max(1, Math.round(len / 1.6)), along = Math.abs(uz) > 0.5;
      for (let i = 0; i <= n; i++) {
        const x = a[0] + ux * (len * i) / n, z = a[1] + uz * (len * i) / n;
        steel.rbox(x, 0.56, z, along ? 0.014 : 0.07, 1.04, along ? 0.07 : 0.014, 0.004, 1);
        if (i === n) break;
        const mx = x + (ux * len) / n / 2, mz = z + (uz * len) / n / 2, w = len / n - 0.12;
        glass.box(mx, 0.56, mz, along ? 0.012 : w, 0.86, along ? w : 0.012);
      }
      oak.rbox((a[0] + b[0]) / 2, 1.1, (a[1] + b[1]) / 2, along ? 0.075 : len + 0.075, 0.05, along ? len + 0.075 : 0.075, 0.018, 2);
    };
    const x = P0 + 0.12;
    run([x, SOUTH + 0.12], [x, STEP - 0.04]);
    run([x, STEP - 0.04], [VX0 - 0.1, STEP - 0.04]);
    run([VX0 - 0.1, STEP - 0.04], [VX0 - 0.1, V0 - 0.3]);
    run([x, SOUTH + 0.12], [8.4, SOUTH + 0.12]);
    return [piece(steel.out(), M('handrail'), { smooth: true }), piece(glass.out(), M('cabinGlass')), piece(oak.out(), M('railOak'), { smooth: true, metres: 'xz' })];
  },
  /**
   * A lamp of the walk, at the origin, its arm out over the paving toward +x: a slim tapered post 4.4 m tall, a flat
   * head, the light in its underside (`lampLight`, lit by the walk's script as the day goes).
   */
  walkLamp: () => {
    const post = new Sink(), light = new Sink();
    post.cylinder(0, 0.12, 0, 0.1, 0.24, 16);
    post.loft(tube([[0, 0.24, 0], [0, 2.4, 0], [0, 4.2, 0], [0.12, 4.42, 0], [0.5, 4.5, 0]], [[0.058, 0.058], [0.05, 0.05], [0.044, 0.044], [0.04, 0.04], [0.036, 0.036]], [0, 0, 1]), 12);
    post.rbox(0.92, 4.5, 0, 0.84, 0.06, 0.22, 0.02, 2);
    light.quad([0.56, 4.468, 0.08], [1.28, 4.468, 0.08], [1.28, 4.468, -0.08], [0.56, 4.468, -0.08]);
    return [piece(post.out(), M('lampPost'), { smooth: true }), piece(light.out(), M('lampLight'))];
  },
  /** A bench of the walk: oak slats on two steel frames, a back; 1.8 m long along x at the origin, facing -z. */
  walkBench: () => {
    const oak = new Sink(), steel = new Sink();
    for (let i = 0; i < 5; i++) oak.rbox(0, 0.44, -0.2 + i * 0.1, 1.8, 0.035, 0.085, 0.012, 1);
    for (let i = 0; i < 3; i++) { const n = oak.count; oak.rbox(0, 0.62 + i * 0.11, 0.27, 1.8, 0.085, 0.03, 0.01, 1); oak.rotateX(0.44, 0.24, 0.16, n); }
    for (const x of [-0.75, 0.75]) {
      steel.rbox(x, 0.21, -0.22, 0.05, 0.42, 0.012, 0.004, 1).rbox(x, 0.21, 0.22, 0.05, 0.42, 0.012, 0.004, 1).rbox(x, 0.41, 0, 0.05, 0.012, 0.46, 0.004, 1);
      const n = steel.count; steel.rbox(x, 0.68, 0.29, 0.05, 0.56, 0.012, 0.004, 1); steel.rotateX(0.44, 0.24, 0.16, n);
    }
    return [piece(oak.out(), M('railOak'), { smooth: true, metres: 'xz' }), piece(steel.out(), M('lampPost'), { smooth: true })];
  },
  /**
   * Toronto's streetcar track along the land side: two rails at the TTC's gauge (1.495 m) set in a concrete bed, from
   * where Toronto's paving begins north past Volta's corner and away.
   */
  tramTrack: () => {
    const bed = new Sink(), rail = new Sink(), z0 = J1 + 1.2, z1 = TRACK.to + 40, g = 1.495 / 2; // from where Toronto's paving begins
    bed.box(TRACK.x, 0.005, (z0 + z1) / 2, 2.7, 0.03, z1 - z0);
    for (const s of [-1, 1]) {
      rail.box(TRACK.x + s * g, 0.028, (z0 + z1) / 2, 0.07, 0.02, z1 - z0);
      rail.box(TRACK.x + s * (g - 0.06), 0.014, (z0 + z1) / 2, 0.035, 0.012, z1 - z0); // the flange groove's shadow
    }
    return [piece(bed.out(), M('trackBed'), { metres: 'xz' }), piece(rail.out(), M('trackRail'))];
  },
  /** The low granite base the whale stands on, 3.4 by 2.4, at the origin. */
  orcaPlinth: () => [piece(new Sink().rbox(0, 0.16, 0, 3.6, 0.32, 2.6, 0.03, 2).out(), M('walkGranite'), { smooth: true, metres: 'xz' })],
  /**
   * Volta's building from the walk, world coordinates: brick, eight storeys, a window every 3.2 m in a stone surround
   * (lit or not), dark glass either side of the door at the foot, a steel canopy over the door; the eighth storey all
   * glass leaning in under the roof, lit. The room inside is its own set, behind the door on the walk's level: the
   * faces are one-sided, so from inside it they are not there and its windows look out on the harbour and the town.
   */
  voltaBlock: () => {
    const brick = new Sink(), brickZ = new Sink(), trim = new Sink(), lit = new Sink(), dark = new Sink(), cap = new Sink(), steel = new Sink(), sill = new Sink(), rnd = rng(1871);
    const { x0, x1, z0, z1, h, top } = BLOCK, X = WALK.x, L = 0.95, yb = top + 0.25, yt = h - 0.3;
    type P = [number, number, number];
    const uvs: [[number, number], [number, number], [number, number], [number, number]] = [[0, 0], [1, 0], [1, 1], [0, 1]];
    /** A face turned to `out`: its corners given bottom left, bottom right, top right, top left as the outside sees them, either way round. */
    const turned = (s: Sink, a: P, b: P, c: P, d: P, out: P) => {
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]], n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0) s.quad(a, b, c, d, uvs); else s.quad(b, a, d, c, uvs);
    };
    // brick to the eighth storey's sill: the south face round the door, the west face on the water, the east face, the north
    wallZ(brickZ, trim, z0, -1, x0, x1, 0, top, [[X - 0.6, 0, X + 0.6, 2.2]], 0.25);
    wallX(brick, trim, x1, 1, z0, z1, 0, top);
    wallX(brick, trim, x0, -1, z0, z1, 0, top);
    wallZ(brickZ, trim, z1, 1, x0, x1, 0, h);
    sill.box((x0 + x1) / 2, top + 0.1, z0 - 0.05, x1 - x0 + 0.2, 0.3, 0.18).box(x0 - 0.05, top + 0.1, (z0 + z1) / 2, 0.18, 0.3, z1 - z0 + 0.2).box(x1 + 0.05, top + 0.1, (z0 + z1) / 2, 0.18, 0.3, z1 - z0 + 0.2); // the stone course under the glass
    // the storeys between: a window every 3.2 m, 2 m wide, each a pane in a stone surround, lit or not
    for (let f = 1; f < 7; f++) {
      const y = f * 3.27 + 0.85;
      for (let x = x0 + 2.0; x < x1 - 1.2; x += 3.2) { turned(rnd() < 0.5 ? lit : dark, [x + 1.0, y, z0 - 0.012], [x - 1.0, y, z0 - 0.012], [x - 1.0, y + 1.8, z0 - 0.012], [x + 1.0, y + 1.8, z0 - 0.012], [0, 0, -1]); sill.box(x, y - 0.05, z0 - 0.05, 2.2, 0.09, 0.14).box(x, y + 1.85, z0 - 0.03, 2.2, 0.1, 0.1); }
      for (let z = z0 + 2.2; z < z1 - 1.2; z += 3.2) {
        turned(rnd() < 0.5 ? lit : dark, [x1 + 0.012, y, z + 1.0], [x1 + 0.012, y, z - 1.0], [x1 + 0.012, y + 1.8, z - 1.0], [x1 + 0.012, y + 1.8, z + 1.0], [1, 0, 0]); sill.box(x1 + 0.05, y - 0.05, z, 0.14, 0.09, 2.2);
        turned(rnd() < 0.55 ? lit : dark, [x0 - 0.012, y, z - 1.0], [x0 - 0.012, y, z + 1.0], [x0 - 0.012, y + 1.8, z + 1.0], [x0 - 0.012, y + 1.8, z - 1.0], [-1, 0, 0]); sill.box(x0 - 0.05, y - 0.05, z, 0.14, 0.09, 2.2);
      }
    }
    // the foot: dark glass either side of the door, in steel; the canopy over the door
    for (const [a0, b0, a1, b1] of [[-15.9, 0.45, -12.5, 2.75], [-8.9, 0.45, -6.3, 2.75]] as Array<[number, number, number, number]>) {
      turned(dark, [a1, b0, z0 - 0.02], [a0, b0, z0 - 0.02], [a0, b1, z0 - 0.02], [a1, b1, z0 - 0.02], [0, 0, -1]);
      steel.box(a0, (b0 + b1) / 2, z0 - 0.03, 0.06, b1 - b0, 0.06).box(a1, (b0 + b1) / 2, z0 - 0.03, 0.06, b1 - b0, 0.06).box((a0 + a1) / 2, b1, z0 - 0.03, a1 - a0 + 0.06, 0.06, 0.06).box((a0 + a1) / 2, b0, z0 - 0.03, a1 - a0 + 0.06, 0.06, 0.06);
      sill.box((a0 + a1) / 2, b0 - 0.06, z0 - 0.05, a1 - a0 + 0.2, 0.07, 0.14);
    }
    steel.rbox(X, 2.86, z0 - 0.75, 3.4, 0.09, 1.5, 0.02, 2);
    // the eighth storey: glass leaning in from the stone course to the roof, a bay every 3.8 m or so, hipped at the corners, lit
    const bays = (a: number, b: number): number[] => { const n = Math.max(1, Math.round((b - a) / 3.8)); return Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n); };
    const south = bays(x0 + L, x1 - L), west = bays(z0 + L, z1 - L);
    for (let i = 0; i + 1 < south.length; i++) turned(lit, [south[i + 1], yb, z0], [south[i], yb, z0], [south[i], yt, z0 + L], [south[i + 1], yt, z0 + L], [0, 0.3, -1]);
    for (const x of south) steel.bone([x, yb, z0 - 0.01], [x, yt, z0 + L - 0.01], 0.04, 0.04);
    for (const [xa, xb, s] of [[x0, -1], [x1, 1]].map(([x, s]): [number, number, number] => [x, x - s * L, s])) { // the faces on the water and on the land, and the hips they meet the south face at
      for (let i = 0; i + 1 < west.length; i++) turned(lit, [xa, yb, west[i]], [xa, yb, west[i + 1]], [xb, yt, west[i + 1]], [xb, yt, west[i]], [s, 0.3, 0]);
      for (const z of west) steel.bone([xa + s * 0.01, yb, z], [xb + s * 0.01, yt, z], 0.04, 0.04);
      lit.tri([xa, yb, z0], [xb, yb, z0], [xb, yt, z0 + L]).tri([xb, yb, z0], [xa, yb, z0], [xb, yt, z0 + L]); // the south face's end, both ways round
      lit.tri([xa, yb, z0], [xa, yb, z0 + L], [xb, yt, z0 + L]).tri([xa, yb, z0 + L], [xa, yb, z0], [xb, yt, z0 + L]); // and this face's
      steel.bone([xa, yb, z0], [xb, yt, z0 + L], 0.05, 0.05);
    }
    cap.box((x0 + x1) / 2, yt + 0.16, (z0 + L + z1) / 2, x1 - x0 - 2 * L + 0.5, 0.3, z1 - z0 - L + 0.25); // the roof over the glass
    steel.box((x0 + x1) / 2, yt, z0 + L, x1 - x0 - 2 * L, 0.08, 0.08).box(x0 + L, yt, (z0 + L + z1) / 2, 0.08, 0.08, z1 - z0 - L).box(x1 - L, yt, (z0 + L + z1) / 2, 0.08, 0.08, z1 - z0 - L); // the head rail
    return [piece(brick.out(), M('voltaBrick'), { metres: 'zy' }), piece(brickZ.out(), M('voltaBrick'), { metres: 'xy' }), piece(trim.out(), M('walkGranite'), { metres: 'xy' }), piece(sill.out(), M('walkGranite'), { metres: 'xy' }),
      piece(cap.out(), M('houseRoof')), piece(steel.out(), M('windowFrame')), piece(dark.out(), { paint: 'windowPane:1' }), piece(lit.out(), { paint: 'windowPane:0' })];
  },
  /**
   * Volta's glass, world coordinates (docs/rebuild/40-volta-interior-reference.md). The harbour side: glass from the
   * floor to the slab, leaning in at the head (WALK.volta.lean), a white mullion every 1.5 m, a white radiator sill
   * along its foot, a black bulkhead over its head with a line of light under it. The window in the east wall
   * (WALK.volta.east), upright in a dark frame.
   */
  voltaGlass: () => {
    const white = new Sink(), frame = new Sink(), glass = new Sink(), dark = new Sink(), light = new Sink();
    const L = WALK.volta.lean, top = VH - 0.06, x = VX0, xt = VX0 + L, [e0, e1] = WALK.volta.east, xe = VX1 + 0.04, zc = (V0 + V1) / 2;
    white.box(x, 0.03, zc, 0.1, 0.06, V1 - V0).box(xt, VH - 0.04, zc, 0.1, 0.08, V1 - V0);
    for (let k = 0; k <= 8; k++) { const z = V0 + 0.03 + ((V1 - V0 - 0.06) * k) / 8; white.bone([x, 0.06, z], [xt, top, z], 0.04, 0.04); }
    glass.quad([x, 0.06, V0], [x, 0.06, V1], [xt, top, V1], [xt, top, V0]).quad([x, 0.06, V1], [x, 0.06, V0], [xt, top, V0], [xt, top, V1]);
    white.rbox(x + 0.26, 0.3, zc, 0.36, 0.6, V1 - V0 - 0.1, 0.012, 1); // the sill: the radiators' cover, knee high
    for (let z = V0 + 0.45; z < V1 - 0.3; z += 0.75) dark.box(x + 0.27, 0.603, z, 0.2, 0.006, 0.56); // its grilles
    dark.box(xt + 0.3, 3.05, zc, 0.56, 0.7, V1 - V0 - 0.02); // the bulkhead over the glass
    light.box(xt + 0.42, 2.693, zc, 0.045, 0.012, V1 - V0 - 1.2); // the line of light along the window
    frame.box(xe, 0.8, (e0 + e1) / 2, 0.08, 0.06, e1 - e0).box(xe, 3.1, (e0 + e1) / 2, 0.08, 0.06, e1 - e0);
    for (const z of [e0, (e0 * 2 + e1) / 3, (e0 + e1 * 2) / 3, e1]) frame.box(xe, 1.95, z, 0.08, 2.3, 0.05);
    glass.quad([xe, 0.8, e1], [xe, 0.8, e0], [xe, 3.1, e0], [xe, 3.1, e1]).quad([xe, 0.8, e0], [xe, 0.8, e1], [xe, 3.1, e1], [xe, 3.1, e0]);
    return [piece(white.out(), M('voltaWhite'), { smooth: true }), piece(frame.out(), M('windowFrame')), piece(dark.out(), M('voltaBlack')), piece(light.out(), M('stripLight')), piece(glass.out(), M('cabinGlass'))];
  },
  /**
   * Volta's ceiling, world coordinates: open to the slab and painted black the way the real one is, two runs of duct
   * and a cable tray under it; slim black linear lights hung at loose angles, their undersides white; the projector on
   * its pole, facing the north wall.
   */
  voltaCeiling: () => {
    const duct = new Sink(), light = new Sink(), tray = new Sink(), body = new Sink(), white = new Sink(), y = VH;
    for (const x of [-9.2, -14.4]) {
      const n = duct.count;
      duct.cylinder(0, 0, 0, 0.2, V1 - V0 - 0.6, 18).rotateX(0, 0, Math.PI / 2, n).translate(x, y - 0.34, (V0 + V1) / 2, n);
      for (let z = V0 + 1.2; z < V1 - 0.5; z += 2.2) duct.box(x, y - 0.1, z, 0.06, 0.2, 0.03); // its hangers
    }
    tray.box(-12.0, y - 0.22, (V0 + V1) / 2, 0.3, 0.04, V1 - V0 - 0.4).box(-12.15, y - 0.17, (V0 + V1) / 2, 0.02, 0.1, V1 - V0 - 0.4).box(-11.85, y - 0.17, (V0 + V1) / 2, 0.02, 0.1, V1 - V0 - 0.4);
    for (const [lx, lz, turn, len] of VOLTA_LINES) {
      const a = body.count, b = light.count, c = tray.count, r = (turn * Math.PI) / 180;
      body.box(0, 0, 0, len, 0.06, 0.07); light.box(0, -0.034, 0, len - 0.04, 0.008, 0.048);
      for (const s of [-1, 1]) tray.box((s * len) / 2.6, 0.27, 0, 0.006, 0.5, 0.006); // the wires it hangs by
      body.rotateY(0, 0, r, a).translate(lx, y - 0.56, lz, a); light.rotateY(0, 0, r, b).translate(lx, y - 0.56, lz, b); tray.rotateY(0, 0, r, c).translate(lx, y - 0.56, lz, c);
    }
    const [px, pz] = VOLTA_PROJECTOR;
    white.rbox(px, y - 0.52, pz, 0.36, 0.13, 0.3, 0.02, 2); tray.box(px, y - 0.23, pz, 0.04, 0.46, 0.04); body.cylinder(px + 0.08, y - 0.52, pz + 0.155, 0.035, 0.02, 14).rotateX(y - 0.52, pz + 0.155, Math.PI / 2, body.count - 14 * 12);
    return [piece(duct.out(), M('voltaDuct'), { smooth: true }), piece(tray.out(), M('voltaDuct')), piece(body.out(), M('voltaBlack')), piece(white.out(), M('voltaWhite'), { smooth: true }), piece(light.out(), M('stripLight'))];
  },
  /** A column of Volta's floor: square, 0.6 m, white, floor to slab, a grey foot; a red fire bell and a small black speaker high on its +x face. At the origin. */
  voltaColumn: () => {
    const bell = new Sink().cylinder(0, 0, 0, 0.075, 0.05, 20).rotateZ(0, 0, Math.PI / 2).translate(0.325, 2.42, 0);
    return [piece(new Sink().rbox(0, VH / 2, 0, 0.6, VH, 0.6, 0.015, 1).out(), M('voltaWhite'), { smooth: true, metres: 'xy' }), piece(new Sink().box(0, 0.06, 0, 0.62, 0.12, 0.62).out(), M('voltaBase')),
      piece(bell.out(), M('voltaBell'), { smooth: true }), piece(new Sink().rbox(0.34, 2.78, 0, 0.09, 0.2, 0.14, 0.01, 1).out(), M('voltaBlack'), { smooth: true })];
  },
  /** A ring light: a black hoop 2 m across, warm light on its inner face and underneath, on three cables up to one point at the origin (the slab). Scaled in x and z where it hangs. */
  ringPendant: () => {
    const body = new Sink(), glow = new Sink(), wire = new Sink(), Ro = 1.0, Ri = 0.955, n = 56, drop = 0.7, h = 0.045;
    const p = (t: number, r: number, dy: number): V3 => [Math.cos(t) * r, dy - drop, Math.sin(t) * r];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2;
      body.quad(p(a, Ro, h), p(b, Ro, h), p(b, Ro, -h), p(a, Ro, -h)).quad(p(a, Ri, h), p(b, Ri, h), p(b, Ro, h), p(a, Ro, h)); // the outside and the top
      glow.quad(p(b, Ri, h), p(a, Ri, h), p(a, Ri, -h), p(b, Ri, -h)).quad(p(b, Ri, -h), p(a, Ri, -h), p(a, Ro, -h), p(b, Ro, -h)); // the inner face and the underside
    }
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.4; wire.bone([Math.cos(a) * Ri, -drop + h, Math.sin(a) * Ri], [0, 0, 0], 0.003, 0.003); }
    return [piece(body.out(), M('voltaBlack'), { smooth: true }), piece(glow.out(), M('ringLight'), { smooth: true }), piece(wire.out(), M('cable'))];
  },
  /** One of Volta's tables: a pale flip top 1.5 by 0.75, white T legs on castors. Its length along x, at the origin. */
  voltaTable: () => {
    const legs = new Sink().box(0, 0.685, 0, 1.2, 0.05, 0.04), wheels = new Sink();
    for (const x of [-0.6, 0.6]) {
      legs.box(x, 0.39, 0, 0.05, 0.64, 0.05).box(x, 0.075, 0, 0.05, 0.03, 0.62);
      for (const z of [-0.28, 0.28]) wheels.sphere(x, 0.03, z, 0.03, 0.03, 0.022, 10, 6);
    }
    return [piece(new Sink().rbox(0, 0.725, 0, 1.5, 0.026, 0.75, 0.008, 1).out(), M('voltaTableTop'), { smooth: true, metres: 'xz' }), piece(legs.out(), M('voltaWhite')), piece(wheels.out(), M('voltaBlack'), { smooth: true })];
  },
  /** A high table: a white round top 0.8 m across on a white column and a disc foot, 1.05 m tall. At the origin. He stands at one to speak. */
  voltaHighTable: () => [piece(new Sink().lathe([[0.001, 0], [0.26, 0], [0.26, 0.012], [0.05, 0.03], [0.035, 0.07], [0.035, 1.0], [0.39, 1.02], [0.4, 1.05], [0.001, 1.05]], 0, 0, 0, 1, 1, 0, 40).out(), M('voltaWhite'), { smooth: true })],
  /** The low table between the tub chairs: a white round top on a walnut cone. At the origin. */
  voltaSideTable: () => [piece(new Sink().lathe([[0.001, 0], [0.2, 0], [0.07, 0.45]], 0, 0, 0, 1, 1, 0, 32).out(), M('voltaWalnut'), { smooth: true }),
    piece(new Sink().lathe([[0.07, 0.45], [0.3, 0.455], [0.3, 0.478], [0.001, 0.478]], 0, 0, 0, 1, 1, 0, 32).out(), M('voltaWhite'), { smooth: true })],
  /** The cube ottomans by the tub chairs, 46 cm: lime, teal, red. At the origin. */
  voltaOttomanLime: () => [piece(new Sink().rbox(0, 0.22, 0, 0.46, 0.44, 0.46, 0.035, 2).out(), M('voltaLime'), { smooth: true, metres: 'xz' })],
  voltaOttomanTeal: () => [piece(new Sink().rbox(0, 0.22, 0, 0.46, 0.44, 0.46, 0.035, 2).out(), M('voltaTeal'), { smooth: true, metres: 'xz' })],
  voltaOttomanRed: () => [piece(new Sink().rbox(0, 0.22, 0, 0.46, 0.44, 0.46, 0.035, 2).out(), M('voltaRed'), { smooth: true, metres: 'xz' })],
  /** A call booth: black, 1.15 wide, 1.1 deep, 2.25 tall, felt inside, a shelf, a light in its roof, a glass door on its -z face. At the origin, its back toward +z. */
  voltaBooth: () => {
    const shell = new Sink(), felt = new Sink(), glass = new Sink();
    shell.box(0, 1.125, 0.53, 1.15, 2.25, 0.04).box(0, 2.225, 0, 1.15, 0.05, 1.1).box(0, 0.02, 0, 1.15, 0.04, 1.1).box(0, 2.16, -0.53, 1.07, 0.08, 0.04).box(-0.2, 1.1, -0.53, 0.04, 2.04, 0.04);
    for (const x of [-0.555, 0.555]) shell.box(x, 1.125, 0, 0.04, 2.25, 1.1);
    shell.box(-0.26, 1.1, -0.56, 0.02, 0.3, 0.02); // the door's pull
    felt.box(0, 1.15, 0.5, 1.05, 2.1, 0.02).box(-0.525, 1.15, 0.05, 0.02, 2.1, 0.9).box(0.525, 1.15, 0.05, 0.02, 2.1, 0.9);
    glass.quad([-0.535, 0.05, -0.53], [0.535, 0.05, -0.53], [0.535, 2.12, -0.53], [-0.535, 2.12, -0.53]).quad([0.535, 0.05, -0.53], [-0.535, 0.05, -0.53], [-0.535, 2.12, -0.53], [0.535, 2.12, -0.53]);
    return [piece(shell.out(), M('voltaBlack')), piece(felt.out(), M('acousticPanel'), { metres: 'xy' }), piece(new Sink().rbox(0, 1.05, 0.34, 0.95, 0.03, 0.3, 0.008, 1).out(), M('voltaWhite'), { smooth: true }),
      piece(new Sink().box(0, 2.195, 0, 0.5, 0.01, 0.06).out(), M('stripLight')), piece(glass.out(), M('cabinGlass'))];
  },
  /** The slide thrown on Volta's wall by the projector, 2.6 by 1.46 (`screenCollect`): no screen, no frame, the wall itself. Its face toward -z, centred at the origin. */
  voltaSlide: () => [piece(new Sink().quad([1.3, -0.73, 0], [-1.3, -0.73, 0], [-1.3, 0.73, 0], [1.3, 0.73, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]).out(), { paint: 'screenCollect' })],
  /**
   * What is fixed to Volta's room, world coordinates. The reception: maple planks laid flat on the east wall north of
   * the window, mixed tones, VOLTA on them in black (`voltaLetters`, the mark itself), a plank desk before them. Under
   * the window, the bar ledge: a dark counter, the coffee machine and its cups at the south end. A dark baseboard round
   * the walls, and the plaque by the door out.
   */
  voltaFitout: () => {
    const woods = [new Sink(), new Sink(), new Sink()], bar = new Sink(), steel = new Sink(), cups = new Sink(), base = new Sink(), white = new Sink(), rnd = rng(1800);
    const { wall: [w0, w1], desk: [d0, d1], sign } = VOLTA_RECEPTION, [e0, e1] = WALK.volta.east, X = VX1;
    // the plank wall: boards 14 cm tall in broken lengths, each a hair proud of or behind its neighbours
    for (let y = 0; y < 2.9 - 1e-6; y += 0.145) {
      let z = w0 - rnd() * 0.9;
      while (z < w1) { const len = 0.7 + rnd() * 0.9, a = Math.max(w0, z), b = Math.min(w1, z + len), t = 0.018 + rnd() * 0.006; if (b - a > 0.05) woods[Math.floor(rnd() * 3)].box(X - t / 2, y + 0.0725, (a + b) / 2, t, 0.143, b - a - 0.003); z += len; }
    }
    // the desk: a plank front counter high, a ledge on it, the worktop behind, a return at each end
    const zc = (d0 + d1) / 2, fx = X - 1.5;
    woods[1].box(fx, 0.525, zc, 0.05, 1.05, d1 - d0).box(fx + 0.3, 0.525, d0 + 0.025, 0.6, 1.05, 0.05).box(fx + 0.3, 0.525, d1 - 0.025, 0.6, 1.05, 0.05);
    woods[0].rbox(fx + 0.14, 1.065, zc, 0.36, 0.03, d1 - d0 + 0.06, 0.008, 1).box(fx + 0.4, 0.74, zc, 0.62, 0.03, d1 - d0 - 0.1);
    // the bar ledge under the window
    bar.rbox(X - 0.21, 1.05, (e0 + e1) / 2, 0.42, 0.04, e1 - e0 + 0.3, 0.008, 1);
    for (const z of [e0 + 0.2, (e0 + e1) / 2, e1 - 0.2]) bar.box(X - 0.02, 0.9, z, 0.04, 0.26, 0.04).bone([X - 0.03, 0.78, z], [X - 0.36, 1.03, z], 0.015, 0.015);
    steel.rbox(X - 0.23, 1.29, e0 + 0.3, 0.34, 0.44, 0.46, 0.03, 2).box(X - 0.42, 1.44, e0 + 0.3, 0.05, 0.05, 0.3).rbox(X - 0.22, 1.27, e0 + 0.78, 0.18, 0.4, 0.18, 0.03, 2);
    for (let i = 0; i < 6; i++) cups.cylinder(X - 0.3 + (i % 2) * 0.12, 1.12, e0 + 1.15 + Math.floor(i / 2) * 0.12, 0.045, 0.1, 12);
    // the baseboard: the north wall either side of the door out, the south wall either side of the door in, the east wall south of the planks
    for (const [xa, xb] of [[VX0 + 0.45, WALK.x - 0.62], [WALK.x + 0.62, X]]) base.box((xa + xb) / 2, 0.05, V1 - 0.006, xb - xa, 0.1, 0.012).box((xa + xb) / 2, 0.05, V0 + 0.006, xb - xa, 0.1, 0.012);
    base.box(X - 0.006, 0.05, (V0 + w0) / 2, 0.012, 0.1, w0 - V0).box(X - 0.006, 0.05, (w1 + V1) / 2, 0.012, 0.1, V1 - w1);
    // the plaque by the door out: white over black
    white.box(WALK.x - 0.85, 1.6, V1 - 0.006, 0.14, 0.07, 0.012); base.box(WALK.x - 0.85, 1.53, V1 - 0.006, 0.14, 0.07, 0.012);
    const [sz, sy, sw] = sign, sh = (sw * 312) / 1200, xs = X - 0.03;
    const letters = new Sink().quad([xs, sy - sh / 2, sz - sw / 2], [xs, sy - sh / 2, sz + sw / 2], [xs, sy + sh / 2, sz + sw / 2], [xs, sy + sh / 2, sz - sw / 2], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    return [piece(woods[0].out(), M('voltaWoodA'), { metres: 'zy' }), piece(woods[1].out(), M('voltaWoodB'), { metres: 'zy' }), piece(woods[2].out(), M('voltaWoodC'), { metres: 'zy' }),
      piece(bar.out(), M('voltaBar'), { smooth: true }), piece(steel.out(), M('chrome'), { smooth: true }), piece(cups.out(), M('icing')), piece(base.out(), M('voltaBase')), piece(white.out(), M('voltaWhite')),
      piece(letters.out(), { paint: 'voltaLetters' })];
  },
  /** A coffee to go: a paper cup in its sleeve under a black lid, 12 cm tall. At the origin. */
  paperCup: () => [piece(new Sink().lathe([[0.029, 0], [0.04, 0.105]], 0, 0, 0, 1, 1, 0, 24).cylinder(0, 0.002, 0, 0.029, 0.004, 24).out(), M('paperWhite'), { smooth: true }),
    piece(new Sink().lathe([[0.0335, 0.03], [0.0385, 0.078]], 0, 0, 0, 1, 1, 0, 24).out(), M('cardboard'), { smooth: true }),
    piece(new Sink().lathe([[0.0425, 0.102], [0.0425, 0.112], [0.036, 0.122], [0.001, 0.122]], 0, 0, 0, 1, 1, 0, 24).out(), M('bezel'), { smooth: true })],
  /**
   * A sign of the walk (walk.ts SIGNS): the mark cut out, 10 cm deep (seven leaves of it one behind the next), its
   * foot on a granite plinth 35 cm high. At the origin, facing -z, the way he comes; its left on his left.
   */
  ...Object.fromEntries(SIGNS.map((g, i) => [`logoSign${i}`, (): BuiltPart => {
    const cut = new Sink(), h = g.w / g.ratio, y0 = 0.35, n = 7;
    for (let k = 0; k < n; k++) { const z = (k / (n - 1)) * 0.1; cut.quad([g.w / 2, y0, z], [-g.w / 2, y0, z], [-g.w / 2, y0 + h, z], [g.w / 2, y0 + h, z], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
    return [piece(cut.out(), { paint: `sign${g.logo[0].toUpperCase()}${g.logo.slice(1)}` }), piece(new Sink().rbox(0, y0 / 2, 0.05, g.w + 0.3, y0, 0.42, 0.02, 1).out(), M('walkGranite'), { smooth: true, metres: 'xy' })];
  }])),
  /** The bin backstage: a round black bin 0.62 tall with a rolled rim, a liner folded over it, open, empty until the degree lands in it. At the origin. */
  stageBin: () => [piece(new Sink().lathe([[0.17, 0], [0.2, 0.585], [0.212, 0.6], [0.212, 0.62], [0.19, 0.62], [0.16, 0.03], [0.001, 0.03]], 0, 0, 0, 1, 1, 0, 36).out(), M('binPlastic'), { smooth: true }),
    piece(new Sink().lathe([[0.214, 0.5], [0.2165, 0.6], [0.216, 0.624], [0.2, 0.628], [0.186, 0.6], [0.184, 0.5]], 0, 0, 0, 1, 1, 0, 36).out(), M('paperWhite'), { smooth: true })],
  /** The harbour: 4 km square of water at the origin's height, the quay standing in it. */
  walkWater: () => [piece(new Sink().quad([2000, 0, 2000], [2000, 0, -2000], [-2000, 0, -2000], [-2000, 0, 2000]).out(), M('walkWater'), { metres: 'xz' })],
  /**
   * A floatplane, the de Havilland Beaver's shape: 9.2 m long, 14.6 m across the wing, on two floats; white with a
   * blue stripe and a yellow band on the fin. At the origin on the water, its nose toward +z, the propeller a disc.
   */
  seaplane: () => {
    const white = new Sink(), blue = new Sink(), yellow = new Sink(), dark = new Sink(), alu = new Sink(), prop = new Sink(), Y = 2.05;
    const ax = (z: number, y: number, rx: number, ry: number) => ({ c: [0, y, z] as V3, u: [1, 0, 0] as V3, v: [0, 1, 0] as V3, ru: rx, rv: ry });
    white.loft([ax(-5.2, Y + 0.45, 0.02, 0.02), ax(-4.6, Y + 0.4, 0.16, 0.24), ax(-2.6, Y + 0.2, 0.4, 0.52), ax(-0.6, Y + 0.05, 0.62, 0.78), ax(1.4, Y, 0.64, 0.8), ax(2.5, Y - 0.05, 0.6, 0.66)], 16);
    dark.loft([ax(2.5, Y - 0.05, 0.6, 0.66), ax(3.3, Y - 0.05, 0.58, 0.6), ax(3.7, Y - 0.05, 0.42, 0.44), ax(3.78, Y - 0.05, 0.02, 0.02)], 16); // the cowl
    dark.quad([-0.56, Y + 0.3, 1.5], [0.56, Y + 0.3, 1.5], [0.5, Y + 0.72, 1.1], [-0.5, Y + 0.72, 1.1]); // the windscreen
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) dark.quad([s * 0.645, Y + 0.18, 0.7 - i * 0.78], [s * 0.645, Y + 0.18, 0.1 - i * 0.78], [s * 0.64, Y + 0.6, 0.1 - i * 0.78], [s * 0.64, Y + 0.6, 0.7 - i * 0.78]);
    for (const s of [-1, 1]) blue.box(s * 0.655, Y - 0.12, -0.9, 0.012, 0.14, 6.4);
    white.rbox(0, Y + 0.92, 0.55, 14.6, 0.2, 1.62, 0.09, 3); // the wing, on top
    white.rbox(0, Y + 0.5, -4.7, 4.7, 0.09, 1.0, 0.04, 2); // the tailplane
    white.rbox(0, Y + 1.25, -4.75, 0.09, 1.7, 1.15, 0.04, 2); // the fin
    yellow.box(0, Y + 1.8, -4.75, 0.1, 0.34, 1.16);
    for (const s of [-1, 1]) {
      white.loft([{ c: [s * 1.5, 0.42, -3.7], u: [1, 0, 0], v: [0, 1, 0], ru: 0.03, rv: 0.03 }, { c: [s * 1.5, 0.36, -2.6], u: [1, 0, 0], v: [0, 1, 0], ru: 0.36, rv: 0.3 }, { c: [s * 1.5, 0.34, 0.6], u: [1, 0, 0], v: [0, 1, 0], ru: 0.42, rv: 0.36 }, { c: [s * 1.5, 0.4, 3.0], u: [1, 0, 0], v: [0, 1, 0], ru: 0.34, rv: 0.28 }, { c: [s * 1.5, 0.6, 4.2], u: [1, 0, 0], v: [0, 1, 0], ru: 0.03, rv: 0.03 }], 12);
      for (const z of [-1.0, 1.4]) alu.bone([s * 1.5, 0.6, z], [s * 0.55, Y - 0.6, z + 0.1], 0.04, 0.025);
      alu.bone([s * 1.5, 0.62, -1.0], [s * 1.5, 0.62, 1.4], 0.03, 0.03);
      alu.bone([s * 0.62, Y - 0.35, 0.7], [s * 3.6, Y + 0.84, 0.55], 0.05, 0.025); // the wing strut
    }
    alu.bone([-1.5, 0.66, 1.4], [1.5, 0.66, 1.4], 0.03, 0.03).bone([-1.5, 0.66, -1.0], [1.5, 0.66, -1.0], 0.03, 0.03);
    prop.cylinder(0, 0, 0, 1.28, 0.02, 28).rotateX(0, 0, Math.PI / 2).translate(0, Y - 0.05, 3.86);
    alu.sphere(0, Y - 0.05, 3.86, 0.16, 0.16, 0.26, 12, 8);
    return [piece(white.out(), M('planeWhite'), { smooth: true }), piece(blue.out(), M('planeBlue')), piece(yellow.out(), M('planeYellow')), piece(dark.out(), M('carGlass'), { smooth: true }),
      piece(alu.out(), M('aluminium'), { smooth: true }), piece(prop.out(), M('propDisc'))];
  },
  /**
   * A harbour ferry of Halifax Transit's kind: double ended, 24 m by 8, a dark blue hull, a white house with a row of
   * windows round it (lit, `windowLit`), the wheelhouse on top, a yellow band. At the origin on the water, along z.
   */
  ferry: () => {
    const hull = new Sink(), house = new Sink(), band = new Sink(), lit = new Sink(), dark = new Sink();
    hull.loft([-12, -10.6, -7, 0, 7, 10.6, 12].map((z, i, all) => ({ c: [0, 0.7, z] as V3, u: [1, 0, 0] as V3, v: [0, 1, 0] as V3, ru: i === 0 || i === all.length - 1 ? 0.6 : i === 1 || i === all.length - 2 ? 3.0 : 4.0, rv: 1.2 })), 16);
    house.rbox(0, 2.9, 0, 7.2, 2.3, 17, 0.25, 2);
    band.box(0, 1.78, 0, 7.5, 0.22, 20.5);
    house.rbox(0, 4.75, 0, 4.2, 1.4, 5, 0.2, 2);
    house.rbox(0, 4.12, 0, 7.6, 0.14, 18.2, 0.04, 1); // the upper deck's edge
    for (const s of [-1, 1]) for (let z = -7.4; z <= 7.4; z += 1.48) lit.quad([s * 3.61, 2.7, z + s * 0.55], [s * 3.61, 2.7, z - s * 0.55], [s * 3.61, 3.55, z - s * 0.55], [s * 3.61, 3.55, z + s * 0.55]);
    for (const s of [-1, 1]) for (let x = -1.5; x <= 1.5; x += 1.0) dark.quad([x - s * 0.4, 4.6, s * 2.51], [x + s * 0.4, 4.6, s * 2.51], [x + s * 0.4, 5.2, s * 2.51], [x - s * 0.4, 5.2, s * 2.51]);
    return [piece(hull.out(), M('ferryHull'), { smooth: true }), piece(house.out(), M('planeWhite'), { smooth: true }), piece(band.out(), M('planeYellow')), piece(lit.out(), M('windowLit')), piece(dark.out(), M('windowDark'))];
  },
  /** Georges Island in the harbour: a drumlin 320 m long under snow, its white lighthouse at the south end, the lantern red and lit. At the origin on the water. */
  georgesIsland: () => {
    const land = new Sink(), tower = new Sink(), red = new Sink(), light = new Sink();
    land.sphere(0, 0, 0, 90, 17, 160, 28, 8, undefined, 0.5);
    tower.lathe([[2.6, 0], [2.2, 9], [2.0, 14], [2.7, 14.3], [2.7, 15]], 20, 12, -120, 1, 1, 0, 16);
    red.lathe([[1.7, 15], [1.7, 17.2], [0.2, 18.6]], 20, 12, -120, 1, 1, 0, 12);
    light.sphere(20, 28.2, -120, 1.0, 1.0, 1.0, 10, 6);
    return [piece(land.out(), M('walkSnowFar'), { smooth: true }), piece(tower.out(), M('planeWhite'), { smooth: true }), piece(red.out(), M('lightRed'), { smooth: true }), piece(light.out(), M('lampLight'))];
  },
  /**
   * Coal Harbour behind the walk's trees: the glass towers Vancouver builds, slim, on wide low podiums, set back from
   * the water and apart from each other so the mountains show between them. Authored to the type, not surveyed.
   */
  vancouverTowers: () => {
    const glass = new Sink(), tops = new Sink(), podium = new Sink(), rnd = rng(5501);
    for (let i = 0; i < 17; i++) {
      const x = 95 + rnd() * 330 + (i % 3) * 40, z = -90 + i * 46 + rnd() * 30, w = 22 + rnd() * 8, d = 24 + rnd() * 8, h = 70 + rnd() * 95, turn = (rnd() - 0.5) * 0.5;
      const ring = ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as Array<[number, number]>).map(([a, b]): [number, number] => { const px = (a * w) / 2, pz = (b * d) / 2; return [x + px * Math.cos(turn) - pz * Math.sin(turn), z + px * Math.sin(turn) + pz * Math.cos(turn)]; });
      const g = 0.62 + rnd() * 0.3;
      glass.color(hex3([g * 0.8, g * 0.95, g].map((v) => v ** (1 / 2.2))));
      glass.extrude(ring, 9, h, { u0: rnd() * 4, v0: 0, perU: 96, perV: 70 }, tops);
      podium.box(x, 4.5, z, w + 26, 9, d + 22);
    }
    return [piece(glass.out(), M('towerGlass'), { tint: true }), piece(tops.out(), M('towerTopDay')), piece(podium.out(), M('concrete'), { metres: 'xz' })];
  },
  /**
   * Downtown Toronto across the harbour, as it stands from the Islands: the real footprints and heights from
   * OpenStreetMap (the condo's data) within 1.2 km of the CN Tower, on their shore 2 m over the water, the tower
   * itself at the origin at its true 553 m. Real north toward +x, real east toward +z; the placement turns it.
   */
  torontoWalk: () => {
    const [tx, tz] = CITY.cn, walls = new Sink(), tops = new Sink(), shore = new Sink(), rnd = rng(31), Q = 2.2;
    const map = (x: number, z: number): [number, number] => [z - tz, -(x - tx)]; // the condo's frame: x west, z north
    for (const b of CITY.buildings) {
      const ring = ringOf(b.p).map(([x, z]) => map(x, z));
      if (ring.length < 3) continue;
      const c = ring.reduce((a, q) => [a[0] + q[0] / ring.length, a[1] + q[1] / ring.length], [0, 0]);
      if (Math.hypot(c[0], c[1]) > 1200 || b.h < 14) continue;
      const g = 0.6 + rnd() * 0.32, cool = rnd() < 0.6;
      walls.color(hex3((cool ? [g * 0.9, g * 0.95, g] : [g, g * 0.96, g * 0.9]).map((v) => v ** (1 / 2.2))));
      walls.extrude(ring, b.min + Q, b.h + Q, { u0: rnd() * 4, v0: 0, perU: 96, perV: 70 }, tops);
    }
    shore.box(300, Q / 2, 0, 3200, Q, 3600); // the land the city stands on, its edge the harbour's north shore, 450 m south of the tower
    shore.translate(-450 + 1600 - 300, 0, 0);
    const cn = new Sink(), pod = new Sink(), light = new Sink();
    cnTower(cn, pod, light, 553);
    // the tower's own frame is the condo's (x west, z north): onto this one
    for (const k of [cn, pod, light]) { k.translate(-tx, Q, -tz); for (let i = 0; i < k.pos.length; i += 3) { const x = k.pos[i], z = k.pos[i + 2]; k.pos[i] = z; k.pos[i + 2] = -x; } }
    return [piece(shore.out(), M('quayWall'), { metres: 'xz' }), piece(walls.out(), M('towerDay'), { tint: true }), piece(tops.out(), M('towerTopDay')), piece(cn.out(), M('cnShaftDay'), { smooth: true }), piece(pod.out(), M('cnPodDay'), { smooth: true }), piece(light.out(), M('cnLight'), { smooth: true })];
  },
  /**
   * Downtown Halifax on the land side of the walk, climbing the hill from the water the way it does: the real
   * footprints and heights (halifax.json, the flight's data) within 750 m of the Maritime Centre, each block stood
   * on the hill's slope, the hill itself under snow. Dusk: the walls dark, their windows lit. Real north toward +z,
   * real west toward +x, the Maritime Centre at the origin.
   */
  /**
   * Halifax out of Volta's harbour glass (walk.ts VOLTA_VIEW), world coordinates: a street along the glass (sidewalk,
   * kerb, the road plowed with its banks of snow, kerb, the far sidewalk), and across it the walk's town turned half round
   * so its front row stands at the far sidewalk, its own real streets plowed on the snow between its blocks. The same
   * real blocks, walls, lit windows and snowy roofs as halifaxWalk. The bridge and the street trees are placed on their
   * own (sets.ts).
   */
  voltaView: () => {
    const walls = new Sink(), roofs = new Sink(), snow = new Sink(), road = new Sink(), walk = new Sink(), kerb = new Sink(), bank = new Sink(), rnd = rng(23);
    const { centre: [cx, cz], rise: R, street: [s0, s1, s2, s3] } = VOLTA_VIEW, kx = (cx + 390) / 2, kz = (cz + 265) / 2; // the town turns half round about (kx, kz)
    const C: [number, number] = [1171, -223];
    const a = [Math.sin((340 * Math.PI) / 180), Math.cos((340 * Math.PI) / 180)], r = [Math.cos((340 * Math.PI) / 180), -Math.sin((340 * Math.PI) / 180)];
    const E0 = C[0] * r[0] + -C[1] * a[0], N0 = C[0] * r[1] + -C[1] * a[1];
    const map = (x: number, z: number): [number, number] => [-(x * r[0] + -z * a[0] - E0), x * r[1] + -z * a[1] - N0]; // as halifaxWalk: the town's own frame, x inland
    const turn = ([lx, lz]: [number, number]): [number, number] => [2 * kx - (390 + lx), 2 * kz - (265 + lz)]; // where halifaxWalk stands it, turned half round
    const hill = (lx: number): number => R * smooth((lx + 330) / 620), h0 = hill(2 * kx - s3 - 390); // the hill, from its foot (lx -330) to the Citadel's
    const rise = (lx: number): number => Math.max(0, hill(lx) - h0); // from the far sidewalk's level up: no step where the street meets the town
    const ys = (x: number): number => (x > s3 ? 0 : rise(2 * kx - x - 390)); // the ground's height at world x: the street flat, the town on its hill
    // the bridge's sightline from the room: the headings between its towers and a little more, and how high its deck stands there
    const [ox, oz] = VOLTA_VIEW.origin, br = voltaViewBridge(), ax = [Math.sin(((br.turn + 90) * Math.PI) / 180), Math.cos(((br.turn + 90) * Math.PI) / 180)];
    const headOf = (x: number, z: number): number => (Math.atan2(x - ox, z - oz) * 180) / Math.PI;
    const towers = [-220.5, 220.5].map((t) => headOf(br.at[0] + ax[0] * t, br.at[2] + ax[1] * t));
    const sight = [Math.min(...towers) - 1.5, Math.max(...towers) + 1.5], deck = Math.atan2(br.at[1] + 47 - 1.6, Math.hypot(br.at[0] - ox, br.at[2] - oz)), sag = 0.014; // the cables stand this far over the deck line, near enough
    const taken: Array<[number, number, number, number]> = []; // the real blocks' boxes near the street (x0, z0, x1, z1), for the fill
    const block = (ring: Array<[number, number]>, y: number, h: number, g: number, hip: boolean) => {
      walls.color(hex3([g, g * 0.93, g * 0.8].map((v) => v ** (1 / 2.2))));
      roofs.color(hex3([0.78, 0.8, 0.86].map((v) => v ** (1 / 2.2))));
      const ob = hip ? obb(ring) : undefined;
      if (ob && h <= 9 && ob.fill > 0.74 && ob.d > 5 && ob.d < 22) { walls.extrude(ring, y, y + h - 2, { u0: rnd() * 4, v0: 0, perU: 96, perV: 70 }, roofs); hipRoof(roofs, ob, y + h - 2, 0.62, 3.4, 0.35); }
      else walls.extrude(ring, y, y + h + 0.5, { u0: rnd() * 4, v0: 0, perU: 96, perV: 70 }, roofs);
    };
    const seen = (ring: Array<[number, number]>, y: number, h: number): boolean => { // false if it would stand across a tower or the cables of the bridge from the room
      const hs = ring.map(([x, z]) => headOf(x, z)), lo = Math.min(...hs), hi = Math.max(...hs), near = Math.min(...ring.map(([x, z]) => Math.hypot(x - ox, z - oz)));
      if (hi < sight[0] || lo > sight[1]) return true;
      const top = Math.atan2(y + h + 1 - 1.6, near), byTower = towers.some((t) => t > lo - 1.5 && t < hi + 1.5);
      return top <= deck + (byTower ? 0 : sag);
    };
    for (const b of HALIFAX.buildings) {
      const raw = ringOf(b.p);
      if (raw.length < 3) continue;
      const c0 = raw.reduce((s4, q) => [s4[0] + q[0] / raw.length, s4[1] + q[1] / raw.length], [0, 0]);
      if (Math.hypot(c0[0] - C[0], c0[1] - C[1]) > VOLTA_VIEW.reach) continue;
      const local = raw.map(([x, z]) => map(x, z)), lc = local.reduce((s4, q) => [s4[0] + q[0] / local.length, s4[1] + q[1] / local.length], [0, 0]);
      const ring = local.map(turn);
      if (ring.some(([x]) => x > s3 - 0.5)) continue; // on the far sidewalk or the road: the street is kept clear
      const y = rise(lc[0]) - 0.5;
      if (!seen(ring, y, b.h)) continue;
      const xs0 = ring.map(([x]) => x), zs0 = ring.map(([, z]) => z);
      if (Math.max(...xs0) > s3 - 80) taken.push([Math.min(...xs0), Math.min(...zs0), Math.max(...xs0), Math.max(...zs0)]);
      block(ring, y, b.h, 0.5 + rnd() * 0.5, !b.k);
    }
    // the street along the glass, from well south of the room to well north of it
    streetAlong(walk, road, kerb, bank, VOLTA_VIEW.street, -400, 520, -0.12, rnd);
    // the town's ground: snow on its hill, and its own streets plowed across it
    const xs: number[] = [s3];
    for (let x = s3 - 20; x > s3 - 760; x -= 20) xs.push(x);
    for (let x = s3 - 760; x > -3200; x -= 400) xs.push(x);
    for (let i = 0; i + 1 < xs.length; i++) {
      const xa = xs[i], xb = xs[i + 1];
      for (let z = -2000; z < 2400; z += 400) snow.quad([xb, ys(xb) - 0.02, z + 400], [xa, ys(xa) - 0.02, z + 400], [xa, ys(xa) - 0.02, z], [xb, ys(xb) - 0.02, z]);
    }
    const lanes: Array<[number, number, number, number, number]> = []; // the town's streets near ours (ax, az, bx, bz, half width), for the fill
    for (const rd of HALIFAX.roads) {
      const p = rd.p, hw = rd.w / 2;
      for (let k = 0; k + 3 < p.length; k += 2) {
        const [ax0, az0] = turn(map(p[k], p[k + 1])), [bx0, bz0] = turn(map(p[k + 2], p[k + 3])), L = Math.hypot(bx0 - ax0, bz0 - az0);
        if (L < 0.5 || Math.hypot((ax0 + bx0) / 2 - ox, (az0 + bz0) / 2 - oz) > 1600) continue;
        const nx = -(bz0 - az0) / L * hw, nz = (bx0 - ax0) / L * hw, n = Math.max(1, Math.ceil(L / 20));
        for (let i = 0; i < n; i++) {
          const t0 = i / n, t1 = (i + 1) / n, xa = ax0 + (bx0 - ax0) * t0, za = az0 + (bz0 - az0) * t0, xb = ax0 + (bx0 - ax0) * t1, zb = az0 + (bz0 - az0) * t1;
          if (Math.max(xa, xb) + hw > s3) continue; // the street along the glass is its own
          if (Math.max(xa, xb) > s3 - 80) lanes.push([xa, za, xb, zb, hw]);
          const q: [V3, V3, V3, V3] = [[xa - nx, ys(xa - nx) + 0.01, za - nz], [xb - nx, ys(xb - nx) + 0.01, zb - nz], [xb + nx, ys(xb + nx) + 0.01, zb + nz], [xa + nx, ys(xa + nx) + 0.01, za + nz]];
          const up = (q[1][2] - q[0][2]) * (q[3][0] - q[0][0]) - (q[1][0] - q[0][0]) * (q[3][2] - q[0][2]); // the quad's normal, upward or not
          if (up > 0) road.quad(q[0], q[1], q[2], q[3]); else road.quad(q[1], q[0], q[3], q[2]);
        }
      }
    }
    // the street's far side built up where the real blocks leave it open, and its own streets left open: a front row of
    // three to six storeys along the far sidewalk, each block kept clear of the real ones and of the town's streets
    const clearOf = (x0: number, z0: number, x1: number, z1: number): boolean => !taken.some(([a0, b0, a1, b1]) => a0 < x1 + 2 && a1 > x0 - 2 && b0 < z1 + 2 && b1 > z0 - 2)
      && !lanes.some(([ax1, az1, bx1, bz1, hw]) => { // the lane's distance to the block's box, sampled along it
        for (let t = 0; t <= 1; t += 0.1) { const x = ax1 + (bx1 - ax1) * t, z = az1 + (bz1 - az1) * t; if (x > x0 - hw - 2 && x < x1 + hw + 2 && z > z0 - hw - 2 && z < z1 + hw + 2) return true; }
        return false;
      });
    frontRow(s3, -1, -160, 260, rnd, (x0, za, x1, zb, h) => clearOf(x0, za, x1, zb) && seen([[x1, za], [x1, zb], [x0, zb], [x0, za]], 0, h), (ring, h, g) => {
      block(ring, -0.5, h, g, false);
      taken.push([Math.min(...ring.map(([x]) => x)), Math.min(...ring.map(([, z]) => z)), Math.max(...ring.map(([x]) => x)), Math.max(...ring.map(([, z]) => z))]);
    });
    return [piece(walls.out(), M('towerDusk'), { tint: true }), piece(roofs.out(), M('halifaxRoof'), { tint: true }), piece(snow.out(), M('citySlush'), { smooth: true }),
      piece(road.out(), M('streetAsphalt'), { metres: 'xz' }), piece(walk.out(), M('citySidewalk'), { metres: 'xz' }), piece(kerb.out(), M('walkGranite'), { metres: 'xz' }), piece(bank.out(), M('walkSnowFar'), { smooth: true })];
  },
  /**
   * The same street out of Volta's side window, on downtown (walk.ts VOLTA_VIEW.east): the sidewalk from the window, the
   * road, the far sidewalk, and a front row of blocks across it. It stands over the walk's land and the streetcar's
   * rails, a few centimetres up, from the moment the glass's city does (sets.ts hides the walk's trees there then).
   */
  voltaViewEast: () => {
    const walls = new Sink(), roofs = new Sink(), road = new Sink(), walk = new Sink(), kerb = new Sink(), bank = new Sink(), rnd = rng(1800);
    const { east, eastRow } = VOLTA_VIEW;
    streetAlong(walk, road, kerb, bank, east, -60, eastRow[1] + 10, 0.045, rnd); // over the walk's lawn and the streetcar's rails (their tops at 0.038): Halifax has no streetcar
    const block = (ring: Array<[number, number]>, h: number, g: number) => {
      walls.color(hex3([g, g * 0.93, g * 0.8].map((v) => v ** (1 / 2.2))));
      roofs.color(hex3([0.78, 0.8, 0.86].map((v) => v ** (1 / 2.2))));
      walls.extrude(ring, -0.5, h + 0.5, { u0: rnd() * 4, v0: 0, perU: 96, perV: 70 }, roofs);
    };
    // the row runs on past the room's north wall, through where the hall beyond the wing stands: the hall is drawn only
    // once the room's side window no longer looks that way, and the view is gone before the hall is entered
    frontRow(east[3], 1, eastRow[0], eastRow[1], rnd, (_x0, _za, _x1, zb) => zb < eastRow[1], block);
    return [piece(walls.out(), M('towerDusk'), { tint: true }), piece(roofs.out(), M('halifaxRoof'), { tint: true }), piece(road.out(), M('streetAsphalt'), { metres: 'xz' }),
      piece(walk.out(), M('citySidewalk'), { metres: 'xz' }), piece(kerb.out(), M('walkGranite'), { metres: 'xz' }), piece(bank.out(), M('walkSnowFar'), { smooth: true })];
  },
  halifaxWalk: () => {
    const walls = new Sink(), roofs = new Sink(), hill = new Sink(), rnd = rng(23);
    const C: [number, number] = [1171, -223]; // the Maritime Centre in the aircraft's frame (heading 340)
    const a = [Math.sin((340 * Math.PI) / 180), Math.cos((340 * Math.PI) / 180)], r = [Math.cos((340 * Math.PI) / 180), -Math.sin((340 * Math.PI) / 180)];
    const E0 = C[0] * r[0] + -C[1] * a[0], N0 = C[0] * r[1] + -C[1] * a[1];
    const map = (x: number, z: number): [number, number] => [-(x * r[0] + -z * a[0] - E0), x * r[1] + -z * a[1] - N0];
    const rise = (x: number): number => 46 * smooth((x + 330) / 620); // the hill: from the water (330 m east of the centre) up to the Citadel's foot
    for (const b of HALIFAX.buildings) {
      const raw = ringOf(b.p);
      if (raw.length < 3) continue;
      const c0 = raw.reduce((s2, q) => [s2[0] + q[0] / raw.length, s2[1] + q[1] / raw.length], [0, 0]);
      if (Math.hypot(c0[0] - C[0], c0[1] - C[1]) > 750) continue;
      const ring = raw.map(([x, z]) => map(x, z)), c = ring.reduce((s2, q) => [s2[0] + q[0] / ring.length, s2[1] + q[1] / ring.length], [0, 0]);
      if (c[0] < -290) continue; // the blocks on the water's edge: the walk and the harbour are there
      const y = rise(c[0]) - 0.5, g = 0.5 + rnd() * 0.5;
      walls.color(hex3([g, g * 0.93, g * 0.8].map((v) => v ** (1 / 2.2))));
      const ob = b.k ? undefined : obb(ring);
      roofs.color(hex3([0.78, 0.8, 0.86].map((v) => v ** (1 / 2.2)))); // snow on every roof
      if (ob && b.h <= 9 && ob.fill > 0.74 && ob.d > 5 && ob.d < 22) { walls.extrude(ring, y, y + b.h - 2, { u0: rnd() * 4, v0: 0, perU: 96, perV: 70 }, roofs); hipRoof(roofs, ob, y + b.h - 2, 0.62, 3.4, 0.35); }
      else walls.extrude(ring, y, y + b.h + 0.5, { u0: rnd() * 4, v0: 0, perU: 96, perV: 70 }, roofs);
    }
    for (let i = 0; i < 24; i++) for (let j = 0; j < 12; j++) { // the hill under them
      const x0 = -330 + i * 50, x1 = x0 + 50, z0 = -900 + j * 150, z1 = z0 + 150;
      hill.quad([x0, rise(x0), z1], [x1, rise(x1), z1], [x1, rise(x1), z0], [x0, rise(x0), z0]);
    }
    return [piece(walls.out(), M('towerDusk'), { tint: true }), piece(roofs.out(), M('halifaxRoof'), { tint: true }), piece(hill.out(), M('walkSnowFar'), { smooth: true })];
  },
};

export type { Built };
