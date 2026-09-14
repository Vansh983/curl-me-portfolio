// Props that have no scan and are built here: furniture that carries a painted face, the cloth
// at the window, the passage between the room and the lab, and the far things on the bay that
// the fog softens anyway. Every part is a list of pieces, one per material, built at the origin
// (a Placement moves it). Materials come from materials.ts; uv is in metres, painted faces 0..1.
import { Sink, smoothNormals, flatNormals, type Geo, type V3 } from './rig.ts';
import { cityBlocks, cnTower, CITY, ringOf } from './city.ts';
import { northShore } from './northshore.ts';
import { HALIFAX, halifaxCity } from './halifax.ts';
import { dalhousieCampus, rng, treeBlob, obb, hipRoof } from './dalhousie.ts';
import { crossingZ } from './flight.ts';
import { buildShell } from './shell.ts';
import { AUDITORIUM, LECTURE_ROWS, TOP_ROW, DAIS, FLIGHT_DECK, TERRACE, STAGE, CABIN, FLOQER, GOOGLE } from './sets.ts';

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

/** The Android: two legs, the body, the head with its antennae, `h` tall, standing on (cx, 0, cz), facing +z; the eyes go into `eyes` when given. */
const droid = (s: Sink, h: number, cx = 0, cz = 0, eyes?: Sink): void => {
  const u = h / 2.2;
  for (const dx of [-0.25, 0.25]) s.capsule([cx + dx * u, 0.14 * u, cz], [cx + dx * u, 0.5 * u, cz], 0.14 * u, 10, 2);
  s.cylinder(cx, 0.82 * u, cz, 0.5 * u, 0.94 * u, 20); // the body, y 0.35..1.29
  s.sphere(cx, 1.36 * u, cz, 0.5 * u, 0.5 * u, 0.5 * u, 20, 7, undefined, 0.5); // the head, a hemisphere
  s.cylinder(cx, 1.355 * u, cz, 0.5 * u, 0.01 * u, 20); // its flat underside
  for (const dx of [-0.66, 0.66]) s.capsule([cx + dx * u, 1.22 * u, cz], [cx + dx * u, 0.62 * u, cz], 0.13 * u, 10, 2);
  for (const dx of [-0.22, 0.22]) s.bone([cx + dx * u, 1.78 * u, cz], [cx + dx * 1.8 * u, 2.16 * u, cz], 0.025 * u, 0.025 * u);
  for (const dx of [-0.2, 0.2]) (eyes ?? s).sphere(cx + dx * u, 1.6 * u, cz + 0.4 * u, 0.05 * u, 0.05 * u, 0.05 * u, 8, 4);
};

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

