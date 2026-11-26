# 59. One flight, with room between the cities

2026-10-26. Keep the direction of the mobile walk, but make the drawings more accurate and less generic. Only the move to university gets an animated flight. It must cross a real visual gap between Delhi and Halifax. Reduce the repeated jumping.

## Direction contract

Preserve the eight grouped chapters, exact source paragraphs, normal text spacing, taller character and existing palette. Insert open travel space in the illustrated world, not blank space between paragraphs. Give the single university flight a departure apron, takeoff, sustained cruise, descent and arrival. Keep one low hop by the childhood football and retain deliberate tap/keyboard jumping.

Refine every landmark with consistent fine linework and legible objects. Saved photographs govern Goldberg's glass and name, Google's San Francisco sign, Volta's sloped glazing, harbour clock tower, projection wall and red chairs, and Floqer's foam tiles, steel windows, desk and whiteboard. Other drawings represent objects in the source story without claiming to reproduce undocumented rooms. Remove the invented oxygen crate. No new factual claims, repeated company locations, paragraph scenes or separate Disrupt ending.

Check the whole route at phone sizes, flight departure/cruise/arrival in both directions, source coverage, reduced motion, the grounded ending and no-JavaScript reading. Use the existing dev server and headless Chrome, checks and tests, no build or publication.

## Built

`story-path.ts` adds an 800-unit gap before university; `activities.ts` puts one 620-unit Delhi–Halifax flight inside it. The aircraft has an engine, retracting gear, takeoff pitch, sustained cruise and descent. The existing university paragraph provides travel time, without text spacers. One 12-unit childhood hop replaces four 35-unit hops; arms are quieter and deliberate jumps peak at 28px.

All eight SVG landmarks use finer linework and more specific objects: Google's San Francisco sign and bridge, Goldberg's blue glazing, Bean's orange mark, Volta's wall projection and red chairs, and Floqer's foam microtiles, blinds, white tower and whiteboard columns. The oxygen crate is removed. Undocumented rooms remain stylised representations.

References: `public/assets/stage/photos/google-sign.jpg`, `public/assets/scenes/dalhousie-goldberg.webp`, `public/assets/stage/bean-logo.png`, and the saved photographs documented in [40](./40-volta-interior-reference.md) and [43](./43-hacker-house-reference.md). The eight groups, 22 source paragraphs and global identity are unchanged.

## Finish review

**Resolved. Ship.** The sole finding was a brief return to Webcube's selling pose after landing. The suitcase now hands directly to university walking at distance 2185. Fresh headless captures confirm both directions; no material findings remain.

## Verification

Headless evidence: `.cache/walk-refined/report.json`, `sheet.png`, flight and endpoint captures; `handoff-report.json` and eight forward/reverse landing captures. Flight reversal, 320, 375, 390 and 430px widths, grounded endings, reduced motion and no JavaScript pass; no runtime errors. At 4x CPU: 239 frames, 16.67 ms average, 16.8 ms p95, none over 34 ms. Final tests: 104 passed. Astro check: 0 errors, 0 warnings, 25 hints. No build, commit or publication; live Chrome was not inspected.
