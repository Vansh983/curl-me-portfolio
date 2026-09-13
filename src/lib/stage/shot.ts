// Section scroll to stage progress. Pure.
import { clamp01 } from '../lerp.ts';

/** How many chapter lengths the stage runs over: the Toronto studio on chapter 0, the podium in Halifax at chapter 7, the Sydney hacker house on chapter 7, then Vancouver, Calgary, Toronto and Halifax on 8 to 11; after that the camera holds. */
export const STAGE_SPAN = 14.6;
/** How many chapter lengths the last card runs: the walk out of the hall through Floqer's house and home happens under it, ending just inside his front door. */
export const LAST_SPAN = 2.6;

/** Stage progress at chapter `c`: keys are written in chapter lengths, so adding a set (raising the span) leaves every earlier scroll position where it was. */
export const ch = (c: number): number => c / STAGE_SPAN;

/** Section progress over all chapters to stage progress: the stage covers `span` chapter lengths from the first, then the camera holds. */
export const stageProgress = (p: number, chapters: number, span: number): number =>
  clamp01((p * (chapters - 1)) / Math.max(1, span));
