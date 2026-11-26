# 58. A person doing things along the path

2026-10-26. The continuous path remains. Vansh asked for a taller character, jumps while travelling, several flights, and visible teaching, presenting and selling with a laptop in hand. Repeated screens cannot stand in for his whole life.

## Direction contract

Keep the eight grouped places, uninterrupted paragraph flow, personal ink-and-paper SVG world and one camera. Make the character taller with longer legs. Add reversible scroll-driven hops, flights and distinct activity poses. Coding keeps a workstation; teaching gets a pointer and class; selling gets a held laptop and conference objects; Collect. gets a microphone and demo gathering. University and Floqer remain single places. Disrupt remains a small part of Floqer.

Use the source story for travel and objects. Google/San Francisco, university/Halifax and Bean/Vancouver provide multiple flights. Sydney is the known Bean cofounder connection; do not turn it into a claimed personal visit without confirmation. Inspect mobile widths, intermediate motion, reverse scroll, reduced motion and keyboard/tap behavior in headless Chrome. Run checks and tests, never a build. Record the finish review and evidence after implementation.

## What changed

- `src/components/phone/Walker.astro` gives the existing pixel character longer legs and a height of 72.3 drawing units, up from 54. Five activities change his pose and what he holds: walking, travelling with a suitcase, teaching with a pointer, selling with a laptop, and presenting with a microphone. Tap and keyboard activation still make him jump.
- `src/lib/phone/activities.ts` adds four scroll-driven hops and three flights within the existing route: Delhi to San Francisco, Delhi to Halifax, and Halifax to Vancouver. Sine-squared arcs make takeoff, landing and hops meet the ground smoothly and reverse with scrolling. The plane carries the same character; the landscape keeps its permanent shapes. Reduced motion removes flights and hops and keeps the activity pose.
- `src/lib/phone/artwork.ts` gives each activity its own setting. ShiftKey has a class, diagram and trophy; Bean has a fridge, conference booth and signed MOU; Collect. has a Demo Day audience under Volta's rings and glass. Repeated monitors and laptops are reduced. Floqer's selling and presentation poses remain in its one workspace, with Disrupt still a small detail there.
- These details follow `src/data/story.ts`: the first international flight, the Halifax move, ShiftKey teaching, Bean's fridge beginnings and Vancouver conference, and Collect.'s Demo Day. Sydney stays a connection to Bean's cofounder. A personal Australia visit remains unconfirmed and is not depicted as a flight.
- `src/scripts/phone-walk.ts` combines the activities with the existing landscape translation. Review found that the final footer anchor lay beyond the reachable scroll position, leaving the character suspended in the last hop. Clamping that anchor to the maximum scroll position lets the walk reach its grounded ending.

The eight groups, all 22 verbatim source paragraphs, ordinary 18px paragraph gaps and continuous pavement remain. The source story and global site identity are unchanged; no global design documents were rewritten.

## Finish review

The final independent verdict was **Resolved. Ship.** Refreshed captures show grounded endings at 320, 375, 390 and 430px, visible footer links, and a grounded reduced-motion view at 390 × 844. The unreachable ending was the sole material finding and is closed. This review uses the source, headless captures and measured report; it does not claim live Chrome inspection or detector verification.

## Verification and limits

- Final headless capture: unchanged landmarks across scrolling; three flights in both directions; scroll hops; keyboard and tap jumps; visible footer links; no horizontal overflow at 320, 375, 390 and 430px. All four widths now reach a grounded ending. Reduced motion and no JavaScript pass; no runtime errors.
- Evidence: `.cache/walk-activities/report.json`, `sheet.png`, the three `flight-*.png` captures, `jump.png`, `floqer-present.png`, `end.png`, `end-320.png`, `end-375.png`, `end-430.png`, `reduced.png` and `no-js.png`. At 4x CPU throttle: 239 frames, 16.67 ms average, 16.8 ms p95, none over 34 ms.
- `npm test`: 103 passed before the final footer-anchor fix; the final browser assertions cover that fix. `npm run check` reran afterward: 0 errors, 0 warnings, 25 hints. No build, commit or push. This is headless evidence, not an inspection of his Chrome or a physical phone.
