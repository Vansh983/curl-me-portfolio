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

/** A room: floor, four walls, ceiling, each a designed material (materials.ts). uv is in metres. */
export interface Shell {
  x: [number, number];
  z: [number, number];
  h: number;
  floor: string;
  wall: string;
  ceiling?: string;
  openings: Opening[];
}

/** `city`: a backdrop shown only in its own set; `sky`: a backdrop shown in its set and the one before it (seen through the exit door). */
export type Live = 'fan' | 'tv' | 'monitor' | 'tube' | 'curtain' | 'water' | 'bulb' | 'lamp' | 'screen' | 'city' | 'sky';

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
}

const grid = <T>(rows: number, cols: number, f: (r: number, c: number) => T): T[] => {
  const out: T[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(f(r, c));
  return out;
};

// the lab: two rows of three desks, the first website on the front left one; desk pitch 1.5 across, 1.6 back
const DX = (c: number) => 4.2 + c * 1.5;
const DZ = (r: number) => 0.5 - r * 1.6;

export const SETS: StageSet[] = [
  {
    // now: a small condo room high above Toronto at night. The desk lamp and the screens light
    // him; the city through the window lights the rest, cool and faint. Everything is close.
    id: 'now', env: 'studio', tint: { sky: '#4A5F8C', ground: '#1B1E2A', power: 0.07 }, exposure: 0.72, envPower: 0.035,
    sun: { dir: [0.2, 0.45, -0.85], color: '#8FA6D6', power: 0.2, shadow: 0.7 },
    fog: { color: '#141826', near: 8, far: 40 },
    shell: {
      x: [-8.4, -4.2], z: [-2.2, 2.2], h: 2.8,
      floor: 'condoFloor', wall: 'condoWall', ceiling: 'condoCeiling',
      openings: [
        { wall: 'x+', at: 1.6, w: 0.9, h: 2.05 },
        { wall: 'z-', at: -6.3, w: 4.0, h: 2.8, sill: 0 }, // floor to ceiling glass, a 2.8 m ceiling
      ],
    },
    props: [
      { build: 'mullions', at: [-6.3, 0, -2.2], scale: [0.8, 1.4, 1] },
      { build: 'city', at: [-6.3, -100, -2.2], live: 'city', cap: 'Toronto. The CN Tower from the 30th floor.', shadow: false },
      { build: 'nightSky', at: [-6.3, 0, -2.2], live: 'city', shadow: false },
      { build: 'rugGrey', at: [-5.1, 0, -0.4] },
      { build: 'desk', at: [-4.58, 0, -0.4], rot: [0, -90, 0], cap: 'Building Floqer. Most days, most nights.' },
      { build: 'deskHutch', at: [-4.34, 0.74, -0.4] },
      { build: 'books', at: [-4.34, 1.71, -0.55], cap: 'The shelf. Mostly systems and design.' },
      { build: 'books', at: [-4.34, 1.21, 0.0] },
      { build: 'badge', at: [-4.5, 1.69, -1.05], cap: 'Google Code-in 2018. Grand prize.' },
      { build: 'monitor', at: [-4.56, 0.74, -0.75], rot: [0, -100, 0], live: 'screen' },
      { build: 'monitorApp', at: [-4.56, 0.74, -0.08], rot: [0, -80, 0], live: 'screen' },
      { build: 'laptop', at: [-4.73, 0.74, 0.25], rot: [0, -120, 0], live: 'screen' },
      { build: 'pcTower', at: [-4.33, 0, 0.1], rot: [0, -90, 0] },
      { model: 'desk_lamp_arm_01', at: [-4.3, 0.74, -1.15], rot: [0, -150, 0], live: 'lamp', cap: 'The lamp. It is usually late.' },
      { build: 'officeChair', at: [-5.3, 0, -0.4], rot: [0, 90, 0], scale: [1.1, 1.12, 1.1] }, // its back away from the desk, behind him
      { model: 'steel_frame_shelves_01', at: [-8.12, 0, 0.3], rot: [0, 90, 0], scale: 0.1 }, // the scan is in centimetres
      { model: 'book_encyclopedia_set_01', at: [-8.12, 0.98, 0.3], rot: [0, 90, 0], scale: 0.9 },
      { model: 'book_encyclopedia_set_01', at: [-8.12, 1.5, 0.25], rot: [0, 90, 0], scale: 0.8 },
      { build: 'bed', at: [-6.7, 0, -1.72] },
      { model: 'potted_plant_01', at: [-8.05, 0, -1.85], scale: 0.9 },
      { model: 'modern_arm_chair_01', at: [-7.3, 0, 0.55], rot: [0, 200, 0], cap: 'The chair for reading. The city does the rest.' },
      { model: 'side_table_01', at: [-7.95, 0, 0.95] },
      { model: 'hanging_picture_frame_02', at: [-4.21, 1.6, 0.25], rot: [0, -90, 0] },
      { build: 'passage', at: [-4.2, 0, 1.0], scale: [0.6, 1, 1], live: 'bulb' },
    ],
  },
  {
    id: 'room', env: 'studio', tint: { sky: '#FFE6C6', ground: '#9C7B5A', power: 0.3 }, exposure: 0.8, envPower: 0.3,
    sun: { dir: [-0.3, 0.5, -0.8], color: '#FFD9A8', power: 3.2, shadow: 0.9 },
    fog: { color: '#EFE3D0', near: 12, far: 60 },
    shell: {
      x: [-2.4, 1.2], z: [-2.1, 2.1], h: 2.7,
      floor: 'roomFloor', wall: 'roomWall', ceiling: 'roomCeiling',
      openings: [
        { wall: 'x-', at: 1.6, w: 0.9, h: 2.05 },
        { wall: 'x+', at: 1.6, w: 0.9, h: 2.05 },
        { wall: 'z-', at: -1.7, w: 1.2, h: 1.3, sill: 0.95 },
      ],
    },
    props: [
      { model: 'television_02', at: [-0.5, 0, -1.8], scale: 1.5, live: 'tv', cap: 'Call of Duty: World at War, Nazi Zombies. Every evening.', href: 'https://www.youtube.com/results?search_query=nazi+zombies+world+at+war' }, // an old television on the floor
      { build: 'xbox360', at: [0.0, 0, -1.72], rot: [0, -25, 0], cap: 'The Xbox 360. White, standing, always on.' },
      { build: 'pouf', at: [-0.4, 0, 0.8] },
      { model: 'gamepad', at: [-0.4, 0.375, 0.8], rot: [0, 15, 0], cap: 'The pad. Zombies until the power cut.' },
      { model: 'ceiling_fan', at: [-0.6, 2.7, 0.2], live: 'fan', cap: 'The ceiling fan. Delhi summers.' },
      { build: 'smallShelf', at: [0.8, 0, -1.95] },
      { model: 'book_encyclopedia_set_01', at: [0.8, 0.05, -1.93], scale: 0.55 },
      { build: 'figures', at: [0.8, 0.33, -1.93], cap: 'The shelf. Naruto, Goku, Luffy, Ichigo, Saitama, Levi, Vegeta.' },
      { build: 'figures', at: [0.8, 0.61, -1.93], rot: [0, 8, 0] },
      { build: 'jobsPoster', at: [0.05, 1.85, -2.085], cap: "Here's to the crazy ones." },
      { build: 'rug', at: [-0.6, 0.002, 0.3] },
      { model: 'throw_pillows_01', at: [-1.6, 0, 0.8], rot: [0, 60, 0] },
      { model: 'football', at: [-1.9, 0.11, 0.0], rot: [0, 40, 0], cap: 'Barcelona. Messi.' },
      { build: 'curtains', at: [-1.7, 2.45, -2.02], live: 'curtain' },
      { build: 'skyline', at: [-1.7, 1.6, -2.45] },
      { build: 'passage', at: [1.2, 0, 1.0], scale: [0.6, 1, 1], live: 'bulb' },
    ],
  },
  {
    id: 'lab', env: 'studio', tint: { sky: '#E9F1FF', ground: '#A6ADB3', power: 0.35 }, exposure: 0.85, envPower: 0.6,
    sun: { dir: [-0.2, 0.9, 0.3], color: '#EEF3FF', power: 1.6, shadow: 0.6 },
    fog: { color: '#E6ECF1', near: 14, far: 70 },
    shell: {
      x: [3.0, 8.2], z: [-1.5, 3.5], h: 3.0,
      floor: 'labFloor', wall: 'labWall', ceiling: 'labCeiling',
      openings: [
        { wall: 'x-', at: 1.6, w: 0.9, h: 2.05 },
        { wall: 'x+', at: 2.6, w: 0.9, h: 2.05 },
        { wall: 'z-', at: 5.6, w: 4.0, h: 0.7, sill: 2.1 },
      ],
    },
    props: [
      ...grid(2, 3, (r, c): Placement => ({ model: 'SchoolDesk_01', at: [DX(c), 0, DZ(r)], rot: [0, 180, 0] })),
      ...grid(2, 3, (r, c): Placement => ({ model: 'SchoolChair_01', at: [DX(c), 0, DZ(r) + 0.65], rot: [0, 180, 0] })),
      ...grid(2, 3, (r, c): Placement => ({
        build: r === 0 && c === 0 ? 'labMonitorNotepad' : 'labMonitor', at: [DX(c), 0.76, DZ(r) - 0.12], live: 'screen',
        ...(r === 0 && c === 0 ? { cap: 'index.html in Notepad. The first website.' } : {}),
      })),
      ...grid(2, 3, (r, c): Placement => ({ build: 'pcTower', at: [DX(c) + 0.62, 0, DZ(r) - 0.05] })),
      ...grid(2, 3, (r, c): Placement => ({ build: 'keyboard', at: [DX(c), 0.76, DZ(r) + 0.25] })),
      { build: 'whiteboard', at: [5.6, 1.5, -1.47], cap: 'Wireframes sketched in class.' },
      { model: 'wall_clock', at: [7.8, 2.3, -1.47] },
      { build: 'banner', at: [4.0, 2.35, -1.47], cap: 'Converge Clan.' },
      { build: 'teamPhoto', at: [4.0, 1.55, -1.47] },
      { build: 'tube', at: [5.6, 2.95, 1.2], live: 'tube' },
      { build: 'doorFrame', at: [8.2, 0, 2.6], rot: [0, 90, 0] },
    ],
  },
  {
    id: 'plaza', env: 'sky', tint: { sky: '#CFE4F7', ground: '#B9B0A2', power: 0.25 }, exposure: 0.8, envPower: 0.7,
    sun: { dir: [0.35, 0.55, -0.75], color: '#FFF1D6', power: 2.6, shadow: 1 },
    fog: { color: '#C6D8E6', near: 200, far: 900 },
    // the Embarcadero outside Google San Francisco, June 2019, from his photo: the camera on the
    // sidewalk looking along it (+x); the planter and the white sign ahead facing the camera, the
    // hedge and the brown rail, the trophy on the wall; palms behind; the road, the lamp posts, the
    // cars and the piers on the left (-z); the Bay Bridge ahead and left over the bay.
    props: [
      { build: 'plazaFloor', at: [8.2, 0, 0] },
      { build: 'kerb', at: [28, 0, -6.1] },
      { build: 'road', at: [28, 0.02, -20.25] },
      { build: 'piers', at: [36, 0, -47], rot: [0, 180, 0] },
      { build: 'planter', at: [18, 0, 0.5], rot: [0, -90, 0] },
      { build: 'sign', at: [18.4, 2.4, 1.6], rot: [0, -90, 0], cap: 'Google San Francisco, the Embarcadero. June 2019, the Code-in trip.', href: 'https://codein.withgoogle.com/archive/2018/' },
      { build: 'trophy', at: [17.3, 0.92, -1.3], cap: 'Grand prize. One of 52 winners, out of thousands.' },
      { build: 'palm', at: [21, 0, 3.6] },
      { build: 'palm', at: [22.5, 0, -1.5], scale: 0.9 },
      { build: 'palm', at: [20.8, 0, -4.4], scale: 1.1 },
      { model: 'island_tree_01', at: [26, 0, 7], scale: 1.0 },
      { build: 'lampPost', at: [11.6, 0, -5.3] },
      { build: 'lampPost', at: [21, 0, -5.3] },
      { build: 'lampPost', at: [30.4, 0, -5.3] },
      { build: 'carSilver', at: [17, 0, -9.2], rot: [0, 180, 0] },
      { build: 'carRed', at: [27, 0, -9.6] },
      { build: 'carWhite', at: [37, 0, -16.6] },
      { build: 'water', at: [36, -0.2, -110], live: 'water', cap: 'The bay.' },
      { build: 'water', at: [-124, -0.2, -110], live: 'water' },
      { build: 'water', at: [36, -0.2, -230], live: 'water' },
      { build: 'water', at: [-124, -0.2, -230], live: 'water' },
      { build: 'bridge', at: [326, -0.2, -240], rot: [0, 35, 0], scale: 4 }, // its near tower 170 m off, left of the sign, rising out of frame
      { build: 'boats', at: [6, -0.2, -60] },
      { build: 'clouds', at: [0, 0, 0], live: 'sky', shadow: false }, // 400 m up and out: scoped, or they drift into the Toronto window
    ],
  },
];
