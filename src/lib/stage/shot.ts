// Section scroll to stage progress. Pure.
import { clamp01 } from '../lerp.ts';

/** How many chapter lengths the stage runs over: the Toronto studio on chapter 0, the podium in Halifax at chapter 7, the Sydney hacker house on chapter 7, then Vancouver, Calgary, Toronto and Halifax on 8 to 11; after that the camera holds. */
export const STAGE_SPAN = 15.6;
/** How many chapter lengths the last card runs: the walk out of the hall through Floqer's house and home happens under it, ending just inside his front door. */
export const LAST_SPAN = 2.6;
/** Cards that run more than one chapter length: the Google card (3) runs two, for the plaza, the stair and the balcony. Every other card runs one; the last runs LAST_SPAN. */
export const CARD_SPAN: Record<number, number> = { 3: 2 };
/** The chapter at which card `i` begins: the spans of the cards before it. */
export const chapterStart = (i: number): number => { let c = 0; for (let k = 0; k < i; k++) c += CARD_SPAN[k] ?? 1; return c; };

/** Stage progress at chapter `c`: keys are written in chapter lengths, so adding a set (raising the span) leaves every earlier scroll position where it was. */
export const ch = (c: number): number => c / STAGE_SPAN;

/** Section progress over all chapters to stage progress: the stage covers `span` chapter lengths from the first, then the camera holds. */
export const stageProgress = (p: number, chapters: number, span: number): number =>
  clamp01((p * (chapters - 1)) / Math.max(1, span));

/**
 * The first five rooms' keys are written at q 0..1 over 4.2 chapters, the Google walk from 0.578 (the lab's jamb) to 0.808
 * (the 2020 room's jamb). With the Google card running two chapter lengths that walk stretches over 1.96 chapters and
 * the 2020 room's keys sit one chapter later; the rooms before are where they were.
 */
export const approach = (q: number): number => {
  if (q <= 0.578) return ch(q * 4.2);
  if (q <= 0.808) return ch(2.4276 + ((q - 0.578) / 0.23) * 1.966);
  return ch(q * 4.2 + 1);
};
