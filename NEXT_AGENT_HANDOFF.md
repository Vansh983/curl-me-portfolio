# Portfolio journey: next-agent handoff

Updated 2026-09-08 (evening). Supersedes the Codex export of the same day. Read newest docs first: [26](docs/rebuild/26-flight-rebuilt.md), [25](docs/rebuild/25-flight-auditorium-review.md), then [24](docs/rebuild/24-bean-journey-continuation.md) and [23](docs/rebuild/23-lecture-auditorium.md).

## Start here

- Repository `/Users/vsood/work/curl-me-portfolio`, branch `canary`, review at `http://localhost:4321/`.
- Astro, TypeScript, three.js; authored geometry plus licensed models and textures; Blender 5.2 Cycles bakes; optimized GLB and WebP.
- Local commits only. Never push, deploy, buy, or change accounts.
- The dev server goes stale after larger edits: restart the listener on 4321 before trusting a headless capture (`.cache/campos.mjs` compares the browser camera with the dolly).

## Sequence the user asked for

1. Toronto studio → Delhi 2010 room → school lab → San Francisco plaza → Delhi Webcube room. **Done.**
2. Door into an aircraft, seated at the window while airborne, a 3D Dalhousie campus outside, a phone whose screen already shows the auditorium, zoom through it, arrive seated in the top row. **Done and rebuilt 2026-09-08.**
3. Large stepped auditorium, fixed seats. **Done** (96 seats, 8 tiers).
4. Seated pause, get up, walk down to the stage, turn to see the whole hall, teach Generative AI behind a podium with a laptop. **Done except the students.**
5. Exit through the door on the teacher's right into Sydney, Australia: build Bean's app in a room with a central messy table and computers. **Not started.**
6. Fly to Vancouver, present Bean, convey travelling across Canada building and fundraising (no invented cities, amounts, dates). **Not started.**
7. Dalhousie graduation, receive the degree. **Not started.**
8. Finish in Toronto, reusing the studio. **Not started.**

Corrections that stand: no landing before the phone transition; no campus photo on the phone; no opaque sphere clouds; arrive at the very back; Sydney is Australia; other students are wanted (only a first-person avatar is not). Keep the Toronto studio as approved (short first-room path, bed and prominent desk, 51st-floor view, near white CN Tower, thinned skyline).

## State on disk

Seven sets in `src/lib/stage/sets.ts`: 0 `now`, 1 `room`, 2 `lab`, 3 `plaza`, 4 `delhi`, 5 `flight`, 6 `halifax`. The ring was cut at the studio's brick door: the passage there is now the jet bridge.

- `src/lib/stage/shot.ts`: `STAGE_SPAN = 7`. Stage progress q runs over seven chapter lengths of the nine-chapter scroll; chapter cards: 2020 on the Delhi room, 2022 on the descent, 2023 on the walk down the aisle, 2024 on the podium hold. Adding a set means raising `STAGE_SPAN`, re-spacing the keys after the flight, and moving the podium off the 2024 card.
- `src/lib/stage/dolly.ts`: `APPROACH_SCALE = 0.6` compresses the first five rooms; boarding 0.57 to 0.675; `FLIGHT.start` 0.675 to `PHONE.transfer` 0.745 (the one portal cut); seated pause to 0.79; rise; the aisle 0.812 to 0.932 via `aisle(z)`; the turn; the hold behind the lectern at 1. Step and turn bounds in `tests/stage/dolly.test.ts` scale with `STAGE_SPAN`.
- `src/lib/stage/flight.ts`: `FLIGHT` (420 → 130 m, 1,500 m of track, 7° bank, deck at `FLIGHT_DECK` 335 m), `PHONE`, `WINDOW_VIEW`, `CLASSROOM_VIEW`, `flightAt(q)` → altitude, travel, bank, veil.
- `src/scripts/stage-run.ts`: `flightRoll` (at the cabin, rotates with the bank, the sky inside it) ⊃ `flightWorld` (sinks and slides; every `live: 'flight'` prop). The veil is a `.veil` div over the stage. `live.drops` lowers `Placement.drop` things. `downlight` props get point lights only when a set is not baked. The phone capture uses `dolly(PHONE.reveal)`.
- Halifax: `npm run stage:halifax` (`scripts/stage-halifax.mjs`, cache `.cache/osm/halifax.json` 25 MB, `--fetch` re-asks Overpass with a User-Agent) → `src/lib/stage/halifax.json` (324 KB). Origin 44.6375, -63.5832, heading 340°. `src/lib/stage/halifax.ts` extrudes it. `HALIFAX_CAMPUS` in sets.ts is the Goldberg footprint; the authored model (`scripts/stage-flight-campus.py`, no context blocks any more) stands on it at `rot [0, 90, 0]`.
- Cabin: `CABIN_WINDOWS` (seven a side), panes in `cabinGlass` (`Mat.alpha`, always live: `LIVE_SURFACE`), `seatScreen` × 12 and `bulkheadScreen` (paint `screenMap`), `aircraftWing` (root leading edge z −5.9, engine at x −9.8), `boardingPassage` in `bridgeWall`/`bridgeFloor`.
- Auditorium: `DAIS`, `lectern`, `laptopSlide` (paint `screenSlide`), `projectorScreen` (`live: 'drop'`, `drop: [0.8, 0.9, 2.2]`), 15 `downlight` props, `aisleHeight(z)`.
- Phone: `src/scripts/stage-phone.ts` (bevelled frame, glass sheen, island, status bar canvas).
- Bakes: `npm run stage:bake -- 5 128 2048 512 0` (1.5 MB), `npm run stage:bake -- 6 128 2048 512 0.002` (4.1 MB, the 5 MB cap). Re-bake 5 after any cabin, wing or bridge change; 6 after any seat, wall, dais or light change. Live things (flight world, screens, the dropping screen, panes) need no bake.

Verification at handoff: `npm test` 79 pass, `npm run check` 0 errors, `git diff --check` clean, headless captures of the descent and the walk in `.cache/` (`fb2/`, `ab/`) with no browser errors.

## Open

- **Students.** Realistic seated people need BlenderKit Full or files the user supplies (candidates and the Renderpeople terms are in doc 24). Do not fake them with primitives. When they arrive: deploy the seat pans where they sit (`auditoriumSeat` folds them), re-bake set 6.
- **Sydney, Vancouver, graduation, Toronto.** Each is a new set after 6; the teacher's right when facing +z is −x, so the front west door (x −1.4, z −15.8) is the exit to Sydney.
- The cloud deck is two painted sheets; a volumetric look would need a different approach.
- `halifax.json` could be trimmed further (far buildings) if page weight matters.

## Tools

- Blender `/Applications/Blender.app/Contents/MacOS/Blender`; Chrome for headless captures; `playwright-core` from `~/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core`.
- `.cache/halifax-audit.mjs out q…` (waits for the camera to match the dolly, `URL`, `W`, `H`, `REDUCE`), `.cache/shoot.mjs`, `.cache/campos.mjs`, `.cache/dollycheck.ts` (per-step speed and turn), `.cache/errs.mjs` (page errors).
- Flags: `?debug&tier=1` for audits, `?live` for unbaked geometry, `?set=i&cam=x,y,z,lx,ly,lz` for a pinned camera, `?export=i` for the bake export.
- Do not run `npm run check` or `npm run build` while a bake's export step is starting.
