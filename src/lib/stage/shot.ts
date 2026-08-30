// Section scroll to stage progress. Pure.
import { clamp01 } from '../lerp.ts';

/** Section progress over all chapters to stage progress: set k sits on chapter k, then the camera holds. */
export const stageProgress = (p: number, chapters: number, sets: number): number =>
  clamp01((p * (chapters - 1)) / Math.max(1, sets - 1));
