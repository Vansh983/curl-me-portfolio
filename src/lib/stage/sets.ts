// The world as data: seven sets in a ring, each with its light, its shell and what stands in it.
// Metres, y up. Spec: docs/rebuild/13-journey-real-spec.md; layout: 14-journey-real-plan.md.
//
//   Set 0 NOW      x -9.4..-4.2  z -3.4..2.2   h 2.8   the studio over Toronto; glass on z-, front door on z+ at x -5.45, the brick door on x+ at z 1.6
//   Passage        x -4.85..     z  2.2..4.3           north, 2.1 m, to the 2010 room
//   Set 1 ROOM     x -9.15..-4.95 z 4.3..7.9   h 2.7   2010, Delhi; in from the south at x -5.45, out east at z 6.6
//   Set 2 LAB      x -3.15..2.05 z  4.7..9.7   h 3.0   2013; in from the west at z 6.6, out south at x 1.4
//   Set 3 PLAZA    x -4.14..     z < 4.6               2018, the Embarcadero, outdoors; south, then round west and north to the 2020 room's door
//   Set 4 DELHI    x -2.4..0.7   z  0..3.6     h 2.7   2020, Webcube from home; in from the south at x -0.7, out west at z 1.6
//   Set 5 FLIGHT   x -5.2..-1.6  z -10.2..-4.8        south down the boarding corridor; window seat, phone portal
//   Set 6 HALIFAX  x -1.6..4.8   z -10.2..-2.0        classroom, then north/west back to Toronto's brick door
export type V3 = [number, number, number];

/** A hole in a wall. `at` is the world coordinate along the wall, `sill` the bottom height (0 for a door). */
export interface Opening { wall: 'x+' | 'x-' | 'z+' | 'z-'; at: number; w: number; h: number; sill?: number }
/** A partition inside the shell, `from` to `to` on the floor, `t` thick (default 0.12), doors measured along it from `from`. */
export interface InnerWall { from: [number, number]; to: [number, number]; t?: number; doors?: Array<{ at: number; w: number; h: number }> }

