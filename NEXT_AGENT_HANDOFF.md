# Portfolio journey: next-agent handoff

## Start here (2026-09-27)

Read [38, the playbook](docs/rebuild/38-stage-playbook.md) first: how the stage is built, the working loop, the tools, the traps. Then [37](docs/rebuild/37-nits-round-one.md) for the last round and [34](docs/rebuild/34-the-walk.md) for the walk. Everything below the line is older and partly superseded (set count, span, the tour as rooms, tool paths).

- He is finishing, not building: nits, judged pixel by pixel in his own Chrome. One thing at a time, the thing he named.
- Thirteen sets. 8 `vancouver`, 9 `toronto`, 10 `halifaxVolta` are one 60 m promenade; its script is `src/lib/stage/walk.ts`, its geometry `src/lib/stage/walk-built.ts`.
- `STAGE_SPAN` is 19.2. Keys after the tour sit `TOUR_GAIN` (2) later; sets 11 and 12 stand `TOUR_SHIFT` (28.12 m) north by `StageSet.at`.
- The end is walked: set 0 stands behind Floqer's stair door from chapter 15.4 (`HOME`). Google's door opens into the 2020 room, which stands in two places (`DELHI`). The dolly has two cuts: the phone's and that room's return.
- On the walk: one number a city on the paving (`MARKS`), four marks standing on the left (`SIGNS`: Web Summit, Elevate, Invest Nova Scotia, Volta). No head turns in Halifax. Only his own figures go in.
- Sets 8 and 9 are lit live, on purpose. The rest are baked; a baked set shows a code change only after its bake.
- Tools are in `scripts/look/` (tracked). Older notes name `.cache/*.mjs`: same tools, earlier copies.
- Doors: a case and a leaf cut to it, `DOORS` in sets.ts. A new door goes through `doorway()`; never place a bare leaf.
- Local commits only. Never push. Commit when he asks.

### Open

- The pendant lamp hangs upside down in Sydney (set 7) and Floqer's (set 12). Fixed in the apartment only; he has not been asked.
- What the $70k is made of.
- The glances in Vancouver and Toronto stand; in Halifax he asked to "just walk".
- `src/pages/story-draft.astro`: a manuscript page for discussion; its dates and Bean's status are unreviewed.
- Light theme unchecked. The apartment's passage is a flat warm orange.

---

