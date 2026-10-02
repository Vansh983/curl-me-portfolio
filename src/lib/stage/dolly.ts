// The camera path, as data, and the function from stage progress to a frame. Pure.
//
// One dolly runs through the sets, with two cuts: the phone's, covered by its screen, and the 2020 room's return to its place, which moves nothing in the frame. Keys carry a stage progress q, written in chapter lengths
// (ch); between two keys the
// curve parameter is linear in q, so the spacing of keys sets the speed. A pair of keys marked
// blend 0 and blend 1 is a doorway: inside it the light dips, and at the halfway point the set
// (environment, sky, sun, fog, exposure) is swapped while the frame is all door jamb.
import { CatmullRomCurve3, Vector3 } from 'three';
import { STAGE, AUDITORIUM, TOP_ROW, DAIS, aisleHeight, type V3, FLOQER, stairY, TOUR_SHIFT, HOME, DELHI, VOLTA_PODIUM } from './sets.ts';
import { WALK, TURN, MIST, walkZ } from './walk.ts';
import { CLASSROOM_VIEW, WINDOW_VIEW, PHONE, FLIGHT } from './flight.ts';
import { ch, approach, TOUR_GAIN } from './shot.ts';

export interface DollyKey { q: number; cam: V3; look: V3; fov: number; set: number; blend?: 0 | 1; portal?: true; soft?: true } // soft: an open-air threshold, the light crossfades without the doorway's dip
/** `from` and `into` are the sets a doorway joins; outside a doorway both equal `set`. */
export interface Frame { q: number; set: number; from: number; into: number; blend: number; cam: V3; look: V3; fov: number; envDip: number }

