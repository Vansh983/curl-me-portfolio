// The tour as one walk, and the script it runs to. Pure.
//
// Out of the Bean house's south door, right twice, and 58 m straight north along a harbour promenade: the water on the
// right, the land on the left, Volta's door at the end. The walk never turns and the place never cuts; what changes is
// the air. Three cities, each in the season he was there: Vancouver in May under a light blue sky, Toronto in October
// at the golden hour, Halifax in January at dusk with snow coming down. Between two cities the harbour's mist closes
// in, and what stands far off is changed inside it. Everything here is a function of the chapter the scroll is at
// (docs/rebuild/34-the-walk.md), so scrolling back runs it backwards and a jump lands in the same frame.
import { ch, TOUR_GAIN } from './shot.ts';

export type V3 = [number, number, number];
export type SkyName = 'vancouver' | 'toronto' | 'halifax';
export type City = SkyName;

/** The walk's line and its measures, world metres. */
export const WALK = {
  x: -10.5, // the line walked, north along +z
  path: [-13.5, -7.5] as [number, number], // the paving, from the quay's edge on the water to the planting on the land side
  south: -21.0, // the south end of the paving, past the Bean house's door
  water: -2.6, // the harbour under the quay
  from: { c: 9.46, z: -18.4 }, // the first straight step north
  to: { c: 12.9, z: 40.0 }, // Volta's door, where the walk goes indoors
  // Volta's room across the walk's north end. It is the eighth floor (1800 Argyle Street, suite 801): once he is in at the
  // door the walk and the harbour sink `up` metres under it (RISE). `lean`: how far its glass leans in at the head;
  // `east`: the window on downtown, along z
  volta: { x: [-16.6, -7.4] as [number, number], z: [40.0, 52.0] as [number, number], h: 3.4, up: 26, lean: 0.8, east: [46.2, 51.4] as [number, number] },
  door: 52.0, // the door into the wing
  out: 11.98 + TOUR_GAIN, // the chapter at the jamb of that door: the walk's end
} as const;

/** Metres walked per chapter of scroll. */
export const WALK_SPEED = (WALK.to.z - WALK.from.z) / (WALK.to.c - WALK.from.c);
/** Where the walk stands at chapter `c`, along z. */
export const walkZ = (c: number): number => WALK.from.z + (Math.min(WALK.to.c, Math.max(WALK.from.c, c)) - WALK.from.c) * WALK_SPEED;
/** The chapter at which the walk stands at `z`. */
export const walkC = (z: number): number => WALK.from.c + (z - WALK.from.z) / WALK_SPEED;

/** The chapters at which one city gives way to the next (the cards change there too), and Volta's entrance. */
export const TURN = { toronto: 10.5, halifax: 11.5, volta: WALK.to.c } as const;
/** Each city's stretch of the promenade along z; Halifax's runs to Volta's glass. */
export const STRETCH: Record<City, [number, number]> = {
  vancouver: [WALK.south, walkZ(TURN.toronto)],
  toronto: [walkZ(TURN.toronto), walkZ(TURN.halifax)],
  halifax: [walkZ(TURN.halifax), WALK.volta.z[0]],
};

/** The light and the air at one point of the walk. Colours are sRGB hex; `sun.dir` points at the sun. */
export interface Air {
  sky: SkyName; // the sky overhead
  into: SkyName; // the sky it is turning into
  mix: number; // how far, 0..1
  dim: number; // the dome's brightness: 1 by day, less as the day goes
  tint: { sky: string; ground: string; power: number };
  exposure: number;
  envPower: number;
  sun: { dir: V3; color: string; power: number; shadow: number };
  fog: { color: string; near: number; far: number };
  mist: number; // the harbour's mist, 0 clear to 1 closed in
  season: number; // 0 late spring, 1 autumn, 2 winter: the leaves turn, thin and are gone, all along the walk at once
  cover: number; // the snow lying, 0 none to 1 whole
  lamps: number; // the lamps along the walk, 0 off to 1 lit
  leaves: number; // leaves coming down, 0..1
  snow: number; // snow coming down, 0..1
  inside: number; // 0 out on the walk, 1 in Volta's room
}

type Station = Omit<Air, 'sky' | 'into' | 'mix'> & { c: number; sky: SkyName };

