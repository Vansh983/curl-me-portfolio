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

## Continuity pass (same evening)

He said the scenes had "breakpoints" and "areas of slippage". Measured with `.cache/seams.mjs` (frame-to-frame pixel difference every 0.004 of q, chapter text hidden): the spikes were the doorways. Two causes:

- Every door dipped the light to 12% and swapped the set at the midpoint, and the plaza was hidden until then: through the lab's south door the plaza was a white void that popped in. Now `frame()` crossfades exposure, fog, hemisphere, sun colour, intensity, direction and shadow strength from the set left to the set entered across the doorway (`blend`, smoothstepped); only the environment map switches at the midpoint. Neighbours are always visible both ways (`d <= 1`, no outdoor clause). The daylight flare is gone with the dip.
- The Delhi room's west door had a closed leaf timed to the old span (0.608 to 0.634): the walk hit it at 0.56 and saw its back for a dozen frames. Rehinged on the north jamb so it swings into the bridge, opening 0.535 to 0.56, ahead of the jamb at 0.57; a test now holds every leaf open before its jamb.
- The jet bridge's first section still had the old opening west to the studio (sky and wing showed through it) and no light, and the plaza's facade brick stood 6 cm inside the bridge's end wall. Walled up, lit, and the brick moved behind the wall. Sets 3 and 5 re-baked.

The phone portal remains the one intended cut. The other spikes left are fast turns (the dais, the rise from the seat), not cuts.

## Still open

- Students in the seats: blocked on licensed seated models (see the handoff). The turn at the dais faces an empty hall until then.
- Sydney, Vancouver, graduation, the return to Toronto: not started. Each will extend `STAGE_SPAN` and shift the podium off the 2024 card.
