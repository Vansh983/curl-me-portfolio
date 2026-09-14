// The world as data: twelve sets in a chain, each with its light, its shell and what stands in it.
// Metres, y up. Spec: docs/rebuild/13-journey-real-spec.md; layout: 14-journey-real-plan.md.
//
//   Set 0 NOW      x -9.4..-4.2  z -3.4..2.2   h 2.8   the studio over Toronto; glass on z-, front door on z+ at x -5.45, the brick door on x+ at z 1.6
//   Passage        x -4.85..     z  2.2..4.3           north, 2.1 m, to the 2010 room
//   Set 1 ROOM     x -9.15..-4.95 z 4.3..7.9   h 2.7   2010, Delhi; in from the south at x -5.45, out east at z 6.6
//   Set 2 LAB      x -3.15..2.05 z  4.7..9.7   h 3.0   2013; in from the west at z 6.6, out south at x 1.4
//   Set 3 GOOGLE   x -4.0..1.5   z -8.0..-0.03         2019, the Googleplex: the Android lawn, the boardroom, the 2020 room's door in its north wall
//   Set 4 DELHI    x -2.4..0.7   z  0..3.6     h 2.7   2020, Webcube from home; in from the south at x -0.7, out west at z 1.6
//   Set 5 FLIGHT   x -5.2..-1.6  z -10.2..-4.8        south down the boarding corridor; window seat, phone portal
//   Set 6 HALIFAX  x -1.4..11.2  z -17.4..-2.0        96-seat auditorium; phone arrives at the highest row; out by the front west door
//   Set 7 SYDNEY   x -7.4..-1.4  z -18.2..-13.2 h 2.9  2024, the hacker house where Bean was built; the Opera House out of the west window; out by the south door
//   Set 8 VANCOUVER x -7.4..6.6  z -30..-18.2        2025, outside the Convention Centre, Web Summit: the Bean booth; outdoors, laptop in hand
//   Set 9 TORONTO   x 10..24     z -30..-18.2        2025, Elevate week: a brick front, the sign
//   Set 10 MONTREAL x 24..38     z -30..-18.2        2025, ALL IN: the booth outside a plain front
//   Set 11 HALIFAX  x 38..52     z -30..-18.2        2025 to 26, Volta's front; the walk ends
import { HALIFAX } from './halifax.ts';
import { ch, approach } from './shot.ts';

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
export type Live = 'fan' | 'tv' | 'monitor' | 'tube' | 'curtain' | 'water' | 'bulb' | 'lamp' | 'pendant' | 'downlight' | 'screen' | 'city' | 'sky' | 'door' | 'drop' | 'flight' | 'person';

/** Something standing in a set: a scanned model by manifest id, or a code-built prop by name. */
/** What a person wears, by bone: skin, top, legs, shoes; long sleeves put the top on the forearms. */
export interface Wear { skin: string; top: string; legs: string; shoes: string; sleeves: 'long' | 'short' }
/** A person: the rigged base character dressed and given an idle loop, started `phase` seconds in so no two move together. */
export interface Person { wear: Wear; hair: string; clip: 'idle' | 'talk' | 'sit' | 'sitTalk'; phase: number }

