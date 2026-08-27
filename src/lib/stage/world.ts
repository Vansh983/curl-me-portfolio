// The whole world as data: camera stations and actors with their params per station.
// Station 0 is the 2010 Delhi bedroom, station 1 the 2013 school computer lab.
import { figure, KID, TWEEN, TEEN, PARTS, type Part } from './figure3d.ts';
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
  { cam: [-1.15, 1.7, 1.25], look: [0.35, 1.2, -1.5], fov: 64 },
  // 2018: outside, the Google San Francisco sign, the bridge across the bay, him with the trophy
  { cam: [-0.7, 2.1, 6.6], look: [0.9, 2.2, -12], fov: 66 },
];
// the room after the walls have gone: a plaza by the bay
const PLAZA = { w: 34, h: 0.001, d: 44, zc: -6 };

type Opts = Partial<Pick<Actor, 'shade' | 'tex' | 'vc' | 'outline' | 'transparent' | 'at'>>;
const actor = <T>(id: string, rig: (p: T) => Geo, keys: T[], colors: string[], o: Opts = {}): Actor => {
  const built = keys.map(rig);
  return { id, keys: built.map((g) => g.pos), uv: built[0].uv, col: built[0].col, colors, shade: o.shade ?? 'toon', tex: o.tex, vc: o.vc ?? false, outline: o.outline ?? true, transparent: o.transparent, at: o.at };
};

const kid = figure(KID), tween = figure(TWEEN), teen = figure(TEEN);
const W2 = ['#FFFFFF', '#FFFFFF', '#FFFFFF'];
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

// where things sit
const TV = { x: 0, y: 0.45 + 0.375, z: -1.7 }, MON = { x: 0.1, y: 0.72 + 0.06 + 0.21, z: -1.5 };
const SHELF = { x: 1.35, y: 0.95, z: BACK + 0.13, w: 0.9 };
const WIN0 = { x: -1.05, y: 1.62, z: BACK + 0.01, w: 0.9, h: 1.0 }, WIN1 = { x: -0.9, y: 2.35, z: BACK + 0.01, w: 2.2, h: 0.42 };
const SOCKET = { x: 1.0, y: 0.32, z: BACK + 0.012 };
const PHOTO0 = { x: 0.95, y: 1.75, z: BACK + 0.012, w: 0.9, h: 0.5 }, PHOTO1 = { x: 1.35, y: 1.68, z: BACK + 0.035, w: 0.86, h: 0.48 };
const ROW = { x: 1.65, z0: -1.4, gap: 0.85 };

const GONE = { ...ROOM, y: -3.2 }; // the room sunk under the plaza
const SUNK = -3; // y of things that sank under the plaza

