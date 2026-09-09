// The camera path, as data, and the function from stage progress to a frame. Pure.
//
// One dolly runs through seven sets, with one phone-covered portal. Keys carry a stage progress q; between two keys the
// curve parameter is linear in q, so the spacing of keys sets the speed. A pair of keys marked
// blend 0 and blend 1 is a doorway: inside it the light dips, and at the halfway point the set
// (environment, sky, sun, fog, exposure) is swapped while the frame is all door jamb.
import { CatmullRomCurve3, Vector3 } from 'three';
import { AUDITORIUM, LECTURE_ROWS, TOP_ROW, DAIS, aisleHeight, type V3 } from './sets.ts';
import { CLASSROOM_VIEW, WINDOW_VIEW, PHONE, FLIGHT } from './flight.ts';

export interface DollyKey { q: number; cam: V3; look: V3; fov: number; set: number; blend?: 0 | 1; portal?: true }
/** `from` and `into` are the sets a doorway joins; outside a doorway both equal `set`. */
export interface Frame { q: number; set: number; from: number; into: number; blend: number; cam: V3; look: V3; fov: number; envDip: number }

const APPROACH: DollyKey[] = [
  // now: from the north-west corner of the studio, a turn on the spot to the front door and straight out. A person
  // walks: eye at 1.6, always forward, the head turning to what is worth a look. fov is the horizontal field, wide
  // as eyes are: a laptop screen shows the whole room, not a corner of it
  { q: 0.0, cam: [-8.8, 1.6, 1.5], look: [-7.1, 1.95, -2.14], fov: 78, set: 0 }, // the bed under the hero, the glass with the CN Tower to its tip, the desk on the right
  { q: 0.046, cam: [-8.8, 1.6, 1.5], look: [-5.45, 1.5, 2.1], fov: 72, set: 0 }, // turned on the spot: the front door
  { q: 0.091, cam: [-7.2, 1.6, 1.3], look: [-5.5, 1.45, 2.0], fov: 70, set: 0 }, // straight to it
  { q: 0.137, cam: [-5.9, 1.58, 1.4], look: [-5.45, 1.45, 3.0], fov: 68, set: 0 },
  { q: 0.167, cam: [-5.45, 1.58, 2.3], look: [-5.45, 1.5, 4.5], fov: 68, set: 0, blend: 0 }, // door jamb, heading north
  { q: 0.192, cam: [-5.45, 1.58, 3.35], look: [-5.45, 1.5, 5.5], fov: 68, set: 1, blend: 1 }, // mid passage
  // 2010: in through the south door, up the east side of the room, the television and the Xbox on the floor
  // to the left, the shelf and the poster on the far wall, then right, east, out to the lab
  { q: 0.22, cam: [-5.45, 1.58, 4.9], look: [-7.5, 1.0, 6.8], fov: 64, set: 1 }, // into the room: the TV on the floor, the Xbox
  { q: 0.253, cam: [-5.45, 1.58, 5.6], look: [-8.6, 0.7, 6.9], fov: 62, set: 1 },
  { q: 0.285, cam: [-5.45, 1.58, 5.9], look: [-7.35, 1.1, 8.2], fov: 62, set: 1 }, // the shelf of figures, the poster
  { q: 0.312, cam: [-5.45, 1.58, 6.3], look: [-5.63, 1.3, 8.3], fov: 62, set: 1 }, // the far wall
  { q: 0.338, cam: [-5.4, 1.58, 6.5], look: [-4.25, 1.4, 8.14], fov: 64, set: 1 }, // turning right
  { q: 0.361, cam: [-5.2, 1.58, 6.6], look: [-3.3, 1.45, 7.28], fov: 64, set: 1 }, // the door east
  { q: 0.39, cam: [-4.85, 1.58, 6.6], look: [-3.0, 1.5, 6.6], fov: 68, set: 1, blend: 0 }, // door jamb, heading east
  { q: 0.416, cam: [-4.05, 1.58, 6.6], look: [-2.0, 1.5, 6.7], fov: 68, set: 2, blend: 1 }, // mid passage
  // 2013: in from the west, down the aisle between the benches, the long bench and its stations on the
  // left, Notepad on the second, then right, south, out to the plaza
  { q: 0.441, cam: [-2.65, 1.58, 6.9], look: [-0.55, 1.0, 9.2], fov: 64, set: 2 }, // into the lab: the long bench, the stations
  { q: 0.475, cam: [-1.85, 1.58, 7.2], look: [-1.1, 0.95, 9.4], fov: 60, set: 2 }, // over the second station: Notepad
  { q: 0.499, cam: [-1.35, 1.58, 7.15], look: [0.5, 1.1, 8.7], fov: 62, set: 2 }, // along the bench
  { q: 0.517, cam: [-0.85, 1.58, 7.05], look: [1.3, 1.2, 7.4], fov: 62, set: 2 },
  { q: 0.532, cam: [-0.3, 1.58, 6.85], look: [1.6, 1.25, 6.2], fov: 62, set: 2 }, // turning right
  { q: 0.559, cam: [0.9, 1.58, 5.6], look: [1.4, 1.3, 3.6], fov: 64, set: 2 }, // the door south
  { q: 0.578, cam: [1.4, 1.58, 4.75], look: [1.4, 1.5, 2.8], fov: 68, set: 2, blend: 0 }, // door jamb, heading south
  { q: 0.597, cam: [1.4, 1.6, 3.65], look: [1.4, 1.5, 1.4], fov: 68, set: 3, blend: 1 }, // mid passage, daylight ahead
  // 2018: out onto the Embarcadero heading south, the sign and the trophy ahead, the bridge over the bay to
  // the left; then right, west, along the front of the dark block, and right again, north, to its door
  { q: 0.619, cam: [1.45, 1.6, 2.0], look: [2.45, 1.5, 0.27], fov: 68, set: 3 }, // just outside
  { q: 0.642, cam: [1.8, 1.62, 0.7], look: [2.78, 1.4, -1.6], fov: 64, set: 3 }, // the sign comes round
  { q: 0.665, cam: [2.0, 1.62, -0.4], look: [2.35, 1.55, -2.37], fov: 68, set: 3 }, // the sign, the trophy, the road and the bridge behind
  { q: 0.694, cam: [1.7, 1.6, -1.3], look: [0.168, 1.5, -2.586], fov: 66, set: 3 }, // turning right, west
  { q: 0.722, cam: [0.9, 1.6, -1.8], look: [-0.954, 1.5, -1.051], fov: 66, set: 3 }, // the entrance comes into view as we round the corner
  { q: 0.746, cam: [-0.1, 1.6, -1.65], look: [-0.784, 1.5, 0.229], fov: 66, set: 3 }, // follow the door, clear of the blank brick face
  { q: 0.768, cam: [-0.66, 1.6, -1.05], look: [-0.7, 1.5, 0.9], fov: 68, set: 3 }, // north, the door ahead, the desk inside
  { q: 0.788, cam: [-0.7, 1.58, -0.1], look: [-0.75, 1.45, 1.9], fov: 68, set: 3, blend: 0 }, // door jamb, heading north
  { q: 0.808, cam: [-0.7, 1.58, 0.55], look: [-0.9, 1.35, 2.6], fov: 68, set: 4, blend: 1 }, // through the frame: the room, night
  // 2020: in from the south, the wide desk dead ahead with its screens and the shelves of books and awards over it,
  // the bed on the right, the mess underfoot; then left, west, into the passage to the brick door
  { q: 0.838, cam: [-0.75, 1.58, 0.75], look: [-1.05, 1.45, 3.2], fov: 74, set: 4 }, // the desk and both shelves, with the bed alongside
  { q: 0.866, cam: [-0.85, 1.58, 1.1], look: [-1.1, 1.5, 3.45], fov: 74, set: 4 }, // closer, keeping the tallest awards in frame
  { q: 0.89, cam: [-1.0, 1.58, 1.95], look: [-2.15, 1.45, 3.05], fov: 64, set: 4 }, // turning left over the desk's end, the lamp
  { q: 0.912, cam: [-1.4, 1.58, 1.85], look: [-3.0, 1.45, 2.05], fov: 66, set: 4 }, // the door west, the passage, the brick door beyond it
  { q: 0.932, cam: [-1.9, 1.58, 1.65], look: [-3.9, 1.5, 1.6], fov: 68, set: 4 },
  { q: 0.951, cam: [-2.35, 1.58, 1.6], look: [-4.5, 1.5, 0.9], fov: 68, set: 4, blend: 0 }, // door jamb, beginning the turn into the boarding passage
];

