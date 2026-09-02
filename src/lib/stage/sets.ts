// The world as data: four sets along +x, each with its light, its shell and what stands in it.
// Metres, y up. Spec: docs/rebuild/13-journey-real-spec.md; layout: 14-journey-real-plan.md.
//
//   Set 0 NOW      x -8.4..-4.2  z -2.2..2.2   h 2.5   Toronto, high up; window on z-, door on +x wall at z 1.6
//   Passage        x -4.2..-2.2  z  1.0..2.2   h 2.4
//   Set 1 ROOM     x -2.2..2.2   z -2.5..2.5   h 2.8   doors on x- and x+ walls at z 1.6
//   Passage        x  2.2..5.2   z  1.0..2.2   h 2.4   plain, one bulb
//   Set 2 LAB      x  5.2..12.2  z -1.5..4.5   h 3.0   door in at z 1.6 (x-), door out at z 3.4 (x+)
//   Set 3 PLAZA    x 12.2..80    z -60..20     open    the bay beyond z < -35, the bridge at z -150
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

export type Live = 'fan' | 'tv' | 'monitor' | 'tube' | 'curtain' | 'water' | 'bulb' | 'him' | 'lamp' | 'screen' | 'city';

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

// the lab: three rows of three desks, his the front left; desk pitch 1.5 across, 1.6 back
const DX = (c: number) => 6.6 + c * 1.5;
const DZ = (r: number) => 0.5 - r * 1.6;

