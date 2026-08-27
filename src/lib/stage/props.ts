// Every prop is one rig with a fixed vertex count. A prop that exists in one chapter
// and not the next has params that shrink it to a point or sink it under the floor.
// Vertex colours give one mesh several colours; uv rects point painted detail at it.
import { Sink, type Geo, type UVRect } from './rig.ts';

const FULL: UVRect = [0, 0, 1, 1];

/** Room slabs are centred on x = 0 and z = zc (default 0). */
export const floor = (p: { w: number; d: number; zc?: number }): Geo => {
  const zc = p.zc ?? 0;
  return new Sink().quad([-p.w / 2, 0, zc + p.d / 2], [p.w / 2, 0, zc + p.d / 2], [p.w / 2, 0, zc - p.d / 2], [-p.w / 2, 0, zc - p.d / 2]).out();
};

/** Back, left and right walls, inward facing. The front (camera side) is open. */
export const walls = (p: { w: number; h: number; d: number; zc?: number }): Geo => {
  const zc = p.zc ?? 0;
  const x0 = -p.w / 2, x1 = p.w / 2, z0 = zc - p.d / 2, z1 = zc + p.d / 2, h = p.h;
  return new Sink()
    .quad([x0, 0, z0], [x1, 0, z0], [x1, h, z0], [x0, h, z0])
    .quad([x0, 0, z1], [x0, 0, z0], [x0, h, z0], [x0, h, z1])
    .quad([x1, 0, z0], [x1, 0, z1], [x1, h, z1], [x1, h, z0])
    .out();
};

export const ceiling = (p: { w: number; h: number; d: number; zc?: number }): Geo => {
  const zc = p.zc ?? 0;
  return new Sink().quad([-p.w / 2, p.h, zc - p.d / 2], [p.w / 2, p.h, zc - p.d / 2], [p.w / 2, p.h, zc + p.d / 2], [-p.w / 2, p.h, zc + p.d / 2]).out();
};

/** A thin slab on a wall (the whiteboard). w runs along x before yaw. */
export const panel = (p: { x: number; y: number; z: number; w: number; h: number; t: number; yaw: number }): Geo =>
  new Sink().box(0, 0, 0, p.w, p.h, p.t).rotateY(0, 0, p.yaw).translate(p.x, p.y, p.z).out();

/** Top slab on two side panels. y is the floor under it, h the height of the top surface. */
export const table = (p: { x: number; y: number; z: number; w: number; h: number; d: number; top: number }): Geo => {
  const legH = Math.max(0.001, p.h - p.top);
  return new Sink()
    .box(p.x, p.y + p.h - p.top / 2, p.z, p.w, p.top, p.d)
    .box(p.x - p.w / 2 + 0.03, p.y + legH / 2, p.z, 0.05, legH, p.d * 0.9)
    .box(p.x + p.w / 2 - 0.03, p.y + legH / 2, p.z, 0.05, legH, p.d * 0.9)
    .out();
};

/** TV or monitor body plus a stand under it. (x, y, z) is the body centre. */
export const screenBody = (p: { x: number; y: number; z: number; w: number; h: number; d: number; standW: number; standH: number; standD: number }): Geo =>
  new Sink()
    .box(p.x, p.y, p.z, p.w, p.h, p.d)
    .box(p.x, p.y - p.h / 2 - p.standH / 2, p.z, p.standW, p.standH, p.standD)
    .out();

/** One quad facing +z carrying a whole texture. (x, y, z) is its centre. */
export const face = (p: { x: number; y: number; z: number; w: number; h: number }): Geo =>
  new Sink().quad([p.x - p.w / 2, p.y - p.h / 2, p.z], [p.x + p.w / 2, p.y - p.h / 2, p.z], [p.x + p.w / 2, p.y + p.h / 2, p.z], [p.x - p.w / 2, p.y + p.h / 2, p.z], [[0, 0], [1, 0], [1, 1], [0, 1]]).out();

/** The rug: three rings of red, flat on the floor. */
export const rug = (p: { x: number; z: number; r: number; t: number }): Geo =>
  new Sink()
    .color('#8E3B46').cylinder(p.x, p.t / 2, p.z, p.r, p.t, 20)
    .color('#A84550').cylinder(p.x, p.t * 1.5, p.z, p.r * 0.8, p.t, 20)
    .color('#8E3B46').cylinder(p.x, p.t * 2.5, p.z, p.r * 0.5, p.t, 20)
    .out();

