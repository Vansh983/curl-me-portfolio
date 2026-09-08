// Scroll is the flight clock. No timers: rewinding and direct chapter jumps give the same view.
import { AUDITORIUM, TOP_ROW } from './sets.ts';
const ease = (v: number) => { const t = Math.max(0, Math.min(1, v)); return t * t * (3 - 2 * t); };
export const FLIGHT = { start: 0.703, campus: 0.778, end: 0.818, altitude: 55 } as const;
export const PHONE = { raise: 0.778, framed: 0.793, zoom: 0.801, filled: 0.818, transfer: 0.822, reveal: 0.830 } as const;
// Seated 1.28 m above the highest tier, behind its desk. Arrival and the entire final beat hold here.
export const CLASSROOM_VIEW = { cam: [AUDITORIUM.studyX, TOP_ROW.height + 1.28, TOP_ROW.seat - 0.02] as [number, number, number], look: [4.9, 1.95, -16.8] as [number, number, number], fov: 74 };
export const WINDOW_VIEW = { cam: [-4.72, 1.45, -6.4] as [number, number, number], look: [-7.72, 0.58, -6.4] as [number, number, number], fov: 74 };

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

export function flightAt(progress: number, reducedMotion = false) {
  const q = Number.isFinite(progress) ? progress : 0;
  const travel = ease((q - FLIGHT.start) / (FLIGHT.end - FLIGHT.start));
  return {
    altitude: FLIGHT.altitude,
    travel: reducedMotion ? 64 : travel * 64,
  };
}
