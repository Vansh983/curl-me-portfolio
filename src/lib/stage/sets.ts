// The world as data: twelve sets in a chain, each with its light, its shell and what stands in it.
// Metres, y up. Spec: docs/rebuild/13-journey-real-spec.md; layout: 14-journey-real-plan.md.
//
//   Set 0 NOW      x -9.4..-4.2  z -3.4..2.2   h 2.8   the studio over Toronto; glass on z-, front door on z+ at x -5.45, the brick door on x+ at z 1.6 (shut)
//   Passage        x -4.85..     z  2.2..4.3           north, 2.1 m, to the 2010 room
//   Set 1 ROOM     x -9.15..-4.95 z 4.3..7.9   h 2.7   2010, Delhi; in from the south at x -5.45, out east at z 6.6
//   Set 2 LAB      x -3.15..2.05 z  4.7..9.7   h 3.0   2013; in from the west at z 6.6, out south at x 1.4
//   Set 3 GOOGLE   the lawn east of the block x -4.0..1.5  z -8.0..-0.03   2019, the Googleplex: the Android lawn, the door in the block's face on the left (the 2020 room stands behind it, DELHI)
//   Set 4 DELHI    x -2.4..0.7   z  0..3.6     h 2.7   2020, Webcube from home; in from the south at x -0.7, out west at z 1.6
//   Set 5 FLIGHT   x -5.2..-1.6  z -10.2..-4.8        south down the boarding corridor; window seat, phone portal
//   Set 6 HALIFAX  x -1.4..11.2  z -17.4..-2.0        96-seat auditorium; phone arrives at the highest row; out by the front west door
//   Set 7 SYDNEY   x -7.4..-1.4  z -18.2..-13.2 h 2.9  2024, the hacker house where Bean was built; the Opera House out of the west window; out by the south door
//   Set 8 VANCOUVER x -13.5..-7.5 z -21..-0.7         2025, the walk (walk.ts): the promenade and everything near it stand here; Vancouver in May beyond it
//   Set 9 TORONTO   the same walk  z -0.7..20.5        2025, Toronto in October: the streetcar, the tower, the lake
//   Set 10 HALIFAX  the same walk  z 20.5..42          2026, Halifax in January at dusk, then Volta's room (x -16.6..-7.4, z 30..42)
//   Set 11 CONVOCATION and Set 12 FLOQER               written about the old terrace door (z 24); they stand TOUR_SHIFT further north
import { HALIFAX } from './halifax.ts';
import { ch, approach, TOUR_GAIN } from './shot.ts';
import { WALK, CITY_AIR, TRACK, VOLTA_SHUT, VOLTA_VIEW, TORONTO_SKYLINE, SIGNS, voltaViewBridge, type Cue, type SkyName } from './walk.ts';
import { hingeOff, type Door } from './door.ts';

export type V3 = [number, number, number];

/** A hole in a wall. `at` is the world coordinate along the wall, `sill` the bottom height (0 for a door). */
export interface Opening { wall: 'x+' | 'x-' | 'z+' | 'z-'; at: number; w: number; h: number; sill?: number; door?: true } // a raised opening is a window to the bake (it lights it as sky) unless marked a door
/** A partition inside the shell, `from` to `to` on the floor, `t` thick (default 0.12), doors measured along it from `from`. */
export interface InnerWall { from: [number, number]; to: [number, number]; t?: number; doors?: Array<{ at: number; w: number; h: number }> }

/** A room: floor, four walls, ceiling, each a designed material (materials.ts). uv is in metres. */
export interface Shell {
  y?: number; // the floor's height, when the room stands above the ground (Floqer's office is up the hall's rake)
  x: [number, number];
  z: [number, number];
  h: number;
  floor: string;
  wall: string;
  ceiling?: string;
  openings: Opening[];
  walls?: InnerWall[]; // partitions: an apartment is rooms, not one box
}

/** `city`: a backdrop shown only in its own set; `sky`: a backdrop shown in its set and the one before it (seen through the exit door). */
export type Live = 'fan' | 'tv' | 'monitor' | 'tube' | 'curtain' | 'water' | 'bulb' | 'lamp' | 'pendant' | 'downlight' | 'screen' | 'city' | 'sky' | 'door' | 'drop' | 'flight' | 'person' | 'walkLamp' | 'mover' | 'glow';

/** Something standing in a set: a scanned model by manifest id, or a code-built prop by name. */
/** What a person wears, by bone: skin, top, legs, shoes; long sleeves put the top on the forearms. */
export interface Wear { skin: string; top: string; legs: string; shoes: string; sleeves: 'long' | 'short' }
/** A person: the rigged base character dressed and given an idle loop, started `phase` seconds in so no two move together. */
export interface Person { wear: Wear; hair: string; clip: 'idle' | 'talk' | 'sit' | 'sitTalk'; phase: number }

export interface Placement {
  person?: Person; // live 'person'
  screen?: string; // optional painted content for a model's fitted display
  shut?: [number, number]; // live 'door': the stage progress over which it swings shut again, behind him
  door?: [number, number]; // live 'door': the stage progress over which the leaf swings 90 degrees anticlockwise (seen from above) from its placed rotation
  drop?: [number, number, number]; // live 'drop': the stage progress over which the thing lowers, and by how many metres (the projection screen)
  cue?: Cue; // it arrives with the scroll (walk.ts): from an offset, a turn or a scale to where it is placed
  rise?: [number, number, number]; // it is built from the ground up over these chapters, in courses this many metres tall (the pixel whale, cube on cube)
  mover?: 'seaplane' | 'streetcar' | 'ferry'; // live 'mover': its place comes from the walk's script
  indoor?: 'in' | 'out'; // Volta's view (walk.ts VOLTA_VIEW): shown only while it stands outside the glass ('in'), or only while it does not ('out')
  model?: string;
  build?: string;
  at: V3;
  rot?: V3; // degrees
  scale?: number | V3;
  live?: Live;
  cap?: string;
  href?: string;
  shadow?: boolean; // default true
}

export interface SunSpec { dir: V3; color: string; power: number; shadow: number }

export interface StageSet {
  id: string;
  env: 'studio' | 'sky'; // a soft studio room (indoors) or a clear sky with the sun (outdoors)
  tint: { sky: string; ground: string; power: number }; // a hemisphere that colours the studio light
  exposure: number;
  envPower: number;
  sun: SunSpec;
  fog: { color: string; near: number; far: number };
  shell?: Shell;
  props: Placement[];
  baked?: boolean; // the set was lit in Blender: public/assets/stage/baked/set<i>.glb and its lightmap (scripts/stage-bake.mjs)
  bakedEnvironment?: boolean; // this set also ships set<i>_env.webp; no speculative 404 requests
  outdoor?: true; // no walls of its own: shown only from the set before it and itself, or its ground and road would stand outside the windows of the rooms
  outlook?: true; // a room whose windows look out on the day: the sky stands beyond them
  also?: number[]; // sets kept in view beyond the neighbours: the promenade stands in set 8 and is walked through set 10
  sky?: SkyName; // an open-air set under one of the walk's skies (public/assets/stage/sky), its light from the walk's script
  at?: V3; // where the set's own frame stands in the world: its props, its shell and its bake are written about its own origin
  bake?: { env: 'studio' | 'sky'; tint: StageSet['tint']; envPower: number; sun: SunSpec; view: { cam: V3; look: V3; fov: number } }; // the light the bake lights it by, when that is not the set's own: a room on the walk is lit by its lamps, not the walk's sky
}


// the lab: two rows of three desks, the first website on the front left one; desk pitch 1.5 across, 1.6 back
/** Lab stations along x: five on the long bench (far wall), three on the short one (near wall). */
const STATIONS_A = [-2.45, -1.5, -0.55, 0.4, 1.35];
const STATIONS_B = [-2.45, -1.5, -0.55];
export const AUDITORIUM = {
  banks: [[0, 4.2], [5.6, 9.8]], aisles: [[-1.4, 0], [4.2, 5.6], [9.8, 11.2]],
  seatXs: [0.35, 1.05, 1.75, 2.45, 3.15, 3.85, 5.95, 6.65, 7.35, 8.05, 8.75, 9.45],
  studyX: 3.85, aisleX: 4.9, tabletHeight: 0.74, rear: -2,
} as const;
export const LECTURE_ROWS = Array.from({ length: 8 }, (_, i) => ({
  front: -14.6 + i * 1.35, back: -13.25 + i * 1.35,
  seat: -13.63 + i * 1.35, height: (i + 1) * 0.36,
}));
export const TOP_ROW = LECTURE_ROWS[LECTURE_ROWS.length - 1];
/** Where the Goldberg building stands in the flight's ground frame (scripts/stage-halifax.mjs). */
export const HALIFAX_CAMPUS: [number, number] = HALIFAX.campus;
/** The cloud deck's height over Halifax, metres; flight.ts crosses it on the way down. */
export const FLIGHT_DECK = 300;
/**
 * The cabin: an Embraer 175, the regional jet on the Toronto to Halifax leg, 2 + 2 across a 0.5 m aisle, 31 inch pitch, the
 * interior 2.74 m wide and 2.0 m high at the crown. The aisle's centre at x -3.4; the door on the rear wall at z -4.8 where
 * the bridge meets it; four rows ahead of it, the front bulkhead at z -8.7. Windows every 0.52 m, 0.28 by 0.40 with rounded
 * corners, the sill at 0.8, the seated eye above it. He sits in the row by the door, the port window seat, the wing behind him.
 */
export const CABIN = {
  cx: -3.4, z: [-8.7, -4.8] as [number, number], half: 1.37, height: 2.08,
  windowZ: [-5.08, -5.6, -6.12, -6.64, -7.16, -7.68, -8.2], win: { y0: 0.8, y1: 1.2, w: 0.28, r: 0.09, slot: 0.26 }, // low, at the seated shoulder, the way the E-Jet's are
  rows: [-5.5, -6.29, -7.08, -7.87], seatsX: [-4.4, -3.9, -2.9, -2.4], door: { w: 0.86, h: 1.85 },
} as const;
/** The lecturer's dais across the front, and the lectern on it, right of centre so the screen stays clear. */
export const DAIS = { x: 4.9, z: [-17.3, -14.7] as [number, number], height: 0.3, lectern: [5.6, -15.95] as [number, number] };
/** The floor of the central aisle at z: two 0.18 m steps per tier, the rear landing at the top, the flat floor at the front. */
export const aisleHeight = (z: number): number => {
  if (z >= TOP_ROW.back) return TOP_ROW.height;
  if (z < LECTURE_ROWS[0].front) return 0;
  const i = Math.floor((z - LECTURE_ROWS[0].front) / 1.35), rem = z - LECTURE_ROWS[0].front - i * 1.35;
  return LECTURE_ROWS[i].height - (rem < 0.675 ? 0.18 : 0);
};

/**
 * The Canada tour is one walk (walk.ts): out of the Bean house's south door, right twice, and 60 m north along a harbour
 * promenade to Volta's door. The hall and Floqer's house beyond it were written, and baked, when the door into the wing
 * stood at z 24; the walk is longer now, so their sets stand this much further north (StageSet.at) and the dolly's keys
 * in them with it.
 */
export const TOUR_SHIFT = WALK.door - 24 + 0.12; // and a wall's thickness more: the wing's own door wall stands behind Volta's, not through it
/** The Bean house from outside: the room's own footprint, its roof a little over the walls. */
export const BEAN_HOUSE = { x: [-7.4, -1.4] as [number, number], z: [-18.2, -13.2] as [number, number], h: 3.2 } as const;
/** Coupland's whale, in the planting by the walk where a tree would stand: 5 m off the walk's line, in the frame from 8 m back. */
export const ORCA = { x: -5.1, z: -5.0 } as const;
/** The trees along the land side of the walk, and a second row behind them. Their season is the walk's (walk.ts): they turn together. None stands beside a mark, nor within 4.5 m before one (its boughs would lie across the mark as he comes to it), nor by the whale. */
export const WALK_TREES: Array<{ z: number; x: number; kind: number; turn: number; size: number }> = (() => {
  const out: Array<{ z: number; x: number; kind: number; turn: number; size: number }> = [];
  let seed = 7919;
  const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  for (const z of [-11.2, 2.4, 8.2, 20.7, 30.0]) if (Math.abs(z - ORCA.z) > 3 && !SIGNS.some((g) => z > g.z - 4.5 && z < g.z + 2.4)) out.push({ z, x: -6.55 + (rnd() - 0.5) * 0.3, kind: out.length % 4, turn: Math.round(rnd() * 360), size: 0.92 + rnd() * 0.2 });
  // a second row further in from the walk, out of step with the first, so the land side has depth
  for (let z = -8.0; z < WALK.volta.z[0] + 6; z += 7.4) out.push({ z: z + (rnd() - 0.5) * 2, x: 3.0 + rnd() * 3.2, kind: (out.length + 1) % 4, turn: Math.round(rnd() * 360), size: 1.05 + rnd() * 0.3 });
  return out;
})();
/** The lamps along the water's edge, one every 7.5 m from the corner to Volta's. */
export const WALK_LAMPS: number[] = Array.from({ length: 8 }, (_, i) => -15.5 + i * 7.5);
/** The high table at the north end of Volta's floor, by the slide on the wall: he stands behind it, toward +z, and turns to the room. */
export const VOLTA_PODIUM: V3 = [-12.6, 0, WALK.volta.z[1] - 3.1];
/** Bare street trees along the far sidewalk out of Volta's glass (VOLTA_VIEW.street), one every 13 m or so: x, z, turn, size. */
const VIEW_TREES: Array<[number, number, number, number]> = [-44, -30, -17, -4, 9, 22, 35, 58, 71, 84, 97, 110, 123].map((z, i) => [VOLTA_VIEW.street[3] + 1.2, z + ((i * 37) % 5) - 2, (i * 83) % 360, 0.9 + ((i * 29) % 7) / 30]);
/**
 * Volta's floor as it is furnished (docs/rebuild/40-volta-interior-reference.md), west of the walk's line through the
 * room: two groups of white tables with white chairs pulled up, the tub chairs and ottomans at the glass, a high table
 * and stools, the fat white columns, the ring lights overhead. x, z and a turn about y in degrees (a seat faces +z at 0).
 */
