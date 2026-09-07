// The world as data: four sets along +x, each with its light, its shell and what stands in it.
// Metres, y up. Spec: docs/rebuild/13-journey-real-spec.md; layout: 14-journey-real-plan.md.
//
//   Set 0 NOW      x -8.4..-4.2  z -2.2..2.2   h 2.8   Toronto, high up; window on z-, door on +x wall at z 1.6
//   Passage        x -4.2..-2.4  z  1.0..2.2   h 2.4
//   Set 1 ROOM     x -2.4..1.2   z -2.1..2.1   h 2.7   compact; doors on x- and x+ walls at z 1.6
//   Passage        x  1.2..3.0   z  1.0..2.2   h 2.4   plain, one bulb
//   Set 2 LAB      x  3.0..8.2   z -1.5..3.5   h 3.0   two rows of three desks; door in at z 1.6 (x-), out at z 2.6 (x+)
//   Set 3 SF       x  8.2..      z open        the Embarcadero; the bay beyond z < -50, the bridge 170 m off
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
export type Live = 'fan' | 'tv' | 'monitor' | 'tube' | 'curtain' | 'water' | 'bulb' | 'lamp' | 'pendant' | 'screen' | 'city' | 'sky';

/** Something standing in a set: a scanned model by manifest id, or a code-built prop by name. */
export interface Placement {
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

export const SETS: StageSet[] = [
  {
    // now: a one bedroom condo on the 51st floor over Toronto at night. Bedroom and bathroom in the
    // west half either side of a partition, an open living room, kitchen and hall in the east half,
    // glass along the whole south side. The walk starts at the bedroom window, goes through the
    // bedroom door, across the living room past the desk and the kitchen, and out of the front door.
    id: 'now', env: 'studio', tint: { sky: '#4A5F8C', ground: '#1B1E2A', power: 0.07 }, exposure: 0.72, envPower: 0.035, baked: true,
    sun: { dir: [0.2, 0.45, -0.85], color: '#8FA6D6', power: 0.2, shadow: 0.7 },
    fog: { color: '#141826', near: 8, far: 40 },
    shell: {
      x: [-13.0, -4.2], z: [-3.4, 2.2], h: 2.8,
      floor: 'condoFloor', wall: 'condoWall', ceiling: 'condoCeiling',
      openings: [
        { wall: 'z+', at: -5.45, w: 0.9, h: 2.05 }, // the front door, from the hall north into the passage
        { wall: 'x+', at: 1.6, w: 0.9, h: 2.05 }, // the door in the brick: the journey comes back in through it at the end
        { wall: 'z-', at: -11.2, w: 3.4, h: 2.8, sill: 0 }, // the bedroom's glass, the whole wall
        { wall: 'z-', at: -6.8, w: 4.6, h: 2.8, sill: 0 }, // the living room's glass
      ],
      walls: [
        { from: [-9.4, -3.4], to: [-9.4, 2.2], doors: [{ at: 2.8, w: 0.85, h: 2.05 }, { at: 4.8, w: 0.75, h: 2.05 }] }, // bedroom door at z -0.6, bathroom door at z 1.4
        { from: [-13.0, 0], to: [-9.4, 0] }, // bedroom | bathroom
      ],
    },
    props: [
      { build: 'mullions', at: [-11.2, 0, -3.4], scale: [0.68, 1.4, 1] },
      { build: 'mullions', at: [-6.8, 0, -3.4], scale: [0.92, 1.4, 1] },
      { build: 'city', at: [-6.8, -155, -3.4], live: 'city', cap: 'Toronto. The CN Tower from the 51st floor.', shadow: false },
      { build: 'nightSky', at: [-6.8, 0, -3.4], live: 'city', shadow: false },
      { build: 'condoBrick', at: [-4.2, 0, 0] },
      { build: 'condoSkirting', at: [0, 0, 0] },
      // the bedroom: the bed's head on the west wall, a walkway along the bathroom wall to the door, a low dresser under the door wall
      { model: 'bed_double', at: [-11.75, 0, -1.95], rot: [0, 90, 0], cap: 'Bed. Not used enough.' },
      { model: 'nightstand_modern', at: [-12.65, 0, -0.5] },
      { model: 'desk_lamp_arm_01', at: [-12.7, 0.55, -0.5], rot: [0, 120, 0], scale: 0.7 },
      { model: 'tv_stand', at: [-9.67, 0, -2.5], rot: [0, -90, 0] }, // as a dresser
      { model: 'wall_art_circles', at: [-12.965, 1.55, -1.95], rot: [90, 0, -90] },
      { model: 'pendant_tense', at: [-11.4, 1.78, -1.95], live: 'pendant' },
      { build: 'doorLeaf', at: [-9.4, 0, -0.175], rot: [0, -85, 0] }, // the bedroom door, hinged on the north jamb, open flat against the bedroom wall
      // the bathroom
      { build: 'bathTiles', at: [0, 0, 0] },
      { model: 'bathtub_abrazo', at: [-12.55, 0, 1.1], rot: [0, 90, 0] },
      { build: 'showerHead', at: [-12.98, 0, 1.1] },
      { model: 'toilet_ceramic', at: [-11.5, 0, 2.13], rot: [0, 180, 0] },
      { model: 'basin_mirror', at: [-10.5, 0.85, 0.06], rot: [90, 180, 0] },
      { build: 'discLight', at: [-11.2, 2.8, 1.1], live: 'pendant' },
      { build: 'doorLeaf', at: [-9.4, 0, 1.775], rot: [0, -100, 0] }, // the bathroom door, open into the bathroom
      // the living room: the desk on the brick, the television across from the sofa, the armchair by the glass
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
      { model: 'tv_stand', at: [-4.44, 0, -0.4], rot: [0, -90, 0] },
      { build: 'wallTv', at: [-4.23, 0, -0.4] },
      { model: 'sofa_teak', at: [-8.55, 0, 0.5], rot: [0, 90, 0], cap: 'The sofa. For thinking, mostly.' },
      { model: 'coffee_table_square', at: [-7.6, 0, -0.45] },
      { model: 'throw_pillows_01', at: [-8.9, 0.45, -1.2], rot: [0, 90, 0], scale: 0.8 },
      { model: 'steel_frame_shelves_01', at: [-9.12, 0, -2.6], rot: [0, 90, 0], scale: 0.1 }, // the scan is in centimetres
      { model: 'book_encyclopedia_set_01', at: [-9.12, 0.98, -2.6], rot: [0, 90, 0], scale: 0.9 },
      { model: 'book_encyclopedia_set_01', at: [-9.12, 1.5, -2.65], rot: [0, 90, 0], scale: 0.8 },
      { model: 'potted_plant_01', at: [-8.95, 0, -3.1], scale: 0.9 },
      { model: 'modern_arm_chair_01', at: [-7.3, 0, -2.6], rot: [0, 220, 0], cap: 'The chair for reading. The city does the rest.' },
      { model: 'side_table_01', at: [-7.95, 0, -2.3] },
      { model: 'pendant_tense', at: [-7.3, 1.78, -2.6], live: 'pendant', cap: 'The corner for reading.' }, // its cord reaches the ceiling at 2.8
      { model: 'pendant_tense', at: [-7.6, 1.78, -0.45], live: 'pendant' },
      // the kitchen along the north wall, the hall to the front door
      { model: 'kitchen_modern', at: [-7.74, 0, 1.48], rot: [0, 180, 0], scale: 0.85, cap: 'The kitchen. Coffee, mostly.' }, // 3.4 m of it, from the partition to the hall
      { build: 'discLight', at: [-7.7, 2.8, 1.2], live: 'pendant' },
      { model: 'shoe_rack_modern', at: [-4.53, 0, 2.0], scale: 0.8 }, // between the front door and the corner
      { model: 'wall_art_circles', at: [-4.235, 1.3, 0.75], rot: [90, 0, 90] },
      { build: 'passage', at: [-4.85, 0, 2.2], rot: [0, -90, 0], scale: [0.7, 1, 1], live: 'bulb' }, // north from the front door, 2.1 m, to the 2010 room
      { build: 'passage', at: [-4.2, 0, 1.0], scale: [0.6, 1, 1], live: 'bulb' }, // east from the brick door: the way back in from the plaza
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
    // right turn, west, to the brick door back into the apartment. Outdoors: shown only from the lab on.
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
];
