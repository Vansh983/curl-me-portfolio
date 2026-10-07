// One world. Every set stands in one place, for good, and the doors join them: the story is a circle that is walked,
// not cut. The sets were written each about its own origin, in the places the scroll first put them (sets.ts): here is
// where each one stands now, as a turn about the upright and a shift.
//
// - The apartment (0), the 2010 room (1), the lab (2) and Google's lawn (3) stand where they were written.
// - The 2020 room (4) stands behind the door in Google's block (DELHI), and the jet bridge and the aircraft (5) hang off
//   its west door there, turned with it.
// - The hall of 2022 (6) to Floqer's house (12) are one rigid chain, turned so that the door at the top of Floqer's
//   stair is the far end of the passage east of the apartment's brick door: the way home. The flight and the hall are
//   joined by the phone, not a door, so the chain is free to stand anywhere.
import { DELHI, DOORS, FLOQER, TOUR_SHIFT, SETS, type V3 } from './sets.ts';

export interface Pose { at: V3; yaw: number } // yaw in degrees about the upright; world = turn(p) + at

/** The passage east of the apartment's brick door: from the door's wall to the door at the top of Floqer's stair. */
export const BRICK = { x: -4.2, z: 1.6, length: 1.8 } as const;

const turn = (p: V3, yaw: number): V3 => { const r = (yaw * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; };
const apply = (pose: Pose, p: V3): V3 => { const t = turn(p, pose.yaw); return [t[0] + pose.at[0], t[1] + pose.at[1], t[2] + pose.at[2]]; };

/** Floqer's door in the story's own space: the middle of its leaf's face, at the top of the stair, TOUR_SHIFT north. */
const floqerDoor: V3 = [FLOQER.door.x, FLOQER.floor + FLOQER.stair.n * FLOQER.stair.rise, FLOQER.z[1] - 0.09 + DOORS.home.depth + TOUR_SHIFT];
const chainB: Pose = (() => {
  const yaw = -90, t = turn(floqerDoor, yaw), end: V3 = [BRICK.x + BRICK.length, 0, BRICK.z]; // the door's face at the passage's far end, opening west into it
  return { yaw, at: [end[0] - t[0], end[1] - t[1], end[2] - t[2]] };
})();
const delhi: Pose = { at: DELHI.at, yaw: DELHI.turn };
const still: Pose = { at: [0, 0, 0], yaw: 0 };

/** Where each set stands, by index. */
export const POSES: readonly Pose[] = SETS.map((_, i) => (i === 4 || i === 5 ? delhi : i >= 6 ? chainB : still));

/** A point of set `i`, written in the story's space (the set about its origin plus its `at`), in the world. */
export function toWorld(i: number, p: V3): V3 { return apply(POSES[i], p); }
/** A direction (the sun's, a sky's) as a set is turned. */
export function turnDir(i: number, d: V3): V3 { return turn(d, POSES[i].yaw); }
/** How far set `i` is turned, in radians. */
export function yawOf(i: number): number { return (POSES[i].yaw * Math.PI) / 180; }