export const ACTORS: Actor[] = [
  actor('floor', P.floor, [ROOM, ROOM, PLAZA], W2, { shade: 'flat', tex: 'mix', outline: false }),
  actor('walls', P.walls, [ROOM, ROOM, GONE], ['#F9F4EC', '#E9EEF2', '#E9EEF2'], { shade: 'flat', outline: false }),
  actor('ceiling', P.ceiling, [ROOM, ROOM, GONE], ['#FFFFFF', '#F5F9FC', '#F5F9FC'], { shade: 'flat', outline: false }),
  // the whiteboard grows on the left wall in the lab
  actor('whiteboard', P.panel, [
    { x: -ROOM.w / 2 + 0.01, y: 1.45, z: -0.8, w: 0.001, h: 0.001, t: 0.001, yaw: Math.PI / 2 },
    { x: -ROOM.w / 2 + 0.01, y: 1.45, z: -0.8, w: 1.8, h: 1.1, t: 0.02, yaw: Math.PI / 2 },
    { x: -ROOM.w / 2 + 0.01, y: SUNK, z: -0.8, w: 0.001, h: 0.001, t: 0.001, yaw: Math.PI / 2 },
  ], W2, { tex: 'tex' }),
  // the window onto the Delhi rooftops becomes the lab's high window strip
  actor('window', P.face, [
    { x: WIN0.x, y: WIN0.y, z: WIN0.z, w: WIN0.w, h: WIN0.h },
    { x: WIN1.x, y: WIN1.y, z: WIN1.z, w: WIN1.w, h: WIN1.h },
    { x: WIN1.x, y: SUNK, z: WIN1.z, w: 0.001, h: 0.001 },
  ], W2, { shade: 'flat', tex: 'mix', outline: false }),
  actor('windowFrame', P.windowFrame, [WIN0, WIN1, { ...WIN1, y: SUNK, w: 0.001, h: 0.001 }], ['#F9F4EC', '#DDE3E8', '#DDE3E8']),
  actor('curtains', P.curtains, [
    { x: WIN0.x, y: WIN0.y + WIN0.h / 2 + 0.1, z: WIN0.z, w: WIN0.w, h: 1.3, scale: 1 },
    { x: WIN1.x, y: WIN1.y + WIN1.h / 2 + 0.05, z: WIN1.z, w: WIN1.w, h: 1.3, scale: 0.001 },
    { x: WIN1.x, y: SUNK, z: WIN1.z, w: 0.001, h: 1.3, scale: 0.001 },
  ], W2, { vc: true }),
  actor('clock', P.clock, [{ x: 0.3, y: 2.3, z: BACK + 0.03, r: 0.001 }, { x: 0.3, y: 2.3, z: BACK + 0.03, r: 0.14 }, { x: 0.3, y: SUNK, z: BACK + 0.03, r: 0.001 }], W2, { vc: true }),
  actor('tubes', P.tubes, [{ y: ROOM.h, z0: -1.4, gap: 1.6, scale: 0.001 }, { y: ROOM.h, z0: -1.4, gap: 1.6, scale: 1 }, { y: SUNK, z0: -1.4, gap: 1.6, scale: 0.001 }], W2, { vc: true, shade: 'flat' }),
  // Converge Clan: the banner up top, the team photo on the notice board (the Steve Jobs poster becomes it)
  actor('banner', P.face, [
    { x: 1.4, y: 2.3, z: BACK + 0.01, w: 0.001, h: 0.001 },
    { x: 1.4, y: 2.3, z: BACK + 0.01, w: 1.15, h: 0.25 },
    { x: 1.4, y: SUNK, z: BACK + 0.01, w: 0.001, h: 0.001 },
  ], W2, { shade: 'flat', tex: 'tex', outline: false }),
  actor('board', P.board, [
    { x: PHOTO1.x, y: PHOTO1.y, z: BACK + 0.012, w: 1.04, h: 0.66, scale: 0.001 },
    { x: PHOTO1.x, y: PHOTO1.y, z: BACK + 0.012, w: 1.04, h: 0.66, scale: 1 },
    { x: PHOTO1.x, y: SUNK, z: BACK + 0.012, w: 1.04, h: 0.66, scale: 0.001 },
  ], W2, { vc: true }),
  // cabinet under the TV becomes the lab desk
  actor('table', P.table, [
    { x: 0, y: 0, z: -1.7, w: 1.3, h: 0.45, d: 0.55, top: 0.04 },
    { x: 0.1, y: 0, z: -1.5, w: 1.4, h: 0.72, d: 0.7, top: 0.04 },
    { x: 0.1, y: SUNK, z: -1.5, w: 0.001, h: 0.002, d: 0.001, top: 0.001 },
  ], ['#6E5238', '#C8B79B', '#C8B79B']),
  // TV becomes the beige CRT monitor
  actor('screenBody', P.screenBody, [
    { ...TV, w: 1.2, h: 0.75, d: 0.5, standW: 0.001, standH: 0.001, standD: 0.001 },
    { ...MON, w: 0.45, h: 0.42, d: 0.45, standW: 0.3, standH: 0.06, standD: 0.3 },
    { ...MON, y: SUNK, w: 0.001, h: 0.001, d: 0.001, standW: 0.001, standH: 0.001, standD: 0.001 },
  ], ['#2B2B2B', '#E5DCC5', '#E5DCC5']),
  actor('screen', P.face, [
    { x: TV.x, y: TV.y, z: TV.z + 0.25 + 0.003, w: 1.0, h: 0.6 },
    { x: MON.x, y: MON.y, z: MON.z + 0.225 + 0.003, w: 0.36, h: 0.32 },
    { x: MON.x, y: SUNK, z: MON.z + 0.225 + 0.003, w: 0.001, h: 0.001 },
  ], W2, { shade: 'flat', tex: 'mix', outline: false }),
  actor('keyboard', P.keyboard, [
    { x: 0.05, y: 0.45, z: -1.55, w: 0.001, d: 0.001, scale: 0.001 },
    { x: 0.05, y: 0.72, z: -1.22, w: 0.42, d: 0.15, scale: 1 },
    { x: 0.05, y: SUNK, z: -1.22, w: 0.001, d: 0.001, scale: 0.001 },
  ], W2, { tex: 'tex' }),
  actor('socket', P.socket, [SOCKET, SOCKET, { ...SOCKET, y: SUNK }], W2, { vc: true }),
  actor('wire', P.wire, [
    { ax: SOCKET.x, ay: SOCKET.y - 0.03, az: SOCKET.z, bx: TV.x + 0.5, by: TV.y - 0.36, bz: TV.z - 0.2 },
    { ax: SOCKET.x, ay: SOCKET.y - 0.03, az: SOCKET.z, bx: MON.x + 0.15, by: MON.y - 0.2, bz: MON.z - 0.2 },
    { ax: SOCKET.x, ay: SUNK, az: SOCKET.z, bx: SOCKET.x, by: SUNK, bz: SOCKET.z },
  ], ['#2B2B2B', '#2B2B2B', '#2B2B2B'], { outline: false }),
  actor('rug', P.rug, [{ x: 0, z: 0.55, r: 0.95, t: 0.008 }, { x: 0.05, z: -0.75, r: 0.001, t: 0.001 }, { x: 0.05, z: -0.75, r: 0.001, t: 0.001 }], W2, { vc: true, outline: false }),
  actor('chair', P.chair, [
    { x: 0, z: 0.55, seatW: 0.001, seatD: 0.001, seatH: 0.002, seatT: 0.001, legR: 0.001, backH: 0.001, yOff: -0.3 },
    { x: 0.05, z: -0.75, seatW: 0.46, seatD: 0.46, seatH: 0.45, seatT: 0.04, legR: 0.02, backH: 0.42, yOff: 0 },
    { x: 0.05, z: -0.75, seatW: 0.001, seatD: 0.001, seatH: 0.002, seatT: 0.001, legR: 0.001, backH: 0.001, yOff: SUNK },
  ], ['#4A5560', '#4A5560', '#4A5560']),
  actor('nuggets', P.nuggets, [{ x: 0.62, y: 0, z: 0.95, scale: 1 }, { x: 0.62, y: -0.4, z: 0.95, scale: 0.001 }, { x: 0.62, y: SUNK, z: 0.95, scale: 0.001 }], W2, { vc: true }),
  actor('ball', P.ball, [{ x: -0.95, y: 0.11, z: 0.25, r: 0.11 }, { x: -0.95, y: -0.5, z: 0.25, r: 0.001 }, { x: -0.95, y: SUNK, z: 0.25, r: 0.001 }], W2, { tex: 'tex' }),
  actor('fan', P.fan, [{ rod: 0.55, r: 0.6, hub: 0.08 }, { rod: 0.55, r: 0.6, hub: 0.08 }, { rod: 0.001, r: 0.001, hub: 0.001 }], ['#9A9A96', '#9A9A96', '#9A9A96'], { at: [0, ROOM.h, -0.4] }),
  // the poster: Steve Jobs and the quote, drawing pins; it becomes the Converge Clan photo, then goes
  actor('poster', P.face, [PHOTO0, PHOTO1, { ...PHOTO1, y: SUNK, w: 0.001, h: 0.001 }], W2, { shade: 'flat', tex: 'mix', outline: false }),
  actor('shelf', P.shelf, [{ ...SHELF, scale: 1 }, { ...SHELF, y: -0.7, scale: 0.001 }, { ...SHELF, y: SUNK, scale: 0.001 }], W2, { vc: true }),
  actor('shelfLabels', P.shelfLabels, [{ ...SHELF, scale: 1 }, { ...SHELF, y: -0.7, scale: 0.001 }, { ...SHELF, y: SUNK, scale: 0.001 }], W2, { shade: 'flat', tex: 'tex', outline: false, transparent: true }),
  actor('xbox', P.xbox, [{ x: 0.78, y: 0, z: -1.45, scale: 1 }, { x: 0.78, y: -0.6, z: -1.45, scale: 0.001 }, { x: 0.78, y: SUNK, z: -1.45, scale: 0.001 }], W2, { vc: true }),
  actor('xboxLogo', P.face, [
    { x: 0.78, y: 0.235, z: -1.45 + 0.13 + 0.002, w: 0.06, h: 0.016 },
    { x: 0.78, y: -0.4, z: -1.45 + 0.13 + 0.002, w: 0.001, h: 0.001 },
    { x: 0.78, y: SUNK, z: -1.45 + 0.13 + 0.002, w: 0.001, h: 0.001 },
  ], W2, { shade: 'flat', tex: 'tex', outline: false, transparent: true }),
  actor('labRow', P.labRow, [{ ...ROW, lift: 0 }, { ...ROW, lift: 1 }, { ...ROW, lift: -1.5 }], ['#C8B79B', '#C8B79B', '#C8B79B']),
  actor('labScreens', P.labScreens, [{ ...ROW, lift: 0 }, { ...ROW, lift: 1 }, { ...ROW, lift: -1.5 }], ['#1C2A33', '#1C2A33', '#1C2A33'], { outline: false }),
  actor('labChairs', P.labChairs, [{ ...ROW, x: 1.05, lift: 0 }, { ...ROW, x: 1.05, lift: 1 }, { ...ROW, x: 1.05, lift: -1.5 }], ['#4A5560', '#4A5560', '#4A5560']),
  actor('labKeyboards', P.labKeyboards, [{ ...ROW, lift: 0 }, { ...ROW, lift: 1 }, { ...ROW, lift: -1.5 }], W2, { vc: true, outline: false }),
  actor('tower', P.tower, [{ x: -0.42, y: -0.5, z: -1.5, scale: 0.001 }, { x: -0.42, y: 0, z: -1.5, scale: 1 }, { x: -0.42, y: SUNK, z: -1.5, scale: 0.001 }], W2, { vc: true }),

  // San Francisco: hidden under the floor until the room opens up
  actor('sky', P.sky, [{ r: 0.001, y: -1 }, { r: 0.001, y: -1 }, { r: 320, y: 0 }], W2, { shade: 'flat', tex: 'tex', outline: false }),
  actor('sun', P.sun, [{ x: 0, y: -1, z: 0, r: 0.001 }, { x: 0, y: -1, z: 0, r: 0.001 }, { x: 70, y: 95, z: -230, r: 9 }], W2, { shade: 'flat', vc: true, outline: false }),
  actor('clouds', P.clouds, [{ y: -1, scale: 0.001 }, { y: -1, scale: 0.001 }, { y: 60, scale: 1 }], W2, { shade: 'flat', vc: true, outline: false }),
  actor('water', P.water, [{ y: -1, size: 0.001, zc: 0 }, { y: -1, size: 0.001, zc: 0 }, { y: -1.6, size: 400, zc: -100 }], W2, { shade: 'flat', vc: true, outline: false }),
  actor('hills', P.hills, [{ z: -1, scale: 0.001 }, { z: -1, scale: 0.001 }, { z: -250, scale: 1 }], W2, { vc: true, outline: false }),
  actor('bridge', P.bridge, [{ x: 0, y: -2, z: -3, scale: 0.001 }, { x: 0, y: -2, z: -3, scale: 0.001 }, { x: -10, y: -1.6, z: -150, scale: 1 }], W2, { vc: true }),
  actor('boats', P.boats, [{ y: -1, scale: 0.001 }, { y: -1, scale: 0.001 }, { y: -1.6, scale: 1 }], W2, { vc: true }),
  actor('palmL', P.palm, [{ x: -10, z: -18, h: 7, scale: 0.001 }, { x: -10, z: -18, h: 7, scale: 0.001 }, { x: -10, z: -18, h: 7, scale: 1 }], W2, { vc: true }),
  actor('palmR', P.palm, [{ x: 8, z: -9, h: 6, scale: 0.001 }, { x: 8, z: -9, h: 6, scale: 0.001 }, { x: 8, z: -9, h: 6, scale: 1 }], W2, { vc: true }),
  actor('lamp', P.lamp, [{ x: -4.6, z: -7, h: 4, scale: 0.001 }, { x: -4.6, z: -7, h: 4, scale: 0.001 }, { x: -4.6, z: -7, h: 4, scale: 1 }], W2, { vc: true }),
  actor('signBoard', P.signBoard, [{ x: 3.6, y: 1.5, z: -3.2, w: 4.4, h: 2.1, scale: 0.001 }, { x: 3.6, y: 1.5, z: -3.2, w: 4.4, h: 2.1, scale: 0.001 }, { x: 3.6, y: 1.5, z: -3.2, w: 4.4, h: 2.1, scale: 1 }], W2, { vc: true }),
  actor('sign', P.face, [{ x: 3.6, y: 1.5, z: -3.2, w: 0.001, h: 0.001 }, { x: 3.6, y: 1.5, z: -3.2, w: 0.001, h: 0.001 }, { x: 3.6, y: 1.5, z: -3.2 + 0.002, w: 4.4, h: 2.1 }], W2, { shade: 'flat', tex: 'tex', outline: false }),
  actor('hedge', P.hedge, [{ x: 3.6, z: -2.2, w: 5, scale: 0.001 }, { x: 3.6, z: -2.2, w: 5, scale: 0.001 }, { x: 3.6, z: -2.2, w: 5, scale: 1 }], W2, { vc: true }),

  ...PARTS.map((part): Actor => ({
    id: `figure-${part}`,
    keys: [kid[part].pos, tween[part].pos, teen[part].pos],
    uv: kid[part].uv,
    col: kid[part].col,
    colors: partColors[part],
    shade: 'toon',
    tex: part === 'shirt' ? 'mix' : part === 'badge' ? 'tex' : undefined,
    vc: part === 'held',
    outline: part !== 'badge' && part !== 'lanyard' && part !== 'glasses',
  })),
];