/** A room: floor, four walls, ceiling, each a designed material (materials.ts). uv is in metres. */
export interface Shell {
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
export type Live = 'fan' | 'tv' | 'monitor' | 'tube' | 'curtain' | 'water' | 'bulb' | 'lamp' | 'pendant' | 'screen' | 'city' | 'sky' | 'door' | 'flight';

/** Something standing in a set: a scanned model by manifest id, or a code-built prop by name. */
export interface Placement {
  screen?: string; // optional painted content for a model's fitted display
  door?: [number, number]; // live 'door': the stage progress over which the leaf swings 90 degrees anticlockwise (seen from above) from its placed rotation
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
}


// the lab: two rows of three desks, the first website on the front left one; desk pitch 1.5 across, 1.6 back
/** Lab stations along x: five on the long bench (far wall), three on the short one (near wall). */
const STATIONS_A = [-2.45, -1.5, -0.55, 0.4, 1.35];
const STATIONS_B = [-2.45, -1.5, -0.55];
export const LECTURE_ROWS = [
  { front: -8.8, back: -6.95, desk: -7.95, height: 0.36 },
  { front: -6.95, back: -5.1, desk: -6.1, height: 0.72 },
  { front: -5.1, back: -3.25, desk: -4.25, height: 1.08 },
] as const;

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
      { build: 'doorLeaf', at: [-4.2, 0, 2.05], rot: [0, 180, 0], live: 'door', door: [0.961, 0.985] }, // the return from Halifax; opens into the studio
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
      { model: 'television_02', at: [-8.85, 0.0, 6.2], rot: [0, 90, 0], scale: 1.5, live: 'tv', cap: 'Call of Duty: World at War, Nazi Zombies. Every evening.', href: 'https://www.youtube.com/results?search_query=nazi+zombies+world+at+war' }, // an old television on the floor
      { build: 'xbox360', at: [-8.77, 0.0, 6.7], rot: [0, 115, 0], cap: 'The Xbox 360. White, standing, always on.' },
      { build: 'pouf', at: [-6.25, 0.0, 6.3], rot: [0, 90, 0] },
      { model: 'xbox_controller', at: [-6.25, 0.375, 6.3], rot: [0, 75, 0], cap: 'The pad. Zombies until the power cut.' },
      { model: 'ceiling_fan', at: [-6.85, 2.7, 6.1], rot: [0, 90, 0], live: 'fan', cap: 'The ceiling fan. Delhi summers.' },
      { build: 'smallShelf', at: [-9.0, 0.0, 7.5], rot: [0, 90, 0] },
      { model: 'book_encyclopedia_set_01', at: [-8.98, 0.05, 7.5], rot: [0, 90, 0], scale: 0.55 },
      { build: 'figures', at: [-8.98, 0.33, 7.5], rot: [0, 90, 0], cap: 'The shelf. Naruto, Goku, Luffy, Ichigo, Saitama, Levi, Vegeta.' },
      { build: 'figures', at: [-8.98, 0.61, 7.5], rot: [0, 82, 0] },
      { build: 'jobsPoster', at: [-9.135, 1.85, 6.75], rot: [0, 90, 0], cap: "Here's to the crazy ones." },
      { build: 'rug', at: [-6.75, 0.002, 6.1], rot: [0, 90, 0] },
      { model: 'throw_pillows_01', at: [-6.25, 0.0, 5.1], rot: [0, 30, 0] },
      { model: 'football', at: [-7.05, 0.11, 4.8], rot: [0, 50, 0], cap: 'Barcelona. Messi.' },
      { build: 'curtains', at: [-9.07, 2.45, 5.0], rot: [0, 90, 0], live: 'curtain' },
      { build: 'skyline', at: [-9.5, 1.6, 5.0], rot: [0, 90, 0] },
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
    id: 'plaza', env: 'sky', tint: { sky: '#CFE4F7', ground: '#B9B0A2', power: 0.25 }, exposure: 0.8, envPower: 0.7, baked: true, outdoor: true,
    sun: { dir: [0.35, 0.55, -0.75], color: '#FFF1D6', power: 2.6, shadow: 1 },
    fog: { color: '#C6D8E6', near: 200, far: 900 },
    // the Embarcadero outside Google San Francisco, June 2019, from his photo. Entered from the lab's
    // south door at (1.4, 2.6) heading south: the planter and the white sign ahead facing the camera,
    // the hedge and the brown rail, the trophy on the wall; palms behind; the road, the lamp posts,
    // the cars and the piers on the left, east; the Bay Bridge ahead and left over the bay. Then a
    // right turn, west, then north through the Delhi room's entrance. Outdoors: shown only while in the plaza.
    props: [
      { build: 'plazaFloor', at: [4, 0, 2.6] },
      { build: 'facade', at: [0, 0, 0] }, // the outside of the rooms we came through, seen only from here
      { build: 'kerb', at: [10.1, 0, -17.2], rot: [0, 270, 0] },
      { build: 'road', at: [24.25, 0.02, -17.2], rot: [0, 270, 0] },
      { build: 'piers', at: [51, 0, -25.2], rot: [0, 90, 0] },
      { build: 'planter', at: [3.5, 0, -7.2], rot: [0, 0, 0] },
      { build: 'sign', at: [2.4, 2.4, -7.6], rot: [0, 0, 0], cap: 'Google San Francisco, the Embarcadero. June 2019, the Code-in trip.', href: 'https://codein.withgoogle.com/archive/2018/' },
      { build: 'trophy', at: [5.3, 0.92, -6.5], rot: [0, 270, 0], cap: 'Grand prize. One of 52 winners, out of thousands.' },
      { model: 'palm_medium', at: [0.4, 0, -10.2], rot: [0, 270, 0], scale: 0.55 },
      { model: 'palm_medium', at: [5.5, 0, -11.7], scale: 0.5, rot: [0, 150, 0] },
      { model: 'palm_medium', at: [8.4, 0, -10], scale: 0.6, rot: [0, 30, 0] },
      { model: 'island_tree_01', at: [-3, 0, -15.2], rot: [0, 270, 0], scale: 1.0 },
      { build: 'lampPost', at: [9.3, 0, -0.8], rot: [0, 270, 0] },
      { build: 'lampPost', at: [9.3, 0, -10.2], rot: [0, 270, 0] },
      { build: 'lampPost', at: [9.3, 0, -19.6], rot: [0, 270, 0] },
      { build: 'carSilver', at: [13.2, 0, -6.2], rot: [0, 90, 0] },
      { build: 'carRed', at: [13.6, 0, -16.2], rot: [0, 270, 0] },
      { build: 'carWhite', at: [20.6, 0, -26.2], rot: [0, 270, 0] },
      { build: 'water', at: [114, -0.2, -25.2], rot: [0, 270, 0], live: 'water', cap: 'The bay.' },
      { build: 'water', at: [114, -0.2, 134.8], rot: [0, 270, 0], live: 'water' },
      { build: 'water', at: [234, -0.2, -25.2], rot: [0, 270, 0], live: 'water' },
      { build: 'water', at: [234, -0.2, 134.8], rot: [0, 270, 0], live: 'water' },
      { build: 'bridge', at: [244, -0.2, -315.2], rot: [0, 235, 0], scale: 4 }, // its near tower 170 m off, left of the sign, rising out of frame
      { build: 'boats', at: [64, -0.2, 4.8], rot: [0, 270, 0] },
      { build: 'clouds', at: [4, 0, 10.8], rot: [0, 270, 0], live: 'sky', shadow: false }, // 400 m up and out: scoped, or they drift into the Toronto window
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
      { build: 'doorLeaf', at: [-2.4, 0, 1.15], live: 'door', door: [0.608, 0.634] },
    ],
  },
  {
    id: 'flight', env: 'studio', baked: true,
    tint: { sky: '#D8E8F2', ground: '#A7A59E', power: 0.4 }, exposure: 0.85, envPower: 0.55,
    sun: { dir: [0.6, 0.8, 0.3], color: '#FFF3DF', power: 2.2, shadow: 0.7 },
    fog: { color: '#A8CCDE', near: 100, far: 500 },
    props: [
      { build: 'boardingPassage', at: [0, 0, 0] },
      { build: 'aircraftCabin', at: [0, 0, 0] },
      ...[-8.5, -7.45, -6.4, -5.35].flatMap((z) => [-4.7, -4.13, -2.67, -2.1].map((x): Placement => ({ build: 'aircraftSeat', at: [x, 0, z] }))),
      { build: 'aircraftWing', at: [0, -1, 3.2] },
      { build: 'flightSky', at: [0, 0, 0], live: 'flight', shadow: false },
      { model: 'dalhousie_campus', at: [-120, 0, -62], live: 'flight', cap: 'Dalhousie University, Halifax. A 3D interpretation of the Goldberg Computer Science Building.', href: '/assets/stage/FLIGHT-CREDITS.md' },
      ...[-98, -70, -42, -14, 14].flatMap((z) => [-93, -157].map((x): Placement => ({ model: 'island_tree_01', at: [x, 0.1, z], scale: 0.3, live: 'flight', shadow: false }))),
      { build: 'flightSign', at: [-3.35, 1.82, -4.77], live: 'screen', cap: '2022. Leaving Delhi for Halifax, Canada.' },
      { build: 'flightSign', at: [-3.4, 2.05, -10.18], live: 'screen' },
      { build: 'halifaxSign', at: [-2.1, 2.26, -9.46], rot: [0, -90, 0], live: 'screen' },
      ...[-8.7, -6.6, -1.8, 0.5].map((z): Placement => ({ build: 'discLight', at: [-3.35, z < -4.8 ? 2.6 : 2.4, z], live: 'pendant', scale: 0.65 })),
    ],
  },
  {
    id: 'halifax', env: 'studio', baked: true,
    tint: { sky: '#E2EAF0', ground: '#B5AC94', power: 0.35 }, exposure: 0.8, envPower: 0.5,
    sun: { dir: [0.65, 0.5, -0.3], color: '#FFF0CF', power: 2.4, shadow: 0.8 },
    fog: { color: '#DEE7EC', near: 30, far: 200 },
    shell: { x: [-1.6, 4.8], z: [-10.2, -2], h: 4.2, floor: 'lectureFloor', wall: 'lectureWall', ceiling: 'labCeiling', openings: [
      { wall: 'x-', at: -9.45, w: 1.1, h: 2.1 },
      { wall: 'z+', at: -0.8, w: 1.1, h: 2.1, sill: 1.08 },
      ...[-8.3, -5.8, -3.3].map((z): Opening => ({ wall: 'x+', at: z, w: 1.8, h: 1.6, sill: 1.05 })),
    ] },
    props: [
      { build: 'lectureBoard', at: [1.55, 1.77, -10.15], live: 'screen', cap: 'Computer science at Dalhousie University. Halifax, Nova Scotia.' },
      { build: 'dalhousieSign', at: [1.55, 2.98, -10.13], live: 'screen' },
      { build: 'lectureTiers', at: [0, 0, 0] },
      { build: 'doorLeaf', at: [-1.58, 0, -10], scale: [1, 2.1 / 2.04, 1.1 / 0.85], live: 'door' },
      ...LECTURE_ROWS.flatMap((row) => [0.85, 3.3].flatMap((x): Placement[] => [
        { build: 'lectureBench', at: [x, row.height, row.desk] },
        ...[-0.48, 0.48].map((dx): Placement => ({ model: 'SchoolChair_01', at: [x + dx, row.height, row.desk + 0.63], rot: [0, 180, 0] })),
      ])),
      { model: 'laptop_14_aluminium', at: [1.25, 1.82, -4.25], live: 'monitor', screen: 'studyScreen', cap: 'Sitting in the top row of the Dalhousie computer science lecture theatre.' },
      { build: 'studyNotes', at: [0.58, 1.83, -4.13], live: 'screen', rot: [0, 6, 0] },
      { model: 'coffee_mug', at: [1.56, 1.82, -4.18], scale: 0.8 },
      { build: 'books', at: [3.75, 1.82, -4.25], rot: [0, 90, 0], scale: 0.7 },
      { model: 'wall_clock', at: [4.77, 2.78, -9.55], rot: [0, -90, 0] },
      ...[-8.3, -5.8, -3.3].map((z): Placement => ({ build: 'mullions', at: [4.79, 1.05, z], rot: [0, -90, 0], scale: [0.36, 0.8, 1] })),
      ...[-8.1, -5.1].flatMap((z) => [0, 3.3].map((x): Placement => ({ build: 'tube', at: [x, 4.12, z], live: 'tube' }))),
      { build: 'halifaxSign', at: [-1.57, 2.48, -9.45], rot: [0, 90, 0], live: 'screen' },
      { build: 'halifaxReturn', at: [0, 0, 0] },
      { model: 'potted_plant_01', at: [4.32, 1.08, -2.48], scale: 1.5 },
      { build: 'campusView', at: [0, 0, 0], live: 'city', shadow: false },
    ],
  },
];
