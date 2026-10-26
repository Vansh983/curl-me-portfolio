// The morph: the bottom of the phone is one picture that turns into the next.
// Every place is drawn as flat shapes, each with a role (the window, the desk,
// the three screens, the light, the door...). Between two places the shape of
// each role turns into its next shape: the apartment's glass becomes the Delhi
// window, the desk becomes the lab bench, the pendant becomes the sun. A role
// a place leaves out shrinks into its own centre first; a role the next place
// brings grows out of its centre last. The technique is the one shape morphing
// libraries use (flubber, GSAP MorphSVG): both shapes resampled to the same
// number of points along their outline, the start points aligned so the
// outline does not twist, then the points interpolated; done here by hand in
// forty lines so nothing is downloaded and a 2019 phone runs it.
//
// Shapes are polygons in a 390 by 260 box, the ground's top at y 226. What
// stands in each place follows the stage's own sets (src/lib/stage/sets.ts).

export type Pt = [number, number];
export type Shape = { pts: Pt[]; fill: string; anim?: string };
export type Scene = { id: string; chapter: string; sky: string; shapes: Partial<Record<Role, Shape>> };

// z order, back to front
export const ROLES = ['far', 'far2', 'big', 'big2', 'light2', 'light', 'extra', 'furn', 'obj1', 'obj2', 'obj3', 'door', 'ground'] as const;
export type Role = (typeof ROLES)[number];
export const N = 48; // points per outline once resampled

const R = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const C = (cx: number, cy: number, rx: number, ry = rx, n = 24): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
};
const S = (pts: Pt[], fill: string, anim?: string): Shape => (anim ? { pts, fill, anim } : { pts, fill });
const G = 226; // the ground's top
const ground = (fill: string) => S(R(0, G, 390, 34), fill);
const door = (x: number, fill: string) => S(R(x, G - 92, 34, 92), fill);
const pendant = (x: number, fill: string) => ({ light2: S(R(x - 1, 0, 2, 152), fill), light: S([[x - 22, 174], [x + 22, 174], [x + 12, 152], [x - 12, 152]], fill, 'sway') });
const skyline: Pt[] = [[30, 210], [30, 170], [52, 170], [52, 150], [70, 150], [70, 178], [95, 178], [95, 140], [118, 140], [118, 165], [140, 165], [140, 155], [162, 155], [162, 182], [185, 182], [185, 146], [205, 146], [205, 170], [224, 170], [224, 130], [238, 130], [238, 164], [250, 164], [250, 210]];
const mountains: Pt[] = [[0, 170], [0, 140], [40, 110], [80, 135], [130, 92], [175, 130], [215, 108], [260, 140], [300, 104], [340, 128], [390, 118], [390, 170]];
const hill: Pt[] = [[0, 170], [0, 150], [70, 136], [140, 118], [210, 108], [280, 98], [390, 90], [390, 170]];
const trees: Pt[] = [[0, 200], [0, 165], [25, 140], [50, 165], [75, 128], [100, 160], [125, 145], [150, 170], [175, 130], [200, 160], [225, 140], [250, 170], [275, 128], [300, 158], [325, 150], [350, 172], [390, 160], [390, 200]];
const sails = (x: number, y: number, w: number, h: number): Pt[] => {
  const out: Pt[] = [[x, y + h]];
  for (let i = 0; i < 5; i++) out.push([x + (w * (i + 0.5)) / 5, y], [x + (w * (i + 1)) / 5, y + h]);
  return out;
};
const tower: Pt[] = [[262, 40], [278, 40], [278, 80], [290, 88], [290, 100], [278, 108], [276, 170], [264, 170], [262, 108], [250, 100], [250, 88], [262, 80]];