const APPROACH: DollyKey[] = [
  // now: from the north-west corner of the studio, a turn on the spot to the front door and straight out. A person
  // walks: eye at 1.6, always forward, the head turning to what is worth a look. fov is the horizontal field, wide
  // as eyes are: a laptop screen shows the whole room, not a corner of it
  { q: 0.0, cam: [-8.3, 1.6, 1.5], look: [-6.6, 1.72, -2.14], fov: 78, set: 0 }, // the bed under the hero, the glass with the CN Tower to its tip, the desk on the right
  { q: 0.046, cam: [-8.3, 1.6, 1.5], look: [-5.45, 1.5, 2.1], fov: 72, set: 0 }, // turned on the spot: the front door
  { q: 0.091, cam: [-7.0, 1.6, 1.3], look: [-5.5, 1.45, 2.0], fov: 70, set: 0 }, // straight to it
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
  { q: 0.588, cam: [1.4, 1.6, 3.5], look: [2.8, 1.2, 0.2], fov: 68, set: 3, blend: 1 }, // mid passage: daylight, the lawn ahead
  { q: 0.6, cam: [1.6, 1.6, 2.5], look: [7.0, 1.3, 0.0], fov: 68, set: 3 }, // the mouth: the lawn, the statues along it, the bikes
  { q: 0.6384, cam: [2.7, 1.6, 1.2], look: [7.4, 1.4, -0.8], fov: 68, set: 3 }, // the Android
  { q: 0.6784, cam: [3.2, 1.6, -0.5], look: [7.6, 1.3, -4.6], fov: 68, set: 3 }, // down the row: the donut, the gingerbread man
  { q: 0.7123, cam: [3.2, 1.6, -2.0], look: [5.6, 1.25, -10.5], fov: 68, set: 3 }, // the bean, Honeycomb, KitKat; the letters at the end of the path
  { q: 0.735, cam: [3.2, 1.6, -3.0], look: [2.6, 1.3, -9.5], fov: 68, set: 3 }, // Google; the block's face coming in on the left, the door in it
  { q: 0.753, cam: [3.25, 1.6, -3.9], look: [1.57, 1.5, -6.6], fov: 68, set: 3 }, // turning left: his two photographs on the wall past the door
  { q: 0.77, cam: [3.3, 1.6, -4.75], look: [1.57, 1.5, -6.8], fov: 68, set: 3 }, // the award in his hands, the sign in San Francisco
  { q: 0.785, cam: [3.0, 1.6, -5.0], look: [-0.4, 1.4, -5.2], fov: 68, set: 3 }, // and to the door beside them, where the glass door was: it opens; off the path, onto its spur
  { q: 0.797, cam: DELHI.to([-0.6, 1.6, -0.7]), look: DELHI.to([-0.8, 1.4, 2.4]), fov: 68, set: 3 }, // the jamb ahead
  // the 2020 room stands behind that door (DELHI) until the desk wall fills the frame: these keys are the room's own, put where it stands
  { q: 0.808, cam: DELHI.to([-0.7, 1.58, -0.1]), look: DELHI.to([-0.85, 1.45, 3.4]), fov: 68, set: 3, blend: 0 }, // door jamb, heading in
  { q: 0.822, cam: DELHI.to([-0.7, 1.58, 0.55]), look: DELHI.to([-0.9, 1.35, 2.6]), fov: 68, set: 4, blend: 1 }, // through the frame: the room, night
  { q: 0.838, cam: DELHI.to([-0.75, 1.58, 0.75]), look: DELHI.to([-1.05, 1.45, 3.2]), fov: 74, set: 4 }, // the desk and both shelves, with the bed alongside
  { q: DELHI.cut, cam: DELHI.to([-0.8, 1.58, 0.925]), look: DELHI.to([-1.075, 1.475, 3.325]), fov: 74, set: 4 }, // halfway to the next, on its line
  { q: DELHI.cut + 0.0002, cam: [-0.8, 1.58, 0.925], look: [-1.075, 1.475, 3.325], fov: 74, set: 4, portal: true }, // the same view, the room back where it was built: nothing in the frame moves
  { q: 0.866, cam: [-0.85, 1.58, 1.1], look: [-1.1, 1.5, 3.45], fov: 74, set: 4 }, // closer, keeping the tallest awards in frame
  { q: 0.89, cam: [-1.0, 1.58, 1.95], look: [-2.15, 1.45, 3.05], fov: 64, set: 4 }, // turning left over the desk's end, the lamp
  { q: 0.912, cam: [-1.4, 1.58, 1.85], look: [-3.0, 1.45, 2.05], fov: 66, set: 4 }, // the door west, the passage, the brick door beyond it
  { q: 0.932, cam: [-1.9, 1.58, 1.65], look: [-3.9, 1.5, 1.6], fov: 68, set: 4 },
  { q: 0.951, cam: [-2.35, 1.58, 1.6], look: [-4.5, 1.5, 0.9], fov: 68, set: 4, blend: 0 }, // door jamb, beginning the turn into the boarding passage
];

/** The first five rooms keep their choreography over the first 4.2 chapters (shot.ts `approach`: the Google walk runs two chapter lengths); the ring was cut at the brick door for the flight. */
export const APPROACH_SCALE = ch(5.2);

/** Standing in the central aisle at z, eye 1.6 m over its steps. */
const aisle = (z: number, dy = 0): V3 => [AUDITORIUM.aisleX, aisleHeight(z) + 1.6 + dy, z];

