// The camera path, as data, and the function from stage progress to a frame. Pure.
//
// One dolly runs through the sets, with one phone-covered portal. Keys carry a stage progress q, written in chapter lengths
// (ch); between two keys the
// curve parameter is linear in q, so the spacing of keys sets the speed. A pair of keys marked
// blend 0 and blend 1 is a doorway: inside it the light dips, and at the halfway point the set
// (environment, sky, sun, fog, exposure) is swapped while the frame is all door jamb.
import { CatmullRomCurve3, Vector3 } from 'three';
import { TERRACE, STAGE, AUDITORIUM, LECTURE_ROWS, TOP_ROW, DAIS, aisleHeight, type V3, houseFloorY, FLOQER, stairY } from './sets.ts';
import { CLASSROOM_VIEW, WINDOW_VIEW, PHONE, FLIGHT } from './flight.ts';
import { ch } from './shot.ts';

export interface DollyKey { q: number; cam: V3; look: V3; fov: number; set: number; blend?: 0 | 1; portal?: true; soft?: true } // soft: an open-air threshold, the light crossfades without the doorway's dip
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
  { q: 0.22, cam: [-5.45, 1.58, 4.9], look: [-7.6, 0.9, 6.7], fov: 64, set: 1 }, // into the room: the rug, the pouf, the television beyond
  { q: 0.253, cam: [-5.45, 1.58, 5.6], look: [-8.8, 0.85, 6.5], fov: 62, set: 1 }, // the desk: the screen, the Xbox beside it
  { q: 0.285, cam: [-5.45, 1.58, 5.9], look: [-8.4, 1.0, 7.7], fov: 62, set: 1 }, // the bookshelf: the figures, the encyclopedias
  { q: 0.312, cam: [-5.45, 1.58, 6.3], look: [-6.2, 1.62, 8.3], fov: 62, set: 1 }, // the poster over the bed, the clock at its side
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

/** The first five rooms keep their choreography over the first 4.2 chapters; the ring was cut at the brick door for the flight. */
export const APPROACH_SCALE = ch(4.2);

/** Standing in the central aisle at z, eye 1.6 m over its steps. */
const aisle = (z: number, dy = 0): V3 => [AUDITORIUM.aisleX, aisleHeight(z) + 1.6 + dy, z];

