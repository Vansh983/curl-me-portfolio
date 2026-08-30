// The world as data: three sets along +x, each with its light, its shell and what stands in it.
// Metres, y up. Spec: docs/rebuild/13-journey-real-spec.md; layout: 14-journey-real-plan.md.
//
//   Set 0 ROOM     x -2.2..2.2   z -2.5..2.5   h 2.8   door on +x wall at z 1.6
//   Passage        x  2.2..5.2   z  1.0..2.2   h 2.4   dark, one bulb
//   Set 1 LAB      x  5.2..12.2  z -1.5..4.5   h 3.0   door in at z 1.6 (x-), door out at z 3.4 (x+)
//   Set 2 PLAZA    x 12.2..80    z -60..20     open    the bay beyond z < -22, the bridge at z -120
export type V3 = [number, number, number];

/** A hole in a wall. `at` is the world coordinate along the wall, `sill` the bottom height (0 for a door). */
export interface Opening { wall: 'x+' | 'x-' | 'z+' | 'z-'; at: number; w: number; h: number; sill?: number }

/** A room: floor, four walls, ceiling, with scanned surfaces. `tile` is metres per texture repeat. */
export interface Shell {
  x: [number, number];
  z: [number, number];
  h: number;
  floor: string;
  wall: string;
  ceiling?: string;
  openings: Opening[];
  tile: { floor: number; wall: number };
}

export type Live = 'fan' | 'tv' | 'monitor' | 'tube' | 'curtain' | 'water' | 'bulb';

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
  hdri: string; // manifest id
  hdriRot: number; // degrees about y, so the photograph's sun lands where the window is
  exposure: number;
  envPower: number;
  background: boolean; // the HDRI is visible (outdoors) or only lights (indoors)
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
    id: 'room', hdri: 'small_empty_room_1', hdriRot: 90, exposure: 1.15, envPower: 1, background: false,
    sun: { dir: [-0.3, 0.5, -0.8], color: '#FFD9A8', power: 3, shadow: 1 },
    fog: { color: '#E9DCC6', near: 12, far: 60 },
    shell: {
      x: [-2.2, 2.2], z: [-2.5, 2.5], h: 2.8,
      floor: 'plank_flooring', wall: 'plastered_wall', ceiling: 'ceiling_interior',
      tile: { floor: 2.0, wall: 3.0 },
      openings: [
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
      { model: 'wooden_bookshelf_worn', at: [1.5, 0, -2.2], scale: 0.85 },
      { model: 'book_encyclopedia_set_01', at: [1.5, 1.06, -2.2], scale: 0.9 },
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
    id: 'lab', hdri: 'school_hall', hdriRot: 0, exposure: 0.95, envPower: 1, background: false,
    sun: { dir: [-0.2, 0.9, 0.3], color: '#EEF3FF', power: 1.4, shadow: 0.7 },
    fog: { color: '#E1E8EE', near: 14, far: 70 },
    shell: {
      x: [5.2, 12.2], z: [-1.5, 4.5], h: 3.0,
      floor: 'old_linoleum_flooring_01', wall: 'white_plaster_02', ceiling: 'ceiling_interior',
      tile: { floor: 2.0, wall: 3.0 },
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
    id: 'plaza', hdri: 'golden_gate_hills', hdriRot: 200, exposure: 0.85, envPower: 1, background: true,
    sun: { dir: [0.35, 0.55, -0.75], color: '#FFF1D6', power: 3.2, shadow: 1 },
    fog: { color: '#D6E3EC', near: 60, far: 700 },
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