/** The first five rooms keep their choreography; the ring was cut at the brick door for the flight, so they share the first 0.59 of the stage. */
export const APPROACH_SCALE = 0.6;

/** Standing in the central aisle at z, eye 1.6 m over its steps. */
const aisle = (z: number, dy = 0): V3 => [AUDITORIUM.aisleX, aisleHeight(z) + 1.6 + dy, z];

export const DOLLY: DollyKey[] = [
  ...APPROACH.map((k) => ({ ...k, q: k.q * APPROACH_SCALE })),
  // 2022, leaving: west out of the Delhi room into the passage, left down the jet bridge, through the cabin door,
  // up the aisle and into the port window seat of the third row
  { q: 0.583, cam: [-3.3, 1.58, 1.6], look: [-4.55, 1.5, -1.0], fov: 70, set: 5, blend: 1 }, // mid passage, the bridge opening on the left
  { q: 0.603, cam: [-3.35, 1.58, -0.5], look: [-3.4, 1.5, -4.0], fov: 70, set: 5 }, // down the bridge: the cabin door ahead
  { q: 0.62, cam: [-3.4, 1.58, -2.6], look: [-3.6, 1.5, -6.2], fov: 72, set: 5 },
  { q: 0.638, cam: [-3.4, 1.58, -4.6], look: [-4.6, 1.45, -7.4], fov: 74, set: 5 }, // in the door: the rows, the window seat
  { q: 0.652, cam: [-3.5, 1.55, -6.0], look: [-5.6, 1.4, -6.9], fov: 74, set: 5 }, // at the row, turning right
  { q: 0.664, cam: [-4.2, 1.45, -6.5], look: [-6.9, 1.2, -7.0], fov: 74, set: 5 }, // into the row, sitting
  // the descent: out and forward over the wing first, then abeam and down at the Arm, the cloud deck, the campus
  { q: FLIGHT.start, cam: WINDOW_VIEW.cam, look: [-7.1, 0.95, -8.4], fov: 74, set: 5 }, // seated: the wing, the city ahead
  { q: 0.69, cam: WINDOW_VIEW.cam, look: WINDOW_VIEW.look, fov: 74, set: 5 }, // abeam and down: the Northwest Arm
  { q: 0.703, cam: [-4.8, 1.4, -6.42], look: [-7.75, 0.72, -6.35], fov: 74, set: 5 }, // leaning to the glass through the deck
  { q: 0.714, cam: [-4.78, 1.41, -6.41], look: [-7.7, 0.8, -7.0], fov: 74, set: 5 }, // clear air: the campus sliding in from ahead
  { q: PHONE.framed, ...WINDOW_VIEW, set: 5 },
  { q: 0.736, ...WINDOW_VIEW, set: 5, blend: 0 },
  { q: PHONE.transfer, ...CLASSROOM_VIEW, set: 6, blend: 1, portal: true },
  // 2022, arrived: seated at the back of the auditorium. A look round the hall, then up, into the aisle, and down
  // the steps to the dais; a turn to face the whole hall from behind the lectern
  { q: PHONE.reveal, ...CLASSROOM_VIEW, set: 6 },
  { q: 0.765, ...CLASSROOM_VIEW, set: 6 },
  { q: 0.778, cam: CLASSROOM_VIEW.cam, look: [8.4, 2.3, -13.5], fov: 74, set: 6 }, // the far bank, the fins, the clock
  { q: 0.79, cam: CLASSROOM_VIEW.cam, look: [4.9, 2.4, -16.2], fov: 74, set: 6 }, // back to the board
  { q: 0.80, cam: [AUDITORIUM.studyX, TOP_ROW.height + 1.6, TOP_ROW.seat - 0.02], look: [5.2, 3.2, -9.5], fov: 74, set: 6 }, // on his feet
  { q: 0.812, cam: aisle(AUDITORIUM.rear - 2.3), look: [4.9, 2.4, -12], fov: 74, set: 6 }, // into the aisle
  { q: 0.83, cam: aisle(-5.7), look: [4.9, 2.0, -13.5], fov: 74, set: 6 },
  { q: 0.85, cam: aisle(-7.05), look: [5.0, 1.8, -14.5], fov: 74, set: 6 }, // down the steps, the screen coming down over the board
  { q: 0.87, cam: aisle(-8.4), look: [5.2, 1.7, -15.2], fov: 74, set: 6 },
  { q: 0.89, cam: aisle(-9.75), look: [5.4, 1.5, -15.7], fov: 74, set: 6 },
  { q: 0.905, cam: aisle(-11.1), look: [5.5, 1.4, -15.9], fov: 74, set: 6 },
  { q: 0.92, cam: aisle(-12.45), look: [5.6, 1.35, -16.0], fov: 74, set: 6 }, // the lectern
  { q: 0.932, cam: aisle(-13.8), look: [6.8, 1.3, -16.0], fov: 74, set: 6 },
  { q: 0.943, cam: [4.95, 1.62, -15.0], look: [8.8, 1.4, -15.4], fov: 74, set: 6 }, // on the floor, turning right past the lectern
  { q: 0.954, cam: [4.9, DAIS.height + 1.6, -15.95], look: [9.4, 1.8, -13.9], fov: 74, set: 6 }, // up on the dais, passing the lectern's side, the right bank coming round
  { q: 0.966, cam: [5.25, DAIS.height + 1.6, -16.55], look: [8.2, 2.2, -10.0], fov: 74, set: 6 },
  { q: 0.978, cam: [5.6, DAIS.height + 1.6, -16.7], look: [5.8, 0.55, -7.5], fov: 74, set: 6 }, // behind the lectern: the laptop at the bottom of the frame, the whole hall above it
  { q: 0.99, cam: [5.6, DAIS.height + 1.6, -16.7], look: [4.9, 0.45, -7.0], fov: 74, set: 6 },
  { q: 1, cam: [5.6, DAIS.height + 1.6, -16.7], look: [4.7, 0.5, -8.0], fov: 74, set: 6 }, // teaching
];

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