export interface Placement {
  person?: Person; // live 'person'
  screen?: string; // optional painted content for a model's fitted display
  door?: [number, number]; // live 'door': the stage progress over which the leaf swings 90 degrees anticlockwise (seen from above) from its placed rotation
  drop?: [number, number, number]; // live 'drop': the stage progress over which the thing lowers, and by how many metres (the projection screen)
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
  outdoor?: true; // no walls of its own: shown only from the set before it and itself, or its ground and road would stand outside the windows of the rooms
  also?: number[]; // sets kept in view beyond the neighbours: the terrace stands in set 8 and is walked through set 10
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
 * The Canada tour: out of the hacker house's south door onto its terrace, 30 m over the harbour, right twice, and north
 * along the harbour side of the building for 40 m: the water on the left with one simple thing for each city out on it,
 * the building's wall and its things on the right, then back in through the door at the terrace's end. The terrace,
 * the cliff and the water are the same in all three sets (each holds its own copy, this set only): only the sky and
 * the thing on the water change at a threshold.
 */
export const TERRACE = { x: [-13.6, -7.4] as [number, number], z: [-21.0, 24.0] as [number, number], walkX: -10.5, door: 24.0, water: -30.6, plaza: { x0: -34.0, z0: -12.0 } } as const; // plaza: north of z0 the paving runs west to x0, the city's things on it, the balustrade at its edge
/** The stage beyond the terrace's north door: entered from its wing at the south end, the audience to the east. World metres. */
/**
 * The people in the hall on its feet: graduates in black gowns among their families, standing on the house's tiers facing the
 * stage, each dressed and started differently from a fixed seed so the crowd is the same every time. The character faces -z
 * in its own frame; turned 90 degrees it faces the stage across -x.
 */
export function crowdPeople(): Placement[] {
  let seed = 977;
  const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
  const skins = ['#F1C9A5', '#D9A57E', '#C68E6A', '#9C6B48', '#6E4A31', '#4A3122'] as const;
  const tops = ['#1E2A44', '#5A1F2A', '#F2F0EA', '#3B4A3F', '#7C7F86', '#2B2B30', '#B8875A', '#6B3F7A'] as const;
  const legs = ['#1F2430', '#2E3A55', '#6B6F78', '#3A2E26', '#111114'] as const;
  const hairs = ['#15151A', '#2A1B12', '#4A3221', '#6B4A2B', '#8A8A8A', '#B8925A'] as const;
  const out: Placement[] = [];
  const [h0] = STAGE.hall, [hz0, hz1] = STAGE.hallZ;
  for (let i = 0; i < 8; i++) {
    const x = h0 + 3.2 + i * 2.35, y = houseFloorY(x);
    const n = 9, span = hz1 - hz0 - 3;
    for (let j = 0; j < n; j++) {
      const z = hz0 + 1.5 + (span * (j + 0.5)) / n + (rnd() - 0.5) * 1.2;
      const gown = rnd() < 0.45;
      const wear: Wear = gown ? { skin: pick(skins), top: '#121214', legs: '#121214', shoes: '#141416', sleeves: 'long' } : { skin: pick(skins), top: pick(tops), legs: pick(legs), shoes: pick(['#141416', '#3A2E26', '#EDEDEA'] as const), sleeves: rnd() < 0.6 ? 'long' : 'short' };
      out.push({ model: 'base_character', at: [x + (rnd() - 0.5) * 0.6, y, z], rot: [0, 90 + (rnd() - 0.5) * 24, 0], live: 'person', person: { wear, hair: pick(hairs), clip: rnd() < 0.35 ? 'talk' : 'idle', phase: rnd() * 6 } });
    }
  }
  return out;
}

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
/** The height of the office's stair at z, from its foot to the landing. */
/**
 * Google, 2019 (set 3): the Googleplex. Out of the lab's passage onto the Android lawn (the statues along it to the east,
 * the Google letters at its end), south along the face of a two storey block to the open bay in its glass wall: the
 * boardroom (x -4.0..1.5, z -8.0..-0.03), the long table, his seat, and the 2020 room's door in its north wall.
 */
export const GOOGLE = {
  room: { x: [-4.0, 1.5] as [number, number], z: [-8.0, -0.03] as [number, number], h: 3.0 }, // the boardroom: its east wall is glass
  bay: 1.2, // the glass wall's bays, from the south end; the door is the second
  door: { z: -5.0, w: 1.2 }, // the open bay in the glass wall, the third from the south
  top: 7.0, // the block's roof: two storeys
  walkX: 3.2, // the walk's line down the east face, on the path
  seat: { x: -0.35, z: -3.0 }, // his chair: the north-east one, nearest the 2020 room's door
} as const;
const WINDOW_Z = [FLOQER.z[0] + 2.5, FLOQER.z[0] + 7.5]; // the two windows on the street, along the west wall
export const stairY = (z: number): number => FLOQER.floor + Math.min(FLOQER.stair.n, Math.max(0, (z - FLOQER.stair.z0) / FLOQER.stair.run)) * FLOQER.stair.rise;
export const TOUR = { vancouver: [TERRACE.walkX, 0, -18.6] as V3, toronto: [TERRACE.walkX, 0, -5.4] as V3, halifax: [TERRACE.walkX, 0, 8.0] as V3 } as const;
/**
 * The water round the headland, 30 m down: every tour set holds its own (this set only). The terrace itself, the cliff
 * and the house's wall stand in the middle set (Toronto), baked, and show from its neighbours either side: the whole
 * walk sees them, the Sydney window never does.
 */
const water = (): Placement => ({ build: 'harbourAround', at: [0, TERRACE.water, 0], live: 'city', shadow: false, cap: 'The water, 30 m down.' });

export const SETS: StageSet[] = [
  {
    // now: a studio high over Toronto at night, 5.2 by 5.6 m: the bed along the west wall, the desk
    // on the brick east wall, glass along the whole south side with the CN Tower in it. The walk
    // starts in the north-west corner looking across the room to the glass, turns on the spot to the
    // front door in the north wall and goes straight out. The journey comes back in through the
    // door in the brick at the end.
    id: 'now', env: 'studio', tint: { sky: '#4A5F8C', ground: '#1B1E2A', power: 0.07 }, exposure: 0.72, envPower: 0.035, baked: true,
    sun: { dir: [0.2, 0.45, -0.85], color: '#8FA6D6', power: 0.2, shadow: 0.7 },
    fog: { color: '#141826', near: 8, far: 40 },
    shell: {
      x: [-9.4, -4.2], z: [-3.4, 2.2], h: 2.8,
      floor: 'condoFloor', wall: 'condoWall', ceiling: 'condoCeiling',
      openings: [
        { wall: 'z+', at: -5.45, w: 0.9, h: 2.05 }, // the front door, north into the passage
        { wall: 'x+', at: 1.6, w: 0.9, h: 2.05 }, // the door in the brick: the journey comes back in through it at the end
        { wall: 'z-', at: -6.8, w: 4.6, h: 2.8, sill: 0 }, // the glass, floor to ceiling
      ],
    },
    props: [
      { build: 'mullions', at: [-6.8, 0, -3.4], scale: [0.92, 1.4, 1] },
      { build: 'city', at: [-6.8, -185, -3.4], live: 'city', cap: 'Toronto. The CN Tower from the 51st floor.', shadow: false },
      { build: 'nightSky', at: [-6.8, 0, -3.4], live: 'city', shadow: false },
      { build: 'condoBrick', at: [-4.2, 0, 0] },
      { build: 'condoSkirting', at: [0, 0, 0] },
      // the bed along the west wall, its head on the wall
      { model: 'bed_double', at: [-8.2, 0, -1.6], rot: [0, 90, 0], cap: 'Bed. Not used enough.' },
      { model: 'nightstand_modern', at: [-9.05, 0, -0.2] },
      { model: 'desk_lamp_arm_01', at: [-9.1, 0.55, -0.2], rot: [0, 120, 0], scale: 0.7 },
      { model: 'wall_art_circles', at: [-9.365, 1.55, -1.6], rot: [90, 0, -90] },
      { model: 'pendant_tense', at: [-7.6, 1.78, -1.6], live: 'pendant' },
      { model: 'steel_frame_shelves_01', at: [-9.12, 0, 1.2], rot: [0, 90, 0], scale: 0.1 }, // the scan is in centimetres
      { model: 'book_encyclopedia_set_01', at: [-9.12, 0.98, 1.2], rot: [0, 90, 0], scale: 0.9 },
      { model: 'book_encyclopedia_set_01', at: [-9.12, 1.5, 1.15], rot: [0, 90, 0], scale: 0.8 },
      { model: 'potted_plant_01', at: [-8.95, 0, -3.1], scale: 0.9 },
      // the desk on the brick, by the glass
      { build: 'rugGrey', at: [-5.1, 0, -2.45] },
      { build: 'desk', at: [-4.58, 0, -2.45], rot: [0, -90, 0], cap: 'Building Floqer. Most days, most nights.' },
      { build: 'deskHutch', at: [-4.34, 0.74, -2.45] },
      { build: 'hutchLed', at: [-4.34, 0.74, -2.45] },
      { model: 'coffee_mug', at: [-4.7, 0.74, -2.03], rot: [0, 40, 0] },
      { build: 'books', at: [-4.34, 1.71, -2.6], cap: 'The shelf. Mostly systems and design.' },
      { build: 'books', at: [-4.34, 1.21, -2.05] },
      { build: 'badge', at: [-4.5, 1.69, -3.1], cap: 'Google Code-in 2018. Grand prize.' },
      { build: 'monitor', at: [-4.56, 0.74, -2.8], rot: [0, -100, 0], live: 'screen' },
      { build: 'monitorApp', at: [-4.56, 0.74, -2.13], rot: [0, -80, 0], live: 'screen' },
      { model: 'laptop_14_aluminium', at: [-4.73, 0.74, -1.8], rot: [0, -120, 0] },
      { model: 'keyboard_mouse_black', at: [-4.82, 0.74, -2.47], rot: [0, -90, 0] },
      { build: 'pcTower', at: [-4.33, 0, -1.95], rot: [0, -90, 0] },
      { model: 'desk_lamp_arm_01', at: [-4.3, 0.74, -3.2], rot: [0, -150, 0], live: 'lamp', cap: 'The lamp. It is usually late.' },
      { model: 'office_chair_black', at: [-5.3, 0, -2.45], rot: [0, 90, 0] }, // its back away from the desk
      { model: 'wall_art_circles', at: [-4.235, 1.3, 0.2], rot: [90, 0, 90] },
      { build: 'discLight', at: [-6.8, 2.8, 0.2], live: 'pendant' },
      { model: 'shoe_rack_modern', at: [-4.53, 0, 2.0], scale: 0.8 }, // between the front door and the corner
      { build: 'passage', at: [-4.85, 0, 2.2], rot: [0, -90, 0], scale: [0.7, 1, 1], live: 'bulb' }, // north from the front door, 2.1 m, to the 2010 room
      { build: 'passage', at: [-4.2, 0, 1.0], scale: [0.6, 1, 1], live: 'bulb' }, // east from the brick door: the return from Halifax
      { build: 'doorLeaf', at: [-4.2, 0, 2.05], rot: [0, 180, 0], live: 'door', door: [ch(7.727), ch(7.895)] }, // the return from Halifax; opens into the studio
    ],
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
    // bikes, the trees, the Google letters at the end of the path; south along the block's face to the open bay in its
    // glass wall, into the boardroom (the table, eight chairs, his name at the north-east seat), and out of the door
    // in its north wall into the 2020 room. One June afternoon. docs/rebuild/30-googleplex-options.md, layout A.
    id: 'google', env: 'sky', tint: { sky: '#CFE4F7', ground: '#9DAF7C', power: 0.3 }, exposure: 0.9, envPower: 0.7, baked: true,
    sun: { dir: [0.35, 0.82, -0.45], color: '#FFF3DC', power: 2.6, shadow: 1 }, // high, a little south-east: the statues' tops and the block's face lit, the walk in its shade
    fog: { color: '#C6D8E6', near: 80, far: 500 },
    shell: { // the boardroom
      x: GOOGLE.room.x, z: GOOGLE.room.z, h: GOOGLE.room.h,
      floor: 'boardCarpet', wall: 'labWall', ceiling: 'labCeiling',
      openings: [
        { wall: 'x+', at: (GOOGLE.room.z[0] + GOOGLE.room.z[1]) / 2, w: GOOGLE.room.z[1] - GOOGLE.room.z[0] - 0.16, h: 2.98 }, // the east wall is glass: open in the shell, the bake lights it as day; boardGlass fills it
        { wall: 'z+', at: -0.7, w: 0.9, h: 2.05, door: true }, // the 2020 room's door
        ...[-6.6, -4.0, -1.4].map((z): Opening => ({ wall: 'x-', at: z, w: 1.6, h: 1.4, sill: 1.0 })), // three windows in the west wall: the campus beyond
      ],
    },
    props: [
      ...(() => {
        const out: Placement[] = [], R = GOOGLE.room;
        out.push({ build: 'facade', at: [0, 0, 0] }); // the outside of the rooms we came through, and the block over the boardroom
        out.push({ build: 'boardGlass', at: [0, 0, 0], cap: 'Google. The Cloud office in Sunnyvale, June 2019.', href: 'https://codein.withgoogle.com/archive/2018/' });
        // the boardroom: the table along the room, four chairs a side, his seat the north-east one with his name on the table
        out.push({ build: 'boardTable', at: [-1.6, 0, -4.6], cap: 'The boardroom. One of the grand prize winners, 2018.' });
        for (const z of [-6.3, -5.2, -4.1, -3.0]) { out.push({ model: 'office_chair_black', at: [-0.35, 0, z], rot: [0, -90, 0] }); out.push({ model: 'office_chair_black', at: [-2.85, 0, z], rot: [0, 90, 0] }); }
        out.push({ build: 'nameCard', at: [-1.0, 0.745, GOOGLE.seat.z], rot: [0, 90, 0], cap: 'His seat.' });
        for (const z of [-6.6, -4.6, -2.6]) out.push({ build: 'discLight', at: [-1.3, R.h - 0.02, z], live: 'pendant' });
        out.push({ build: 'doorFrame', at: [-0.7, 0, R.z[1] - 0.14] });
        // the lawn and the path down the block's face
        out.push({ build: 'lawn', at: [0, 0, 0] });
        out.push({ build: 'lawnPath', at: [GOOGLE.walkX, 0.015, -3.2] });
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
      { build: 'cartons', at: [-1.9, 0, 0.45], rot: [0, 100, 0], cap: 'Boxes in the corner.' },
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
      { build: 'doorLeaf', at: [-6.4, 0, -18.2], rot: [0, -90, 0], live: 'door', door: [ch(8.56), ch(8.7)] }, // the south door beside the window: hinged on the east jamb, it swings into the room, clear of the walk down the west side // the south door: hinged on the west jamb, it swings out onto the promenade ahead of the walk
      { build: 'bin', at: [-1.85, 0, -14.7] },
      // the walls
      { build: 'whiteboardBean', at: [-4.4, 1.5, -13.26], rot: [0, 180, 0], live: 'screen', scale: 0.85, cap: 'The whiteboard. How Bean works, and launch week.' },
      { model: 'wall_clock', at: [-1.44, 2.3, -17.4], rot: [0, -90, 0] },
      { build: 'discLight', at: [-2.4, 2.9, -14.3], live: 'pendant' },
    ],
  },
  {
    // 2025, Vancouver: out of the hacker house's south door onto the terrace, Web Summit week. The terrace, its wall and
    // the cliff live here and show from Sydney's window, Toronto and Halifax; the plaza west of the walk holds the three
    // cities' things (set 9, so they stand through the whole walk); the North Shore across the water, the sails on it.
    id: 'vancouver', env: 'sky', tint: { sky: '#CFE0F0', ground: '#A8A59C', power: 0.25 }, exposure: 0.72, envPower: 0.7, outdoor: true, baked: true,
    sun: { dir: [0.45, 0.62, 0.55], color: '#FFF3DC', power: 2.3, shadow: 1 },
    fog: { color: '#C9D7E3', near: 500, far: 4000 },
    props: [
      water(),
      { build: 'terrace', at: [0, 0, 0], cap: 'The terrace along the harbour side of the hacker house, 30 m over the water, and the plaza it opens onto.' },
      { build: 'terraceWall', at: [0, 0, 0], cap: 'The house from outside: its windows along the terrace, the door at the end.' },
      { build: 'northShore', at: [0, TERRACE.water, 0], live: 'city', shadow: false, cap: 'The North Shore: Cypress, Grouse and Seymour over Burrard Inlet, from real elevation data.' },
      { build: 'canadaPlaceSails', at: [-190, TERRACE.water, 230], rot: [0, 90, 0], live: 'city', shadow: false, cap: 'Canada Place: the five sails over the pier.' },
    ],
  },
  {
    // 2025, Toronto: the same terrace, Elevate week. This set holds the row on the plaza, one city after another on the
    // right of the walk (docs/rebuild/31-tour-row.md): Vancouver's Web Summit venue and Jack Poole Plaza (the Bean booth,
    // the Digital Orca, the Olympic Cauldron, the Convention Centre, Harbour Centre behind), Toronto (a TTC streetcar, the
    // Elevate photo, Union Station behind), Halifax (the Demo Day photo, the Town Clock, Purdy's Wharf behind); planters
    // between; downtown Toronto across the water for its own stretch.
    id: 'toronto', env: 'sky', tint: { sky: '#CDD8E4', ground: '#9A958C', power: 0.25 }, exposure: 0.72, envPower: 0.7, outdoor: true,
    sun: { dir: [-0.5, 0.6, 0.45], color: '#FFEFD6', power: 2.3, shadow: 1 },
    fog: { color: '#C9D7E3', near: 800, far: 5000 },
    props: [
      water(),
      { build: 'torontoDay', at: [-140, TERRACE.water, 500], rot: [0, 100, 0], live: 'city', shadow: false, cap: 'Downtown Toronto across the water: the real blocks and the CN Tower. Elevate, October 2025.' },
      // Vancouver, z -13 to -3
      { build: 'beanBooth', at: [-15.2, 0, -11.2], rot: [0, -90, 0], cap: 'The Bean booth. One day at Web Summit Vancouver, May 2025: 500 conversations, 120 signups, an investor MOU.' },
      { model: 'digital_orca', at: [-31.0, 0, -4.0], rot: [0, 90, 0], cap: "Digital Orca, Douglas Coupland's sculpture beside the Convention Centre." },
      { model: 'olympic_cauldron', at: [-27.5, 0, -1.0], rot: [0, 0, 0], scale: 0.6, cap: 'The 2010 Olympic Cauldron on Jack Poole Plaza.' },
      { model: 'convention_centre', at: [-200, 0, -125], rot: [0, 35, 0], cap: 'The Vancouver Convention Centre West: Web Summit, May 2025.' },
      { model: 'harbour_centre', at: [-90, 0, -230], rot: [0, 0, 0], cap: 'Harbour Centre.' },
      { build: 'plazaPlanter', at: [-20.6, 0, -3.0] },
      // Toronto, z 0 to 10
      { build: 'photoElevate', at: [-14.6, 0, 2.2], rot: [0, -90, 0], cap: 'Elevate Festival, Toronto, October 2025, with the Startup Atlantic delegation. His photo.' },
      { model: 'ttc_streetcar', at: [-22.5, 0, 6.5], rot: [0, 60, 0], cap: 'A TTC streetcar.' },
      { model: 'union_station', at: [-190, 0, 120], rot: [0, -25, 0], cap: 'Union Station.' },
      { build: 'plazaPlanter', at: [-20.6, 0, 10.4] },
      // Halifax, z 12 to 22
      { build: 'photoDemoDay', at: [-14.6, 0, 15.0], rot: [0, -90, 0], cap: 'Collect. Demo Day at Volta, January 2026: the space packed. His photo.' },
      { model: 'town_clock', at: [-16.5, 0, 21.5], rot: [0, 20, 0], cap: 'The Halifax Town Clock.' },
      { model: 'purdys_wharf', at: [-80, 0, 90], rot: [0, 20, 0], cap: "Purdy's Wharf on the Halifax waterfront." },
      { model: 'purdys_wharf', at: [-115, 0, 118], rot: [0, 20, 0] },
    ],
  },
  {
    // 2025 to 2026, Halifax: downtown Halifax across the harbour as from Dartmouth (real footprints) with the Macdonald
    // Bridge. The walk ends at the door back in.
    id: 'halifaxVolta', env: 'sky', tint: { sky: '#D4E0EA', ground: '#A19C93', power: 0.25 }, exposure: 0.72, envPower: 0.7, outdoor: true, also: [8],
    sun: { dir: [-0.55, 0.6, 0.5], color: '#FFEBD0', power: 2.3, shadow: 1 },
    fog: { color: '#C9D7E3', near: 800, far: 5000 },
    props: [
      water(),
      { build: 'hallShell', at: [0, 0, 0] }, // the hall's outside over the wing: from the terrace a plain block, nothing of the inward room shows
      { build: 'halifaxDay', at: [-480, TERRACE.water, 900], rot: [0, 320, 0], live: 'city', shadow: false, cap: 'Downtown Halifax across the harbour: the real blocks from the flight data.' },
      { build: 'macdonaldBridge', at: [-820, TERRACE.water, 420], rot: [0, -70, 0], live: 'city', shadow: false, cap: 'The Angus L. Macdonald Bridge across the harbour.' },
      { build: 'doorLeafWide', at: [TERRACE.walkX + 0.6, 0, TERRACE.door], rot: [0, -90, 0], live: 'door', door: [ch(11.78), ch(11.92)], cap: 'The door back into the house at the end of the terrace.' },
    ],
  },
  {
    // Dalhousie convocation: through the terrace's north door into the wing, up the steps and straight onto the stage from
    // its side, to the centre for the degree, then a turn to the hall: the crowd on its feet. Authored, no survey.
    id: 'convocation', env: 'studio', tint: { sky: '#6E6258', ground: '#2A2422', power: 0.9 }, exposure: 0.9, envPower: 0.05, baked: true,
    sun: { dir: [0.5, 0.85, -0.2], color: '#FFE6C4', power: 0.12, shadow: 0.7 },
    fog: { color: '#16141A', near: 60, far: 180 },
    props: [
      { build: 'stageWing', at: [0, 0, 0], cap: 'The wing: four steps up onto the stage from its side.' },
      { build: 'downlight', at: [TERRACE.walkX, 3.1, STAGE.wing[0] + 1.4], live: 'downlight' },
      { build: 'downlight', at: [TERRACE.walkX, 3.1, STAGE.wing[1] - 0.6], live: 'downlight' },
      { build: 'stageHall', at: [0, 0, 0], cap: 'The hall: the stage a metre up, the drapes behind it in black and gold, the house beyond the proscenium.' },
      ...crowdPeople(), // the crowd on its feet: 72 people, each a rigged figure dressed by bone
      { build: 'lectern', at: [STAGE.x[1] - 2.2, STAGE.height, STAGE.z[1] - 2.2], rot: [0, 90, 0], cap: 'The lectern.' },
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
    id: 'floqer', env: 'studio', tint: { sky: '#DCE6F0', ground: '#6E5E4E', power: 0.4 }, exposure: 0.95, envPower: 1.0, baked: true, // envPower 1: the room's own panorama is the environment (set12_env.webp), at its baked brightness
    sun: { dir: [-0.75, 0.55, 0.3], color: '#FFE4BE', power: 2.0, shadow: 0.85 },
    fog: { color: '#C9D7E3', near: 60, far: 900 },
    shell: {
      x: FLOQER.x, z: FLOQER.z, h: FLOQER.h, y: FLOQER.floor,
      floor: 'condoFloor', wall: 'sydneyWall', ceiling: 'delhiCeiling',
      openings: [
        { wall: 'z-', at: STAGE.door.x, w: STAGE.door.w, h: STAGE.door.h, door: true }, // in from the hall, through its door, heading north
        { wall: 'z+', at: FLOQER.door.x, w: FLOQER.door.w, h: FLOQER.door.h, sill: FLOQER.stair.n * FLOQER.stair.rise, door: true }, // the door at the top of the stair: raised, so the bake must be told it is not a window
        ...WINDOW_Z.map((z) => ({ wall: 'x-' as const, at: z, w: 3.2, h: 1.55, sill: 0.75 })), // the windows on the street
      ],
    },
    props: [
      ...(() => {
        const F = FLOQER.floor, Z = FLOQER.z[0], out: Placement[] = [];
        // the quay's top sits 0.35 below the floor: level with it, the two planes fought and the pale concrete showed through the parquet in patches
        out.push({ build: 'torontoDay', at: [FLOQER.x[0] - 100, F - 3 - 0.35, Z + 5], live: 'city', shadow: false, cap: 'Downtown Toronto, outside the window.' });
        for (const z of WINDOW_Z) out.push({ build: 'sydneyWindow', at: [FLOQER.x[0], F + 0.75, z], rot: [0, 90, 0], scale: [0.8, 1, 1] });
        // the door in from the stage: the hall's door leaf, hinged on its east jamb, swinging into the house as he reaches it; the reveal between the two walls
        out.push({ build: 'doorLeaf', at: [STAGE.door.x + STAGE.door.w / 2, F, STAGE.door.z + 0.15], rot: [0, -90, 0], live: 'door', door: [ch(13.94), ch(14.1)], cap: 'The door out of the hall: Floqer.' });
        out.push({ build: 'doorReveal', at: [STAGE.door.x, F, STAGE.door.z] });
        out.push({ build: 'brickWall', at: [(FLOQER.x[0] + FLOQER.x[1]) / 2, F, FLOQER.z[1] - 0.05] });
        out.push({ build: 'floqerSign', at: [-11.2, F + 2.3, FLOQER.z[1] - 0.1], rot: [0, 180, 0], live: 'screen', cap: 'Floqer. The orchestration engine behind enterprise go to market automation.' });
        // the T: the bar of two tables across the room, the stem down from its middle; monitors back to back along both, a keyboard at each
        const bar = Z + 7.2, stem = Z + 4.4;
        out.push({ build: 'hackerTable', at: [-13.7, F, bar], cap: 'The tables. Floqer is built here.' });
        out.push({ build: 'hackerTable', at: [-10.7, F, bar] });
        out.push({ build: 'hackerTable', at: [-12.2, F, stem], rot: [0, 90, 0] });
        const screens = ['monitorApp', 'monitor', 'monitorBoard', 'monitor', 'monitor', 'monitorApp'] as const;
        [-14.45, -12.95, -11.45, -9.95].forEach((x, k) => {
          out.push({ build: screens[k % 6], at: [x, F + 0.74, bar + 0.15], rot: [0, 180 + (k % 2 ? 3 : -2), 0], live: 'screen' });
          out.push({ build: screens[(k + 3) % 6], at: [x, F + 0.74, bar - 0.15], rot: [0, (k % 2 ? -3 : 2), 0], live: 'screen' });
          out.push({ model: 'keyboard_mouse_black', at: [x, F + 0.74, bar - 0.5], rot: [0, 0, 0] });
          out.push({ model: 'keyboard_mouse_black', at: [x, F + 0.74, bar + 0.5], rot: [0, 180, 0] });
        });
        for (const z of [stem - 0.8, stem + 0.8]) {
          out.push({ build: screens[z > stem ? 1 : 4], at: [-12.05, F + 0.74, z], rot: [0, -90, 0], live: 'screen' });
          out.push({ build: screens[z > stem ? 5 : 2], at: [-12.35, F + 0.74, z], rot: [0, 90, 0], live: 'screen' });
          out.push({ model: 'keyboard_mouse_black', at: [-11.7, F + 0.74, z], rot: [0, -90, 0] });
          out.push({ model: 'keyboard_mouse_black', at: [-12.7, F + 0.74, z], rot: [0, 90, 0] });
        }
        // the chairs, mismatched as the Bean house's were, nobody in them: the bar's south side faces +z, its north side -z, the stem's sides face across it
        const seats: Array<[number, number, number, 'office_chair_black' | 'SchoolChair_01' | 'painted_wooden_chair_01']> = [
          [-14.45, bar - 1.15, 180, 'office_chair_black'], [-12.95, bar - 1.15, 180, 'SchoolChair_01'], [-11.45, bar - 1.15, 180, 'office_chair_black'], [-9.95, bar - 1.15, 180, 'painted_wooden_chair_01'],
          [-13.7, bar + 1.15, 0, 'SchoolChair_01'], [-10.7, bar + 1.15, 0, 'office_chair_black'], [-11.05, stem - 0.8, -90, 'office_chair_black'], [-13.35, stem + 0.8, 90, 'SchoolChair_01'],
        ];
        seats.forEach(([x, z, rot, model], i) => out.push({ model, at: [x, F, z], rot: [0, rot + (i % 2 ? 6 : -5), 0] }));
        for (const x of [-13.7, -10.7]) out.push({ model: 'pendant_tense', at: [x, F + 1.86, bar], live: 'pendant' });
        out.push({ model: 'pendant_tense', at: [-12.2, F + 1.86, stem], live: 'pendant' });
        // the whiteboards on the east wall, on the way to the stair
        out.push({ build: 'whiteboardFloqerA', at: [FLOQER.x[1] - 0.04, F + 1.5, Z + 1.4], rot: [0, -90, 0], live: 'screen', cap: 'The whiteboard: the engine and who runs on it.' });
        out.push({ build: 'whiteboardFloqerB', at: [FLOQER.x[1] - 0.04, F + 1.5, Z + 3.9], rot: [0, -90, 0], live: 'screen', cap: 'The whiteboard: the year, and Disrupt.' });
        // the stair up the east wall, straight at the door in the north wall, its rail on the open side, a light over it; the landing behind the door
        out.push({ build: 'stairFlight', at: [FLOQER.stair.x, F, FLOQER.stair.z0], cap: 'The stair up to his door.' });
        out.push({ build: 'landing', at: [FLOQER.door.x + 0.6, F + FLOQER.stair.n * FLOQER.stair.rise, FLOQER.z[1]], rot: [0, -90, 0], scale: [0.667, 1, 1], live: 'bulb' }); // behind the door: a closed landing, 2 m, so the door opens onto it and not the sky
        out.push({ build: 'doorLeaf', at: [FLOQER.door.x + FLOQER.door.w / 2, F + FLOQER.stair.n * FLOQER.stair.rise, FLOQER.z[1]], rot: [0, -90, 0], live: 'door', door: [ch(15.2), ch(15.36)] }); // hinged on the east jamb, swinging away onto the landing
        out.push({ build: 'discLight', at: [FLOQER.stair.x, F + 3.6, FLOQER.stair.z0 + 1.2], live: 'pendant' });
        // the mess of a rented place: boxes still packed, a suitcase, a bin bag, a crate, the mattresses and pillows, the shoes by the door
        out.push({ model: 'cardboard_box_01', at: [-15.2, F, Z + 0.9], rot: [0, 12, 0] });
        out.push({ model: 'cardboard_box_01', at: [-15.2, F + 0.52, Z + 0.9], rot: [0, -18, 0] });
        out.push({ model: 'cardboard_box_01', at: [-14.3, F, Z + 1.6], rot: [0, 35, 0] });
        out.push({ model: 'plastic_crate_01', at: [-7.0, F, Z + 0.9], rot: [0, 20, 0] });
        out.push({ model: 'vintage_suitcase', at: [-8.4, F, FLOQER.z[1] - 1.1], rot: [0, 25, 0] });
        out.push({ model: 'trashbag', at: [-15.3, F, Z + 5.4], rot: [0, 60, 0] });
        out.push({ model: 'shoe_rack_modern', at: [-9.2, F, Z + 0.35] });
        out.push({ build: 'airMattress', at: [-14.6, F, FLOQER.z[1] - 1.6], rot: [0, 90, 0], cap: 'An air mattress. A hacker house: you sleep where you ship.' });
        out.push({ build: 'airMattress', at: [-12.2, F, FLOQER.z[1] - 1.4], rot: [0, 84, 0] });
        out.push({ build: 'airMattress', at: [-8.6, F, Z + 1.3], rot: [0, 4, 0] });
        out.push({ model: 'throw_pillows_01', at: [-15.5, F, FLOQER.z[1] - 1.6], rot: [0, 100, 0], scale: 0.7 });
        out.push({ model: 'throw_pillows_01', at: [-11.2, F, FLOQER.z[1] - 1.3], rot: [0, 80, 0], scale: 0.7 });
        out.push({ build: 'bin', at: [-6.4, F, Z + 0.6] });
        return out;
      })(),
    ],
  },
];