export const SETS: StageSet[] = [
  {
    // now: a small condo room high above Toronto at night. The desk lamp and the screens light
    // him; the city through the window lights the rest, cool and faint. Everything is close.
    id: 'now', env: 'studio', tint: { sky: '#4A5F8C', ground: '#1B1E2A', power: 0.07 }, exposure: 0.72, envPower: 0.035,
    sun: { dir: [0.2, 0.45, -0.85], color: '#8FA6D6', power: 0.2, shadow: 0.7 },
    fog: { color: '#141826', near: 8, far: 40 },
    shell: {
      x: [-8.4, -4.2], z: [-2.2, 2.2], h: 2.5,
      floor: 'condoFloor', wall: 'condoWall', ceiling: 'condoCeiling',
      openings: [
        { wall: 'x+', at: 1.6, w: 0.9, h: 2.05 },
        { wall: 'z-', at: -6.3, w: 4.0, h: 2.5, sill: 0 }, // floor to ceiling glass
      ],
    },
    props: [
      { build: 'mullions', at: [-6.3, 0, -2.2], scale: [0.8, 1.25, 1] },
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
      { model: 'base_character', at: [-5.3, 0, -0.4], rot: [0, -90, 0], scale: 0.92, live: 'him', cap: 'Me. Hoodie, glasses, two screens and a laptop.' },
      { model: 'steel_frame_shelves_01', at: [-8.12, 0, 0.3], rot: [0, 90, 0], scale: 0.1 }, // the scan is in centimetres
      { model: 'book_encyclopedia_set_01', at: [-8.12, 0.98, 0.3], rot: [0, 90, 0], scale: 0.9 },
      { model: 'book_encyclopedia_set_01', at: [-8.12, 1.5, 0.25], rot: [0, 90, 0], scale: 0.8 },
      { build: 'bed', at: [-6.7, 0, -1.72] },
      { model: 'potted_plant_01', at: [-8.05, 0, -1.85], scale: 0.9 },
      { build: 'passage', at: [-4.2, 0, 1.0], live: 'bulb' },
    ],
  },
  {
    id: 'room', env: 'studio', tint: { sky: '#FFE6C6', ground: '#9C7B5A', power: 0.3 }, exposure: 0.8, envPower: 0.3,
    sun: { dir: [-0.3, 0.5, -0.8], color: '#FFD9A8', power: 3.2, shadow: 0.9 },
    fog: { color: '#EFE3D0', near: 12, far: 60 },
    shell: {
      x: [-2.2, 2.2], z: [-2.5, 2.5], h: 2.8,
      floor: 'roomFloor', wall: 'roomWall', ceiling: 'roomCeiling',
      openings: [
        { wall: 'x-', at: 1.6, w: 0.9, h: 2.05 },
        { wall: 'x+', at: 1.6, w: 0.9, h: 2.05 },
        { wall: 'z-', at: -1.1, w: 1.3, h: 1.4, sill: 0.95 },
      ],
    },
    props: [
      { build: 'tvTable', at: [0, 0, -2.15] },
      { model: 'television_02', at: [0, 0.62, -2.15], scale: 1.3, live: 'tv', cap: 'Call of Duty: World at War, Nazi Zombies. Every evening.', href: 'https://www.youtube.com/results?search_query=nazi+zombies+world+at+war' },
      { model: 'gaming_console', at: [0.55, 0.005, -2.05], rot: [0, -20, 0], cap: 'The Xbox 360.' },
      { model: 'gamepad', at: [-0.35, 0.005, 0.2], rot: [0, 35, 0] },
      { model: 'ceiling_fan', at: [0, 2.8, 0.2], live: 'fan', cap: 'The ceiling fan. Delhi summers.' },
      { build: 'shelf', at: [1.5, 0, -2.3] },
      { model: 'book_encyclopedia_set_01', at: [1.5, 1.24, -2.28], scale: 0.9 },
      { build: 'jobsPoster', at: [0.75, 1.9, -2.485], cap: "Here's to the crazy ones." },
      { build: 'rug', at: [0, 0.002, 0.3] },
      { model: 'throw_pillows_01', at: [-0.9, 0, 0.9], rot: [0, 60, 0] },
      { model: 'football', at: [-1.3, 0.11, 0.1], rot: [0, 40, 0], cap: 'Barcelona. Messi.' },
      { build: 'curtains', at: [-1.1, 2.55, -2.42], live: 'curtain' },
      { build: 'skyline', at: [-1.1, 1.65, -2.85] },
      { build: 'passage', at: [2.2, 0, 1.0], live: 'bulb' },
    ],
  },
  {
    id: 'lab', env: 'studio', tint: { sky: '#E9F1FF', ground: '#A6ADB3', power: 0.35 }, exposure: 0.85, envPower: 0.6,
    sun: { dir: [-0.2, 0.9, 0.3], color: '#EEF3FF', power: 1.6, shadow: 0.6 },
    fog: { color: '#E6ECF1', near: 14, far: 70 },
    shell: {
      x: [5.2, 12.2], z: [-1.5, 4.5], h: 3.0,
      floor: 'labFloor', wall: 'labWall', ceiling: 'labCeiling',
      openings: [
        { wall: 'x-', at: 1.6, w: 0.9, h: 2.05 },
        { wall: 'x+', at: 3.4, w: 0.9, h: 2.05 },
        { wall: 'z-', at: 8.7, w: 5.5, h: 0.7, sill: 2.1 },
      ],
    },
    props: [
      ...grid(3, 3, (r, c): Placement => ({ model: 'SchoolDesk_01', at: [DX(c), 0, DZ(r)], rot: [0, 180, 0] })),
      ...grid(3, 3, (r, c): Placement => ({ model: 'SchoolChair_01', at: [DX(c), 0, DZ(r) + 0.65], rot: [0, 180, 0] })),
      ...grid(3, 3, (r, c): Placement => ({
        model: 'television_02', at: [DX(c), 0.76, DZ(r) - 0.12], scale: 0.62, live: 'monitor',
        ...(r === 0 && c === 0 ? { cap: 'index.html in Notepad. The first website.' } : {}),
      })),
      ...grid(3, 3, (r, c): Placement => ({ build: 'keyboard', at: [DX(c), 0.76, DZ(r) + 0.25] })),
      { build: 'whiteboard', at: [8.7, 1.5, -1.47], cap: 'Wireframes sketched in class.' },
      { model: 'wall_clock', at: [11.0, 2.3, -1.47] },
      { build: 'banner', at: [6.4, 2.35, -1.47], cap: 'Converge Clan.' },
      { build: 'teamPhoto', at: [6.4, 1.55, -1.47] },
      { build: 'tube', at: [8.7, 2.95, 1.5], live: 'tube' },
    ],
  },
  {
    id: 'plaza', env: 'sky', tint: { sky: '#CFE4F7', ground: '#B9B0A2', power: 0.25 }, exposure: 0.8, envPower: 0.7,
    sun: { dir: [0.35, 0.55, -0.75], color: '#FFF1D6', power: 2.6, shadow: 1 },
    fog: { color: '#C6D8E6', near: 200, far: 900 },
    props: [
      { build: 'plazaFloor', at: [12.2, 0, 0] },
      { build: 'counter', at: [22, 0, -10] },
      { build: 'sign', at: [22, 1.55, -10.6], cap: 'Google Code-in 2018, grand prize.', href: 'https://codein.withgoogle.com/archive/2018/' },
      { build: 'trophy', at: [21.2, 0.92, -9.8], cap: 'The trophy.' },
      { model: 'street_lamp_01', at: [15.5, 0, -3] },
      { model: 'modular_street_seating', at: [18, 0, 2], rot: [0, 90, 0] },
      { model: 'island_tree_01', at: [28, 0, -6], scale: 1.1 },
      { model: 'island_tree_01', at: [14, 0, -14], rot: [0, 130, 0], scale: 0.9 },
      { build: 'water', at: [30, -0.2, -95], live: 'water', cap: 'The bay.' },
      { build: 'bridge', at: [30, -0.2, -150] },
      { build: 'boats', at: [10, -0.2, -60] },
    ],
  },
];
