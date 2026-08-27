// Every prop is one rig with a fixed vertex count. A prop that exists in one chapter
// and not the next has params that shrink it to a point or sink it under the floor.
import { Sink } from './rig.ts';

export const floor = (p: { w: number; d: number }) =>
  new Sink().quad([-p.w / 2, 0, p.d / 2], [p.w / 2, 0, p.d / 2], [p.w / 2, 0, -p.d / 2], [-p.w / 2, 0, -p.d / 2]).out();

/** Back, left and right walls, inward facing. The front (camera side) is open. */
export const walls = (p: { w: number; h: number; d: number }) => {
  const x0 = -p.w / 2, x1 = p.w / 2, z0 = -p.d / 2, z1 = p.d / 2, h = p.h;
  return new Sink()
    .quad([x0, 0, z0], [x1, 0, z0], [x1, h, z0], [x0, h, z0])
    .quad([x0, 0, z1], [x0, 0, z0], [x0, h, z0], [x0, h, z1])
    .quad([x1, 0, z0], [x1, 0, z1], [x1, h, z1], [x1, h, z0])
    .out();
};

export const ceiling = (p: { w: number; h: number; d: number }) =>
  new Sink().quad([-p.w / 2, p.h, -p.d / 2], [p.w / 2, p.h, -p.d / 2], [p.w / 2, p.h, p.d / 2], [-p.w / 2, p.h, p.d / 2]).out();

/** A thin slab on a wall (window, whiteboard). w runs along x before yaw. */
export const panel = (p: { x: number; y: number; z: number; w: number; h: number; t: number; yaw: number }) =>
  new Sink().box(0, 0, 0, p.w, p.h, p.t).rotateY(0, 0, p.yaw).translate(p.x, p.y, p.z).out();

/** Top slab on two side panels. y is the floor under it, h the height of the top surface. */
export const table = (p: { x: number; y: number; z: number; w: number; h: number; d: number; top: number }) => {
  const legH = Math.max(0.001, p.h - p.top);
  return new Sink()
    .box(p.x, p.y + p.h - p.top / 2, p.z, p.w, p.top, p.d)
    .box(p.x - p.w / 2 + 0.03, p.y + legH / 2, p.z, 0.05, legH, p.d * 0.9)
    .box(p.x + p.w / 2 - 0.03, p.y + legH / 2, p.z, 0.05, legH, p.d * 0.9)
    .out();
};

/** TV or monitor body plus a stand under it. (x, y, z) is the body centre. */
export const screenBody = (p: { x: number; y: number; z: number; w: number; h: number; d: number; standW: number; standH: number; standD: number }) =>
  new Sink()
    .box(p.x, p.y, p.z, p.w, p.h, p.d)
    .box(p.x, p.y - p.h / 2 - p.standH / 2, p.z, p.standW, p.standH, p.standD)
    .out();

/** One quad facing +z, for a texture. (x, y, z) is its centre. */
export const face = (p: { x: number; y: number; z: number; w: number; h: number }) =>
  new Sink().quad([p.x - p.w / 2, p.y - p.h / 2, p.z], [p.x + p.w / 2, p.y - p.h / 2, p.z], [p.x + p.w / 2, p.y + p.h / 2, p.z], [p.x - p.w / 2, p.y + p.h / 2, p.z]).out();
/** uv for `face`: two triangles (a,b,c),(a,c,d), image top-left at d. */
export const FACE_UV = new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]);

/** A rug and a chair in one rig. Bedroom: rug big, chair tiny and sunk. Lab: the reverse. */
export const seat = (p: { x: number; z: number; rugR: number; rugT: number; seatW: number; seatD: number; seatH: number; seatT: number; legR: number; backH: number; yOff: number }) => {
  const s = new Sink().cylinder(p.x, p.rugT / 2, p.z, p.rugR, p.rugT, 16);
  const legH = Math.max(0.001, p.seatH - p.seatT);
  const y = p.yOff;
  s.box(p.x, y + p.seatH - p.seatT / 2, p.z, p.seatW, p.seatT, p.seatD);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) s.box(p.x + sx * (p.seatW / 2 - p.legR), y + legH / 2, p.z + sz * (p.seatD / 2 - p.legR), p.legR * 2, legH, p.legR * 2);
  s.box(p.x, y + p.seatH + p.backH / 2, p.z + p.seatD / 2 - 0.02, p.seatW, p.backH, 0.04);
  return s.out();
};

/** Ceiling fan built at the origin hanging down: the mesh is positioned and spun at runtime. */
export const fan = (p: { rod: number; r: number; hub: number }) => {
  const s = new Sink().cylinder(0, -p.rod / 2, 0, 0.02, p.rod, 8).cylinder(0, -p.rod - 0.03, 0, p.hub, 0.06, 8);
  for (let k = 0; k < 3; k++) {
    const start = s.count;
    s.box(p.r / 2 + p.hub * 0.5, -p.rod - 0.03, 0, p.r, 0.015, 0.12).rotateY(0, 0, (k * Math.PI * 2) / 3, start);
  }
  return s.out();
};

export const crate = (p: { x: number; y: number; z: number; w: number; h: number; d: number }) => new Sink().box(p.x, p.y, p.z, p.w, p.h, p.d).out();

export const ball = (p: { x: number; y: number; z: number; r: number }) => new Sink().sphere(p.x, p.y, p.z, p.r, p.r, p.r, 10, 7).out();

/** A board with four books on it. scale shrinks the whole thing toward (x, y, z). */
export const shelf = (p: { x: number; y: number; z: number; w: number; scale: number }) => {
  const k = p.scale;
  const s = new Sink().box(p.x, p.y, p.z, p.w * k, 0.035 * k, 0.26 * k);
  const books: Array<[number, number, number]> = [[-0.3, 0.05, 0.22], [-0.22, 0.06, 0.2], [-0.13, 0.04, 0.24], [-0.06, 0.05, 0.19]];
  for (const [bx, bw, bh] of books) s.box(p.x + bx * k, p.y + (0.035 / 2 + bh / 2) * k, p.z, bw * k, bh * k, 0.2 * k);
  return s.out();
};

/** Three lab desks with monitors in a row along z. lift 0 puts the whole row under the floor. */
export const labRow = (p: { x: number; z0: number; gap: number; lift: number }) => {
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
