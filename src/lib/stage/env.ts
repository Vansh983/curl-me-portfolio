// The light in each place, as data. Three things come out of one spec: the analytic lights
// (a sun that casts, a hemisphere, two shadowless fills), the fog, and a small scene of
// emissive panels that is convolved into an environment map so every material has something
// real to reflect. The specs blend, so the light travels with the camera instead of cutting:
// the room's warm dusk cools into fluorescent, then opens onto the bay at midday.
import type { V3 } from './rig.ts';

export interface Panel {
  at: V3;
  size: V3;
  color: string;
  power: number;
}
export interface Dir {
  from: V3; // offset from the subject: the light is placed there and aimed at him
  color: string;
  power: number;
}
export interface EnvSpec {
  dome: string; // what the environment scene sits inside
  exposure: number;
  envPower: number; // scene.environmentIntensity
  hemi: { sky: string; ground: string; power: number };
  sun: Dir & { shadow: number };
  fills: [Dir, Dir];
  fog: { color: string; near: number; far: number };
  panels: [Panel, Panel, Panel, Panel]; // the emitters the environment map is made of
}

export const ENVS: EnvSpec[] = [
  // 2010, Delhi, late afternoon. One window doing nearly all the work, the ceiling and the
  // floor throwing it back warm, and the television putting a cold patch on everything near it.
  {
    dome: '#3A3226',
    exposure: 1.05,
    envPower: 0.95,
    hemi: { sky: '#FFE8CC', ground: '#7A6448', power: 0.42 },
    sun: { from: [-2.5, 9, 3.5], color: '#FFC98A', power: 1.8, shadow: 0.34 },
    fills: [
      { from: [-6, 3, 4], color: '#FFCF9E', power: 0.55 },
      { from: [0, 0.3, -2.2], color: '#8FC0F5', power: 0.4 },
    ],
    fog: { color: '#F0DCC2', near: 34, far: 420 },
    panels: [
      { at: [-1.05, 1.62, -2.28], size: [1.3, 1.4, 0.06], color: '#FFB477', power: 9 },
      { at: [0, 2.78, 0.5], size: [4.2, 0.06, 5.2], color: '#FFF1DD', power: 0.55 },
      { at: [0, 0.02, 0.5], size: [4.2, 0.06, 5.2], color: '#C9A275', power: 0.45 },
      { at: [0, 0.83, -1.44], size: [1.05, 0.62, 0.06], color: '#6FA8DC', power: 2.2 },
    ],
  },
  // 2013, the school lab. Tube light: even, cold, and flat, with a strip of daylight up high.
  {
    dome: '#3D4348',
    exposure: 0.88,
    envPower: 0.95,
    hemi: { sky: '#DCEBFA', ground: '#6F7A82', power: 0.55 },
    sun: { from: [-2.2, 9, 3.2], color: '#EAF2FF', power: 1.2, shadow: 0.26 },
    fills: [
      { from: [0, 4, 0.2], color: '#F2F7FF', power: 0.6 },
      { from: [-5, 3, -1], color: '#CFE6FF', power: 0.4 },
    ],
    fog: { color: '#E4EEF4', near: 36, far: 430 },
    panels: [
      { at: [-0.9, 2.34, -2.28], size: [2.4, 0.5, 0.06], color: '#CFE6FF', power: 7 },
      { at: [0, 2.76, -0.6], size: [3.2, 0.06, 0.18], color: '#F2F7FF', power: 8 },
      { at: [0, 2.78, 0.5], size: [4.2, 0.06, 5.2], color: '#EDF2F6', power: 0.6 },
      { at: [0, 0.02, 0.5], size: [4.2, 0.06, 5.2], color: '#B9BFC4', power: 0.4 },
    ],
  },
  // 2018, the bay. The sun is low over the water behind him, so he is rimmed, and the light
  // that fills his face is the sky and the concrete plaza throwing it back.
  {
    dome: '#8FC3E8',
    exposure: 0.8,
    envPower: 0.85,
    hemi: { sky: '#BFE0F7', ground: '#9E9384', power: 0.5 },
    sun: { from: [3.4, 4.7, -11.5], color: '#FFF3DC', power: 2.3, shadow: 0.42 },
    fills: [
      { from: [-2, 3, 10], color: '#FFF6E6', power: 0.6 },
      { from: [4, 1, -6], color: '#9CC6E0', power: 0.25 },
    ],
    fog: { color: '#D6E6EF', near: 110, far: 640 },
    panels: [
      { at: [0, 14, 0], size: [44, 0.06, 44], color: '#BFDFF5', power: 1.0 },
      { at: [4, 9, -14], size: [3.2, 3.2, 3.2], color: '#FFF6E0', power: 8 },
      { at: [0, 0.02, 0], size: [44, 0.06, 44], color: '#CFC8BC', power: 0.4 },
      { at: [0, -1, -26], size: [64, 0.06, 44], color: '#8FB6CF', power: 0.55 },
    ],
  },
];

const hex = (c: string): [number, number, number] => {
  const v = parseInt(c.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
const pad = (n: number) => n.toString(16).padStart(2, '0');
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Blends two colours through their linear values, so a warm-to-cold cut never dips through mud. */
export function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hex(a);
  const [br, bg, bb] = hex(b);
  const ch = (x: number, y: number) => {
    const lin = lerp((x / 255) ** 2.2, (y / 255) ** 2.2, t);
    return pad(Math.max(0, Math.min(255, Math.round(lin ** (1 / 2.2) * 255))));
  };
  return `#${ch(ar, br)}${ch(ag, bg)}${ch(ab, bb)}`;
}

const mixV3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const mixDir = <D extends Dir>(a: D, b: D, t: number): D => ({
  ...a,
  from: mixV3(a.from, b.from, t),
  color: mixHex(a.color, b.color, t),
  power: lerp(a.power, b.power, t),
});
const mixPanel = (a: Panel, b: Panel, t: number): Panel => ({
  at: mixV3(a.at, b.at, t),
  size: mixV3(a.size, b.size, t),
  color: mixHex(a.color, b.color, t),
  power: lerp(a.power, b.power, t),
});

/** The light between two stations. Every number and colour moves, so nothing about the light cuts. */
export function blendEnv(a: EnvSpec, b: EnvSpec, t: number): EnvSpec {
  const p = (i: number) => mixPanel(a.panels[i], b.panels[i], t);
  return {
    dome: mixHex(a.dome, b.dome, t),
    exposure: lerp(a.exposure, b.exposure, t),
    envPower: lerp(a.envPower, b.envPower, t),
    hemi: {
      sky: mixHex(a.hemi.sky, b.hemi.sky, t),
      ground: mixHex(a.hemi.ground, b.hemi.ground, t),
      power: lerp(a.hemi.power, b.hemi.power, t),
    },
    sun: { ...mixDir(a.sun, b.sun, t), shadow: lerp(a.sun.shadow, b.sun.shadow, t) },
    fills: [mixDir(a.fills[0], b.fills[0], t), mixDir(a.fills[1], b.fills[1], t)],
    fog: {
      color: mixHex(a.fog.color, b.fog.color, t),
      near: lerp(a.fog.near, b.fog.near, t),
      far: lerp(a.fog.far, b.fog.far, t),
    },
    panels: [p(0), p(1), p(2), p(3)],
  };
}

/** The light at a point in the story: station i, a fraction t of the way to the next. */
export function envAt(i: number, t: number): EnvSpec {
  const a = ENVS[Math.min(i, ENVS.length - 1)];
  const b = ENVS[Math.min(i + 1, ENVS.length - 1)];
  return a === b ? a : blendEnv(a, b, t);
}
