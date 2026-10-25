// The walk: the bottom of the phone is a side scroller. He walks right as the
// page scrolls, through the places of the story in order, a door between each.
// Each phase names its sky (or wall), its ground, and what stands in it, in
// three layers that slide at their own speed: far (0.35), mid (0.7), near (1).
// A prop is placed from the phase's start, x in px (a negative x from its end), y in px up from the ground.
// `every` repeats a prop along the whole phase. What stands where follows the
// stage's own sets (src/lib/stage/sets.ts): his rooms, his cities.

export type Layer = 'far' | 'mid' | 'near';
export type Prop = { x: number; y: number; w: number; h: number; c: string; s?: string; r?: number; every?: number; o?: number };
export type Phase = {
  id: string;
  chapter: string;
  sky: string; // the strip's colour behind everything: a wall indoors, the sky outside
  wall?: boolean; // indoors: an opaque wall in the near layer, so the next place shows only past the door
  ground: string;
  far?: Prop[];
  mid?: Prop[];
  near?: Prop[];
};

export const PARALLAX: Record<Layer, number> = { far: 0.35, mid: 0.7, near: 1 };
export const GROUND = 34; // px, the band he walks on

export const PHASES: Phase[] = [
  {
    // the apartment, Toronto, night: the glass with the city, the desk with two screens, the pendant, the bed
    id: 'now',
    wall: true,
    chapter: 'now',
    sky: '#1C2133',
    ground: '#15192A',
    far: [{ x: 0, y: 40, w: 420, h: 120, c: '#0E1322', s: 'city', every: 420 }],
    near: [
      { x: 20, y: 30, w: 230, h: 170, c: '#3E5484', s: 'glass' },
      { x: 300, y: 150, w: 36, h: 120, c: '#2A2A2A', s: 'pendant' },
      { x: 40, y: 40, w: 130, h: 7, c: '#3A3836' },
      { x: 50, y: 47, w: 36, h: 24, c: '#DCE8FF', s: 'lcd' },
      { x: 94, y: 47, w: 36, h: 24, c: '#DCE8FF', s: 'lcd' },
      { x: 60, y: 0, w: 60, h: 40, c: '#242424', r: 8 },
      { x: 250, y: 0, w: 110, h: 32, c: '#59607A', s: 'bed', r: 4 },
    ],
  },
  {
    // the room, Delhi, 2010: the window with its grille, the poster, the PC desk, the screen, the Xbox beside it
    id: 'room',
    wall: true,
    chapter: 'room',
    sky: '#E6D3B4',
    ground: '#9C7B5A',
    near: [
      { x: 170, y: 90, w: 110, h: 100, c: '#FFE6C6', s: 'grille' },
      { x: 60, y: 130, w: 36, h: 48, c: '#111111', s: 'poster' },
      { x: 30, y: 40, w: 130, h: 7, c: '#B48A5A' },
      { x: 44, y: 47, w: 42, h: 30, c: '#1F2A3A', s: 'game' },
      { x: 96, y: 47, w: 9, h: 22, c: '#EDEDED', r: 1 },
      { x: 128, y: 0, w: 16, h: 40, c: '#D9D2C2' },
      { x: 60, y: 0, w: 50, h: 36, c: '#3A3A3A', r: 8 },
      { x: 330, y: 0, w: 14, h: 12, c: '#F2F2F2', r: 50 },
    ],
  },
  {
    // the lab, 2013: the tube lights, one long bench, a station every metre
    id: 'lab',
    wall: true,
    chapter: 'lab',
    sky: '#DCDCD4',
    ground: '#A6ADB3',
    near: [
      { x: 40, y: 230, w: 110, h: 6, c: '#F7F7F2', s: 'tube', every: 240 },
      { x: 0, y: 40, w: 9999, h: 7, c: '#C9C3B4' },
      { x: 0, y: 0, w: 9999, h: 40, c: '#B5AFA1' },
      { x: 30, y: 47, w: 40, h: 30, c: '#1C2430', s: 'lcd', every: 130 },
      { x: 100, y: 0, w: 4, h: 50, c: '#8F959A', every: 130 },
    ],
  },
  {
    // Google, 2019: the sun, the trees, the Android lawn, the block with the door into Delhi
    id: 'google',
    chapter: 'google-code-in',
    sky: '#CFE4F7',
    ground: '#9DAF7C',
    far: [
      { x: 60, y: 200, w: 40, h: 40, c: '#FFF3C4', s: 'sun', r: 50 },
      { x: 0, y: 40, w: 300, h: 90, c: '#4E7A3A', s: 'trees', every: 300 },
    ],
    mid: [{ x: 200, y: 0, w: 160, h: 150, c: '#F2F2F2' }],
    near: [
      { x: 30, y: 0, w: 30, h: 36, c: '#A4C639', s: 'android', r: 40 },
      { x: 90, y: 0, w: 36, h: 44, c: '#A4C639', s: 'android', r: 40 },
      { x: 150, y: 0, w: 26, h: 30, c: '#A4C639', s: 'android', r: 40 },
    ],
  },
  {
    // Delhi, 2020, at night: the wide desk, two monitors, books over it, the curtain, the bed
    id: 'delhi',
    wall: true,
    chapter: 'webcube',
    sky: '#3A3026',
    ground: '#2A2119',
    near: [
      { x: 20, y: 110, w: 170, h: 10, c: '#6E5A48', s: 'spines' },
      { x: 240, y: 20, w: 100, h: 200, c: '#6E5A4A', s: 'curtain' },
      { x: 20, y: 40, w: 170, h: 7, c: '#5A4634' },
      { x: 30, y: 47, w: 38, h: 28, c: '#0D1016', s: 'on' },
      { x: 76, y: 47, w: 38, h: 28, c: '#0D1016', s: 'on' },
      { x: 126, y: 47, w: 30, h: 14, c: '#2B2B2B' },
      { x: 60, y: 0, w: 50, h: 36, c: '#222222', r: 8 },
      { x: 250, y: 0, w: 100, h: 30, c: '#5A4A4A', s: 'bed', r: 4 },
    ],
  },
  {
    // the flight, 2022: down the aisle, a porthole and a seat back every row, Halifax in the windows
    id: 'flight',
    wall: true,
    chapter: 'halifax',
    sky: '#D9DBDF',
    ground: '#B8BBC2',
    near: [
      { x: 40, y: 120, w: 40, h: 54, c: '#BFD6F0', s: 'porthole', r: 40, every: 150 },
      { x: 0, y: 0, w: 80, h: 120, c: '#2B3A5C', r: 8, every: 150 },
      { x: 14, y: 60, w: 50, h: 34, c: '#0B1A33', s: 'map', every: 150 },
    ],
  },
  {
    // the hall, Dalhousie: the screen down for the lecture, the lectern, the tiers of red seats
    id: 'hall',
    wall: true,
    chapter: 'shiftkey',
    sky: '#4A3A30',
    ground: '#2E2A28',
    near: [
      { x: 40, y: 110, w: 180, h: 90, c: '#0E1A2B', s: 'slide' },
      { x: 70, y: 0, w: 26, h: 44, c: '#8B6A3A' },
      { x: 240, y: 0, w: 300, h: 70, c: '#7A1F2E', s: 'tiers' },
    ],
  },
  {
    // Sydney, 2024, Bean's house: the window on the harbour with the Opera House, two pendants, the trestle table, a mattress
    id: 'sydney',
    wall: true,
    chapter: 'bean',
    sky: '#F0EBE2',
    ground: '#B89A78',
    near: [
      { x: 20, y: 100, w: 140, h: 100, c: '#C9D8E6' },
      { x: 40, y: 110, w: 100, h: 34, c: '#F7F7F7', s: 'sails' },
      { x: 220, y: 150, w: 30, h: 110, c: '#222222', s: 'pendant' },
      { x: 330, y: 150, w: 30, h: 110, c: '#222222', s: 'pendant' },
      { x: 180, y: 40, w: 200, h: 7, c: '#D9C9A8' },
      { x: 196, y: 47, w: 38, h: 28, c: '#111111', s: 'on' },
      { x: 246, y: 47, w: 38, h: 28, c: '#111111', s: 'on' },
      { x: 296, y: 47, w: 38, h: 28, c: '#111111', s: 'on' },
      { x: 20, y: 0, w: 110, h: 18, c: '#6E8AA8', r: 10 },
    ],
  },
  {
    // Vancouver, May: the North Shore, the inlet, Canada Place's sails, the rail, the trees in leaf
    id: 'vancouver',
    chapter: 'vancouver',
    sky: '#D8DEE3',
    ground: '#B7B0A6',
    far: [
      { x: 0, y: 70, w: 400, h: 90, c: '#5E6E7E', s: 'mountains', every: 400 },
      { x: 0, y: 36, w: 9999, h: 40, c: '#7F93A3' },
      { x: 120, y: 72, w: 110, h: 34, c: '#F4F4F4', s: 'sails' },
    ],
    mid: [
      { x: 60, y: 60, w: 70, h: 90, c: '#4E7A3A', r: 50, every: 260 },
      { x: 92, y: 20, w: 8, h: 50, c: '#4E3A2A', every: 260 },
    ],
    near: [
      { x: 0, y: 34, w: 9999, h: 4, c: '#4A4A4A' },
      { x: 0, y: 0, w: 4, h: 36, c: '#4A4A4A', every: 40 },
      { x: 180, y: 0, w: 6, h: 110, c: '#333333', every: 360 },
      { x: 172, y: 106, w: 22, h: 8, c: '#333333', every: 360 },
    ],
  },
  {
    // Toronto, October: the city across the water with the tower, the maples turned
    id: 'toronto',
    chapter: 'toronto',
    sky: '#F2C58A',
    ground: '#B7A58F',
    far: [
      { x: 0, y: 70, w: 400, h: 60, c: '#3A2E2A', s: 'skyline', every: 400 },
      { x: 250, y: 100, w: 9, h: 170, c: '#3A2E2A', s: 'tower' },
      { x: 0, y: 36, w: 9999, h: 40, c: '#9A7A5A' },
    ],
    mid: [
      { x: 60, y: 60, w: 76, h: 100, c: '#D1662A', r: 50, every: 260 },
      { x: 94, y: 20, w: 8, h: 50, c: '#4E3A2A', every: 260 },
    ],
    near: [
      { x: 0, y: 34, w: 9999, h: 4, c: '#4A4A4A' },
      { x: 0, y: 0, w: 4, h: 36, c: '#4A4A4A', every: 40 },
      { x: 180, y: 0, w: 6, h: 110, c: '#333333', every: 360 },
      { x: 172, y: 106, w: 22, h: 8, c: '#333333', every: 360 },
    ],
  },
  {
    // Halifax, January, dusk: downtown up the hill, the harbour, the ferry, the lamps lit, Volta lit at the end
    id: 'halifax',
    chapter: 'volta',
    sky: '#3B4668',
    ground: '#E6E8EC',
    far: [
      { x: 0, y: 70, w: 400, h: 80, c: '#2A3148', s: 'hill', every: 400 },
      { x: 0, y: 36, w: 9999, h: 40, c: '#2C3A55' },
      { x: 140, y: 40, w: 60, h: 16, c: '#1E2436', s: 'ferry' },
    ],
    mid: [{ x: -150, y: 0, w: 130, h: 180, c: '#2E3340', s: 'volta' }],
    near: [
      { x: 0, y: 34, w: 9999, h: 4, c: '#5A5A60' },
      { x: 0, y: 0, w: 4, h: 36, c: '#5A5A60', every: 40 },
      { x: 160, y: 0, w: 6, h: 110, c: '#333333', every: 320 },
      { x: 152, y: 106, w: 22, h: 8, c: '#FFD27A', s: 'lit', every: 320 },
    ],
  },
  {
    // the Cohn, 2026: the proscenium, the banner, the stage, the lectern
    id: 'stage',
    wall: true,
    chapter: 'degree',
    sky: '#6E6258',
    ground: '#2A2422',
    near: [
      { x: 0, y: 220, w: 9999, h: 200, c: '#2A2422' },
      { x: 130, y: 110, w: 90, h: 90, c: '#111111', s: 'banner' },
      { x: 0, y: 0, w: 9999, h: 26, c: '#3A2E26' },
      { x: 80, y: 26, w: 26, h: 44, c: '#8B6A3A' },
      { x: 220, y: 26, w: 120, h: 30, c: '#5A4A3A', s: 'chairs' },
    ],
  },
  {
    // Floqer's house, now: the brick with the F, the windows on downtown, the desks and screens, the stair up to his door
    id: 'floqer',
    wall: true,
    chapter: 'floqer',
    sky: '#F4F1EC',
    ground: '#CFC6BA',
    near: [
      { x: 0, y: 60, w: 150, h: 170, c: '#8A5A48', s: 'brick' },
      { x: 40, y: 120, w: 60, h: 50, c: '#F4F1EC', s: 'fmark' },
      { x: 200, y: 100, w: 150, h: 90, c: '#DCE6F0', s: 'skyline-w' },
      { x: 60, y: 40, w: 220, h: 7, c: '#E9E4DA' },
      { x: 76, y: 47, w: 38, h: 28, c: '#111111', s: 'on' },
      { x: 136, y: 47, w: 38, h: 28, c: '#111111', s: 'on' },
      { x: 196, y: 47, w: 38, h: 28, c: '#111111', s: 'on' },
      { x: 100, y: 0, w: 50, h: 36, c: '#2B2B2B', r: 8 },
      { x: -150, y: 0, w: 120, h: 130, c: '#B8AE9E', s: 'stair' },
      { x: -60, y: 130, w: 34, h: 70, c: '#3A3A3A' },
    ],
  },
];
