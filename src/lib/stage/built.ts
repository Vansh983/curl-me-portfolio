// Props that have no scan and are built here: furniture that carries a painted face, the cloth
// at the window, the passage between the room and the lab, and the far things on the bay that
// the fog softens anyway. Every part is a list of pieces, one per material, built at the origin
// (a Placement moves it). Materials come from materials.ts; uv is in metres, painted faces 0..1.
import { Sink, smoothNormals, flatNormals, type Geo, type V3 } from './rig.ts';
import { cityBlocks, cnTower } from './city.ts';
import { halifaxCity } from './halifax.ts';
import { dalhousieCampus, rng } from './dalhousie.ts';
import { crossingZ } from './flight.ts';
import { buildShell } from './shell.ts';
import { AUDITORIUM, LECTURE_ROWS, TOP_ROW, DAIS, FLIGHT_DECK } from './sets.ts';

export type BuiltSurface =
  | { mat: string } // a designed material from materials.ts
  | { paint: string }; // a canvas painted at runtime, 'name' or 'name:frame' (window, whiteboard, banner, poster:0, poster:1, sign)

export interface Built { pos: Float32Array; nor: Float32Array; uv: Float32Array; surface: BuiltSurface; col?: Float32Array }
export type BuiltPart = Built[];

/** Sink geometry to a piece. `smooth` welds and averages normals under 62 degrees; `metres` sets uv from world metres (xz for floors, xy for hanging things). */
function piece(g: Geo, surface: BuiltSurface, o: { smooth?: boolean; metres?: 'xz' | 'xy'; tint?: boolean } = {}): Built {
  const nor = o.smooth ? smoothNormals(g.pos, 62) : flatNormals(g.pos);
  let uv = g.uv;
  if (o.metres) {
    uv = new Float32Array((g.pos.length / 3) * 2);
    for (let i = 0; i < g.pos.length / 3; i++) {
      uv[i * 2] = g.pos[i * 3];
      uv[i * 2 + 1] = o.metres === 'xz' ? g.pos[i * 3 + 2] : g.pos[i * 3 + 1];
    }
  }
  return { pos: g.pos, nor, uv, surface, ...(o.tint ? { col: g.col } : {}) };
}

const M = (mat: string): BuiltSurface => ({ mat });
const UNIT: [number, number, number, number] = [0, 0, 1, 1];

/** Fixed theatre seating, facing -z: upholstered back, tip-up pan, shared-row floor mounting.
 * Empty seats stow their pan/tablet; the viewer's seat has both deployed. Authored, not a scan. */
function auditoriumSeat(study = false): BuiltPart {
  const back = new Sink().rbox(0, 0.81, 0.22, 0.54, 0.68, 0.14, 0.065, 4).rotateX(0.5, 0.2, 0.075);
  const pan = new Sink().rbox(0, 0.47, -0.035, 0.53, 0.12, 0.48, 0.055, 4);
  if (!study) pan.rotateX(0.47, 0.18, 1.12);
  const oak = new Sink().rbox(0, 0.8, 0.315, 0.55, 0.66, 0.04, 0.019, 3).rotateX(0.5, 0.2, 0.075);
  const steel = new Sink().rbox(0, 0.025, 0.12, 0.3, 0.05, 0.34, 0.015, 2)
    .box(0, 0.24, 0.16, 0.085, 0.43, 0.1).box(0, 0.37, 0.16, 0.69, 0.055, 0.065);
  for (const x of [-0.315, 0.315]) {
    steel.box(x, 0.52, 0.17, 0.035, 0.34, 0.07);
    oak.rbox(x, 0.7, -0.01, 0.065, 0.055, 0.45, 0.025, 3);
    for (const z of [0.005, 0.235]) steel.cylinder(x * 0.3, 0.052, z, 0.013, 0.008, 8);
  }
  const tablet = new Sink();
  if (study) {
    tablet.rbox(0, AUDITORIUM.tabletHeight - 0.015, -0.43, 0.55, 0.03, 0.42, 0.014, 3);
    steel.bone([0.315, 0.64, -0.16], [0.23, 0.71, -0.43], 0.018, 0.018);
  } else tablet.rbox(0.347, 0.51, -0.035, 0.025, 0.34, 0.3, 0.011, 3);
  return [piece(back.out(), M('auditoriumFabric'), { smooth: true, metres: 'xy' }),
    piece(pan.out(), M('auditoriumFabric'), { smooth: true, metres: 'xy' }),
    piece(oak.out(), M('auditoriumOak'), { smooth: true, metres: 'xy' }),
    piece(steel.out(), M('chairBase'), { smooth: true }), piece(tablet.out(), M('deskTop'), { smooth: true })];
}

/** A quad facing +z of size w × h centred at the origin, uv 0..1 (a painted face). */
const face = (w: number, h: number, z = 0): Geo => new Sink().quad([-w / 2, -h / 2, z], [w / 2, -h / 2, z], [w / 2, h / 2, z], [-w / 2, h / 2, z], [[0, 0], [1, 0], [1, 1], [0, 1]]).out();
/** The same painted face turned to look toward -z. */
const faceBack = (w: number, h: number, z = 0): Geo => new Sink().quad([w / 2, -h / 2, z], [-w / 2, -h / 2, z], [-w / 2, h / 2, z], [w / 2, h / 2, z], [[0, 0], [1, 0], [1, 1], [0, 1]]).out();

/** A flat rectangle in the xz plane at y, w along x and d along z, centred. */
const slab = (w: number, d: number, y = 0): Geo => new Sink().quad([-w / 2, y, d / 2], [w / 2, y, d / 2], [w / 2, y, -d / 2], [-w / 2, y, -d / 2]).out();

/** Moves a geometry by (dx, dy, dz). */
const offsetGeo = (g: Geo, dx: number, dy: number, dz: number): Geo => {
  const pos = new Float32Array(g.pos);
  for (let i = 0; i < pos.length; i += 3) { pos[i] += dx; pos[i + 1] += dy; pos[i + 2] += dz; }
  return { ...g, pos };
};

/** Four thin bars around a w × h face, t thick, at depth z. */
const frame = (w: number, h: number, t: number, z: number): Sink =>
  new Sink().box(0, h / 2 + t / 2, z, w + 2 * t, t, t).box(0, -h / 2 - t / 2, z, w + 2 * t, t, t).box(-w / 2 - t / 2, 0, z, t, h, t).box(w / 2 + t / 2, 0, z, t, h, t);

/** A 19 inch 5:4 LCD on a round foot, its screen a painted face towards +z. */
const lcd = (paint: string) => (): BuiltPart => {
  const body = new Sink().rbox(0, 0.36, -0.012, 0.42, 0.34, 0.024, 0.006, 2);
  const stand = new Sink().rbox(0, 0.1, -0.05, 0.04, 0.2, 0.02, 0.005, 2).cylinder(0, 0.006, -0.05, 0.11, 0.012, 28);
  return [piece(offsetGeo(face(0.38, 0.3, 0.001), 0, 0.36, 0), { paint }), piece(body.out(), M('bezel'), { smooth: true }), piece(stand.out(), M('aluminium'), { smooth: true })];
};

/** A laptop, open at 105 degrees; the hinge is at the origin, the base runs toward +z, the screen painted `paint`. */
const laptopFor = (paint: string): BuiltPart => {
  const base = new Sink().rbox(0, 0.008, 0.11, 0.31, 0.016, 0.22, 0.006, 2);
  const keys = new Sink().box(0, 0.017, 0.07, 0.27, 0.003, 0.1).box(0, 0.017, 0.17, 0.1, 0.002, 0.06);
  const lid = new Sink().rbox(0, 0.105, -0.004, 0.31, 0.21, 0.008, 0.004, 2).rotateX(0, 0, -0.26);
  const screen = new Sink().quad([-0.145, 0.015, 0.001], [0.145, 0.015, 0.001], [0.145, 0.2, 0.001], [-0.145, 0.2, 0.001], [[0, 0], [1, 0], [1, 1], [0, 1]]).rotateX(0, 0, -0.26);
  return [piece(screen.out(), { paint }), piece(base.out(), M('aluminium'), { smooth: true }), piece(keys.out(), M('bezel')), piece(lid.out(), M('aluminium'), { smooth: true })];
};

/** A 27 inch monitor on a stand: 0.61 × 0.36 panel, the screen a painted face towards +z. */
/**
 * An older monitor, 2010s office stock: a 0.5 × 0.32 panel in a thick plastic bezel with a chin, a deep back, a stout neck
 * and an oval base; the screen a painted face toward +z, its centre at 0.4. `pale` makes it the greyed beige one.
 */
const monOld = (paint: string, pale = false) => (): BuiltPart => {
  const shell = M(pale ? 'oldPlasticPale' : 'oldPlastic');
  const body = new Sink().rbox(0, 0.4, -0.03, 0.56, 0.4, 0.05, 0.008, 2); // the bezel block
  body.rbox(0, 0.42, -0.075, 0.42, 0.3, 0.05, 0.01, 2); // the deep back with the electronics
  body.box(0, 0.215, 0.0, 0.56, 0.03, 0.05); // the chin
  const stand = new Sink().rbox(0, 0.1, -0.09, 0.07, 0.2, 0.05, 0.008, 2).rbox(0, 0.0075, -0.08, 0.3, 0.015, 0.2, 0.006, 2);
  const button = new Sink().box(0.22, 0.215, 0.026, 0.02, 0.006, 0.004);
  return [piece(offsetGeo(face(0.5, 0.32, 0.001), 0, 0.41, 0), { paint }), piece(body.out(), shell, { smooth: true }), piece(stand.out(), shell, { smooth: true }), piece(button.out(), M('ledStrip'))];
};

const mon = (paint: string) => (): BuiltPart => {
  const body = new Sink().rbox(0, 0.5, -0.015, 0.62, 0.37, 0.02, 0.005, 2);
  const stand = new Sink().rbox(0, 0.18, -0.06, 0.05, 0.36, 0.03, 0.006, 2).rbox(0, 0.006, -0.06, 0.26, 0.012, 0.18, 0.005, 2);
  return [piece(offsetGeo(face(0.59, 0.34, 0.001), 0, 0.5, 0), { paint }), piece(body.out(), M('bezel'), { smooth: true }), piece(stand.out(), M('aluminium'), { smooth: true })];
};

/** A closed side profile (x, y), counter clockwise seen from +z, extruded along z and capped: a car body. */
const extrudeZ = (profile: [number, number][], halfD: number): Sink => {
  const s = new Sink();
  const n = profile.length;
  const cx = profile.reduce((a, p) => a + p[0], 0) / n, cy = profile.reduce((a, p) => a + p[1], 0) / n;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = profile[i], [x1, y1] = profile[(i + 1) % n];
    s.quad([x0, y0, -halfD], [x1, y1, -halfD], [x1, y1, halfD], [x0, y0, halfD]);
    s.quad([cx, cy, halfD], [x0, y0, halfD], [x1, y1, halfD], [x1, y1, halfD]);
    s.quad([cx, cy, -halfD], [x1, y1, -halfD], [x0, y0, -halfD], [x0, y0, -halfD]);
  }
  return s;
};

/** A car of 2019: a hatchback profile extruded and smooth shaded, a glass band round the cabin, four round wheels; 4.4 m long along x, its nose towards +x. */
const car = (mat: string) => (): BuiltPart => {
  const body = extrudeZ([[-2.2, 0.3], [-1.9, 0.24], [1.9, 0.24], [2.2, 0.32], [2.2, 0.6], [2.05, 0.72], [1.2, 0.8], [0.7, 0.86], [0.2, 1.28], [-0.6, 1.36], [-1.2, 1.32], [-1.7, 1.0], [-2.1, 0.92], [-2.2, 0.7]], 0.9);
  const glass = extrudeZ([[0.66, 0.87], [0.22, 1.25], [-0.6, 1.33], [-1.18, 1.29], [-1.62, 0.99], [-1.5, 0.95], [-0.6, 0.93], [0.3, 0.9]], 0.905);
  const wheels = new Sink();
  for (const [x, z] of [[-1.4, 0.8], [1.4, 0.8], [-1.4, -0.8], [1.4, -0.8]] as const) {
    const start = wheels.count;
    wheels.cylinder(x, 0.33, z, 0.33, 0.22, 24);
    wheels.rotateX(0.33, z, Math.PI / 2, start);
  }
  return [piece(body.out(), M(mat), { smooth: true }), piece(glass.out(), M('carGlass'), { smooth: true }), piece(wheels.out(), M('tyre'), { smooth: true })];
};

/** The cabin's windows along z: one at every row and one between. */
const CABIN_WINDOWS = [-8.5, -7.95, -7.45, -6.9, -6.4, -5.85, -5.35];


