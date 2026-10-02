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
  // Volta's room across the walk's north end, on the walk's own level: the harbour and the town out of its windows are
  // the ones he walked past. (For a day it was the eighth floor, the world sinking under it as he came in; he found the
  // movement weird and Halifax no longer plain, 2026-09-27.) `lean`: how far its harbour glass leans in at the head;
  // `east`: the window on downtown, along z, at the south end of the east wall by the door in; the reception's plank
  // wall has the rest. It must stop 2 m short of the north wall wherever it stands: past that, from where he stands once
  // the hall beyond the wing is drawn, the window would look into the hall's side (it stands east of the wing, z 52 on)
  volta: { x: [-16.6, -7.4] as [number, number], z: [40.0, 52.0] as [number, number], h: 3.4, lean: 0.8, east: [40.7, 44.4] as [number, number] },
  door: 52.0, // the door into the wing
  out: 11.98 + TOUR_GAIN, // the chapter at the jamb of that door: the walk's end
} as const;

/** Volta's linear lights, hung at loose angles under the black ceiling: x, z, the turn about y in degrees (0 lies along x), the length. */
export const VOLTA_LINES: Array<[number, number, number, number]> = [[-10.6, 41.5, 20, 1.8], [-14.6, 44.3, -35, 2.2], [-9.1, 44.6, 78, 1.8], [-11.5, 46.0, -12, 2.0], [-14.9, 48.3, 18, 1.8], [-9.6, 50.3, 62, 1.8]];
/** The projector on its pole under Volta's slab (x, z): it throws the slide on the north wall. */
export const VOLTA_PROJECTOR: [number, number] = [-13.7, WALK.volta.z[1] - 3.3];
/** Volta's reception against the east wall, along z: the plank wall, the desk before it, and VOLTA on the planks (its centre's z and height, its width). */
export const VOLTA_RECEPTION = { wall: [44.9, 50.4] as [number, number], desk: [46.3, 49.1] as [number, number], sign: [47.65, 2.02, 1.7] as [number, number, number] } as const;

/**
 * The skyline out of Floqer's windows: a photograph of Toronto from the east (scripts/stage-skyline.mjs), on a wall
 * curved round the house two kilometres out. `span` and `tall`: what the strip covers, in degrees; `eye`: where the
 * photograph's eye line lies, from its top; `tower`: where the CN Tower stands across it. In the room it is magnified
 * (the tower 13 degrees tall, as from Old Town's roofs, not 7 as from the park it was taken in) and turned so the
 * tower stands `bearing` degrees to the left of straight out of the glass, where he looks as he comes up to it.
 */
export const TORONTO_SKYLINE = { span: 93.23, tall: 18.75, eye: 0.929, tower: 0.2099, magnify: 1.85, bearing: 16, radius: 2000, up: 14 } as const;

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

/** The chapters over which Volta's door off the walk swings shut behind him, once he is in. */
export const VOLTA_SHUT: [number, number] = [WALK.to.c + 0.04, WALK.to.c + 0.18];

/**
 * What Volta's harbour glass shows: a street of Halifax, the city close across it and the Macdonald Bridge in the back,
 * no water (2026-09-28: "Just the city of Halifax ... The bridge in the back and all"; then "i see too much snow on the
 * floor, buildings need to be closer"). Outside the glass a sidewalk, a plowed road with its banks of snow, the far
 * sidewalk with bare street trees; across it the walk's own town (halifaxWalk: the real blocks round the Maritime
 * Centre, their own streets drawn plowed), turned half round so its front row stands at the far sidewalk. `centre` is
 * where the Maritime Centre lands, `rise` the height of its hill, `reach` how far round the Maritime Centre its blocks
 * are taken; `street` the edges along the glass (x): the sidewalk's, the road's two kerbs, the far sidewalk's; `east`
 * the same out of the side window, across which a front row of blocks stands (`eastRow`). The
 * bridge stands behind the town: its heading from the room's middle (the walk's way round), distance, the angle of its
 * span to that line, and the height of its footing; no block that would stand across its towers or cables from the
 * room is built. All of it is there from `from`, when the building's front fills the frame; until then the harbour is
 * (`indoor`, sets.ts).
 */
export const VOLTA_VIEW = {
  centre: [-326, 13] as [number, number], rise: 26, reach: 1300, origin: [-12, 46] as [number, number],
  street: [-16.85, -19.6, -30.2, -33.4] as [number, number, number, number],
  east: [WALK.volta.x[1] + 0.04, -4.6, 5.9, 9.1] as [number, number, number, number], eastRow: [-40, 115] as [number, number], // the side window's street, and where its front row runs (z)
  bridge: { heading: -60, out: 1200, skew: 18, base: 18 },
  from: 12.68,
} as const;
/** Whether Volta's view of the city stands outside the glass at chapter `c` (and the harbour is gone). */
export const voltaViewAt = (c: number): boolean => c >= VOLTA_VIEW.from;
/** Where Volta's view stands its bridge (the builder's span runs along x): its place, and its turn about y in degrees. */
export function voltaViewBridge(): { at: V3; turn: number } {
  const { bridge: { heading, out, skew, base }, origin: [ox, oz] } = VOLTA_VIEW, h = (heading * Math.PI) / 180;
  return { at: [ox + out * Math.sin(h), base, oz + out * Math.cos(h)], turn: heading + skew - 90 };
}

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