/** The lab chair. yOff sinks it under the floor when it is not there yet. */
export const chair = (p: { x: number; z: number; seatW: number; seatD: number; seatH: number; seatT: number; legR: number; backH: number; yOff: number }): Geo => {
  const s = new Sink();
  const legH = Math.max(0.001, p.seatH - p.seatT);
  const y = p.yOff;
  s.box(p.x, y + p.seatH - p.seatT / 2, p.z, p.seatW, p.seatT, p.seatD);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) s.box(p.x + sx * (p.seatW / 2 - p.legR), y + legH / 2, p.z + sz * (p.seatD / 2 - p.legR), p.legR * 2, legH, p.legR * 2);
  s.box(p.x, y + p.seatH + p.backH / 2, p.z + p.seatD / 2 - 0.02, p.seatW, p.backH, 0.04);
  return s.out();
};

/** Ceiling fan built at the origin hanging down: the mesh is positioned and spun at runtime. */
export const fan = (p: { rod: number; r: number; hub: number }): Geo => {
  const s = new Sink().cylinder(0, -p.rod / 2, 0, 0.02, p.rod, 8).cylinder(0, -p.rod - 0.03, 0, p.hub, 0.06, 8);
  for (let k = 0; k < 3; k++) {
    const start = s.count;
    s.box(p.r / 2 + p.hub * 0.5, -p.rod - 0.03, 0, p.r, 0.015, 0.12).rotateY(0, 0, (k * Math.PI * 2) / 3, start);
  }
  return s.out();
};

export const crate = (p: { x: number; y: number; z: number; w: number; h: number; d: number }): Geo => new Sink().box(p.x, p.y, p.z, p.w, p.h, p.d).out();

/** The football: a sphere whose texture carries the panels. */
export const ball = (p: { x: number; y: number; z: number; r: number }): Geo => new Sink().sphere(p.x, p.y, p.z, p.r, p.r, p.r, 12, 8, FULL).out();

export const BOOKS: Array<{ w: number; h: number; c: string; title: string }> = [
  { w: 0.036, h: 0.19, c: '#B33A2B', title: 'HARRY POTTER' },
  { w: 0.036, h: 0.2, c: '#2E6B3F', title: 'HARRY POTTER' },
  { w: 0.036, h: 0.195, c: '#3B4F8C', title: 'HARRY POTTER' },
  { w: 0.04, h: 0.21, c: '#C98A1E', title: 'HARRY POTTER' },
  { w: 0.044, h: 0.215, c: '#7A2E8C', title: 'HARRY POTTER' },
  { w: 0.04, h: 0.205, c: '#1F6E6E', title: 'HARRY POTTER' },
  { w: 0.04, h: 0.21, c: '#8C2B2B', title: 'HARRY POTTER' },
  { w: 0.036, h: 0.185, c: '#1D3557', title: 'PERCY JACKSON' },
  { w: 0.036, h: 0.185, c: '#2A6F97', title: 'PERCY JACKSON' },
  { w: 0.028, h: 0.165, c: '#E07A2F', title: 'FAMOUS FIVE' },
  { w: 0.028, h: 0.165, c: '#D94F3D', title: 'FAMOUS FIVE' },
  { w: 0.028, h: 0.165, c: '#E9A23B', title: 'FAMOUS FIVE' },
];
const BOOK_GAP = 0.004, BOOK_D = 0.16;
/** x of the left edge of book k, relative to the shelf's left end. */
const bookX = (k: number) => 0.03 + BOOKS.slice(0, k).reduce((a, b) => a + b.w + BOOK_GAP, 0);

/** The shelf: a board on two brackets, the twelve books, and the Xbox case leaning at the end. scale shrinks it toward (x, y, z). */
export const shelf = (p: { x: number; y: number; z: number; w: number; scale: number }): Geo => {
  const k = p.scale, x0 = p.x - (p.w / 2) * k;
  const s = new Sink().color('#8B6B4A').box(p.x, p.y, p.z, p.w * k, 0.03 * k, 0.24 * k);
  s.color('#6E5238').bone([x0 + 0.05 * k, p.y - 0.015 * k, p.z + 0.05 * k], [x0 + 0.05 * k, p.y - 0.12 * k, p.z - 0.1 * k], 0.01 * k, 0.01 * k);
  s.bone([x0 + (p.w - 0.05) * k, p.y - 0.015 * k, p.z + 0.05 * k], [x0 + (p.w - 0.05) * k, p.y - 0.12 * k, p.z - 0.1 * k], 0.01 * k, 0.01 * k);
  BOOKS.forEach((b, i) => s.color(b.c).box(x0 + (bookX(i) + b.w / 2) * k, p.y + (0.015 + b.h / 2) * k, p.z, b.w * k, b.h * k, BOOK_D * k));
  // the game case leans on the last book
  const cx = x0 + (bookX(BOOKS.length) + 0.03) * k, base = p.y + 0.015 * k;
  s.color('#6FA84F').bone([cx, base, p.z], [cx - 0.05 * k, base + 0.17 * k, p.z], 0.007 * k, 0.065 * k);
  s.color('#F9F4EC').bone([cx - 0.048 * k, base + 0.163 * k, p.z], [cx - 0.053 * k, base + 0.18 * k, p.z], 0.0072 * k, 0.066 * k);
  return s.out();
};

