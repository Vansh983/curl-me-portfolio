// Clamps stage scroll progress to the unit interval.
export const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);