export const SCENES: Scene[] = [
  {
    // the apartment, Toronto, night: the glass with the city, the desk and two screens, the pendant, the bed
    id: 'now',
    chapter: 'now',
    sky: '#1C2133',
    shapes: {
      ground: ground('#15192A'),
      big: S(R(30, 60, 220, 150), '#3E5484'),
      far: S(skyline, '#0E1322'),
      furn: S(R(50, 196, 130, 7), '#3A3836'),
      obj1: S(R(60, 170, 36, 24), '#DCE8FF', 'breathe'),
      obj2: S(R(104, 170, 36, 24), '#DCE8FF', 'breathe'),
      ...pendant(318, '#2A2A2A'),
      extra: S(R(262, 196, 100, 30), '#59607A'),
      door: door(350, '#2B2826'),
    },
  },
  {
    // the room, Delhi, 2010: the window, the poster, the PC desk, the screen, the Xbox beside it, the football
    id: 'room',
    chapter: 'room',
    sky: '#E6D3B4',
    shapes: {
      ground: ground('#9C7B5A'),
      big: S(R(200, 70, 110, 100), '#FFE6C6'),
      big2: S(R(70, 100, 36, 48), '#111111'),
      furn: S(R(40, 196, 130, 7), '#B48A5A'),
      obj1: S(R(60, 166, 42, 30), '#1F2A3A', 'flicker'),
      obj2: S(R(110, 174, 9, 22), '#EDEDED', 'blink'),
      obj3: S(R(140, 186, 16, 40), '#D9D2C2'),
      light: S(R(140, 20, 90, 6), '#6B5B4B'),
      extra: S(C(330, 218, 8), '#F2F2F2', 'roll'),
      door: door(350, '#6B4A32'),
    },
  },
  {
    // the lab, 2013: the tube light, one long bench, three stations
    id: 'lab',
    chapter: 'lab',
    sky: '#DCDCD4',
    shapes: {
      ground: ground('#A6ADB3'),
      furn: S(R(0, 196, 390, 7), '#C9C3B4'),
      extra: S(R(0, 203, 390, 23), '#B5AFA1'),
      obj1: S(R(40, 166, 40, 30), '#1C2430', 'flicker'),
      obj2: S(R(150, 166, 40, 30), '#1C2430', 'flicker'),
      obj3: S(R(260, 166, 40, 30), '#1C2430', 'flicker'),
      light: S(R(100, 22, 110, 6), '#F7F7F2', 'tube'),
      door: door(350, '#6E6E6A'),
    },
  },
  {
    // Google, 2019: the sun, the trees, the Android lawn, the block with the door into Delhi
    id: 'google',
    chapter: 'google-code-in',
    sky: '#CFE4F7',
    shapes: {
      ground: ground('#9DAF7C'),
      light: S(C(60, 50, 20), '#FFF3C4', 'breathe'),
      far: S(trees, '#4E7A3A'),
      big: S(R(250, 100, 140, 126), '#F2F2F2'),
      door: S(R(300, 160, 34, 66), '#3A3A3A'),
      obj1: S(C(60, 206, 15, 18), '#A4C639', 'bob'),
      obj2: S(C(110, 204, 18, 21), '#A4C639', 'bob2'),
      obj3: S(C(160, 208, 13, 16), '#A4C639', 'bob'),
    },
  },
  {
    // Delhi, 2020, at night: the wide desk, two monitors, the laptop, the shelf, the lamp, the curtain, the bed
    id: 'delhi',
    chapter: 'webcube',
    sky: '#3A3026',
    shapes: {
      ground: ground('#2A2119'),
      far: S(R(250, 30, 110, 196), '#6E5A4A'),
      big2: S(R(30, 120, 170, 8), '#6E5A48'),
      furn: S(R(30, 196, 170, 7), '#5A4634'),
      obj1: S(R(40, 166, 38, 28), '#0D1016', 'flicker'),
      obj2: S(R(86, 166, 38, 28), '#0D1016', 'flicker'),
      obj3: S(R(136, 182, 30, 14), '#2B2B2B'),
      light: S(C(176, 150, 16), '#FFE0B0', 'breathe'),
      extra: S(R(250, 196, 110, 30), '#5A4A4A'),
    },
  },
  {
    // the flight, 2022: the seat backs down the aisle, the moving map, the portholes
    id: 'flight',
    chapter: 'halifax',
    sky: '#D9DBDF',
    shapes: {
      ground: ground('#B8BBC2'),
      furn: S(R(20, 106, 80, 120), '#2B3A5C'),
      big2: S(R(140, 106, 80, 120), '#2B3A5C'),
      obj1: S(R(34, 130, 50, 34), '#0B1A33', 'flicker'),
      obj2: S(R(154, 130, 50, 34), '#0B1A33'),
      big: S(C(290, 120, 20, 26), '#BFD6F0', 'drift'),
      obj3: S(C(355, 120, 20, 26), '#BFD6F0', 'drift'),
      light: S(R(0, 10, 390, 4), '#F6F6F8'),
    },
  },
  {
    // the hall, Dalhousie: the screen down for the lecture, the lectern, the tiers of red seats
    id: 'hall',
    chapter: 'shiftkey',
    sky: '#4A3A30',
    shapes: {
      ground: ground('#2E2A28'),
      big: S(R(60, 40, 180, 90), '#0E1A2B', 'breathe'),
      furn: S(R(0, 180, 390, 8), '#6B4A32'),
      extra: S([[200, 226], [200, 196], [248, 196], [248, 180], [296, 180], [296, 164], [344, 164], [344, 150], [390, 150], [390, 226]], '#7A1F2E'),
      obj1: S(R(90, 150, 26, 44), '#8B6A3A'),
      light: S(R(0, 8, 390, 4), '#FFE7C2'),
    },
  },
  {
    // Sydney, 2024, Bean's house: the window with the Opera House, the whiteboard, the pendant, the table, the screens, a mattress
    id: 'sydney',
    chapter: 'bean',
    sky: '#F0EBE2',
    shapes: {
      ground: ground('#B89A78'),
      big: S(R(20, 70, 140, 100), '#C9D8E6'),
      far: S(sails(40, 120, 100, 40), '#F7F7F7'),
      big2: S(R(230, 60, 140, 90), '#FAFAFA'),
      ...pendant(263, '#222222'),
      furn: S(R(180, 196, 200, 7), '#D9C9A8'),
      obj1: S(R(196, 166, 38, 28), '#111111', 'flicker'),
      obj2: S(R(246, 166, 38, 28), '#111111', 'flicker'),
      obj3: S(R(296, 166, 38, 28), '#111111', 'flicker'),
      extra: S(R(20, 208, 110, 18), '#6E8AA8'),
    },
  },
  {
    // Vancouver, May: the North Shore, the inlet, Canada Place's sails, the rail, a tree, a seaplane
    id: 'vancouver',
    chapter: 'vancouver',
    sky: '#D8DEE3',
    shapes: {
      ground: ground('#B7B0A6'),
      far: S(mountains, '#5E6E7E'),
      far2: S(R(0, 170, 390, 40), '#7F93A3'),
      big: S(sails(240, 140, 90, 32), '#F4F4F4'),
      extra: S(R(0, 206, 390, 4), '#4A4A4A'),
      obj1: S(C(70, 140, 34, 40), '#4E7A3A', 'sway'),
      obj2: S(R(66, 170, 8, 56), '#4E3A2A'),
      light: S(R(292, 110, 22, 8), '#333333'),
      light2: S(R(300, 118, 6, 108), '#333333'),
      obj3: S([[130, 62], [170, 62], [176, 68], [150, 70], [138, 68]], '#F2F2F2', 'fly'),
    },
  },
  {
    // Toronto, October: the city across the water with the tower, a streetcar, a maple turned
    id: 'toronto',
    chapter: 'toronto',
    sky: '#F2C58A',
    shapes: {
      ground: ground('#B7A58F'),
      far: S([[0, 170], [0, 140], [40, 140], [40, 120], [80, 120], [80, 150], [120, 150], [120, 110], [160, 110], [160, 140], [200, 140], [200, 126], [240, 126], [240, 156], [300, 156], [300, 134], [340, 134], [340, 150], [390, 150], [390, 170]], '#3A2E2A'),
      big: S(tower, '#3A2E2A'),
      far2: S(R(0, 170, 390, 40), '#9A7A5A'),
      big2: S(R(150, 150, 170, 56), '#B5121B', 'tram'),
      extra: S(R(0, 206, 390, 4), '#4A4A4A'),
      obj1: S(C(80, 136, 38, 44), '#D1662A', 'sway'),
      obj2: S(R(76, 170, 8, 56), '#4E3A2A'),
      light: S(R(292, 110, 22, 8), '#333333'),
      light2: S(R(300, 118, 6, 108), '#333333'),
    },
  },
  {
    // Halifax, January, dusk: downtown up the hill, the harbour, the ferry, the lamp lit, Volta lit at the end
    id: 'halifax',
    chapter: 'volta',
    sky: '#3B4668',
    shapes: {
      ground: ground('#E6E8EC'),
      far: S(hill, '#2A3148'),
      far2: S(R(0, 170, 390, 40), '#2C3A55'),
      big: S(R(250, 60, 130, 166), '#2E3340'),
      obj1: S(R(258, 70, 114, 30), '#FFE7C2', 'twinkle'),
      door: S(R(300, 170, 30, 56), '#FFE7C2'),
      extra: S(R(0, 206, 390, 4), '#5A5A60'),
      light: S(R(92, 110, 22, 8), '#FFD27A', 'breathe'),
      light2: S(R(100, 118, 6, 108), '#333333'),
      obj2: S(R(120, 176, 60, 16), '#1E2436', 'cross'),
    },
  },
  {
    // the Cohn, 2026: the proscenium, the banner, the stage, the lectern, the chairs
    id: 'stage',
    chapter: 'degree',
    sky: '#6E6258',
    shapes: {
      ground: ground('#2A2422'),
      far: S(R(0, 0, 390, 40), '#2A2422'),
      big: S(R(150, 60, 90, 90), '#111111'),
      big2: S(R(165, 112, 60, 3), '#C9A227'),
      furn: S(R(0, 196, 390, 30), '#3A2E26'),
      obj1: S(R(90, 152, 26, 44), '#8B6A3A'),
      extra: S(R(240, 170, 120, 26), '#5A4A3A'),
      light: S(C(195, 24, 36, 18), '#FFE7C2', 'breathe'),
    },
  },
  {
    // Floqer's house, now: the brick, the windows on downtown, the desks and screens, the stair up to his door
    id: 'floqer',
    chapter: 'floqer',
    sky: '#F4F1EC',
    shapes: {
      ground: ground('#CFC6BA'),
      far: S(R(0, 40, 150, 186), '#8A5A48'),
      big2: S(R(50, 90, 50, 50), '#F4F1EC'),
      big: S(R(200, 70, 150, 90), '#DCE6F0'),
      furn: S(R(60, 196, 220, 7), '#E9E4DA'),
      obj1: S(R(76, 166, 38, 28), '#111111', 'flicker'),
      obj2: S(R(136, 166, 38, 28), '#111111', 'flicker'),
      obj3: S(R(196, 166, 38, 28), '#111111', 'flicker'),
      extra: S([[270, 226], [390, 96], [390, 226]], '#B8AE9E'),
      door: S(R(356, 56, 34, 70), '#3A3A3A'),
    },
  },
];