/** The spine labels: one quad on the front of each book, uv cell k of 12 in the labels texture. */
export const shelfLabels = (p: { x: number; y: number; z: number; w: number; scale: number }): Geo => {
  const k = p.scale, x0 = p.x - (p.w / 2) * k, s = new Sink();
  BOOKS.forEach((b, i) => {
    const bx = x0 + (bookX(i) + b.w / 2) * k, by = p.y + (0.015 + b.h / 2) * k, z = p.z + (BOOK_D / 2) * k + 0.001;
    const hw = (b.w / 2) * 0.9 * k, hh = (b.h / 2) * 0.92 * k;
    s.quad([bx - hw, by - hh, z], [bx + hw, by - hh, z], [bx + hw, by + hh, z], [bx - hw, by + hh, z], [[i / 12, 0], [(i + 1) / 12, 0], [(i + 1) / 12, 1], [i / 12, 1]]);
  });
  return s.out();
};

/** The Xbox 360 standing beside the TV: white body, the green ring of light, the disc slot. */
export const xbox = (p: { x: number; y: number; z: number; scale: number }): Geo => {
  const k = p.scale, front = p.z + 0.13 * k;
  return new Sink()
    .color('#F3F3F0').box(p.x, p.y + 0.155 * k, p.z, 0.085 * k, 0.31 * k, 0.26 * k)
    .color('#C7C8C4').box(p.x, p.y + 0.155 * k, p.z, 0.086 * k, 0.005 * k, 0.262 * k)
    .color('#7AC142').sphere(p.x, p.y + 0.09 * k, front, 0.022 * k, 0.022 * k, 0.004 * k, 10, 4)
    .color('#E7E7E3').sphere(p.x, p.y + 0.09 * k, front, 0.012 * k, 0.012 * k, 0.006 * k, 8, 3)
    .color('#B8B9B5').box(p.x, p.y + 0.05 * k, front, 0.05 * k, 0.004 * k, 0.004 * k)
    .out();
};

/** A plate of nuggets with ketchup on the side. */
export const nuggets = (p: { x: number; y: number; z: number; scale: number }): Geo => {
  const k = p.scale, s = new Sink();
  s.color('#F9F4EC').cylinder(p.x, p.y + 0.006 * k, p.z, 0.13 * k, 0.012 * k, 16);
  s.color('#EFE8DC').cylinder(p.x, p.y + 0.013 * k, p.z, 0.1 * k, 0.003 * k, 16);
  const bits: Array<[number, number, string]> = [[-0.05, -0.02, '#D9A24D'], [0.0, -0.04, '#E0AC55'], [0.04, 0.0, '#D9A24D'], [-0.02, 0.03, '#C9903C'], [0.03, 0.04, '#E0AC55']];
  for (const [dx, dz, c] of bits) s.color(c).sphere(p.x + dx * k, p.y + 0.028 * k, p.z + dz * k, 0.028 * k, 0.016 * k, 0.022 * k, 7, 4);
  s.color('#D62828').sphere(p.x + 0.08 * k, p.y + 0.018 * k, p.z + 0.03 * k, 0.022 * k, 0.006 * k, 0.016 * k, 8, 3);
  return s.out();
};

/** Two curtains either side of the window on the back wall. scale shrinks them toward their rod. */
export const curtains = (p: { x: number; y: number; z: number; w: number; h: number; scale: number }): Geo => {
  const k = p.scale, s = new Sink().color('#E7A79A');
  for (const side of [-1, 1]) s.box(p.x + side * (p.w / 2 + 0.14), p.y - (p.h / 2) * k, p.z + 0.03, 0.26 * k, p.h * k, 0.05 * k);
  s.color('#8B6B4A').box(p.x, p.y + 0.02, p.z + 0.03, (p.w + 0.6) * k, 0.02 * k, 0.02 * k);
  return s.out();
};