export function makeDolly(keys: DollyKey[]): (q: number) => Frame {
  const n = keys.length;
  // A portal deliberately changes location only while its screen covers the viewport. Separate
  // curves prevent neighbouring control points from pulling the camera through intervening walls.
  const starts = [0, ...keys.flatMap((k, i) => k.portal ? [i] : [])];
  const segments = starts.map((start, i) => {
    const end = (starts[i + 1] ?? n) - 1, part = keys.slice(start, end + 1);
    return { start, end, cam: new CatmullRomCurve3(part.map((k) => new Vector3(...k.cam)), false, 'centripetal'), look: new CatmullRomCurve3(part.map((k) => new Vector3(...k.look)), false, 'centripetal') };
  });
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
    const segment = segments.findLast((s) => q >= keys[s.start].q) ?? segments[0];
    const u = Math.min(1, (k + f - segment.start) / (segment.end - segment.start));
    let set = a.set, from = a.set, into = a.set, blend = 0, envDip = 1;
    for (const [s, e] of windows) {
      if (q < keys[s].q || q > keys[e].q) continue;
      blend = clamp01((q - keys[s].q) / (keys[e].q - keys[s].q));
      from = keys[s].set; into = keys[e].set;
      set = keys[e].portal ? (q < keys[e].q ? from : into) : (blend < 0.5 ? from : into);
      envDip = 1 - 0.88 * Math.sin(Math.PI * blend);
    }
    return {
      q, set, from, into, blend, envDip,
      cam: segment.cam.getPoint(u).toArray() as V3,
      look: segment.look.getPoint(u).toArray() as V3,
      fov: a.fov + (b.fov - a.fov) * f,
    };
  };
}
