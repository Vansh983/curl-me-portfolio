// The camera path, as data, and the function from stage progress to a frame. Pure.
//
// One dolly runs through the three sets. Keys carry a stage progress q; between two keys the
// curve parameter is linear in q, so the spacing of keys sets the speed. A pair of keys marked
// blend 0 and blend 1 is a doorway: inside it the light dips, and at the halfway point the set
// (environment, sky, sun, fog, exposure) is swapped while the frame is all door jamb.
import { CatmullRomCurve3, Vector3 } from 'three';
import type { V3 } from './sets.ts';

export interface DollyKey { q: number; cam: V3; look: V3; fov: number; set: number; blend?: 0 | 1 }
export interface Frame { q: number; set: number; blend: number; cam: V3; look: V3; fov: number; envDip: number }

export const DOLLY: DollyKey[] = [
  { q: 0.0, cam: [0.3, 1.15, 2.1], look: [0, 0.95, -2.3], fov: 46, set: 0 }, // the room, the TV
  { q: 0.2, cam: [1.4, 1.2, 1.7], look: [2.6, 1.2, 1.6], fov: 50, set: 0 }, // turning to the door
  { q: 0.27, cam: [2.6, 1.2, 1.6], look: [4.5, 1.2, 1.6], fov: 54, set: 0, blend: 0 }, // door jamb
  { q: 0.32, cam: [3.7, 1.2, 1.6], look: [5.6, 1.2, 1.6], fov: 54, set: 1, blend: 1 }, // mid passage
  { q: 0.38, cam: [5.4, 1.25, 1.6], look: [7.5, 1.1, 0.4], fov: 50, set: 1 }, // into the lab
  { q: 0.5, cam: [6.6, 1.35, 2.6], look: [8.2, 1.0, 0.6], fov: 46, set: 1 }, // over the desk, the CRT
  { q: 0.7, cam: [9.5, 1.3, 2.8], look: [12.4, 1.2, 3.4], fov: 50, set: 1 }, // to the far door
  { q: 0.77, cam: [12.1, 1.3, 3.4], look: [14, 1.3, 3.4], fov: 54, set: 1, blend: 0 }, // door jamb
  { q: 0.82, cam: [13.4, 1.35, 3.4], look: [16, 1.4, 1.5], fov: 54, set: 2, blend: 1 }, // just outside
  { q: 1.0, cam: [16.5, 1.6, 6.5], look: [24, 1.6, -12], fov: 48, set: 2 }, // the plaza, the sign, the bridge
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
    let set = a.set, blend = 0, envDip = 1;
    for (const [s, e] of windows) {
      if (q < keys[s].q || q > keys[e].q) continue;
      blend = clamp01((q - keys[s].q) / (keys[e].q - keys[s].q));
      set = blend < 0.5 ? keys[s].set : keys[e].set;
      envDip = 1 - 0.88 * Math.sin(Math.PI * blend);
    }
    return {
      q, set, blend, envDip,
      cam: cam.getPoint(u).toArray() as V3,
      look: look.getPoint(u).toArray() as V3,
      fov: a.fov + (b.fov - a.fov) * f,
    };
  };
}
