// A door that fits its wall. The walls of a room are planes (shell.ts), so a doorway between two rooms is a hole in
// two planes with nothing between them: a leaf smaller than the hole, or no floor across the wall's depth, shows the
// room behind or nothing at all. A door here is a case (the lining through the wall's depth, an architrave on each
// face, the stop the leaf shuts on, a threshold over the floor's joint) and a leaf cut to the case.
//
// Both are built in the hinge's frame: the origin is the hinge, on the floor, on the face the leaf opens on. The
// leaf lies along +z when shut and opens toward +x; the wall's depth runs toward -x. No imports: sets.ts and
// door-built.ts both read this.

/** A doorway: the hole in the wall, the wall's depth from the face the leaf opens on to the far face, what it is made of. */
export interface Door {
  w: number; // the hole's width
  h: number; // the hole's height
  depth: number; // from the face the leaf opens on to the far face
  case: string; // the material of the lining, the architraves and the stop
  leaf: string; // the material of the leaf
  sill: string; // the material of the threshold
  pull: 'lever' | 'bar'; // a lever on a rose, or a long bar
  faces: 'both' | 'swing' | 'far' | 'none'; // which faces carry an architrave (a face with its own reveal carries none)
  open?: true; // a cased opening: no leaf, no stop
  bare?: true; // the hole is lined already (a frame of the room's own stands in it): no case, the leaf is cut to the hole
}

/** The case's boards, metres. */
export const CASE = {
  lining: 0.032, // the lining's thickness: the clear opening is the hole less two of these, and one at the head
  leaf: 0.044, // the leaf's thickness
  gap: 0.003, // between the leaf and the lining
  sill: 0.012, // the threshold's height
  under: 0.005, // between the leaf and the threshold
  arch: { w: 0.09, t: 0.016, margin: 0.006 }, // the architrave: its width, how proud of the wall, how far back from the lining's face
  stop: { w: 0.03, t: 0.012 }, // the stop: its width through the wall, how far it stands into the opening
} as const;

/** The clear opening inside a door's case: its width and its height off the floor. */
export function clear(d: Door): { w: number; h: number } {
  return d.bare ? { w: d.w, h: d.h } : { w: d.w - 2 * CASE.lining, h: d.h - CASE.lining };
}

/** Where the hinge stands along the wall from the hole's middle: on the hole's edge, a lining's thickness in. */
export function hingeOff(d: Door): number {
  return d.w / 2 - (d.bare ? 0 : CASE.lining);
}
