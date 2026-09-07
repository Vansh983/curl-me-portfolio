// Props that have no scan and are built here: furniture that carries a painted face, the cloth
// at the window, the passage between the room and the lab, and the far things on the bay that
// the fog softens anyway. Every part is a list of pieces, one per material, built at the origin
// (a Placement moves it). Materials come from materials.ts; uv is in metres, painted faces 0..1.
import { Sink, smoothNormals, flatNormals, type Geo, type V3 } from './rig.ts';
import { cityBlocks, cnTower } from './city.ts';
import { buildShell } from './shell.ts';

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

/** A quad facing +z of size w × h centred at the origin, uv 0..1 (a painted face). */
const face = (w: number, h: number, z = 0): Geo => new Sink().quad([-w / 2, -h / 2, z], [w / 2, -h / 2, z], [w / 2, h / 2, z], [-w / 2, h / 2, z], [[0, 0], [1, 0], [1, 1], [0, 1]]).out();

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

export const BUILT: Record<string, () => BuiltPart> = {
  // ---- now, Toronto
  /** The desk: a black slab 1.8 × 0.75 on two steel frames; the top is at 0.74. */
  desk: () => {
    const top = new Sink().rbox(0, 0.725, 0, 1.8, 0.03, 0.75, 0.008, 2);
    const legs = new Sink();
    for (const sx of [-0.8, 0.8]) legs.rbox(sx, 0.355, 0, 0.04, 0.71, 0.6, 0.006, 2).rbox(sx, 0.02, 0, 0.06, 0.04, 0.68, 0.008, 2);
    return [piece(top.out(), M('deskTop'), { smooth: true }), piece(legs.out(), M('deskLeg'), { smooth: true })];
  },
  /** A 27 inch monitor on a stand: 0.61 × 0.36 panel, the screen a painted face towards +z. */
  monitor: () => {
    const body = new Sink().rbox(0, 0.5, -0.015, 0.62, 0.37, 0.02, 0.005, 2);
    const stand = new Sink().rbox(0, 0.18, -0.06, 0.05, 0.36, 0.03, 0.006, 2).rbox(0, 0.006, -0.06, 0.26, 0.012, 0.18, 0.005, 2);
    return [piece(offsetGeo(face(0.59, 0.34, 0.001), 0, 0.5, 0), { paint: 'screenCode' }), piece(body.out(), M('bezel'), { smooth: true }), piece(stand.out(), M('aluminium'), { smooth: true })];
  },
  /** The second monitor, same body, the Floqer app on it. */
  monitorApp: () => {
    const body = new Sink().rbox(0, 0.5, -0.015, 0.62, 0.37, 0.02, 0.005, 2);
    const stand = new Sink().rbox(0, 0.18, -0.06, 0.05, 0.36, 0.03, 0.006, 2).rbox(0, 0.006, -0.06, 0.26, 0.012, 0.18, 0.005, 2);
    return [piece(offsetGeo(face(0.59, 0.34, 0.001), 0, 0.5, 0), { paint: 'screenFloqer' }), piece(body.out(), M('bezel'), { smooth: true }), piece(stand.out(), M('aluminium'), { smooth: true })];
  },
  /** A laptop, open at 105 degrees, a terminal on it; the hinge is at the origin, the base runs toward +z. */
  laptop: () => {
    const base = new Sink().rbox(0, 0.008, 0.11, 0.31, 0.016, 0.22, 0.006, 2);
    const keys = new Sink().box(0, 0.017, 0.07, 0.27, 0.003, 0.1).box(0, 0.017, 0.17, 0.1, 0.002, 0.06);
    const lid = new Sink().rbox(0, 0.105, -0.004, 0.31, 0.21, 0.008, 0.004, 2).rotateX(0, 0, -0.26);
    const screen = new Sink().quad([-0.145, 0.015, 0.001], [0.145, 0.015, 0.001], [0.145, 0.2, 0.001], [-0.145, 0.2, 0.001], [[0, 0], [1, 0], [1, 1], [0, 1]]).rotateX(0, 0, -0.26);
    return [piece(screen.out(), { paint: 'screenTerminal' }), piece(base.out(), M('aluminium'), { smooth: true }), piece(keys.out(), M('bezel')), piece(lid.out(), M('aluminium'), { smooth: true })];
  },
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
  /** The brick wall behind the desk: the condo's x+ wall faced in brick, 3 cm proud, leaving the door (z 1.15 to 2.05) open. Placed at the wall's x, z 0. */
  condoBrick: () => [piece(new Sink().box(-0.015, 1.4, -0.525, 0.03, 2.8, 3.35).box(-0.015, 1.4, 2.125, 0.03, 2.8, 0.15).box(-0.015, 2.425, 1.6, 0.03, 0.75, 0.9).out(), M('condoBrick'))],
  /** White skirting round the condo (x -8.4..-4.2, z -2.2..2.2), 10 cm, breaking for the door on the x+ wall at z 1.15..2.05 and the glass on z-. */
  condoSkirting: () => {
    const t = 0.016, h = 0.1;
    const s = new Sink();
    s.rbox(-8.4 + t / 2, h / 2, 0, t, h, 4.4, 0.004, 1); // x- wall
    s.rbox(-6.3, h / 2, 2.2 - t / 2, 4.2, h, t, 0.004, 1); // z+ wall
    s.rbox(-4.2 - 0.03 - t / 2, h / 2, -0.525, t, h, 3.35, 0.004, 1); // x+ wall, left of the door, in front of the brick
    return [piece(s.out(), M('skirting'), { smooth: true })];
  },
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
  /** The plaza: 70 × 80 m of pavers, x from the origin forward, z centred. */
  plazaFloor: () => [piece(new Sink().quad([0, 0, 40], [70, 0, 40], [70, 0, -40], [0, 0, -40]).out(), M('pavers'), { metres: 'xz' })],
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
};

export type { V3 };