export const VOLTA_FLOOR = {
  columns: [[-14.9, 43.9], [-14.9, 47.6]] as Array<[number, number]>,
  rings: [[-13.4, 42.6, 1.0], [-13.0, 46.3, 1.3], [-9.3, 47.5, 0.85], [-12.4, 50.0, 0.9]] as Array<[number, number, number]>, // x, z, radius
  tables: [[-13.4, 42.225, 0], [-13.4, 42.975, 0], [-12.8, 45.25, 90], [-12.8, 46.75, 90]] as Array<[number, number, number]>,
  chairs: [[-13.8, 41.45, 8], [-13.0, 41.4, -12], [-13.75, 43.8, 172], [-12.85, 44.05, 205], [-11.95, 45.2, -84], [-11.9, 46.75, -100], [-13.65, 45.3, 96], [-13.7, 46.85, 78]] as Array<[number, number, number]>,
  tubs: [[-15.45, 45.35, 52], [-15.45, 46.95, 131]] as Array<[number, number, number]>,
  stools: [[-8.05, 41.6, 80], [-8.1, 42.5, 95], [-8.05, 43.45, 110], [-14.75, 49.65, 0], [-15.55, 50.05, 40]] as Array<[number, number, number]>,
  highTable: [-15.35, 49.4] as [number, number],
} as const;
export const STAGE = {
  wing: [24.0, 27.0] as [number, number], z: [27.0, 41.0] as [number, number], x: [-15.4, -7.4] as [number, number], height: 1.0, centre: 33.5, hall: [-7.4, 24.0] as [number, number], hallZ: [24.5, 46.5] as [number, number],
  door: { x: -10.5, z: 48.0, w: 1.0, h: 2.2, floor: 1.0 }, // the door out of the north wall behind the stage, on the walk's line, at the stage's height: backstage runs to it; Floqer's house is right behind it
} as const;
/** The house's raked floor: ten tiers of 0.16 m every 2.7 m from 5.4 m past the stage's front to the back wall. */
export const houseFloorY = (x: number): number => (x <= STAGE.hall[0] + 5.4 ? 0 : 0.16 * Math.min(10, Math.floor((x - STAGE.hall[0] - 5.4) / 2.7) + 1));
/** Floqer's hacker house: right behind the door in the hall's north wall, its floor at the stage's height, 12 by 12 m, the windows on Toronto to the west, the stair to his door on the east wall. */
export const FLOQER = (() => {
  const z: [number, number] = [STAGE.door.z + 0.3, STAGE.door.z + 12.3], stair = { x: -4.55, n: 8, rise: 0.171, run: 0.28, w: 1.1 }; // the house's south wall is the far face of the hall's door wall; the stair against the east wall
  return { x: [-16, -4] as [number, number], z, floor: STAGE.door.floor, h: 3.6, stair: { ...stair, z0: z[1] - 0.9 - stair.n * stair.run }, door: { x: stair.x, w: 1.0, h: 2.1 } } as const; // the flight ends 0.9 short of the north wall: a landing, then the door, on the stair's line
})();
/**
 * The T of desks in Floqer's house: the bar across the room (its middle line's z), the stem down from its middle (its
 * middle's z, its line's x), and the seats along the bar (x), a desk each side of the line at each. Desks are 1.5 by
 * 0.75, pushed together back to back, so the stem's head meets the bar's south edge.
 */
export const FLOQER_T = { bar: FLOQER.z[0] + 7.2, stem: FLOQER.z[0] + 7.2 - 0.76 - 1.5, x: -12.2, seats: [-14.45, -12.95, -11.45, -9.95] } as const;
/** The height of the office's stair at z, from its foot to the landing. */
/**
 * The apartment (set 0): the studio's walls. He asked for it a bit smaller (2026-09-27): the west wall and the glass
 * came in, 5.2 by 5.6 m to 4.7 by 5.0. The front door (north) and the brick wall (east) are where they were, so the
 * passages and the way home (HOME) are too. `glass`: the width of the glass in the south wall, a pier either side.
 */
export const CONDO = { x: [-8.9, -4.2] as [number, number], z: [-2.8, 2.2] as [number, number], h: 2.8, glass: 4.1 } as const;
/**
 * Google, 2019 (set 3): the Googleplex. Out of the lab's passage onto the Android lawn (the statues along it to the
 * east, the Google letters at its end), down the path, and left through the door in the block's face, where the
 * boardroom's glass door was. No room of Google's behind it: he said it was not needed (2026-09-27). The door opens
 * straight into the 2020 room (DELHI).
 */
export const GOOGLE = {
  block: { x: [-4.0, 1.5] as [number, number], z: [-8.0, -0.03] as [number, number] }, // the block on the left of the walk: its east face is on the lawn
  door: { z: -5.0, w: 0.9, h: 2.05 }, // the door in that face: the 2020 room's own
  photos: { z: [-6.255, -7.385] as [number, number], y: 1.55 }, // his two photographs of the trip on that face, past the door: the wall from the door's frame to the block's corner in thirds
  top: 7.0, // the blocks' roof: two storeys
  walkX: 3.2, // the walk's line down the lawn, on the path, the statues to its east
} as const;
/**
 * The 2020 room stands in two places, as the apartment does (HOME). Until the walk is well inside it, it stands turned
 * a quarter behind the door in Google's block (`at`, a turn of `turn` degrees about y first), so the door on the lawn
 * opens straight into it. At `back`, with nothing but the room's own desk wall in the frame, it is where it was
 * built, its west door on the jet bridge: the camera's keys before `back` are written through `to`, the ones after
 * as they were, and the picture does not change. `cut` is that moment in the approach's own measure (dolly.ts).
 */
/** The 2020 room behind the door in Google's block (its one place now, world.ts); `cut`, `back`: where the scroll's keys change frame (dolly.ts). */
export const DELHI = (() => {
  const at: V3 = [GOOGLE.block.x[1], 0, GOOGLE.door.z + 0.7], cut = 0.852; // the room's door is at its own x -0.7, z 0
  return { at, turn: -90, cut, back: approach(cut + 0.0002), to: (p: V3): V3 => [at[0] - p[2], at[1] + p[1], at[2] + p[0]] } as const;
})();
/** The two windows on the street, along the house's west wall (z). */
export const FLOQER_WINDOWS = [FLOQER.z[0] + 2.5, FLOQER.z[0] + 7.5];
const WINDOW_Z = FLOQER_WINDOWS;
export const stairY = (z: number): number => FLOQER.floor + Math.min(FLOQER.stair.n, Math.max(0, (z - FLOQER.stair.z0) / FLOQER.stair.run)) * FLOQER.stair.rise;
/**
 * Home: the story ends in the apartment it began in (set 0), and he walks into it: up the stair in Floqer's house,
 * through the door at its top, along the apartment's own entrance passage and in at its front door. The apartment is
 * one set in two places: while the story is in Floqer's house and after, it stands turned half round behind that door
 * (`at`, a turn of 180 degrees about y first), its passage's far end on the house's north wall.
 */
/** Where the apartment once stood at the end, behind Floqer's stair door. Every set stands in one place now (world.ts): only `night` is read. */
export const HOME = (() => {
  const door = { x: -5.45, z: 2.2 }, passage = 2.1; // the apartment's front door in its own frame, and the passage north of it
  const y = FLOQER.floor + FLOQER.stair.n * FLOQER.stair.rise, z = FLOQER.z[1] + TOUR_SHIFT + 0.14 + passage + door.z; // own z 4.3, the passage's far end, a wall's thickness beyond the house's north wall
  const at: V3 = [FLOQER.door.x + door.x, y, z];
  // `from`: the chapter from which it stands there (in the hall, long out of sight of both). `night`: the chapter, on the
  // stair with his door still shut, from which what is outside is the apartment's own night and not the house's street
  return { at, from: 15.4, night: 16.4 + TOUR_GAIN, to: (p: V3): V3 => [at[0] - p[0], at[1] + p[1], at[2] - p[2]] } as const;
})();
/**
 * The walk's doors (door.ts): each hole as its walls cut it, the depth between the two rooms' walls, what it is made of.
 * Sydney's opens into the room, off the house's own reveal outside; the others open north, away from the walk.
 */
export const DOORS = {
  voltaIn: { w: 1.2, h: 2.2, depth: 0.25, case: 'windowFrame', leaf: 'windowFrame', sill: 'windowFrame', pull: 'bar', faces: 'swing' }, // Volta's door off the walk, dark steel, in the brick's own reveal
  sydney: { w: 0.9, h: 2.05, depth: 0.12, case: 'doorPaint', leaf: 'doorPaint', sill: 'windowFrame', pull: 'lever', faces: 'swing' },
  volta: { w: 1.2, h: 2.1, depth: 0.22, case: 'doorPaint', leaf: 'voltaDoor', sill: 'windowFrame', pull: 'lever', faces: 'both' },
  floqer: { w: STAGE.door.w, h: STAGE.door.h, depth: FLOQER.z[0] - STAGE.door.z, case: 'doorPaint', leaf: 'doorPaint', sill: 'windowFrame', pull: 'lever', faces: 'both' },
  home: { w: FLOQER.door.w, h: FLOQER.door.h, depth: 0.23, case: 'doorDark', leaf: 'doorDark', sill: 'doorDark', pull: 'bar', faces: 'both' },
  brick: { w: 0.9, h: 2.05, depth: 0.1, case: 'doorDark', leaf: 'doorDark', sill: 'doorDark', pull: 'bar', faces: 'swing' }, // the door in the apartment's brick wall: shut, the story no longer comes back through it
  google: { w: GOOGLE.door.w, h: GOOGLE.door.h, depth: 0.3, case: 'frameWood', leaf: 'frameWood', sill: 'frameWood', pull: 'lever', faces: 'none', bare: true }, // the 2020 room's south door, which Google's block shows on the lawn: the room's own frame lines the hole
  front: { w: 1.2, h: 2.4, depth: 0.1, case: 'doorDark', leaf: 'doorDark', sill: 'doorDark', pull: 'bar', faces: 'none', open: true }, // where the apartment's passage meets its room: the passage's whole section, cased, no leaf
  rear: { w: 1.4, h: 2.2, depth: 0.3, case: 'doorPaint', leaf: 'doorPaint', sill: 'windowFrame', pull: 'bar', faces: 'swing' }, // the hall of 2022's back door, behind the top row: shut; the story came in by the phone
} satisfies Record<string, Door>;
/** The chapters over which the door out of Volta's room swings open: shut, it hides the hall behind it, which is not drawn until then. */
export const VOLTA_DOOR: [number, number] = [11.78 + TOUR_GAIN, 11.92 + TOUR_GAIN];
/**
 * A door in a wall that runs along x: its case and its leaf, hinged on the east jamb and opening toward +z over `swing`
 * (stage progress). `x` is the hole's middle, `y` its floor, `z` the face it opens on (the wall's north face).
 */
