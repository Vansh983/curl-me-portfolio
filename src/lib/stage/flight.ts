// Scroll is the flight clock. No timers: rewinding and direct chapter jumps give the same view.
// The aircraft never moves: the world under it does (stage-run.ts: the flight group), sinking as the
// altitude falls, sliding aft as the ground track runs, rolling for the bank onto the approach.
import { AUDITORIUM, TOP_ROW, FLIGHT_DECK } from './sets.ts';
import { ch, TOUR_GAIN } from './shot.ts';
const ease = (v: number) => { const t = Math.max(0, Math.min(1, v)); return t * t * (3 - 2 * t); };
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * The descent over the Halifax peninsula, seated at the port window. From `start` to `end` the ground track
 * runs `distance` metres up the peninsula while the altitude falls from `top` to `low`; the cloud deck at
 * `deck` metres is crossed on the way down, and the aircraft banks a few degrees to port in the middle of it.
 * At `end` the Studley campus is abeam, 250 to 900 m off the wing and `low` metres down; after it the aircraft holds
 * height and the ground keeps sliding at `cruise` metres per unit of progress (the speed the descent ended at).
 */
const DESCENT = { start: ch(5.704), end: ch(6.047), distance: 1450 };
export const FLIGHT = { ...DESCENT, top: 385, low: 130, deck: FLIGHT_DECK, bank: 7, cruise: (0.35 * DESCENT.distance) / (DESCENT.end - DESCENT.start) } as const; // cruise: the ground speed the descent ends at, per unit of progress
/** The handset: raised off the lap, framed, then zoomed through until it fills the viewport; the single cut to the auditorium at `transfer`. */
export const PHONE = { raise: ch(6.012), framed: ch(6.075), zoom: ch(6.103), filled: ch(6.194), transfer: ch(6.215), reveal: ch(6.264) } as const;
/** The coffee at Volta: into the hand at the bar, held through the room, set down before the wing's door. */
export const COFFEE = { raise: ch(13.0), held: ch(13.12), down: ch(13.82), gone: ch(13.94) } as const;
/**
 * The degree: raised into the hand over the last steps onto the stage and held up to the hall; then, walking off along
 * the stage, crushed in the fist (`crush`) and thrown into the bin that stands backstage by the walk (`thrown`).
 */
export const DEGREE = { raise: ch(12.56 + TOUR_GAIN), held: ch(12.7 + TOUR_GAIN), crush: [ch(13.2 + TOUR_GAIN), ch(13.42 + TOUR_GAIN)] as [number, number], thrown: [ch(13.5 + TOUR_GAIN), ch(13.68 + TOUR_GAIN)] as [number, number] } as const;
/** Seated 1.28 m above the highest tier, behind its desk: the arrival, and where the phone's screen looks from. */
export const CLASSROOM_VIEW = { cam: [AUDITORIUM.studyX, TOP_ROW.height + 1.28, TOP_ROW.seat - 0.02] as [number, number, number], look: [4.9, 1.95, -16.8] as [number, number, number], fov: 74 };
/** The window seat in the row by the door, the wing's leading edge behind the shoulder: eye at the window, looking out and a little down at the city. */
export const WINDOW_VIEW = { cam: [-4.4, 1.22, -5.5] as [number, number, number], look: [-7.4, 0.5, -5.7] as [number, number, number], fov: 74 };

export function phoneAt(progress: number, reducedMotion = false) {
  const q = Number.isFinite(progress) ? progress : 0;
  return {
    visible: !reducedMotion && q >= PHONE.raise && q < PHONE.reveal,
    raise: ease((q - PHONE.raise) / (PHONE.framed - PHONE.raise)),
    zoom: ease((q - PHONE.zoom) / (PHONE.filled - PHONE.zoom)),
  };
}

/** Rigid handset dimensions; its camera crop resolves to the viewport at the covered cut. */
export function phoneLayout(aspect: number, raise: number, zoom: number) {
  const a = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  const start = Math.min(1, a * 1.65), end = Math.max(2 * a / .7, 2 / 1.5) * 1.08; // cover rounded corners, not just the rectangle
  const scale = start + (end - start) * zoom;
  const initial: [number, number] = a > .7 / 1.5 ? [(.7 / 1.5) / a, 1] : [1, a / (.7 / 1.5)];
  return { scale, x: a * .28 * (1 - zoom), y: -2.6 * (1 - raise) * (1 - zoom),
    crop: [initial[0] + (.7 * scale / (2 * a) - initial[0]) * zoom, initial[1] + (1.5 * scale / 2 - initial[1]) * zoom] as [number, number] };
}

export interface FlightState { altitude: number; travel: number; bank: number; veil: number }

/**
 * Where the world is under the aircraft at stage progress q: altitude in metres, the ground track run so far,
 * the bank in degrees (positive rolls the horizon for a left turn), and the whiteout of the cloud deck, 0..1.
 * Reduced motion holds the end of the descent: the campus abeam, low, level, clear.
 */
export function flightAt(progress: number, reducedMotion = false): FlightState {
  const q = Number.isFinite(progress) ? progress : 0;
  const t = reducedMotion ? 1 : clamp01((q - FLIGHT.start) / (FLIGHT.end - FLIGHT.start));
  const altitude = FLIGHT.top + (FLIGHT.low - FLIGHT.top) * ease(t);
  const travel = FLIGHT.distance * (t * 0.35 + 0.65 * ease(t)) + (reducedMotion ? 0 : Math.max(0, clamp01(q) - FLIGHT.end) * FLIGHT.cruise); // never quite still: the ground always slides
  const roll = Math.sin(Math.PI * clamp01((t - 0.15) / 0.55));
  const bank = roll * roll < 1e-9 ? 0 : FLIGHT.bank * roll * roll; // rolls in, holds, rolls out through the middle of the descent
  const off = (altitude - FLIGHT.deck) / 45;
  const veil = Math.exp(-(off * off));
  return { altitude, travel, bank, veil: reducedMotion ? 0 : veil };
}

/** The ground under the aircraft (the flight frame's z) as it sinks through the cloud deck: where the cloud field puts its cluster on the track. */
export function crossingZ(): number {
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (FLIGHT.top + (FLIGHT.low - FLIGHT.top) * ease(m) > FLIGHT.deck) lo = m; else hi = m; }
  const t = (lo + hi) / 2;
  return FLIGHT.distance - FLIGHT.distance * (t * 0.35 + 0.65 * ease(t));
}