/** A room's six faces turned inward (a hall seen only from inside): invisible from outside, since faces are single-sided. */
function inward(sink: Sink, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, skipZ1 = false): void {
  sink.quad([x0, y0, z0], [x0, y0, z1], [x1, y0, z1], [x1, y0, z0]); // the floor faces up
  sink.quad([x0, y1, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1]); // the ceiling faces down
  if (!skipZ1) sink.quad([x0, y0, z1], [x0, y1, z1], [x1, y1, z1], [x1, y0, z1]); // the z1 wall faces -z
  sink.quad([x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z0]); // the z0 wall faces +z
  sink.quad([x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]); // the x0 wall faces +x
  sink.quad([x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [x1, y0, z0]); // the x1 wall faces -x
}

const hex3 = (c: number[]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(1, v)) ** (1 / 2.2) * 255).toString(16).padStart(2, '0')).join('');
/** A logo board: the painted face on a board in a thin frame, its face toward +z, centred at the origin. */
function logoBoard(frame: number, dark: boolean, w = 2.0, h = 1.2): BuiltPart {
  const board = new Sink().rbox(0, 0, -0.03, w + 0.08, h + 0.08, 0.05, 0.01, 2);
  return [piece(board.out(), M(dark ? 'logoBoardDark' : 'logoBoard'), { smooth: true }), piece(face(w, h, 0.0), { paint: `logo:${frame}` })];
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


/** The cabin's windows along z: one at every row and one between. */
let cabinSkinSink: Sink | null = null;
/** The fuselage skin as the last aircraftCabin build left it; built once if the skin is asked for first. */
const cabinSkin = (): Sink => { if (!cabinSkinSink) BUILT.aircraftCabin(); return cabinSkinSink as Sink; };
/** The E175's section: half-width from the aisle's centre at each height, the floor's edge to the crown. */
const CABIN_SECTION: Array<[number, number]> = [[1.15, 0], [1.32, 0.12], [1.37, 0.35], [1.37, 0.8], [1.35, 1.2], [1.3, 1.5], [1.2, 1.7], [1.0, 1.88], [0.72, 2.0], [0.4, 2.06], [0, 2.08]];


/** A corridor 3 by 1.2 by 2.4 along +x from the origin, walls and ceiling in one piece, a bulb at its middle; open at its near end, and at its far end when `through`. */
function corridor(through: boolean): BuiltPart {
  const sh = buildShell({
    x: [0, 3], z: [0, 1.2], h: 2.4, floor: 'passageFloor', wall: 'passageWall',
    openings: [{ wall: 'x-', at: 0.6, w: 1.2, h: 2.4 }, ...(through ? [{ wall: 'x+' as const, at: 0.6, w: 1.2, h: 2.4 }] : [])],
  });
  const wc = {
    pos: new Float32Array([...sh.walls.pos, ...sh.ceiling.pos]), nor: new Float32Array([...sh.walls.nor, ...sh.ceiling.nor]), uv: new Float32Array([...sh.walls.uv, ...sh.ceiling.uv]),
  };
  const bulb = new Sink().sphere(1.5, 2.2, 0.6, 0.04, 0.05, 0.04, 14, 8).out();
  const out: BuiltPart = [
    { ...sh.floor, surface: M('passageFloor') },
    { ...wc, surface: M('passageWall') },
    piece(bulb, M('bulb'), { smooth: true }),
  ];
  return out;
}

/**
 * A straight flight of `n` steps of `rise` and `run`, `w` wide, rising along +z from the origin (its foot), closed below
 * to the floor it stands on, each tread a board with a nosing; a closed string on each open side, a rail on square posts
 * along the sides asked for; a landing `land` long on from the top step.
 */
function flight(o: { n: number; rise: number; run: number; w: number; land: number; rails: 'left' | 'right' | 'both'; landRails?: 'left' | 'right' | 'both' | 'none'; tread: string; rail: string }): BuiltPart {
  const { n, rise, run, w, land } = o, carcass = new Sink(), treads = new Sink(), rail = new Sink(), post = new Sink();
  const top = n * rise, zTop = n * run, zEnd = zTop + land, t = 0.035, nose = 0.03;
  for (let k = 0; k < n; k++) {
    const y = (k + 1) * rise, z = k * run;
    carcass.box(0, (y - t) / 2, z + run / 2, w, y - t, run);
    treads.rbox(0, y - t / 2, z + run / 2 - nose / 2, w, t, run + nose, 0.006, 2);
  }
  if (land > 0) { carcass.box(0, top / 2, (zTop + zEnd) / 2, w, top, land); treads.rbox(0, top - t / 2, (zTop + zEnd) / 2 - nose / 2, w, t, land + nose, 0.006, 2); }
  const L = Math.hypot(zTop, top), slope = Math.atan2(top, zTop);
  const of = (r: string | undefined) => (r === 'both' ? [-1, 1] : r === 'left' ? [-1] : r === 'right' ? [1] : []);
  const sides = of(o.rails), landSides = of(o.landRails ?? o.rails);
  for (const side of sides) {
    const x = side * (w / 2 - 0.03), from = carcass.pos.length / 3;
    carcass.box(side * (w / 2 + 0.02), 0, 0, 0.04, 0.34, L + 0.3).rotateX(0, 0, -slope, from).translate(0, top / 2 + 0.12, zTop / 2, from); // the string
    for (let k = 0; k <= n; k += 2) post.box(x, k * rise + 0.45, k * run + 0.03, 0.03, 0.9, 0.03);
    const r0 = rail.pos.length / 3;
    rail.box(x, 0, 0, 0.04, 0.04, L).rotateX(0, 0, -slope, r0).translate(0, 0.92 + top / 2, zTop / 2, r0);
  }
  for (const side of land > 0 ? landSides : []) {
    const x = side * (w / 2 - 0.03);
    carcass.box(side * (w / 2 + 0.02), top / 2 + 0.06, (zTop + zEnd) / 2, 0.04, top + 0.12, land);
    post.box(x, top + 0.45, zEnd - 0.03, 0.03, 0.9, 0.03);
    rail.box(x, top + 0.92, (zTop + zEnd) / 2, 0.04, 0.04, land);
  }
  return [piece(carcass.out(), M(o.tread), { metres: 'xz' }), piece(treads.out(), M(o.tread), { smooth: true, metres: 'xz' }), piece(rail.out(), M(o.rail), { smooth: true }), piece(post.out(), M('chairBase'))];
}

export const BUILT: Record<string, () => BuiltPart> = {
  // ---- 2022: the crossing. Cabin in world coordinates; seats are local reusable assemblies.
  aircraftCabin: () => {
    const { cx, z: [z0, z1], windowZ, win, door } = CABIN, sec = CABIN_SECTION;
    cabinSkinSink = null; // rebuilt below, taken by aircraftSkin
    const panel = new Sink(), dado = new Sink(), floor = new Sink(), runner = new Sink(), lights = new Sink(), reveal = new Sink(), glass = new Sink();
    const X = (side: number, off: number) => cx + side * off;
    const halfAt = (y: number) => { for (let i = 0; i + 1 < sec.length; i++) { const [w0, y0] = sec[i], [w1, y1] = sec[i + 1]; if (y >= y0 && y <= y1) return w0 + ((w1 - w0) * (y - y0)) / (y1 - y0 || 1); } return 0; };
    // a strip of sidewall or crown between two heights over a length of the cabin, its face turned to the aisle
    const SKIN = 0.1; // the fuselage's skin outside the panels: the sun and the sky stay outside, and come in only through the windows
    const strip = (sink: Sink, side: number, ya: number, yb: number, za: number, zb: number, out = 0) => {
      const a: V3 = [X(side, halfAt(ya) + out), ya, za], b: V3 = [X(side, halfAt(ya) + out), ya, zb], c: V3 = [X(side, halfAt(yb) + out), yb, zb], d: V3 = [X(side, halfAt(yb) + out), yb, za];
      if ((side < 0) !== (out > 0)) sink.quad(a, d, c, b); else sink.quad(a, b, c, d);
    };
    const skin = (cabinSkinSink = new Sink()); // the fuselage skin: built here, returned by aircraftSkin (a context prop: in Blender for the shadow, never in the atlas)
    const bands: number[] = [z0, ...windowZ.slice().sort((p, q) => q - p).flatMap((z) => [z + win.slot, z - win.slot]).filter((z) => z > z0 && z < z1), z1].sort((p, q) => p - q);
    const isWindowBand = (za: number, zb: number) => windowZ.some((z) => Math.abs((za + zb) / 2 - z) < 0.01);
    for (let i = 0; i + 1 < bands.length; i++) {
      const za = bands[i], zb = bands[i + 1];
      if (zb - za < 1e-4) continue;
      for (const side of [-1, 1]) for (let k = 0; k + 1 < sec.length; k++) {
        const ya = sec[k][1], yb = sec[k + 1][1];
        if (isWindowBand(za, zb) && ya >= win.y0 - 1e-6 && yb <= win.y1 + 1e-6) continue; // the window's own band: the ring below
        strip(ya < 0.35 ? dado : panel, side, ya, yb, za, zb);
        strip(skin, side, ya, yb, za, zb, SKIN);
      }
    }
    // the windows: a rounded rectangle in the band, the wall round it as a ring, a reveal 0.07 deep, the pane at the back of it
    const hw = win.w / 2, hh = (win.y1 - win.y0) / 2, cy = (win.y0 + win.y1) / 2, N = 32;
    const onRound = (a: number) => { // the rounded rectangle's boundary along a ray from the centre
      const d = [Math.cos(a), Math.sin(a)]; let lo = 0, hi = 0.5;
      for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2, pz = d[0] * m, py = d[1] * m; const qz = Math.max(-(hw - win.r), Math.min(hw - win.r, pz)), qy = Math.max(-(hh - win.r), Math.min(hh - win.r, py)); if (Math.hypot(pz - qz, py - qy) < win.r) lo = m; else hi = m; }
      return [d[0] * (lo + hi) / 2, d[1] * (lo + hi) / 2];
    };
    const onSlot = (a: number) => { const c = Math.cos(a), sn = Math.sin(a); const t = Math.min(win.slot / Math.max(1e-9, Math.abs(c)), hh / Math.max(1e-9, Math.abs(sn))); return [c * t, sn * t]; };
    for (const side of [-1, 1]) for (const wz of windowZ) {
      const q4 = (sink: Sink, a: V3, b: V3, c: V3, d: V3) => side < 0 ? sink.quad(a, d, c, b) : sink.quad(a, b, c, d);
      // the slot's four corners join the angles, or the ring's chords would cut them and leave a gap at each
      const corner = Math.atan2(hh, win.slot);
      const angles = [...Array.from({ length: N }, (_, i) => (i / N) * Math.PI * 2), corner, Math.PI - corner, Math.PI + corner, Math.PI * 2 - corner].sort((p, q) => p - q);
      for (let i = 0; i < angles.length; i++) {
        const a0 = angles[i], a1 = angles[(i + 1) % angles.length];
        const r0 = onRound(a0), r1 = onRound(a1), s0 = onSlot(a0), s1 = onSlot(a1);
        const P = (zz: number, yy: number, depth: number): V3 => [X(side, halfAt(cy + yy) - depth), cy + yy, wz + zz];
        q4(panel, P(s0[0], s0[1], 0), P(s1[0], s1[1], 0), P(r1[0], r1[1], 0), P(r0[0], r0[1], 0)); // the ring
        q4(skin, P(r0[0], r0[1], -SKIN), P(r1[0], r1[1], -SKIN), P(s1[0], s1[1], -SKIN), P(s0[0], s0[1], -SKIN)); // the skin's ring outside, turned out
        q4(reveal, P(r0[0], r0[1], 0), P(r1[0], r1[1], 0), P(r1[0], r1[1], -SKIN), P(r0[0], r0[1], -SKIN)); // the reveal, out through the skin
        const g0: V3 = P(r0[0], r0[1], -0.09), g1: V3 = P(r1[0], r1[1], -0.09), gc: V3 = P(0, 0, -0.09);
        if (side < 0) glass.tri(gc, g1, g0); else glass.tri(gc, g0, g1); // the pane
      }
    }
    // the end walls: the bulkhead ahead, the rear wall with the door cut where the bridge meets it
    const cap = (zc: number, into: number, hole: [number, number, number] | null) => { // hole: x0, x1, top
      const ys = sec.map((k) => k[1]); if (hole) ys.push(hole[2]); ys.sort((p, q) => p - q);
      for (let k = 0; k + 1 < ys.length; k++) {
        const ya = ys[k], yb = ys[k + 1]; if (yb - ya < 1e-4) continue;
        const spans: Array<[number, number, number, number]> = hole && yb <= hole[2] + 1e-6 ? [[cx - halfAt(ya), cx - halfAt(yb), hole[0], hole[0]], [hole[1], hole[1], cx + halfAt(ya), cx + halfAt(yb)]] : [[cx - halfAt(ya), cx - halfAt(yb), cx + halfAt(ya), cx + halfAt(yb)]];
        for (const [la, lb, ra, rb] of spans) {
          const a: V3 = [la, ya, zc], b: V3 = [ra, ya, zc], c: V3 = [rb, yb, zc], d: V3 = [lb, yb, zc];
          if (into > 0) panel.quad(a, b, c, d); else panel.quad(a, d, c, b);
        }
      }
    };
    cap(z0, 1, null);
    cap(z1, -1, [cx - door.w / 2, cx + door.w / 2, door.h]);
    // the skin's ends and its belly: the bulkhead's outside, the rear wall's outside round the door, a plate under the floor
    const outerCap = (zc: number, into: number, hole: [number, number, number] | null) => {
      const ys = sec.map((k) => k[1]); if (hole) ys.push(hole[2]); ys.sort((p, q) => p - q);
      for (let k = 0; k + 1 < ys.length; k++) {
        const ya = ys[k], yb = ys[k + 1]; if (yb - ya < 1e-4) continue;
        const L = (y: number) => cx - halfAt(y) - SKIN, R = (y: number) => cx + halfAt(y) + SKIN;
        const spans: Array<[number, number, number, number]> = hole && yb <= hole[2] + 1e-6 ? [[L(ya), L(yb), hole[0], hole[0]], [hole[1], hole[1], R(ya), R(yb)]] : [[L(ya), L(yb), R(ya), R(yb)]];
        for (const [la, lb, ra, rb] of spans) { const a: V3 = [la, ya, zc], b: V3 = [ra, ya, zc], c: V3 = [rb, yb, zc], d: V3 = [lb, yb, zc]; if (into > 0) skin.quad(a, b, c, d); else skin.quad(a, d, c, b); }
      }
    };
    outerCap(z0 - SKIN, -1, null);
    outerCap(z1 + SKIN, 1, [cx - door.w / 2, cx + door.w / 2, door.h]);
    skin.quad([cx - sec[0][0] - SKIN, -0.02, z0 - SKIN], [cx + sec[0][0] + SKIN, -0.02, z0 - SKIN], [cx + sec[0][0] + SKIN, -0.02, z1 + SKIN], [cx - sec[0][0] - SKIN, -0.02, z1 + SKIN]);
    for (const side of [-1, 1]) { const a: V3 = [X(side, sec[0][0]), 0, z0 - SKIN], b: V3 = [X(side, sec[0][0] + SKIN), -0.02, z0 - SKIN], c: V3 = [X(side, sec[0][0] + SKIN), -0.02, z1 + SKIN], d: V3 = [X(side, sec[0][0]), 0, z1 + SKIN]; if (side < 0) skin.quad(a, b, c, d); else skin.quad(a, d, c, b); }
    // the floor and the aisle's runner
    const f0 = sec[0][0];
    floor.quad([cx - f0, 0, z1], [cx + f0, 0, z1], [cx + f0, 0, z0], [cx - f0, 0, z0]);
    runner.quad([cx - 0.27, 0.004, z1], [cx + 0.27, 0.004, z1], [cx + 0.27, 0.004, z0], [cx - 0.27, 0.004, z0]);
    // the ceiling's two strips: the cabin's only light, nothing else on the walls or the crown
    for (const side of [-1, 1]) lights.box(X(side, 0.58), 1.975, (z0 + z1) / 2, 0.12, 0.012, z1 - z0 - 0.2);
    return [piece(panel.out(), M('cabinPanel'), { smooth: true }), piece(dado.out(), M('cabinDado'), { smooth: true }), piece(floor.out(), M('cabinFloor'), { metres: 'xz' }), piece(runner.out(), M('cabinRunner'), { metres: 'xz' }),
      piece(lights.out(), M('cabinStrip')), piece(reveal.out(), M('skirting'), { smooth: true }), piece(glass.out(), M('cabinGlass'))];
  },
  /** The fuselage's skin round the cabin, with the window holes: what keeps the sun outside. In Blender for the shadow, not baked; lit live. */
  aircraftSkin: () => [piece(cabinSkin().out(), M('wingSkin'), { smooth: true })],
  /** An E175 seat, plain: dark blue leather over a light shell, the armrests, the legs, the belt on the cushion. The passenger faces -z; origin on the floor. */
  aircraftSeat: () => {
    const leather = new Sink().rbox(0, 0.45, 0, 0.44, 0.12, 0.46, 0.05, 4).rbox(0, 0.86, 0.2, 0.44, 0.72, 0.1, 0.05, 4).rbox(0, 1.3, 0.19, 0.4, 0.22, 0.11, 0.05, 4);
    const shell = new Sink().rbox(0, 0.9, 0.27, 0.46, 0.85, 0.04, 0.02, 2);
    const dark = new Sink().box(0, 0.02, 0.05, 0.4, 0.04, 0.08);
    for (const x of [-0.24, 0.24]) { dark.rbox(x, 0.66, 0.02, 0.05, 0.05, 0.42, 0.02, 3); dark.box(x, 0.58, 0.1, 0.03, 0.12, 0.05); }
    for (const x of [-0.15, 0.15]) dark.box(x, 0.2, 0.05, 0.04, 0.4, 0.06);
    const belt = new Sink().box(-0.11, 0.512, 0, 0.19, 0.008, 0.038).box(0.11, 0.512, 0, 0.19, 0.008, 0.038);
    const buckle = new Sink().rbox(0, 0.518, 0, 0.055, 0.012, 0.044, 0.004, 2);
    return [piece(leather.out(), M('seatLeather'), { smooth: true }), piece(shell.out(), M('cabinBin'), { smooth: true }), piece(dark.out(), M('chairBase'), { smooth: true }), piece(belt.out(), M('bezel')), piece(buckle.out(), M('chrome'), { smooth: true })];
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
      piece(lights.out(), M('cabinStrip'))];
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
  /** The water all round the headland for the terrace: 3 km square, under everything; the cliff stands in it. */
  harbourAround: () => [piece(new Sink().quad([1500, 0, 1500], [1500, 0, -1500], [-1500, 0, -1500], [-1500, 0, 1500]).out(), M('seaWater'), { metres: 'xz' })],
  /** Bennelong Point under the Opera House: a paved headland 250 by 210 m from 180 m off the window back to the painted shore, water in front of it, its quay edge in dark stone, top at y 0.3, the water at −0.6 round it. Origin at its east end's centre. */
  bennelongPoint: () => {
    const top = new Sink().box(-125, 0.15, 0, 250, 0.3, 210);
    const edge = new Sink().box(-125, -0.5, 0, 250.4, 1.3, 210.4);
    return [piece(top.out(), M('campusPaving'), { metres: 'xz' }), piece(edge.out(), M('quayStone'))];
  },
  // ---- 2025, the tour: booths and offices. An expo hall, an office, a conference floor, a coworking space
  /** A block of paved walk outdoors: 14 by 12 m of pavers along x from the origin, the far edge a low planter with hedge. */
  /**
   * The terrace along the harbour side of the hacker house, 30 m over the water: paving 6.2 m wide from the south
   * door's corner north for 45 m, a parapet along the edge, planters against the wall, and the cliff under it all
   * down to the water. World metres.
   */
  terrace: () => {
    const [x0, x1] = TERRACE.x, [z0, z1] = TERRACE.z, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const paving = new Sink().box(cx, -0.02, cz, x1 - x0, 0.08, z1 - z0).box((x0 - 1.4) / 2, -0.02, (z0 - 18.2) / 2, -1.4 - x0, 0.08, 2.8); // the walk and the leg along the south wall, its top 2 cm proud of the headland
    // along the water a glass balustrade on steel posts under a handrail (the harbour and the Opera House stay in the room's
    // window, which looks across this terrace); along the south leg a low parapet
    const wall = new Sink().rbox(x0 + 0.15, 0.08, cz, 0.3, 0.16, z1 - z0, 0.02, 2)
      .rbox((x0 - 1.4) / 2, 0.55, z0 + 0.15, -1.4 - x0, 1.1, 0.3, 0.02, 2).rbox((x0 - 1.4) / 2, 1.12, z0 + 0.15, -1.4 - x0 + 0.12, 0.06, 0.42, 0.015, 2);
    const rail = new Sink().box(x0 + 0.15, 1.12, cz, 0.06, 0.05, z1 - z0);
    for (let z = z0 + 0.3; z < z1; z += 2.0) rail.box(x0 + 0.15, 0.62, z, 0.05, 0.94, 0.05);
    const glass = new Sink().box(x0 + 0.15, 0.62, cz, 0.012, 0.9, z1 - z0);
    const cliff = new Sink().box(cx + 12, -16.05, cz + 3, x1 - x0 + 24, 32, z1 - z0 + 6); // the headland under the house and the terrace, its top 5 cm under the paving, down to the water
    const planter = new Sink(), hedge = new Sink();
    for (const z of [-14.0, -1.0, 6.0, 13.0, 20.0]) { planter.rbox(x1 - 0.5, 0.24, z, 0.7, 0.48, 1.6, 0.02, 2); hedge.rbox(x1 - 0.5, 0.75, z, 0.6, 0.55, 1.5, 0.12, 3); }
    return [piece(paving.out(), M('pavement'), { metres: 'xz' }), piece(wall.out(), M('concrete'), { smooth: true, metres: 'xz' }), piece(cliff.out(), M('quayStone'), { metres: 'xz' }),
      piece(planter.out(), M('concrete'), { metres: 'xy' }), piece(hedge.out(), M('hedge'), { smooth: true }), piece(rail.out(), M('handrail'), { smooth: true }), piece(glass.out(), M('cabinGlass'))];
  },
  /**
   * The house from the terrace: its west wall carried north of the room for 37 m, 3.2 m tall, with a window every 4.2 m
   * (recessed, dark glass), a parapet over it all, and the wing across the terrace's north end with the door in it.
   */
  terraceWall: () => {
    const [x0, x1] = TERRACE.x, z1 = TERRACE.z[1], H = 3.2, wall = new Sink(), glass = new Sink(), frame = new Sink();
    const zRoom = -13.2; // the room's north wall: the shell's own wall stands south of it
    wall.box(x1 + 0.25, H / 2, (zRoom + z1) / 2, 0.5, H, z1 - zRoom); // the west wall north of the room
    wall.box(-4.4, H + 0.17, (z1 - 18.2) / 2, 6.4, 0.35, z1 + 18.2 + 0.4); // the parapet slab over the house
    // the wing's face across the north end, a plate with the doorway cut through it: the wing behind is the stage's
    // (stageWing, its own walls); a solid block here would stand across the open door
    const dx = TERRACE.walkX;
    wall.box((x0 - 0.25 + dx - 0.6) / 2, H / 2, z1 + 0.1, dx - 0.6 - x0 + 0.25, H, 0.2).box((dx + 0.6 + x1 + 0.25) / 2, H / 2, z1 + 0.1, x1 + 0.25 - dx - 0.6, H, 0.2).box(dx, (2.1 + H) / 2, z1 + 0.1, 1.2, H - 2.1, 0.2);
    wall.box((x0 + x1) / 2, H + 0.17, z1 + 3.0, x1 - x0 + 0.9, 0.35, 6.4);
    for (let z = zRoom + 3.4; z < z1 - 2; z += 4.2) { // the windows: a reveal into the wall, the glass 0.2 m back
      glass.quad([x1 - 0.2, 0.9, z - 0.8], [x1 - 0.2, 0.9, z + 0.8], [x1 - 0.2, 2.3, z + 0.8], [x1 - 0.2, 2.3, z - 0.8]);
      frame.box(x1 - 0.1, 0.9, z, 0.2, 0.04, 1.64).box(x1 - 0.1, 2.3, z, 0.2, 0.04, 1.64).box(x1 - 0.1, 1.6, z - 0.8, 0.2, 1.44, 0.04).box(x1 - 0.1, 1.6, z + 0.8, 0.2, 1.44, 0.04);
    }
    // the door in the wing's face: an opening 1.2 by 2.1 at the walk, the leaf is a live prop
    frame.box(dx - 0.65, 1.05, z1 - 0.02, 0.1, 2.1, 0.12).box(dx + 0.65, 1.05, z1 - 0.02, 0.1, 2.1, 0.12).box(dx, 2.15, z1 - 0.02, 1.4, 0.1, 0.12);
    return [piece(wall.out(), M('terraceWall'), { metres: 'xy' }), piece(glass.out(), M('tvGlass')), piece(frame.out(), M('bezel'), { smooth: true })];
  },
  /**
   * The wing behind the terrace's door: a dark passage 3 m long and the four steps up to the stage's side. The door
   * opening is cut where the terrace wall's frame stands; the walk goes straight through and up.
   */
  stageWing: () => {
    const [z0, z1] = STAGE.wing, [x0, x1] = STAGE.x, H = 3.2, cx = (x0 + x1) / 2;
    const dark = new Sink(), floor = new Sink(), oak = new Sink();
    floor.box(cx, -0.01, (z0 + z1) / 2, x1 - x0, 0.02, z1 - z0);
    dark.box(x0 - 0.1, H / 2, (z0 + z1) / 2, 0.2, H, z1 - z0).box(x1 + 0.1, H / 2, (z0 + z1) / 2, 0.2, H, z1 - z0).box(cx, H, (z0 + z1) / 2, x1 - x0, 0.1, z1 - z0); // its walls and ceiling
    for (const [xa, xb] of [[x0, TERRACE.walkX - 0.6], [TERRACE.walkX + 0.6, x1]]) dark.box((xa + xb) / 2, H / 2, z0, xb - xa, H, 0.2); // the door's wall
    dark.box(TERRACE.walkX, (H + 2.1) / 2, z0, 1.2, H - 2.1, 0.2);
    for (let i = 0; i < 4; i++) oak.box(cx, (i + 1) * 0.125, z1 - 1.2 + i * 0.3 + 0.15, x1 - x0, (i + 1) * 0.25, 0.3); // the steps up to the stage
    return [piece(floor.out(), M('auditoriumCarpet'), { metres: 'xz' }), piece(dark.out(), M('condoCeiling')), piece(oak.out(), M('auditoriumOak'), { metres: 'xz' })];
  },
  /**
   * The hall: the stage a metre up along the west side, its back drapes black with a gold band, its wings, a proscenium
   * wall between it and the house; the house to the east under a dark ceiling, its floor stepping up toward the back
   * for the rows of the crowd. World metres.
   */
  stageHall: () => {
    const { x: [x0, x1], z: [z0, z1], height: S, hall: [h0, h1], hallZ: [hz0, hz1] } = STAGE;
    const H = 11, oak = new Sink(), dark = new Sink(), drape = new Sink(), gold = new Sink(), carpet = new Sink();
    oak.box((x0 + x1) / 2, S / 2, (z0 + z1) / 2, x1 - x0, S, z1 - z0); // the stage
    drape.box(x0 + 0.5, S + 4.6, (z0 + z1) / 2, 0.3, 9.2, z1 - z0); // the back drape
    gold.box(x0 + 0.54, S + 5.6, (z0 + z1) / 2, 0.24, 0.4, z1 - z0);
    const lane = TERRACE.walkX - 0.8; // the legs mask the back of the stage; the lane along its front, where the walk comes in from the wing, stays open
    for (const z of [z0 + 0.6, z1 - 0.6]) drape.box((x0 + lane) / 2, S + 4.3, z, lane - x0, 8.6, 0.6); // the wings' legs
    // the room round it all, its faces turned inward so nothing shows from the terrace outside: floor, ceiling, four walls
    inward(dark, x0 - 0.2, h1, 0, H, hz0 - 0.5, hz1 + 1.5, true); // the south wall on the door line: nothing of the room south of the terrace's end
    // the north wall, with the door out behind the stage: three faces round it, turned into the hall
    { const { x: dx, w: dw, h: dh, floor: df } = STAGE.door, zb = hz1 + 1.5, xa = x0 - 0.2;
      const q = (xx0: number, xx1: number, yy0: number, yy1: number) => dark.quad([xx0, yy0, zb], [xx0, yy1, zb], [xx1, yy1, zb], [xx1, yy0, zb]);
      q(xa, dx - dw / 2, 0, H); q(dx + dw / 2, h1, 0, H); q(dx - dw / 2, dx + dw / 2, 0, df); q(dx - dw / 2, dx + dw / 2, df + dh, H); }
    oak.box((x0 + x1) / 2, S / 2, (z1 + hz1 + 1.5) / 2, x1 - x0, S, hz1 + 1.5 - z1); // backstage: the stage's boards run on to the door
    // the proscenium: the wall at the stage's front edge with the opening over the stage, faced both ways
    for (const [za, zb] of [[hz0 - 0.5, z0], [z1, hz1 + 1.5]]) dark.box(x1, H / 2, (za + zb) / 2, 0.4, H, zb - za);
    dark.box(x1, (H + 8.6) / 2, (z0 + z1) / 2, 0.4, H - 8.6, z1 - z0);
    oak.box(x1, 4.3, z0 - 0.25, 0.6, 8.6, 0.5).box(x1, 4.3, z1 + 0.25, 0.6, 8.6, 0.5).box(x1, 8.85, (z0 + z1) / 2, 0.6, 0.5, z1 - z0 + 1);
    // the house: a raked floor in steps
    for (let k = 1; k <= 10; k++) { const xa = h0 + 5.4 + 2.7 * (k - 1), xb = Math.min(h1, xa + 2.7); carpet.box((xa + xb) / 2, (0.16 * k) / 2, (hz0 + hz1) / 2, xb - xa, 0.16 * k, hz1 - hz0); } // ten tiers of 0.16 to the back wall (houseFloorY in sets.ts)
    return [piece(oak.out(), M('stageOak'), { metres: 'xz' }), piece(dark.out(), M('condoCeiling')), piece(drape.out(), M('acousticPanel'), { metres: 'xy' }), piece(gold.out(), M('gold')), piece(carpet.out(), M('auditoriumCarpet'), { metres: 'xz' })];
  },
  /**
   * The crowd: rows of people on their feet in the house, painted (paint 'crowd', two frames for the waving), each row
   * a cut-out 24 m wide and 2.4 m tall on the raked floor, facing the stage; nine rows with the near ones lowest.
   */
  /**
   * The hall's outside as the terrace sees it: a plain block 11.3 m tall over the wing's footprint and the house beyond,
   * its south face on the door line with the doorway cut, so nothing of the inward-faced room shows over the parapet.
   * Every face turned out: from inside the hall each one is a back face and culled. Lives in the Halifax set, lit live.
   */
  hallShell: () => {
    const { x: [sx0], hall: [, h1], hallZ: [, hz1] } = STAGE, H = 11.3, zS = 23.89, zN = hz1 + 1.7, x0 = sx0 - 0.4, x1 = h1 + 0.2, dx = TERRACE.walkX;
    const wall = new Sink();
    wall.box((x0 + dx - 0.7) / 2, H / 2, zS, dx - 0.7 - x0, H, 0.1).box((dx + 0.7 + x1) / 2, H / 2, zS, x1 - dx - 0.7, H, 0.1).box(dx, (2.2 + H) / 2, zS, 1.4, H - 2.2, 0.1); // the south face round the doorway
    wall.box(x0 + 0.05, H / 2, (zS + zN) / 2, 0.1, H, zN - zS); // west
    wall.box(x1 - 0.05, H / 2, (zS + zN) / 2, 0.1, H, zN - zS); // east
    wall.box((x0 + x1) / 2, H - 0.05, (zS + zN) / 2, x1 - x0, 0.1, zN - zS); // the roof
    { const { x: dx, w: dw, h: dh, floor: df } = STAGE.door; // the north, round the door to the passage
      wall.box((x0 + dx - dw / 2) / 2, H / 2, zN - 0.05, dx - dw / 2 - x0, H, 0.1).box((dx + dw / 2 + x1) / 2, H / 2, zN - 0.05, x1 - dx - dw / 2, H, 0.1);
      wall.box(dx, df / 2, zN - 0.05, dw, df, 0.1).box(dx, (df + dh + H) / 2, zN - 0.05, dw, H - df - dh, 0.1); }
    return [piece(wall.out(), M('terraceWall'), { metres: 'xy' })];
  },
  /** The two whiteboards in the hacker house, 2.4 by 1.2 in aluminium frames, painted (`whiteboardFloqer`). Face +z. */
  whiteboardFloqerA: () => [piece(face(2.4, 1.2, 0.005), { paint: 'whiteboardFloqer:0' }), piece(frame(2.4, 1.2, 0.03, 0.01).out(), M('alu'))],
  whiteboardFloqerB: () => [piece(face(2.4, 1.2, 0.005), { paint: 'whiteboardFloqer:1' }), piece(frame(2.4, 1.2, 0.03, 0.01).out(), M('alu'))],
  /** The stair up the east wall of the hacker house: FLOQER.stair steps of rise and run along +z from the origin, its landing to the north wall, the rail on the open (west) side. */
  stairFlight: () => flight({ ...FLOQER.stair, land: FLOQER.z[1] - FLOQER.stair.z0 - FLOQER.stair.n * FLOQER.stair.run, rails: 'left', tread: 'stageOak', rail: 'rod' }),

  /** The reveal of the door between the hall and the house: two jambs and a lintel filling the 0.3 m between the two walls, from the hall's wall at the origin toward +z. */
  doorReveal: () => {
    const { w, h } = STAGE.door, d = 0.3, t = 0.06, s = new Sink();
    s.box(-w / 2 - t / 2, h / 2, d / 2, t, h, d).box(w / 2 + t / 2, h / 2, d / 2, t, h, d).box(0, h + t / 2, d / 2, w + 2 * t, t, d);
    return [piece(s.out(), M('passageWall'), { metres: 'xy' })];
  },
  /** Floqer's sign, 4 by 1.25, painted on clear (`floqer`): the orange mark and the word in white, for the brick. Faces +z. */
  floqerSign: () => [piece(face(4.0, 1.25, 0.012), { paint: 'floqer' })],
  /**
   * The brick panel on the house's north wall: the room's width by its height along x, 8 cm thick, standing on the floor,
   * centred on the room, with the door at the top of the stair cut out of it (FLOQER.door, its sill the stair's top).
   */
  brickWall: () => {
    const w = FLOQER.x[1] - FLOQER.x[0], h = FLOQER.h, t = 0.08, cx = (FLOQER.x[0] + FLOQER.x[1]) / 2;
    const d0 = FLOQER.door.x - FLOQER.door.w / 2 - cx, d1 = FLOQER.door.x + FLOQER.door.w / 2 - cx, sill = FLOQER.stair.n * FLOQER.stair.rise, head = sill + FLOQER.door.h;
    const s = new Sink();
    s.box((-w / 2 + d0) / 2, h / 2, 0, d0 + w / 2, h, t); // west of the door
    s.box((d1 + w / 2) / 2, h / 2, 0, w / 2 - d1, h, t); // east of it
    s.box((d0 + d1) / 2, sill / 2, 0, d1 - d0, sill, t); // under its sill
    s.box((d0 + d1) / 2, (head + h) / 2, 0, d1 - d0, h - head, t); // over its head
    return [piece(s.out(), M('condoBrick'), { metres: 'xy' })];
  },
  crowdRows: (): BuiltPart => {
    const { hall: [h0], hallZ: [hz0, hz1] } = STAGE, out: BuiltPart = [];
    for (let i = 0; i < 9; i++) {
      const x = h0 + 3.2 + i * 2.35, y = Math.floor(Math.max(0, (x - h0 - 5.4) / 2.7) + 1) * 0.18 * (x > h0 + 5.4 ? 1 : 0);
      const g = new Sink().quad([x, y, hz1 - 0.5], [x, y, hz0 + 0.5], [x, y + 2.4, hz0 + 0.5], [x, y + 2.4, hz1 - 0.5], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      out.push(piece(g.out(), { paint: `crowd:${i % 2}` }));
    }
    return out;
  },
  /** The North Shore mountains from real elevation data (northshore.ts), across the water from the terrace at 1:6. */
  northShore: () => { const t = new Sink(); northShore(t); return [piece(t.out(), M('terrain'), { tint: true, smooth: true })]; },
  /**
   * Downtown Toronto by day across the water: the real footprints and heights from OpenStreetMap (city.ts, the condo's
   * data) within 1.1 km of the CN Tower, pulled up in the day tile, the tower itself as the condo has it. The tower at
   * the origin; real north toward -x (away over the water), real east toward -z, so the skyline reads as from the lake.
   */
  torontoDay: () => {
    const [tx, tz] = CITY.cn, walls = new Sink(), tops = new Sink(), quay = new Sink();
    const Q = 3, box = [Infinity, Infinity, -Infinity, -Infinity]; // the quay's height over the water; the blocks' extent
    let seed = 31;
    const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
    const map = (x: number, z: number): [number, number] => [-(z - tz), x - tx]; // condo frame: x west, z north
    for (const b of CITY.buildings) {
      const ring = ringOf(b.p).map(([x, z]) => map(x, z));
      if (ring.length < 3) continue;
      const c = ring.reduce((a, q) => [a[0] + q[0] / ring.length, a[1] + q[1] / ring.length], [0, 0]);
      if (Math.hypot(c[0], c[1]) > 1100 || b.h < 12 || c[0] > -40) continue; // the tower's shore and north of it: nothing on the water side
      for (const [x, z] of ring) { box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], z); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], z); }
      const g = 0.62 + rnd() * 0.3, cool = rnd() < 0.6;
      walls.color(hex3(cool ? [g * 0.9, g * 0.95, g] : [g, g * 0.96, g * 0.9]));
      walls.extrude(ring, b.min + Q, b.h, { u0: rnd() * 4, v0: 0, perU: 96, perV: 70 }, tops);
    }
    // the land the city stands on: a quay 3 m over the water, its edge 40 m beyond the nearest block, the tower's foot on it
    quay.box((box[0] + box[2]) / 2, Q / 2, (box[1] + box[3]) / 2, box[2] - box[0] + 80 + 120, Q, box[3] - box[1] + 80);
    const cn = new Sink(), pod = new Sink(), light = new Sink();
    cnTower(cn, pod, light);
    for (const k of [cn, pod, light]) { k.translate(-tx, Q, -tz); }
    // the tower's own frame is the condo's: turn it the same way as the blocks (x_scene = -z, z_scene = x)
    for (const k of [cn, pod, light]) k.rotateY(0, 0, -Math.PI / 2);
    return [piece(quay.out(), M('concrete'), { metres: 'xz' }), piece(walls.out(), M('towerDay'), { tint: true }), piece(tops.out(), M('towerTopDay')), piece(cn.out(), M('cnShaftDay')), piece(pod.out(), M('cnPodDay')), piece(light.out(), M('cnLight'), { smooth: true })];
  },
  /**
   * Downtown Halifax across the harbour, as from Dartmouth: the real footprints and heights (halifax.json, the flight's
   * data) within 700 m of the Maritime Centre, walls in the facade tile, houses under hips. Real east toward +x (the
   * waterfront toward the viewer), real north toward -z.
   */
  halifaxDay: () => {
    const walls = new Sink(), roofs = new Sink(), quay = new Sink(), rnd = rng(23);
    const Q = 3, box = [Infinity, Infinity, -Infinity, -Infinity];
    const C: [number, number] = [1171, -223]; // the Maritime Centre in the aircraft's frame (heading 340)
    const a = [Math.sin((340 * Math.PI) / 180), Math.cos((340 * Math.PI) / 180)], r = [Math.cos((340 * Math.PI) / 180), -Math.sin((340 * Math.PI) / 180)];
    const map = (x: number, z: number): [number, number] => {
      const E = x * r[0] + -z * a[0], N = x * r[1] + -z * a[1];
      const E0 = C[0] * r[0] + -C[1] * a[0], N0 = C[0] * r[1] + -C[1] * a[1];
      return [E - E0, -(N - N0)];
    };
    for (const b of HALIFAX.buildings) {
      const raw = ringOf(b.p);
      if (raw.length < 3) continue;
      const c = raw.reduce((s2, q) => [s2[0] + q[0] / raw.length, s2[1] + q[1] / raw.length], [0, 0]);
      if (Math.hypot(c[0] - C[0], c[1] - C[1]) > 700) continue;
      const ring = raw.map(([x, z]) => map(x, z));
      for (const [x, z] of ring) { box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], z); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], z); }
      const g = 0.6 + rnd() * 0.3;
      walls.color(hex3(b.k === 2 ? [0.64, 0.6, 0.52] : [g, g * 0.97, g * 0.92]));
      const ob = b.k ? undefined : obb(ring);
      if (ob && b.h <= 9 && ob.fill > 0.74 && ob.d > 5 && ob.d < 22) { roofs.color(hex3([0.22, 0.19, 0.18])); walls.extrude(ring, Q, b.h - 2, { u0: rnd() * 4, v0: 0, perU: 96, perV: 70 }, roofs); hipRoof(roofs, ob, Q + b.h - 2, 0.62, 3.4, 0.35); }
      else { roofs.color(hex3([0.3, 0.3, 0.31])); walls.extrude(ring, Q, b.h, { u0: rnd() * 4, v0: 0, perU: 96, perV: 70 }, roofs); }
    }
    quay.box((box[0] + box[2]) / 2, Q / 2, (box[1] + box[3]) / 2, box[2] - box[0] + 80, Q, box[3] - box[1] + 80); // the land, a quay 3 m over the harbour
    return [piece(quay.out(), M('concrete'), { metres: 'xz' }), piece(walls.out(), M('towerDay'), { tint: true }), piece(roofs.out(), M('halifaxRoof'), { tint: true })];
  },
  /** The organisations' marks on boards, 2 by 1.2 m in a thin frame, the face toward +z: one builder a logo. */
  logoWebSummit: () => logoBoard(0, false),
  logoElevate: () => logoBoard(1, true),
  logoVolta: () => logoBoard(2, true),
  logoInvestNS: () => logoBoard(3, true),
  logoProductHunt: () => logoBoard(4, false),
  logoDalhousie: () => logoBoard(5, false, 5.0, 3.0),
  /**
   * Canada Place: the pier at its real size, 400 by 100 m and 12 m over the water, and the five white sails over the
   * cruise terminal along its length, masts 24 m over the deck. The long axis along x. Authored to the footprint.
   */
  canadaPlaceSails: () => {
    const pier = new Sink().box(0, 6, 0, 400, 12, 100), sail = new Sink(), mast = new Sink();
    for (let i = 0; i < 5; i++) {
      const cx = -86 + i * 43, h = 12;
      const base: V3[] = [[cx + 21, h, 32], [cx - 21, h, 32], [cx - 21, h, -32], [cx + 21, h, -32]];
      const mid: V3[] = base.map(([x, y, z]) => [cx + (x - cx) * 0.42, y + 13, z * 0.42]);
      const apex: V3 = [cx, h + 24, 0];
      for (let j = 0; j < 4; j++) { const a = base[j], b = base[(j + 1) % 4], c = mid[(j + 1) % 4], d = mid[j]; sail.quad(a, b, c, d).tri(d, c, apex).quad(d, c, b, a).tri(apex, c, d); }
      mast.cylinder(cx, h + 12.5, 0, 0.5, 25, 10);
    }
    return [piece(pier.out(), M('pier')), piece(sail.out(), M('sailWhite'), { smooth: true }), piece(mast.out(), M('aluminium'), { smooth: true })];
  },
  /**
   * The Angus L. Macdonald Bridge: a suspension bridge 1.3 km long across the harbour, its two towers 96 m tall and
   * 441 m apart, the deck 47 m over the water, the cables from the tower tops sagging to the deck at mid-span with
   * hangers every 15 m. Along x. Authored to its dimensions.
   */
  macdonaldBridge: () => {
    const steel = new Sink(), deck = new Sink(), cable = new Sink();
    const L = 1300, T = 96, D = 47, span = 441, tx = [-span / 2, span / 2];
    deck.box(0, D, 0, L, 3.2, 12).box(0, D + 2.2, 0, L, 0.06, 12.6); // the deck and its surface
    for (const x of tx) {
      for (const z of [-5, 5]) steel.box(x, T / 2, z, 4, T, 3);
      for (const y of [D + 6, D + 24, D + 42, T - 2]) steel.box(x, y, 0, 4.4, 2.2, 10);
      steel.box(x, D - 4, 0, 8, 8, 14); // the pier under the tower
    }
    for (const z of [-5.5, 5.5]) {
      for (let i = 0; i < 24; i++) { // the main cable from the anchorage over each tower to mid-span: a parabola in pieces
        const x0 = -L / 2 + (i * L) / 24, x1 = -L / 2 + ((i + 1) * L) / 24;
        cable.bone([x0, cableY(x0), z], [x1, cableY(x1), z], 0.45, 0.45);
      }
      for (let x = -L / 2 + 15; x < L / 2; x += 15) if (cableY(x) > D + 3) cable.box(x, (cableY(x) + D + 1.6) / 2, z, 0.16, cableY(x) - D - 1.6, 0.16);
    }
    function cableY(x: number): number {
      const a = Math.abs(x);
      if (a <= span / 2) return T - (T - D - 2) * (1 - (x / (span / 2)) ** 2); // sags to the deck at the middle
      return T - ((a - span / 2) / (L / 2 - span / 2)) * (T - D + 2); // down to the anchorages
    }
    return [piece(steel.out(), M('bridgeGreen')), piece(deck.out(), M('bridge')), piece(cable.out(), M('bridgeGreen'), { smooth: true })];
  },
  /** The degree in hand: a rolled parchment 30 cm long, 4 cm across, a black and gold ribbon round its middle; along +x. */
  degreeScroll: (): BuiltPart => [piece(new Sink().cylinder(0, 0, 0, 0.021, 0.3, 20).rotateZ(0, 0, Math.PI / 2).out(), M('parchment'), { smooth: true }),
    piece(new Sink().cylinder(0, 0, 0, 0.024, 0.03, 20).rotateZ(0, 0, Math.PI / 2).out(), M('ribbonGold'), { smooth: true }),
    piece(new Sink().cylinder(0.025, 0, 0, 0.0235, 0.02, 20).rotateZ(0, 0, Math.PI / 2).out(), M('ribbonBlack'), { smooth: true })],
  /** The CN Tower as the condo has it (city.ts), rebuilt at the origin: placed across the water on the tour, by day. */
  cnTowerFar: () => {
    const cn = new Sink(), pod = new Sink(), light = new Sink();
    cnTower(cn, pod, light);
    const [tx, tz] = CITY.cn;
    for (const k of [cn, pod, light]) k.translate(-tx, 0, -tz);
    return [piece(cn.out(), M('cnShaftDay')), piece(pod.out(), M('cnPodDay')), piece(light.out(), M('cnLight'), { smooth: true })];
  },
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
    return [piece(counter.out(), M('boothOff'), { smooth: true }), piece(back.out(), M('boothOff'), { smooth: true }), piece(offsetGeo(faceBack(2.3, 0.7, 0.0), 0, 0.55, -0.36), { paint: 'boothFront' }), piece(offsetGeo(faceBack(2.4, 2.2, 0.0), 0, 1.3, 0.85), { paint: 'boothBack' }), piece(stool.out(), M('bezel'), { smooth: true })];
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
  /** The bedroom's 19 inch LCD, the Xbox on it: the game on the glass. */
  bedroomMonitor: lcd('video'),
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
    // each a turned figure: a disc base, two legs, a waisted torso, arms at the sides, a head, the hair as its own lathe
    cast.forEach(([top, legs, hair, k], i) => {
      const x = -0.3 + i * 0.1, s = 0.13 * k, y0 = 0.01;
      at('figBase').cylinder(x, 0.005, 0, 0.034, 0.01, 20);
      for (const dx of [-1, 1]) at(legs).cylinder(x + dx * 0.018 * k, y0 + s * 0.22, 0, 0.013 * k, s * 0.44, 10);
      at(top).lathe([[0.024, 0], [0.034, 0.06], [0.04, 0.2], [0.036, 0.32], [0.022, 0.38]].map(([r, y]) => [r * k, y * s] as [number, number]), x, y0 + s * 0.42, 0, 1, 1, 0, 14);
      for (const dx of [-1, 1]) at('figSkin').cylinder(x + dx * 0.058 * k, y0 + s * 0.6, 0, 0.011 * k, s * 0.3, 8);
      at('figSkin').sphere(x, y0 + s * 0.9, 0, s * 0.1, s * 0.11, s * 0.095, 16, 12);
      if (hair) at(hair).lathe([[s * 0.115, 0], [s * 0.12, s * 0.06], [s * 0.05, s * 0.17], [s * 0.01, s * 0.24]], x, y0 + s * 0.9, 0, 1, 1, 0, 14);
    });
    return [...sinks.entries()].map(([m, k]) => piece(k.out(), M(m), { smooth: true }));
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
  /** The rug: 1.8 by 1.3 m, under the pouf in front of the television. */
  rug: () => [piece(new Sink().box(0, 0.006, 0, 1.8, 0.012, 1.3).out(), M('rug'), { metres: 'xz' })],
  /** Two curtain panels hanging from a rod at the origin, each 0.55 wide and 1.7 long, folded. */
  curtains: () => {
    const cloth = new Sink(), cols = 24, w = 0.55, h = 1.7;
    for (const side of [-1, 1]) {
      const x0 = side * 0.55 - (side > 0 ? 0 : w); // panels hang left and right of the window edge
      for (let c = 0; c < cols; c++) {
        const xa = x0 + (w * c) / cols, xb = x0 + (w * (c + 1)) / cols;
        const za = 0.06 * Math.sin(c * 1.31), zb = 0.06 * Math.sin((c + 1) * 1.31); // deep folds, gathered on the rod
        cloth.quad([xa, -h, za], [xb, -h, zb], [xb, 0, zb], [xa, 0, za]);
        cloth.quad([xa, -h, za - 0.012], [xa, -h, za], [xb, -h, zb], [xb, -h, zb - 0.012]); // the hem's thickness
      }
      for (let c = 0; c <= cols; c += 3) cloth.cylinder(x0 + (w * c) / cols, 0.02, 0, 0.022, 0.014, 12).rotateZ(x0 + (w * c) / cols, 0.02, Math.PI / 2, cloth.count - 0); // rings on the rod
    }
    const rod = new Sink().cylinder(0, 0.02, 0, 0.015, 1.9, 8).rotateZ(0, 0.02, Math.PI / 2);
    return [piece(cloth.out(), M('curtain'), { metres: 'xy' }), piece(rod.out(), M('rod'), { smooth: true })];
  },
  /** The view out of the window: a painted quad 2.6 × 2.0 facing +z, big enough to fill the window from anywhere on the dolly. */
  skyline: () => [piece(face(2.6, 2.0), { paint: 'window' })],
  /** A door frame in a 0.9 × 2.05 opening: two jambs and a head, 0.3 deep so the wall reads thick on the way through; the opening runs along z. */
  doorFrame: () => [piece(new Sink().box(-0.5, 1.025, 0, 0.1, 2.05, 0.3).box(0.5, 1.025, 0, 0.1, 2.05, 0.3).box(0, 2.1, 0, 1.1, 0.1, 0.3).out(), M('frameWood'))],
  /** The passage: 3 m long, 1.2 wide, 2.4 high, open at both ends, a bulb halfway. Built with its floor at the origin corner. */
  passage: () => corridor(true),
  /** The landing behind the door at the top of the house's stair: the same corridor, its far end closed, so the door opens onto it and not the sky. */
  landing: () => corridor(false),
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
  /** The Jobs print, 0.5 by 0.74, painted (`jobsPoster`), pressed to the front of the Poly Haven frame it hangs in. */
  jobsPrint: () => [piece(face(0.5, 0.74, 0.0115), { paint: 'jobsPoster' })],
  /**
   * The bedroom window, 1.2 by 1.3, sill at the origin, the room toward +z: an aluminium frame 6 cm wide through the wall,
   * two sliding sashes on their two tracks with the glass in each, the latch on the inner sash, the flat-bar safety grille
   * outside the way every Delhi window has one, and a marble sill standing proud into the room.
   */
  bedroomWindow: () => {
    const W = 1.2, H = 1.3, alu = new Sink(), glass = new Sink(), grille = new Sink(), sill = new Sink(), dark = new Sink();
    for (const [cx, cy, w, h] of [[0, H - 0.03, W, 0.06], [0, 0.03, W, 0.06], [-W / 2 + 0.03, H / 2, 0.06, H], [W / 2 - 0.03, H / 2, 0.06, H]] as const) alu.box(cx, cy, 0, w, h, 0.09);
    alu.box(0, 0.06, 0, W - 0.12, 0.012, 0.07).box(0, H - 0.06, 0, W - 0.12, 0.012, 0.07); // the tracks
    for (const [sx, sz] of [[-0.3, 0.022], [0.3, -0.022]] as const) {
      const sw = 0.6, sh = H - 0.12;
      for (const [cx, cy, w, h] of [[sx, H - 0.06 - 0.018, sw, 0.036], [sx, 0.06 + 0.018, sw, 0.036], [sx - sw / 2 + 0.018, H / 2, 0.036, sh], [sx + sw / 2 - 0.018, H / 2, 0.036, sh]] as const) alu.box(cx, cy, sz, w, h, 0.028);
      glass.quad([sx - sw / 2 + 0.036, 0.096, sz], [sx + sw / 2 - 0.036, 0.096, sz], [sx + sw / 2 - 0.036, H - 0.096, sz], [sx - sw / 2 + 0.036, H - 0.096, sz]);
    }
    dark.rbox(-0.03, H / 2, 0.045, 0.018, 0.11, 0.016, 0.004, 2); // the latch
    for (let x = -W / 2 + 0.12; x < W / 2 - 0.06; x += 0.12) grille.box(x, H / 2, -0.085, 0.012, H - 0.06, 0.022); // the flat bars
    for (const y of [0.2, H / 2, H - 0.2]) grille.box(0, y, -0.085, W - 0.04, 0.022, 0.012); // the rails
    for (const [cx, cy, w, h] of [[-W / 2 + 0.02, H / 2, 0.025, H], [W / 2 - 0.02, H / 2, 0.025, H], [0, 0.02, W, 0.025], [0, H - 0.02, W, 0.025]] as const) grille.box(cx, cy, -0.085, w, h, 0.025); // its frame
    sill.box(0, -0.015, 0.07, W + 0.14, 0.03, 0.22);
    return [piece(alu.out(), M('aluminium'), { smooth: true }), piece(glass.out(), M('cabinGlass')), piece(grille.out(), M('chairBase')), piece(sill.out(), M('skirting'), { smooth: true }), piece(dark.out(), M('chairBase'), { smooth: true })];
  },
  /**
   * Across the lane from the bedroom window: the neighbour's house, three floors of plaster with a parapet and a black
   * water tank on the roof, its windows dark; the lane's ground three metres down (the bedroom is on the first floor).
   * World coordinates, west of the room.
   */
  neighbourHouse: () => {
    const wall = new Sink(), dark = new Sink(), frame = new Sink(), tank = new Sink(), ground = new Sink();
    wall.box(-23, 1.65, 5.5, 6, 9.7, 11).box(-23, 6.65, 5.5, 6.2, 0.3, 11.2); // the block and its parapet
    for (const z of [1.6, 4.1, 6.9, 9.4]) for (const y of [-1.9, 1.3, 4.3]) { dark.box(-19.97, y, z, 0.03, 1.2, 1.0); frame.box(-19.985, y, z, 0.03, 1.32, 1.12); frame.box(-19.9, y - 0.68, z, 0.2, 0.05, 1.2); } // dark windows in their frames, a sill under each
    tank.box(-22.2, 7.3, 3.0, 1.0, 1.0, 1.0).box(-22.2, 7.85, 3.0, 1.1, 0.1, 1.1);
    ground.quad([-40, -3.2, 25], [-9, -3.2, 25], [-9, -3.2, -10], [-40, -3.2, -10]);
    return [piece(wall.out(), M('terraceWall'), { metres: 'xy' }), piece(dark.out(), M('tvGlass')), piece(frame.out(), M('windowFrame')), piece(tank.out(), M('chairBase')), piece(ground.out(), M('concrete'), { metres: 'xz' })];
  },
  /** The team photo, 1.0 × 0.7, painted, in a wooden frame. */
  teamPhoto: () => [piece(face(1.0, 0.7, 0.005), { paint: 'poster:1' }), piece(frame(1.0, 0.7, 0.03, 0.01).out(), M('frameWood'))],
  /** A tube light: the tube in a tray, 1.2 m, along x, hanging below the origin. */
  tube: () => {
    const tray = new Sink().box(0, -0.03, 0, 1.3, 0.06, 0.1);
    const tube = new Sink().cylinder(0, -0.09, 0, 0.02, 1.2, 10).rotateZ(0, -0.09, Math.PI / 2);
    return [piece(tray.out(), M('tray')), piece(tube.out(), M('tubeGlass'), { smooth: true })];
  },
  // ---- 2019, Google: the Googleplex, the Android lawn and the boardroom (docs/rebuild/30-googleplex-options.md, layout A)
  /**
   * The outside of the rooms as the lawn sees them, world coordinates, y 0 to the roof (GOOGLE.top): the lab's block
   * (its south face round the passage's mouth, its east face), the passage's own sides and top, the 2020 room's block
   * (its east face round the bed's window, its north face), and the block over the boardroom (its east face over the
   * glass, the jog north of it, its south and west faces); dark panes in a band on the upper storey; one roof over all.
   * Cream render. A centimetre outside every interior shell: coplanar faces bake a room black.
   */
  facade: () => {
    const wall = new Sink(), pane = new Sink(), glass = new Sink(), t = 0.06, H = GOOGLE.top, R = GOOGLE.room, g = 0.01;
    const face = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => wall.box((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, x1 - x0, y1 - y0, z1 - z0);
    // the lab's block: x -4.14..2.25, z 4.6..9.9; the south face round the passage's mouth (x 0.8..2.0, 2.4 high), the east face
    face(-4.14, 0.8, 0, H, 4.6 - t, 4.6); face(2.0, 2.25, 0, H, 4.6 - t, 4.6); face(0.8, 2.0, 2.5, H, 4.6 - t, 4.6);
    face(2.25, 2.25 + t, 0, H, 4.6 - t, 9.9);
    // the passage's outside: its two sides and its top, 2.5 high
    face(2.0, 2.0 + t, 0, 2.5, 2.6, 4.6 - t); face(0.8 - t, 0.8, 0, 2.5, 2.6, 4.6 - t); face(0.8 - t, 2.0 + t, 2.44, 2.5, 2.6, 4.6 - t);
    // the 2020 room's block: x -4.14..0.7, z 0..3.6; its east face round the bed's window (z 0.9..2.1, sill 0.9, head 2.1), its north face, the jog to the boardroom's east wall
    face(0.7 + g, 0.7 + g + t, 0, 0.9, 0, 3.6); face(0.7 + g, 0.7 + g + t, 2.1, H, 0, 3.6); face(0.7 + g, 0.7 + g + t, 0.9, 2.1, 0, 0.9); face(0.7 + g, 0.7 + g + t, 0.9, 2.1, 2.1, 3.6);
    face(-4.14, 0.8 - t, 0, H, 3.6 + g, 3.6 + g + t);
    face(0.7 + g, R.x[1] + g + t, 0, H, R.z[1] + g, R.z[1] + g + t);
    // the block over the boardroom: the east face above the glass, the south face, the west face
    face(R.x[1] + g, R.x[1] + g + t, R.h, H, R.z[0] - g - t, R.z[1] + g + t);
    face(R.x[0] - g - t, R.x[1] + g + t, 0, H, R.z[0] - g - t, R.z[0] - g);
    // the west face round its three windows (sill 1.0, head 2.4, 1.6 wide at z -6.6, -4.0, -1.4), glass in them
    const W = [-6.6, -4.0, -1.4], xw0 = R.x[0] - g - t, xw1 = R.x[0] - g;
    face(xw0, xw1, 0, 1.0, R.z[0] - g, R.z[1] + g); face(xw0, xw1, 2.4, H, R.z[0] - g, R.z[1] + g);
    for (const [za, zb] of [[R.z[0] - g, W[0] - 0.8], [W[0] + 0.8, W[1] - 0.8], [W[1] + 0.8, W[2] - 0.8], [W[2] + 0.8, R.z[1] + g]] as Array<[number, number]>) face(xw0, xw1, 1.0, 2.4, za, zb);
    for (const z of W) glass.quad([xw1 - 0.02, 1.0, z - 0.8], [xw1 - 0.02, 1.0, z + 0.8], [xw1 - 0.02, 2.4, z + 0.8], [xw1 - 0.02, 2.4, z - 0.8]).quad([xw1 - 0.02, 1.0, z + 0.8], [xw1 - 0.02, 1.0, z - 0.8], [xw1 - 0.02, 2.4, z - 0.8], [xw1 - 0.02, 2.4, z + 0.8]);
    face(-4.14, 2.25 + t, H, H + 0.12, R.z[0] - g - t, 9.9); // the roof
    // the bed's window, dark glass in its reveal; the upper storey's band of panes on the faces the walk sees
    pane.box(0.7 + g + 0.008, 1.5, 1.5, 0.012, 1.2, 1.2);
    for (let z = R.z[0] + 0.7; z < R.z[1] - 0.6; z += 1.5) pane.box(R.x[1] + g + t + 0.006, 5.0, z, 0.012, 1.5, 1.1); // the boardroom's block, east
    for (let z = 0.6; z < 3.4; z += 1.5) pane.box(0.7 + g + t + 0.006, 5.0, z, 0.012, 1.5, 1.1); // the 2020 room's block, east
    for (let z = 5.2; z < 9.7; z += 1.5) pane.box(2.25 + t + 0.006, 5.0, z, 0.012, 1.5, 1.1); // the lab's block, east
    for (let x = R.x[0] + 0.6; x < R.x[1] - 0.5; x += 1.5) pane.box(x, 5.0, R.z[0] - g - t - 0.006, 1.1, 1.5, 0.012); // the boardroom's block, south
    for (let x = -3.6; x < 2.0; x += 1.5) pane.box(x, 5.0, 4.6 - t - 0.006, 1.1, 1.5, 0.012); // the lab's block, south, over the mouth
    return [piece(wall.out(), M('campusWall'), { metres: 'xy' }), piece(pane.out(), M('campusPane')), piece(glass.out(), M('cabinGlass'))];
  },
  /**
   * The boardroom's east wall in glass, world coordinates: bays GOOGLE.bay wide from the south end between steel
   * mullions under a head rail; the door's bay (GOOGLE.door) open in its frame, glass over the transom.
   */
  boardGlass: () => {
    const R = GOOGLE.room, x = R.x[1], D = GOOGLE.door, mull = new Sink(), glass = new Sink(), top = R.h - 0.1;
    const paneAt = (z0: number, z1: number, y0: number, y1: number) => glass.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]).quad([x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1]);
    mull.box(x, R.h - 0.05, (R.z[0] + R.z[1]) / 2, 0.1, 0.1, R.z[1] - R.z[0]); // the head
    mull.box(x, 0.03, (R.z[0] + R.z[1]) / 2, 0.1, 0.06, R.z[1] - R.z[0]); // the sill
    for (let z = R.z[0]; z < R.z[1] - 0.05; z += GOOGLE.bay) {
      const z1 = Math.min(z + GOOGLE.bay, R.z[1]);
      mull.box(x, R.h / 2, z, 0.08, R.h, 0.06);
      if (Math.abs((z + z1) / 2 - D.z) < 0.3) { // the door: its frame, the bay open to the head of the frame
        mull.box(x, 1.1, z + 0.05, 0.1, 2.2, 0.06).box(x, 1.1, z1 - 0.05, 0.1, 2.2, 0.06).box(x, 2.23, (z + z1) / 2, 0.1, 0.06, z1 - z);
        paneAt(z, z1, 2.26, top);
      } else paneAt(z, z1, 0.06, top);
    }
    mull.box(x, R.h / 2, R.z[1], 0.08, R.h, 0.06);
    return [piece(mull.out(), M('windowFrame')), piece(glass.out(), M('cabinGlass'))];
  },
  /** The boardroom's table: 1.4 by 4.4 along z, white laminate 4 cm thick at 0.74, on two pedestals. */
  boardTable: () => {
    const top = new Sink().rbox(0, 0.72, 0, 1.4, 0.04, 4.4, 0.01, 2), ped = new Sink();
    for (const z of [-1.4, 1.4]) ped.box(0, 0.35, z, 0.5, 0.7, 0.8).box(0, 0.02, z, 0.9, 0.04, 1.0);
    return [piece(top.out(), M('tableWhite'), { smooth: true }), piece(ped.out(), M('bezel'))];
  },
  /** His name card at the seat: a tent card 0.2 wide, 0.09 high, the front painted (`nameCard`) and leaning back 20 degrees; faces +z. */
  nameCard: () => {
    const a = Math.PI / 9, h = 0.09, d = h * Math.sin(a), y = h * Math.cos(a);
    const front = new Sink().quad([-0.1, 0, d], [0.1, 0, d], [0.1, y, 0], [-0.1, y, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const back = new Sink().quad([0.1, 0, -d], [-0.1, 0, -d], [-0.1, y, 0], [0.1, y, 0]);
    return [piece(front.out(), { paint: 'nameCard' }), piece(back.out(), M('badgeCard'))];
  },
  /** The lawn, world coordinates: grass east of the path to 61 m, west of the block, and south of it; never under a room's floor (CONTEXT: baked for the shadows, drawn live). */
  lawn: () => {
    const s = new Sink();
    for (const [x0, x1, z0, z1] of [[1.55, 61.55, -42, 14], [-40, -4.05, -42, 14], [-4.05, 1.55, -42, -8.05]] as Array<[number, number, number, number]>) s.quad([x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0]);
    return [piece(s.out(), M('lawn'), { metres: 'xz' })];
  },
  /** The concrete path down the block's face: 1.4 wide, 12.6 long along z, its middle at the origin. */
  lawnPath: () => [piece(slab(1.4, 12.6), M('pavement'), { metres: 'xz' })],
  /** The green Android of the lawn, 2.3 m tall, standing on the origin, facing +z. */
  bugdroid: () => { const s = new Sink(), e = new Sink(); droid(s, 2.3, 0, 0, e); return [piece(s.out(), M('android'), { smooth: true }), piece(e.out(), M('droidEye'), { smooth: true })]; },
  /** Cupcake: the fluted wrapper, the pink swirl, a cherry; a small Android beside it. */
  statueCupcake: () => {
    const wrap = new Sink().lathe([[0.5, 0], [0.62, 0.72], [0.0, 0.72]], 0, 0, 0, 1, 1, 0, 20);
    const swirl = new Sink().lathe([[0.0, 0.7], [0.66, 0.72], [0.58, 0.95], [0.44, 1.15], [0.26, 1.32], [0.0, 1.42]], 0, 0, 0, 1, 1, 0, 20).sphere(0, 1.5, 0, 0.11, 0.11, 0.11, 10, 6);
    const d = new Sink(), e = new Sink(); droid(d, 0.9, 0.95, 0.15, e);
    return [piece(wrap.out(), M('candyBlue')), piece(swirl.out(), M('candyPink'), { smooth: true }), piece(d.out(), M('android'), { smooth: true }), piece(e.out(), M('droidEye'), { smooth: true })];
  },
  /** Donut: a ring 1.7 m across lying on the lawn, pink frosting over its top half with sprinkles; an Android standing in its hole. */
  statueDonut: () => {
    const Rg = 0.85, r = 0.32, ring = (a0: number, a1: number): [number, number][] => Array.from({ length: 8 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / 7; return [Rg + r * Math.cos(a), r + r * Math.sin(a)]; });
    const dough = new Sink().lathe(ring(Math.PI, 2 * Math.PI), 0, 0, 0, 1, 1, 0, 24), frost = new Sink().lathe(ring(0, Math.PI), 0, 0.01, 0, 1.01, 1.01, 0, 24);
    const sprinkle = new Sink();
    for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2 + (i % 3) * 0.3, rr = Rg + (i % 5 - 2) * 0.09, start = sprinkle.count; sprinkle.box(rr * Math.cos(a), 2 * r + 0.02, rr * Math.sin(a), 0.11, 0.025, 0.03); sprinkle.rotateY(rr * Math.cos(a), rr * Math.sin(a), a * 1.7, start); }
    const d = new Sink(), e = new Sink(); droid(d, 1.4, 0, 0, e);
    return [piece(dough.out(), M('cookie'), { smooth: true }), piece(frost.out(), M('candyPink'), { smooth: true }), piece(sprinkle.out(), M('candyYellow')), piece(d.out(), M('android'), { smooth: true }), piece(e.out(), M('droidEye'), { smooth: true })];
  },
  /** Gingerbread: the flat cookie man 2.4 m tall on a disc, icing at his eyes, mouth, buttons, wrists and ankles. */
  statueGingerbread: () => {
    const c = new Sink(), ice = new Sink(), t = 0.16;
    c.sphere(0, 1.95, 0, 0.44, 0.44, t, 16, 8); // the head
    c.rbox(0, 1.1, 0, 0.9, 0.95, 2 * t, 0.12, 2); // the body
    for (const dx of [-1, 1]) { c.capsule([dx * 0.35, 1.45, 0], [dx * 0.95, 1.75, 0], t, 8, 2); c.capsule([dx * 0.22, 0.75, 0], [dx * 0.4, 0.2, 0], t, 8, 2); }
    c.cylinder(0, 0.03, 0, 0.9, 0.06, 24); // the disc he stands on
    for (const dx of [-0.15, 0.15]) ice.sphere(dx, 2.05, t - 0.02, 0.05, 0.05, 0.03, 8, 4);
    ice.bone([-0.16, 1.82, t - 0.01], [0.16, 1.82, t - 0.01], 0.02, 0.02);
    for (const y of [1.3, 1.05, 0.8]) ice.sphere(0, y, t - 0.02, 0.06, 0.06, 0.03, 8, 4);
    for (const dx of [-1, 1]) { ice.cylinder(dx * 0.86, 1.7, 0, t + 0.015, 0.06, 12); ice.cylinder(dx * 0.37, 0.3, 0, t + 0.015, 0.06, 12); }
    return [piece(c.out(), M('cookie'), { smooth: true }), piece(ice.out(), M('icing'), { smooth: true })];
  },
  /** Jelly Bean: the big red bean and a scatter of small ones; an Android beside them. */
  statueJellyBean: () => {
    const bean = new Sink().sphere(0, 0.6, 0, 0.95, 0.6, 0.6, 20, 10), small = new Sink();
    for (const [x, z, a] of [[-1.3, 0.5, 0.4], [1.2, 0.7, 1.9], [0.9, -0.9, 0.8], [-0.9, -0.9, 2.6]] as const) { const start = small.count; small.sphere(x, 0.18, z, 0.3, 0.18, 0.18, 10, 6); small.rotateY(x, z, a, start); }
    const d = new Sink(), e = new Sink(); droid(d, 1.6, 1.5, -0.2, e);
    return [piece(bean.out(), M('candyRed'), { smooth: true }), piece(small.out(), M('candyYellow'), { smooth: true }), piece(d.out(), M('android'), { smooth: true }), piece(e.out(), M('droidEye'), { smooth: true })];
  },
  /** KitKat: the Android in red, holding the wafer bar in front of him. */
  statueKitKat: () => {
    const d = new Sink(), e = new Sink(); droid(d, 2.0, 0, 0, e);
    const bar = new Sink().box(0, 1.0, 0.62, 1.1, 0.16, 0.24);
    for (const dx of [-0.41, -0.14, 0.14, 0.41]) bar.box(dx, 1.1, 0.62, 0.22, 0.06, 0.2);
    return [piece(d.out(), M('candyRed'), { smooth: true }), piece(e.out(), M('droidEye'), { smooth: true }), piece(bar.out(), M('chocolate'), { smooth: true })];
  },
  /** Lollipop: the Android with a lollipop as tall as himself leaning on his shoulder. */
  statueLollipop: () => {
    const d = new Sink(), e = new Sink(); droid(d, 2.0, 0, 0, e);
    const stick = new Sink().bone([0.5, 0.0, 0.3], [0.85, 1.9, 0.3], 0.035, 0.035);
    const disc = new Sink(); disc.cylinder(0.92, 2.3, 0.3, 0.5, 0.12, 24); disc.rotateX(2.3, 0.3, Math.PI / 2);
    const swirl = new Sink(); swirl.cylinder(0.92, 2.3, 0.3, 0.3, 0.13, 20); swirl.rotateX(2.3, 0.3, Math.PI / 2);
    return [piece(d.out(), M('android'), { smooth: true }), piece(e.out(), M('droidEye'), { smooth: true }), piece(stick.out(), M('icing')), piece(disc.out(), M('candyRed'), { smooth: true }), piece(swirl.out(), M('icing'), { smooth: true })];
  },
  /** Marshmallow: an Android standing on a marshmallow, a marshmallow on a stick in his hand. */
  statueMarshmallow: () => {
    const m = new Sink().lathe([[0.5, 0], [0.56, 0.08], [0.56, 0.68], [0.5, 0.76], [0.0, 0.76]], 0, 0, 0, 1, 1, 0, 20);
    const d = new Sink(), e = new Sink(); droid(d, 1.6, 0, 0, e); d.translate(0, 0.76, 0);
    const stick = new Sink().bone([0.52, 1.25, 0.1], [0.9, 2.15, 0.35], 0.02, 0.02);
    const mm = new Sink().cylinder(0.95, 2.28, 0.38, 0.14, 0.24, 12);
    return [piece(m.out(), M('icing'), { smooth: true }), piece(d.out(), M('android'), { smooth: true }), piece(e.out(), M('droidEye'), { smooth: true }), piece(stick.out(), M('treeTrunk')), piece(mm.out(), M('icing'), { smooth: true })];
  },
  /** Oreo: the two dark biscuits and the cream between, 1.6 m across; an Android standing on top. */
  statueOreo: () => {
    const b = new Sink().cylinder(0, 0.11, 0, 0.8, 0.22, 24).cylinder(0, 0.47, 0, 0.8, 0.22, 24), cream = new Sink().cylinder(0, 0.29, 0, 0.77, 0.14, 24);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; b.box(0.5 * Math.cos(a), 0.6, 0.5 * Math.sin(a), 0.08, 0.02, 0.08); }
    const d = new Sink(), e = new Sink(); droid(d, 1.5, 0, 0, e); d.translate(0, 0.58, 0);
    return [piece(b.out(), M('chocolate')), piece(cream.out(), M('icing')), piece(d.out(), M('android'), { smooth: true }), piece(e.out(), M('droidEye'), { smooth: true })];
  },
  /** Pie: a slice, crust and red filling under a lattice, the point toward +z; a small Android beside it. */
  statuePie: () => {
    const sector = (Rr: number, a0: number, a1: number): Array<[number, number]> => [[0, 0], ...Array.from({ length: 8 }, (_, i): [number, number] => { const a = a0 + ((a1 - a0) * i) / 7; return [Rr * Math.cos(a), Rr * Math.sin(a)]; })];
    const crust = new Sink(), fill = new Sink(), lat = new Sink();
    crust.extrude(sector(1.4, Math.PI / 2 - 0.5, Math.PI / 2 + 0.5), 0, 0.42, undefined, crust); // the point at the origin, the arc toward +z
    fill.extrude(sector(1.32, Math.PI / 2 - 0.46, Math.PI / 2 + 0.46), 0.3, 0.5, undefined, fill);
    for (let i = -2; i <= 2; i++) { lat.box(i * 0.24, 0.52, 0.75, 0.07, 0.05, 1.3); lat.box(0, 0.52, 0.45 + i * 0.24, 1.2, 0.05, 0.07); }
    const d = new Sink(), e = new Sink(); droid(d, 1.1, 1.2, 0.3, e);
    return [piece(crust.out(), M('wafer')), piece(fill.out(), M('candyRed')), piece(lat.out(), M('wafer')), piece(d.out(), M('android'), { smooth: true }), piece(e.out(), M('droidEye'), { smooth: true })];
  },
  /**
   * The Google letters on the lawn, 1.2 m tall, 24 cm deep, each in its colour, standing on low concrete blocks with the g's
   * tail reaching the ground between them; faces +z, 5 m wide about the origin.
   */
  googleLetters: () => {
    const T = 0.24, base = 0.45, blocks = new Sink(), out: Built[] = [];
    // an arc band in letter coordinates (x right, y up), from angle a0 to a1, outer R, inner r
    const band = (cx: number, cy: number, Rr: number, r: number, a0: number, a1: number, n = 20): Array<[number, number]> => {
      const pts: Array<[number, number]> = [];
      for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push([cx + Rr * Math.cos(a), cy + Rr * Math.sin(a)]); }
      for (let i = n; i >= 0; i--) { const a = a0 + ((a1 - a0) * i) / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
      return pts;
    };
    const rect = (x0: number, x1: number, y0: number, y1: number): Array<[number, number]> => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    const letter = (mat: string, ...polys: Array<Array<[number, number]>>) => {
      const s = new Sink();
      for (const p of polys) s.extrude(p.map(([x, y]): [number, number] => [x, -y]), 0, T, undefined, s); // built flat with the letter's up toward -z, the cap on top
      s.rotateX(0, 0, Math.PI / 2); // stood up: the cap faces +z
      out.push(piece(s.out(), M(mat)));
    };
    const y = base, X = -2.45, ring = (cx: number, cy: number, Rr: number, r: number) => [band(cx, cy, Rr, r, 0, Math.PI), band(cx, cy, Rr, r, Math.PI, 2 * Math.PI)];
    // G: the open ring, the bar into it from the right, the short stem under the bar
    letter('gBlue', band(X + 0.62, y + 0.6, 0.6, 0.38, 0.55, 2 * Math.PI - 0.55), rect(X + 0.62, X + 1.22, y + 0.49, y + 0.71), rect(X + 1.0, X + 1.22, y + 0.3, y + 0.71));
    letter('gRed', ...ring(X + 1.78, y + 0.42, 0.42, 0.21));
    letter('gYellow', ...ring(X + 2.72, y + 0.42, 0.42, 0.21));
    // g: the ring, the stem down its right, the tail curling under to the ground
    letter('gBlue', ...ring(X + 3.66, y + 0.42, 0.42, 0.21), rect(X + 3.87, X + 4.08, y - 0.12, y + 0.42), band(X + 3.73, y - 0.12, 0.35, 0.14, Math.PI, 2 * Math.PI));
    letter('gGreen', rect(X + 4.2, X + 4.42, y, y + 1.2));
    // e: the ring, the bar across, the lower right of the ring cut away
    letter('gRed', band(X + 4.98, y + 0.42, 0.42, 0.21, -0.35, 2 * Math.PI - 1.15), rect(X + 4.58, X + 5.4, y + 0.36, y + 0.52));
    for (const [x0, x1] of [[X - 0.02, X + 1.26], [X + 1.33, X + 2.23], [X + 2.27, X + 3.17], [X + 4.16, X + 4.46], [X + 4.53, X + 5.43]]) blocks.box((x0 + x1) / 2, base / 2, 0.12, x1 - x0, base, 0.5);
    return [piece(blocks.out(), M('plinth')), ...out];
  },
  /** A Google bike: the yellow frame, blue and green rims, the red basket; along z, the front at +z, on the origin. */
  gbike: () => {
    const frame = new Sink(), tyre = new Sink(), front = new Sink(), rear = new Sink(), black = new Sink(), basket = new Sink();
    const A: V3 = [0, 0.34, -0.55], F: V3 = [0, 0.34, 0.55], BB: V3 = [0, 0.3, -0.08], S: V3 = [0, 0.92, -0.25], Hd: V3 = [0, 0.9, 0.36];
    for (const [a, b] of [[A, BB], [BB, S], [S, A], [S, Hd], [BB, Hd], [Hd, F]] as Array<[V3, V3]>) frame.bone(a, b, 0.02, 0.02);
    for (const [z, rim] of [[-0.55, rear], [0.55, front]] as Array<[number, Sink]>) {
      let start = tyre.count; tyre.lathe(Array.from({ length: 7 }, (_, i): [number, number] => { const a = (i / 6) * Math.PI * 2; return [0.34 + 0.03 * Math.cos(a), 0.03 * Math.sin(a)]; }), 0, 0.34, z, 1, 1, 0, 18); tyre.rotateZ(0, 0.34, Math.PI / 2, start);
      start = rim.count; rim.cylinder(0, 0.34, z, 0.3, 0.02, 18); rim.rotateZ(0, 0.34, Math.PI / 2, start);
    }
    black.rbox(0, 0.97, -0.28, 0.12, 0.05, 0.26, 0.02, 2).box(0, 0.98, 0.4, 0.52, 0.03, 0.03).box(0, 0.94, 0.36, 0.03, 0.14, 0.03);
    basket.box(0, 0.74, 0.62, 0.36, 0.02, 0.3).box(-0.17, 0.86, 0.62, 0.02, 0.26, 0.3).box(0.17, 0.86, 0.62, 0.02, 0.26, 0.3).box(0, 0.86, 0.77, 0.36, 0.26, 0.02).box(0, 0.86, 0.47, 0.36, 0.26, 0.02);
    return [piece(frame.out(), M('bikeYellow')), piece(tyre.out(), M('tyre'), { smooth: true }), piece(front.out(), M('bikeBlue')), piece(rear.out(), M('bikeGreen')), piece(black.out(), M('bezel')), piece(basket.out(), M('bikeRed'))];
  },
  /** A bike rack: one steel hoop, 0.8 high, 0.7 long along z, on the origin. */
  bikeRack: () => [piece(new Sink().bone([0, 0, -0.35], [0, 0.77, -0.35], 0.025, 0.025).bone([0, 0, 0.35], [0, 0.77, 0.35], 0.025, 0.025).bone([0, 0.78, -0.37], [0, 0.78, 0.37], 0.025, 0.025).out(), M('handrail'))],
  /** The far blocks of the campus, world coordinates: two storeys, cream, a band of panes on the faces toward the lawn. */
  campusFar: () => {
    const wall = new Sink(), pane = new Sink(), H = 7.2;
    for (const [x0, x1, z0, z1] of [[8, 30, -24, -17], [20, 34, -8, 8], [-14, -6, -30, -22]] as Array<[number, number, number, number]>) {
      wall.box((x0 + x1) / 2, H / 2, (z0 + z1) / 2, x1 - x0, H, z1 - z0);
      for (let x = x0 + 0.8; x < x1 - 0.6; x += 1.6) pane.box(x, 5.0, z1 + 0.006, 1.1, 1.5, 0.012);
      for (let z = z0 + 0.8; z < z1 - 0.6; z += 1.6) pane.box(x0 - 0.006, 5.0, z, 0.012, 1.5, 1.1);
      pane.box((x0 + x1) / 2, 1.5, z1 + 0.006, x1 - x0 - 0.8, 2.2, 0.012); pane.box(x0 - 0.006, 1.5, (z0 + z1) / 2, 0.012, 2.2, z1 - z0 - 0.8); // the ground floor glazed along
    }
    return [piece(wall.out(), M('campusWall'), { metres: 'xy' }), piece(pane.out(), M('campusPane'))];
  },
  /** A redwood: the trunk and a conifer's tiers of canopy from 3 m up, 23 m tall, on the origin. */
  redwood: () => {
    const trunk = new Sink().cylinder(0, 1.8, 0, 0.42, 3.6, 8);
    const canopy = new Sink().lathe([[3.6, 3.0], [3.9, 3.6], [2.6, 8], [3.0, 8.4], [1.6, 13.5], [2.0, 14], [0.75, 19], [1.0, 19.4], [0, 23]], 0, 0, 0, 1, 1, 0, 10);
    return [piece(trunk.out(), M('treeTrunk')), piece(canopy.out(), M('conifer'))];
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