const VANCOUVER: Omit<Station, 'c'> = {
  sky: 'vancouver', dim: 1,
  tint: { sky: '#CFE4FA', ground: '#9AA59A', power: 0.62 },
  exposure: 0.92, envPower: 0.85,
  sun: { dir: [-0.5, 0.72, 0.48], color: '#FFF7EA', power: 2.2, shadow: 0.85 }, // a May afternoon: the sun high over the inlet, white cloud in a light blue sky
  fog: { color: '#CBDDF0', near: 80, far: 4200 },
  mist: 0, season: 0, cover: 0, lamps: 0, leaves: 0, snow: 0, inside: 0,
};
const TORONTO: Omit<Station, 'c'> = {
  sky: 'toronto', dim: 1,
  tint: { sky: '#B9CCE6', ground: '#A08562', power: 0.5 },
  exposure: 0.9, envPower: 0.8,
  sun: { dir: [0.86, 0.27, 0.43], color: '#FFC27E', power: 2.7, shadow: 0.92 }, // low in the west, over the land on the left: the trees' shadows lie across the paving and the city over the water is lit gold
  fog: { color: '#C9BDB4', near: 60, far: 2900 }, // the haze of a low sun: downtown stands in it as layers, keeping its own colours
  mist: 0, season: 1, cover: 0, lamps: 0, leaves: 1, snow: 0, inside: 0,
};
const HALIFAX: Omit<Station, 'c'> = {
  sky: 'halifax', dim: 0.42,
  tint: { sky: '#7286C2', ground: '#AEBBDA', power: 0.78 }, // the snow throws the sky back up: the shade is blue
  exposure: 0.84, envPower: 0.55,
  sun: { dir: [-0.55, 0.3, 0.78], color: '#8EA2D8', power: 0.45, shadow: 0.5 }, // the last of the day over the harbour
  fog: { color: '#4C5880', near: 25, far: 1100 },
  mist: 0.12, season: 2, cover: 1, lamps: 1, leaves: 0, snow: 1, inside: 0,
};
const VOLTA: Omit<Station, 'c'> = {
  sky: 'halifax', dim: 0.42,
  tint: { sky: '#F0E8DA', ground: '#7A746C', power: 0.62 }, // what is not in the room's bake (the people, the door, the cup) is lit by this
  exposure: 0.86, envPower: 0.35,
  sun: { dir: [-0.55, 0.3, 0.78], color: '#8EA2D8', power: 0.2, shadow: 0.4 },
  fog: { color: '#4C5880', near: 40, far: 1100 },
  mist: 0.12, season: 2, cover: 1, lamps: 1, leaves: 0, snow: 1, inside: 1,
};
/** The mist between two cities at its thickest: what stands beyond 150 m is gone, and is changed while it is. */
const closed = (a: Omit<Station, 'c'>, b: Omit<Station, 'c'>, color: string): Omit<Station, 'c'> => ({
  ...b, sky: a.sky, dim: (a.dim + b.dim) / 2,
  tint: { sky: color, ground: b.tint.ground, power: (a.tint.power + b.tint.power) / 2 },
  exposure: Math.min(a.exposure, b.exposure) - 0.04, envPower: Math.min(a.envPower, b.envPower) * 0.5,
  sun: { dir: a.sun.dir, color, power: Math.min(a.sun.power, b.sun.power) * 0.5, shadow: 0.25 },
  fog: { color, near: 4, far: 150 },
  mist: 1, season: (a.season + b.season) / 2, cover: (a.cover + b.cover) / 2, lamps: (a.lamps + b.lamps) / 2, leaves: (a.leaves + b.leaves) / 2, snow: (a.snow + b.snow) / 2,
});

/** The mist's half length in chapters: it gathers over this much before a turn and lifts over as much after. */
export const MIST = 0.34;
const STATIONS: Station[] = [
  { c: 8.9, ...VANCOUVER },
  { c: TURN.toronto - MIST, ...VANCOUVER },
  { c: TURN.toronto, ...closed(VANCOUVER, TORONTO, '#D3D6DA') },
  { c: TURN.toronto + MIST, ...TORONTO },
  { c: TURN.halifax - MIST, ...TORONTO, season: 1.25, sun: { ...TORONTO.sun, dir: [0.88, 0.18, 0.43], color: '#FFB066', power: 2.4 }, lamps: 0.25 }, // the sun lower by the end of the stretch, the leaves going over
  { c: TURN.halifax, ...closed(TORONTO, HALIFAX, '#8E8CA4') },
  { c: TURN.halifax + MIST, ...HALIFAX },
  { c: TURN.volta - 0.04, ...HALIFAX },
  { c: TURN.volta + 0.1, ...VOLTA },
  { c: WALK.out + 0.2, ...VOLTA },
];

