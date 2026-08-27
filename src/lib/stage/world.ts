// The whole world as data: camera stations and actors with their params per station.
// Station 0 is the 2010 Delhi bedroom, station 1 the 2013 school computer lab.
import { figure, KID, TWEEN, PARTS, type Part } from './figure3d.ts';
import * as P from './props.ts';
import type { Geo, V3 } from './rig.ts';

export interface Station { cam: V3; look: V3; fov: number } // fov horizontal, degrees
export interface Actor {
  id: string;
  keys: Float32Array[]; // built positions at each station
  uv: Float32Array; // from the first key, constant across stations
  col: Float32Array; // vertex colours, constant across stations
  colors: string[]; // material colour per station (multiplies vertex colours and textures)
  shade: 'toon' | 'flat'; // lit with the toon ramp, or unlit
  tex?: 'tex' | 'mix'; // painted texture: one, or two blended by the station progress (painters keyed by id in stage-run)
  vc: boolean; // use the vertex colours
  outline: boolean;
  transparent?: boolean;
  at?: V3; // mesh position for rigs built at the origin (the fan)
}

// back wall at z = -2.3, floor runs to z = 4.1 so the camera never sees the front edge
export const ROOM = { w: 4.4, h: 2.8, d: 6.4, zc: 0.9 };
const BACK = ROOM.zc - ROOM.d / 2;

export const STATIONS: Station[] = [
  { cam: [0.45, 1.4, 3.0], look: [0, 0.85, -1.2], fov: 70 },
  { cam: [-1.15, 1.75, 1.25], look: [0.2, 0.9, -1.5], fov: 60 },
];

type Opts = Partial<Pick<Actor, 'shade' | 'tex' | 'vc' | 'outline' | 'transparent' | 'at'>>;
const actor = <T>(id: string, rig: (p: T) => Geo, keys: T[], colors: string[], o: Opts = {}): Actor => {
  const built = keys.map(rig);
  return { id, keys: built.map((g) => g.pos), uv: built[0].uv, col: built[0].col, colors, shade: o.shade ?? 'toon', tex: o.tex, vc: o.vc ?? false, outline: o.outline ?? true, transparent: o.transparent, at: o.at };
};

const kid = figure(KID), tween = figure(TWEEN);
const W2 = ['#FFFFFF', '#FFFFFF'];
const partColors: Record<Part, [string, string]> = {
  skin: ['#F1C7A3', '#F1C7A3'],
  hair: ['#17282F', '#17282F'],
  shirt: ['#FFFFFF', '#FFFFFF'], // textured: Barcelona 2013 home shirt, then the white school shirt
  sleeveL: ['#004D98', '#FFFFFF'],
  sleeveR: ['#A50044', '#FFFFFF'],
  legs: ['#33535F', '#2B2B2B'],
  shoes: ['#17282F', '#17282F'],
  tie: ['#1D3557', '#1D3557'],
  held: ['#FFFFFF', '#9A9A96'], // the controller becomes the mouse
};

// where things sit
const TV = { x: 0, y: 0.45 + 0.375, z: -1.7 }, MON = { x: 0.1, y: 0.72 + 0.06 + 0.21, z: -1.5 };
const SHELF = { x: 1.35, y: 0.95, z: BACK + 0.13, w: 0.9 };
const WIN0 = { x: -1.05, y: 1.62, z: BACK + 0.01, w: 0.9, h: 1.0 }, WIN1 = { x: -0.9, y: 2.35, z: BACK + 0.01, w: 2.2, h: 0.42 };
const SOCKET = { x: 1.0, y: 0.32, z: BACK + 0.012 };

