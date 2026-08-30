// The whole world as data: camera stations and actors with their params per station,
// their timing inside each gap (the choreography), and what they say when pointed at.
// Station 0 is the 2010 Delhi bedroom, 1 the 2013 school computer lab, 2 San Francisco 2018.
import { figure, KID, TWEEN, TEEN, PARTS, type Part } from './figure3d.ts';
import * as P from './props.ts';
import type { Geo, V3 } from './rig.ts';
import type { Timing } from './ease.ts';
import type { SurfaceName } from './surface.ts';

export interface Station {
  cam: V3;
  look: V3;
  subject: V3; // what the shot is about; portrait framing pulls the look toward it
  fov: number; // horizontal, degrees
}
export interface Actor {
  id: string;
  keys: Float32Array[]; // built positions at each station
  uv: Float32Array; // from the first key, constant across stations
  col: Float32Array; // vertex colours, constant across stations
  colors: string[]; // material colour per station (multiplies vertex colours and textures)
  shade: 'solid' | 'shell' | 'unlit'; // a lit solid, a lit double-sided shell (floors, walls), or unlit (screens, sky)
  surface: SurfaceName[]; // what it is made of, per station: roughness, metal, and the detail map
  tex?: 'tex' | 'mix'; // painted texture: one frame, or one per station blended by the actor's progress
  vc: boolean; // use the vertex colours
  outline: boolean;
  transparent?: boolean;
  bounce?: number; // a share of its own colour it gives off: light-coloured surfaces bouncing the room's light
  glow?: number; // colour multiplier above 1: an emitter the bloom picks up (the sun)
  at?: V3; // mesh position for rigs built at the origin (the fan)
  path?: V3[]; // mesh position per station, for rigs built at the origin that travel (the ball)
  roll?: number; // radius: the mesh rolls about x as it travels along z
  timing?: Timing[]; // per gap: when inside the gap this actor moves, and how (default: the whole gap, sine)
  cap?: string[]; // caption per station when pointed at ('' = not a hotspot there)
  href?: string; // opened on click, when the caption is showing
}

// back wall at z = -2.3, floor runs to z = 4.1 so the camera never sees the front edge
export const ROOM = { w: 4.4, h: 2.8, d: 6.4, zc: 0.9 };
const BACK = ROOM.zc - ROOM.d / 2;
// the floor after the walls have gone: a plaza by the bay
const PLAZA = { w: 34, h: 0.001, d: 44, zc: -6 };

export const STATIONS: Station[] = [
  { cam: [0.45, 1.4, 3.0], look: [0, 0.85, -1.2], subject: [0, 0.75, 0.5], fov: 70 },
  { cam: [-1.15, 1.7, 1.25], look: [0.35, 1.2, -1.5], subject: [0.05, 1.05, -0.75], fov: 64 },
  // 2018: outside, the Google San Francisco sign, the bridge across the bay, him with the trophy
  { cam: [-0.7, 2.1, 6.6], look: [0.9, 2.2, -12], subject: [0.9, 1.5, 1.4], fov: 66 },
];

// timing shorthands: a window of the gap and a curve
const T = (start: number, end: number, ease: Timing['ease']): Timing => ({ start, end, ease });
const HOLD = T(0, 1, 'linear');
const SINK_IN = T(0, 0.45, 'in'); // falls away with gravity's acceleration
const LATE_SINK = T(0.05, 0.5, 'in');
const DROP = T(0.55, 1, 'bounce'); // lands and bounces
const GROW = T(0.6, 1, 'out');
const SMOOTH = T(0.2, 0.8, 'inOut');

type Opts = Partial<Pick<Actor, 'shade' | 'tex' | 'vc' | 'outline' | 'transparent' | 'bounce' | 'glow' | 'at' | 'path' | 'roll' | 'timing' | 'cap' | 'href'>>
  & { surface?: SurfaceName | SurfaceName[] };