/** The window frame: four cream bars around the glass, on the back wall. */
export const windowFrame = (p: { x: number; y: number; z: number; w: number; h: number }): Geo => {
  const t = 0.05, s = new Sink();
  s.box(p.x, p.y + p.h / 2 + t / 2, p.z, p.w + t * 2, t, 0.04);
  s.box(p.x, p.y - p.h / 2 - t / 2, p.z, p.w + t * 2, t, 0.04);
  s.box(p.x - p.w / 2 - t / 2, p.y, p.z, t, p.h, 0.04);
  s.box(p.x + p.w / 2 + t / 2, p.y, p.z, t, p.h, 0.04);
  s.box(p.x, p.y, p.z, 0.025, p.h, 0.02);
  s.box(p.x, p.y, p.z, p.w, 0.025, 0.02);
  return s.out();
};

/** A wall socket with two pins. A Delhi bedroom always has one, with a wire to the TV. */
export const socket = (p: { x: number; y: number; z: number }): Geo =>
  new Sink()
    .color('#EDE3D6').box(p.x, p.y, p.z, 0.09, 0.07, 0.015)
    .color('#7B6A57').box(p.x - 0.016, p.y, p.z + 0.008, 0.012, 0.024, 0.004)
    .box(p.x + 0.016, p.y, p.z + 0.008, 0.012, 0.024, 0.004)
    .out();

/** The wire from the socket to whatever is on the desk. */
export const wire = (p: { ax: number; ay: number; az: number; bx: number; by: number; bz: number }): Geo =>
  new Sink().bone([p.ax, p.ay, p.az], [p.ax, 0.02, p.az + 0.02], 0.006, 0.006).bone([p.ax, 0.02, p.az + 0.02], [p.bx, 0.02, p.bz], 0.006, 0.006).bone([p.bx, 0.02, p.bz], [p.bx, p.by, p.bz], 0.006, 0.006).out();

/** The lab keyboard: a slab whose top face carries the key texture. */
export const keyboard = (p: { x: number; y: number; z: number; w: number; d: number; scale: number }): Geo =>
  new Sink().box(p.x, p.y + 0.01 * p.scale, p.z, p.w * p.scale, 0.02 * p.scale, p.d * p.scale, { py: FULL }).out();

/** The lab wall clock, facing +z. r shrinks to nothing in the bedroom. */
export const clock = (p: { x: number; y: number; z: number; r: number }): Geo => {
  const s = new Sink().color('#FFFFFF').cylinder(0, 0, 0, p.r, 0.03, 16).color('#2B2B2B').cylinder(0, 0, 0, p.r * 1.06, 0.02, 16);
  s.color('#2B2B2B').box(0, 0.016, p.r * 0.3, 0.012, 0.004, p.r * 0.6).box(p.r * 0.2, 0.016, 0, p.r * 0.4, 0.004, 0.012);
  return s.rotateX(0, 0, Math.PI / 2).translate(p.x, p.y, p.z).out();
};

/** Three lab desks with monitors in a row along z. lift 0 puts the whole row under the floor. */
export const labRow = (p: { x: number; z0: number; gap: number; lift: number }): Geo => {
  const s = new Sink();
  for (let k = 0; k < 3; k++) {
    const z = p.z0 + k * p.gap;
    s.box(p.x, 0.72 - 0.02, z, 0.6, 0.04, 0.7);
    s.box(p.x, 0.35, z - 0.3, 0.55, 0.7, 0.05);
    s.box(p.x, 0.35, z + 0.3, 0.55, 0.7, 0.05);
    s.box(p.x + 0.05, 0.72 + 0.21, z, 0.4, 0.38, 0.4);
  }
  return s.translate(0, (p.lift - 1) * 1.3, 0).out();
};

/** The dark screens on the lab row's monitors, a separate actor so they get their own colour. */
export const labScreens = (p: { x: number; z0: number; gap: number; lift: number }): Geo => {
  const s = new Sink();
  for (let k = 0; k < 3; k++) s.box(p.x + 0.05 - 0.2, 0.72 + 0.21, p.z0 + k * p.gap, 0.01, 0.3, 0.32);
  return s.translate(0, (p.lift - 1) * 1.3, 0).out();
};