export const ACTORS: Actor[] = [
  actor('floor', P.floor, [ROOM, ROOM], ['#D9B994', '#C9CFD3'], { shade: 'flat', outline: false }),
  actor('walls', P.walls, [ROOM, ROOM], ['#F9F4EC', '#E9EEF2'], { shade: 'flat', outline: false }),
  actor('ceiling', P.ceiling, [ROOM, ROOM], ['#FFFFFF', '#F5F9FC'], { shade: 'flat', outline: false }),
  // the whiteboard grows on the left wall in the lab
  actor('whiteboard', P.panel, [
    { x: -ROOM.w / 2 + 0.01, y: 1.45, z: -0.8, w: 0.001, h: 0.001, t: 0.001, yaw: Math.PI / 2 },
    { x: -ROOM.w / 2 + 0.01, y: 1.45, z: -0.8, w: 1.8, h: 1.1, t: 0.02, yaw: Math.PI / 2 },
  ], W2),
  // the window onto the Delhi rooftops becomes the lab's high window strip
  actor('window', P.face, [
    { x: WIN0.x, y: WIN0.y, z: WIN0.z, w: WIN0.w, h: WIN0.h },
    { x: WIN1.x, y: WIN1.y, z: WIN1.z, w: WIN1.w, h: WIN1.h },
  ], W2, { shade: 'flat', tex: 'mix', outline: false }),
  actor('windowFrame', P.windowFrame, [WIN0, WIN1], ['#F9F4EC', '#DDE3E8']),
  actor('curtains', P.curtains, [
    { x: WIN0.x, y: WIN0.y + WIN0.h / 2 + 0.1, z: WIN0.z, w: WIN0.w, h: 1.3, scale: 1 },
    { x: WIN1.x, y: WIN1.y + WIN1.h / 2 + 0.05, z: WIN1.z, w: WIN1.w, h: 1.3, scale: 0.001 },
  ], W2, { vc: true }),
  actor('clock', P.clock, [{ x: -0.5, y: 2.3, z: BACK + 0.03, r: 0.001 }, { x: 0.9, y: 2.25, z: BACK + 0.03, r: 0.16 }], W2, { vc: true }),
  // cabinet under the TV becomes the lab desk
  actor('table', P.table, [
    { x: 0, y: 0, z: -1.7, w: 1.3, h: 0.45, d: 0.55, top: 0.04 },
    { x: 0.1, y: 0, z: -1.5, w: 1.4, h: 0.72, d: 0.7, top: 0.04 },
  ], ['#6E5238', '#C8B79B']),
  // TV becomes the beige CRT monitor
  actor('screenBody', P.screenBody, [
    { ...TV, w: 1.2, h: 0.75, d: 0.5, standW: 0.001, standH: 0.001, standD: 0.001 },
    { ...MON, w: 0.45, h: 0.42, d: 0.45, standW: 0.3, standH: 0.06, standD: 0.3 },
  ], ['#2B2B2B', '#E5DCC5']),
  actor('screen', P.face, [
    { x: TV.x, y: TV.y, z: TV.z + 0.25 + 0.003, w: 1.0, h: 0.6 },
    { x: MON.x, y: MON.y, z: MON.z + 0.225 + 0.003, w: 0.36, h: 0.32 },
  ], W2, { shade: 'flat', tex: 'mix', outline: false }),
  actor('keyboard', P.keyboard, [
    { x: 0.05, y: 0.45, z: -1.55, w: 0.001, d: 0.001, scale: 0.001 },
    { x: 0.05, y: 0.72, z: -1.22, w: 0.42, d: 0.15, scale: 1 },
  ], W2, { tex: 'tex' }),
  actor('socket', P.socket, [SOCKET, SOCKET], W2, { vc: true }),
  actor('wire', P.wire, [
    { ax: SOCKET.x, ay: SOCKET.y - 0.03, az: SOCKET.z, bx: TV.x + 0.5, by: TV.y - 0.36, bz: TV.z - 0.2 },
    { ax: SOCKET.x, ay: SOCKET.y - 0.03, az: SOCKET.z, bx: MON.x + 0.15, by: MON.y - 0.2, bz: MON.z - 0.2 },
  ], ['#2B2B2B', '#2B2B2B'], { outline: false }),
  actor('rug', P.rug, [{ x: 0, z: 0.55, r: 0.95, t: 0.008 }, { x: 0.05, z: -0.75, r: 0.001, t: 0.001 }], W2, { vc: true, outline: false }),
  actor('chair', P.chair, [
    { x: 0, z: 0.55, seatW: 0.001, seatD: 0.001, seatH: 0.002, seatT: 0.001, legR: 0.001, backH: 0.001, yOff: -0.3 },
    { x: 0.05, z: -0.75, seatW: 0.46, seatD: 0.46, seatH: 0.45, seatT: 0.04, legR: 0.02, backH: 0.42, yOff: 0 },
  ], ['#4A5560', '#4A5560']),
  actor('nuggets', P.nuggets, [{ x: 0.62, y: 0, z: 0.95, scale: 1 }, { x: 0.62, y: -0.4, z: 0.95, scale: 0.001 }], W2, { vc: true }),
  actor('ball', P.ball, [{ x: -0.95, y: 0.11, z: 0.25, r: 0.11 }, { x: -0.95, y: -0.5, z: 0.25, r: 0.001 }], W2, { tex: 'tex' }),
  actor('fan', P.fan, [{ rod: 0.55, r: 0.6, hub: 0.08 }, { rod: 0.55, r: 0.6, hub: 0.08 }], ['#9A9A96', '#9A9A96'], { at: [0, ROOM.h, -0.4] }),
  // the poster: Steve Jobs and the quote, drawing pins; it shrinks to nothing in the lab
  actor('poster', P.face, [
    { x: 0.95, y: 1.75, z: BACK + 0.01, w: 0.9, h: 0.38 },
    { x: 0.95, y: 1.75, z: BACK + 0.01, w: 0.001, h: 0.001 },
  ], W2, { shade: 'flat', tex: 'tex', outline: false }),
  actor('shelf', P.shelf, [{ ...SHELF, scale: 1 }, { ...SHELF, y: -0.7, scale: 0.001 }], W2, { vc: true }),
  actor('shelfLabels', P.shelfLabels, [{ ...SHELF, scale: 1 }, { ...SHELF, y: -0.7, scale: 0.001 }], W2, { shade: 'flat', tex: 'tex', outline: false, transparent: true }),
  actor('xbox', P.xbox, [{ x: 0.78, y: 0, z: -1.45, scale: 1 }, { x: 0.78, y: -0.6, z: -1.45, scale: 0.001 }], W2, { vc: true }),
  actor('xboxLogo', P.face, [
    { x: 0.78, y: 0.235, z: -1.45 + 0.13 + 0.002, w: 0.06, h: 0.016 },
    { x: 0.78, y: -0.4, z: -1.45 + 0.13 + 0.002, w: 0.001, h: 0.001 },
  ], W2, { shade: 'flat', tex: 'tex', outline: false, transparent: true }),
  actor('labRow', P.labRow, [{ x: 1.65, z0: -1.4, gap: 0.85, lift: 0 }, { x: 1.65, z0: -1.4, gap: 0.85, lift: 1 }], ['#C8B79B', '#C8B79B']),
  actor('labScreens', P.labScreens, [{ x: 1.65, z0: -1.4, gap: 0.85, lift: 0 }, { x: 1.65, z0: -1.4, gap: 0.85, lift: 1 }], ['#1C2A33', '#1C2A33'], { outline: false }),
  ...PARTS.map((part): Actor => ({
    id: `figure-${part}`,
    keys: [kid[part].pos, tween[part].pos],
    uv: kid[part].uv,
    col: kid[part].col,
    colors: partColors[part],
    shade: 'toon',
    tex: part === 'shirt' ? 'mix' : undefined,
    vc: part === 'held',
    outline: true,
  })),
];