const doorway = (name: keyof typeof DOORS, x: number, y: number, z: number, swing: [number, number], cap: string, shut?: [number, number]): Placement[] => {
  const at: V3 = [x + hingeOff(DOORS[name]), y, z], n = name[0].toUpperCase() + name.slice(1);
  const leaf: Placement = { build: `doorLeaf${n}`, at, rot: [0, -90, 0], live: 'door', door: swing, cap, ...(shut ? { shut } : {}) };
  return (DOORS[name] as Door).bare ? [leaf] : [{ build: `doorCase${n}`, at, rot: [0, -90, 0] }, leaf];
};
/** A door that stays shut in a wall that runs along x, like `doorway` but never swinging: its case and its leaf. */
const shutDoorway = (name: keyof typeof DOORS, x: number, y: number, z: number, cap: string): Placement[] => {
  const at: V3 = [x + hingeOff(DOORS[name]), y, z], n = name[0].toUpperCase() + name.slice(1);
  return [{ build: `doorCase${n}`, at, rot: [0, -90, 0] }, { build: `doorLeaf${n}`, at, rot: [0, -90, 0], live: 'door', cap }];
};
/** A door that stays shut in a wall that runs along z, its face on the wall's west face at `x`: hinged on the north jamb. `z` is the hole's middle. */
const shutDoor = (name: keyof typeof DOORS, x: number, y: number, z: number, cap: string): Placement[] => {
  const at: V3 = [x, y, z + hingeOff(DOORS[name])], n = name[0].toUpperCase() + name.slice(1);
  return [{ build: `doorCase${n}`, at, rot: [0, 180, 0] }, { build: `doorLeaf${n}`, at, rot: [0, 180, 0], live: 'door', cap }]; // live: built by the runtime in a baked set; no `door`, so it never swings
};
/** A cased opening in a wall that runs along x: the case alone. `z` is its north face. */
const opening = (name: keyof typeof DOORS, x: number, y: number, z: number): Placement => ({ build: `doorCase${name[0].toUpperCase() + name.slice(1)}`, at: [x + hingeOff(DOORS[name]), y, z], rot: [0, -90, 0] });
/** The bin backstage by the walk along the stage, where the degree goes. The hall's own frame. */
export const STAGE_BIN: V3 = [WALK.x - 1.05, STAGE.height, 43.6];
/**
 * The harbour under the quay: every tour set holds its own (this set only), so the Bean house's window, 30 m over
 * Sydney's harbour, never sees it.
 */
const water = (): Placement => ({ build: 'walkWater', at: [0, WALK.water, 0], live: 'city', shadow: false, cap: 'The harbour.' });
/** The light of one of the walk's cities as a set carries it: the script's clear air there (walk.ts). */
const air = (city: keyof typeof CITY_AIR): Pick<StageSet, 'tint' | 'exposure' | 'envPower' | 'sun' | 'fog'> => {
  const a = CITY_AIR[city];
  return { tint: a.tint, exposure: a.exposure, envPower: a.envPower, sun: a.sun, fog: a.fog };
};