export const DOLLY: DollyKey[] = [
  ...APPROACH.map((k) => ({ ...k, q: k.q * APPROACH_SCALE })),
  // 2022, leaving: west out of the Delhi room into the passage, left down the jet bridge, through the cabin door,
  // one step up the aisle and into the port window seat of the row by the door
  { q: ch(4.081), cam: [-3.3, 1.58, 1.6], look: [-4.55, 1.5, -1.0], fov: 70, set: 5, blend: 1 }, // mid passage, the bridge opening on the left
  { q: ch(4.221), cam: [-3.35, 1.58, -0.7], look: [-3.4, 1.5, -4.2], fov: 70, set: 5 }, // down the bridge: the cabin door ahead
  { q: ch(4.34), cam: [-3.4, 1.58, -2.9], look: [-3.6, 1.5, -6.4], fov: 72, set: 5 },
  { q: ch(4.466), cam: [-3.4, 1.58, -4.9], look: [-4.5, 1.4, -7.1], fov: 74, set: 5 }, // in the door: the rows ahead, the pair beside the door
  { q: ch(4.564), cam: [-3.45, 1.55, -5.5], look: [-4.9, 1.3, -6.5], fov: 74, set: 5 }, // one step: the first row, turning to it
  { q: ch(4.648), cam: [-3.75, 1.5, -5.5], look: [-5.3, 1.25, -6.1], fov: 74, set: 5 }, // into the row
  { q: ch(4.697), cam: [-4.15, 1.32, -5.5], look: [-6.4, 0.9, -6.3], fov: 74, set: 5 }, // sitting; the descent begins
  // the descent: out and down over the Arm, the cloud deck, the campus abeam; the wing's leading edge behind the shoulder
  { q: ch(4.746), cam: WINDOW_VIEW.cam, look: [-6.8, 0.85, -6.6], fov: 74, set: 5 }, // seated: the cloud tops ahead
  { q: ch(4.788), cam: WINDOW_VIEW.cam, look: [-7.2, 0.8, -6.4], fov: 74, set: 5 }, // down toward the deck
  { q: ch(4.837), cam: [-4.5, 1.22, -5.55], look: [-7.4, 0.6, -5.5], fov: 74, set: 5 }, // leaning to the glass through the deck
  { q: ch(4.942), cam: [-4.48, 1.23, -5.54], look: [-7.35, 0.62, -6.05], fov: 74, set: 5 }, // clear air: the Arm, the peninsula, the campus sliding in from ahead
  { q: FLIGHT.end, cam: WINDOW_VIEW.cam, look: [-7.4, 0.55, -5.65], fov: 74, set: 5 }, // the campus abeam: the Hicks tower, the Killam, the quad
  { q: PHONE.framed, ...WINDOW_VIEW, set: 5 },
  { q: ch(5.152), ...WINDOW_VIEW, set: 5, blend: 0 },
  { q: PHONE.transfer, ...CLASSROOM_VIEW, set: 6, blend: 1, portal: true },
  // 2022, arrived: seated at the back of the auditorium. A look round the hall, then up, into the aisle, and down
  // the steps to the dais; a turn to face the whole hall from behind the lectern
  { q: PHONE.reveal, ...CLASSROOM_VIEW, set: 6 },
  { q: ch(5.33), ...CLASSROOM_VIEW, set: 6 },
  { q: ch(5.4), cam: CLASSROOM_VIEW.cam, look: [8.4, 2.3, -13.5], fov: 74, set: 6 }, // the far bank, the fins, the clock
  { q: ch(5.47), cam: CLASSROOM_VIEW.cam, look: [4.9, 2.4, -16.2], fov: 74, set: 6 }, // back to the board
  { q: ch(5.53), cam: [AUDITORIUM.studyX, TOP_ROW.height + 1.6, TOP_ROW.seat - 0.02], look: [5.2, 3.2, -9.5], fov: 74, set: 6 }, // on his feet
  { q: ch(5.6), cam: aisle(AUDITORIUM.rear - 2.3), look: [4.9, 2.4, -12], fov: 74, set: 6 }, // into the aisle
  { q: ch(5.69), cam: aisle(-5.7), look: [4.9, 2.0, -13.5], fov: 74, set: 6 },
  { q: ch(5.78), cam: aisle(-7.05), look: [5.0, 1.8, -14.5], fov: 74, set: 6 }, // down the steps, the screen coming down over the board
  { q: ch(5.87), cam: aisle(-8.4), look: [5.2, 1.7, -15.2], fov: 74, set: 6 },
  { q: ch(5.96), cam: aisle(-9.75), look: [5.4, 1.5, -15.7], fov: 74, set: 6 },
  { q: ch(6.04), cam: aisle(-11.1), look: [5.5, 1.4, -15.9], fov: 74, set: 6 },
  { q: ch(6.12), cam: aisle(-12.45), look: [5.6, 1.35, -16.0], fov: 74, set: 6 }, // the lectern
  { q: ch(6.2), cam: aisle(-13.8), look: [6.8, 1.3, -16.0], fov: 74, set: 6 },
  { q: ch(6.28), cam: [4.95, 1.62, -15.0], look: [8.8, 1.4, -15.4], fov: 74, set: 6 }, // on the floor, turning right past the lectern
  { q: ch(6.36), cam: [4.9, DAIS.height + 1.6, -15.95], look: [9.4, 1.8, -13.9], fov: 74, set: 6 }, // up on the dais, passing the lectern's side, the right bank coming round
  { q: ch(6.44), cam: [5.25, DAIS.height + 1.6, -16.55], look: [8.2, 2.2, -10.0], fov: 74, set: 6 },
  { q: ch(6.52), cam: [5.6, DAIS.height + 1.6, -16.7], look: [5.8, 0.55, -7.5], fov: 74, set: 6 }, // behind the lectern: the laptop at the bottom of the frame, the whole hall above it
  { q: ch(6.58), cam: [5.6, DAIS.height + 1.6, -16.7], look: [4.9, 0.45, -7.0], fov: 74, set: 6 },
  { q: ch(6.64), cam: [5.6, DAIS.height + 1.6, -16.7], look: [4.7, 0.5, -8.0], fov: 74, set: 6 }, // teaching
  // 2024: out to the teacher's right, west along the dais, down the step, through the front door straight into Sydney:
  // the hacker house, the table Bean was built on, the whiteboard, the harbour out of the window
  { q: ch(6.74), cam: [3.9, DAIS.height + 1.6, -16.6], look: [0.9, 1.4, -11.4], fov: 74, set: 6 }, // turning right along the dais
  { q: ch(6.86), cam: [2.0, DAIS.height + 1.6, -16.4], look: [-2.2, 1.4, -13.7], fov: 72, set: 6 }, // the door ahead
  { q: ch(6.96), cam: [0.35, DAIS.height + 1.6, -16.15], look: [-2.4, 1.35, -15.8], fov: 72, set: 6 },
  { q: ch(7.02), cam: [-0.6, 1.62, -15.9], look: [-3.5, 1.3, -15.8], fov: 72, set: 6 }, // down the step
  { q: ch(7.06), cam: [-1.3, 1.6, -15.8], look: [-4.3, 1.25, -15.85], fov: 72, set: 6, blend: 0 }, // the jamb
  { q: ch(7.12), cam: [-2.2, 1.6, -15.8], look: [-5.5, 1.2, -15.9], fov: 72, set: 7, blend: 1 }, // in: the table, the monitors, the window
  { q: ch(7.24), cam: [-2.7, 1.6, -15.0], look: [-4.8, 1.45, -13.4], fov: 74, set: 7 }, // the whiteboard
  { q: ch(7.35), cam: [-2.95, 1.6, -14.35], look: [-6.0, 1.15, -14.6], fov: 74, set: 7 }, // at the table's end, the room's length ahead
  { q: ch(7.42), cam: [-3.05, 1.55, -14.3], look: [-4.8, 0.85, -15.5], fov: 74, set: 7 }, // down at the monitors and the wires
  // 2025: straight out. Along the north side, down the gap between the table and the window (the Opera House through it), out of the south door, laptop in hand
  { q: ch(7.56), cam: [-5.0, 1.6, -14.28], look: [-8.4, 1.5, -16.4], fov: 74, set: 7 },
  { q: ch(7.68), cam: [-6.7, 1.6, -15.5], look: [-9.5, 1.4, -18.3], fov: 74, set: 7 }, // a glance out of the window on the way past, already turning to the door
  { q: ch(7.9), cam: [-6.85, 1.6, -17.95], look: [-6.85, 1.15, -21.95], fov: 74, set: 7, blend: 0 }, // the jamb
  // 2025: out of the door onto the terrace, right twice, and north along the harbour side of the house, laptop in hand:
  // Vancouver, Toronto, Halifax, one city a chapter, the thing on the water changing at each threshold; then the door at
  // the terrace's end, the wing, the steps, the side of the stage, the centre for the degree, and the turn to the crowd
  ...walk(),
];

