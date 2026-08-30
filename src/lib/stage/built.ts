// Props that have no scan and are built here: furniture that carries a painted face, the cloth
// at the window, the passage between the room and the lab, and the far things on the bay that
// the fog softens anyway. Every part is a list of pieces, one per surface, built at the origin
// (a Placement moves it). Scanned surfaces get uv in metres over the tile, painted faces 0..1.
import { Sink, smoothNormals, flatNormals, type Geo, type V3 } from './rig.ts';
import { buildShell } from './shell.ts';

export type BuiltSurface =
  | { tex: string; tile: number } // a scanned set from the manifest
  | { paint: string } // a canvas painted at runtime, 'name' or 'name:frame' (window, whiteboard, banner, poster:0, poster:1, sign)
  | { color: string; rough: number; metal: number; emissive?: string; emissivePower?: number; ripple?: boolean };

export interface Built { pos: Float32Array; nor: Float32Array; uv: Float32Array; surface: BuiltSurface }
export type BuiltPart = Built[];

/** Sink geometry to a piece. `smooth` welds and averages normals under 62 degrees; `tileXZ` sets uv from x/z in metres over the tile. */
function piece(g: Geo, surface: BuiltSurface, o: { smooth?: boolean; tileXZ?: number; tileXY?: number } = {}): Built {
  const nor = o.smooth ? smoothNormals(g.pos, 62) : flatNormals(g.pos);
  let uv = g.uv;
  if (o.tileXZ || o.tileXY) {
    const t = (o.tileXZ ?? o.tileXY)!;
    uv = new Float32Array((g.pos.length / 3) * 2);
    for (let i = 0; i < g.pos.length / 3; i++) {
      uv[i * 2] = g.pos[i * 3] / t;
      uv[i * 2 + 1] = (o.tileXZ ? g.pos[i * 3 + 2] : g.pos[i * 3 + 1]) / t;
    }
  }
  return { pos: g.pos, nor, uv, surface };
}

const UNIT: [number, number, number, number] = [0, 0, 1, 1];

/** A quad facing +z of size w × h centred at the origin, uv 0..1 (a painted face). */
const face = (w: number, h: number, z = 0): Geo => new Sink().quad([-w / 2, -h / 2, z], [w / 2, -h / 2, z], [w / 2, h / 2, z], [-w / 2, h / 2, z], [[0, 0], [1, 0], [1, 1], [0, 1]]).out();

/** A flat rectangle in the xz plane at y, w along x and d along z, centred; uv comes from the tile. */
const slab = (w: number, d: number, y = 0): Geo => new Sink().quad([-w / 2, y, d / 2], [w / 2, y, d / 2], [w / 2, y, -d / 2], [-w / 2, y, -d / 2]).out();

const WOOD_DARK: BuiltSurface = { color: '#4A3223', rough: 0.7, metal: 0 };
const WHITE: BuiltSurface = { color: '#F4F4F2', rough: 0.5, metal: 0 };
const ALU: BuiltSurface = { color: '#C9CCD0', rough: 0.35, metal: 0.9 };

