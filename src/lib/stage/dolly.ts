// The camera path, as data, and the function from stage progress to a frame. Pure.
//
// One dolly runs through the four sets. Keys carry a stage progress q; between two keys the
// curve parameter is linear in q, so the spacing of keys sets the speed. A pair of keys marked
// blend 0 and blend 1 is a doorway: inside it the light dips, and at the halfway point the set
// (environment, sky, sun, fog, exposure) is swapped while the frame is all door jamb.
import { CatmullRomCurve3, Vector3 } from 'three';
import type { V3 } from './sets.ts';

export interface DollyKey { q: number; cam: V3; look: V3; fov: number; set: number; blend?: 0 | 1 }
/** `from` and `into` are the sets a doorway joins; outside a doorway both equal `set`. */
export interface Frame { q: number; set: number; from: number; into: number; blend: number; cam: V3; look: V3; fov: number; envDip: number }

export const DOLLY: DollyKey[] = [
  // now: the whole room from the far corner by the shelves; the desk on the right, the bed under the window on the left
  { q: 0.0, cam: [-7.85, 1.6, 2.0], look: [-6.0, 1.75, -0.9], fov: 60, set: 0 }, // level and a touch up: the skyline low in the glass, sky and the CN Tower above
  { q: 0.05, cam: [-8.0, 1.55, 1.85], look: [-6.3, 1.75, -1.4], fov: 56, set: 0 },
  { q: 0.11, cam: [-6.9, 1.45, 1.9], look: [-5.6, 1.55, -0.4], fov: 52, set: 0 }, // the desk from the corner
  { q: 0.15, cam: [-6.2, 1.4, 1.95], look: [-4.3, 1.25, 1.45], fov: 50, set: 0 }, // turning to the door, clear of the hutch
  { q: 0.19, cam: [-5.0, 1.25, 1.75], look: [-3.6, 1.2, 1.6], fov: 50, set: 0 },
  { q: 0.21, cam: [-4.1, 1.2, 1.6], look: [-2.6, 1.2, 1.6], fov: 54, set: 0, blend: 0 }, // door jamb
  { q: 0.25, cam: [-3.3, 1.2, 1.6], look: [-1.6, 1.2, 1.5], fov: 54, set: 1, blend: 1 }, // mid passage
  { q: 0.29, cam: [-1.7, 1.2, 1.65], look: [-0.6, 1.0, -0.6], fov: 50, set: 1 }, // into the 2010 room
  { q: 0.333, cam: [0.2, 1.4, 1.6], look: [-0.6, 0.7, -1.7], fov: 48, set: 1 }, // the room from the door corner: the pouf, the TV
  { q: 0.40, cam: [-0.9, 1.3, 1.5], look: [0.5, 1.1, -1.5], fov: 48, set: 1 }, // the shelf and the poster, before the turn to the door
  { q: 0.467, cam: [0.0, 1.2, 1.65], look: [1.4, 1.2, 1.6], fov: 50, set: 1 }, // turning to the door
  { q: 0.513, cam: [1.1, 1.2, 1.6], look: [3.0, 1.2, 1.6], fov: 54, set: 1, blend: 0 }, // door jamb
  { q: 0.547, cam: [2.1, 1.2, 1.6], look: [4.0, 1.2, 1.6], fov: 54, set: 2, blend: 1 }, // mid passage
  { q: 0.587, cam: [3.6, 1.4, 2.3], look: [5.4, 1.05, 0.4], fov: 50, set: 2 }, // into the lab
  { q: 0.667, cam: [3.5, 1.5, 2.2], look: [4.4, 0.95, 0.2], fov: 46, set: 2 }, // over the front left desk: Notepad
  { q: 0.8, cam: [5.9, 1.3, 2.4], look: [8.4, 1.2, 2.6], fov: 50, set: 2 }, // to the far door
  { q: 0.85, cam: [8.1, 1.3, 2.6], look: [10, 1.3, 2.6], fov: 54, set: 2, blend: 0 }, // door jamb
  { q: 0.885, cam: [9.4, 1.35, 2.6], look: [12, 1.4, 0.7], fov: 54, set: 3, blend: 1 }, // just outside
  { q: 0.94, cam: [11.0, 1.45, 1.8], look: [15.5, 1.3, -0.4], fov: 50, set: 3 }, // the sign comes round
  { q: 1.0, cam: [11.9, 1.45, 1.6], look: [16.8, 1.55, -0.3], fov: 54, set: 3 }, // the sign, the trophy, the road and the bridge behind
];

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

export function makeDolly(keys: DollyKey[]): (q: number) => Frame {
  const n = keys.length;
  const cam = new CatmullRomCurve3(keys.map((k) => new Vector3(...k.cam)), false, 'centripetal');
  const look = new CatmullRomCurve3(keys.map((k) => new Vector3(...k.look)), false, 'centripetal');
  const windows: [number, number][] = [];
  for (let k = 0; k < n; k++) {
    if (keys[k].blend !== 0) continue;
    for (let j = k + 1; j < n; j++) if (keys[j].blend === 1) { windows.push([k, j]); break; }
  }
  return (qIn) => {
    const q = clamp01(qIn);
    let k = 0;
    while (k < n - 2 && q >= keys[k + 1].q) k++;
    const a = keys[k], b = keys[k + 1];
    const f = clamp01((q - a.q) / (b.q - a.q));
    const u = (k + f) / (n - 1);
    let set = a.set, from = a.set, into = a.set, blend = 0, envDip = 1;
    for (const [s, e] of windows) {
      if (q < keys[s].q || q > keys[e].q) continue;
      blend = clamp01((q - keys[s].q) / (keys[e].q - keys[s].q));
      from = keys[s].set; into = keys[e].set;
      set = blend < 0.5 ? from : into;
      envDip = 1 - 0.88 * Math.sin(Math.PI * blend);
    }
    return {
      q, set, from, into, blend, envDip,
      cam: cam.getPoint(u).toArray() as V3,
      look: look.getPoint(u).toArray() as V3,
      fov: a.fov + (b.fov - a.fov) * f,
    };
  };
}