/**
 * What each thing is made of. Distemper over plaster on the walls, sealed board on the desks,
 * moulded ABS on the consoles and keys, brushed steel on the tower and the bridge, cast gold on
 * the trophy. The floor changes under him: boards in Delhi, boards in the lab, plaza concrete
 * outside. Anything unlit (screens, the sky, painted signage) ignores this.
 */
const MATERIAL: Record<string, SurfaceName | SurfaceName[]> = {
  floor: ['plank', 'plank', 'concrete'],
  walls: 'paint', ceiling: 'paint', windowFrame: 'paint',
  fan: 'metal', tower: 'steel', bridge: 'metal', lamp: 'metal',
  whiteboard: 'ceramic', board: 'paper', clock: 'plastic',
  table: 'wood', shelf: 'wood', labRow: 'wood',
  screenBody: 'plastic', keyboard: 'plastic', labKeyboards: 'plastic', xbox: 'plastic',
  chair: 'plastic', labChairs: 'plastic', socket: 'plastic', boats: 'plastic', signBoard: 'plastic',
  labScreens: 'glass',
  wire: 'rubber', ball: 'rubber', nuggets: 'ceramic',
  curtains: 'fabric', rug: 'carpet',
  hills: 'foliage', palmL: 'foliage', palmR: 'foliage', hedge: 'foliage', water: 'water', clouds: 'plaster',
  'figure-skin': 'skin', 'figure-face': 'skin', 'figure-hair': 'hair',
  'figure-shirt': 'cotton', 'figure-sleeveL': 'cotton', 'figure-sleeveR': 'cotton',
  'figure-legs': 'cotton', 'figure-tie': 'cotton', 'figure-lanyard': 'cotton',
  'figure-shoes': 'rubber', 'figure-glasses': 'plastic', 'figure-badge': 'paper',
  'figure-held': ['plastic', 'plastic', 'gold'],
};

/** One value per station: a bare name means the same material all the way through. */
const spread = (s: SurfaceName | SurfaceName[], n: number): SurfaceName[] =>
  Array.isArray(s) ? s : Array.from({ length: n }, () => s);

const actor = <U>(id: string, rig: (p: U) => Geo, keys: U[], colors: string[], o: Opts = {}): Actor => {
  const built = keys.map(rig);
  return {
    id, keys: built.map((g) => g.pos), uv: built[0].uv, col: built[0].col, colors,
    shade: o.shade ?? 'solid', surface: spread(o.surface ?? MATERIAL[id] ?? 'plastic', keys.length),
    tex: o.tex, vc: o.vc ?? false, outline: o.outline ?? true, transparent: o.transparent, bounce: o.bounce, glow: o.glow,
    at: o.at, path: o.path, roll: o.roll, timing: o.timing, cap: o.cap, href: o.href,
  };
};

const kid = figure(KID), tween = figure(TWEEN), teen = figure(TEEN);
const W3 = ['#FFFFFF', '#FFFFFF', '#FFFFFF'];
const partColors: Record<Part, [string, string, string]> = {
  skin: ['#F1C7A3', '#F1C7A3', '#F1C7A3'],
  hair: ['#17282F', '#17282F', '#17282F'],
  shirt: ['#FFFFFF', '#FFFFFF', '#FFFFFF'], // textured: Barcelona 2013 home shirt, the white school shirt, the black Google tee
  sleeveL: ['#004D98', '#FFFFFF', '#1A1A1A'],
  sleeveR: ['#A50044', '#FFFFFF', '#1A1A1A'],
  legs: ['#33535F', '#2B2B2B', '#1F2A44'],
  shoes: ['#17282F', '#17282F', '#17282F'],
  tie: ['#1D3557', '#1D3557', '#1D3557'],
  held: ['#FFFFFF', '#9A9A96', '#F4C542'], // the controller becomes the mouse becomes the trophy
  face: ['#17282F', '#17282F', '#17282F'],
  glasses: ['#2B2B2B', '#2B2B2B', '#2B2B2B'],
  lanyard: ['#2E8B57', '#2E8B57', '#2E8B57'],
  badge: ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
};
const partCaps: Partial<Record<Part, string[]>> = {
  shirt: ['Barcelona 2013 home shirt. Messi, 10.', 'White shirt and tie. School.', 'The Google tee, June 2018.'],
  held: ['The Xbox 360 controller.', 'The lab mouse.', 'The Google Code-in grand prize trophy.'],
  hair: ['Me, about nine.', 'Me, thirteen.', 'Me, seventeen.'],
  badge: ['', '', 'Google Code-in 2018, grand prize winner.'],
};