// --- the geometry: the same number of points on every outline, aligned, then interpolated

const area = (p: Pt[]) => {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
};

// n points evenly along the outline, the outline wound the same way every time
export const resample = (poly: Pt[], n: number): Pt[] => {
  const p = area(poly) < 0 ? poly.slice().reverse() : poly;
  const m = p.length;
  const seg: number[] = [];
  let total = 0;
  for (let i = 0; i < m; i++) {
    const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % m];
    const d = Math.hypot(x2 - x1, y2 - y1);
    seg.push(d);
    total += d;
  }
  if (total === 0) return Array.from({ length: n }, () => [p[0][0], p[0][1]] as Pt);
  const out: Pt[] = [];
  let i = 0, along = 0;
  for (let k = 0; k < n; k++) {
    const target = (k / n) * total;
    while (i < m - 1 && along + seg[i] < target) {
      along += seg[i];
      i++;
    }
    const t = seg[i] ? (target - along) / seg[i] : 0;
    const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % m];
    out.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
  }
  return out;
};

// the rotation of b whose points sit nearest a's, so the outline turns without twisting
export const align = (a: Pt[], b: Pt[]): Pt[] => {
  let best = 0, bestD = Infinity;
  for (let off = 0; off < b.length; off++) {
    let d = 0;
    for (let i = 0; i < a.length && d < bestD; i++) {
      const q = b[(i + off) % b.length];
      d += (a[i][0] - q[0]) ** 2 + (a[i][1] - q[1]) ** 2;
    }
    if (d < bestD) {
      bestD = d;
      best = off;
    }
  }
  return b.map((_, i) => b[(i + best) % b.length]);
};

export const centroid = (p: Pt[]): Pt => {
  let x = 0, y = 0;
  for (const q of p) {
    x += q[0];
    y += q[1];
  }
  return [x / p.length, y / p.length];
};

export const hex = (c: string): [number, number, number] => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