export const BUILT: Record<string, () => BuiltPart> = {
  // ---- 2022: the crossing. Cabin in world coordinates; seats are local reusable assemblies.
  aircraftCabin: () => {
    const sh = buildShell({ x: [-5.2, -1.6], z: [-10.2, -4.8], h: 1.95,
      floor: 'cabinFloor', wall: 'cabinWall', openings: [
        { wall: 'z+', at: -3.4, w: 1.1, h: 1.95 },
        { wall: 'x+', at: -9.45, w: 1.1, h: 1.95 },
        ...CABIN_WINDOWS.flatMap((z) => (['x-', 'x+'] as const).map((wall) => ({ wall, at: z, w: 0.42, h: 0.6, sill: 1.02 }))),
      ] });
    const roof = new Sink(), rims = new Sink(), bins = new Sink(), details = new Sink(), glass = new Sink();
    // A continuous curved crown, not a rectangular room with airplane seats in it.
    for (let i = 0; i < 40; i++) {
      const a = Math.PI * i / 40, b = Math.PI * (i + 1) / 40;
      const p = (t: number, z: number): V3 => [-3.4 + 1.8 * Math.cos(t), 1.95 + 0.69 * Math.sin(t), z];
      roof.quad(p(a, -4.8), p(b, -4.8), p(b, -10.2), p(a, -10.2));
      // End caps above the two bulkheads.
      roof.tri([-3.4, 1.95, -10.2], p(a, -10.2), p(b, -10.2));
      roof.tri([-3.4, 1.95, -4.8], p(b, -4.8), p(a, -4.8));
    }
    for (const side of [-1, 1]) for (const z of CABIN_WINDOWS) {
      const x = -3.4 + side * 1.8;
      // Fill the rectangular shell aperture around an oval; reveal thickness catches bounced light.
      const corner = Math.atan2(0.3, 0.21);
      const angles = [...Array.from({ length: 40 }, (_, i) => Math.PI * 2 * i / 40), corner, Math.PI - corner, Math.PI + corner, Math.PI * 2 - corner].sort((a, b) => a - b);
      for (let i = 0; i < angles.length; i++) {
        const point = (n: number, outer: boolean, depth: number): V3 => {
          const a = angles[n % angles.length], c = Math.cos(a), s = Math.sin(a);
          const r = outer ? Math.min(0.21 / Math.max(1e-9, Math.abs(c)), 0.3 / Math.max(1e-9, Math.abs(s))) : 1;
          return [x - side * depth, 1.32 + s * (outer ? r : 0.25), z + c * (outer ? r : 0.17)];
        };
        const quad = (a: V3, b: V3, c: V3, d: V3) => side === -1 ? rims.quad(a, d, c, b) : rims.quad(a, b, c, d);
        quad(point(i, true, 0.01), point(i + 1, true, 0.01), point(i + 1, false, 0.01), point(i, false, 0.01));
        quad(point(i, false, 0.01), point(i + 1, false, 0.01), point(i + 1, false, -0.11), point(i, false, -0.11));
      }
      // the pane, set back in the reveal, a fan of triangles facing the passenger
      const px = x - side * 0.09;
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2, b = ((i + 1) / 40) * Math.PI * 2;
        const pt = (t: number): V3 => [px, 1.32 + Math.sin(t) * 0.25, z + Math.cos(t) * 0.17];
        if (side === -1) glass.tri([px, 1.32, z], pt(b), pt(a)); else glass.tri([px, 1.32, z], pt(a), pt(b));
      }
    }
    for (const z of [-8.5, -7.45, -6.4, -5.35]) for (const side of [-1, 1]) {
      bins.rbox(-3.4 + side * 1.28, 2.13, z, 0.8, 0.37, 1.025, 0.12, 5);
      details.rbox(-3.4 + side * 0.95, 1.98, z, 0.035, 0.018, 0.17, 0.007, 2);
      for (const dz of [-0.12, 0.12]) details.cylinder(-3.4 + side * 1.12, 1.925, z + dz, 0.026, 0.01, 16);
    }
    return [{ ...sh.floor, surface: M('cabinFloor') }, { ...sh.walls, surface: M('cabinWall') },
      piece(roof.out(), M('cabinWall'), { smooth: true }), piece(rims.out(), M('skirting'), { smooth: true }),
      piece(bins.out(), M('cabinWall'), { smooth: true }), piece(details.out(), M('aluminium'), { smooth: true }), piece(glass.out(), M('cabinGlass'))];
  },
  aircraftSeat: () => {
    const cloth = new Sink().rbox(0, 0.47, 0, 0.46, 0.13, 0.48, 0.065, 5)
      .rbox(0, 0.91, 0.19, 0.46, 0.8, 0.12, 0.06, 5).rbox(0, 1.26, 0.17, 0.37, 0.25, 0.14, 0.065, 5);
    const shell = new Sink().rbox(0, 0.86, 0.27, 0.47, 0.66, 0.065, 0.03, 3);
    const trim = new Sink().rbox(0, 0.83, 0.309, 0.36, 0.26, 0.028, 0.025, 3)
      .rbox(0, 0.985, 0.32, 0.09, 0.025, 0.02, 0.007, 2);
    for (const x of [-0.26, 0.26]) {
      trim.rbox(x, 0.67, 0.025, 0.055, 0.055, 0.45, 0.02, 3);
      shell.box(x, 0.52, 0.16, 0.025, 0.25, 0.04);
    }
    for (const x of [-0.16, 0.16]) shell.box(x, 0.22, 0.1, 0.045, 0.4, 0.05);
    const belt = new Sink().box(-0.11, 0.541, 0, 0.19, 0.008, 0.038).box(0.11, 0.541, 0, 0.19, 0.008, 0.038);
    const buckle = new Sink().rbox(0, 0.547, 0, 0.055, 0.012, 0.044, 0.004, 2);
    return [piece(cloth.out(), M('cabinSeat'), { smooth: true }), piece(shell.out(), M('cabinWall'), { smooth: true }),
      piece(trim.out(), M('chairBase'), { smooth: true }), piece(belt.out(), M('bezel')), piece(buckle.out(), M('chrome'), { smooth: true })];
  },
  /**
   * The port wing, seen from the third-row window: the leading edge just behind it, swept back 25 degrees to a
   * winglet 14 m out and rising with the dihedral, the engine slung under it forward of the leading edge.
   */
  aircraftWing: () => {
    const skin = new Sink(), edge = new Sink(), nacelle = new Sink(), inlet = new Sink(), pylon = new Sink();
    const span = 14.3, sweep = Math.tan((25 * Math.PI) / 180);
    const section = (t: number) => { // t 0 at the root, 1 at the tip
      const x = -5.2 - span * t, le = -5.9 + span * t * sweep, chord = 6.4 - 4.8 * t, top = -0.1 + 1.4 * t, thick = 0.5 - 0.38 * t;
      return { x, le, te: le + chord, top, bottom: top - thick };
    };
    const N = 8;
    // the top skin cambered: up over the first third of the chord, down to the trailing edge
    const CAMBER: Array<[number, number]> = [[0, 0], [0.12, 0.05], [0.35, 0.08], [0.65, 0.04], [1, -0.1]];
    const topAt = (sec: ReturnType<typeof section>, k: number): V3 => { const [f, dy] = CAMBER[k], c = sec.te - sec.le - 0.3; return [sec.x, sec.top + dy * (sec.top - sec.bottom) / 0.5, sec.le + 0.3 + f * c]; };
    for (let i = 0; i < N; i++) {
      const a = section(i / N), b = section((i + 1) / N);
      // top and bottom skins, the trailing edge closed, the leading edge a separate strip in bare metal
      for (let k = 0; k + 1 < CAMBER.length; k++) skin.quad(topAt(a, k), topAt(b, k), topAt(b, k + 1), topAt(a, k + 1));
      skin.quad([a.x, a.bottom, a.te], [b.x, b.bottom, b.te], [b.x, b.bottom, b.le + 0.3], [a.x, a.bottom, a.le + 0.3]);
      skin.quad(topAt(a, CAMBER.length - 1), topAt(b, CAMBER.length - 1), [b.x, b.bottom, b.te], [a.x, a.bottom, a.te]);
      const mid = (s: ReturnType<typeof section>) => [s.x, (s.top + s.bottom) / 2, s.le] as V3;
      edge.quad([a.x, a.top, a.le + 0.3], [b.x, b.top, b.le + 0.3], mid(b), mid(a));
      edge.quad(mid(a), mid(b), [b.x, b.bottom, b.le + 0.3], [a.x, a.bottom, a.le + 0.3]);
    }
    const tip = section(1);
    skin.quad([tip.x, tip.top, tip.le], [tip.x, tip.top, tip.te], [tip.x, tip.bottom, tip.te], [tip.x, tip.bottom, tip.le]); // the tip closed
    // the winglet: a blended fin rising 1.7 m from the tip, raked back
    skin.quad([tip.x, tip.top, tip.le + 0.2], [tip.x, tip.top, tip.te], [tip.x - 0.5, tip.top + 1.7, tip.te + 0.2], [tip.x - 0.4, tip.top + 1.7, tip.te - 0.7]);
    skin.quad([tip.x - 0.4, tip.top + 1.7, tip.te - 0.7], [tip.x - 0.5, tip.top + 1.7, tip.te + 0.2], [tip.x, tip.bottom + 0.1, tip.te], [tip.x, tip.bottom + 0.1, tip.le + 0.2]);
    // the engine: a nacelle 3.6 m long under the wing at a third of the span, its inlet ahead of the leading edge
    const ex = -9.8, ez = -4.9, ey = -1.55;
    const ns = nacelle.count;
    nacelle.lathe([[0.86, 0], [0.98, 0.3], [1.0, 1.6], [0.95, 2.9], [0.72, 3.6]], ex, ey, ez, 1, 1, 0, 28);
    nacelle.rotateX(ey, ez, Math.PI / 2, ns); // the lathe stood up along y: laid along z, its wide base forward
    nacelle.translate(0, 0, -1.8, ns);
    const is = inlet.count;
    inlet.lathe([[0.02, 0], [0.7, 0.12], [0.86, 0.14]], ex, ey, ez, 1, 1, 0, 28);
    inlet.rotateX(ey, ez, Math.PI / 2, is);
    inlet.translate(0, 0, -1.94, is);
    // the cowl seams and the inlet lip, dark rings round the white: what makes it read as an engine from above
    for (const [dz, r, len] of [[-1.72, 1.0, 0.1], [-0.35, 1.005, 0.05], [0.95, 0.985, 0.05]] as const) {
      const rs = inlet.count;
      inlet.cylinder(ex, ey, ez, r, len, 28);
      inlet.rotateX(ey, ez, Math.PI / 2, rs);
      inlet.translate(0, 0, dz, rs);
    }
    const w = section((-5.2 - ex) / span);
    pylon.box(ex, (w.bottom + ey + 0.9) / 2, ez + 0.4, 0.3, w.bottom - (ey + 0.9), 1.6);
    return [piece(skin.out(), M('wingSkin'), { smooth: true }), piece(edge.out(), M('aluminium'), { smooth: true }), piece(nacelle.out(), M('wingSkin'), { smooth: true }), piece(inlet.out(), M('bezel'), { smooth: true }), piece(pylon.out(), M('wingSkin'))];
  },
  /** A seat-back screen: a 0.24 × 0.15 panel in a thin bezel, its face toward +z, the moving map on it. */
  seatScreen: () => [piece(offsetGeo(face(0.22, 0.135, 0.012), 0, 0, 0), { paint: 'screenMap' }), piece(new Sink().rbox(0, 0, 0, 0.26, 0.17, 0.02, 0.006, 2).out(), M('bezel'), { smooth: true })],
  /** The bulkhead screen at the front of the cabin: the same map, 0.9 wide. */
  bulkheadScreen: () => [piece(offsetGeo(face(0.86, 0.53, 0.014), 0, 0, 0), { paint: 'screenMap' }), piece(new Sink().rbox(0, 0, 0, 0.94, 0.6, 0.024, 0.008, 2).out(), M('bezel'), { smooth: true })],
  /**
   * The cloud field: a few hundred cumulus scattered through a layer at the deck's height, in clusters, with one
   * cluster on the track where the descent crosses the deck. Each is a quad the runtime turns to face the camera
   * (stage-run.ts: cloudPuffs); its vertex colour carries the size, the atlas cell and the brightness.
   */
  cloudField: () => {
    const s = new Sink();
    const rnd = rng(61);
    const gauss = () => (rnd() + rnd() + rnd() - 1.5) * 1.6;
    const puff = (x: number, y: number, z: number, size: number) => {
      const cell = Math.floor(rnd() * 4), bright = 0.9 + rnd() * 0.1;
      const c: [number, number, number] = [size / 600, cell / 4 + 0.05, bright];
      const w = size / 2, h = (size * 0.62) / 2;
      const start = s.count;
      s.quad([x - w, y - h, z], [x + w, y - h, z], [x + w, y + h, z], [x - w, y + h, z], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      for (let i = start; i < s.count; i++) { s.col[i * 3] = c[0]; s.col[i * 3 + 1] = c[1]; s.col[i * 3 + 2] = c[2]; }
    };
    const clusters: Array<[number, number, number]> = [[-140, crossingZ(), 26]];
    for (let i = 0; i < 16; i++) clusters.push([(rnd() - 0.5) * 5200, (rnd() - 0.5) * 5200, 12 + Math.floor(rnd() * 14)]);
    for (const [cx, cz, n] of clusters) for (let i = 0; i < n; i++) {
      const size = 150 + rnd() * 280;
      puff(cx + gauss() * 260, FLIGHT_DECK - 25 + gauss() * 14 + (size - 150) * 0.06, cz + gauss() * 260, size); // the tops near the deck, the bases well under it
    }
    for (let i = 0; i < 90; i++) { const size = 120 + rnd() * 220; puff((rnd() - 0.5) * 5600, FLIGHT_DECK - 25 + gauss() * 16, (rnd() - 0.5) * 5600, size); }
    return [piece(s.out(), { paint: 'cloudPuffs' }, { tint: true })];
  },
  /** The Halifax peninsula from OpenStreetMap: buildings, the sea, parks, streets, street trees, on 6 km of ground. */
  halifax: () => {
    const walls = new Sink(), roofs = new Sink(), sea = new Sink(), greens = new Sink(), woods = new Sink(), roads = new Sink(), canopy = new Sink(), trunk = new Sink();
    halifaxCity(walls, roofs, sea, greens, woods, roads, canopy, trunk);
    const ground = new Sink().quad([-3000, -0.02, 3000], [3000, -0.02, 3000], [3000, -0.02, -3000], [-3000, -0.02, -3000]);
    return [
      piece(ground.out(), M('flightGround'), { metres: 'xz' }), piece(walls.out(), M('halifaxWall'), { tint: true }), piece(roofs.out(), M('halifaxRoof'), { tint: true }),
      piece(sea.out(), M('seaWater'), { metres: 'xz' }), piece(greens.out(), M('parkGreen'), { metres: 'xz' }), piece(woods.out(), M('woodGreen'), { metres: 'xz' }), piece(roads.out(), M('streetAsphalt'), { metres: 'xz' }),
      piece(canopy.out(), M('treeCanopy'), { tint: true, smooth: true }), piece(trunk.out(), M('treeTrunk')),
    ];
  },
  /** The Studley campus: Dalhousie and King's by name from OpenStreetMap, the Hicks tower, the Dalplex dome, the quad, Wickwire Field, paths, car parks, trees. */
  dalhousie: () => {
    const walls = new Sink(), roofs = new Sink(), copper = new Sink(), clock = new Sink(), lawn = new Sink(), paving = new Sink(), asphalt = new Sink(), turf = new Sink(), canopy = new Sink(), trunk = new Sink();
    dalhousieCampus(walls, roofs, copper, clock, lawn, paving, asphalt, turf, canopy, trunk);
    return [
      piece(walls.out(), M('halifaxWall'), { tint: true }), piece(roofs.out(), M('halifaxRoof'), { tint: true }), piece(copper.out(), M('copperRoof')), piece(clock.out(), M('clockFace')),
      piece(lawn.out(), M('campusLawn'), { metres: 'xz' }), piece(paving.out(), M('campusPaving'), { metres: 'xz' }), piece(asphalt.out(), M('streetAsphalt'), { metres: 'xz' }), piece(turf.out(), M('campusTurf')),
      piece(canopy.out(), M('treeCanopy'), { tint: true, smooth: true }), piece(trunk.out(), M('treeTrunk')),
    ];
  },
  /** The jet bridge: the old passage from the brick door turned south, 5.8 m of grey panel and rubber floor down to the cabin door, a light strip along its ceiling. */
  boardingPassage: () => {
    const sections = [
      { x: [-4.2, -2.4] as [number, number], z: [1, 2.2] as [number, number], openings: [{ wall: 'x+' as const, at: 1.6, w: 0.9, h: 2.05 }, { wall: 'z-' as const, at: -3.35, w: 1.2, h: 2.4 }] }, // the brick door west is walled up: the ring left through the flight
      { x: [-3.95, -2.75] as [number, number], z: [-4.8, 1] as [number, number], openings: [{ wall: 'z+' as const, at: -3.35, w: 1.2, h: 2.4 }, { wall: 'z-' as const, at: -3.4, w: 1.1, h: 2.4 }] },
    ];
    const ribs = new Sink(), strip = new Sink();
    for (let z = 0.4; z > -4.6; z -= 0.6) for (const x of [-3.93, -2.77]) ribs.box(x, 1.2, z, 0.04, 2.4, 0.05);
    strip.box(-3.35, 2.385, -1.9, 0.12, 0.02, 5.6).box(-3.3, 2.385, 1.6, 1.6, 0.02, 0.12); // and across the first section, from the Delhi door
    return [...sections.flatMap((s) => { const sh = buildShell({ ...s, h: 2.4, floor: 'bridgeFloor', wall: 'bridgeWall' }); return [
      { ...sh.floor, surface: M('bridgeFloor') }, { ...sh.walls, surface: M('bridgeWall') }, { ...sh.ceiling, surface: M('bridgeWall') },
    ]; }), piece(ribs.out(), M('aluminium')), piece(strip.out(), M('ledStrip'))];
  },
  // Lower the distant panorama's centre so the airborne lens sees cloud detail above the ground haze.
  flightSky: () => [piece(new Sink().sphere(-3.4, -500, -7, 1500, 1500, 1500, 64, 32, UNIT).out(), M('flightSky'), { smooth: true })],
  flightSign: () => [piece(face(1.15, 0.32), { paint: 'flightSign' })],
  halifaxSign: () => [piece(face(1.5, 0.55), { paint: 'halifaxSign' })],
  lectureBoard: () => [piece(face(3.7, 1.8, 0.035), { paint: 'lectureBoard' }), piece(new Sink().rbox(0, 0, 0, 3.82, 1.92, 0.06, 0.025, 3).out(), M('aluminium'), { smooth: true })],
  dalhousieSign: () => [piece(face(3.8, 0.42), { paint: 'dalhousieSign' })],
  studyNotes: () => [piece(new Sink().quad([-0.225, 0.012, 0.155], [0.225, 0.012, 0.155], [0.225, 0.012, -0.155], [-0.225, 0.012, -0.155], [[0, 0], [1, 0], [1, 1], [0, 1]]).out(), { paint: 'studyNotes' })],
  halifaxReturn: () => {
    const sh = buildShell({ x: [-2.75, -0.2], z: [-2, -0.8], h: 3.5, floor: 'cabinFloor', wall: 'lectureWall', openings: [
      { wall: 'z-', at: -0.8, w: 1.1, h: 2.1, sill: 1.08 }, { wall: 'x-', at: -1.4, w: 1.2, h: 2.4 },
    ] });
    const steps = new Sink();
    // A level landing spans the whole doorway before the return flight descends west.
    for (let i = 0; i < 6; i++) { const h = (i + 1) * 0.18; steps.box(-2.75 + (i + 0.5) * 0.225, h / 2, -1.4, 0.225, h, 1.2); }
    steps.box(-0.8, 0.54, -1.4, 1.2, 1.08, 1.2);
    return [{ ...sh.floor, surface: M('cabinFloor') }, { ...sh.walls, surface: M('lectureWall') }, { ...sh.ceiling, surface: M('lectureWall') }, piece(steps.out(), M('lectureFloor'), { metres: 'xz' })];
  },
  lectureTiers: () => {
    const platforms = new Sink(), aisle = new Sink(), edges = new Sink(), rail = new Sink();
    for (const row of LECTURE_ROWS) {
      const depth = row.back - row.front;
      for (const [left, right] of AUDITORIUM.banks) {
        platforms.box((left + right) / 2, row.height / 2, (row.front + row.back) / 2, right - left, row.height, depth);
        edges.box((left + right) / 2, row.height + 0.006, row.front + 0.025, right - left, 0.012, 0.05);
      }
      for (const [left, right] of AUDITORIUM.aisles) for (let half = 0; half < 2; half++) {
        const h = row.height - (1 - half) * 0.18, z = row.front + (half + 0.5) * depth / 2;
        aisle.box((left + right) / 2, h / 2, z, right - left, h, depth / 2);
        edges.box((left + right) / 2, h + 0.006, row.front + half * depth / 2 + 0.025, right - left, 0.012, 0.05);
      }
    }
    platforms.box(4.9, TOP_ROW.height / 2, (TOP_ROW.back + AUDITORIUM.rear) / 2, 12.6, TOP_ROW.height, AUDITORIUM.rear - TOP_ROW.back);
    for (const x of [-1.27, 11.07]) {
      rail.bone([x, 1.25, LECTURE_ROWS[0].seat], [x, TOP_ROW.height + 0.89, TOP_ROW.seat], 0.027, 0.027);
      for (const row of LECTURE_ROWS) rail.bone([x, row.height, row.seat], [x, row.height + 0.89, row.seat], 0.018, 0.018);
    }
    return [piece(platforms.out(), M('auditoriumCarpet'), { metres: 'xz' }), piece(aisle.out(), M('auditoriumCarpet'), { metres: 'xz' }), piece(edges.out(), M('aluminium')), piece(rail.out(), M('chairBase'), { smooth: true })];
  },
  auditoriumSeat: () => auditoriumSeat(),
  auditoriumStudySeat: () => auditoriumSeat(true),
  auditoriumInterior: () => {
    const timber = new Sink(), dark = new Sink(), trim = new Sink(), lights = new Sink();
    // The lecturer's dais across the front, a step up from the floor, its nosing in metal; projection wall framed by acoustic timber fins.
    timber.box(DAIS.x, DAIS.height / 2, (DAIS.z[0] + DAIS.z[1]) / 2, 9.7, DAIS.height, DAIS.z[1] - DAIS.z[0]);
    trim.box(DAIS.x, DAIS.height + 0.006, DAIS.z[1] - 0.03, 9.7, 0.012, 0.06);
    for (const x of [0.75, 9.05]) {
      dark.box(x, 2.85, -17.27, 1.4, 5.15, 0.08);
      for (let i = 0; i < 10; i++) timber.box(x - 0.65 + i * 0.145, 2.85, -17.16, 0.065, 5.15, 0.12);
      dark.rbox(x, 4.15, -16.99, 0.33, 0.95, 0.24, 0.025, 3); // suspended speakers
    }
    // Alternating absorptive panels and timber on both side walls follow the rake.
    for (const x of [-1.33, 11.13]) for (const row of LECTURE_ROWS) {
      timber.box(x, row.height + 0.55, row.seat, 0.1, 1.1, 1.28);
      dark.rbox(x, row.height + 1.85, row.seat, 0.13, 1.35, 0.91, 0.035, 3);
      lights.box(x + (x < 0 ? 0.07 : -0.07), row.height + 0.19, row.seat, 0.015, 0.06, 0.23);
    }
    for (const z of [-15.3, -11.6, -7.9, -4.2]) {
      dark.box(4.9, 6.5, z, 11.8, 0.16, 0.8);
      trim.box(4.9, 6.39, z - 0.48, 11.8, 0.05, 0.045);
    }
    return [piece(timber.out(), M('auditoriumOak'), { metres: 'xy', smooth: true }),
      piece(dark.out(), M('acousticPanel'), { metres: 'xy', smooth: true }), piece(trim.out(), M('aluminium')),
      piece(lights.out(), M('ledStrip'))];
  },
  /**
   * The lectern: a timber podium on a plinth, 1.15 m to its sloped top with a reading light and a mic on a gooseneck,
   * a brushed plate on its front. Its front faces +z, toward the hall; the laptop sits on the top at the origin's y + 1.12.
   */
  lectern: () => {
    const wood = new Sink(), metal = new Sink(), dark = new Sink();
    wood.rbox(0, 0.55, 0, 0.66, 1.06, 0.5, 0.012, 2).rbox(0, 0.03, 0, 0.8, 0.06, 0.62, 0.008, 2);
    const ts = wood.count;
    wood.rbox(0, 1.115, -0.02, 0.76, 0.045, 0.6, 0.012, 2).rotateX(1.115, -0.02, 0.17, ts); // the top, sloped toward the speaker
    metal.box(0, 0.7, 0.252, 0.3, 0.09, 0.006); // the plate
    dark.box(0, 0.7, 0.256, 0.28, 0.07, 0.003);
    metal.bone([-0.25, 1.13, -0.15], [-0.32, 1.55, -0.05], 0.008, 0.008).bone([-0.32, 1.55, -0.05], [-0.2, 1.62, 0.02], 0.008, 0.008); // the gooseneck mic
    dark.sphere(-0.19, 1.625, 0.025, 0.02, 0.02, 0.02, 12, 8);
    return [piece(wood.out(), M('auditoriumOak'), { metres: 'xy', smooth: true }), piece(metal.out(), M('aluminium'), { smooth: true }), piece(dark.out(), M('bezel'), { smooth: true })];
  },
  /** The projection screen: a 4.4 × 2.5 m surface with the slide on it, hanging from a housing at the origin; it drops in front of the board on the way down (Placement.drop). */
  projectorScreen: () => {
    const housing = new Sink().rbox(0, 0.06, 0, 4.7, 0.14, 0.16, 0.03, 2);
    const bar = new Sink().rbox(0, -2.66, 0, 4.5, 0.05, 0.05, 0.015, 2);
    return [piece(offsetGeo(face(4.4, 2.5, 0.0), 0, -1.35, 0), { paint: 'screenSlide' }), piece(new Sink().box(0, -1.35, -0.006, 4.46, 2.56, 0.008).out(), M('board')), piece(housing.out(), M('bezel'), { smooth: true }), piece(bar.out(), M('aluminium'), { smooth: true })];
  },
  /** The laptop on the lectern: the slide's presenter view on its screen. */
  laptopSlide: () => laptopFor('screenSlide'),
  /** A recessed downlight in the ceiling: a short black can with a bright lens; the runtime hangs a point light from it when the set is not baked. */
  downlight: () => [piece(new Sink().cylinder(0, -0.04, 0, 0.09, 0.08, 20).out(), M('bezel'), { smooth: true }), piece(new Sink().cylinder(0, -0.078, 0, 0.07, 0.006, 20).out(), M('lampGlobe'))],
  lectureBench: () => {
    const top = new Sink().rbox(0, 0.72, 0, 1.9, 0.04, 0.54, 0.015, 3), legs = new Sink();
    for (const x of [-0.72, 0.72]) legs.box(x, 0.35, 0, 0.055, 0.7, 0.055).rbox(x, 0.035, 0, 0.09, 0.07, 0.44, 0.015, 3);
    legs.box(0, 0.5, -0.2, 1.6, 0.04, 0.035);
    return [piece(top.out(), M('deskLaminate'), { smooth: true }), piece(legs.out(), M('chairBase'), { smooth: true })];
  },
  campusView: () => {
    const brick = new Sink().box(18, 3, -6, 1, 6, 20), windows = new Sink();
    for (let z = -14; z < 4; z += 2) for (const y of [1.7, 4.3]) windows.box(17.48, y, z, 0.015, 1.8, 1.2);
    return [piece(brick.out(), M('condoBrick')), piece(windows.out(), M('carGlass')), piece(offsetGeo(slab(18, 30, -0.05), 14, 0, -6), M('flightGround'))];
  },
  // ---- now, Toronto
  /** The desk: a black slab 1.8 × 0.75 on two steel frames; the top is at 0.74. */
  desk: () => {
    const top = new Sink().rbox(0, 0.725, 0, 1.8, 0.03, 0.75, 0.008, 2);
    const legs = new Sink();
    for (const sx of [-0.8, 0.8]) legs.rbox(sx, 0.355, 0, 0.04, 0.71, 0.6, 0.006, 2).rbox(sx, 0.02, 0, 0.06, 0.04, 0.68, 0.008, 2);
    return [piece(top.out(), M('deskTop'), { smooth: true }), piece(legs.out(), M('deskLeg'), { smooth: true })];
  },
  /** A 27 inch monitor on a stand: 0.61 × 0.36 panel, the screen a painted face towards +z: an editor. */
  monitor: mon('screenCode'),
  /** The second monitor, same body, the Floqer app on it. */
  monitorApp: mon('screenFloqer'),
  /** The same body, the Webcube board on it: 2020. */
  monitorBoard: mon('screenBoard'),
  /** A laptop, open at 105 degrees, a terminal on it; the hinge is at the origin, the base runs toward +z. */
  laptop: () => laptopFor('screenTerminal'),
  /** A black hutch on the back of the desk: two uprights, a shelf above the monitors and one behind them, 1.8 wide, 0.28 deep, 1.05 tall from the desk top. */
  deskHutch: () => {
    const s = new Sink();
    for (const z of [-0.9, 0.9]) s.rbox(0, 0.525, z, 0.28, 1.05, 0.025, 0.005, 2);
    s.rbox(0, 0.95, 0, 0.28, 0.025, 1.8, 0.005, 2).rbox(0, 0.45, 0, 0.26, 0.02, 1.78, 0.005, 2).rbox(0, 1.045, 0, 0.28, 0.02, 1.8, 0.005, 2);
    s.box(-0.13, 0.525, 0, 0.02, 1.05, 1.8); // the back panel
    return [piece(s.out(), M('deskTop'), { smooth: true })];
  },
  /** A row of books, 0.5 long along z, mixed heights, spines out toward +x. */
  books: () => {
    const s = new Sink();
    let z = -0.25, i = 0;
    const cols = ['#2B2D33', '#4A3B7A', '#1E5A7A', '#8A3A3A', '#3A6A4A', '#E9E2D0', '#20242C', '#B8862B'];
    const pieces: Built[] = [];
    while (z < 0.25) {
      const t = 0.018 + ((i * 7) % 5) * 0.006, h = 0.19 + ((i * 3) % 4) * 0.02;
      const b = new Sink().rbox(0, h / 2, z + t / 2, 0.16, h, t, 0.003, 1);
      pieces.push(piece(b.out(), { mat: `book${i % cols.length}` }, { smooth: true }));
      z += t + 0.003;
      i++;
    }
    void s;
    return pieces;
  },
  /** The Google Code-in winner badge on its lanyard, hanging from a shelf edge: the loop, the clip, the card. Hangs down from the origin. */
  badge: () => {
    const lanyard = new Sink().box(0, -0.08, 0, 0.004, 0.16, 0.014).box(0, -0.165, 0, 0.012, 0.012, 0.02);
    const card = new Sink().box(0, -0.235, 0, 0.004, 0.12, 0.085);
    const face = new Sink().quad([0.0025, -0.295, -0.0425], [0.0025, -0.295, 0.0425], [0.0025, -0.175, 0.0425], [0.0025, -0.175, -0.0425], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    return [piece(lanyard.out(), M('lanyard')), piece(card.out(), M('board')), piece(face.out(), { paint: 'badge' })];
  },
  /** A small PC tower under the desk, 0.2 × 0.38 × 0.36, a power light. */
  pcTower: () => [piece(new Sink().rbox(0, 0.19, 0, 0.2, 0.38, 0.36, 0.01, 2).out(), M('bezel'), { smooth: true }), piece(new Sink().box(0.06, 0.34, 0.181, 0.01, 0.01, 0.002).out(), M('powerLed'))],
  /** An office chair: a five-star base, a gas lift, a seat and a curved back; seat at 0.46. The back is toward -z. */
  officeChair: () => {
    const base = new Sink();
    for (let i = 0; i < 5; i++) { const start = base.count; base.rbox(0.16, 0.03, 0, 0.32, 0.03, 0.04, 0.012, 2).rotateY(0, 0, (i * Math.PI * 2) / 5, start); }
    base.cylinder(0, 0.24, 0, 0.025, 0.4, 24);
    const seat = new Sink().rbox(0, 0.45, 0.02, 0.48, 0.07, 0.48, 0.03, 3);
    const back = new Sink().rbox(0, 0.78, -0.24, 0.44, 0.56, 0.06, 0.028, 3);
    const arms = new Sink().rbox(-0.26, 0.62, 0, 0.04, 0.03, 0.3, 0.012, 2).rbox(0.26, 0.62, 0, 0.04, 0.03, 0.3, 0.012, 2).rbox(-0.26, 0.54, 0, 0.03, 0.14, 0.03, 0.01, 2).rbox(0.26, 0.54, 0, 0.03, 0.14, 0.03, 0.01, 2);
    return [piece(base.out(), M('chairBase'), { smooth: true }), piece(seat.out(), M('chairFabric'), { smooth: true }), piece(back.out(), M('chairFabric'), { smooth: true }), piece(arms.out(), M('chairBase'), { smooth: true })];
  },
  /** A single bed along the window: a low oak frame, a mattress, a navy duvet turned back, a pillow. 2.0 along x, 0.95 along z. */
  bed: () => {
    const frame = new Sink().rbox(0, 0.12, 0, 2.02, 0.24, 0.97, 0.012, 2).rbox(-0.99, 0.45, 0, 0.04, 0.9, 0.97, 0.01, 2);
    const mattress = new Sink().rbox(0, 0.32, 0, 1.96, 0.18, 0.92, 0.06, 3);
    const duvet = new Sink().rbox(0.2, 0.44, 0, 1.5, 0.08, 0.94, 0.035, 3).rbox(0.2, 0.47, 0.05, 1.46, 0.03, 0.6, 0.014, 2);
    const pillow = new Sink().rbox(-0.72, 0.46, 0, 0.5, 0.1, 0.7, 0.045, 3);
    return [piece(frame.out(), M('bedFrame'), { smooth: true }), piece(mattress.out(), M('mattress'), { smooth: true }), piece(duvet.out(), M('duvet'), { smooth: true }), piece(pillow.out(), M('pillow'), { smooth: true })];
  },
  /** The brick wall behind the desk: the condo's x+ wall faced in brick, 3 cm proud, from the glass (z -3.4) to the front door (z 1.15 to 2.05) and past it. Placed at the wall's x, z 0. */
  condoBrick: () => [piece(new Sink().box(-0.015, 1.4, -1.125, 0.03, 2.8, 4.55).box(-0.015, 1.4, 2.125, 0.03, 2.8, 0.15).box(-0.015, 2.425, 1.6, 0.03, 0.75, 0.9).out(), M('condoBrick'))],
  /** White skirting round the studio (x -9.4..-4.2, z -3.4..2.2), 10 cm, breaking for the front door (x -5.9..-5.0), the brick door and the glass. */
  condoSkirting: () => {
    const t = 0.016, h = 0.1, s = new Sink();
    const alongZ = (x: number, z0: number, z1: number) => s.rbox(x, h / 2, (z0 + z1) / 2, t, h, z1 - z0, 0.004, 1);
    const alongX = (z: number, x0: number, x1: number) => s.rbox((x0 + x1) / 2, h / 2, z, x1 - x0, h, t, 0.004, 1);
    alongZ(-9.4 + t / 2, -3.4, 2.2); // x- wall
    alongX(2.2 - t / 2, -9.4, -5.9); // z+ wall up to the front door
    alongX(2.2 - t / 2, -5.0, -4.2); // and past it
    alongZ(-4.2 - 0.03 - t / 2, -3.4, 1.15); // x+ wall up to the brick door, in front of the brick
    return [piece(s.out(), M('skirting'), { smooth: true })];
  },
  /** The bathroom (x -13..-9.4, z 0..2.2): a tiled floor 8 mm proud, tiles to the ceiling behind the tub (x-) and to 1.2 m on the other walls, round the door at z 1.4. */
  bathTiles: () => {
    const s = new Sink(), d = 0.012;
    s.box(-11.2, 0.004, 1.1, 3.48, 0.008, 2.08);
    s.box(-13 + d / 2, 1.4, 1.1, d, 2.8, 2.08); // behind the tub, full height
    s.box(-11.2, 0.6, 2.2 - d / 2, 3.48, 1.2, d); // z+
    s.box(-11.2, 0.6, 0.06 + d / 2, 3.48, 1.2, d); // the bedroom wall's bathroom face
    s.box(-9.46 - d / 2, 0.6, 0.54, d, 1.2, 0.96); // partition, up to the door
    s.box(-9.46 - d / 2, 0.6, 1.99, d, 1.2, 0.42); // partition, past the door
    return [piece(s.out(), M('bathTile'))]; // flat uv: the runtime projects the tiles per face in metres
  },
  /** A shower on the wall over the tub: the riser, the arm and the head, chrome. Placed at the wall face, facing +x. */
  showerHead: () => {
    const s = new Sink().cylinder(0.02, 1.4, 0, 0.012, 1.4, 12).bone([0.02, 2.05, 0], [0.32, 2.12, 0], 0.012, 0.012).cylinder(0.32, 2.1, 0, 0.1, 0.02, 24).cylinder(0.02, 1.0, 0, 0.06, 0.04, 20);
    return [piece(s.out(), M('chrome'), { smooth: true })];
  },
  /** The auditorium's exit leaf: 1.16 by 2.18 for the wider front door, hinged at the origin along +z like doorLeaf. */
  doorLeafWide: () => {
    const s = new Sink().rbox(0, 1.09, 0.58, 0.04, 2.18, 1.16, 0.004, 1);
    s.rbox(0.03, 1.09, 0.58, 0.006, 1.8, 0.9, 0.002, 1).rbox(-0.03, 1.09, 0.58, 0.006, 1.8, 0.9, 0.002, 1);
    return [piece(s.out(), M('doorPaint'), { smooth: true }), piece(new Sink().box(0, 1.0, 1.08, 0.13, 0.02, 0.1).out(), M('chrome'))];
  },
  /** The hacker house table: a 3 by 1.4 m plywood top at 0.74 on two pairs of pine trestles, the mess of a launch week on it. */
  hackerTable: () => {
    const top = new Sink().rbox(0, 0.725, 0, 3.0, 0.03, 1.4, 0.006, 2);
    const legs = new Sink();
    for (const x of [-1.05, 1.05]) {
      legs.box(x, 0.68, 0, 0.06, 0.06, 1.2); // the beam
      for (const z of [-0.5, 0.5]) legs.box(x, 0.34, z, 0.045, 0.66, 0.045).rotateZ(x, 0.68, 0.3, legs.count - 36).box(x, 0.34, z, 0.045, 0.66, 0.045).rotateZ(x, 0.68, -0.3, legs.count - 36); // an A-frame each end
      legs.box(x, 0.3, 0, 0.5, 0.04, 0.04); // the tie
    }
    return [piece(top.out(), M('plywood'), { smooth: true, metres: 'xz' }), piece(legs.out(), M('trestle'))];
  },
  /** An air mattress on the floor: 1.9 by 0.95, 0.22 deep, its I-beam ribs across, a pillow and a thrown-back blanket; along x at the origin. */
  airMattress: () => {
    const bed = new Sink().rbox(0, 0.11, 0, 1.9, 0.22, 0.95, 0.05, 3);
    const top = new Sink();
    for (let i = 0; i < 9; i++) top.rbox(-0.85 + i * 0.2125, 0.215, 0, 0.17, 0.035, 0.86, 0.015, 2); // the ribs, flocked
    const bedding = new Sink().rbox(0.62, 0.29, 0, 0.5, 0.11, 0.42, 0.04, 3); // the pillow
    bedding.rbox(-0.3, 0.255, 0.05, 1.1, 0.05, 0.9, 0.02, 2).rotateY(-0.3, 0.05, 0.1); // the blanket, pushed back and askew
    return [piece(bed.out(), M('airBed'), { smooth: true }), piece(top.out(), M('airBedFlock'), { smooth: true }), piece(bedding.out(), M('bedding'), { smooth: true, metres: 'xz' })];
  },
  /**
   * The wires on the hacker house table, laid the way they are laid: each monitor's lead runs from its stand to the spine down
   * the middle of the table between the two rows, the spine (three leads) runs east and drops over the south-east corner to
   * a power strip on the floor; each keyboard's lead goes to its monitor, each laptop's charger to the spine. Origin at the
   * table's centre, the top at y 0.74; the device positions match sets.ts.
   */
  wires: () => {
    const black = new Sink(), white = new Sink(), strip = new Sink();
    const rnd = rng(17);
    const y = 0.748;
    const lay = (sink: Sink, pts: V3[], wobble = 0.012, n = 6) => { // a lead through the points, a little slack between them
      for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i], b = pts[i + 1];
        let prev: V3 = a;
        for (let k = 1; k <= n; k++) {
          const t = k / n, w = Math.sin(t * Math.PI) * wobble;
          const q: V3 = k === n ? b : [a[0] + (b[0] - a[0]) * t + (rnd() - 0.5) * w, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t + (rnd() - 0.5) * w];
          sink.bone(prev, q, 0.004, 0.004); prev = q;
        }
      }
    };
    // monitors: stand at (x, z), rows at z ±0.15 from the table's centre line; the spine at z 0
    const north = [[-0.7, 0.15], [0.65, 0.15]], south = [[0, -0.15], [-1.25, -0.15]];
    for (const [mx, mz] of [...north, ...south]) lay(black, [[mx, y, mz - Math.sign(mz) * 0.08], [mx + 0.05, y, 0.0]], 0.01, 4);
    for (const [mx, mz] of [...north, ...south]) lay(black, [[mx + 0.03, y, mz - Math.sign(mz) * 0.08], [mx - 0.04, y, 0.02]], 0.01, 4); // power and video
    // keyboards to their monitors
    lay(black, [[-0.7, y, 0.55], [-0.72, y, 0.23]], 0.015, 5);
    lay(black, [[0.0, y, -0.5], [0.02, y, -0.23]], 0.015, 5);
    // laptop chargers, white
    lay(white, [[1.05, y, 0.3], [1.2, y, 0.05], [1.3, y, 0.0]], 0.02, 5);
    lay(white, [[0.9, y, -0.4], [1.0, y, -0.1], [1.1, y, 0.0]], 0.02, 5);
    // the spine: three leads down the middle from the west end to the corner, then over the edge to the strip
    for (const [sink, dz] of [[black, -0.02], [black, 0.02], [white, 0.0]] as const) {
      lay(sink, [[-1.35, y, dz], [-0.4, y, dz + 0.01], [0.5, y, dz - 0.01], [1.35, y, dz]], 0.015, 8);
      lay(sink, [[1.35, y, dz], [1.42, y - 0.02, -0.62], [1.4, 0.4, -0.75], [1.3 + dz * 4, 0.03, -0.85]], 0.01, 6);
    }
    strip.rbox(1.15, 0.02, -0.86, 0.36, 0.04, 0.06, 0.008, 2); // the power strip on the floor by the trestle
    for (let i = 0; i < 4; i++) strip.box(1.03 + i * 0.08, 0.041, -0.86, 0.03, 0.004, 0.03);
    lay(black, [[1.0, 0.02, -0.86], [0.4, 0.02, -0.9], [-0.2, 0.02, -1.4]], 0.02, 6); // the strip's own lead away under the table
    return [piece(black.out(), M('cable'), { smooth: true }), piece(white.out(), M('cableWhite'), { smooth: true }), piece(strip.out(), M('powerStrip'), { smooth: true })];
  },
  /** The Bean sign on the wall above the window: the mark and the wordmark, painted, 2.4 by 0.5, its face toward +z. */
  beanSign: () => [piece(face(2.4, 0.5, 0.004), { paint: 'beanSign' })],
  /** The four older monitors on the hacker house table: the app in its design tool, the code, the Product Hunt page, the adapt endpoint. */
  monitorOldApp: monOld('screenBeanApp'),
  monitorOldCode: monOld('screenCode', true),
  monitorOldPH: monOld('screenProductHunt'),
  monitorOldBeanCode: monOld('screenBeanCode'),
  /** A phone flat on the table, the app on it: 0.075 by 0.155, the screen up. */
  phoneBean: () => [piece(new Sink().rbox(0, 0.004, 0, 0.075, 0.008, 0.155, 0.003, 2).out(), M('bezel'), { smooth: true }), piece(offsetGeo(new Sink().quad([-0.034, 0.0085, 0.072], [0.034, 0.0085, 0.072], [0.034, 0.0085, -0.072], [-0.034, 0.0085, -0.072], [[0, 0], [1, 0], [1, 1], [0, 1]]).out(), 0, 0, 0), { paint: 'screenBeanPhone' })],
  /** The laptop carried through the tour, held in the lower left of the frame (stage-run.ts): the road dashboard on it. */
  laptopTour: () => laptopFor('screenTour'),
  /** The design laptop and the code laptop on the hacker house table. */
  laptopBean: () => laptopFor('screenBeanApp'),
  laptopBeanCode: () => laptopFor('screenBeanCode'),
  /** The monitor with the Product Hunt page up on launch day. */
  monitorPH: mon('screenProductHunt'),
  /** The whiteboard on the north wall: how Bean works, and launch week. */
  whiteboardBean: () => [piece(face(2.4, 1.2, 0.005), { paint: 'whiteboardBean' }), piece(frame(2.4, 1.2, 0.03, 0.01).out(), M('alu'))],
  /** The poster by the door, 0.6 by 0.85 in a thin black frame, its face toward +z. */
  beanPoster: () => [piece(face(0.6, 0.85, 0.012), { paint: 'beanPoster' }), piece(frame(0.62, 0.87, 0.02, 0.006).out(), M('bezel'))],
  /** The hacker house window: a frame 4.0 by 1.55 with two mullions, its glass in one pane; along x at the origin, sill at y 0. */
  sydneyWindow: () => {
    const s = new Sink().box(0, 0, 0, 4.06, 0.06, 0.08).box(0, 1.55, 0, 4.06, 0.06, 0.08).box(-2.0, 0.775, 0, 0.06, 1.55, 0.08).box(2.0, 0.775, 0, 0.06, 1.55, 0.08);
    for (const x of [-0.67, 0.67]) s.box(x, 0.775, 0, 0.045, 1.55, 0.06);
    const pane = new Sink().quad([-2.0, 0, 0.012], [2.0, 0, 0.012], [2.0, 1.55, 0.012], [-2.0, 1.55, 0.012]).quad([2.0, 0, -0.012], [-2.0, 0, -0.012], [-2.0, 1.55, -0.012], [2.0, 1.55, -0.012]);
    return [piece(s.out(), M('windowFrame')), piece(pane.out(), M('cabinGlass'))];
  },
  /** The water outside the window: a 500 by 1000 m sheet of harbour from the wall out, at the origin's height. */
  harbourWater: () => [piece(new Sink().quad([0, 0, 500], [0, 0, -500], [-500, 0, -500], [-500, 0, 500]).out(), M('seaWater'), { metres: 'xz' })],
  /** Bennelong Point under the Opera House: a paved headland 250 by 210 m from 180 m off the window back to the painted shore, water in front of it, its quay edge in dark stone, top at y 0.3, the water at −0.6 round it. Origin at its east end's centre. */
  bennelongPoint: () => {
    const top = new Sink().box(-125, 0.15, 0, 250, 0.3, 210);
    const edge = new Sink().box(-125, -0.5, 0, 250.4, 1.3, 210.4);
    return [piece(top.out(), M('campusPaving'), { metres: 'xz' }), piece(edge.out(), M('quayStone'))];
  },
  // ---- 2025, the tour: booths and offices. An expo hall, an office, a conference floor, a coworking space
  /** A hanging banner: 1.2 by 3 m of fabric on a rod, hung from the origin (the ceiling), its face toward -z; three of them. */
  hangWebSummit: (): BuiltPart => [piece(new Sink().box(0, -0.62, 0, 1.3, 0.04, 0.04).out(), M('chrome')), piece(new Sink().bone([0, 0, 0], [0, -0.6, 0], 0.006, 0.006).out(), M('cable')), piece(offsetGeo(faceBack(1.2, 3.0, 0.0), 0, -2.15, 0), { paint: 'bannerWebSummit' })],
  hangAllIn: (): BuiltPart => [piece(new Sink().box(0, -0.62, 0, 1.3, 0.04, 0.04).out(), M('chrome')), piece(new Sink().bone([0, 0, 0], [0, -0.6, 0], 0.006, 0.006).out(), M('cable')), piece(offsetGeo(faceBack(1.2, 3.0, 0.0), 0, -2.15, 0), { paint: 'bannerAllIn' })],
  hangElevate: (): BuiltPart => [piece(new Sink().box(0, -0.62, 0, 1.3, 0.04, 0.04).out(), M('chrome')), piece(new Sink().bone([0, 0, 0], [0, -0.6, 0], 0.006, 0.006).out(), M('cable')), piece(offsetGeo(faceBack(1.2, 3.0, 0.0), 0, -2.15, 0), { paint: 'bannerElevate' })],
  /** A neighbouring booth on the expo floor: a white counter and a plain grey back panel, no one home; the front toward -z. */
  expoBooth: () => {
    const counter = new Sink().rbox(0, 0.5, 0, 2.4, 1.0, 0.7, 0.03, 2);
    const back = new Sink().rbox(0, 1.25, 0.9, 2.6, 2.5, 0.08, 0.02, 2).box(-1.2, 1.25, 0.9, 0.06, 2.5, 0.12).box(1.2, 1.25, 0.9, 0.06, 2.5, 0.12);
    const panel = new Sink().box(0, 1.35, 0.85, 2.3, 1.8, 0.02);
    return [piece(counter.out(), M('boothWhite'), { smooth: true }), piece(back.out(), M('boothWhite'), { smooth: true }), piece(panel.out(), M('acousticPanel'))];
  },
  /** The Montreal booth: Bean with the Nova Scotia delegation at ALL IN; the same counter, its own panel. */
  beanBoothMontreal: () => {
    const counter = new Sink().rbox(0, 0.5, 0, 2.4, 1.0, 0.7, 0.03, 2);
    const back = new Sink().rbox(0, 1.25, 0.9, 2.6, 2.5, 0.08, 0.02, 2).box(-1.2, 1.25, 0.9, 0.06, 2.5, 0.12).box(1.2, 1.25, 0.9, 0.06, 2.5, 0.12);
    const stool = new Sink().cylinder(0.7, 0.66, 0.55, 0.17, 0.05, 16).cylinder(0.7, 0.32, 0.55, 0.02, 0.62, 8).cylinder(0.7, 0.02, 0.55, 0.2, 0.04, 16);
    return [piece(counter.out(), M('boothWhite'), { smooth: true }), piece(back.out(), M('boothWhite'), { smooth: true }), piece(offsetGeo(faceBack(2.3, 0.7, 0.0), 0, 0.55, -0.36), { paint: 'boothFront' }), piece(offsetGeo(faceBack(2.4, 2.2, 0.0), 0, 1.3, 0.85), { paint: 'boothMontreal' }), piece(stool.out(), M('bezel'), { smooth: true })];
  },
  /** A city sign on the wall, 2.4 by 0.6, painted per city; its face toward +z. */
  signVancouver: (): BuiltPart => [piece(face(2.4, 0.6, 0.004), { paint: 'signVancouver' })],
  signToronto: (): BuiltPart => [piece(face(2.4, 0.6, 0.004), { paint: 'signToronto' })],
  signMontreal: (): BuiltPart => [piece(face(2.4, 0.6, 0.004), { paint: 'signMontreal' })],
  signHalifax: (): BuiltPart => [piece(face(2.4, 0.6, 0.004), { paint: 'signHalifax' })],
  /** Whiteboards for the offices: churn in Toronto, Collect. in Halifax. */
  whiteboardChurn: () => [piece(face(2.4, 1.2, 0.005), { paint: 'whiteboardChurn' }), piece(frame(2.4, 1.2, 0.03, 0.01).out(), M('alu'))],
  whiteboardCollect: () => [piece(face(2.4, 1.2, 0.005), { paint: 'whiteboardCollect' }), piece(frame(2.4, 1.2, 0.03, 0.01).out(), M('alu'))],
  /** A framed certificate on the wall: Invest Nova Scotia Accelerate, 0.6 by 0.45, the face toward +z. */
  certificateInvestNS: (): BuiltPart => [piece(face(0.56, 0.41, 0.012), { paint: 'certificateInvestNS' }), piece(frame(0.6, 0.45, 0.02, 0.006).out(), M('bezel'))],
  /** A conference screen on a stand: 2 by 1.15 m, the ALL IN talk on it, facing +z. */
  talkScreen: () => [piece(offsetGeo(face(2.0, 1.15, 0.021), 0, 1.75, 0), { paint: 'screenAllIn' }), piece(new Sink().rbox(0, 1.75, 0, 2.08, 1.23, 0.04, 0.008, 2).rbox(0, 0.6, -0.02, 0.08, 1.2, 0.08, 0.01, 2).rbox(0, 0.02, -0.02, 0.9, 0.04, 0.5, 0.01, 2).out(), M('bezel'), { smooth: true })],
  /** A conference chair: a stackable dark shell on chrome legs, facing -z. */
  hallChair: () => [piece(new Sink().rbox(0, 0.46, 0, 0.48, 0.05, 0.46, 0.02, 2).rbox(0, 0.72, 0.21, 0.46, 0.5, 0.04, 0.02, 2).out(), M('acousticPanel'), { smooth: true }), piece(new Sink().box(-0.2, 0.22, -0.18, 0.02, 0.44, 0.02).box(0.2, 0.22, -0.18, 0.02, 0.44, 0.02).box(-0.2, 0.22, 0.18, 0.02, 0.44, 0.02).box(0.2, 0.22, 0.18, 0.02, 0.44, 0.02).out(), M('chrome'))],
  /** The Bean booth at Web Summit: a white counter with the logo on its front, a tall back panel with the day's numbers, a stool; the front toward -z. */
  beanBooth: () => {
    const counter = new Sink().rbox(0, 0.5, 0, 2.4, 1.0, 0.7, 0.03, 2);
    const back = new Sink().rbox(0, 1.25, 0.9, 2.6, 2.5, 0.08, 0.02, 2).box(-1.2, 1.25, 0.9, 0.06, 2.5, 0.12).box(1.2, 1.25, 0.9, 0.06, 2.5, 0.12);
    const stool = new Sink().cylinder(0.7, 0.66, 0.55, 0.17, 0.05, 16).cylinder(0.7, 0.32, 0.55, 0.02, 0.62, 8).cylinder(0.7, 0.02, 0.55, 0.2, 0.04, 16);
    return [piece(counter.out(), M('boothWhite'), { smooth: true }), piece(back.out(), M('boothWhite'), { smooth: true }), piece(offsetGeo(faceBack(2.3, 0.7, 0.0), 0, 0.55, -0.36), { paint: 'boothFront' }), piece(offsetGeo(faceBack(2.4, 2.2, 0.0), 0, 1.3, 0.85), { paint: 'boothBack' }), piece(stool.out(), M('bezel'), { smooth: true })];
  },
  /** The harbour out of the west window: a 1200 by 450 m painted view, its face toward +x, 430 m out behind the Opera House, filling the window from the glass; its sky runs into the set's fog colour, unlit. */
  sydneyHarbour: () => [piece(new Sink().quad([0, -225, 600], [0, -225, -600], [0, 225, -600], [0, 225, 600], [[0, 0], [1, 0], [1, 1], [0, 1]]).out(), { paint: 'sydney' })],
  /** An interior door leaf, 0.85 by 2.04, hinged at the origin along +z, its face toward +x; placed at the hinge and turned open. */
  doorLeaf: () => {
    const s = new Sink().rbox(0, 1.02, 0.425, 0.04, 2.04, 0.85, 0.004, 1);
    s.rbox(0.03, 1.02, 0.425, 0.006, 1.7, 0.6, 0.002, 1).rbox(-0.03, 1.02, 0.425, 0.006, 1.7, 0.6, 0.002, 1); // a raised panel each side
    s.box(0.045, 1.0, 0.78, 0.05, 0.02, 0.1).box(-0.045, 1.0, 0.78, 0.05, 0.02, 0.1); // handles
    return [piece(s.out(), M('doorPaint'), { smooth: true }), piece(new Sink().box(0, 1.0, 0.78, 0.13, 0.02, 0.1).out(), M('chrome'))];
  },
  /** A 55 inch television on the wall, off: a black glass face in a thin bezel, its back at x 0, facing -x, the middle at 1.35. */
  wallTv: () => [piece(new Sink().rbox(-0.025, 1.35, 0, 0.05, 0.71, 1.23, 0.004, 1).out(), M('bezel'), { smooth: true }), piece(new Sink().box(-0.052, 1.35, 0, 0.004, 0.68, 1.2).out(), M('tvGlass'))],
  /** A flush ceiling light: a shallow white disc 0.3 across that glows; placed at the ceiling. */
  discLight: () => [piece(new Sink().lathe([[0.16, 0], [0.16, -0.03], [0.13, -0.05], [0.0, -0.06]], 0, 0, 0, 1, 1, 0, 24).out(), M('lampGlobe'), { smooth: true })],
  /** A warm LED strip under the hutch's top shelf, the length of the desk. Placed like the hutch. */
  hutchLed: () => [piece(new Sink().box(0.03, 0.932, 0, 0.04, 0.012, 1.7).out(), M('ledStrip'))],
  /** A grey rug under the desk, 2.4 × 1.8. */
  rugGrey: () => [piece(new Sink().rbox(0, 0.006, 0, 2.4, 0.012, 1.8, 0.006, 1).out(), M('rugGrey'), { metres: 'xz', smooth: true })],
  /**
   * Toronto at night, in metres, the condo at the origin and the window looking toward -z (south).
   * The real downtown from OpenStreetMap (city.ts): every building with a height, pulled up from
   * its footprint with lit windows (uv in bays and floors, so the tile keeps its size), the
   * financial district a kilometre down Yonge, the CN Tower 1.7 km off with its legs, pod, SkyPod
   * and antenna, the Rogers Centre dome at its foot, the lake beyond as dark ground. The street
   * lights are points the runtime adds (stage-run.ts). Deterministic.
   */
  city: () => {
    const near = new Sink(), far = new Sink(), tops = new Sink(), domes = new Sink();
    cityBlocks(near, far, tops, domes);
    const cn = new Sink(), pod = new Sink(), light = new Sink();
    cnTower(cn, pod, light);
    const ground = new Sink().quad([-2500, -0.2, 2500], [2500, -0.2, 2500], [2500, -0.2, -2500], [-2500, -0.2, -2500]);
    return [
      piece(near.out(), M('tower'), { tint: true }),
      piece(far.out(), M('towerFar'), { tint: true }),
      piece(tops.out(), M('towerTop')),
      piece(cn.out(), M('cnShaft'), { tint: true }),
      piece(pod.out(), M('cnPod'), { tint: true }),
      piece(light.out(), M('cnLight'), { smooth: true }),
      piece(domes.out(), M('dome'), { smooth: true }),
      piece(ground.out(), M('lake')),
    ];
  },
  /** The night sky: a dome 2.4 km out, beyond the city, the gradient painted bottom to top. */
  nightSky: () => [piece(new Sink().sphere(0, 0, 0, 2400, 2400, 2400, 24, 12, UNIT).out(), M('nightSky'))],
  /** The window's mullions: a thin frame across the opening, 5.0 × 2.0, at the wall. */
  mullions: () => {
    const s = new Sink().box(0, 0, 0, 5.02, 0.05, 0.06).box(0, 2.0, 0, 5.02, 0.05, 0.06);
    for (const x of [-2.5, -0.85, 0.85, 2.5]) s.box(x, 1.0, 0, 0.05, 2.0, 0.06);
    return [piece(s.out(), M('windowFrame'))];
  },
  /** Short dark hair: a cap hugging the top and back of the head, centred on the head's centre, the face toward +z. */
  hair: () => {
    // a unit cap (radius 1) over the top 46 percent of the skull; the runtime scales it to the head
    const s = new Sink().sphere(0, 0, 0, 1, 1, 1, 36, 18, undefined, 0.46);
    return [piece(s.out(), M('hair'), { smooth: true })];
  },
  /** A hoodie torso: a loose elliptic tube from the hips to the collar, built for a unit torso (height 1, half width 1, half depth 1); scaled at runtime. */
  hoodieTorso: () => [piece(new Sink().lathe([[0.86, 0], [0.98, 0.18], [1.0, 0.55], [0.94, 0.85], [0.6, 1.0]], 0, 0, 0, 1, 1, 0, 40).out(), M('hoodie'), { smooth: true })],
  /** A sleeve: a unit cylinder along +y from 0 to 1 with a slight flare, radius 1; scaled at runtime to the arm segment. */
  sleeve: () => [piece(new Sink().lathe([[1.0, 0], [1.05, 0.5], [0.95, 1.0]], 0, 0, 0, 1, 1, 0, 24).out(), M('hoodie'), { smooth: true })],
  /** The hood, down: a soft cowl behind the neck and a collar ring, built around the base of the neck, the face toward +z. */
  hood: () => {
    const s = new Sink();
    s.sphere(0, 0.04, -0.09, 0.13, 0.11, 0.1, 28, 14, undefined, 0.75).rotateX(0.04, -0.09, 0.9);
    s.lathe([[0.075, 0], [0.09, 0.03], [0.085, 0.06]], 0, 0.0, -0.01, 1.15, 1, 0, 28);
    return [piece(s.out(), M('hoodie'), { smooth: true })];
  },
  /** Thin glasses: two rims and a bridge, at the head's eye height, facing +z. */
  glasses: () => {
    const s = new Sink();
    for (const sx of [-1, 1]) {
      s.bone([sx * 0.06 - 0.035, 0.03, 0.098], [sx * 0.06 + 0.035, 0.03, 0.098], 0.003, 0.003).bone([sx * 0.06 - 0.035, 0.0, 0.098], [sx * 0.06 + 0.035, 0.0, 0.098], 0.003, 0.003);
      s.bone([sx * 0.06 - 0.035, 0.0, 0.098], [sx * 0.06 - 0.035, 0.03, 0.098], 0.003, 0.003).bone([sx * 0.06 + 0.035, 0.0, 0.098], [sx * 0.06 + 0.035, 0.03, 0.098], 0.003, 0.003);
      s.bone([sx * 0.095, 0.025, 0.098], [sx * 0.11, 0.02, -0.02], 0.003, 0.003);
    }
    s.bone([-0.025, 0.02, 0.098], [0.025, 0.02, 0.098], 0.003, 0.003);
    return [piece(s.out(), M('glassFrame'))];
  },
  /** A tie: the knot at the collar, the blade hanging 0.32 below; built facing +z. */
  tie: () => [piece(new Sink().box(0, -0.02, 0.008, 0.05, 0.04, 0.02).box(0, -0.2, 0.004, 0.065, 0.32, 0.01).out(), M('tie'))],
  /** A pouf on the rug: 0.36 high, 0.3 across, soft blue; a nine year old sits on it. */
  pouf: () => [piece(new Sink().lathe([[0.27, 0], [0.31, 0.06], [0.32, 0.22], [0.3, 0.32], [0.22, 0.36], [0.001, 0.37]], 0, 0, 0, 1, 1, 0, 36).out(), M('pouf'), { smooth: true })],
  /** A lab bench: a laminate top on a steel frame, 4.8 m along x, 0.7 deep, top at 0.74; a modesty panel at the back (-z). */
  labBench: () => {
    const top = new Sink().rbox(0, 0.725, 0, 4.8, 0.03, 0.7, 0.006, 2);
    const frame = new Sink();
    for (const x of [-2.3, -1.2, 0, 1.2, 2.3]) frame.rbox(x, 0.355, -0.08, 0.04, 0.71, 0.5, 0.006, 1);
    frame.box(0, 0.4, -0.33, 4.8, 0.62, 0.02);
    return [piece(top.out(), M('desk'), { smooth: true }), piece(frame.out(), M('deskLeg'), { smooth: true })];
  },
  /** The same bench, 2.9 m: three stations. */
  labBenchShort: () => {
    const top = new Sink().rbox(0, 0.725, 0, 2.9, 0.03, 0.7, 0.006, 2);
    const frame = new Sink();
    for (const x of [-1.35, 0, 1.35]) frame.rbox(x, 0.355, -0.08, 0.04, 0.71, 0.5, 0.006, 1);
    frame.box(0, 0.4, -0.33, 2.9, 0.62, 0.02);
    return [piece(top.out(), M('desk'), { smooth: true }), piece(frame.out(), M('deskLeg'), { smooth: true })];
  },
  /** A grey fabric partition between two stations, standing on the bench: 0.65 deep along z, 0.55 tall, an aluminium frame. */
  partition: () => {
    const panel = new Sink().rbox(0, 0.275, 0, 0.03, 0.55, 0.65, 0.008, 1);
    const frame = new Sink().box(0, 0.555, 0, 0.036, 0.012, 0.66).box(0, 0.275, 0.33, 0.036, 0.55, 0.012).box(0, 0.275, -0.33, 0.036, 0.55, 0.012);
    return [piece(panel.out(), M('partition'), { smooth: true }), piece(frame.out(), M('alu'))];
  },
  /** A mouse, 0.11 long along z. */
  mouse: () => [piece(new Sink().rbox(0, 0.018, 0, 0.06, 0.036, 0.11, 0.016, 2).out(), M('keys'), { smooth: true })],
  /** A 19 inch LCD of 2013: a slim black bezel on a round steel foot, the screen towards +z. */
  labMonitor: lcd('screen:2'),
  labMonitorNotepad: lcd('screen:1'),
  /** A 32 inch flat television of 2010 on its stand; the glass is the video. */
  flatTv: () => {
    const body = new Sink().rbox(0, 0.5, -0.02, 0.78, 0.48, 0.04, 0.008, 2);
    const stand = new Sink().rbox(0, 0.14, -0.02, 0.05, 0.28, 0.03, 0.006, 2).rbox(0, 0.01, -0.02, 0.4, 0.02, 0.22, 0.006, 2);
    return [piece(offsetGeo(face(0.72, 0.42, 0.001), 0, 0.5, 0), { paint: 'video' }), piece(body.out(), M('bezel'), { smooth: true }), piece(stand.out(), M('bezel'), { smooth: true })];
  },
  /** The TV cabinet: a dark wood top on four legs, 1.1 × 0.62 × 0.5. */
  tvTable: () => {
    const s = new Sink().rbox(0, 0.6, 0, 1.1, 0.04, 0.5, 0.008, 2);
    for (const [x, z] of [[-0.5, -0.2], [0.5, -0.2], [-0.5, 0.2], [0.5, 0.2]]) s.rbox(x, 0.29, z, 0.05, 0.58, 0.05, 0.008, 2);
    return [piece(s.out(), M('tvWood'), { metres: 'xz', smooth: true })];
  },
  /** A clean open shelf: two uprights, a back, five shelves, 1.2 wide, 1.9 tall, 0.32 deep, teak. */
  /** A small shelf unit, 0.8 wide, 0.9 tall, 0.26 deep: three shelves and a top. */
  smallShelf: () => {
    const s = new Sink();
    s.rbox(-0.39, 0.45, 0, 0.02, 0.9, 0.26, 0.004, 1).rbox(0.39, 0.45, 0, 0.02, 0.9, 0.26, 0.004, 1).box(0, 0.45, -0.12, 0.8, 0.9, 0.02);
    for (const y of [0.04, 0.32, 0.6, 0.88]) s.rbox(0, y, 0, 0.78, 0.02, 0.24, 0.004, 1);
    return [piece(s.out(), M('shelfWood'), { metres: 'xy', smooth: true })];
  },
  /** Seven anime figures in a row on a shelf, 0.13 to 0.16 tall on black bases, facing +z: Naruto, Goku, Luffy, Ichigo, Saitama, Levi, Vegeta. */
  figures: () => {
    const sinks = new Map<string, Sink>();
    const at = (m: string) => { let k = sinks.get(m); if (!k) { k = new Sink(); sinks.set(m, k); } return k; };
    const cast: Array<[string, string, string | null, number]> = [
      ['figOrange', 'figOrange', 'hairYellow', 1.0], ['figOrange', 'figBlue', 'hairBlack', 1.05], ['figRed', 'figBlue', 'hairBlack', 0.95],
      ['figBlack', 'figBlack', 'hairOrange', 1.0], ['figYellow', 'figYellow', null, 0.95], ['figGreen', 'figWhite', 'hairBlack', 0.9], ['figBlue', 'figBlue', 'hairBlack', 1.05],
    ];
    cast.forEach(([top, legs, hair, k], i) => {
      const x = -0.3 + i * 0.1, s = 0.13 * k;
      at('figBase').cylinder(x, 0.005, 0, 0.032, 0.01, 16);
      at(legs).box(x - 0.011, 0.01 + s * 0.22, 0, 0.016, s * 0.44, 0.02).box(x + 0.011, 0.01 + s * 0.22, 0, 0.016, s * 0.44, 0.02);
      at(top).box(x, 0.01 + s * 0.62, 0, 0.05, s * 0.36, 0.026);
      at('figSkin').box(x - 0.034, 0.01 + s * 0.6, 0, 0.012, s * 0.32, 0.014).box(x + 0.034, 0.01 + s * 0.6, 0, 0.012, s * 0.32, 0.014);
      at('figSkin').sphere(x, 0.01 + s * 0.9, 0, s * 0.11, s * 0.11, s * 0.1, 14, 10);
      if (hair) at(hair).lathe([[s * 0.115, 0], [s * 0.12, s * 0.06], [s * 0.05, s * 0.17], [s * 0.01, s * 0.24]], x, 0.01 + s * 0.9, 0, 1, 1, 0, 12);
    });
    return [...sinks.entries()].map(([m, k]) => piece(k.out(), M(m), { smooth: m === 'figSkin' }));
  },
  /** The original white Xbox 360, standing: 8 wide, 31 tall, 26 deep; the green ring and the tray on the front (+z). */
  xbox360: () => {
    const body = new Sink().rbox(0, 0.155, 0, 0.083, 0.31, 0.26, 0.012, 3).rbox(0, 0.155, 0.13, 0.072, 0.3, 0.008, 0.003, 1);
    const grey = new Sink().rbox(0, 0.155, 0.135, 0.06, 0.3, 0.004, 0.002, 1);
    const chrome = new Sink().box(0, 0.24, 0.138, 0.05, 0.016, 0.003).box(0, 0.045, 0.138, 0.02, 0.012, 0.003);
    const ring = new Sink().sphere(0, 0.12, 0.139, 0.02, 0.02, 0.003, 24, 8);
    return [piece(body.out(), M('xboxWhite'), { smooth: true }), piece(grey.out(), M('xboxGrey'), { smooth: true }), piece(chrome.out(), M('xboxChrome')), piece(ring.out(), M('xboxGreen'), { smooth: true })];
  },
  shelf: () => {
    const s = new Sink();
    s.rbox(-0.59, 0.95, 0, 0.02, 1.9, 0.32, 0.004, 1).rbox(0.59, 0.95, 0, 0.02, 1.9, 0.32, 0.004, 1).box(0, 0.95, -0.15, 1.2, 1.9, 0.02);
    for (let i = 0; i < 5; i++) s.rbox(0, 0.06 + i * 0.46, 0, 1.18, 0.02, 0.3, 0.004, 1);
    return [piece(s.out(), M('shelfWood'), { metres: 'xy' })];
  },
  /** The rug: a 24-sided disc, r 1.3. */
  rug: () => {
    const s = new Sink(), n = 24;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2;
      s.tri([0, 0, 0], [1.3 * Math.cos(b), 0, 1.3 * Math.sin(b)], [1.3 * Math.cos(a), 0, 1.3 * Math.sin(a)]);
    }
    return [piece(s.out(), M('rug'), { metres: 'xz' })];
  },
  /** Two curtain panels hanging from a rod at the origin, each 0.55 wide and 1.7 long, folded. */
  curtains: () => {
    const cloth = new Sink(), cols = 14, w = 0.55, h = 1.7;
    for (const side of [-1, 1]) {
      const x0 = side * 0.55 - (side > 0 ? 0 : w); // panels hang left and right of the window edge
      for (let c = 0; c < cols; c++) {
        const xa = x0 + (w * c) / cols, xb = x0 + (w * (c + 1)) / cols;
        const za = 0.03 * Math.sin(c * 1.9), zb = 0.03 * Math.sin((c + 1) * 1.9);
        cloth.quad([xa, -h, za], [xb, -h, zb], [xb, 0, zb], [xa, 0, za]);
      }
    }
    const rod = new Sink().cylinder(0, 0.02, 0, 0.015, 1.9, 8).rotateZ(0, 0.02, Math.PI / 2);
    return [piece(cloth.out(), M('curtain'), { metres: 'xy' }), piece(rod.out(), M('rod'), { smooth: true })];
  },
  /** The view out of the window: a painted quad 2.6 × 2.0 facing +z, big enough to fill the window from anywhere on the dolly. */
  skyline: () => [piece(face(2.6, 2.0), { paint: 'window' })],
  /** A door frame in a 0.9 × 2.05 opening: two jambs and a head, 0.3 deep so the wall reads thick on the way through; the opening runs along z. */
  doorFrame: () => [piece(new Sink().box(-0.5, 1.025, 0, 0.1, 2.05, 0.3).box(0.5, 1.025, 0, 0.1, 2.05, 0.3).box(0, 2.1, 0, 1.1, 0.1, 0.3).out(), M('frameWood'))],
  /** The passage: 3 m long, 1.2 wide, 2.4 high, open at both ends, a bulb halfway. Built with its floor at the origin corner. */
  passage: () => {
    const sh = buildShell({
      x: [0, 3], z: [0, 1.2], h: 2.4, floor: 'passageFloor', wall: 'passageWall',
      openings: [{ wall: 'x-', at: 0.6, w: 1.2, h: 2.4 }, { wall: 'x+', at: 0.6, w: 1.2, h: 2.4 }],
    });
    const wc = {
      pos: new Float32Array([...sh.walls.pos, ...sh.ceiling.pos]), nor: new Float32Array([...sh.walls.nor, ...sh.ceiling.nor]), uv: new Float32Array([...sh.walls.uv, ...sh.ceiling.uv]),
    };
    const bulb = new Sink().sphere(1.5, 2.2, 0.6, 0.04, 0.05, 0.04, 14, 8).out();
    return [
      { ...sh.floor, surface: M('passageFloor') },
      { ...wc, surface: M('passageWall') },
      piece(bulb, M('bulb'), { smooth: true }),
    ];
  },
  /** A beige keyboard: a slab and 6 rows of 15 keys. */
  keyboard: () => {
    const base = new Sink().rbox(0, 0.01, 0, 0.44, 0.02, 0.15, 0.005, 2);
    const keys = new Sink();
    for (let r = 0; r < 6; r++) for (let c = 0; c < 15; c++) keys.box(-0.2 + c * 0.0285, 0.025, -0.055 + r * 0.022, 0.018, 0.01, 0.018); // ninety keys: plain boxes, a bevel this small is not seen
    return [piece(base.out(), M('desk')), piece(keys.out(), M('keys'))];
  },
  /** The whiteboard: a painted 2.4 × 1.2 face in an aluminium frame, facing +z. */
  whiteboard: () => [piece(face(2.4, 1.2, 0.005), { paint: 'whiteboard' }), piece(frame(2.4, 1.2, 0.03, 0.01).out(), M('alu'))],
  /** The Converge Clan banner, 2.2 × 0.5, painted. */
  banner: () => [piece(face(2.2, 0.5, 0.01), { paint: 'banner' })],
  /** The Jobs poster, 1.2 × 0.67, painted (frame 0 of `poster`), in a thin black frame. */
  jobsPoster: () => [piece(face(1.2, 0.67, 0.005), { paint: 'poster:0' }), piece(frame(1.2, 0.67, 0.02, 0.01).out(), M('frameBlack'))],
  /** The team photo, 1.0 × 0.7, painted, in a wooden frame. */
  teamPhoto: () => [piece(face(1.0, 0.7, 0.005), { paint: 'poster:1' }), piece(frame(1.0, 0.7, 0.03, 0.01).out(), M('frameWood'))],
  /** A tube light: the tube in a tray, 1.2 m, along x, hanging below the origin. */
  tube: () => {
    const tray = new Sink().box(0, -0.03, 0, 1.3, 0.06, 0.1);
    const tube = new Sink().cylinder(0, -0.09, 0, 0.02, 1.2, 10).rotateZ(0, -0.09, Math.PI / 2);
    return [piece(tray.out(), M('tray')), piece(tube.out(), M('tubeGlass'), { smooth: true })];
  },
  /** Paving around the Delhi room and lab passage, never beneath their coplanar indoor floors. Placed at (4, 0, 2.6). */
  plazaFloor: () => {
    const s = new Sink();
    // World x0, x1, z0, z1: the open plaza, its east side, the gaps beside the lab passage, and the west pavement.
    for (const [x0, x1, z0, z1] of [[-4.14, 10.2, -37.4, 0], [0.7, 10.2, 0, 2.6], [2, 10.2, 2.6, 4.6], [-4.14, 0.8, 3.6, 4.6], [0.7, 0.8, 2.6, 3.6], [-8, -4.14, -37.4, -3.9]])
      s.quad([x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0]);
    s.translate(-4, 0, -2.6);
    return [piece(s.out(), M('pavers'), { metres: 'xz' })];
  },
  /**
   * The outside of the rooms, as the plaza sees them: the apartment's east side in brick with the passage to the
   * lab, the lab's block in dark render with the passage out, and the 2020 room's block in front of the brick with
   * its door on the plaza. Faces outward; from inside the rooms they sit behind the walls. World coordinates,
   * placed at the origin.
   */
  facade: () => {
    const brick = new Sink(), dark = new Sink(), t = 0.06, H = 14;
    // the apartment's east face just behind the studio's wall and the jet bridge's end (x -4.2), z -3.5..8.0, round the passage east (z 6.0..7.2);
    // the brick door is walled up: the ring leaves through the flight now
    for (const [z0, z1, y0] of [[-3.5, 6.0, 0], [7.2, 8.0, 0], [6.0, 7.2, 2.4]] as Array<[number, number, number]>)
      brick.box(-4.205 - t / 2, (y0 + H) / 2, (z0 + z1) / 2, t, H - y0, z1 - z0);
    dark.box(-6.82, H / 2, 8.0 + t / 2, 5.36, H, t); // the studio block's north face, x -9.5..-4.14
    dark.box(-9.5 - t / 2, H / 2, 2.25, t, H, 11.5); // its west face, z -3.5..8.0
    // the lab's block: x -4.14..2.25, z 4.6..9.9; its south face round the passage south (x 0.8..2.0)
    for (const [x0, x1, y0] of [[-4.14, 0.8, 0], [2.0, 2.25, 0], [0.8, 2.0, 2.4]] as Array<[number, number, number]>)
      dark.box((x0 + x1) / 2, (y0 + H) / 2, 4.6 - t / 2, x1 - x0, H - y0, t);
    dark.box(2.25 + t / 2, H / 2, 7.25, t, H, 5.3); // east
    dark.box(-0.945, H / 2, 9.9 + t / 2, 6.39, H, t); // north
    dark.box(-4.14 - t / 2, H / 2, 8.95, t, H, 1.9); // the west sliver north of the apartment block
    // the 2020 room's block: x -4.14..0.7, z 0..3.6, over the passage from the brick door too; its south face round the door (x -1.15..-0.25)
    for (const [x0, x1, y0] of [[-4.14, -1.15, 0], [-0.25, 0.7, 0], [-1.15, -0.25, 2.05]] as Array<[number, number, number]>)
      dark.box((x0 + x1) / 2, (y0 + H) / 2, -0.01 - t / 2, x1 - x0, H - y0, t);
    // A centimetre outside the interior shell: coplanar faces otherwise turn the room black from the plaza.
    dark.box(0.71 + t / 2, H / 2, 1.8, t, H, 3.6); // east
    dark.box(-1.72, H / 2, 3.61 + t / 2, 4.84, H, t); // north, facing the lab block across a metre
    dark.box(-3.6, H + t / 2, 3.2, 11.9, t, 13.4); // one roof over all
    return [piece(brick.out(), M('condoBrick')), piece(dark.out(), M('facadeDark'))];
  },
  /** The green counter under the sign, 3.6 × 0.9 × 0.6. */
  counter: () => [piece(new Sink().rbox(0, 0.45, 0, 3.6, 0.9, 0.6, 0.02, 2).out(), M('counter'), { smooth: true })],
  /** The Google sign: a painted 3.6 × 1.5 face on a white slab, facing +z. */
  sign: () => [piece(face(3.6, 1.5, 0.041), { paint: 'sign' }), piece(new Sink().rbox(0, 0, 0, 3.7, 1.6, 0.08, 0.02, 2).out(), M('board'), { smooth: true })],
  /** The trophy: a lathed cup on a disc, gold, 0.26 tall. */
  trophy: () => {
    const cup = new Sink().lathe([[0.02, 0], [0.06, 0.05], [0.05, 0.12], [0.09, 0.22], [0.1, 0.26]], 0, 0, 0, 1, 1, 0, 32);
    const base = new Sink().cylinder(0, 0.01, 0, 0.07, 0.02, 32);
    return [piece(cup.out(), M('gold'), { smooth: true }), piece(base.out(), M('gold'))];
  },
  /** A lanyard: two green cords from the collar to a white badge on the chest; facing +z. */
  lanyard: () => {
    const cord = new Sink().bone([-0.05, 0, 0], [-0.022, -0.28, 0.012], 0.006, 0.006).bone([0.05, 0, 0], [0.022, -0.28, 0.012], 0.006, 0.006);
    const badge = new Sink().box(0, -0.335, 0.008, 0.075, 0.1, 0.006);
    return [piece(cord.out(), M('lanyardGreen')), piece(badge.out(), M('badgeCard'))];
  },
  // ---- 2018, the Embarcadero in front of Google San Francisco
  /** The kerb between the sidewalk and the road, 40 m along x. */
  kerb: () => [piece(new Sink().rbox(0, 0.06, 0, 40, 0.12, 0.28, 0.02, 2).out(), M('kerb'), { smooth: true })],
  /** The road: 40 × 14 m of asphalt, a dashed centre line. */
  road: () => {
    const line = new Sink();
    for (let x = -19; x < 20; x += 3) line.box(x, 0.012, 7, 1.6, 0.01, 0.12);
    return [piece(new Sink().quad([-20, 0, 14], [20, 0, 14], [20, 0, 0], [-20, 0, 0]).out(), M('asphalt'), { metres: 'xz' }), piece(line.out(), M('kerb'))];
  },
  /** The planter the sign stands in: a concrete wall 0.9 high and 7 long, a hedge on top, the brown rail along its front edge. Along x, the face towards +z. */
  planter: () => {
    const wall = new Sink().rbox(0, 0.45, 0, 7, 0.9, 1.6, 0.03, 2);
    // a trimmed hedge: a block with a bumpy top
    const hedge = new Sink().box(0, 1.2, -0.1, 6.8, 0.6, 1.25);
    let seed = 7;
    const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
    for (let x = -3.3; x <= 3.3; x += 0.3) for (let z = -0.6; z <= 0.4; z += 0.33) hedge.sphere(x + (rnd() - 0.5) * 0.15, 1.44 + rnd() * 0.08, z + (rnd() - 0.5) * 0.1, 0.2, 0.14, 0.2, 14, 8);
    const rail = new Sink().bone([-3.6, 1.05, 0.9], [3.6, 1.05, 0.9], 0.03, 0.03);
    for (const x of [-3.2, -1.1, 1.1, 3.2]) rail.box(x, 0.98, 0.9, 0.04, 0.16, 0.04);
    return [piece(wall.out(), M('concrete'), { metres: 'xy', smooth: true }), piece(hedge.out(), M('hedge'), { smooth: true }), piece(rail.out(), M('rail'))];
  },
  /** A palm: a tapering trunk 7 m tall, a crown of twelve fronds. */
  palm: () => {
    const trunk = new Sink().lathe([[0.22, 0], [0.17, 2.5], [0.14, 5], [0.12, 7.1]], 0, 0, 0, 1, 1, 0.08, 20);
    const crown = new Sink();
    // each frond arcs up and then droops, in three tapering segments
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + (i % 2) * 0.15, r = 2.4 + (i % 3) * 0.5, drop = 0.7 + (i % 3) * 0.7;
      const c = Math.cos(a), sn = Math.sin(a);
      const p = [[0, 7.1, 0], [0.4 * r * c, 7.45 - 0.1 * drop, 0.4 * r * sn], [0.75 * r * c, 7.3 - 0.45 * drop, 0.75 * r * sn], [r * c, 6.9 - drop, r * sn]] as const;
      crown.bone([...p[0]], [...p[1]], 0.16, 0.05).bone([...p[1]], [...p[2]], 0.2, 0.04).bone([...p[2]], [...p[3]], 0.14, 0.02);
    }
    crown.sphere(0, 7, 0, 0.35, 0.3, 0.35, 12, 8);
    return [piece(trunk.out(), M('palmTrunk'), { smooth: true }), piece(crown.out(), M('frond'), { smooth: true })];
  },
  /** An Embarcadero lamp post: a fluted blue-green column 5.5 m tall with a globe. */
  lampPost: () => {
    const post = new Sink().lathe([[0.22, 0], [0.16, 0.4], [0.09, 0.5], [0.08, 4.6], [0.12, 4.8], [0.06, 5.1]], 0, 0, 0, 1, 1, 0, 24);
    const globe = new Sink().sphere(0, 5.45, 0, 0.32, 0.4, 0.32, 24, 14);
    return [piece(post.out(), M('lampPost'), { smooth: true }), piece(globe.out(), M('lampGlobe'), { smooth: true })];
  },
  carSilver: car('carSilver'),
  carRed: car('carRed'),
  carWhite: car('carWhite'),
  /** The piers across the Embarcadero: two long two-storey sheds, cream walls, dark windows on the -z face, a red roof. Along x. */
  piers: () => {
    const walls = new Sink(), roof = new Sink(), glass = new Sink();
    for (const [x0, len] of [[-30, 26], [4, 30]] as const) {
      walls.box(x0 + len / 2, 4, 0, len, 8, 14);
      roof.box(x0 + len / 2, 8.4, 0, len + 0.6, 0.8, 14.6);
      for (let x = x0 + 1.5; x < x0 + len - 1; x += 2.2) { glass.box(x, 2.2, -7.05, 1.2, 1.8, 0.05); glass.box(x, 5.8, -7.05, 1.2, 1.6, 0.05); }
    }
    return [piece(walls.out(), M('pier')), piece(roof.out(), M('pierRoof')), piece(glass.out(), M('pierGlass'))];
  },
  /** Clouds: a few flattened white puffs, far up and far off, unlit. */
  clouds: () => {
    const s = new Sink();
    let seed = 3;
    const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 9; i++) {
      const cx = (rnd() - 0.5) * 900, cz = -250 - rnd() * 400, cy = 140 + rnd() * 90, w = 40 + rnd() * 60;
      for (let k = 0; k < 4; k++) s.sphere(cx + (rnd() - 0.5) * w, cy + (rnd() - 0.5) * 8, cz + (rnd() - 0.5) * 20, w * (0.3 + rnd() * 0.3), 7 + rnd() * 6, w * 0.25, 16, 9);
    }
    return [piece(s.out(), M('cloud'), { smooth: true })];
  },
  /** The bay: 200 × 120 m of water, uv in metres for the ripple. */
  water: () => [piece(slab(200, 120), M('water'), { metres: 'xz' })],
  /** The Bay Bridge: two decks, two towers with braces, main cables, suspenders. Spans x, 300 m; placed at scale 3. */
  bridge: () => {
    const s = new Sink();
    const L = 150, TX = 48, TH = 44, DY = 12;
    s.box(0, DY, 0, 2 * L, 1.3, 6).box(0, DY - 3.2, 0, 2 * L, 1.0, 6);
    for (let x = -L + 2; x < L; x += 6) { s.box(x, DY - 1.6, 2.7, 0.3, 2.2, 0.3); s.box(x, DY - 1.6, -2.7, 0.3, 2.2, 0.3); }
    for (const tx of [-TX, TX]) {
      for (const leg of [-1, 1]) s.box(tx, TH / 2, leg * 2.4, 2.4, TH, 1.6);
      const hs = [DY + 6, DY + 16, DY + 26, TH - 3];
      for (const h of hs) s.box(tx, h, 0, 2.4, 2.6, 6.2);
      // X bracing between the legs, the steel lattice the towers read as from the street
      for (let i = 0; i < hs.length - 1; i++) { s.bone([tx, hs[i], -2.4], [tx, hs[i + 1], 2.4], 0.5, 0.5); s.bone([tx, hs[i], 2.4], [tx, hs[i + 1], -2.4], 0.5, 0.5); }
      s.bone([tx, 1, -2.4], [tx, DY + 6, 2.4], 0.5, 0.5); s.bone([tx, 1, 2.4], [tx, DY + 6, -2.4], 0.5, 0.5);
    }
    const N = 24, Mn = 8, r = 0.38;
    const mainY = (t: number) => TH - (TH - DY - 2) * (1 - (2 * t - 1) ** 2);
    const sideY = (t: number) => DY + 1.5 + (TH - DY - 1.5) * t * t;
    for (const side of [-1, 1]) {
      const cz = side * 2.4;
      for (let i = 0; i < N; i++) s.bone([-TX + (2 * TX * i) / N, mainY(i / N), cz], [-TX + (2 * TX * (i + 1)) / N, mainY((i + 1) / N), cz], r, r);
      for (let i = 0; i < Mn; i++) {
        s.bone([-L + ((L - TX) * i) / Mn, sideY(i / Mn), cz], [-L + ((L - TX) * (i + 1)) / Mn, sideY((i + 1) / Mn), cz], r, r);
        s.bone([L - ((L - TX) * i) / Mn, sideY(i / Mn), cz], [L - ((L - TX) * (i + 1)) / Mn, sideY((i + 1) / Mn), cz], r, r);
      }
      for (let i = 1; i < N; i += 2) s.bone([-TX + (2 * TX * i) / N, mainY(i / N), cz], [-TX + (2 * TX * i) / N, DY, cz], 0.12, 0.12);
      for (let i = 1; i < Mn; i += 2) {
        s.bone([-L + ((L - TX) * i) / Mn, sideY(i / Mn), cz], [-L + ((L - TX) * i) / Mn, DY, cz], 0.12, 0.12);
        s.bone([L - ((L - TX) * i) / Mn, sideY(i / Mn), cz], [L - ((L - TX) * i) / Mn, DY, cz], 0.12, 0.12);
      }
    }
    return [piece(s.out(), M('bridge'))];
  },
  /** Two sailboats: hull, mast, sail. */
  boats: () => {
    const hull = new Sink(), mast = new Sink(), sail = new Sink();
    for (const [x, z] of [[-28, -15], [40, -45]] as const) {
      hull.box(x, 0.4, z, 6, 0.9, 2.2);
      mast.cylinder(x, 4, z, 0.12, 7, 12);
      sail.bone([x + 0.2, 1, z], [x + 0.2, 7.4, z], 0.05, 2.2);
    }
    return [piece(hull.out(), M('hull')), piece(mast.out(), M('mast')), piece(sail.out(), M('sail'))];
  },
  // ---- 2020, the Delhi room: Webcube from a desk at home
  /** A wide laminate desk, 2.2 × 0.8, the top at 0.74: a panel leg on the left, three drawers on the right, a modesty panel behind. */
  deskWide: () => {
    const wood = new Sink().rbox(0, 0.725, 0, 2.2, 0.03, 0.8, 0.006, 2).rbox(-1.085, 0.355, 0, 0.03, 0.71, 0.76, 0.004, 1).rbox(0.85, 0.355, 0, 0.46, 0.71, 0.76, 0.004, 1).box(-0.12, 0.45, -0.385, 1.9, 0.5, 0.02);
    for (const y of [0.15, 0.38, 0.6]) wood.box(0.85, y, 0.385, 0.42, 0.2, 0.01);
    const pulls = new Sink();
    for (const y of [0.15, 0.38, 0.6]) pulls.box(0.85, y, 0.396, 0.12, 0.012, 0.012);
    return [piece(wood.out(), M('deskLaminate'), { smooth: true }), piece(pulls.out(), M('chrome'))];
  },
  /** A wall shelf: a 2.2 m plank, 0.24 deep, its top at the origin, on two steel brackets; the wall is at z -0.12. */
  wallShelf: () => {
    const plank = new Sink().rbox(0, -0.0125, 0, 2.2, 0.025, 0.24, 0.004, 1);
    const brackets = new Sink();
    for (const x of [-0.85, 0.85]) brackets.box(x, -0.04, 0.0, 0.03, 0.03, 0.22).box(x, -0.13, -0.105, 0.03, 0.2, 0.03);
    return [piece(plank.out(), M('deskLaminate'), { smooth: true }), piece(brackets.out(), M('bracket'))];
  },
  /**
   * A shelf of awards, ten of them in a row along x from -0.95 to 0.95, standing on the origin plane and facing +z:
   * gold cups on wooden bases, a silver cup, wooden plaques with brass plates, an acrylic wedge, a crystal obelisk,
   * a gold star on a stem, a medal on its ribbon, a framed certificate, a crystal globe. Different shapes and sizes.
   */
  awards: () => {
    const gold = new Sink(), silver = new Sink(), wood = new Sink(), plate = new Sink(), acrylic = new Sink(), chrome = new Sink(), ribbon = new Sink(), frame = new Sink(), paper = new Sink();
    const cup = (s: Sink, x: number, k: number) => {
      s.lathe([[0.02, 0], [0.035, 0.02], [0.02, 0.05], [0.028, 0.1], [0.06, 0.2], [0.065, 0.26]].map(([r, y]) => [r * k, y * k] as [number, number]), x, 0.02, 0, 1, 1, 0, 28);
      s.bone([x - 0.06 * k, 0.02 + 0.13 * k, 0], [x - 0.085 * k, 0.02 + 0.2 * k, 0], 0.006, 0.006).bone([x + 0.06 * k, 0.02 + 0.13 * k, 0], [x + 0.085 * k, 0.02 + 0.2 * k, 0], 0.006, 0.006);
      wood.cylinder(x, 0.01, 0, 0.055 * k, 0.02, 24);
    };
    cup(gold, -1.0, 1.15); // the tall one
    cup(silver, -0.38, 0.8);
    cup(gold, 0.7, 0.9);
    const plaque = (x: number, w: number, h: number) => {
      const start = wood.count;
      wood.box(x, h / 2, 0, w, h, 0.015).rotateX(0, 0, -0.12, start);
      const ps = plate.count;
      plate.box(x, h * 0.55, 0.009, w * 0.66, h * 0.36, 0.003).rotateX(0, 0, -0.12, ps);
    };
    plaque(-0.78, 0.2, 0.25);
    plaque(0.16, 0.16, 0.2);
    // an acrylic wedge on a base, a four-sided crystal obelisk, a crystal globe on a chrome ring
    acrylic.box(-0.57, 0.1, 0.01, 0.12, 0.16, 0.02).box(-0.57, 0.01, 0, 0.14, 0.02, 0.06);
    acrylic.lathe([[0.03, 0], [0.03, 0.02], [0.022, 0.28], [0.002, 0.32]], 0.34, 0, 0, 1, 1, 0, 4);
    acrylic.sphere(0.5, 0.05, 0, 0.04, 0.04, 0.04, 20, 12);
    chrome.cylinder(0.5, 0.005, 0, 0.03, 0.01, 20);
    // a gold star on a chrome stem
    const star: Array<[number, number]> = [];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 0.026 : 0.06; star.push([r * Math.cos(a), r * Math.sin(a)]); }
    const ss = gold.count;
    gold.extrude(star, 0, 0.012, undefined, gold).rotateX(0, 0, Math.PI / 2, ss).translate(-0.2, 0.19, 0, ss); // the cap faces +z: the front
    chrome.cylinder(-0.2, 0.075, 0, 0.005, 0.11, 10);
    wood.cylinder(-0.2, 0.01, 0, 0.04, 0.02, 20);
    // a medal leaning on the wall, its ribbon up behind it
    const ms = gold.count;
    gold.cylinder(-0.02, 0, 0, 0.035, 0.005, 24).rotateX(0, 0, Math.PI / 2 - 0.15, ms).translate(0, 0.04, -0.02, ms);
    ribbon.box(-0.02, 0.11, -0.05, 0.03, 0.14, 0.004);
    // a framed certificate leaning, paper in a black frame
    const fs = frame.count, ps2 = paper.count;
    frame.box(0.95, 0.07, -0.01, 0.17, 0.13, 0.012).rotateX(0, 0, -0.15, fs);
    paper.box(0.95, 0.07, -0.003, 0.15, 0.11, 0.002).rotateX(0, 0, -0.15, ps2);
    return [
      piece(gold.out(), M('gold'), { smooth: true }), piece(silver.out(), M('silver'), { smooth: true }), piece(wood.out(), M('plaqueWood')), piece(plate.out(), M('plaquePlate')),
      piece(acrylic.out(), M('acrylic'), { smooth: true }), piece(chrome.out(), M('chrome'), { smooth: true }), piece(ribbon.out(), M('ribbon')), piece(frame.out(), M('frameBlack')), piece(paper.out(), M('paper')),
    ];
  },
  /** Three cardboard boxes: two stacked, one open beside them with its flaps out. Footprint 1.1 × 0.5. */
  cartons: () => {
    const s = new Sink();
    s.rbox(-0.25, 0.2, 0, 0.5, 0.4, 0.4, 0.006, 1);
    const st = s.count;
    s.rbox(-0.22, 0.55, 0.02, 0.4, 0.3, 0.36, 0.006, 1).rotateY(-0.22, 0.02, 0.2, st);
    const ox = 0.32, w = 0.42, d = 0.38, h = 0.34;
    s.box(ox, 0.005, 0, w, 0.01, d).box(ox - w / 2, h / 2, 0, 0.01, h, d).box(ox + w / 2, h / 2, 0, 0.01, h, d).box(ox, h / 2, -d / 2, w, h, 0.01).box(ox, h / 2, d / 2, w, h, 0.01);
    const f1 = s.count;
    s.box(ox - w / 2 - 0.005, h + 0.1, 0, 0.01, 0.2, d).rotateAxis([ox - w / 2, h, 0], [0, 0, 1], 0.5, f1);
    const f2 = s.count;
    s.box(ox + w / 2 + 0.005, h + 0.1, 0, 0.01, 0.2, d).rotateAxis([ox + w / 2, h, 0], [0, 0, 1], -0.5, f2);
    return [piece(s.out(), M('cardboard'))];
  },
  /** A heap of clothes on the floor: a hoodie, a tee, jeans, a towel, flattened lumps in four colours, 0.9 across. */
  clothes: () => {
    const lumps: Array<[string, Sink]> = [];
    const lump = (mat: string, f: (s: Sink) => void) => { const s = new Sink(); f(s); lumps.push([mat, s]); };
    lump('cloth3', (s) => s.sphere(0, 0.06, 0, 0.32, 0.1, 0.24, 20, 10));
    lump('cloth0', (s) => { s.rbox(0.18, 0.11, -0.08, 0.42, 0.04, 0.34, 0.02, 2).rotateY(0.18, -0.08, 0.5); });
    lump('cloth1', (s) => { s.rbox(-0.2, 0.05, 0.16, 0.5, 0.07, 0.24, 0.03, 2).rotateY(-0.2, 0.16, -0.35); });
    lump('cloth2', (s) => s.sphere(-0.05, 0.15, 0.05, 0.18, 0.06, 0.14, 16, 8));
    return lumps.map(([m, s]) => piece(s.out(), M(m), { smooth: true }));
  },
  /** Papers: a stack and eight loose A4 sheets fanned round it, on the origin plane. */
  papers: () => {
    const s = new Sink();
    s.rbox(0, 0.012, 0, 0.21, 0.024, 0.297, 0.003, 1);
    for (let i = 0; i < 8; i++) {
      const a = (i * 2.4) % 6.28, r = 0.12 + (i % 3) * 0.06, x = r * Math.cos(a), z = r * Math.sin(a) * 0.7;
      const st = s.count;
      s.box(x, 0.003 + i * 0.0015, z, 0.21, 0.001, 0.297).rotateY(x, z, ((i * 37) % 90) * (Math.PI / 180), st);
    }
    return [piece(s.out(), M('paper'))];
  },
  /** One curtain drawn shut across a window: a 1.3 m pleated panel hanging 2.0 from a rod at the origin, the wall behind at z -0.06. */
  curtainDrawn: () => {
    const cloth = new Sink(), cols = 26, w = 1.3, h = 2.0;
    for (let c = 0; c < cols; c++) {
      const xa = -w / 2 + (w * c) / cols, xb = -w / 2 + (w * (c + 1)) / cols;
      const za = 0.035 * Math.sin(c * 1.9), zb = 0.035 * Math.sin((c + 1) * 1.9);
      cloth.quad([xa, -h, za], [xb, -h, zb], [xb, 0, zb], [xa, 0, za]);
    }
    const rod = new Sink().cylinder(0, 0.02, 0, 0.015, 1.5, 8).rotateZ(0, 0.02, Math.PI / 2);
    return [piece(cloth.out(), M('curtain'), { metres: 'xy' }), piece(rod.out(), M('rod'), { smooth: true })];
  },
  /** A waste bin, full: a black plastic tub with paper balls at the rim and one on the floor. */
  bin: () => {
    const tub = new Sink().lathe([[0.11, 0], [0.13, 0.28], [0.135, 0.3], [0.12, 0.3]], 0, 0, 0, 1, 1, 0, 24);
    const balls = new Sink().sphere(0.02, 0.32, 0.01, 0.04, 0.035, 0.04, 12, 8).sphere(-0.05, 0.3, -0.04, 0.035, 0.03, 0.035, 12, 8).sphere(0.04, 0.29, -0.06, 0.03, 0.03, 0.03, 12, 8).sphere(0.22, 0.03, 0.06, 0.035, 0.03, 0.035, 12, 8);
    return [piece(tub.out(), M('binPlastic'), { smooth: true }), piece(balls.out(), M('paper'), { smooth: true })];
  },
  /** Cables: three black leads sagging from the back of the desk top (y 0.72) to the floor behind it, 0.5 across. */
  cables: () => {
    const s = new Sink();
    for (const [x0, x1, sag] of [[-0.2, 0.1, 0.3], [0.0, 0.2, 0.42], [0.15, -0.05, 0.36]] as const) {
      const pts: V3[] = [];
      for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([x0 + (x1 - x0) * t, 0.72 * (1 - t) * (1 - t) + (0.72 - sag) * 2 * t * (1 - t), -0.05 - 0.12 * Math.sin(t * Math.PI)]); }
      for (let i = 0; i < 6; i++) s.bone(pts[i], pts[i + 1], 0.005, 0.005);
    }
    return [piece(s.out(), M('cable'))];
  },
};

export type { V3 };