/**
 * The walk from the hacker house's south door to the stage: keyed evenly so the spline stays a line. Two quarter-chapter
 * right turns onto the terrace's walk line, then 40 m north at 15.7 m a chapter; the eye at 1.6, looking 4 m ahead and
 * a little down at the laptop's height. Through the door at 10.98, up the four steps, along the stage to its centre by
 * 11.5 (the degree comes up), then a quarter chapter turning right to the hall.
 */
function walk(): DollyKey[] {
  const X = TERRACE.walkX, keys: DollyKey[] = [];
  const K = (q: number, cam: V3, look: V3, set: number, extra: Partial<DollyKey> = {}): DollyKey => ({ q: ch(q), cam, look, fov: 74, set, ...extra });
  keys.push(K(7.98, [-6.85, 1.6, -19.3], [-7.2, 1.25, -23.2], 8, { blend: 1 })); // out on the south leg of the terrace
  keys.push(K(8.1, [-7.3, 1.6, -19.7], [-10.6, 1.3, -21.9], 8)); // turning right along the south wall
  keys.push(K(8.22, [-8.5, 1.6, -19.7], [-12.5, 1.3, -19.9], 8)); // west: the parapet and the water ahead, 30 m down
  keys.push(K(8.34, [-10.0, 1.6, -19.5], [-13.0, 1.3, -16.8], 8)); // the corner: turning right again
  keys.push(K(8.46, [X, 1.6, -18.4], [X - 0.4, 1.3, -14.4], 8)); // north along the terrace: the water on the left, the house on the right
  const z0 = -18.4, zJamb = TERRACE.door - 0.6, q0 = 8.46, q1 = 10.98, n = 22; // 42 m over 2.52 chapters
  for (let k = 1; k <= n; k++) {
    const q = Math.round((q0 + (q1 - q0) * (k / n)) * 1000) / 1000, z = Math.round((z0 + (zJamb - z0) * (k / n)) * 100) / 100;
    const set = k < 5 ? 8 : k < 13 ? 9 : 10; // the thresholds at the fourth and twelfth keys, soft
    const blend = k === 4 || k === 12 ? 0 : k === 5 || k === 13 ? 1 : undefined;
    if (k === n) keys.push(K(q, [X, 1.6, z], [X, 1.3, z + 4], 10, { blend: 0 })); // the jamb of the door back in
    else keys.push(K(q, [X, 1.6, z], [X, 1.3, z + 4], set, blend === undefined ? {} : blend === 1 ? { blend, soft: true } : { blend }));
  }
  // the wing: in through the door, up the steps (the rise spread over the stride, the way an eye takes stairs), and
  // along the stage from its side to the centre, slowing into the stop where the degree is handed over
  const S = STAGE.height, w0 = STAGE.wing[0];
  keys.push(K(11.08, [X, 1.6, w0 + 1.2], [X, 1.4, w0 + 5.2], 11, { blend: 1 }));
  keys.push(K(11.22, [X, 1.6 + S, 27.3], [X, 1.45 + S, 31.3], 11)); // up on the stage
  keys.push(K(11.36, [X, 1.6 + S, 29.4], [X, 1.4 + S, 33.4], 11));
  keys.push(K(11.5, [X, 1.6 + S, 31.5], [X, 1.4 + S, 35.5], 11));
  keys.push(K(11.66, [X, 1.6 + S, STAGE.centre], [X, 1.4 + S, STAGE.centre + 4], 11)); // the centre: the degree
  // the turn to the hall: a quarter chapter right, from +z to +x, the crowd on its feet
  keys.push(K(11.78, [X, 1.6 + S, STAGE.centre], [X + 2.0, 1.45 + S, STAGE.centre + 3.5], 11));
  keys.push(K(11.9, [X, 1.6 + S, STAGE.centre], [X + 3.6, 1.5 + S, STAGE.centre + 1.8], 11));
  keys.push(K(12.0, [X, 1.6 + S, STAGE.centre], [X + 4, 1.55 + S, STAGE.centre], 11)); // facing the crowd
  // out: straight on along the stage, past the leg, backstage to the door in the north wall, along the passage into Floqer's
  // hacker house; through it to the stair on the left, up it, through the door at the top, and home: his apartment, the
  // first room, the way he left it (a cut at the door, like the phone's). The last card runs three chapters for it.
  const D = STAGE.door, ST = FLOQER.stair, SY = (z: number) => 1.6 + stairY(z);
  keys.push(K(12.14, [X, 1.6 + S, 34.3], [X + 2.0, 1.5 + S, 37.8], 11)); // turning back to the stage's length
  keys.push(K(12.28, [X, 1.6 + S, 35.8], [X + 0.2, 1.4 + S, 39.8], 11));
  keys.push(K(12.45, [X, 1.6 + S, 38.2], [X, 1.4 + S, 42.2], 11));
  keys.push(K(12.62, [X, 1.6 + S, 40.6], [X, 1.4 + S, 44.6], 11)); // past the leg, backstage
  keys.push(K(12.8, [X, 1.6 + S, 43.0], [X, 1.4 + S, 47.0], 11));
  keys.push(K(13.0, [X, 1.6 + S, 45.6], [X, 1.4 + S, 49.6], 11)); // the door ahead
  keys.push(K(13.12, [X, 1.6 + S, D.z - 0.6], [X, 1.4 + S, D.z + 3.4], 11, { blend: 0 })); // the jamb
  keys.push(K(13.24, [X, 1.6 + S, 49.0], [X, 1.4 + S, 53.0], 12, { blend: 1 })); // the passage
  keys.push(K(13.4, [-10.4, 2.6, 51.0], [-9.6, 2.35, 55.0], 12)); // in: the T ahead, the team at it
  keys.push(K(13.6, [-9.6, 2.6, 52.8], [-9.0, 2.3, 56.8], 12));
  keys.push(K(13.8, [-8.8, 2.6, 54.4], [-7.6, 2.4, 58.0], 12)); // past the bar's end
  keys.push(K(14.0, [-7.6, 2.6, 55.4], [ST.x, 2.6, 58.4], 12)); // turning left to the stair
  keys.push(K(14.15, [-6.0, 2.6, 55.9], [ST.x, 3.1, 59.0], 12)); // its foot
  keys.push(K(14.3, [ST.x, SY(57.1), 57.1], [ST.x, SY(57.1) + 1.0, 60.5], 12)); // climbing
  keys.push(K(14.45, [ST.x, SY(58.4), 58.4], [ST.x, SY(58.4) + 0.7, 61.6], 12));
  keys.push(K(14.6, [ST.x, SY(59.6), 59.6], [-5.5, SY(59.6) - 0.2, 62.4], 12)); // the landing: the door
  keys.push(K(14.75, [-5.5, SY(60.8), 60.8], [-5.5, SY(60.8) - 0.15, 62.6], 12)); // the door opening
  keys.push(K(14.88, [-5.5, SY(61.3), 61.3], [-5.5, SY(61.3) - 0.1, 63.0], 12, { blend: 0 })); // the jamb: the cut
  keys.push(K(14.94, [-5.45, 1.58, 1.9], [-7.4, 1.35, -0.6], 0, { blend: 1, portal: true })); // home: in through his own front door
  keys.push(K(15.0, [-6.3, 1.58, 1.2], [-8.6, 1.3, -1.5], 0)); // the room, the way he left it
  return keys;
}




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
      envDip = keys[e].soft ? 1 : 1 - 0.88 * Math.sin(Math.PI * blend);
    }
    return {
      q, set, from, into, blend, envDip,
      cam: segment.cam.getPoint(u).toArray() as V3,
      look: segment.look.getPoint(u).toArray() as V3,
      fov: a.fov + (b.fov - a.fov) * f,
    };
  };
}