// where things sit
const TV = { x: 0, y: 0.45 + 0.375, z: -1.7 }, MON = { x: 0.1, y: 0.72 + 0.06 + 0.21, z: -1.5 };
const SHELF = { x: 1.35, y: 0.95, z: BACK + 0.13, w: 0.9 };
const WIN0 = { x: -1.05, y: 1.62, z: BACK + 0.01, w: 0.9, h: 1.0 }, WIN1 = { x: -0.9, y: 2.35, z: BACK + 0.01, w: 2.2, h: 0.42 };
const SOCKET = { x: 1.0, y: 0.32, z: BACK + 0.012 };
const PHOTO0 = { x: 0.95, y: 1.75, z: BACK + 0.012, w: 0.9, h: 0.5 }, PHOTO1 = { x: 1.35, y: 1.68, z: BACK + 0.035, w: 0.86, h: 0.48 };
const ROW = { x: 1.65, z0: -1.4, gap: 0.85 };
const SUNK = -3.2; // y of things that sank under the floor
const LIFT = 9; // y of the ceiling once the room has opened to the sky
const ABOVE = 2.9; // y of things waiting above the ceiling to drop in

export const ACTORS: Actor[] = [
  actor('floor', P.floor, [ROOM, ROOM, PLAZA], ['#FFFFFF', '#FFFFFF', '#CFC9BE'], { shade: 'shell', tex: 'mix', outline: false, bounce: 0.06, timing: [T(0.2, 0.8, 'linear'), T(0.3, 0.8, 'linear')] }),
  actor('walls', P.walls, [ROOM, ROOM, { ...ROOM, y: SUNK }], ['#F6E9D2', '#E6ECF1', '#E6ECF1'], { shade: 'shell', outline: false, bounce: 0.14, timing: [SMOOTH, T(0, 0.5, 'in')] }),
  actor('ceiling', P.ceiling, [ROOM, ROOM, { ...ROOM, y: LIFT }], ['#FFFFFF', '#F5F9FC', '#F5F9FC'], { shade: 'shell', outline: false, bounce: 0.42, timing: [SMOOTH, T(0, 0.5, 'in')] }),
  actor('fan', P.fan, [{ rod: 0.55, r: 0.6, hub: 0.08 }, { rod: 0.55, r: 0.6, hub: 0.08 }, { rod: 0.55, r: 0.6, hub: 0.08, y: LIFT - ROOM.h }], ['#9A9A96', '#9A9A96', '#9A9A96'], {
    at: [0, ROOM.h, -0.4], timing: [HOLD, T(0, 0.5, 'in')], cap: ['The ceiling fan. Delhi summers.', 'The fan stayed.', ''],
  }),
  actor('tubes', P.tubes, [{ y: ROOM.h, z0: -1.4, gap: 1.6, scale: 0.001 }, { y: ROOM.h, z0: -1.4, gap: 1.6, scale: 1 }, { y: LIFT, z0: -1.4, gap: 1.6, scale: 1 }], W3, { vc: true, shade: 'unlit', timing: [T(0.7, 1, 'out'), T(0, 0.5, 'in')] }),

  // the whiteboard grows on the left wall in the lab
  actor('whiteboard', P.panel, [
    { x: -ROOM.w / 2 + 0.01, y: 1.45, z: -0.8, w: 0.001, h: 0.001, t: 0.001, yaw: Math.PI / 2 },
    { x: -ROOM.w / 2 + 0.01, y: 1.45, z: -0.8, w: 1.8, h: 1.1, t: 0.02, yaw: Math.PI / 2 },
    { x: -ROOM.w / 2 + 0.01, y: SUNK, z: -0.8, w: 0.001, h: 0.001, t: 0.001, yaw: Math.PI / 2 },
  ], W3, { tex: 'tex', timing: [T(0.5, 0.9, 'out'), SINK_IN], cap: ['', 'Web Dev 101 on the whiteboard.', ''] }),
  // the window onto the Delhi rooftops becomes the lab's high window strip
  actor('window', P.face, [
    { x: WIN0.x, y: WIN0.y, z: WIN0.z, w: WIN0.w, h: WIN0.h },
    { x: WIN1.x, y: WIN1.y, z: WIN1.z, w: WIN1.w, h: WIN1.h },
    { x: WIN1.x, y: SUNK, z: WIN1.z, w: 0.001, h: 0.001 },
  ], W3, { shade: 'unlit', tex: 'mix', outline: false, timing: [T(0.3, 0.9, 'inOut'), SINK_IN], cap: ['Delhi rooftops at dusk, water tanks and all.', 'The lab window.', ''] }),
  actor('windowFrame', P.windowFrame, [WIN0, WIN1, { ...WIN1, y: SUNK, w: 0.001, h: 0.001 }], ['#F9F4EC', '#DDE3E8', '#DDE3E8'], { timing: [T(0.3, 0.9, 'inOut'), SINK_IN] }),
  actor('curtains', P.curtains, [
    { x: WIN0.x, y: WIN0.y + WIN0.h / 2 + 0.1, z: WIN0.z, w: WIN0.w, h: 1.3, scale: 1 },
    { x: WIN1.x, y: WIN1.y + WIN1.h / 2 + 0.05, z: WIN1.z, w: WIN1.w, h: 1.3, scale: 0.001 },
    { x: WIN1.x, y: SUNK, z: WIN1.z, w: 0.001, h: 1.3, scale: 0.001 },
  ], W3, { vc: true, timing: [T(0, 0.45, 'in'), SINK_IN], cap: ['The curtains.', '', ''] }),
  actor('clock', P.clock, [{ x: 0.3, y: 2.3, z: BACK + 0.03, r: 0.001 }, { x: 0.3, y: 2.3, z: BACK + 0.03, r: 0.14 }, { x: 0.3, y: SUNK, z: BACK + 0.03, r: 0.001 }], W3, { vc: true, timing: [GROW, SINK_IN] }),
  // Converge Clan: the banner up top, the team photo on the notice board (the Steve Jobs poster becomes it)
  actor('banner', P.face, [
    { x: 1.4, y: 2.3, z: BACK + 0.01, w: 0.001, h: 0.001 },
    { x: 1.4, y: 2.3, z: BACK + 0.01, w: 1.15, h: 0.25 },
    { x: 1.4, y: SUNK, z: BACK + 0.01, w: 0.001, h: 0.001 },
  ], W3, { shade: 'unlit', tex: 'tex', outline: false, timing: [T(0.65, 1, 'out'), SINK_IN], cap: ['', 'Converge Clan, the school tech club.', ''] }),
  actor('board', P.board, [
    { x: PHOTO1.x, y: PHOTO1.y, z: BACK + 0.012, w: 1.04, h: 0.66, scale: 0.001 },
    { x: PHOTO1.x, y: PHOTO1.y, z: BACK + 0.012, w: 1.04, h: 0.66, scale: 1 },
    { x: PHOTO1.x, y: SUNK, z: BACK + 0.012, w: 1.04, h: 0.66, scale: 0.001 },
  ], W3, { vc: true, timing: [T(0.55, 0.95, 'out'), SINK_IN] }),
  // the poster: Steve Jobs and the quote, drawing pins; it becomes the Converge Clan photo, then goes
  actor('poster', P.face, [PHOTO0, PHOTO1, { ...PHOTO1, y: SUNK, w: 0.001, h: 0.001 }], W3, {
    shade: 'unlit', tex: 'mix', outline: false, timing: [T(0.3, 0.8, 'inOut'), SINK_IN],
    cap: ["Here's to the crazy ones. Above the TV.", 'Converge Clan, 2017. President.', ''],
  }),

  // cabinet under the TV becomes the lab desk
  actor('table', P.table, [
    { x: 0, y: 0, z: -1.7, w: 1.3, h: 0.45, d: 0.55, top: 0.04 },
    { x: 0.1, y: 0, z: -1.5, w: 1.4, h: 0.72, d: 0.7, top: 0.04 },
    { x: 0.1, y: SUNK, z: -1.5, w: 1.4, h: 0.72, d: 0.7, top: 0.04 },
  ], ['#6E5238', '#C8B79B', '#C8B79B'], { timing: [SMOOTH, LATE_SINK] }),
  // TV becomes the beige CRT monitor
  actor('screenBody', P.screenBody, [
    { ...TV, w: 1.2, h: 0.75, d: 0.5, standW: 0.001, standH: 0.001, standD: 0.001 },
    { ...MON, w: 0.45, h: 0.42, d: 0.45, standW: 0.3, standH: 0.06, standD: 0.3 },
    { ...MON, y: MON.y + SUNK, w: 0.45, h: 0.42, d: 0.45, standW: 0.3, standH: 0.06, standD: 0.3 },
  ], ['#2B2B2B', '#E5DCC5', '#E5DCC5'], { timing: [T(0.25, 0.8, 'inOut'), LATE_SINK], cap: ['The TV. A 2008 flat screen, sort of.', 'A beige CRT in the lab.', ''] }),
  actor('screen', P.face, [
    { x: TV.x, y: TV.y, z: TV.z + 0.25 + 0.003, w: 1.0, h: 0.6 },
    { x: MON.x, y: MON.y, z: MON.z + 0.225 + 0.003, w: 0.36, h: 0.32 },
    { x: MON.x, y: MON.y + SUNK, z: MON.z + 0.225 + 0.003, w: 0.36, h: 0.32 },
  ], W3, {
    shade: 'unlit', tex: 'mix', outline: false, timing: [T(0.25, 0.8, 'inOut'), LATE_SINK],
    cap: ['Call of Duty: World at War, zombies. Until the power cut.', 'index.html in Notepad. The first website.', ''],
    href: 'https://www.youtube.com/watch?v=FsKdbWNi3cI',
  }),
  actor('keyboard', P.keyboard, [
    { x: 0.05, y: ABOVE, z: -1.22, w: 0.42, d: 0.15, scale: 1 },
    { x: 0.05, y: 0.72, z: -1.22, w: 0.42, d: 0.15, scale: 1 },
    { x: 0.05, y: SUNK, z: -1.22, w: 0.42, d: 0.15, scale: 1 },
  ], W3, { tex: 'tex', timing: [T(0.7, 1, 'bounce'), LATE_SINK] }),
  actor('tower', P.tower, [{ x: -0.42, y: ABOVE, z: -1.5, scale: 1 }, { x: -0.42, y: 0, z: -1.5, scale: 1 }, { x: -0.42, y: SUNK, z: -1.5, scale: 1 }], W3, { vc: true, timing: [T(0.6, 1, 'bounce'), LATE_SINK] }),
  actor('socket', P.socket, [SOCKET, SOCKET, { ...SOCKET, y: SUNK }], W3, { vc: true, timing: [HOLD, T(0, 0.5, 'in')] }),
  actor('wire', P.wire, [
    { ax: SOCKET.x, ay: SOCKET.y - 0.03, az: SOCKET.z, bx: TV.x + 0.5, by: TV.y - 0.36, bz: TV.z - 0.2 },
    { ax: SOCKET.x, ay: SOCKET.y - 0.03, az: SOCKET.z, bx: MON.x + 0.15, by: MON.y - 0.2, bz: MON.z - 0.2 },
    { ax: SOCKET.x, ay: SUNK, az: SOCKET.z, bx: SOCKET.x, by: SUNK, bz: SOCKET.z },
  ], ['#2B2B2B', '#2B2B2B', '#2B2B2B'], { outline: false, timing: [SMOOTH, T(0, 0.5, 'in')], cap: ['The wire to the socket. Every Delhi room has one.', '', ''] }),

  // the floor of the bedroom: rug, the plate, the ball, the Xbox, the shelf on the wall
  actor('rug', P.rug, [{ x: 0, z: 0.55, r: 0.95, t: 0.008 }, { x: 0.05, z: -0.75, r: 0.001, t: 0.001 }, { x: 0.05, z: -0.75, r: 0.001, t: 0.001 }], W3, { vc: true, outline: false, timing: [T(0, 0.5, 'in'), HOLD] }),
  actor('chair', P.chair, [
    { x: 0.05, z: -0.75, seatW: 0.46, seatD: 0.46, seatH: 0.45, seatT: 0.04, legR: 0.02, backH: 0.42, yOff: ABOVE },
    { x: 0.05, z: -0.75, seatW: 0.46, seatD: 0.46, seatH: 0.45, seatT: 0.04, legR: 0.02, backH: 0.42, yOff: 0 },
    { x: 0.05, z: -0.75, seatW: 0.46, seatD: 0.46, seatH: 0.45, seatT: 0.04, legR: 0.02, backH: 0.42, yOff: SUNK },
  ], ['#4A5560', '#4A5560', '#4A5560'], { timing: [T(0.5, 0.95, 'bounce'), LATE_SINK] }),
  actor('nuggets', P.nuggets, [{ x: 0.62, y: 0, z: 0.95, scale: 1 }, { x: 0.62, y: -0.5, z: 0.95, scale: 1 }, { x: 0.62, y: SUNK, z: 0.95, scale: 1 }], W3, { vc: true, timing: [SINK_IN, HOLD], cap: ['Chicken nuggets, ketchup on the side.', '', ''] }),
  actor('ball', P.ball, [{ x: 0, y: 0, z: 0, r: 0.11 }, { x: 0, y: 0, z: 0, r: 0.11 }, { x: 0, y: 0, z: 0, r: 0.11 }], W3, {
    tex: 'tex', path: [[-0.95, 0.11, 0.25], [-0.95, 0.11, 6.8], [-0.95, SUNK, 6.8]], roll: 0.11, timing: [T(0, 0.55, 'in'), HOLD],
    cap: ['Football, not cricket.', '', ''],
  }),
  actor('shelf', P.shelf, [{ ...SHELF, scale: 1 }, { ...SHELF, y: SUNK, scale: 1 }, { ...SHELF, y: SUNK, scale: 1 }], W3, { vc: true, timing: [T(0.1, 0.55, 'in'), HOLD], cap: ['Seven Harry Potters, two Percy Jacksons, three Famous Fives, one game case.', '', ''] }),
  actor('shelfLabels', P.shelfLabels, [{ ...SHELF, scale: 1 }, { ...SHELF, y: SUNK, scale: 1 }, { ...SHELF, y: SUNK, scale: 1 }], W3, { shade: 'unlit', tex: 'tex', outline: false, transparent: true, timing: [T(0.1, 0.55, 'in'), HOLD] }),
  actor('xbox', P.xbox, [{ x: 0.78, y: 0, z: -1.45, scale: 1 }, { x: 0.78, y: SUNK, z: -1.45, scale: 1 }, { x: 0.78, y: SUNK, z: -1.45, scale: 1 }], W3, { vc: true, timing: [LATE_SINK, HOLD], cap: ['The Xbox 360. Where it started.', '', ''] }),
  actor('xboxLogo', P.face, [
    { x: 0.78, y: 0.235, z: -1.45 + 0.13 + 0.002, w: 0.06, h: 0.016 },
    { x: 0.78, y: 0.235 + SUNK, z: -1.45 + 0.13 + 0.002, w: 0.06, h: 0.016 },
    { x: 0.78, y: 0.235 + SUNK, z: -1.45 + 0.13 + 0.002, w: 0.06, h: 0.016 },
  ], W3, { shade: 'unlit', tex: 'tex', outline: false, transparent: true, timing: [LATE_SINK, HOLD] }),

  // the rest of the lab drops in from above the ceiling and lands
  actor('labRow', P.labRow, [{ ...ROW, lift: 3.3 }, { ...ROW, lift: 1 }, { ...ROW, lift: -1.6 }], ['#C8B79B', '#C8B79B', '#C8B79B'], { timing: [DROP, T(0, 0.4, 'in')], cap: ['', 'The rest of the lab. Beige CRTs, all of them.', ''] }),
  actor('labScreens', P.labScreens, [{ ...ROW, lift: 3.3 }, { ...ROW, lift: 1 }, { ...ROW, lift: -1.6 }], ['#1C2A33', '#1C2A33', '#1C2A33'], { outline: false, timing: [DROP, T(0, 0.4, 'in')] }),
  actor('labChairs', P.labChairs, [{ ...ROW, x: 1.05, lift: 3.3 }, { ...ROW, x: 1.05, lift: 1 }, { ...ROW, x: 1.05, lift: -1.6 }], ['#4A5560', '#4A5560', '#4A5560'], { timing: [T(0.6, 1, 'bounce'), T(0, 0.4, 'in')] }),
  actor('labKeyboards', P.labKeyboards, [{ ...ROW, lift: 3.3 }, { ...ROW, lift: 1 }, { ...ROW, lift: -1.6 }], W3, { vc: true, outline: false, timing: [DROP, T(0, 0.4, 'in')] }),

  // San Francisco: hidden under the floor or the bay until the room opens up
  actor('sky', P.sky, [{ r: 0.001, y: -1 }, { r: 0.001, y: -1 }, { r: 320, y: 0 }], W3, { shade: 'unlit', tex: 'tex', outline: false, timing: [HOLD, T(0, 0.3, 'out')] }),
  actor('sun', P.sun, [{ x: 0, y: -1, z: 0, r: 0.001 }, { x: 0, y: -1, z: 0, r: 0.001 }, { x: 70, y: 95, z: -230, r: 9 }], W3, { shade: 'unlit', vc: true, outline: false, timing: [HOLD, T(0.3, 0.7, 'out')] }),
  actor('clouds', P.clouds, [{ y: -1, scale: 0.001 }, { y: -1, scale: 0.001 }, { y: 60, scale: 1 }], W3, { vc: true, outline: false, bounce: 0.35, timing: [HOLD, T(0.3, 0.7, 'out')] }),
  actor('water', P.water, [{ y: -1, size: 0.001, zc: 0 }, { y: -1, size: 0.001, zc: 0 }, { y: -1.6, size: 400, zc: -100 }], W3, { shade: 'shell', vc: true, outline: false, timing: [HOLD, T(0.2, 0.6, 'out')], cap: ['', '', 'The bay.'] }),
  actor('hills', P.hills, [{ z: -1, scale: 0.001 }, { z: -1, scale: 0.001 }, { z: -250, scale: 1 }], W3, { vc: true, outline: false, timing: [HOLD, T(0.3, 0.7, 'out')] }),
  // the bridge rises out of the bay
  actor('bridge', P.bridge, [{ x: -10, y: -62, z: -150, scale: 1 }, { x: -10, y: -62, z: -150, scale: 1 }, { x: -10, y: -1.6, z: -150, scale: 1 }], W3, { vc: true, timing: [HOLD, T(0.35, 0.85, 'out')], cap: ['', '', 'The Golden Gate. I had only seen it in films.'] }),
  actor('boats', P.boats, [{ y: -12, scale: 1 }, { y: -12, scale: 1 }, { y: -1.6, scale: 1 }], W3, { vc: true, timing: [HOLD, T(0.6, 1, 'out')] }),
  actor('palmL', P.palm, [{ x: -10, z: -18, h: 7, scale: 0.001 }, { x: -10, z: -18, h: 7, scale: 0.001 }, { x: -10, z: -18, h: 7, scale: 1 }], W3, { vc: true, timing: [HOLD, T(0.5, 0.9, 'out')] }),
  actor('palmR', P.palm, [{ x: 8, z: -9, h: 6, scale: 0.001 }, { x: 8, z: -9, h: 6, scale: 0.001 }, { x: 8, z: -9, h: 6, scale: 1 }], W3, { vc: true, timing: [HOLD, T(0.55, 0.95, 'out')] }),
  actor('lamp', P.lamp, [{ x: -4.6, z: -7, h: 4, scale: 0.001 }, { x: -4.6, z: -7, h: 4, scale: 0.001 }, { x: -4.6, z: -7, h: 4, scale: 1 }], W3, { vc: true, timing: [HOLD, T(0.5, 0.9, 'out')] }),
  actor('signBoard', P.signBoard, [{ x: 3.6, y: 1.5, z: -3.2, w: 4.4, h: 2.1, scale: 0.001 }, { x: 3.6, y: 1.5, z: -3.2, w: 4.4, h: 2.1, scale: 0.001 }, { x: 3.6, y: 1.5, z: -3.2, w: 4.4, h: 2.1, scale: 1 }], W3, { vc: true, timing: [HOLD, T(0.55, 0.95, 'out')] }),
  actor('sign', P.face, [{ x: 3.6, y: 1.5, z: -3.2, w: 0.001, h: 0.001 }, { x: 3.6, y: 1.5, z: -3.2, w: 0.001, h: 0.001 }, { x: 3.6, y: 1.5, z: -3.2 + 0.002, w: 4.4, h: 2.1 }], W3, {
    shade: 'unlit', tex: 'tex', outline: false, timing: [HOLD, T(0.55, 0.95, 'out')],
    cap: ['', '', 'Google San Francisco, June 2018. The Code-in winners trip.'], href: 'https://codein.withgoogle.com/archive/',
  }),
  actor('hedge', P.hedge, [{ x: 3.6, z: -2.2, w: 5, scale: 0.001 }, { x: 3.6, z: -2.2, w: 5, scale: 0.001 }, { x: 3.6, z: -2.2, w: 5, scale: 1 }], W3, { vc: true, timing: [HOLD, T(0.55, 0.95, 'out')] }),

  ...PARTS.map((part): Actor => ({
    id: `figure-${part}`,
    keys: [kid[part].pos, tween[part].pos, teen[part].pos],
    uv: kid[part].uv,
    col: kid[part].col,
    colors: partColors[part],
    shade: 'solid',
    surface: spread(MATERIAL[`figure-${part}`] ?? 'cotton', STATIONS.length),
    tex: part === 'shirt' ? 'mix' : part === 'badge' ? 'tex' : undefined,
    vc: part === 'held',
    outline: part !== 'badge' && part !== 'lanyard' && part !== 'glasses',
    timing: [T(0.15, 0.85, 'inOut'), T(0.2, 0.8, 'inOut')],
    cap: partCaps[part],
  })),
];
