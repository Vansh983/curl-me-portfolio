# 26. The flight, the phone and the auditorium, rebuilt

2026-09-08. Answers the review in [25](25-flight-auditorium-review.md).

## What changed

- **Stage span.** `STAGE_SPAN = 7` in `shot.ts`: the stage runs over seven chapter lengths, not `SETS.length - 1`. The first five rooms keep their choreography at `APPROACH_SCALE = 0.6` (the 2020 card sits on the Delhi room, 2022 on the descent, 2023 on the walk down the aisle). Step and turn bounds in the dolly test scale with the span.
- **The flight flies.** `flight.ts`: a descent from 420 m to 130 m over q 0.675 to 0.745 while the ground runs 1,500 m up the peninsula; a 7° bank through the middle; a cloud deck at 335 m the cabin sinks through (two painted sheets in the world plus a white veil over the frame). `stage-run.ts` keeps the world in `flightRoll` (rotates with the bank, the sky with it) ⊃ `flightWorld` (sinks and slides). Reduced motion holds the end: low, level, the campus abeam.
- **Halifax from OpenStreetMap.** `scripts/stage-halifax.mjs` → `src/lib/stage/halifax.json` (324 KB, 100 KB gzipped): 3,884 buildings, 645 streets, the sea flood-filled from the coastline on a 5 m grid (the harbour, the Northwest Arm, Georges Island), 10 lakes, 41 parks and woods, all in the aircraft's frame about a point 350 m east of Goldberg on a 340° track. `halifax.ts` extrudes it with per-building tints under the sun. The authored Goldberg model stands on its footprint, without its old context blocks.
- **The cabin.** Seven smaller oval windows a side with a real pane (live, alpha 0.16), the moving map on every seat back and the front bulkhead, a swept wing with winglet and engine outside the third-row window, a jet bridge in grey panel with ribs and a light strip. No banner.
- **The phone.** Bevelled titanium frame, glass sheen, camera island, a drawn status bar. The zoom and the single cut stay. The capture camera is `dolly(PHONE.reveal)`, no magic number.
- **The auditorium.** A dais across the front (`DAIS`), a lectern right of centre with a gooseneck mic and the presenter's laptop, 15 downlights (baked), a projection screen that comes down over the board between q 0.8 and 0.9 with the Generative AI slide (`live: 'drop'`, `Placement.drop`). The seated pause (0.745 to 0.79), the rise, the walk down the central aisle over `aisleHeight(z)` to 0.932, the turn on the dais, and the hold behind the lectern facing the hall at q 1.
- Bakes: set 5 `npm run stage:bake -- 5 128 2048 512 0`, set 6 `npm run stage:bake -- 6 128 2048 512 0.002`.

## Still open

- Students in the seats: blocked on licensed seated models (see the handoff). The turn at the dais faces an empty hall until then.
- Sydney, Vancouver, graduation, the return to Toronto: not started. Each will extend `STAGE_SPAN` and shift the podium off the 2024 card.
