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
  // now: from the bedroom window, out through the bedroom door, across the living room past the desk
  // and the kitchen, to the front door. A person walks: eye at 1.6, always forward, the head turning to
  // what is worth a look. fov is the horizontal field, wide as eyes are: a laptop screen shows the whole
  // room, not a corner of it
  { q: 0.0, cam: [-12.2, 1.6, -0.45], look: [-11.94, 1.32, -3.44], fov: 78, set: 0 }, // the bedroom's north-west corner: the bed, the dresser, the glass with the CN Tower 560 m off
  { q: 0.04, cam: [-11.6, 1.6, -0.45], look: [-10.0, 1.4, -2.4], fov: 74, set: 0 }, // along the bed to the door wall
  { q: 0.07, cam: [-10.6, 1.6, -0.5], look: [-8.7, 1.45, -1.2], fov: 72, set: 0 }, // the bedroom door
  { q: 0.095, cam: [-9.4, 1.6, -0.6], look: [-7.2, 1.4, -0.3], fov: 70, set: 0 }, // through it: the living room, the glass, the sofa
  { q: 0.12, cam: [-8.2, 1.6, -0.9], look: [-5.4, 1.2, -1.8], fov: 66, set: 0 }, // the armchair by the glass, the desk beyond
  { q: 0.14, cam: [-7.15, 1.58, -0.8], look: [-4.5, 1.2, -0.9], fov: 64, set: 0 }, // the desk, the television on the brick
  { q: 0.158, cam: [-6.7, 1.58, -0.4], look: [-4.9, 1.35, 0.55], fov: 64, set: 0 }, // turning left to the hall: the kitchen on the left
  { q: 0.178, cam: [-6.2, 1.58, 0.3], look: [-5.15, 1.4, 1.8], fov: 64, set: 0 }, // the front door ahead in the north wall
  { q: 0.198, cam: [-5.7, 1.58, 1.1], look: [-5.4, 1.45, 3.0], fov: 66, set: 0 },
  { q: 0.22, cam: [-5.45, 1.58, 2.3], look: [-5.45, 1.5, 4.5], fov: 68, set: 0, blend: 0 }, // door jamb, heading north
  { q: 0.252, cam: [-5.45, 1.58, 3.35], look: [-5.45, 1.5, 5.5], fov: 68, set: 1, blend: 1 }, // mid passage
  // 2010: in through the south door, up the east side of the room, the television and the Xbox on the floor
  // to the left, the shelf and the poster on the far wall, then right, east, out to the lab
  { q: 0.29, cam: [-5.45, 1.58, 4.9], look: [-7.5, 1.0, 6.8], fov: 64, set: 1 }, // into the room: the TV on the floor, the Xbox
  { q: 0.333, cam: [-5.45, 1.58, 5.6], look: [-8.6, 0.7, 6.9], fov: 62, set: 1 },
  { q: 0.375, cam: [-5.45, 1.58, 5.9], look: [-7.35, 1.1, 8.2], fov: 62, set: 1 }, // the shelf of figures, the poster
  { q: 0.41, cam: [-5.45, 1.58, 6.3], look: [-5.63, 1.3, 8.3], fov: 62, set: 1 }, // the far wall
  { q: 0.445, cam: [-5.4, 1.58, 6.5], look: [-4.25, 1.4, 8.14], fov: 64, set: 1 }, // turning right
  { q: 0.475, cam: [-5.2, 1.58, 6.6], look: [-3.3, 1.45, 7.28], fov: 64, set: 1 }, // the door east
  { q: 0.513, cam: [-4.85, 1.58, 6.6], look: [-3.0, 1.5, 6.6], fov: 68, set: 1, blend: 0 }, // door jamb, heading east
  { q: 0.547, cam: [-4.05, 1.58, 6.6], look: [-2.0, 1.5, 6.7], fov: 68, set: 2, blend: 1 }, // mid passage
  // 2013: in from the west, down the aisle between the benches, the long bench and its stations on the
  // left, Notepad on the second, then right, south, out to the plaza
  { q: 0.58, cam: [-2.65, 1.58, 6.9], look: [-0.55, 1.0, 9.2], fov: 64, set: 2 }, // into the lab: the long bench, the stations
  { q: 0.625, cam: [-1.85, 1.58, 7.2], look: [-1.1, 0.95, 9.4], fov: 60, set: 2 }, // over the second station: Notepad
  { q: 0.657, cam: [-1.35, 1.58, 7.15], look: [0.5, 1.1, 8.7], fov: 62, set: 2 }, // along the bench
  { q: 0.68, cam: [-0.85, 1.58, 7.05], look: [1.3, 1.2, 7.4], fov: 62, set: 2 },
  { q: 0.70, cam: [-0.3, 1.58, 6.85], look: [1.6, 1.25, 6.2], fov: 62, set: 2 }, // turning right
  { q: 0.735, cam: [0.9, 1.58, 5.6], look: [1.4, 1.3, 3.6], fov: 64, set: 2 }, // the door south
  { q: 0.76, cam: [1.4, 1.58, 4.75], look: [1.4, 1.5, 2.8], fov: 68, set: 2, blend: 0 }, // door jamb, heading south
  { q: 0.785, cam: [1.4, 1.6, 3.65], look: [1.4, 1.5, 1.4], fov: 68, set: 3, blend: 1 }, // mid passage, daylight ahead
  // 2018: out onto the Embarcadero heading south, the sign and the trophy ahead, the bridge over the bay to
  // the left; then right, west, to the brick door back into the apartment
  { q: 0.815, cam: [1.45, 1.6, 2.0], look: [2.45, 1.5, 0.27], fov: 68, set: 3 }, // just outside
  { q: 0.845, cam: [1.8, 1.62, 0.7], look: [2.78, 1.4, -1.6], fov: 64, set: 3 }, // the sign comes round
  { q: 0.875, cam: [2.0, 1.62, -0.4], look: [2.35, 1.55, -2.37], fov: 68, set: 3 }, // the sign, the trophy, the road and the bridge behind
  { q: 0.90, cam: [1.05, 1.6, 0.1], look: [0.37, 1.5, -1.78], fov: 66, set: 3 }, // turning right, west
  { q: 0.927, cam: [-0.1, 1.6, 0.65], look: [-1.74, 1.5, -0.5], fov: 66, set: 3 }, // the brick of home
  { q: 0.95, cam: [-1.25, 1.6, 1.25], look: [-3.25, 1.5, 1.32], fov: 66, set: 3 }, // the door
  { q: 0.97, cam: [-2.3, 1.58, 1.6], look: [-4.3, 1.5, 1.6], fov: 68, set: 3, blend: 0 }, // door jamb, heading west
  { q: 0.987, cam: [-3.2, 1.58, 1.6], look: [-5.2, 1.45, 1.3], fov: 68, set: 0, blend: 1 }, // mid passage: the living room, night again
  { q: 1.0, cam: [-3.85, 1.58, 1.58], look: [-6.1, 1.3, 0.5], fov: 72, set: 0 }, // home: the living room, the desk, the glass, the city
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
