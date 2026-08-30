// Props that have no scan and are built here: furniture that carries a painted face, the cloth
// at the window, the passage between the room and the lab, and the far things on the bay that
// the fog softens anyway. Every part is a list of pieces, one per material, built at the origin
// (a Placement moves it). Materials come from materials.ts; uv is in metres, painted faces 0..1.
import { Sink, smoothNormals, flatNormals, type Geo, type V3 } from './rig.ts';
import { buildShell } from './shell.ts';

export type BuiltSurface =
  | { mat: string } // a designed material from materials.ts
  | { paint: string }; // a canvas painted at runtime, 'name' or 'name:frame' (window, whiteboard, banner, poster:0, poster:1, sign)

export interface Built { pos: Float32Array; nor: Float32Array; uv: Float32Array; surface: BuiltSurface }
export type BuiltPart = Built[];

/** Sink geometry to a piece. `smooth` welds and averages normals under 62 degrees; `metres` sets uv from world metres (xz for floors, xy for hanging things). */
function piece(g: Geo, surface: BuiltSurface, o: { smooth?: boolean; metres?: 'xz' | 'xy' } = {}): Built {
  const nor = o.smooth ? smoothNormals(g.pos, 62) : flatNormals(g.pos);
  let uv = g.uv;
  if (o.metres) {
    uv = new Float32Array((g.pos.length / 3) * 2);
    for (let i = 0; i < g.pos.length / 3; i++) {
      uv[i * 2] = g.pos[i * 3];
      uv[i * 2 + 1] = o.metres === 'xz' ? g.pos[i * 3 + 2] : g.pos[i * 3 + 1];
    }
  }
  return { pos: g.pos, nor, uv, surface };
}

const M = (mat: string): BuiltSurface => ({ mat });

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