export const DOLLY: DollyKey[] = [
  ...APPROACH.map((k) => ({ ...k, q: approach(k.q) })),
  // 2022, leaving: west out of the Delhi room into the passage, left down the jet bridge, through the cabin door,
  // one step up the aisle and into the port window seat of the row by the door
  { q: ch(5.081), cam: [-3.3, 1.58, 1.6], look: [-4.55, 1.5, -1.0], fov: 70, set: 5, blend: 1 }, // mid passage, the bridge opening on the left
  { q: ch(5.221), cam: [-3.35, 1.58, -0.7], look: [-3.4, 1.5, -4.2], fov: 70, set: 5 }, // down the bridge: the cabin door ahead
  { q: ch(5.34), cam: [-3.4, 1.58, -2.9], look: [-3.6, 1.5, -6.4], fov: 72, set: 5 },
  { q: ch(5.466), cam: [-3.4, 1.58, -4.9], look: [-4.5, 1.4, -7.1], fov: 74, set: 5 }, // in the door: the rows ahead, the pair beside the door
  { q: ch(5.564), cam: [-3.45, 1.55, -5.5], look: [-4.9, 1.3, -6.5], fov: 74, set: 5 }, // one step: the first row, turning to it
  { q: ch(5.648), cam: [-3.75, 1.5, -5.5], look: [-5.3, 1.25, -6.1], fov: 74, set: 5 }, // into the row
  { q: ch(5.697), cam: [-4.15, 1.32, -5.5], look: [-6.4, 0.9, -6.3], fov: 74, set: 5 }, // sitting; the descent begins
  // the descent: out and down over the Arm, the cloud deck, the campus abeam; the wing's leading edge behind the shoulder
  { q: ch(5.746), cam: WINDOW_VIEW.cam, look: [-6.8, 0.85, -6.6], fov: 74, set: 5 }, // seated: the cloud tops ahead
  { q: ch(5.788), cam: WINDOW_VIEW.cam, look: [-7.2, 0.8, -6.4], fov: 74, set: 5 }, // down toward the deck
  { q: ch(5.837), cam: [-4.5, 1.22, -5.55], look: [-7.4, 0.6, -5.5], fov: 74, set: 5 }, // leaning to the glass through the deck
  { q: ch(5.942), cam: [-4.48, 1.23, -5.54], look: [-7.35, 0.62, -6.05], fov: 74, set: 5 }, // clear air: the Arm, the peninsula, the campus sliding in from ahead
  { q: FLIGHT.end, cam: WINDOW_VIEW.cam, look: [-7.4, 0.55, -5.65], fov: 74, set: 5 }, // the campus abeam: the Hicks tower, the Killam, the quad
  { q: PHONE.framed, ...WINDOW_VIEW, set: 5 },
  { q: ch(6.152), ...WINDOW_VIEW, set: 5, blend: 0 },
  { q: PHONE.transfer, ...CLASSROOM_VIEW, set: 6, blend: 1, portal: true },
  // 2022, arrived: seated at the back of the auditorium. A look round the hall, then up, into the aisle, and down
  // the steps to the dais; a turn to face the whole hall from behind the lectern
  { q: PHONE.reveal, ...CLASSROOM_VIEW, set: 6 },
  { q: ch(6.33), ...CLASSROOM_VIEW, set: 6 },
  { q: ch(6.4), cam: CLASSROOM_VIEW.cam, look: [8.4, 2.3, -13.5], fov: 74, set: 6 }, // the far bank, the fins, the clock
  { q: ch(6.47), cam: CLASSROOM_VIEW.cam, look: [4.9, 2.4, -16.2], fov: 74, set: 6 }, // back to the board
  { q: ch(6.53), cam: [AUDITORIUM.studyX, TOP_ROW.height + 1.6, TOP_ROW.seat - 0.02], look: [5.2, 3.2, -9.5], fov: 74, set: 6 }, // on his feet
  { q: ch(6.6), cam: aisle(AUDITORIUM.rear - 2.3), look: [4.9, 2.4, -12], fov: 74, set: 6 }, // into the aisle
  { q: ch(6.69), cam: aisle(-5.7), look: [4.9, 2.0, -13.5], fov: 74, set: 6 },
  { q: ch(6.78), cam: aisle(-7.05), look: [5.0, 1.8, -14.5], fov: 74, set: 6 }, // down the steps, the screen coming down over the board
  { q: ch(6.87), cam: aisle(-8.4), look: [5.2, 1.7, -15.2], fov: 74, set: 6 },
  { q: ch(6.96), cam: aisle(-9.75), look: [5.4, 1.5, -15.7], fov: 74, set: 6 },
  { q: ch(7.04), cam: aisle(-11.1), look: [5.5, 1.4, -15.9], fov: 74, set: 6 },
  { q: ch(7.12), cam: aisle(-12.45), look: [5.6, 1.35, -16.0], fov: 74, set: 6 }, // the lectern
  { q: ch(7.2), cam: aisle(-13.8), look: [6.8, 1.3, -16.0], fov: 74, set: 6 },
  { q: ch(7.28), cam: [4.95, 1.62, -15.0], look: [8.8, 1.4, -15.4], fov: 74, set: 6 }, // on the floor, turning right past the lectern
  { q: ch(7.36), cam: [4.9, DAIS.height + 1.6, -15.95], look: [9.4, 1.8, -13.9], fov: 74, set: 6 }, // up on the dais, passing the lectern's side, the right bank coming round
  { q: ch(7.44), cam: [5.25, DAIS.height + 1.6, -16.55], look: [8.2, 2.2, -10.0], fov: 74, set: 6 },
  { q: ch(7.52), cam: [5.6, DAIS.height + 1.6, -16.7], look: [5.8, 0.55, -7.5], fov: 74, set: 6 }, // behind the lectern: the laptop at the bottom of the frame, the whole hall above it
  { q: ch(7.58), cam: [5.6, DAIS.height + 1.6, -16.7], look: [4.9, 0.45, -7.0], fov: 74, set: 6 },
  { q: ch(7.64), cam: [5.6, DAIS.height + 1.6, -16.7], look: [4.7, 0.5, -8.0], fov: 74, set: 6 }, // teaching
  // 2024: out to the teacher's right, west along the dais, down the step, through the front door straight into Sydney:
  // the hacker house, the table Bean was built on, the whiteboard, the harbour out of the window
  { q: ch(7.74), cam: [3.9, DAIS.height + 1.6, -16.6], look: [0.9, 1.4, -11.4], fov: 74, set: 6 }, // turning right along the dais
  { q: ch(7.86), cam: [2.0, DAIS.height + 1.6, -16.4], look: [-2.2, 1.4, -13.7], fov: 72, set: 6 }, // the door ahead
  { q: ch(7.96), cam: [0.35, DAIS.height + 1.6, -16.15], look: [-2.4, 1.35, -15.8], fov: 72, set: 6 },
  { q: ch(8.02), cam: [-0.6, 1.62, -15.9], look: [-3.5, 1.3, -15.8], fov: 72, set: 6 }, // down the step
  { q: ch(8.06), cam: [-1.3, 1.6, -15.8], look: [-4.3, 1.25, -15.85], fov: 72, set: 6, blend: 0 }, // the jamb
  { q: ch(8.12), cam: [-2.2, 1.6, -15.8], look: [-5.5, 1.2, -15.9], fov: 72, set: 7, blend: 1 }, // in: the table, the monitors, the window
  { q: ch(8.24), cam: [-2.7, 1.6, -15.0], look: [-4.8, 1.45, -13.4], fov: 74, set: 7 }, // the whiteboard
  { q: ch(8.35), cam: [-2.95, 1.6, -14.35], look: [-6.0, 1.15, -14.6], fov: 74, set: 7 }, // at the table's end, the room's length ahead
  { q: ch(8.42), cam: [-3.05, 1.55, -14.3], look: [-4.8, 0.85, -15.5], fov: 74, set: 7 }, // down at the monitors and the wires
  // 2025: straight out. Along the north side, down the gap between the table and the window (the Opera House through it), out of the south door, laptop in hand
  { q: ch(8.56), cam: [-5.0, 1.6, -14.28], look: [-8.4, 1.5, -16.4], fov: 74, set: 7 },
  { q: ch(8.68), cam: [-6.7, 1.6, -15.5], look: [-9.5, 1.4, -18.3], fov: 74, set: 7 }, // a glance out of the window on the way past, already turning to the door
  { q: ch(8.9), cam: [-6.85, 1.6, -17.95], look: [-6.85, 0.35, -19.2], fov: 74, set: 7, blend: 0 }, // the jamb: a look down at the step out, the parapet hiding the water while the harbour becomes Vancouver's
  // 2025: out of the door onto the promenade, right twice, and 58 m straight north along the harbour, the laptop up as
  // each city begins: Vancouver, Toronto, Halifax, the air changing in the mist between them (walk.ts); in through
  // Volta's glass, the coffee, up to Collect.'s screen, the door at the far end, the wing, the side of the stage, the
  // degree, the crowd, the bin; round Floqer's house, up its stair, and in at his own door
  ...walk(),
];