export const BUILT: Record<string, () => BuiltPart> = {
  /** The TV cabinet: a dark wood top on four legs, 1.1 × 0.62 × 0.5. */
  tvTable: () => {
    const s = new Sink().box(0, 0.6, 0, 1.1, 0.04, 0.5);
    for (const [x, z] of [[-0.5, -0.2], [0.5, -0.2], [-0.5, 0.2], [0.5, 0.2]]) s.box(x, 0.29, z, 0.05, 0.58, 0.05);
    return [piece(s.out(), WOOD_DARK)];
  },
  /** The rug: a 24-sided disc, r 1.3, carpet scan. */
  rug: () => {
    const s = new Sink(), n = 24;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2;
      s.tri([0, 0, 0], [1.3 * Math.cos(b), 0, 1.3 * Math.sin(b)], [1.3 * Math.cos(a), 0, 1.3 * Math.sin(a)]);
    }
    return [piece(s.out(), { tex: 'dirty_carpet', tile: 1.2 }, { tileXZ: 1.2 })];
  },
  /** Two curtain panels hanging from a rod at the origin, each 0.55 wide and 1.7 long, folded, cotton scan. */
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
    return [
      piece(cloth.out(), { tex: 'cotton_jersey', tile: 0.8 }, { tileXY: 0.8 }),
      piece(rod.out(), { color: '#8A6E4E', rough: 0.5, metal: 0.2 }, { smooth: true }),
    ];
  },
  /** The view out of the window: a painted quad 2.6 × 2.0 facing +z, big enough to fill the window from anywhere on the dolly. */
  skyline: () => [piece(face(2.6, 2.0), { paint: 'window' })],
  /** The passage: 3 m long, 1.2 wide, 2.4 high, open at both ends, a bulb halfway. Built with its floor at the origin corner. */
  passage: () => {
    const sh = buildShell({
      x: [0, 3], z: [0, 1.2], h: 2.4, floor: 'old_linoleum_flooring_01', wall: 'painted_plaster_wall', tile: { floor: 2, wall: 3 },
      openings: [{ wall: 'x-', at: 0.6, w: 1.2, h: 2.4 }, { wall: 'x+', at: 0.6, w: 1.2, h: 2.4 }],
    });
    const join = (a: typeof sh.walls, b: typeof sh.walls) => ({
      pos: new Float32Array([...a.pos, ...b.pos]), nor: new Float32Array([...a.nor, ...b.nor]), uv: new Float32Array([...a.uv, ...b.uv]),
    });
    const wc = join(sh.walls, sh.ceiling);
    const bulb = new Sink().sphere(1.5, 2.2, 0.6, 0.04, 0.05, 0.04, 8, 6).out();
    return [
      { ...sh.floor, surface: { tex: 'old_linoleum_flooring_01', tile: 2 } },
      { ...wc, surface: { tex: 'painted_plaster_wall', tile: 3 } },
      piece(bulb, { color: '#FFE6B0', rough: 0.4, metal: 0, emissive: '#FFC978', emissivePower: 6 }, { smooth: true }),
    ];
  },
  /** A beige keyboard: a slab and 6 rows of 15 keys. */
  keyboard: () => {
    const base = new Sink().box(0, 0.01, 0, 0.44, 0.02, 0.15);
    const keys = new Sink();
    for (let r = 0; r < 6; r++) for (let c = 0; c < 15; c++) keys.box(-0.2 + c * 0.0285, 0.025, -0.055 + r * 0.022, 0.018, 0.01, 0.018);
    return [piece(base.out(), { color: '#D9D3C4', rough: 0.55, metal: 0 }), piece(keys.out(), { color: '#EFEAE0', rough: 0.5, metal: 0 })];
  },
  /** The whiteboard: a painted 2.4 × 1.2 face in an aluminium frame, facing +z. */
  whiteboard: () => {
    const f = new Sink();
    f.box(0, 0.615, 0.01, 2.46, 0.03, 0.03).box(0, -0.615, 0.01, 2.46, 0.03, 0.03).box(-1.215, 0, 0.01, 0.03, 1.2, 0.03).box(1.215, 0, 0.01, 0.03, 1.2, 0.03);
    return [piece(face(2.4, 1.2, 0.005), { paint: 'whiteboard' }), piece(f.out(), ALU)];
  },
  /** The Converge Clan banner, 2.2 × 0.5, painted. */
  banner: () => [piece(face(2.2, 0.5, 0.01), { paint: 'banner' })],
  /** The Jobs poster, 1.2 × 0.67, painted (frame 0 of `poster`), in a thin black frame. */
  jobsPoster: () => {
    const f = new Sink();
    f.box(0, 0.345, 0.01, 1.24, 0.02, 0.02).box(0, -0.345, 0.01, 1.24, 0.02, 0.02).box(-0.61, 0, 0.01, 0.02, 0.67, 0.02).box(0.61, 0, 0.01, 0.02, 0.67, 0.02);
    return [piece(face(1.2, 0.67, 0.005), { paint: 'poster:0' }), piece(f.out(), { color: '#1A1A1A', rough: 0.5, metal: 0 })];
  },
  /** The team photo, 1.0 × 0.7, painted, in a wooden frame. */
  teamPhoto: () => {
    const f = new Sink();
    f.box(0, 0.365, 0.01, 1.06, 0.03, 0.03).box(0, -0.365, 0.01, 1.06, 0.03, 0.03).box(-0.515, 0, 0.01, 0.03, 0.7, 0.03).box(0.515, 0, 0.01, 0.03, 0.7, 0.03);
    return [piece(face(1.0, 0.7, 0.005), { paint: 'poster:1' }), piece(f.out(), { color: '#5C4033', rough: 0.6, metal: 0 })];
  },
  /** A tube light: the tube in a tray, 1.2 m, along x, hanging below the origin. */
  tube: () => {
    const tray = new Sink().box(0, -0.03, 0, 1.3, 0.06, 0.1);
    const tube = new Sink().cylinder(0, -0.09, 0, 0.02, 1.2, 10).rotateZ(0, -0.09, Math.PI / 2);
    return [
      piece(tray.out(), { color: '#DADDE0', rough: 0.4, metal: 0.6 }),
      piece(tube.out(), { color: '#F6FAFF', rough: 0.3, metal: 0, emissive: '#EAF2FF', emissivePower: 4 }, { smooth: true }),
    ];
  },
  /** The plaza: 70 × 80 m of concrete pavers, x from the origin forward, z centred. */
  plazaFloor: () => [piece(new Sink().quad([0, 0, 40], [70, 0, 40], [70, 0, -40], [0, 0, -40]).out(), { tex: 'concrete_pavement', tile: 2.5 }, { tileXZ: 2.5 })],
  /** The green counter under the sign, 3.6 × 0.9 × 0.6. */
  counter: () => [piece(new Sink().box(0, 0.45, 0, 3.6, 0.9, 0.6).out(), { color: '#1E6B3A', rough: 0.7, metal: 0 })],
  /** The Google sign: a painted 3.6 × 1.5 face on a white slab, facing +z. */
  sign: () => [piece(face(3.6, 1.5, 0.041), { paint: 'sign' }), piece(new Sink().box(0, 0, 0, 3.7, 1.6, 0.08).out(), WHITE)],
  /** The trophy: a lathed cup on a disc, gold, 0.26 tall. */
  trophy: () => {
    const cup = new Sink().lathe([[0.02, 0], [0.06, 0.05], [0.05, 0.12], [0.09, 0.22], [0.1, 0.26]], 0, 0, 0, 1, 1, 0, 16);
    const base = new Sink().cylinder(0, 0.01, 0, 0.07, 0.02, 16);
    return [piece(cup.out(), { color: '#D4AF37', rough: 0.34, metal: 1 }, { smooth: true }), piece(base.out(), { color: '#D4AF37', rough: 0.34, metal: 1 })];
  },
  /** The bay: 200 × 120 m of water, uv in metres over 8 for the ripple. */
  water: () => [piece(slab(200, 120), { color: '#3E6E8A', rough: 0.15, metal: 0, ripple: true }, { tileXZ: 8 })],
  /** The Golden Gate: deck, two towers with braces, main cables, suspenders. Spans x, 300 m. */
  bridge: () => {
    const k = 1, s = new Sink();
    const L = 150 * k, TX = 48 * k, TH = 44 * k, DY = 12 * k;
    s.box(0, DY, 0, 2 * L, 1.3 * k, 6 * k);
    for (const tx of [-TX, TX]) {
      for (const leg of [-1, 1]) s.box(tx, TH / 2, leg * 2.4 * k, 2.4 * k, TH, 1.6 * k);
      for (const h of [DY + 6 * k, DY + 16 * k, DY + 26 * k, TH - 3 * k]) s.box(tx, h, 0, 2.4 * k, 2.6 * k, 6.2 * k);
    }
    const N = 24, M = 8, r = 0.38 * k;
    const mainY = (t: number) => TH - (TH - DY - 2 * k) * (1 - (2 * t - 1) ** 2);
    const sideY = (t: number) => DY + 1.5 * k + (TH - DY - 1.5 * k) * t * t;
    for (const side of [-1, 1]) {
      const cz = side * 2.4 * k;
      for (let i = 0; i < N; i++) s.bone([-TX + (2 * TX * i) / N, mainY(i / N), cz], [-TX + (2 * TX * (i + 1)) / N, mainY((i + 1) / N), cz], r, r);
      for (let i = 0; i < M; i++) {
        s.bone([-L + ((L - TX) * i) / M, sideY(i / M), cz], [-L + ((L - TX) * (i + 1)) / M, sideY((i + 1) / M), cz], r, r);
        s.bone([L - ((L - TX) * i) / M, sideY(i / M), cz], [L - ((L - TX) * (i + 1)) / M, sideY((i + 1) / M), cz], r, r);
      }
      for (let i = 1; i < N; i += 2) s.bone([-TX + (2 * TX * i) / N, mainY(i / N), cz], [-TX + (2 * TX * i) / N, DY, cz], 0.12 * k, 0.12 * k);
      for (let i = 1; i < M; i += 2) {
        s.bone([-L + ((L - TX) * i) / M, sideY(i / M), cz], [-L + ((L - TX) * i) / M, DY, cz], 0.12 * k, 0.12 * k);
        s.bone([L - ((L - TX) * i) / M, sideY(i / M), cz], [L - ((L - TX) * i) / M, DY, cz], 0.12 * k, 0.12 * k);
      }
    }
    return [piece(s.out(), { color: '#C0392B', rough: 0.55, metal: 0.2 })];
  },
  /** Two sailboats: hull, mast, sail. */
  boats: () => {
    const hull = new Sink(), mast = new Sink(), sail = new Sink();
    for (const [x, z] of [[-28, -15], [40, -45]] as const) {
      hull.box(x, 0.4, z, 6, 0.9, 2.2);
      mast.cylinder(x, 4, z, 0.12, 7, 6);
      sail.bone([x + 0.2, 1, z], [x + 0.2, 7.4, z], 0.05, 2.2);
    }
    return [
      piece(hull.out(), { color: '#17282F', rough: 0.5, metal: 0 }),
      piece(mast.out(), { color: '#8B6B4A', rough: 0.6, metal: 0 }),
      piece(sail.out(), { color: '#F2EFE6', rough: 0.6, metal: 0 }),
    ];
  },
};

export type { V3 };
