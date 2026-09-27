// The walk's doors, built (door.ts says what a door is; sets.ts holds DOORS and places them). Each door is two
// props in the hinge's frame: `doorCase<Name>`, which stands, and `doorLeaf<Name>`, which swings.
import { Sink } from './rig.ts';
import { piece, M, type BuiltPart } from './part.ts';
import { CASE, clear, type Door } from './door.ts';
import { DOORS } from './sets.ts';

/** The case: the lining through the wall, the architraves on its faces, the stop, the threshold with its bar under the leaf. */
function doorCase(d: Door): BuiltPart {
  const { lining: t, arch, stop, sill, leaf: T } = CASE, { w: cw, h: ch } = clear(d), D = d.depth, xm = -D / 2;
  const through = new Sink(), faces = new Sink(), floor = new Sink();
  through.box(xm, (ch + t) / 2, -t / 2, D, ch + t, t).box(xm, (ch + t) / 2, cw + t / 2, D, ch + t, t).box(xm, ch + t / 2, cw / 2, D, t, cw); // the jambs and the head
  const sx = -T - 0.002 - stop.w / 2; // the stop stands right behind the shut leaf: nothing is seen past the leaf's edge
  if (!d.open) through.box(sx, ch / 2, stop.t / 2, stop.w, ch, stop.t).box(sx, ch / 2, cw - stop.t / 2, stop.w, ch, stop.t).box(sx, ch - stop.t / 2, cw / 2, stop.w, stop.t, cw - 2 * stop.t);
  const face = (x: number): void => {
    const top = ch + arch.margin + arch.w;
    faces.rbox(x, top / 2, -arch.margin - arch.w / 2, arch.t, top, arch.w, 0.003, 1).rbox(x, top / 2, cw + arch.margin + arch.w / 2, arch.t, top, arch.w, 0.003, 1);
    faces.rbox(x, ch + arch.margin + arch.w / 2, cw / 2, arch.t, arch.w, cw + 2 * arch.margin, 0.003, 1);
  };
  if (d.faces === 'both' || d.faces === 'swing') face(arch.t / 2);
  if (d.faces === 'both' || d.faces === 'far') face(-D - arch.t / 2);
  // the threshold lies over the joint of the two floors, a little into each room; its bar stands under the leaf's far face
  floor.box(xm, (sill - 0.02) / 2, cw / 2, D + 0.05, sill + 0.02, cw);
  if (!d.open) floor.box(sx, sill + 0.005, cw / 2, stop.w, 0.01, cw - 2 * stop.t);
  return [piece(through.out(), M(d.case), { metres: 'xy' }), piece(faces.out(), M(d.case), { smooth: true, metres: 'zy' }), piece(floor.out(), M(d.sill))];
}

/** The leaf, cut to the case: shut it lies along +z from the hinge, its face on the plane the case's face is on. */
function doorLeaf(d: Door): BuiltPart {
  const { leaf: T, gap, sill, under } = CASE, { w: cw, h: ch } = clear(d);
  const y0 = (d.bare ? 0 : sill) + under, y1 = ch - gap, lw = cw - 2 * gap, lh = y1 - y0, zc = gap + lw / 2, yc = (y0 + y1) / 2;
  const leaf = new Sink().rbox(-T / 2, yc, zc, T, lh, lw, 0.003, 1), pull = new Sink(), zl = gap + lw - 0.065;
  if (d.pull === 'lever') {
    for (const x of [0, -T]) leaf.rbox(x, yc, zc, 0.008, lh - 0.36, lw - 0.28, 0.003, 1); // a raised panel each face
    for (const s of [1, -1]) {
      const x = s > 0 ? 0 : -T; // the rose on the face, the neck, the lever back toward the hinge
      pull.rbox(x + s * 0.004, 1.0, zl, 0.008, 0.052, 0.052, 0.003, 1).rbox(x + s * 0.028, 1.0, zl, 0.048, 0.018, 0.018, 0.004, 1).rbox(x + s * 0.048, 1.0, zl - 0.055, 0.016, 0.018, 0.13, 0.006, 2);
    }
  } else {
    for (const s of [1, -1]) {
      const x = s > 0 ? 0 : -T; // a long bar on two standoffs
      pull.rbox(x + s * 0.045, 1.08, zl, 0.02, 0.56, 0.02, 0.007, 2);
      for (const y of [0.88, 1.28]) pull.rbox(x + s * 0.02, y, zl, 0.04, 0.014, 0.014, 0.004, 1);
    }
  }
  return [piece(leaf.out(), M(d.leaf), { smooth: true, metres: 'zy' }), piece(pull.out(), M('chrome'), { smooth: true })];
}

const named = (k: string): string => k[0].toUpperCase() + k.slice(1);

export const DOOR_BUILT: Record<string, () => BuiltPart> = Object.fromEntries(
  Object.entries(DOORS as Record<string, Door>).flatMap(([k, d]) => [...(d.bare ? [] : [[`doorCase${named(k)}`, () => doorCase(d)]]), ...(d.open ? [] : [[`doorLeaf${named(k)}`, () => doorLeaf(d)]])]),
);