/**
 * The walk from the Bean house's south door to the stage and on home. Two quarter-chapter right turns onto the walk's
 * line, then 58 m north at one pace (WALK_SPEED), keyed evenly so the spline stays a line; the eye at 1.6 looking 4 m
 * ahead, with a glance at what each city brings: the whale going up, the seaplane's run, the tower over the water, the
 * streetcar passing, the ferry, the town on its hill. The cities change at TURN, in the middle of the mist: an open-air
 * threshold either side of each. Volta's glass is a door in the same set; in the room he goes up to the screen and
 * stands while its slides go by. Everything from the wing on was keyed for the shorter terrace: it sits TOUR_GAIN
 * chapters later and TOUR_SHIFT metres further north. The end is walked, not cut: the apartment stands behind the door
 * at the top of the house's stair (HOME).
 */
function walk(): DollyKey[] {
  const X = WALK.x, keys: DollyKey[] = [];
  const K = (q: number, cam: V3, look: V3, set: number, extra: Partial<DollyKey> = {}): DollyKey => ({ q: ch(Math.round(q * 1000) / 1000), cam, look, fov: 74, set, ...extra });
  keys.push(K(8.98, [-6.85, 1.6, -19.3], [-7.0, 0.7, -20.6], 8, { blend: 1 })); // out on the south leg of the paving, still watching the step: the harbour has become Vancouver's behind the rail
  keys.push(K(9.1, [-7.3, 1.6, -19.7], [-10.0, 1.3, -22.2], 8)); // and up, turning right along the south wall: the water
  keys.push(K(9.22, [-8.5, 1.6, -19.7], [-12.5, 1.4, -19.9], 8)); // west: the rail, the seaplane on the water, the mountains over it
  keys.push(K(9.34, [-10.0, 1.6, -19.5], [-13.0, 1.4, -16.8], 8)); // the corner: turning right again
  keys.push(K(WALK.from.c, [X, 1.6, WALK.from.z], [X, 1.4, WALK.from.z + 4], 8)); // north along the promenade
  // what the eye goes to on the way, as a turn of the head off the line (metres to the side at 4 m ahead, and up): chapter, side, rise.
  // In Halifax there is none: he asked to just walk, no look left to the marks (2026-09-27); they stand where the walk brings
  // them into the frame. Elevate's is looked at once Toronto's text card has climbed past it on the left of the screen
  const glance: Array<[number, number, number]> = [
    [9.5, 0.2, 0.1], [9.6, 0.85, 0.42], [9.74, 1.0, 0.5], [9.88, 0.3, 0.2], [10.0, -0.75, 0.2], [10.16, -0.85, 0.3], [10.32, -0.3, 0.12], [10.44, 0, 0], // the whale on the left and Web Summit's mark past it, then the seaplane lifting off the harbour on the right
    [10.62, 0, 0], [10.7, -0.9, 0.34], [10.8, -1.0, 0.4], [10.9, -0.1, 0.2], [10.99, 0.4, 0.12], [11.08, 0.85, 0.12], [11.2, 0.85, 0.1], [11.3, 0.1, 0], [11.38, 0, 0], // the tower over the water as the mist lifts, then Elevate's mark on the left
    [12.72, 0, 0], // Halifax: straight on, to Volta's door
  ];
  const off = (c: number): [number, number] => {
    let k = 0;
    while (k < glance.length - 1 && c >= glance[k + 1][0]) k++;
    const a = glance[k], b = glance[Math.min(glance.length - 1, k + 1)];
    if (c <= a[0] || a === b) return c <= a[0] ? [a[1], a[2]] : [b[1], b[2]];
    const t = (c - a[0]) / (b[0] - a[0]), e = t * t * (3 - 2 * t);
    return [a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e];
  };
  const soft = [[TURN.toronto - MIST + 0.04, TURN.toronto + MIST - 0.04, 9], [TURN.halifax - MIST + 0.04, TURN.halifax + MIST - 0.04, 10]] as const; // the open-air thresholds: from, to, the set beyond
  const setAt = (c: number): number => (c < soft[0][1] ? 8 : c < soft[1][1] ? 9 : 10);
  const n = 36, c0 = WALK.from.c, c1 = TURN.volta - 0.02; // to the step before Volta's glass
  const marks = new Set<number>();
  for (let k = 1; k <= n; k++) marks.add(Math.round((c0 + ((c1 - c0) * k) / n) * 1000) / 1000);
  for (const [a, b] of soft) { marks.add(Math.round(a * 1000) / 1000); marks.add(Math.round(b * 1000) / 1000); }
  const edge = (c: number) => soft.some(([a, b]) => Math.abs(c - a) < 1e-6 || Math.abs(c - b) < 1e-6);
  const sorted = [...marks].sort((a, b) => a - b).filter((c) => edge(c) || !soft.some(([a, b]) => Math.abs(c - a) < 0.05 || Math.abs(c - b) < 0.05)); // a threshold's own key stands alone: no even key crowds it
  for (const c of sorted) {
    const z = walkZ(c), [side, rise] = off(c), from = soft.find(([a]) => Math.abs(c - a) < 1e-3), into = soft.find(([, b]) => Math.abs(c - b) < 1e-3);
    // the walk goes north: the land is toward +x, on the left; a glance to the left is +x
    keys.push(K(c, [X, 1.6, z], [X + side, 1.4 + rise, z + 4], from ? from[2] - 1 : into ? into[2] : setAt(c), from ? { blend: 0 } : into ? { blend: 1, soft: true } : {}));
  }
  // Volta: in at the door (it shuts behind him), the bar on the left (the coffee comes
  // up), on up the room past the rows with the screen ahead and the harbour under the glass on the right; to the
  // podium, round behind it, and a turn to the room: the rows, the harbour on the left, downtown on the right; then
  // the door into the wing
  const V = TURN.volta, zV = WALK.volta.z[0], zD = WALK.door, [px, , pz] = VOLTA_PODIUM;
  // where he is and which way he looks (degrees from the walk's own way, round through the harbour side), at an even pace: no step of the scroll is a lurch or a snap of the head
  const at = (c: number, x: number, z: number, heading: number, down = 0.25): DollyKey => K(V + c, [x, 1.6, z], [x + 4 * Math.sin((heading * Math.PI) / 180), 1.6 - down, z + 4 * Math.cos((heading * Math.PI) / 180)], 10);
  keys.push(at(0.06, X, zV + 1.0, 7)); // in: the room, the bar ahead on the left
  keys.push(at(0.18, X, zV + 2.9, 29, 0.35)); // the bar: a look toward the counter as the coffee comes
  keys.push(at(0.3, X, zV + 4.9, -15, 0.15)); // on up the room: the rows on the right, the screen over the podium ahead
  keys.push(at(0.42, X - 0.3, zV + 6.9, -48, 0.15)); // the harbour through the glass, as it was from the walk
  keys.push(at(0.5, X - 0.9, zV + 8.1, -78, 0.2));
  keys.push(at(0.58, px + 0.4, pz + 0.3, -122, 0.25)); // round the podium's end, the head coming round with him
  keys.push(at(0.66, px, pz + 0.8, -168, 0.3)); // behind it, facing the room: the rows, the harbour along the left
  keys.push(at(0.73, px, pz + 0.85, -195, 0.3));
  keys.push(at(0.8, px + 0.05, pz + 0.9, -210, 0.25)); // across the room to the window on downtown
  keys.push(at(0.88, px + 0.5, pz + 1.4, -252, 0.2)); // away, along the front wall
  keys.push(at(0.96, px + 1.2, pz + 1.9, -298, 0.2)); // the door ahead, open
  keys.push(at(1.03, X - 0.3, zD - 0.9, -338, 0.25));
  keys.push(K(WALK.out, [X, 1.6, zD - 0.6], [X, 1.3, zD + 3.4], 10, { blend: 0 })); // the jamb
  // the wing: in through the door, up the steps (the rise spread over the stride, the way an eye takes stairs), and
  // along the stage from its side to the centre, slowing into the stop where the degree is handed over
  const T = TOUR_GAIN, N = TOUR_SHIFT, P = (x: number, y: number, z: number): V3 => [x, y, z + N];
  const S = STAGE.height, w0 = STAGE.wing[0];
  keys.push(K(12.08 + T, P(X, 1.6, w0 + 0.9), P(X, 1.4, w0 + 4.9), 11, { blend: 1 }));
  keys.push(K(12.22 + T, P(X, 1.6 + S, 27.3), P(X, 1.45 + S, 31.3), 11)); // up on the stage
  keys.push(K(12.36 + T, P(X, 1.6 + S, 29.4), P(X, 1.4 + S, 33.4), 11));
  keys.push(K(12.5 + T, P(X, 1.6 + S, 31.5), P(X, 1.4 + S, 35.5), 11));
  keys.push(K(12.66 + T, P(X, 1.6 + S, STAGE.centre), P(X, 1.4 + S, STAGE.centre + 4), 11)); // the centre: the degree
  // the turn to the hall: a quarter chapter right, from +z to +x, the crowd on its feet
  keys.push(K(12.78 + T, P(X, 1.6 + S, STAGE.centre), P(X + 2.0, 1.45 + S, STAGE.centre + 3.5), 11));
  keys.push(K(12.9 + T, P(X, 1.6 + S, STAGE.centre), P(X + 3.6, 1.5 + S, STAGE.centre + 1.8), 11));
  keys.push(K(13 + T, P(X, 1.6 + S, STAGE.centre), P(X + 4, 1.55 + S, STAGE.centre), 11)); // facing the crowd
  // off: straight on along the stage, the degree crushed in the fist on the way and thrown into the bin backstage
  // (flight.ts DEGREE, a glance down at it), past the leg to the door in the north wall
  const Dr = STAGE.door, ST = FLOQER.stair, SY = (z: number) => 1.6 + stairY(z), Z0 = FLOQER.z[0], Z1 = FLOQER.z[1], E = FLOQER.floor + 1.6;
  keys.push(K(13.14 + T, P(X, 1.6 + S, 34.3), P(X + 2.0, 1.5 + S, 37.8), 11)); // turning back to the stage's length
  keys.push(K(13.28 + T, P(X, 1.6 + S, 35.8), P(X + 0.2, 1.3 + S, 39.8), 11));
  keys.push(K(13.45 + T, P(X, 1.6 + S, 38.2), P(X - 0.5, 1.1 + S, 42.2), 11)); // the bin ahead on the right
  keys.push(K(13.62 + T, P(X, 1.6 + S, 40.6), P(X - 0.8, 0.95 + S, 44.4), 11)); // and in it goes
  keys.push(K(13.8 + T, P(X, 1.6 + S, 43.0), P(X - 0.1, 1.35 + S, 47.0), 11)); // past the leg, backstage
  keys.push(K(14 + T, P(X, 1.6 + S, 45.6), P(X, 1.4 + S, 49.6), 11)); // the door ahead, opening
  keys.push(K(14.12 + T, P(X, 1.6 + S, Dr.z - 0.6), P(X, 1.4 + S, Dr.z + 3.4), 11, { blend: 0 })); // the jamb
  // Floqer's house, round it: in, left along the south side past the foot of the T, up the west side by the windows on
  // Toronto, right along the north side under the mark on the brick, to the stair on the east wall
  keys.push(K(14.24 + T, P(X, E, Dr.z + 0.9), P(X - 0.6, E - 0.2, Dr.z + 4.9), 12, { blend: 1 })); // in: Floqer's
  keys.push(K(14.42 + T, P(-11.4, E, Z0 + 1.75), P(-14.8, E - 0.3, Z0 + 3.2), 12)); // left: the foot of the T, the monitors back to back
  keys.push(K(14.6 + T, P(-13.2, E, Z0 + 2.05), P(-16.4, E - 0.2, Z0 + 3.4), 12)); // the windows ahead: Toronto
  keys.push(K(14.78 + T, P(-14.9, E, Z0 + 2.7), P(-16.0, E - 0.15, Z0 + 6.6), 12)); // at the west wall, turning up it
  keys.push(K(14.96 + T, P(-15.55, E, Z0 + 4.6), P(-14.2, E - 0.35, Z0 + 8.2), 12)); // up the room: the bar of the T on the right, the screens
  keys.push(K(15.14 + T, P(-15.6, E, Z0 + 6.8), P(-13.6, E - 0.3, Z0 + 10.2), 12));
  keys.push(K(15.32 + T, P(-15.2, E, Z0 + 8.85), P(-11.4, E + 0.1, Z0 + 11.7), 12)); // turning right, along the north side: the brick
  keys.push(K(15.5 + T, P(-13.3, E, Z0 + 9.3), P(-9.8, E + 0.2, Z0 + 11.6), 12)); // the mark on the brick
  keys.push(K(15.68 + T, P(-11.1, E, Z0 + 9.3), P(-7.3, E, Z0 + 9.8), 12));
  keys.push(K(15.86 + T, P(-8.8, E, Z0 + 9.25), P(-5.0, E + 0.1, Z0 + 9.5), 12)); // the stair ahead on the east wall
  keys.push(K(16.04 + T, P(-6.5, E, Z0 + 8.7), P(ST.x, E + 0.3, ST.z0 + 1.4), 12)); // turning to it
  keys.push(K(16.18 + T, P(ST.x, E, ST.z0 - 0.7), P(ST.x, E + 0.9, Z1), 12)); // its foot: the door at the top, straight ahead
  keys.push(K(16.32 + T, P(ST.x, SY(ST.z0 + 0.9), ST.z0 + 0.9), P(ST.x, SY(ST.z0 + 0.9) + 0.6, Z1), 12)); // climbing
  keys.push(K(16.48 + T, P(ST.x, SY(Z1 - 0.9), Z1 - 0.9), P(ST.x, SY(Z1 - 0.9) - 0.1, Z1 + 0.2), 12)); // the top step: his door, opening
  keys.push(K(16.62 + T, P(ST.x, SY(Z1 - 0.4), Z1 - 0.4), P(ST.x, SY(Z1 - 0.4) - 0.12, Z1 + 1.6), 12)); // the door open, the passage beyond
  keys.push(K(16.72 + T, P(ST.x, SY(Z1 - 0.1), Z1 - 0.1), P(ST.x, SY(Z1 - 0.1) - 0.1, Z1 + 2.4), 12, { blend: 0 })); // the jamb
  // home: along the apartment's own passage and in at its front door, to where the room is all in view, and the story stops
  keys.push(K(16.84 + T, HOME.to([-5.45, 1.58, 3.3]), HOME.to([-5.5, 1.45, 0.4]), 0, { blend: 1 })); // in the passage
  keys.push(K(16.96 + T, HOME.to([-5.45, 1.58, 2.5]), HOME.to([-5.9, 1.4, -0.4]), 0)); // the front door
  keys.push(K(17.1 + T, HOME.to([-5.45, 1.58, 1.9]), HOME.to([-6.5, 1.35, -0.8]), 0)); // home: the bed, the window, the desk
  keys.push(K(17.2 + T, HOME.to([-5.45, 1.58, 1.9]), HOME.to([-6.5, 1.35, -0.8]), 0)); // and the story stops here
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
