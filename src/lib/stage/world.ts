// The whole world as data: camera stations and actors with their params per station.
// Station 0 is the 2010 Delhi bedroom, station 1 the 2013 school computer lab.
import { figure, KID, TEEN, PARTS, type Part } from './figure3d.ts';
import * as P from './props.ts';
import type { V3 } from './rig.ts';

export type Station = { cam: V3; look: V3; fov: number }; // fov horizontal, degrees
export type Actor = {
  id: string;
  keys: Float32Array[]; // built positions at each station
  colors: string[]; // hex per station
  kind: 'toon' | 'flat' | 'screen' | 'poster';
  outline: boolean;
  at?: V3; // mesh position for rigs built at the origin (the fan)
};

// back wall at z = -2.3, floor runs to z = 4.1 so the camera never sees the front edge
export const ROOM = { w: 4.4, h: 2.8, d: 6.4, zc: 0.9 };
const BACK = ROOM.zc - ROOM.d / 2;

export const STATIONS: Station[] = [
  { cam: [0.45, 1.4, 3.0], look: [0, 0.85, -1.2], fov: 70 },
  { cam: [-1.15, 1.75, 1.25], look: [0.2, 0.9, -1.5], fov: 60 },
];

const actor = <T>(id: string, rig: (p: T) => Float32Array, keys: T[], colors: string[], kind: Actor['kind'] = 'toon', outline = true, at?: V3): Actor => ({
  id, keys: keys.map(rig), colors, kind, outline, at,
});

const kid = figure(KID), teen = figure(TEEN);
const partColors: Record<Part, [string, string]> = {
  skin: ['#F1C7A3', '#F1C7A3'],
  hair: ['#2B2B2B', '#2B2B2B'],
  shirt: ['#245EDC', '#FFFFFF'],
  legs: ['#6E5238', '#2B2B2B'],
  tie: ['#004D98', '#004D98'],
};

export const ACTORS: Actor[] = [
  actor('floor', P.floor, [ROOM, ROOM], ['#D9B994', '#C9CFD3'], 'flat', false),
  actor('walls', P.walls, [ROOM, ROOM], ['#F9F4EC', '#E9EEF2'], 'flat', false),
  actor('ceiling', P.ceiling, [ROOM, ROOM], ['#FFFFFF', '#F5F9FC'], 'flat', false),
  // window becomes the whiteboard, on the left wall
  actor('panel', P.panel, [
    { x: -ROOM.w / 2 + 0.01, y: 1.55, z: -0.6, w: 1.1, h: 1.1, t: 0.02, yaw: Math.PI / 2 },
    { x: -ROOM.w / 2 + 0.01, y: 1.45, z: -0.8, w: 1.8, h: 1.1, t: 0.02, yaw: Math.PI / 2 },
  ], ['#BFE3F5', '#FFFFFF']),
  // cabinet under the TV becomes the lab desk
  actor('table', P.table, [
    { x: 0, y: 0, z: -1.7, w: 1.3, h: 0.45, d: 0.55, top: 0.04 },
    { x: 0.1, y: 0, z: -1.5, w: 1.4, h: 0.72, d: 0.7, top: 0.04 },
  ], ['#6E5238', '#C8B79B']),
  // TV becomes the beige CRT monitor
  actor('screenBody', P.screenBody, [
    { x: 0, y: 0.45 + 0.375, z: -1.7, w: 1.2, h: 0.75, d: 0.5, standW: 0.001, standH: 0.001, standD: 0.001 },
    { x: 0.1, y: 0.72 + 0.06 + 0.21, z: -1.5, w: 0.45, h: 0.42, d: 0.45, standW: 0.3, standH: 0.06, standD: 0.3 },
  ], ['#2B2B2B', '#E5DCC5']),
  actor('screen', P.face, [
    { x: 0, y: 0.45 + 0.375, z: -1.7 + 0.25 + 0.003, w: 1.0, h: 0.6 },
    { x: 0.1, y: 0.72 + 0.06 + 0.21, z: -1.5 + 0.225 + 0.003, w: 0.36, h: 0.32 },
  ], ['#101815', '#F4F4F2'], 'screen', false),
  actor('seat', P.seat, [
    { x: 0, z: 0.55, rugR: 0.9, rugT: 0.012, seatW: 0.001, seatD: 0.001, seatH: 0.002, seatT: 0.001, legR: 0.001, backH: 0.001, yOff: -0.3 },
    { x: 0.05, z: -0.75, rugR: 0.001, rugT: 0.001, seatW: 0.46, seatD: 0.46, seatH: 0.45, seatT: 0.04, legR: 0.02, backH: 0.42, yOff: 0 },
  ], ['#B94A48', '#4A5560']),
  actor('fan', P.fan, [{ rod: 0.55, r: 0.6, hub: 0.08 }, { rod: 0.55, r: 0.6, hub: 0.08 }], ['#9A9A96', '#9A9A96'], 'toon', true, [0, ROOM.h, -0.4]),
  actor('poster', P.face, [
    { x: 0.95, y: 1.75, z: BACK + 0.01, w: 0.42, h: 0.58 },
    { x: 0.95, y: 1.75, z: BACK + 0.01, w: 0.001, h: 0.001 },
  ], ['#FFFFFF', '#FFFFFF'], 'poster', false),
  actor('shelf', P.shelf, [{ x: 1.35, y: 0.95, z: -2.1, w: 0.9, scale: 1 }, { x: 1.35, y: -0.6, z: -2.1, w: 0.9, scale: 0.001 }], ['#8B6B4A', '#8B6B4A']),
  actor('xbox', P.crate, [{ x: 0.78, y: 0.05, z: -1.45, w: 0.31, h: 0.08, d: 0.26 }, { x: 0.78, y: -0.5, z: -1.45, w: 0.001, h: 0.001, d: 0.001 }], ['#F4F4F2', '#F4F4F2']),
  actor('ball', P.ball, [{ x: -0.95, y: 0.11, z: 0.25, r: 0.11 }, { x: -0.95, y: -0.5, z: 0.25, r: 0.001 }], ['#FFFFFF', '#FFFFFF']),
  actor('labRow', P.labRow, [{ x: 1.65, z0: -1.4, gap: 0.85, lift: 0 }, { x: 1.65, z0: -1.4, gap: 0.85, lift: 1 }], ['#C8B79B', '#C8B79B']),
  actor('labScreens', P.labScreens, [{ x: 1.65, z0: -1.4, gap: 0.85, lift: 0 }, { x: 1.65, z0: -1.4, gap: 0.85, lift: 1 }], ['#1C2A33', '#1C2A33'], 'toon', false),
  ...PARTS.map((part) => ({ id: `figure-${part}`, keys: [kid[part], teen[part]], colors: partColors[part], kind: 'toon' as const, outline: true })),
];