export const SETS: StageSet[] = [
  {
    // now: a studio high over Toronto at night, 4.7 by 5.0 m (CONDO): the bed along the west wall, the desk
    // on the brick east wall, glass along the whole south side with the CN Tower in it. The walk
    // starts in the north-west corner looking across the room to the glass, turns on the spot to the
    // front door in the north wall and goes straight out. The journey comes back in at the end by the
    // door in the brick: the passage east of it ends at the door at the top of Floqer's stair (world.ts).
    id: 'now', env: 'studio', tint: { sky: '#4A5F8C', ground: '#1B1E2A', power: 0.07 }, exposure: 0.72, envPower: 0.035, baked: true,
    sun: { dir: [0.2, 0.45, -0.85], color: '#8FA6D6', power: 0.2, shadow: 0.7 },
    fog: { color: '#141826', near: 8, far: 40 },
    shell: {
      x: CONDO.x, z: CONDO.z, h: CONDO.h,
      floor: 'condoFloor', wall: 'condoWall', ceiling: 'condoCeiling',
      openings: [
        { wall: 'z+', at: -5.45, w: 0.9, h: 2.05 }, // the front door, north into the passage
        { wall: 'x+', at: 1.6, w: 0.9, h: 2.05 }, // the door in the brick: shut (DOORS.brick fills it)
        { wall: 'z-', at: (CONDO.x[0] + CONDO.x[1]) / 2, w: CONDO.glass, h: CONDO.h, sill: 0 }, // the glass, floor to ceiling
      ],
    },
    props: ((): Placement[] => {
      const W = CONDO.x[0], S = CONDO.z[0], mid = (CONDO.x[0] + CONDO.x[1]) / 2, bed = S + 1.78, desk = S + 0.95; // the west wall, the glass, the room's middle; the bed's and the desk's middles along z
      return [
        { build: 'mullions', at: [mid, 0, S], scale: [CONDO.glass / 5, 1.4, 1] },
        { build: 'city', at: [mid, -185, S], live: 'city', cap: 'Toronto. The CN Tower from the 51st floor.', shadow: false },
        { build: 'nightSky', at: [mid, 0, S], live: 'city', shadow: false },
        { build: 'condoBrick', at: [CONDO.x[1], 0, 0] },
        { build: 'condoSkirting', at: [0, 0, 0] },
        // the bed along the west wall, its head on the wall
        { model: 'bed_double', at: [W + 1.2, 0, bed], rot: [0, 90, 0], cap: 'Bed. Not used enough.' },
        { model: 'nightstand_modern', at: [W + 0.35, 0, bed + 1.4] },
        { model: 'desk_lamp_arm_01', at: [W + 0.3, 0.55, bed + 1.4], rot: [0, 120, 0], scale: 0.7 },
        { model: 'wall_art_circles', at: [W + 0.035, 1.55, bed], rot: [90, 0, -90] },
        // the lantern over the bed, on the ceiling: the model stands on its rose with its shade uppermost, so it is turned over and set
        // with the shade's back 5 mm into the ceiling, its hanger and cable above the slab (until 2026-09-27 the shade was in the ceiling, cut by it, and the rose hung in the air)
        { model: 'pendant_tense', at: [W + 1.8, CONDO.h + 0.905, bed], rot: [180, 0, 0], live: 'pendant' },
        { model: 'steel_frame_shelves_01', at: [W + 0.28, 0, 1.42], rot: [0, 90, 0], scale: 0.1 }, // the scan is in centimetres
        { model: 'book_encyclopedia_set_01', at: [W + 0.28, 0.98, 1.42], rot: [0, 90, 0], scale: 0.9 },
        { model: 'book_encyclopedia_set_01', at: [W + 0.28, 1.5, 1.37], rot: [0, 90, 0], scale: 0.8 },
        { model: 'potted_plant_01', at: [W + 0.45, 0, S + 0.3], scale: 0.9 },
        // the desk on the brick, by the glass
        { build: 'rugGrey', at: [-5.1, 0, desk] },
        { build: 'desk', at: [-4.58, 0, desk], rot: [0, -90, 0], cap: 'Building Floqer. Most days, most nights.' },
        { build: 'deskHutch', at: [-4.34, 0.74, desk] },
        { build: 'hutchLed', at: [-4.34, 0.74, desk] },
        { model: 'coffee_mug', at: [-4.7, 0.74, desk + 0.42], rot: [0, 40, 0] },
        { build: 'books', at: [-4.34, 1.71, desk - 0.15], cap: 'The shelf. Mostly systems and design.' },
        { build: 'books', at: [-4.34, 1.21, desk + 0.4] },
        { build: 'badge', at: [-4.5, 1.69, desk - 0.65], cap: 'Google Code-in 2018. Grand prize.' },
        { build: 'monitor', at: [-4.56, 0.74, desk - 0.35], rot: [0, -100, 0], live: 'screen' },
        { build: 'monitorApp', at: [-4.56, 0.74, desk + 0.32], rot: [0, -80, 0], live: 'screen' },
        { model: 'laptop_14_aluminium', at: [-4.73, 0.74, desk + 0.65], rot: [0, -120, 0] },
        { model: 'keyboard_mouse_black', at: [-4.82, 0.74, desk - 0.02], rot: [0, -90, 0] },
        { build: 'pcTower', at: [-4.33, 0, desk + 0.5], rot: [0, -90, 0] },
        { model: 'desk_lamp_arm_01', at: [-4.3, 0.74, desk - 0.75], rot: [0, -150, 0], live: 'lamp', cap: 'The lamp. It is usually late.' },
        { model: 'office_chair_black', at: [-5.3, 0, desk], rot: [0, 90, 0] }, // its back away from the desk
        { model: 'wall_art_circles', at: [-4.235, 1.3, 0.1], rot: [90, 0, 90] }, // on the brick, midway between the desk's end and the door
        { build: 'discLight', at: [mid, 2.8, 0.2], live: 'pendant' },
        { model: 'shoe_rack_modern', at: [-6.45, 0, 2.0], scale: 0.8 }, // by the front door, on its west side: the brick door's passage runs east of the door and wants its corner clear
        { build: 'passageDoor', at: [-4.85, 0, 2.2], rot: [0, -90, 0], scale: [0.7, 1, 1], live: 'bulb' }, // north from the front door, 2.1 m, to the 2010 room; an end wall round the door there
        opening('front', -5.45, 0, 2.2 + DOORS.front.depth), // the passage's mouth on the room, cased: an edge where the two meet
        { build: 'doorCaseBrick', at: [-4.2, 0, 1.6 + hingeOff(DOORS.brick)], rot: [0, 180, 0] }, // the door in the brick: a cased hole onto the passage east, the way home (world.ts)
        { build: 'passageDoor', at: [-4.2, 0, 1.0], scale: [0.6, 1, 1], live: 'bulb' }, // east from the brick door, 1.8 m: at its end, the door at the top of Floqer's stair, his own front door
      ];
    })(),
  },
  {
    id: 'room', env: 'studio', tint: { sky: '#FFE6C6', ground: '#9C7B5A', power: 0.3 }, exposure: 0.8, envPower: 0.3, baked: true,
    sun: { dir: [-0.3, 0.5, -0.8], color: '#FFD9A8', power: 3.2, shadow: 0.9 },
    fog: { color: '#EFE3D0', near: 12, far: 60 },
    shell: {
      x: [-9.15, -4.95], z: [4.3, 7.9], h: 2.7,
      floor: 'roomFloor', wall: 'roomWall', ceiling: 'roomCeiling',
      openings: [
        { wall: 'z-', at: -5.45, w: 0.9, h: 2.05 }, // in from the passage, heading north
        { wall: 'x+', at: 6.6, w: 0.9, h: 2.05 }, // out to the right, east, to the lab
        { wall: 'x-', at: 5.0, w: 1.2, h: 1.3, sill: 0.95 }, // the window, Delhi outside
      ],
    },
    props: [
      // the west wall: the window (the shell cuts it), then the PC desk, the school lab's kind of machine: the 19 inch LCD with the
      // Xbox 360 standing beside it and the game on the glass, the beige keyboard and mouse, the tower underneath, the chair at it
      { model: 'wooden_table_02', at: [-8.75, 0.0, 6.5], rot: [0, 90, 0], scale: [1.4, 1, 1], cap: 'The desk. One screen for everything.' },
      { build: 'bedroomMonitor', at: [-8.85, 0.8, 6.35], rot: [0, 90, 0], live: 'tv', cap: 'Call of Duty: World at War, Nazi Zombies. Every evening.', href: 'https://www.youtube.com/results?search_query=nazi+zombies+world+at+war' },
      { build: 'keyboard', at: [-8.55, 0.8, 6.35], rot: [0, 90, 0] },
      { build: 'mouse', at: [-8.55, 0.8, 6.02], rot: [0, 90, 0] },
      { build: 'xbox360', at: [-8.85, 0.8, 6.85], rot: [0, 90, 0], cap: 'The Xbox 360. White, standing, always on.' },
      { model: 'xbox_controller', at: [-8.6, 0.8, 6.85], rot: [0, 60, 0], cap: 'The pad. Zombies until the power cut.' },
      { build: 'pcTower', at: [-8.85, 0.0, 7.05], rot: [0, 90, 0] },
      { model: 'alarm_clock_01', at: [-8.95, 0.8, 5.85], rot: [0, 90, 0] },
      { model: 'painted_wooden_chair_01', at: [-7.95, 0.0, 6.35], rot: [0, -90, 0] },
      { build: 'rug', at: [-8.2, 0.002, 6.5] },
      // the north wall: the bookshelf in the corner, the poster, the clock by the door
      { model: 'wooden_bookshelf_worn', at: [-8.55, 0.0, 7.64], rot: [0, 180, 0], scale: 0.8 },
      { model: 'book_encyclopedia_set_01', at: [-8.85, 0.99, 7.55], rot: [0, 180, 0], scale: 0.55 },
      { build: 'figures', at: [-8.55, 0.74, 7.55], rot: [0, 180, 0], cap: 'The shelf. Naruto, Goku, Luffy, Ichigo, Saitama, Levi, Vegeta.' },
      { build: 'figures', at: [-8.55, 0.51, 7.55], rot: [0, 172, 0] },
      { model: 'hanging_picture_frame_01', at: [-6.3, 1.72, 7.885], rot: [0, 180, 0] }, // a framed print, 59 by 84
      { build: 'jobsPrint', at: [-6.3, 1.72, 7.885], rot: [0, 180, 0], cap: "Here's to the crazy ones. Think different, 1997: the whole of it." },
      { model: 'wall_clock', at: [-5.15, 1.9, 7.88], rot: [0, 180, 0] }, // in the corner by the door out, where the turn looks
      { model: 'football', at: [-7.4, 0.11, 7.3], rot: [0, 50, 0], cap: 'Barcelona. Messi.' },
      { model: 'ceiling_fan', at: [-7.05, 2.7, 6.1], rot: [0, 90, 0], live: 'fan', cap: 'The ceiling fan. Delhi summers.' },
      // the window: an aluminium two-track slider in the wall with the safety grille outside and a marble sill inside; the
      // curtains on their rod; outside, the neighbour's house across the lane, a neem, and the haze of a Delhi afternoon
      { build: 'bedroomWindow', at: [-9.15, 0.95, 5.0], rot: [0, 90, 0], cap: 'The window. The grille, the slider, the sill.' },
      { build: 'curtains', at: [-9.07, 2.45, 5.0], rot: [0, 90, 0], live: 'curtain' },
      { build: 'neighbourHouse', at: [0, 0, 0], shadow: false },
      { model: 'island_tree_01', at: [-13.4, -3.2, 7.6], rot: [0, 40, 0], scale: 1.15, shadow: false },
      { build: 'skyline', at: [-30, 6, 5.0], rot: [0, 90, 0], scale: 10 },
      { build: 'passage', at: [-4.95, 0, 6.0], scale: [0.6, 1, 1], live: 'bulb' }, // east, 1.8 m, to the lab
    ],
  },
  {
    id: 'lab', env: 'studio', tint: { sky: '#F1F0EA', ground: '#A6ADB3', power: 0.3 }, exposure: 0.72, envPower: 0.5, baked: true,
    sun: { dir: [-0.2, 0.9, 0.3], color: '#EEF3FF', power: 1.6, shadow: 0.6 },
    fog: { color: '#E6ECF1', near: 14, far: 70 },
    shell: {
      x: [-3.15, 2.05], z: [4.7, 9.7], h: 3.0,
      floor: 'labFloor', wall: 'labWall', ceiling: 'labCeiling',
      openings: [
        { wall: 'x-', at: 6.6, w: 0.9, h: 2.05 }, // in from the 2010 room, heading east down the aisle
        { wall: 'z-', at: 1.4, w: 0.9, h: 2.05 }, // out to the right, south, to the plaza
        { wall: 'z+', at: -0.55, w: 4.0, h: 0.7, sill: 2.1 }, // the high window strip over the long bench
      ],
    },
    props: [
      // a computer lab of 2013: one long bench along the north wall and a short one along the south, identical stations
      // (LCD, keyboard, mouse, a tower under the bench), grey partitions between them, office chairs, tiles overhead
      { build: 'labBench', at: [-0.55, 0, 9.35], rot: [0, 180, 0] },
      { build: 'labBenchShort', at: [-1.5, 0, 5.05], rot: [0, 0, 0] },
      ...STATIONS_A.map((x, i): Placement => ({
        build: i === 1 ? 'labMonitorNotepad' : 'labMonitor', at: [x, 0.74, 9.5], rot: [0, 180, 0], live: 'screen',
        ...(i === 1 ? { cap: 'index.html in Notepad. The first website.' } : {}),
      })),
      ...STATIONS_A.map((x): Placement => ({ build: 'keyboard', at: [x, 0.74, 9.18], rot: [0, 180, 0] })),
      ...STATIONS_A.map((x): Placement => ({ build: 'mouse', at: [x - 0.3, 0.74, 9.18], rot: [0, 180, 0] })),
      ...STATIONS_A.map((x): Placement => ({ build: 'pcTower', at: [x - 0.3, 0, 9.4], rot: [0, 180, 0] })),
      ...STATIONS_A.map((x): Placement => ({ model: 'office_chair_black', at: [x, 0, 8.62] })),
      ...[-1.975, -1.025, -0.075, 0.875].map((x): Placement => ({ build: 'partition', at: [x, 0.74, 9.35], rot: [0, 180, 0] })),
      ...STATIONS_B.map((x): Placement => ({ build: 'labMonitor', at: [x, 0.74, 4.9], live: 'screen' })),
      ...STATIONS_B.map((x): Placement => ({ build: 'keyboard', at: [x, 0.74, 5.22] })),
      ...STATIONS_B.map((x): Placement => ({ build: 'mouse', at: [x + 0.3, 0.74, 5.22] })),
      ...STATIONS_B.map((x): Placement => ({ build: 'pcTower', at: [x + 0.3, 0, 5.0] })),
      ...STATIONS_B.map((x): Placement => ({ model: 'office_chair_black', at: [x, 0, 5.78], rot: [0, 180, 0] })),
      ...[-1.975, -1.025].map((x): Placement => ({ build: 'partition', at: [x, 0.74, 5.05] })),
      { build: 'whiteboard', at: [-3.12, 1.5, 8.5], rot: [0, 90, 0], cap: 'Wireframes sketched in class.' },
      { build: 'banner', at: [-3.12, 2.55, 7.9], rot: [0, 90, 0], cap: 'Converge Clan.' },
      { build: 'teamPhoto', at: [2.02, 1.55, 7.6], rot: [0, 270, 0] },
      { model: 'wall_clock', at: [2.02, 2.4, 8.9], rot: [0, 270, 0] },
      ...[[-1.85, 8.1], [0.75, 8.1], [-1.85, 6.0], [0.75, 6.0]].map(([x, z]): Placement => ({ build: 'tube', at: [x, 2.95, z], live: 'tube' })),
      { build: 'doorFrame', at: [1.4, 0, 4.7] },
      { build: 'passage', at: [0.8, 0, 4.7], rot: [0, 90, 0], scale: [0.7, 1, 1], live: 'bulb' }, // south, 2.1 m, to the plaza
    ],
  },
  {
    // 2019: Google, the Googleplex. Out of the lab's passage onto the Android lawn: the statues along it to the east, the
    // bikes, the trees, the Google letters at the end of the path; down the path and left to the door in the block's
    // face, where the boardroom's glass door was: it opens as he comes to it, onto Delhi, 2020. One June afternoon.
    // docs/rebuild/30-googleplex-options.md; the boardroom of layout A was taken out on 2026-09-27 (36).
    id: 'google', env: 'sky', tint: { sky: '#CFE4F7', ground: '#9DAF7C', power: 0.3 }, exposure: 0.9, envPower: 0.7, baked: true,
    sun: { dir: [0.35, 0.82, -0.45], color: '#FFF3DC', power: 2.6, shadow: 1 }, // high, a little south-east: the statues' tops and the block's face lit, the walk in its shade
    fog: { color: '#C6D8E6', near: 80, far: 500 },
    props: [
      ...(() => {
        const out: Placement[] = [];
        out.push({ build: 'facade', at: [0, 0, 0], cap: 'Google. Mountain View, June 2019.', href: 'https://codein.withgoogle.com/archive/2018/' }); // the outside of the rooms we came through, and the block on the lawn
        // the lawn and the path down the block's face, its spur to the door
        out.push({ build: 'lawn', at: [0, 0, 0] });
        out.push({ build: 'lawnPath', at: [0, 0.015, 0] });
        // the Android lawn: the statues in a row to the east of the path, each facing it (docs/rebuild/30-googleplex-options.md)
        out.push({ build: 'bugdroid', at: [6.4, 0, 1.6], rot: [0, -90, 0], cap: 'The Android lawn at the Googleplex.' });
        out.push({ build: 'statueCupcake', at: [7.6, 0, -0.6], rot: [0, -90, 0] });
        out.push({ build: 'statueDonut', at: [6.6, 0, -2.8], rot: [0, -90, 0] });
        out.push({ build: 'statueGingerbread', at: [7.8, 0, -5.0], rot: [0, -90, 0] });
        out.push({ build: 'statueJellyBean', at: [6.4, 0, -7.0], rot: [0, -90, 0] });
        out.push({ model: 'android_honeycomb', at: [8.6, 0, -7.6], rot: [0, 90, 0], cap: 'Honeycomb, on the lawn since 2011.' });
        out.push({ build: 'statueKitKat', at: [6.6, 0, -9.6], rot: [0, -90, 0] });
        out.push({ build: 'statueLollipop', at: [7.4, 0, -11.8], rot: [0, -90, 0] });
        out.push({ build: 'statueMarshmallow', at: [6.6, 0, -14.0], rot: [0, -90, 0] });
        out.push({ build: 'statueOreo', at: [8.2, 0, -15.8], rot: [0, -90, 0] });
        out.push({ build: 'statuePie', at: [7.0, 0, -17.6], rot: [0, -90, 0] });
        out.push({ build: 'googleLetters', at: [3.9, 0, -11.6], cap: 'Google.' }); // at the end of the path, facing back up it
        // his own photographs of the trip, framed on the block's face by the door: he asked for them there (2026-09-27)
        const wall = GOOGLE.block.x[1] + 0.07;
        out.push({ build: 'tripPhotoAward', at: [wall, GOOGLE.photos.y, GOOGLE.photos.z[0]], rot: [0, 90, 0], cap: 'The award. Google Code-in 2018, grand prize winner, June 27, 2019.', href: 'https://codein.withgoogle.com/archive/2018/' });
        out.push({ build: 'tripPhotoSign', at: [wall, GOOGLE.photos.y, GOOGLE.photos.z[1]], rot: [0, 90, 0], cap: 'Google, San Francisco. June 2019.' });
        // the bikes by the mouth, the trees, the far blocks of the campus, redwoods behind
        out.push({ build: 'bikeRack', at: [3.5, 0, 1.0] });
        out.push({ build: 'gbike', at: [3.2, 0, 1.0], cap: 'A Google bike.' });
        out.push({ build: 'gbike', at: [3.85, 0, 1.0], rot: [0, 4, 0] });
        out.push({ build: 'campusFar', at: [0, 0, 0], cap: 'The campus, Mountain View.' });
        for (const [x, z, s] of [[17.5, -1, 0.85], [19, 8, 0.9], [16, -21, 0.9], [14, -30, 1.0], [22, -33, 1.15], [30, -31, 0.9], [38, -26, 1.1], [42, -12, 1.0], [40, 4, 0.95], [34, 14, 1.05], [22, 17, 0.9], [-8, -18, 1.0], [-2, -22, 1.1]] as const)
          out.push({ build: 'redwood', at: [x, 0, z], scale: s });
        out.push({ build: 'clouds', at: [0, 0, 0], rot: [0, 30, 0], live: 'sky', shadow: false });
        return out;
      })(),
    ],
  },
  {
    // 2020: back in Delhi, the room at home during Covid, at night, where Webcube was run: 3.1 by 3.6 m, in from the
    // plaza through the south door, the wide desk dead ahead on the north wall (two monitors, two laptops, the PC, a
    // shelf of books over it and a shelf of awards over that), the single bed on the right along the east wall under
    // a drawn curtain, the mess on the floor; then left, west, through the passage to the brick door of the studio.
    id: 'delhi', env: 'studio', tint: { sky: '#7A6A58', ground: '#2A2119', power: 0.14 }, exposure: 0.7, envPower: 0.12, baked: true,
    sun: { dir: [0.3, 0.6, -0.75], color: '#FFD2A0', power: 0.5, shadow: 0.8 },
    fog: { color: '#1A1612', near: 10, far: 50 },
    shell: {
      x: [-2.4, 0.7], z: [0, 3.6], h: 2.7,
      floor: 'roomFloor', wall: 'delhiWall', ceiling: 'delhiCeiling',
      openings: [
        { wall: 'z-', at: -0.7, w: 0.9, h: 2.05 }, // in from the plaza, heading north
        { wall: 'x-', at: 1.6, w: 0.9, h: 2.05 }, // out to the left, west, into the passage to the brick door
      ],
    },
    props: [
      { build: 'doorFrame', at: [-0.7, 0, 0] },
      // the leaf in it: the door Google's block shows on the lawn (DELHI), opening into the room as he comes to it
      ...doorway('google', -0.7, 0, 0.15, [approach(0.768), approach(0.797)], 'The door off the lawn: Delhi, 2020.', [ch(4.68), ch(4.76)]), // it opens as he turns to it from the photographs, and shuts behind him before the west door opens: the lawn and the aircraft outside it are never in view together
      // the desk on the north wall, its back against it
      { build: 'deskWide', at: [-1.1, 0, 3.2], rot: [0, 180, 0], cap: 'Webcube. 45 companies, six countries, 25 people, from this desk.' },
      { build: 'monitor', at: [-1.45, 0.74, 3.38], rot: [0, 172, 0], live: 'screen' },
      { build: 'monitorBoard', at: [-0.8, 0.74, 3.38], rot: [0, 190, 0], live: 'screen', cap: 'Webcube. A team of 25, working across multiple countries.' },
      { model: 'laptop_14_aluminium', at: [-2.0, 0.74, 3.08], rot: [0, 205, 0] },
      { build: 'laptop', at: [-0.37, 0.74, 2.98], rot: [0, 160, 0], live: 'screen', cap: 'Covid Leads Delhi. 20,000 people, beds and oxygen, two months.' },
      { model: 'keyboard_mouse_black', at: [-1.15, 0.74, 2.9], rot: [0, 180, 0] },
      { build: 'pcTower', at: [-0.15, 0.74, 3.35], rot: [0, 180, 0] },
      { build: 'cables', at: [-0.55, 0, 3.45] },
      { model: 'desk_lamp_arm_01', at: [-2.05, 0.74, 3.42], rot: [0, -60, 0], live: 'lamp', cap: 'The desk lamp.' },
      { model: 'coffee_mug', at: [-0.62, 0.74, 2.98], rot: [0, 30, 0] },
      { model: 'coffee_mug', at: [-1.78, 0.74, 3.34], rot: [0, -70, 0] },
      { build: 'papers', at: [-1.82, 0.74, 2.94], rot: [0, 15, 0] },
      { model: 'office_chair_black', at: [-1.35, 0, 2.3], rot: [0, -20, 0] },
      // the shelves above: books, then the awards
      { build: 'wallShelf', at: [-1.1, 1.5, 3.48], rot: [0, 180, 0] },
      { build: 'books', at: [-1.95, 1.5, 3.48], rot: [0, 90, 0] },
      { build: 'books', at: [-1.43, 1.5, 3.48], rot: [0, 90, 0] },
      { build: 'books', at: [-0.91, 1.5, 3.48], rot: [0, 90, 0], cap: 'Books on the shelf above the desk.' },
      { model: 'book_encyclopedia_set_01', at: [-0.05, 1.5, 3.44], rot: [0, 180, 0], scale: 0.7 },
      { build: 'wallShelf', at: [-1.1, 2.0, 3.48], rot: [0, 180, 0] },
      { build: 'awards', at: [-1.1, 2.0, 3.5], rot: [0, 180, 0], cap: 'Awards of different shapes and sizes, on the top shelf.' },
      // the bed along the east wall under the drawn curtain
      { model: 'bed_single', at: [0.28, 0, 1.3], rot: [0, 90, 0], cap: 'The single bed beside the desk.' },
      { build: 'curtainDrawn', at: [0.66, 2.4, 1.5], rot: [0, -90, 0], scale: [1, 0.85, 1], cap: 'The curtain, drawn. 2020.' },
      { build: 'clothes', at: [0.2, 0.57, 0.75], rot: [0, 20, 0] },
      // the mess
      { build: 'clothes', at: [-1.75, 0, 1.15], rot: [0, -35, 0] },
      { build: 'cartons', at: [-1.9, 0, 0.85], rot: [0, 100, 0], cap: 'Boxes in the corner.' }, // clear of the south wall: the open one stood through it, onto the lawn
      { build: 'papers', at: [-0.15, 0, 2.45], rot: [0, 50, 0] },
      { build: 'bin', at: [-2.15, 0, 2.55] },
      { model: 'coffee_mug', at: [0.1, 0, 2.55], rot: [0, 110, 0] },
      { model: 'ceiling_fan', at: [-0.85, 2.7, 1.8], live: 'fan' },
      { build: 'discLight', at: [-0.85, 2.7, 2.6], live: 'pendant' },
      { build: 'doorLeaf', at: [-2.4, 0, 2.05], rot: [0, 180, 0], live: 'door', door: [ch(4.745), ch(4.92)] }, // the west door: hinged on the north jamb, it swings open into the bridge as the walk turns to it, well before the jamb at chapter 3.99
    ],
  },
  {
    // 2022, the crossing: the jet bridge, the cabin, the port window seat; Halifax 400 m down in afternoon sun, hazed with distance
    id: 'flight', env: 'studio', baked: true,
    tint: { sky: '#D8E8F2', ground: '#B8BCC0', power: 0.4 }, exposure: 0.8, envPower: 0.5,
    sun: { dir: [0.55, 0.7, 0.45], color: '#FFF8EE', power: 2.4, shadow: 0.7 },
    fog: { color: '#C9D9E4', near: 700, far: 5200 },
    props: [
      { build: 'boardingPassage', at: [0, 0, 0] },
      { build: 'aircraftCabin', at: [0, 0, 0] },
      { build: 'aircraftSkin', at: [0, 0, 0], shadow: false },
      ...CABIN.rows.flatMap((z) => CABIN.seatsX.map((x): Placement => ({ build: 'aircraftSeat', at: [x, 0, z] }))),
      // the moving map on the back of every seat that has a row behind it, and on the front bulkhead
      ...CABIN.rows.slice(1).flatMap((z) => CABIN.seatsX.map((x): Placement => ({ build: 'seatScreen', at: [x, 1.06, z + 0.34], live: 'screen' }))),
      { build: 'bulkheadScreen', at: [CABIN.cx, 1.45, CABIN.z[0] + 0.03], live: 'screen', cap: 'Delhi to Halifax, 2022. The descent over the peninsula.' },
      { build: 'aircraftWing', at: [0.43, 0, 6.4] }, // the root at the new wall, the wing and its engine behind the door: the rows are ahead of it, as an E175's front rows are
      { build: 'flightSky', at: [0, 0, 0], live: 'flight', shadow: false },
      // the world under the aircraft: it sinks and slides with the descent (flight.ts), rolls with the bank
      { build: 'halifax', at: [0, 0, 0], live: 'flight', cap: 'Halifax. The peninsula, the Northwest Arm, the harbour, from OpenStreetMap.', href: '/assets/stage/FLIGHT-CREDITS.md' },
      { build: 'dalhousie', at: [0, 0, 0], live: 'flight', cap: 'Dalhousie University, the Studley campus: the Henry Hicks tower, the Killam, the quad, Wickwire Field. From OpenStreetMap.', href: '/assets/stage/FLIGHT-CREDITS.md' },
      { model: 'dalhousie_campus', at: [HALIFAX_CAMPUS[0], 0, HALIFAX_CAMPUS[1]], rot: [0, 90, 0], live: 'flight', cap: 'The Goldberg Computer Science Building.', href: '/assets/stage/FLIGHT-CREDITS.md' },
      { build: 'cloudField', at: [0, 0, 0], live: 'flight', shadow: false },
      { build: 'halifaxSign', at: [-2.735, 2.0, -3.6], rot: [0, -90, 0], live: 'screen', cap: '2022. Leaving Delhi for Halifax, Canada.' },
      ...[-1.8, 0.5].map((z): Placement => ({ build: 'discLight', at: [-3.35, 2.4, z], live: 'pendant', scale: 0.65 })), // the bridge's two; the cabin's light is its own strips
      { build: 'discLight', at: [-3.3, 2.4, 1.6], live: 'pendant', scale: 0.65 }, // the first section of the bridge, by the Delhi door
    ],
  },
  {
    // 2022, arrived: a 96-seat stepped auditorium at Dalhousie, seen first from the very back row, then from behind the
    // lectern with the whole hall in front. No windows: downlights over every second tier, a warm key on the front,
    // the projection screen coming down over the board for the Generative AI lecture.
    id: 'halifax', env: 'studio', baked: true,
    tint: { sky: '#E6ECF2', ground: '#B5AC94', power: 0.45 }, exposure: 0.82, envPower: 0.6,
    sun: { dir: [0.2, 0.9, 0.35], color: '#FFF0CF', power: 1.6, shadow: 0.8 },
    fog: { color: '#DEE7EC', near: 30, far: 200 },
    shell: { x: [-1.4, 11.2], z: [-17.4, -2], h: 6.6, floor: 'lectureFloor', wall: 'lectureWall', ceiling: 'labCeiling', openings: [
      { wall: 'x-', at: -15.8, w: 1.2, h: 2.2 },
      { wall: 'z+', at: 4.9, w: 1.4, h: 2.2, sill: TOP_ROW.height },
    ] },
    props: [
      { build: 'lectureBoard', at: [4.9, 2.45, -17.22], scale: 1.55, live: 'screen', cap: 'Computer science at Dalhousie University. Halifax, Nova Scotia.' },
      { build: 'dalhousieSign', at: [4.9, 4.34, -17.2], scale: 1.3, live: 'screen' },
      { build: 'projectorScreen', at: [4.9, 6.3, -16.85], live: 'drop', drop: [ch(6.53), ch(7.06), 2.2], cap: 'Generative AI. The lecture: transformers, attention, what a model is and is not.' },
      { build: 'lectureTiers', at: [0, 0, 0] },
      { build: 'auditoriumInterior', at: [0, 0, 0] },
      { build: 'lectern', at: [DAIS.lectern[0], DAIS.height, DAIS.lectern[1]], cap: 'The lectern. ShiftKey Labs: curriculums, certificates in hundreds of hands.' },
      { build: 'laptopSlide', at: [DAIS.lectern[0], DAIS.height + 1.12, DAIS.lectern[1] + 0.02], rot: [0, 180, 0], live: 'screen' },
      ...[0, 2, 4, 6].flatMap((i) => [2.1, 4.9, 7.7].map((x): Placement => ({ build: 'downlight', at: [x, 6.6, LECTURE_ROWS[i].seat + 0.6], live: 'downlight' }))),
      ...[2.6, 4.9, 7.2].map((x): Placement => ({ build: 'downlight', at: [x, 6.6, -16.0], live: 'downlight' })),
      ...LECTURE_ROWS.flatMap((row) => AUDITORIUM.seatXs.map((x): Placement => ({
        build: row === TOP_ROW && x === AUDITORIUM.studyX ? 'auditoriumStudySeat' : 'auditoriumSeat',
        at: [x, row.height, row.seat],
      }))),
      { model: 'laptop_14_aluminium', at: [AUDITORIUM.studyX, TOP_ROW.height + AUDITORIUM.tabletHeight, TOP_ROW.seat - 0.47], live: 'monitor', screen: 'studyScreen', cap: 'Seated at the very back of a 96-seat Dalhousie computer science auditorium.' },
      { build: 'studyNotes', at: [AUDITORIUM.studyX + 0.16, TOP_ROW.height + AUDITORIUM.tabletHeight + 0.015, TOP_ROW.seat - 0.32], scale: 0.35, live: 'screen', rot: [0, 6, 0] },
      { model: 'wall_clock', at: [10.85, 3.35, -17.22] },
      { build: 'doorLeafWide', at: [-1.4, 0, -15.2], rot: [0, 180, 0], live: 'door', door: [ch(7.86), ch(8)] }, // the front west door: hinged on the north jamb, it swings into Sydney ahead of the walk
      ...[-15.3, -11.6, -7.9, -4.2].flatMap((z) => [1.4, 4.9, 8.4].map((x): Placement => ({ build: 'tube', at: [x, 6.48, z], scale: 1.5, live: 'tube' }))),
      { build: 'halifaxSign', at: [-1.37, 2.68, -15.8], rot: [0, 90, 0], live: 'screen' },
      ...shutDoorway('rear', 4.9, TOP_ROW.height, -2 + DOORS.rear.depth, 'The back door of the hall. The flight brought him in by the phone; in the Walk, the way back to it.'),
    ],
  },
  {
    // 2024, Sydney: the hacker house where Bean was built. A small room in from the auditorium's front door on the
    // east wall: one plywood table on trestles in the middle under two pendants, monitors back to back on it with the
    // wires between them dropping to a power strip, laptops, the phone, mugs, papers; three mismatched chairs; two
    // air mattresses on the floor along the walls; the whiteboard on the north wall; the window on the harbour in the
    // west wall with the Bean sign above it; the Opera House close across the water, the bridge and the city behind.
    id: 'sydney', env: 'studio', tint: { sky: '#C9D8E6', ground: '#6B5A48', power: 0.4 }, exposure: 0.95, envPower: 0.5, baked: true,
    sun: { dir: [-0.8, 0.55, -0.25], color: '#FFE0B0', power: 2.2, shadow: 0.85 },
    fog: { color: '#6BA3DA', near: 150, far: 900 }, // the sky's blue: the painted harbour runs into it above and beside the window
    shell: {
      x: [-7.4, -1.4], z: [-18.2, -13.2], h: 2.9,
      floor: 'sydneyFloor', wall: 'sydneyWall', ceiling: 'delhiCeiling',
      openings: [
        { wall: 'x+', at: -15.8, w: 1.2, h: 2.2 }, // in from the auditorium, heading west
        { wall: 'x-', at: -15.7, w: 4.0, h: 1.55, sill: 0.75 }, // the window on the harbour
        { wall: 'z-', at: -6.85, w: 0.9, h: 2.05 }, // out to the street beside the window, heading south: Vancouver
      ],
    },
    props: [
      // the room is 30 m up: the water, the headland and the Opera House sit below the window, the whole building in frame from the table
      { build: 'sydneyHarbour', at: [-440.0, 54.0, -30.0], live: 'city', shadow: false, cap: 'Sydney Harbour: the bridge, the city, a ferry crossing.' },
      { build: 'harbourWater', at: [-7.4, -30.6, -15.7], live: 'city', shadow: false },
      { build: 'bennelongPoint', at: [-190, -30, -5], live: 'city', shadow: false },
      { model: 'sydney_opera_house', at: [-262, -26.7, -30], rot: [0, -90, 0], scale: 4.9, live: 'city', shadow: false, cap: 'The Opera House across the water. Model by Nick Reinhardt, CC BY.', href: '/assets/stage/CREDITS.md' }, // the model is a 1:4.9 miniature: at 4.9 the shells stand 60 m and the podium 184 m, as built
      { build: 'sydneyWindow', at: [-7.4, 0.75, -15.7], rot: [0, 90, 0] },
      { build: 'beanSign', at: [-7.39, 2.58, -15.7], rot: [0, 90, 0], live: 'screen', cap: 'Bean. Your kitchen assistant.' },
      // the table (x -6.1..-3.1, z -16.4..-15.0, top 0.74): two rows of older monitors back to back down the middle facing
      // their chairs, keyboards in front of them, a laptop at each end, the wires laid between them to the strip on the floor
      { build: 'hackerTable', at: [-4.6, 0, -15.7], cap: 'The hacker house table. Bean was built here: pantry, recipes, the week, the shopping list.' },
      { build: 'monitorOldApp', at: [-5.3, 0.74, -15.55], rot: [0, 2, 0], live: 'screen', cap: 'The app in a design tool: pantry, this week, shopping.' },
      { build: 'monitorOldCode', at: [-3.95, 0.74, -15.55], rot: [0, -4, 0], live: 'screen' },
      { build: 'monitorOldPH', at: [-4.6, 0.74, -15.85], rot: [0, 177, 0], live: 'screen', cap: 'Launch day on Product Hunt. Number four Product of the Day.' },
      { build: 'monitorOldBeanCode', at: [-5.85, 0.74, -15.85], rot: [0, 184, 0], live: 'screen', cap: 'Recipe adapt: tell Bean what to change and it rewrites the recipe as you type.' },
      { model: 'keyboard_mouse_black', at: [-5.3, 0.74, -15.15], rot: [0, 0, 0] },
      { model: 'keyboard_mouse_black', at: [-4.6, 0.74, -16.2], rot: [0, 180, 0] },
      { build: 'laptopBean', at: [-3.45, 0.74, -15.4], rot: [0, -8, 0], live: 'screen', cap: 'Bean on the laptop.' },
      { model: 'laptop_14_aluminium', at: [-3.6, 0.74, -16.05], rot: [0, 172, 0] },
      { build: 'phoneBean', at: [-4.55, 0.74, -15.25], rot: [0, 25, 0], live: 'screen', cap: 'Bean on the phone: your kitchen assistant.' },
      { build: 'wires', at: [-4.6, 0, -15.7], cap: 'The wires.' },
      { model: 'coffee_mug', at: [-5.95, 0.74, -16.3], rot: [0, 40, 0] },
      { model: 'coffee_mug', at: [-3.2, 0.74, -16.35], rot: [0, -60, 0] },
      { model: 'coffee_mug', at: [-6.0, 0.74, -15.15], rot: [0, 110, 0] },
      { build: 'papers', at: [-4.15, 0.74, -16.25], rot: [0, -12, 0] },
      { build: 'papers', at: [-5.75, 0.74, -15.15], rot: [0, 10, 0] },
      { model: 'office_chair_black', at: [-5.3, 0, -14.72], rot: [0, 180, 0] },
      { model: 'SchoolChair_01', at: [-3.8, 0, -14.72], rot: [0, 170, 0] },
      { model: 'office_chair_black', at: [-4.6, 0, -16.95], rot: [0, 8, 0] },
      { model: 'pendant_tense', at: [-5.4, 1.86, -15.7], live: 'pendant' },
      { model: 'pendant_tense', at: [-3.8, 1.86, -15.7], live: 'pendant' },
      // the floor: two air mattresses along the walls
      { build: 'airMattress', at: [-3.4, 0, -13.66], rot: [0, 0, 0], cap: 'An air mattress. A hacker house: you sleep where you ship.' },
      { build: 'airMattress', at: [-3.2, 0, -17.7], rot: [0, 4, 0] },
      { model: 'throw_pillows_01', at: [-1.9, 0.0, -17.3], rot: [0, 30, 0], scale: 0.7 },
      ...doorway('sydney', -6.85, 0, -18.2, [ch(8.56), ch(8.7)], 'The door out of the Bean house.'), // the south door beside the window: it opens into the room, clear of the walk down the west side
      { build: 'bin', at: [-1.85, 0, -14.7] },
      // the walls
      { build: 'whiteboardBean', at: [-4.4, 1.5, -13.26], rot: [0, 180, 0], live: 'screen', scale: 0.85, cap: 'The whiteboard. How Bean works, and launch week.' },
      { model: 'wall_clock', at: [-1.44, 2.3, -17.4], rot: [0, -90, 0] },
      { build: 'discLight', at: [-2.4, 2.9, -14.3], live: 'pendant' },
    ],
  },
  {
    // 2025, Vancouver in May, a bright overcast: out of the Bean house's south door onto the promenade. The walk itself
    // stands in this set, all 60 m of it (the paving, the quay, the rail, the lamps, the trees in their seasons, the
    // track, Volta's building at the end) and shows from the sets either side; Vancouver is what stands beyond it: the
    // North Shore over the inlet, Canada Place's sails, a seaplane taking off up the harbour, Coupland's pixel whale
    // going up cube by cube on the land side. Lit live: the light changes along the walk (walk.ts).
    id: 'vancouver', env: 'sky', sky: 'vancouver', ...air('vancouver'), outdoor: true, also: [10], // Volta's door stands in its building from the walk's first step
    props: [
      water(),
      { build: 'promenade', at: [0, 0, 0], cap: 'The promenade along the harbour.' },
      { build: 'walkLand', at: [0, 0, 0], shadow: false },
      { build: 'beanHouse', at: [0, 0, 0], cap: 'The Bean house from outside.' },
      { build: 'quayRail', at: [0, 0, 0] },
      { build: 'tramTrack', at: [0, 0, 0], cap: 'The streetcar track along Queens Quay.' },
      { build: 'voltaBlock', at: [0, 0, 0], live: 'glow', cap: 'Volta, Halifax.' },
      ...WALK_LAMPS.map((z): Placement => ({ build: 'walkLamp', at: [WALK.path[0] + 0.55, 0, z], live: 'walkLamp' })),
      // the walk's trees; the two that would stand in the street out of Volta's side window are gone once it is there
      ...WALK_TREES.map((t): Placement => ({ build: `walkTree${t.kind}`, at: [t.x, 0, t.z], rot: [0, t.turn, 0], scale: t.size, ...(t.x > VOLTA_VIEW.east[0] && t.x < VOLTA_VIEW.east[3] + 30 && t.z > VOLTA_VIEW.eastRow[0] ? { indoor: 'out' as const } : {}) })),
      ...SIGNS.map((g, i): Placement => ({ build: `logoSign${i}`, at: [g.x, 0, g.z], rot: [0, 40, 0], live: 'glow', cap: g.name })), // each city's mark, standing on his left, turned to him as he comes
      // the benches along the land side's kerb face the walk and the water, their backs to the land
      // no bench by Web Summit's mark: the one there stood across it, and he had it taken out (2026-09-27)
      { build: 'walkBench', at: [WALK.path[1] - 0.45, 0, 9.0], rot: [0, 90, 0] },
      // each stands clear of the lines from the walk to the marks, while a mark is looked at
      { build: 'walkBench', at: [WALK.path[1] - 0.45, 0, 18.6], rot: [0, 90, 0] },
      { build: 'walkBench', at: [WALK.path[1] - 0.45, 0, 29.4], rot: [0, 90, 0] },
      // Vancouver, beyond the walk
      { build: 'northShore', at: [0, WALK.water, 60], live: 'city', shadow: false, cap: 'The North Shore: Cypress, Grouse and Seymour over Burrard Inlet, from real elevation data.' },
      { build: 'canadaPlaceSails', at: [-260, WALK.water, 250], rot: [0, 78, 0], live: 'city', shadow: false, cap: 'Canada Place: the five sails over the pier.' },
      { model: 'digital_orca', at: [ORCA.x, 0.3, ORCA.z], rot: [0, 150, 0], scale: 0.75, cap: "Digital Orca, Douglas Coupland's sculpture beside the Convention Centre." },
      { build: 'orcaPlinth', at: [ORCA.x, 0, ORCA.z], rot: [0, 150, 0] },
      { build: 'vancouverTowers', at: [0, 0, 0], live: 'city', shadow: false, cap: 'Coal Harbour: glass towers on their podiums, set back from the water.' },
      { build: 'seaplane', at: [-48, WALK.water, -34], live: 'mover', mover: 'seaplane', cap: 'A Harbour Air seaplane off Coal Harbour.' },
    ],
  },
  {
    // 2025, Toronto in October, the golden hour: the same walk, the mist off the lake lifting on the city on the land
    // side with the tower over it, a streetcar coming up the track from behind and drawing up at the stop ahead, the
    // maples turned, leaves coming down across the paving, the islands low across the water.
    id: 'toronto', env: 'sky', sky: 'toronto', ...air('toronto'), outdoor: true,
    props: [
      water(),
      // the city across the harbour, the way it stands from the Islands: the tower 1.4 km off and 20 degrees to the right of the walk's line, downtown to the right of it
      { build: 'torontoWalk', at: [-490, WALK.water, 1320], rot: [0, -110, 0], live: 'city', shadow: false, cap: 'Downtown Toronto and the CN Tower across the harbour: the real blocks, from OpenStreetMap. Elevate, October 2025.' },
      { model: 'ttc_flexity', at: [TRACK.x, 0.03, TRACK.from], rot: [0, -90, 0], live: 'mover', mover: 'streetcar', cap: 'A TTC streetcar: the Flexity Outlook, the fleet since 2019.' },
    ],
  },
  {
    // 2026, Halifax in January, dusk: snow on the boards and coming down, the lamps lit, the ferry crossing to Dartmouth
    // with its windows lit, the Macdonald Bridge beyond it, downtown climbing the hill on the land side to the Town
    // Clock; and at the end of the walk Volta's building, its top floor lit. In at its door, which shuts behind him,
    // into Volta's floor as it is (docs/rebuild/40-volta-interior-reference.md), on the walk's own level: the slab and
    // its ducts black, black ring lights and loose linear ones, warm grey carpet and walls, fat white columns, the
    // glass leaning in along the whole west side over a white sill, the reception's plank wall and desk on the east,
    // white tables and chairs, tub chairs at the glass, Collect.'s slide thrown on the north wall. Nothing outside
    // moves as he goes in (2026-09-27). He goes up to the high table and turns to the room; then the door into the
    // wing. No figures: he found them weird (2026-09-27).
    id: 'halifaxVolta', env: 'sky', sky: 'halifax', ...air('halifax'), also: [8], baked: true, bakedEnvironment: true,
    // the room is baked as a room at dusk: its strips and rings light it, the last of the day comes in at the glass
    bake: { env: 'studio', tint: { sky: '#5F6FA6', ground: '#2A2622', power: 0.22 }, envPower: 0.05, sun: { dir: [-0.55, 0.3, 0.78], color: '#8EA2D8', power: 0.1, shadow: 0.4 }, view: { cam: [WALK.x, 1.6, WALK.volta.z[0] + 2.2], look: [WALK.x - 2.2, 1.3, WALK.volta.z[1]], fov: 74 } },
    shell: {
      x: WALK.volta.x, z: WALK.volta.z, h: WALK.volta.h,
      floor: 'voltaFloor', wall: 'voltaWall', ceiling: 'voltaDuct',
      openings: [
        { wall: 'z-', at: WALK.x, w: DOORS.voltaIn.w, h: DOORS.voltaIn.h, door: true }, // the door in off the walk
        { wall: 'x-', at: (WALK.volta.z[0] + WALK.volta.z[1]) / 2, w: WALK.volta.z[1] - WALK.volta.z[0] - 0.2, h: WALK.volta.h - 0.02 }, // the harbour side is glass: open in the shell, voltaGlass fills it
        { wall: 'x+', at: (WALK.volta.east[0] + WALK.volta.east[1]) / 2, w: WALK.volta.east[1] - WALK.volta.east[0], h: 2.3, sill: 0.8 }, // the window on downtown
        { wall: 'z+', at: WALK.x, w: 1.2, h: 2.1, door: true }, // the door into the wing
      ],
    },
    props: [
      water(),
      { build: 'voltaGlass', at: [0, 0, 0], cap: 'Volta, Halifax: the harbour through the glass.' },
      // the Maritime Centre 400 m in from the water and 230 m up the walk: downtown on the hill, ahead and to the left
      { build: 'halifaxWalk', at: [390, 0, 265], live: 'city', shadow: false, cap: 'Downtown Halifax on its hill: the real blocks from the flight data.' },
      { model: 'town_clock', at: [70, 9.6, 108], rot: [0, -120, 0], scale: 1.6, live: 'city', cap: 'The Town Clock on Citadel Hill.' },
      // the harbour as the walk has it; from the building's door on, the city stands there instead (VOLTA_VIEW)
      { build: 'macdonaldBridge', at: [-760, WALK.water, 1160], rot: [0, 12, 0], live: 'city', indoor: 'out', shadow: false, cap: 'The Angus L. Macdonald Bridge across the harbour.' },
      { build: 'georgesIsland', at: [-420, WALK.water, 250], live: 'city', indoor: 'out', shadow: false, cap: "Georges Island and its lighthouse." },
      { build: 'ferry', at: [-135, WALK.water, 98], live: 'mover', mover: 'ferry', indoor: 'out', cap: 'The ferry to Dartmouth.' },
      // what the glass shows once he is at the door: the city of Halifax on snow, the bridge in the back, no water
      { build: 'voltaView', at: [0, 0, 0], live: 'city', indoor: 'in', shadow: false, cap: 'Halifax: the real blocks, from OpenStreetMap.' },
      { build: 'voltaViewEast', at: [0, 0, 0], live: 'city', indoor: 'in', shadow: false },
      { build: 'macdonaldBridge', at: voltaViewBridge().at, rot: [0, voltaViewBridge().turn, 0], live: 'city', indoor: 'in', shadow: false, cap: 'The Angus L. Macdonald Bridge, in the back.' },
      ...VIEW_TREES.map((t, i): Placement => ({ build: `walkTree${i % 4}`, at: [t[0], 0, t[1]], rot: [0, t[2], 0], scale: t[3], live: 'city', indoor: 'in', shadow: false })),
      { build: 'voltaCeiling', at: [0, 0, 0] },
      // the door in off the walk: it opens as he comes up to the building and shuts behind him
      ...doorway('voltaIn', WALK.x, 0, WALK.volta.z[0], [ch(WALK.to.c - 0.2), ch(WALK.to.c - 0.06)], "Volta's door, 1800 Argyle Street.", [ch(VOLTA_SHUT[0]), ch(VOLTA_SHUT[1])]),
      // the reception's plank wall and desk, the bar ledge under the window, the baseboard
      { build: 'voltaFitout', at: [0, 0, 0], cap: 'Volta, 1800 Argyle Street, Suite 801: the reception.' },
      { build: 'laptop', at: [WALK.volta.x[1] - 1.1, 0.755, 47.2], rot: [0, 90, 0] },
      { model: 'volta_chair', at: [WALK.volta.x[1] - 0.55, 0, 47.3], rot: [0, -105, 0] },
      { model: 'volta_fig', at: [WALK.volta.x[1] - 0.65, 0, 45.6], rot: [0, 40, 0], scale: 0.78 },
      ...VOLTA_FLOOR.columns.map(([x, z], i): Placement => ({ build: 'voltaColumn', at: [x, 0, z], rot: [0, i ? 180 : 0, 0] })),
      ...VOLTA_FLOOR.rings.map(([x, z, r]): Placement => ({ build: 'ringPendant', at: [x, WALK.volta.h - 0.02, z], scale: [r, 1, r], live: 'pendant' })),
      // the coworking floor: tables in two groups, chairs pulled up, what people leave on and under them
      ...VOLTA_FLOOR.tables.map(([x, z, turn]): Placement => ({ build: 'voltaTable', at: [x, 0, z], rot: [0, turn, 0] })),
      ...VOLTA_FLOOR.chairs.map(([x, z, turn]): Placement => ({ model: 'volta_chair', at: [x, 0, z], rot: [0, turn, 0] })),
      { build: 'laptop', at: [-13.75, 0.74, 42.0], rot: [0, 180, 0] },
      { build: 'laptopBeanCode', at: [-12.95, 0.74, 43.15] },
      { build: 'laptopBean', at: [-12.62, 0.74, 45.2], rot: [0, 90, 0] },
      { build: 'laptop', at: [-12.98, 0.74, 46.85], rot: [0, -90, 0] },
      { model: 'coffee_mug', at: [-13.3, 0.74, 42.15], rot: [0, 30, 0] },
      { model: 'coffee_mug', at: [-12.62, 0.74, 46.2], rot: [0, 200, 0] },
      { model: 'volta_bottle', at: [-13.95, 0.74, 42.9] },
      { model: 'volta_bottle', at: [-12.95, 0.74, 45.75] },
      { model: 'volta_backpack', at: [-14.25, 0, 41.3], rot: [0, 60, 0] },
      { model: 'volta_backpack', at: [-11.75, 0, 45.85], rot: [0, -70, 0] },
      // at the glass: the tub chairs round a low table, cube ottomans, a high table with its stools
      ...VOLTA_FLOOR.tubs.map(([x, z, turn]): Placement => ({ model: 'volta_tub_chair', at: [x, 0, z], rot: [0, turn, 0] })),
      { build: 'voltaSideTable', at: [-15.15, 0, 46.15] },
      { build: 'voltaOttomanLime', at: [-14.45, 0, 45.7], rot: [0, 15, 0] },
      { build: 'voltaOttomanTeal', at: [-14.35, 0, 46.55], rot: [0, -20, 0] },
      { build: 'voltaHighTable', at: [VOLTA_FLOOR.highTable[0], 0, VOLTA_FLOOR.highTable[1]] },
      ...VOLTA_FLOOR.stools.map(([x, z, turn]): Placement => ({ model: 'volta_stool', at: [x, 0, z], rot: [0, turn, 0], scale: [1, 1.38, 1] })),
      { model: 'volta_fig', at: [-15.6, 0, 40.95], scale: 0.85 },
      { model: 'volta_fig', at: [-15.55, 0, 51.2], rot: [0, 150, 0], scale: 0.8 },
      // the north end: Collect.'s slide thrown on the wall, the high table he speaks at, a stack of the event chairs, the call booth
      { build: 'voltaSlide', at: [-13.7, 1.95, WALK.volta.z[1] - 0.012], live: 'screen', cap: "Collect. at Volta: Halifax's Socratica node." },
      { build: 'voltaHighTable', at: VOLTA_PODIUM, cap: 'The high table he spoke at.' }, // his: he goes up to it, stands behind it and turns to the room
      { build: 'laptop', at: [VOLTA_PODIUM[0], 1.05, VOLTA_PODIUM[2] - 0.1] },
      ...Array.from({ length: 6 }, (_, i): Placement => ({ model: 'volta_stack_chair', at: [-11.75, i * 0.085, WALK.volta.z[1] - 0.45 - i * 0.012], rot: [0, 180, 0] })),
      { build: 'voltaBooth', at: [WALK.volta.x[1] - 0.58, 0, WALK.volta.z[1] - 0.62], rot: [0, 90, 0], cap: 'A call booth.' }, // its back to the east wall, its glass door to the room
      { build: 'whiteboardCollect', at: [-13.9, 1.5, WALK.volta.z[0] + 0.03], cap: 'Collect. every Thursday at Volta.' },
      ...doorway('volta', WALK.x, 0, WALK.door + DOORS.volta.depth, [ch(VOLTA_DOOR[0]), ch(VOLTA_DOOR[1])], "The door out of Volta's room into the wing."), // through Volta's wall and the wing's
    ],
  },
  {
    // Dalhousie convocation: through the terrace's north door into the wing, up the steps and straight onto the stage from
    // its side, to the centre for the degree, then a turn to the hall: the crowd on its feet. Authored, no survey.
    id: 'convocation', at: [0, 0, TOUR_SHIFT], env: 'studio', tint: { sky: '#6E6258', ground: '#2A2422', power: 0.9 }, exposure: 0.9, envPower: 0.05, baked: true,
    sun: { dir: [0.5, 0.85, -0.2], color: '#FFE6C4', power: 0.12, shadow: 0.7 },
    fog: { color: '#16141A', near: 60, far: 180 },
    props: [
      { build: 'stageWing', at: [0, 0, 0], cap: 'The wing: four steps up onto the stage from its side.' },
      { build: 'downlight', at: [WALK.x, 3.1, STAGE.wing[0] + 1.4], live: 'downlight' },
      { build: 'downlight', at: [WALK.x, 3.1, STAGE.wing[1] - 0.6], live: 'downlight' },
      { build: 'stageHall', at: [0, 0, 0], cap: 'The hall: the stage a metre up, the drapes behind it in black and gold, the house beyond the proscenium.' },
      // the crowd on its feet is not placed here: crowd.ts seats it and the runtime draws it as cards (buildCrowd in stage-run.ts)
      { build: 'lectern', at: [STAGE.x[1] - 2.2, STAGE.height, STAGE.z[1] - 2.2], rot: [0, 90, 0], cap: 'The lectern.' },
      { build: 'stageBin', at: STAGE_BIN, cap: 'The bin backstage.' },
      // the door out behind the stage is the hall's: shut, it closes the hall's wall from wherever the hall is seen
      ...doorway('floqer', STAGE.door.x, STAGE.door.floor, FLOQER.z[0], [ch(13.94 + TOUR_GAIN), ch(14.1 + TOUR_GAIN)], 'The door out of the hall: Floqer.'),
      { build: 'logoDalhousie', at: [STAGE.x[0] + 0.72, STAGE.height + 4.4, STAGE.centre], rot: [0, 90, 0], cap: 'Dalhousie University. Convocation.' },
      ...Array.from({ length: 6 }, (_, i) => ({ build: 'hallChair', at: [STAGE.x[0] + 1.3, STAGE.height, STAGE.z[0] + 2.0 + i * 1.6 + (i > 2 ? 1.4 : 0)] as V3, rot: [0, 90, 0] as V3 })),
      { build: 'downlight', at: [STAGE.x[1] - 3.5, STAGE.height + 8.8, STAGE.centre], live: 'downlight' },
      { build: 'downlight', at: [STAGE.x[1] - 3, STAGE.height + 8.8, STAGE.centre - 5.5], live: 'downlight' },
      { build: 'downlight', at: [STAGE.x[1] - 3, STAGE.height + 8.8, STAGE.centre + 5.5], live: 'downlight' },
      { build: 'downlight', at: [STAGE.hall[0] + 6, 8.2, STAGE.centre], live: 'downlight' },
      { build: 'downlight', at: [STAGE.hall[0] + 14, 8.2, STAGE.centre], live: 'downlight' },
    ],
  },
  {
    // 2025 to now, Toronto: Floqer's hacker house, straight on from the stage through the back of the hall. Bigger than the
    // Bean one and messier: the T of tables with the monitors back to back and the team at them, the whiteboards, the boxes,
    // suitcase and mattresses of a rented place people ship from, the mark on the brick, downtown Toronto out of the west
    // windows, and the stair up the east wall to a door: his apartment.
    id: 'floqer', at: [0, 0, TOUR_SHIFT], outlook: true, env: 'studio', tint: { sky: '#DCE6F0', ground: '#6E5E4E', power: 0.4 }, exposure: 0.95, envPower: 1.0, baked: true, bakedEnvironment: true, // envPower 1: the room's own panorama is the environment (set12_env.webp), at its baked brightness
    sun: { dir: [-0.75, 0.55, 0.3], color: '#FFE4BE', power: 2.0, shadow: 0.85 },
    fog: { color: '#C9D7E3', near: 400, far: 9000 }, // the skyline stands 3 km off: in the day's haze, not lost in it
    shell: {
      x: FLOQER.x, z: FLOQER.z, h: FLOQER.h, y: FLOQER.floor,
      floor: 'condoFloor', wall: 'sydneyWall', ceiling: 'delhiCeiling',
      openings: [
        { wall: 'z-', at: STAGE.door.x, w: STAGE.door.w, h: STAGE.door.h, door: true }, // in from the hall, through its door, heading north
        { wall: 'z+', at: FLOQER.door.x, w: FLOQER.door.w, h: FLOQER.door.h, sill: FLOQER.stair.n * FLOQER.stair.rise, door: true }, // the door at the top of the stair: raised, so the bake must be told it is not a window
        ...WINDOW_Z.map((z) => ({ wall: 'x-' as const, at: z, w: 4.4, h: 2.0, sill: 0.55 })), // the windows on the street: wide and tall, so the city stands whole in them (they were 3.2 by 1.55 and he could not see it properly)
      ],
    },
    props: [
      ...(() => {
        const F = FLOQER.floor, Z = FLOQER.z[0], out: Placement[] = [];
        // out of the west windows: Old Town's street and brick blocks from some floors up, a streetcar on the tracks, and behind
        // them the photograph of the skyline (TORONTO_SKYLINE, drawn by the runtime): the CN Tower clear of the core
        out.push({ build: 'torontoStreet', at: [FLOQER.x[0], F - TORONTO_SKYLINE.up, WINDOW_Z[0]], live: 'city', shadow: false, cap: 'Old Town, and downtown Toronto beyond it: the CN Tower.' });
        out.push({ model: 'ttc_flexity', at: [FLOQER.x[0] - 64, F - TORONTO_SKYLINE.up + 0.03, WINDOW_Z[0] - 1.75], live: 'city', shadow: false, cap: 'A TTC streetcar on King Street.' });
        for (const z of WINDOW_Z) out.push({ build: 'sydneyWindow', at: [FLOQER.x[0], F + 0.55, z], rot: [0, 90, 0], scale: [1.1, 2.0 / 1.55, 1] });
        out.push({ build: 'brickWall', at: [(FLOQER.x[0] + FLOQER.x[1]) / 2, F, FLOQER.z[1] - 0.05] });
        out.push({ build: 'floqerSign', at: [-11.2, F + 2.3, FLOQER.z[1] - 0.1], rot: [0, 180, 0], live: 'screen', cap: 'Floqer. The orchestration engine behind enterprise go to market automation.' });
        // the T (FLOQER_T): a desk for each seat, pushed together back to back, as the real house has them (docs/rebuild/43):
        // pale tops on white trestles, one black standing desk among them, nothing quite square to its neighbour
        const { bar, stem, seats: SX, x: TX } = FLOQER_T, D = F + 0.74;
        const jig = (i: number) => (((i * 37) % 7) - 3) / 300;
        SX.forEach((x, k) => {
          out.push({ build: k === 3 ? 'standingDesk' : 'trestleDesk', at: [x + jig(k), F, bar + 0.385 + jig(k + 3)], rot: [0, jig(k) * 90, 0], ...(k === 0 ? { cap: 'The desks. Floqer is built here.' } : {}) });
          out.push({ build: 'trestleDesk', at: [x + jig(k + 5), F, bar - 0.385 + jig(k + 1)], rot: [0, 180 + jig(k + 2) * 90, 0] });
        });
        [stem - 0.75, stem + 0.75].forEach((z, i) => {
          out.push({ build: 'trestleDesk', at: [TX + 0.385, F, z + jig(i)], rot: [0, 90, 0] });
          out.push({ build: 'trestleDesk', at: [TX - 0.385, F, z + jig(i + 4)], rot: [0, -90, 0] });
        });
        // a screen faces whoever sits at it, its back to the other row's: the north row's toward +z, the south row's toward -z.
        // No two seats the same: a monitor and a keyboard, an open laptop beside it or alone, the tower on one desk
        const north: Array<[string, number]> = [['monitorApp', 1], ['monitor', 0], ['monitorBoard', 1.3], ['monitor', 0]], south: Array<[string, number]> = [['monitor', 1], ['', 0], ['monitorApp', 1], ['monitorBoard', 0]];
        SX.forEach((x, k) => {
          const [n, nw] = north[k], [so, sw] = south[k], up = k === 3 ? 0.06 : 0; // the standing desk's top is higher
          if (n) out.push({ build: n, at: [x + (nw ? 0 : -0.2), D + up, bar + 0.17], rot: [0, k % 2 ? 3 : -2, 0], ...(nw > 1 ? { scale: [nw, 1.05, 1] as V3 } : {}), live: 'screen' });
          if (!nw) out.push({ build: 'laptop', at: [x + 0.36, D + up, bar + 0.3], rot: [0, -18, 0], live: 'screen' });
          out.push({ model: 'keyboard_mouse_black', at: [x + (nw ? 0 : -0.15), D + up, bar + 0.56], rot: [0, 180, 0] });
          if (so) out.push({ build: so, at: [x + (sw ? 0 : 0.2), D, bar - 0.17], rot: [0, 180 + (k % 2 ? -3 : 2), 0], live: 'screen' });
          if (!sw) out.push({ build: 'laptop', at: [x - (so ? 0.36 : 0), D, bar - (so ? 0.3 : 0.4)], rot: [0, 180 + (so ? -18 : 6), 0], live: 'screen' });
          if (so) out.push({ model: 'keyboard_mouse_black', at: [x + (sw ? 0 : 0.15), D, bar - 0.56], rot: [0, 0, 0] });
        });
        out.push({ build: 'monitor', at: [TX + 0.17, D, stem - 0.75], rot: [0, 90, 0], live: 'screen' }, { model: 'keyboard_mouse_black', at: [TX + 0.56, D, stem - 0.75], rot: [0, -90, 0] });
        out.push({ build: 'monitorApp', at: [TX - 0.17, D, stem + 0.75], rot: [0, -90, 0], live: 'screen' }, { model: 'keyboard_mouse_black', at: [TX - 0.56, D, stem + 0.75], rot: [0, 90, 0] });
        out.push({ build: 'laptop', at: [TX - 0.3, D, stem - 0.7], rot: [0, -84, 0], live: 'screen' });
        out.push({ build: 'towerPC', at: [SX[2] + 0.58, D, bar - 0.4], rot: [0, 180, 0], cap: 'The tower on the desk.' });
        // what is left at each seat: cans, a mug, a bottle, the box the kit came in
        out.push({ build: 'deskCans', at: [SX[0] - 0.5, D, bar + 0.42] }, { build: 'deskCan', at: [SX[1] + 0.55, D, bar - 0.5] }, { build: 'deskCanSlim', at: [SX[2] - 0.5, D, bar + 0.5] }, { build: 'deskCans', at: [SX[3] + 0.45, D, bar - 0.45], rot: [0, 140, 0] });
        out.push({ build: 'deskCanSlim', at: [SX[3] - 0.5, D + 0.06, bar + 0.5] }, { build: 'deskCan', at: [TX + 0.5, D, stem + 0.55] }, { build: 'deskCanSlim', at: [TX - 0.55, D, stem - 0.2] });
        out.push({ model: 'coffee_mug', at: [SX[1] - 0.55, D, bar + 0.48], rot: [0, 40, 0] }, { model: 'coffee_mug', at: [SX[2] + 0.2, D, bar - 0.55], rot: [0, 200, 0] }, { model: 'volta_bottle', at: [SX[0] + 0.5, D, bar - 0.5] }, { model: 'volta_bottle', at: [TX + 0.55, D, stem - 0.3] });
        out.push({ build: 'floqerBox', at: [TX + 0.42, D, stem + 0.85], rot: [0, 100, 0], cap: "Floqer's box." });
        // the leads off the back of every desk, the strips they run to, the extension lead across the floor
        out.push({ build: 'floqerLeads', at: [0, F, 0] }, { build: 'powerStrip', at: [SX[3] + 1.05, F, bar + 0.3], rot: [0, 25, 0] }, { build: 'powerStrip', at: [TX + 0.2, F, stem - 1.8], rot: [0, 80, 0] });
        // the chairs, mismatched, nobody in them, none pushed in straight: the bar's south side faces +z, its north side -z, the stem's sides face across it
        const seats: Array<[number, number, number, 'office_chair_black' | 'SchoolChair_01' | 'painted_wooden_chair_01' | 'volta_chair']> = [
          [SX[0], bar - 1.15, 172, 'office_chair_black'], [SX[1] + 0.1, bar - 1.3, 205, 'volta_chair'], [SX[2], bar - 1.15, 180, 'office_chair_black'], [SX[3], bar - 1.2, 160, 'painted_wooden_chair_01'],
          [SX[0] + 0.1, bar + 1.2, 12, 'SchoolChair_01'], [SX[1], bar + 1.15, -6, 'office_chair_black'], [SX[2] + 0.25, bar + 1.45, 35, 'volta_chair'],
          [TX + 1.15, stem - 0.75, -96, 'office_chair_black'], [TX - 1.2, stem + 0.7, 80, 'SchoolChair_01'], [TX + 1.3, stem + 0.6, -60, 'painted_wooden_chair_01'],
        ];
        seats.forEach(([x, z, rot, model]) => out.push({ model, at: [x, F, z], rot: [0, rot, 0] }));
        out.push({ model: 'volta_backpack', at: [SX[0] + 0.55, F, bar - 0.9], rot: [0, 40, 0] }, { model: 'volta_backpack', at: [TX - 1.0, F, stem - 0.6], rot: [0, -70, 0] });
        for (const x of [-13.7, -10.7]) out.push({ model: 'pendant_tense', at: [x, F + 1.86, bar], live: 'pendant' });
        out.push({ model: 'pendant_tense', at: [TX, F + 1.86, stem], live: 'pendant' });
        // the east wall, on the way to the stair: the whiteboards, and the mark as the house has it, made of acoustic foam tiles
        out.push({ build: 'whiteboardFloqerA', at: [FLOQER.x[1] - 0.04, F + 1.5, Z + 1.4], rot: [0, -90, 0], live: 'screen', cap: 'The whiteboard: the engine and who runs on it.' });
        out.push({ build: 'whiteboardFloqerB', at: [FLOQER.x[1] - 0.04, F + 1.5, Z + 3.9], rot: [0, -90, 0], live: 'screen', cap: 'The whiteboard: the year, and Disrupt.' });
        out.push({ build: 'foamMark', at: [FLOQER.x[1] - 0.01, F + 0.6, Z + 7.1], rot: [0, -90, 0], cap: 'The F, in acoustic foam tiles, as it hangs in the house.' });
        // the whiteboard on wheels, thick with sticky notes, against the brick past the mark, where he walks by it on the way to the stair
        out.push({ build: 'rollingWhiteboard', at: [-8.3, F, FLOQER.z[1] - 1.0], rot: [0, -142, 0], live: 'screen', cap: 'The whiteboard on wheels: to do, failed, passed, prod.' });
        // the stair up the east wall, straight at the door in the north wall, its rail on the open side, a light over it; the landing behind the door
        out.push({ build: 'stairFlight', at: [FLOQER.stair.x, F, FLOQER.stair.z0], cap: 'The stair up to his door.' });
        // the door at the top of the stair is his own: dark oak in a dark case, from the brick's face to the apartment's passage behind it (HOME), opening into the passage
        out.push(...doorway('home', FLOQER.door.x, F + FLOQER.stair.n * FLOQER.stair.rise, FLOQER.z[1] - 0.09 + DOORS.home.depth, [ch(16.5 + TOUR_GAIN), ch(16.68 + TOUR_GAIN)], 'His own front door.'));
        out.push({ build: 'discLight', at: [FLOQER.stair.x, F + 3.6, FLOQER.stair.z0 + 1.2], live: 'pendant' });
        // a house people ship from: boxes still packed, a suitcase, a bin bag, a crate, the shoes by the door, cases of drinks against the wall, a torchiere in the corner
        out.push({ model: 'cardboard_box_01', at: [-15.0, F, Z + 0.9], rot: [0, 12, 0] });
        out.push({ model: 'cardboard_box_01', at: [-15.0, F + 0.52, Z + 0.9], rot: [0, -18, 0] });
        out.push({ model: 'cardboard_box_01', at: [-14.2, F, Z + 1.5], rot: [0, 35, 0] });
        out.push({ build: 'torchiere', at: [-15.62, F, Z + 0.4], cap: 'The floor lamp.' });
        out.push({ build: 'canCases', at: [-12.9, F, Z + 0.3], rot: [0, 6, 0], cap: 'Cases of drinks.' });
        out.push({ model: 'trashbag', at: [-13.7, F, Z + 0.6], rot: [0, 60, 0] }); // with the boxes: the walk goes round the room by the windows
        out.push({ model: 'plastic_crate_01', at: [-9.0, F, Z + 0.5], rot: [0, 20, 0] });
        out.push({ model: 'shoe_rack_modern', at: [-9.6, F, Z + 0.35] });
        // the soft corner by the door: a grey sofa against the south wall, a brown bean bag
        out.push({ model: 'floqer_sofa', at: [-6.6, F, Z + 0.62], cap: 'The sofa.' });
        out.push({ model: 'floqer_beanbag', at: [-5.2, F, Z + 2.5], rot: [0, 30, 0], cap: 'The bean bag.' });
        // you sleep where you ship: two air beds, each its own kind and at its own angle
        out.push({ build: 'airBedRaised', at: [-14.85, F, FLOQER.z[1] - 1.4], rot: [0, 96, 0], cap: 'An air bed. A hacker house: you sleep where you ship.' });
        out.push({ build: 'airBedLow', at: [-8.1, F, Z + 2.7], rot: [0, 192, 0] });
        out.push({ model: 'vintage_suitcase', at: [-6.5, F, FLOQER.z[1] - 0.7], rot: [0, 25, 0] });
        out.push({ model: 'volta_bottle', at: [-13.9, F, FLOQER.z[1] - 1.9] });
        out.push({ build: 'bin', at: [-8.4, F, bar + 1.6] });
        return out;
      })(),
    ],
  },
];
