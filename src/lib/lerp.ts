import type { FigureParams } from './figure.ts';

export const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);
export const easeInOutSine = (t: number) => (1 - Math.cos(Math.PI * clamp01(t))) / 2;

// Recursive numeric lerp over the params shape. Non-numbers are taken from b.
function lerpAny<T>(a: T, b: T, t: number): T {
  if (typeof a === 'number' && typeof b === 'number') return (a + (b - a) * t) as T;
  if (a && b && typeof a === 'object') {
    const out: Record<string, unknown> = {};
    const A = a as Record<string, unknown>, B = b as Record<string, unknown>;
    for (const k of Object.keys(B)) out[k] = lerpAny(A[k], B[k], t);
    return out as T;
  }
  return b;
}
/**
 * Interpolates every number in the params tree.
 * @param a start params
 * @param b end params
 * @param t 0..1
 * @returns a at t<=0, b at t>=1, a blend between
 */
export function lerpParams(a: FigureParams, b: FigureParams, t: number): FigureParams {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return lerpAny(a, b, t);
}

// Scroll progress 0..1 over n chapters. Each gap between chapters is one span;
// the first DWELL of a span rests on chapter i, the last DWELL rests on i+1,
// the middle eases across.
const DWELL = 0.3;
/**
 * Maps section scroll progress to a chapter and an eased transition amount.
 * @param p progress 0..1 over the whole section
 * @param n number of chapters
 * @returns chapter index i and eased t toward chapter i+1 (0 while resting)
 */
export function locate(p: number, n: number): { i: number; t: number } {
  if (n <= 1) return { i: 0, t: 0 };
  const spans = n - 1;
  const q = clamp01(p);
  if (q === 1) return { i: n - 1, t: 0 };
  const x = q * spans;
  const i = Math.min(spans - 1, Math.floor(x));
  const frac = x - i;
  const raw = (frac - DWELL) / (1 - 2 * DWELL);
  const t = raw <= 0 ? 0 : raw >= 1 ? 1 : easeInOutSine(raw);
  return { i, t };
}