const rgb = (hex: string): V3 => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const hexOf = (c: V3): string => `#${c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const mixHex = (a: string, b: string, t: number): string => { const A = rgb(a), B = rgb(b); return hexOf([lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)]); };
const smooth = (t: number): number => { const k = Math.min(1, Math.max(0, t)); return k * k * (3 - 2 * k); };

/** Whether chapter `c` is on the walk: from the Bean house's door to the door out of Volta's room. */
export const onWalk = (c: number): boolean => c >= STATIONS[0].c && c <= WALK.out + 0.2;

/** The air at chapter `c`: the stations either side of it, eased across. Outside the walk, the nearest end. */
export function airAt(c: number): Air {
  const n = STATIONS.length;
  if (!Number.isFinite(c) || c <= STATIONS[0].c) return { ...STATIONS[0], into: STATIONS[0].sky, mix: 0 };
  if (c >= STATIONS[n - 1].c) return { ...STATIONS[n - 1], into: STATIONS[n - 1].sky, mix: 0 };
  let k = 0;
  while (k < n - 2 && c >= STATIONS[k + 1].c) k++;
  const a = STATIONS[k], b = STATIONS[k + 1], t = smooth((c - a.c) / (b.c - a.c));
  const dir: V3 = [lerp(a.sun.dir[0], b.sun.dir[0], t), lerp(a.sun.dir[1], b.sun.dir[1], t), lerp(a.sun.dir[2], b.sun.dir[2], t)];
  const len = Math.hypot(...dir) || 1;
  // the sky changes across the whole of the mist, both halves: a station holds the sky it leaves, so the mix runs from
  // the last clear station to the next
  const turn = [TURN.toronto, TURN.halifax].find((x) => Math.abs(c - x) <= MIST);
  const sky: SkyName = turn === TURN.toronto ? 'vancouver' : turn === TURN.halifax ? 'toronto' : a.sky === b.sky ? a.sky : c < TURN.toronto ? 'vancouver' : c < TURN.halifax ? 'toronto' : 'halifax';
  const into: SkyName = turn === TURN.toronto ? 'toronto' : turn === TURN.halifax ? 'halifax' : sky;
  return {
    sky, into, mix: turn === undefined ? 0 : smooth((c - (turn - MIST)) / (2 * MIST)),
    dim: lerp(a.dim, b.dim, t),
    tint: { sky: mixHex(a.tint.sky, b.tint.sky, t), ground: mixHex(a.tint.ground, b.tint.ground, t), power: lerp(a.tint.power, b.tint.power, t) },
    exposure: lerp(a.exposure, b.exposure, t), envPower: lerp(a.envPower, b.envPower, t),
    sun: { dir: [dir[0] / len, dir[1] / len, dir[2] / len], color: mixHex(a.sun.color, b.sun.color, t), power: lerp(a.sun.power, b.sun.power, t), shadow: lerp(a.sun.shadow, b.sun.shadow, t) },
    fog: { color: mixHex(a.fog.color, b.fog.color, t), near: lerp(a.fog.near, b.fog.near, t), far: lerp(a.fog.far, b.fog.far, t) },
    mist: lerp(a.mist, b.mist, t), season: lerp(a.season, b.season, t), cover: lerp(a.cover, b.cover, t), lamps: lerp(a.lamps, b.lamps, t),
    leaves: lerp(a.leaves, b.leaves, t), snow: lerp(a.snow, b.snow, t), inside: lerp(a.inside, b.inside, t),
  };
}

/** The clear air of each city, for the sets' own light (the bake reads it) and the tests. */
export const CITY_AIR: Record<City | 'volta', Omit<Station, 'c'>> = { vancouver: VANCOUVER, toronto: TORONTO, halifax: HALIFAX, volta: VOLTA };

/** The city whose far things stand at chapter `c`: they change at the turn, inside the mist. */
export const cityAt = (c: number): City => (c < TURN.toronto ? 'vancouver' : c < TURN.halifax ? 'toronto' : 'halifax');

/**
 * The laptop in hand: up while there is nothing else to look at, down again so the city has the frame. It is where the
 * work is: the editor as he steps out in Vancouver, the terminal in the mist before Toronto, the app itself in the
 * mist before Halifax (`view`, stage-paint.ts `tourLive`). He works through the fog and looks up when it lifts. The
 * numbers are out on the paving (MARKS), and none is come to while the laptop is up. `lift` is how far it is raised.
 */
export const LAPTOP: Array<{ up: [number, number]; down: [number, number]; view: number }> = [
  { up: [8.98, 9.12], down: [9.5, 9.64], view: 1 }, // stepping out in Vancouver: the adapt endpoint being written
  { up: [TURN.toronto - 0.22, TURN.toronto - 0.1], down: [TURN.toronto + 0.12, TURN.toronto + 0.26], view: 0 }, // in the mist before Toronto: the tests, the deploy
  { up: [TURN.halifax - 0.22, TURN.halifax - 0.1], down: [TURN.halifax - 0.08, TURN.halifax + 0.04], view: 2 }, // in the mist before Halifax: the app, tonight's recipes; down as winter begins, Invest Nova Scotia's mark on the left
];
export function laptopAt(c: number): { lift: number; view: number } {
  for (const w of LAPTOP) {
    if (c < w.up[0] || c > w.down[1]) continue;
    const up = smooth((c - w.up[0]) / (w.up[1] - w.up[0])), down = smooth((c - w.down[0]) / (w.down[1] - w.down[0]));
    return { lift: up * (1 - down), view: w.view };
  }
  return { lift: 0, view: c < TURN.toronto ? 1 : c < TURN.halifax ? 0 : 2 };
}

/**
 * The numbers of those days, lettered on the paving on the walk's line, a city at a time. Only what he has himself said
 * of those days: nothing here is estimated. A count runs up fast as it comes into sight, from 11.5 m off to 8.5, so
 * that what is read as he comes to it is the number itself; an honour (`still`: a place, a sum) does not count at all and is drawn with
 * its own device (`device`), its name under it and a line under that (`sub`).
 */
export interface Mark { z: number; value: number; label: string; city: City; prefix?: string; suffix?: string; still?: true; device?: 'laurel' | 'rules'; sub?: string }
export const MARKS: Mark[] = [
  { z: -6.0, value: 10, suffix: 'k', label: 'users', city: 'vancouver' },
  { z: 9.5, value: 4, prefix: '#', label: 'Product of the Day', sub: 'Product Hunt', city: 'toronto', still: true, device: 'laurel' },
  { z: 31.5, value: 70, prefix: '$', suffix: 'k', label: 'investment', city: 'halifax', still: true, device: 'rules' }, // between the two marks of Halifax and abreast of neither: what it is made of he has not said, so it is laid at no one's foot
];
/** What a mark reads at chapter `c`: nothing of it from further than 11.5 m, all of it from 8; its count done by 8.5. Before the walk's first straight step the way to it is counted along the turn. */
export function markAt(c: number, m: Mark): { shown: number; text: string } {
  const at = WALK.from.z + (Math.min(WALK.to.c, c) - WALK.from.c) * WALK_SPEED, d = m.z - at, past = c > WALK.to.c;
  const k = past ? 1 : smooth((11.5 - d) / 3.5), run = past || m.still ? 1 : 1 - (1 - Math.min(1, Math.max(0, (11.5 - d) / 3))) ** 2;
  const n = m.suffix === 'k' && run < 1 ? (Math.round(m.value * run * 10) / 10).toFixed(1) : String(Math.round(m.value * run)); // thousands count in tenths
  return { shown: k, text: `${m.prefix ?? ''}${n}${m.suffix ?? ''}` };
}

/**
 * Whose days they were: each city's own mark standing on the land side of the walk, on his left, as letters cut out
 * and set on a granite plinth the way the Google letters stand on their lawn, turned a little to him as he comes.
 * Not on the paving: he asked for them off the floor (2026-09-27). `w` is the mark's width in metres; its height
 * follows the mark's own shape (`ratio`, width over height). `paint` is the canvas it is drawn on. They do not stand in one
 * line: seen from far down the walk, one behind the next, each is clear of the others (`x`).
 */
export const SIGNS = [
  { z: -1.0, x: -5.3, w: 4.4, ratio: 1600 / 167, logo: 'websummit', name: 'Web Summit Vancouver, May 2025' }, // past the whale, ahead on the left from the walk's first steps
  { z: 18.0, x: -5.55, w: 2.0, ratio: 1200 / 911, logo: 'elevate', name: 'Elevate Festival, Toronto, October 2025' }, // past the number, the streetcar going by behind it
  { z: 25.5, x: -6.0, w: 2.4, ratio: 1200 / 438, logo: 'investns', name: 'Invest Nova Scotia: Accelerate, 2025 to 2026' }, // where winter begins: he comes up to it as the first snow falls, and is past it before the text card climbs the left of the screen
  { z: 37.4, x: -6.4, w: 2.6, ratio: 1200 / 312, logo: 'volta', name: 'Volta, Halifax' }, // at the walk's end, against the dark glass at the foot of its own building
] as const;

/** The chapters over which Volta's room goes up to its floor: from his first step in at the door, the door shutting behind him. */
export const RISE = { from: WALK.to.c + 0.02, to: WALK.to.c + 0.36 } as const;
/** How far the room has gone up at chapter `c`, 0 (on the walk) to 1 (the eighth floor). */
export const riseAt = (c: number): number => smooth((c - RISE.from) / (RISE.to - RISE.from));

/** Volta's screen: the slides he goes up to, one after another while he stands at the front of the rows. */
export const SLIDES = { from: 13.12, to: 13.44, n: 4 } as const; // on his way up the room to the podium, the screen ahead
export const slideAt = (c: number): number => Math.min(SLIDES.n - 1, Math.max(0, Math.floor(((c - SLIDES.from) / (SLIDES.to - SLIDES.from)) * SLIDES.n)));

/** Something that arrives with the scroll: over `at` (chapters) it comes from `from` (an offset, a turn in degrees, a scale) to where it is placed. */
export interface Cue { at: [number, number]; move?: V3; turn?: V3; scale?: number; ease?: 'out' | 'inOut' | 'back'; leave?: [number, number] }
/** How far a cue has run at chapter `c`, 0 (not yet, or gone) to 1 (arrived). */
export function cueAt(c: number, cue: Cue): number {
  const t = Math.min(1, Math.max(0, (c - cue.at[0]) / (cue.at[1] - cue.at[0])));
  const e = cue.ease === 'inOut' ? smooth(t) : cue.ease === 'back' ? 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2 : 1 - (1 - t) ** 3;
  const gone = cue.leave ? smooth((c - cue.leave[0]) / (cue.leave[1] - cue.leave[0])) : 0;
  return e * (1 - gone);
}

/** Where a mover is: its place, its heading about y in degrees, its pitch, and whether it is in the world yet. */
export interface Pose { at: V3; yaw: number; pitch: number; roll: number; on: boolean }

/**
 * The seaplane off Vancouver's harbour: on the water abeam of the walk as he steps out, it runs north up the harbour
 * beside him, lifts, and climbs away over the inlet to the left of the mountains. Its run is tied to the scroll, a
 * little ahead of the walk, so it stays in the frame the whole way.
 */
export function seaplaneAt(c: number, time = 0): Pose {
  const c0 = 9.3, c1 = TURN.toronto - 0.05, t = Math.min(1, Math.max(0, (c - c0) / (c1 - c0)));
  const run = t * t * (0.6 + 0.4 * t); // gathering speed
  const z = -34 + 330 * run, lift = Math.max(0, t - 0.42) / 0.58, y = WALK.water + 0.55 + 62 * lift * lift * (3 - 2 * lift) * (0.4 + 0.6 * lift);
  const bob = lift > 0 ? 0 : 0.05 * Math.sin(time * 1.7);
  return { at: [-48 - 46 * run * run, y + bob, z], yaw: -8 * run, pitch: lift > 0 ? 7 * Math.sin(Math.PI * Math.min(1, lift * 1.4)) + 3 * lift : 1.5 * Math.min(1, t * 6), roll: -5 * smooth((t - 0.6) / 0.4), on: c > 8.9 && c < TURN.toronto + 0.02 };
}

/**
 * Toronto's streetcar, on the track along the land side of the walk: once the mist has lifted on the city it comes up
 * from behind, passes him, and runs on up the track ahead, past Volta's corner and away.
 */
export const TRACK = { x: -3.4, from: -30, to: 270 } as const;
export function streetcarAt(c: number): Pose {
  const c0 = TURN.toronto + 0.3, c1 = TURN.halifax, t = Math.min(1, Math.max(0, (c - c0) / (c1 - c0)));
  return { at: [TRACK.x, 0, TRACK.from + (TRACK.to - TRACK.from) * t ** 1.3], yaw: 0, pitch: 0, roll: 0, on: c >= TURN.toronto && c < TURN.halifax + 0.02 };
}

/** The Halifax ferry crossing to Dartmouth, its windows lit: slow across the harbour on the right, out and away. */
export function ferryAt(c: number, time = 0): Pose {
  const t = Math.min(1, Math.max(0, (c - (TURN.halifax - 0.1)) / (WALK.out - TURN.halifax + 0.1)));
  return { at: [-135 - 170 * t, WALK.water + 0.1 + 0.06 * Math.sin(time * 0.9), 98 + 66 * t], yaw: 72, pitch: 0.6 * Math.sin(time * 0.7), roll: 1.2 * Math.sin(time * 0.9 + 1), on: c >= TURN.halifax };
}

/** The walk's keys in stage progress, for the things that hang on it. */
export const walkQ = (c: number): number => ch(c);