export const BUILT: Record<string, () => BuiltPart> = {
  // ---- now, Toronto
  /** The desk: a black slab 1.8 × 0.75 on two steel frames; the top is at 0.74. */
  desk: () => {
    const top = new Sink().box(0, 0.725, 0, 1.8, 0.03, 0.75);
    const legs = new Sink();
    for (const sx of [-0.8, 0.8]) legs.box(sx, 0.355, 0, 0.04, 0.71, 0.6).box(sx, 0.02, 0, 0.06, 0.04, 0.68);
    return [piece(top.out(), M('deskTop')), piece(legs.out(), M('deskLeg'))];
  },
  /** A 27 inch monitor on a stand: 0.61 × 0.36 panel, the screen a painted face towards +z. */
  monitor: () => {
    const body = new Sink().box(0, 0.5, -0.015, 0.62, 0.37, 0.02);
    const stand = new Sink().box(0, 0.18, -0.06, 0.05, 0.36, 0.03).box(0, 0.006, -0.06, 0.26, 0.012, 0.18);
    return [piece(offsetGeo(face(0.59, 0.34, 0.001), 0, 0.5, 0), { paint: 'screenCode' }), piece(body.out(), M('bezel')), piece(stand.out(), M('aluminium'))];
  },
  /** The second monitor, same body, the Floqer app on it. */
  monitorApp: () => {
    const body = new Sink().box(0, 0.5, -0.015, 0.62, 0.37, 0.02);
    const stand = new Sink().box(0, 0.18, -0.06, 0.05, 0.36, 0.03).box(0, 0.006, -0.06, 0.26, 0.012, 0.18);
    return [piece(offsetGeo(face(0.59, 0.34, 0.001), 0, 0.5, 0), { paint: 'screenFloqer' }), piece(body.out(), M('bezel')), piece(stand.out(), M('aluminium'))];
  },
  /** A laptop, open at 105 degrees, a terminal on it; the hinge is at the origin, the base runs toward +z. */
  laptop: () => {
    const base = new Sink().box(0, 0.008, 0.11, 0.31, 0.016, 0.22);
    const keys = new Sink().box(0, 0.017, 0.07, 0.27, 0.003, 0.1).box(0, 0.017, 0.17, 0.1, 0.002, 0.06);
    const lid = new Sink().box(0, 0.105, -0.004, 0.31, 0.21, 0.008).rotateX(0, 0, -0.26);
    const screen = new Sink().quad([-0.145, 0.015, 0.001], [0.145, 0.015, 0.001], [0.145, 0.2, 0.001], [-0.145, 0.2, 0.001], [[0, 0], [1, 0], [1, 1], [0, 1]]).rotateX(0, 0, -0.26);
    return [piece(screen.out(), { paint: 'screenTerminal' }), piece(base.out(), M('aluminium')), piece(keys.out(), M('bezel')), piece(lid.out(), M('aluminium'))];
  },
  /** A small PC tower under the desk, 0.2 × 0.38 × 0.36, a power light. */
  pcTower: () => [piece(new Sink().box(0, 0.19, 0, 0.2, 0.38, 0.36).out(), M('bezel')), piece(new Sink().box(0.06, 0.34, 0.181, 0.01, 0.01, 0.002).out(), M('powerLed'))],
  /** An office chair: a five-star base, a gas lift, a seat and a curved back; seat at 0.46. The back is toward -z. */
  officeChair: () => {
    const base = new Sink();
    for (let i = 0; i < 5; i++) { const start = base.count; base.box(0.16, 0.03, 0, 0.32, 0.03, 0.04).rotateY(0, 0, (i * Math.PI * 2) / 5, start); }
    base.cylinder(0, 0.24, 0, 0.025, 0.4, 8);
    const seat = new Sink().box(0, 0.45, 0.02, 0.48, 0.06, 0.48);
    const back = new Sink().box(0, 0.78, -0.24, 0.44, 0.56, 0.05);
    const arms = new Sink().box(-0.26, 0.62, 0, 0.04, 0.03, 0.3).box(0.26, 0.62, 0, 0.04, 0.03, 0.3).box(-0.26, 0.54, 0, 0.03, 0.14, 0.03).box(0.26, 0.54, 0, 0.03, 0.14, 0.03);
    return [piece(base.out(), M('chairBase')), piece(seat.out(), M('chairFabric')), piece(back.out(), M('chairFabric')), piece(arms.out(), M('chairBase'))];
  },
  /** A single bed along the window: a low oak frame, a mattress, a navy duvet turned back, a pillow. 2.0 along x, 0.95 along z. */
  bed: () => {
    const frame = new Sink().box(0, 0.12, 0, 2.02, 0.24, 0.97).box(-0.99, 0.45, 0, 0.04, 0.9, 0.97);
    const mattress = new Sink().box(0, 0.32, 0, 1.96, 0.18, 0.92);
    const duvet = new Sink().box(0.2, 0.44, 0, 1.5, 0.08, 0.94).box(0.2, 0.47, 0.05, 1.46, 0.02, 0.6);
    const pillow = new Sink().box(-0.72, 0.46, 0, 0.5, 0.1, 0.7);
    return [piece(frame.out(), M('bedFrame')), piece(mattress.out(), M('mattress'), { smooth: true }), piece(duvet.out(), M('duvet'), { smooth: true }), piece(pillow.out(), M('pillow'), { smooth: true })];
  },
  /** A grey rug under the desk, 2.4 × 1.8. */
  rugGrey: () => [piece(new Sink().box(0, 0.006, 0, 2.4, 0.012, 1.8).out(), M('rugGrey'), { metres: 'xz' })],
  /** The city out of the window: a painted 14 × 7 quad facing +z, hung well outside. */
  toronto: () => [piece(face(14, 7), { paint: 'toronto' })],
  /** The window's mullions: a thin frame across the opening, 5.0 × 2.0, at the wall. */
  mullions: () => {
    const s = new Sink().box(0, 0, 0, 5.02, 0.05, 0.06).box(0, 2.0, 0, 5.02, 0.05, 0.06);
    for (const x of [-2.5, -0.85, 0.85, 2.5]) s.box(x, 1.0, 0, 0.05, 2.0, 0.06);
    return [piece(s.out(), M('windowFrame'))];
  },
  /** Short dark hair for the base character: a cap that sits on the head bone, built around the origin of the head. */
  hair: () => [piece(new Sink().sphere(0, 0.045, -0.012, 0.115, 0.105, 0.12, 14, 8, undefined, 0.62).out(), M('hair'), { smooth: true })],
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
  /** The TV cabinet: a dark wood top on four legs, 1.1 × 0.62 × 0.5. */
  tvTable: () => {
    const s = new Sink().box(0, 0.6, 0, 1.1, 0.04, 0.5);
    for (const [x, z] of [[-0.5, -0.2], [0.5, -0.2], [-0.5, 0.2], [0.5, 0.2]]) s.box(x, 0.29, z, 0.05, 0.58, 0.05);
    return [piece(s.out(), M('tvWood'), { metres: 'xz' })];
  },
  /** A clean open shelf: two uprights, a back, five shelves, 1.2 wide, 1.9 tall, 0.32 deep, teak. */
  shelf: () => {
    const s = new Sink();
    s.box(-0.59, 0.95, 0, 0.02, 1.9, 0.32).box(0.59, 0.95, 0, 0.02, 1.9, 0.32).box(0, 0.95, -0.15, 1.2, 1.9, 0.02);
    for (let i = 0; i < 5; i++) s.box(0, 0.06 + i * 0.46, 0, 1.18, 0.02, 0.3);
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
  /** The passage: 3 m long, 1.2 wide, 2.4 high, open at both ends, a bulb halfway. Built with its floor at the origin corner. */
  passage: () => {
    const sh = buildShell({
      x: [0, 3], z: [0, 1.2], h: 2.4, floor: 'passageFloor', wall: 'passageWall',
      openings: [{ wall: 'x-', at: 0.6, w: 1.2, h: 2.4 }, { wall: 'x+', at: 0.6, w: 1.2, h: 2.4 }],
    });
    const wc = {
      pos: new Float32Array([...sh.walls.pos, ...sh.ceiling.pos]), nor: new Float32Array([...sh.walls.nor, ...sh.ceiling.nor]), uv: new Float32Array([...sh.walls.uv, ...sh.ceiling.uv]),
    };
    const bulb = new Sink().sphere(1.5, 2.2, 0.6, 0.04, 0.05, 0.04, 8, 6).out();
    return [
      { ...sh.floor, surface: M('passageFloor') },
      { ...wc, surface: M('passageWall') },
      piece(bulb, M('bulb'), { smooth: true }),
    ];
  },
  /** A beige keyboard: a slab and 6 rows of 15 keys. */
  keyboard: () => {
    const base = new Sink().box(0, 0.01, 0, 0.44, 0.02, 0.15);
    const keys = new Sink();
    for (let r = 0; r < 6; r++) for (let c = 0; c < 15; c++) keys.box(-0.2 + c * 0.0285, 0.025, -0.055 + r * 0.022, 0.018, 0.01, 0.018);
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
  counter: () => [piece(new Sink().box(0, 0.45, 0, 3.6, 0.9, 0.6).out(), M('counter'))],
  /** The Google sign: a painted 3.6 × 1.5 face on a white slab, facing +z. */
  sign: () => [piece(face(3.6, 1.5, 0.041), { paint: 'sign' }), piece(new Sink().box(0, 0, 0, 3.7, 1.6, 0.08).out(), M('board'))],
  /** The trophy: a lathed cup on a disc, gold, 0.26 tall. */
  trophy: () => {
    const cup = new Sink().lathe([[0.02, 0], [0.06, 0.05], [0.05, 0.12], [0.09, 0.22], [0.1, 0.26]], 0, 0, 0, 1, 1, 0, 16);
    const base = new Sink().cylinder(0, 0.01, 0, 0.07, 0.02, 16);
    return [piece(cup.out(), M('gold'), { smooth: true }), piece(base.out(), M('gold'))];
  },
  /** The bay: 200 × 120 m of water, uv in metres for the ripple. */
  water: () => [piece(slab(200, 120), M('water'), { metres: 'xz' })],
  /** The Golden Gate: deck, two towers with braces, main cables, suspenders. Spans x, 300 m. */
  bridge: () => {
    const s = new Sink();
    const L = 150, TX = 48, TH = 44, DY = 12;
    s.box(0, DY, 0, 2 * L, 1.3, 6);
    for (const tx of [-TX, TX]) {
      for (const leg of [-1, 1]) s.box(tx, TH / 2, leg * 2.4, 2.4, TH, 1.6);
      for (const h of [DY + 6, DY + 16, DY + 26, TH - 3]) s.box(tx, h, 0, 2.4, 2.6, 6.2);
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
      mast.cylinder(x, 4, z, 0.12, 7, 6);
      sail.bone([x + 0.2, 1, z], [x + 0.2, 7.4, z], 0.05, 2.2);
    }
    return [piece(hull.out(), M('hull')), piece(mast.out(), M('mast')), piece(sail.out(), M('sail'))];
  },
};

export type { V3 };
