// Easing curves and per-actor timing windows inside a station gap. Pure.
// A gap runs 0..1 (after the dwell at each end). An actor's timing picks a window of it
// and a curve, so furniture can drop in with a bounce after the walls have recoloured,
// or sink away with gravity's acceleration before the next thing appears.

export type EaseName = 'linear' | 'in' | 'out' | 'inOut' | 'bounce';
export interface Timing { start: number; end: number; ease: EaseName }

export const clamp01 = (v: number) => (v <= 0 ? 0 : v >= 1 ? 1 : v);

/** Standard curves. `in` and `out` are quadratic (constant acceleration, like gravity). */
export const EASE: Record<EaseName, (t: number) => number> = {
  linear: (t) => t,
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  inOut: (t) => (1 - Math.cos(Math.PI * t)) / 2,
  // a body dropped onto a surface: three diminishing bounces (restitution ~0.5)
  bounce: (t) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
};

export const FULL_GAP: Timing = { start: 0, end: 1, ease: 'inOut' };

/**
 * Where an actor is in its own window of the gap.
 * @param raw the gap's linear progress 0..1
 * @param w the actor's window; defaults to the whole gap with a sine ease
 * @returns 0 before the window, 1 after, eased inside
 */
export function timed(raw: number, w: Timing = FULL_GAP): number {
  const span = Math.max(1e-6, w.end - w.start);
  return EASE[w.ease](clamp01((raw - w.start) / span));
}