Updated 2026-09-09. Supersedes the Codex export of the same day. Read newest docs first: [27](docs/rebuild/27-sydney-hacker-house.md), [26](docs/rebuild/26-flight-rebuilt.md), [25](docs/rebuild/25-flight-auditorium-review.md), then [24](docs/rebuild/24-bean-journey-continuation.md) and [23](docs/rebuild/23-lecture-auditorium.md).

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
5. Exit through the door on the teacher's right into Sydney, Australia: build Bean's app in a room with a central messy table and computers. **Done 2026-09-09** (set 7, doc 27).
6. The Canada tour, laptop in hand, as simple booths and offices: Vancouver (Web Summit expo hall) → Toronto (an office, Elevate week) → Montréal (ALL IN conference floor) → Halifax (Volta's coworking floor). **Built** (sets 8 to 11, doc 28). No cafés (he has other ideas for those), no slogans on signs, facts only.
7. Dalhousie graduation, receive the degree. **Not started.**
8. Finish in Toronto, reusing the studio. **Not started.**

Corrections that stand: no landing before the phone transition; no campus photo on the phone; no opaque sphere clouds; arrive at the very back; Sydney is Australia; other students are wanted (only a first-person avatar is not). Keep the Toronto studio as approved (short first-room path, bed and prominent desk, 51st-floor view, near white CN Tower, thinned skyline).

## State on disk

Twelve sets in `src/lib/stage/sets.ts`: 0 `now`, 1 `room`, 2 `lab`, 3 `plaza`, 4 `delhi`, 5 `flight`, 6 `halifax`, 7 `sydney`, 8 `vancouver`, 9 `toronto`, 10 `montreal`, 11 `halifaxVolta` (the tour: four shell rooms in a row east of the hacker house, live, not baked yet). The ring was cut at the studio's brick door: the passage there is now the jet bridge. Neighbour visibility no longer wraps (index distance only).

- `src/lib/stage/shot.ts`: `STAGE_SPAN = 12` and `ch(c) = c / STAGE_SPAN`. Stage progress is read off the chapter articles' positions (stage-run.ts `progress()`), and `window.__stage.yFor(q)` gives the scroll for a q (the audit scripts use it). Every key (dolly, `FLIGHT`, `PHONE`, door and drop windows, tests) is written in chapter lengths, so adding a set means raising the span and appending keys after `ch(7.62)`; nothing earlier moves. Chapter cards: 2020 on the Delhi room, 2022 on the descent, 2023 on the aisle, the podium and the exit, 2024 on Sydney, 2025 "Bean on the road" on the Sydney exit and the Vancouver seawall (cards are centred on integer chapters; see doc 28).
- `src/lib/stage/dolly.ts`: `APPROACH_SCALE = ch(4.2)` compresses the first five rooms; boarding to ch(4.7); the descent to `PHONE.transfer` ch(5.215) (the one portal cut); seated pause to ch(5.53); the aisle ch(5.6) to ch(6.2) via `aisle(z)`; the dais; the hold behind the lectern ch(6.52) to ch(6.64); right along the dais and out of the front west door (jamb ch(7.06)) into Sydney; the table, the whiteboard, the harbour; hold from ch(7.62). Step and turn bounds in `tests/stage/dolly.test.ts` scale with `STAGE_SPAN`.
- `src/lib/stage/flight.ts`: `FLIGHT` (0.672 to 0.721, 385 → 130 m, 1,450 m of track, 7° bank, deck at `FLIGHT_DECK` 300 m, then level at `cruise`), `PHONE`, `WINDOW_VIEW` (the front row, z −8.5), `CLASSROOM_VIEW`, `flightAt(q)` → altitude, travel, bank, veil; `crossingZ()` for the cloud cluster on the track.
- `src/scripts/stage-run.ts`: `flightRoll` (at the cabin, rotates with the bank, the sky inside it) ⊃ `flightWorld` (sinks and slides; every `live: 'flight'` prop). The veil is a `.veil` div over the stage. `live.drops` lowers `Placement.drop` things. `downlight` props get point lights only when a set is not baked. The phone capture uses `dolly(PHONE.reveal)`.
- Halifax: `npm run stage:halifax` (`scripts/stage-halifax.mjs`, caches `.cache/osm/halifax.json` 25 MB and `.cache/osm/dalhousie.json`, `--fetch` re-asks Overpass with a User-Agent) → `src/lib/stage/halifax.json` (312 KB, the city less the campus box) and `src/lib/stage/dalhousie.json` (62 KB, the Studley campus by name: kinds, heights, roofs, paths, car parks, Wickwire, trees). Origin 44.63892, -63.58473 (420 m east of University Avenue), heading 340°. `halifax.ts` extrudes the city (facade tile, hip roofs on houses, street trees); `dalhousie.ts` builds the campus (Hicks tower, Dalplex dome, quad, lawns, 300 trees). `HALIFAX_CAMPUS` in sets.ts is the Goldberg footprint; the authored model (`scripts/stage-flight-campus.py`) stands on it at `rot [0, 90, 0]`. Ground layers use `Mat.layer` (polygon offset).
- Cabin: `CABIN_WINDOWS` (seven a side), panes in `cabinGlass` (`Mat.alpha`, always live: `LIVE_SURFACE`), `seatScreen` × 12 and `bulkheadScreen` (paint `screenMap`), `aircraftWing` (root leading edge z −5.9, engine at x −9.8), `boardingPassage` in `bridgeWall`/`bridgeFloor`.
- Auditorium: `DAIS`, `lectern`, `laptopSlide` (paint `screenSlide`: title, "Taught by Vansh Sood", the ShiftKey Labs mark from `shiftkeyLabs()`), `projectorScreen` (`live: 'drop'`, `drop: [0.8, 0.9, 2.2]`), 15 `downlight` props, `aisleHeight(z)`.
- Phone: `src/scripts/stage-phone.ts` (bevelled frame, glass sheen, island, status bar canvas).
- Doorways crossfade (no light dip, no flare): `frame()` in stage-run.ts lerps exposure, fog, hemisphere, sun colour/intensity/direction and shadow strength by the doorway `blend`; only the environment map switches in `enter()`. Neighbour sets are always visible both ways. `.cache/seams.mjs out step` scores frame-to-frame change along the stage (`Q0`, `Q1`, `KEEP`, `WAIT`): the only intended spike is the phone portal at 0.745. Every door leaf must be open before its jamb (`tests/stage/sets.test.ts`).
- Sydney (set 7): the Opera House is a Sketchfab model (source kind `sketchfab`: the glTF is downloaded by hand with an account into `.cache/polyhaven/<id>/<id>.glb`; `skin` and `drop` in the manifest adapt it); the logo is `public/assets/stage/bean-logo.png` from beanmeals.com. `dalhousie`-style code props in built.ts (`hackerTable`, `sydneyWindow`, `sydneyHarbour`, `whiteboardBean`, `beanPoster`, `phoneBean`, `laptopBean`, `laptopBeanCode`, `monitorPH`, `doorLeafWide`), paints in `BEAN_PAINT` (stage-paint.ts, `beanMark`). The harbour is an unlit backdrop (`live: 'city'`).
- Bakes: `npm run stage:bake -- 5 128 2048 512 0` (1.5 MB), `npm run stage:bake -- 6 128 2048 512 0.002` (4.1 MB, the 5 MB cap), `npm run stage:bake -- 7 128 2048 512 0.002` (3.9 MB). Re-bake 5 after any cabin, wing or bridge change; 6 after any seat, wall, dais or light change. Live things (flight world, screens, the dropping screen, panes) need no bake.

Verification at handoff (2026-09-09): `npm test` 81 pass, `npm run check` 0 errors, `git diff --check` clean, headless captures of the descent and the walk in `.cache/` (`fb2/`, `ab/`) with no browser errors.

## Open

- **Students.** Realistic seated people need BlenderKit Full or files the user supplies (candidates and the Renderpeople terms are in doc 24). Do not fake them with primitives. When they arrive: deploy the seat pans where they sit (`auditoriumSeat` folds them), re-bake set 6.
- **The held laptop** (`heldLaptop`, `TOUR_SETS`, `TOUR_PAGE` in stage-run.ts) rides the camera through the tour sets; its screen is live (`tourLive` in stage-paint.ts, repainted every 80 ms), with the numbers page per city.
- **Baking sets 8 to 11** once he is happy with them; **the degree, Toronto.** Sets 8+ after Sydney (its west wall has the window; a door would go in the south wall past the kitchen or the north wall). Toronto reuses set 0 and needs an explicit neighbour rule (the wrap is gone).
- The clouds are billboarded cumulus (`cloudField`, `cloudPuffs`, `cloudMaterial`); the quads are not depth-sorted among themselves.
- `halifax.json` could be trimmed further (far buildings) if page weight matters.

## Tools

- Blender `/Applications/Blender.app/Contents/MacOS/Blender`; Chrome for headless captures; `playwright-core` from `~/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core`.
- `.cache/halifax-audit.mjs out q…` (waits for the camera to match the dolly, `URL`, `W`, `H`, `REDUCE`), `.cache/shoot.mjs`, `.cache/campos.mjs`, `.cache/dollycheck.ts` (per-step speed and turn), `.cache/errs.mjs` (page errors).
- Flags: `?debug&tier=1` for audits, `?live` for unbaked geometry, `?set=i&cam=x,y,z,lx,ly,lz` for a pinned camera, `?export=i` for the bake export.
- Do not run `npm run check` or `npm run build` while a bake's export step is starting.
