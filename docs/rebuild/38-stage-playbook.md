# 38. The stage: how it is built and how to work on it (2026-09-27)

For the next agent, and for the next session. Read this before touching the 3D journey. History is in docs 11 to 37; this is the method.

## The five rules that save the most time

1. **Look before and after.** Capture the frames you will change, change, capture again. Never judge from code.
2. **Capture what he sees.** His screen has the text card on the left and the hero on top. A capture that hides them hides real faults (`CARDS=1`).
3. **Move the thing, not the camera.** He reads extra head turns as the camera doing too much ("just walk").
4. **Nothing invented.** Every figure, photo, logo and date is his own and checked. If it is missing, find the real one or ask.
5. **Build only what he named.** A flaw found nearby: fix it if it is a plain defect in the thing he named, otherwise tell him in one line.

## What the stage is

- One scroll drives one camera through 13 sets. No free camera, no physics, no figure of him: the camera is his eyes at 1.6 m.
- Stack: Astro page, three.js runtime, geometry written in TypeScript, a few licensed models, Blender Cycles lightmaps.
- Chapter `c` is the unit. Stage progress `q = c / STAGE_SPAN` (19.2). `window.__stage.yFor(q)` gives the scroll for a `q`.

| File | What it holds |
|---|---|
| `src/lib/stage/sets.ts` | The 13 sets: shell, light, fog, every placement. Named places (`CONDO`, `GOOGLE`, `DELHI`, `HOME`, `FLOQER`, `DOORS`) |
| `src/lib/stage/dolly.ts` | The camera's keys and the function from `q` to a frame |
| `src/lib/stage/walk.ts` | The walk's script: light by chapter, `MARKS`, `SIGNS`, `LAPTOP`, movers |
| `src/lib/stage/built.ts`, `walk-built.ts`, `door-built.ts` | Every code-built prop, by name (`BUILT`) |
| `src/lib/stage/shell.ts` | A room's floor, walls and ceiling with holes cut for doors and windows |
| `src/lib/stage/materials.ts` | Every material by name (`MATS`) |
| `src/lib/stage/assets.ts` | Every downloaded model and texture, its licence, its `skin` |
| `src/lib/stage/bake.ts` + `scripts/stage-bake.py` | What is baked and what stays live. Keep the two lists the same |
| `src/scripts/stage-run.ts` | The runtime: loads, lights, moves, draws |
| `src/scripts/stage-paint.ts` | Everything drawn on a canvas: screens, signs, photos, posters |
| `src/data/timeline.ts` | The text cards |

## The sets

| i | id | What | Lit |
|---|---|---|---|
| 0 | now | The apartment, Toronto, night. Start and end | baked |
| 1 | room | Delhi bedroom, 2010 | baked |
| 2 | lab | School lab, 2013 | baked |
| 3 | google | Googleplex lawn, 2019. No room | baked |
| 4 | delhi | The 2020 room. Stands in two places (`DELHI`) | baked |
| 5 | flight | Jet bridge, cabin, descent over Halifax | baked |
| 6 | halifax | Dalhousie auditorium | baked |
| 7 | sydney | Bean's hacker house | baked |
| 8, 9 | vancouver, toronto | The walk. Light changes by chapter | live, on purpose |
| 10 | halifaxVolta | The walk's end and Volta's room on the eighth floor | baked, own panorama |
| 11 | convocation | The stage and the degree | baked |
| 12 | floqer | Floqer's house, the stair home | baked, own panorama |

## Conventions that bite

- **Handedness.** Walking toward +z, +x is on the LEFT. Facing -x, right is -z. Check before placing anything "on the left".
- **Rooms are single-sided planes.** A wall seen from behind is invisible. Any line of sight that passes a wall on the outside shows nothing. This is the cause of most "gaps".
- **A prop faces +z** unless its comment says otherwise. `rot [0, 90, 0]` turns +z to +x.
- **Doors.** A case and a fitted leaf, from `DOORS`, placed with `doorway()`, `shutDoor()` or `opening()`. Never a bare leaf.
- **One set in two places.** To put a room behind another's door without moving what follows: `HOME` (set 0) and `DELHI` (set 4). The cut moves nothing in the frame.
- **Keys are written in chapters** (`ch(c)`), the first five rooms in raw `q` through `approach()`. Adding length means raising the span and moving only later keys.
- **The walk's keys are even** (36 over the walk). Do not pin extra keys between them: two keys 7 cm apart made the pace wobble. Put glance nodes on existing key chapters.
- **The text card** is on the left, x 36 to 500 of 1456, and climbs about 940 px a chapter. It crosses the middle band of the screen in each chapter's first half.

## Baked or live

- A baked set is drawn from `public/assets/stage/baked/set<i>.glb` with a lightmap. Code changes to it do nothing on screen until it is rebaked.
- Live in a baked set: anything painted (`paint:`), anything that moves (`live: 'door' | 'fan' | 'mover' ...`), backdrops (`DROP_PROP`), and `CONTEXT_PROP`.
- `CONTEXT_PROP`: built and lit by the runtime, present in Blender only to cast shadow. Use it for thin dark things on a lit wall (picture frames, door cases): baked, the lightmap smears them.
- A model's colour comes from its materials. Change it with `skin` in `assets.ts`, by material name, then rebake.
- Dark colours read darker than expected in a night room. `#4C4E54` read as black; `#6E7076` reads as grey.

### Bake commands

Dev server up. Do not run `npm run check` or `build` while the export step starts (first 30 s).

| Set | Command |
|---|---|
| 0 | `node scripts/stage-bake.mjs 0 256 2048` |
| 1 | `npm run stage:bake -- 1 128 2048 512` |
| 3, 4 | `node scripts/stage-bake.mjs <i> 256 2048 512` |
| 5 | `npm run stage:bake -- 5 128 2048 512 0` |
| 6, 7 | `npm run stage:bake -- <i> 128 2048 512 0.002` |
| 10 | `npm run stage:bake -- 10 128 2048 512 0`, then `blender -b -P scripts/stage-bake.py -- 10 256 2048 1 env` |

- About 5 minutes each. Copy the old `set<i>.glb` and `set<i>_lm.webp` to `.cache/` first.
- The driver may leave a stray `set<i>_env.webp` for a set that declares no panorama. Delete it (a test fails on it).
- After set 0 changes, remake the opening picture: `node scripts/look/poster.mjs`.

## The working loop

1. `npm run dev` on 4321. Restart it if captures look stale.
2. Frames before: `node scripts/look/shots.mjs <dir> <chapters...>`.
3. Change code.
4. Preview unbaked: `LIVE=1 node scripts/look/shots.mjs ...`. Light is rough; geometry and framing are true.
5. Bake what is baked.
6. Frames after, with and without cards. Put them on a sheet (`sheet.mjs`) and read them.
7. Audits that fit the change (below).
8. `npm run check`, `npm run build`, `npm test`: silent guards. Report only a failure.
9. His Chrome (the tab sits in a background window and loads only while screenshots nudge it). Say plainly what was seen there and what was seen headless only.
10. Write the round in `docs/rebuild/`, update memory.

## Tools (`scripts/look/`)

| Script | Use |
|---|---|
| `shots.mjs <dir> <chapters>` | Frames by chapter. `CARDS=1` as he sees it, `LIVE=1` unbaked |
| `pin.mjs <out> <set> "x,y,z,lx,ly,lz" [chapter]` | One frame from any camera |
| `sheet.mjs <out> <cols> <frames>` | Contact sheet |
| `void.mjs <dir> <from> <to> [step]` | What is not built, in magenta. After any wall, door or place change |
| `marks.mjs [from] [to] [step]` | Each mark of the walk: in frame, under the card, hidden by what, overlapping |
| `seams.mjs <dir> [step]` | Where the picture jumps between frames |
| `perf.mjs <from> <to> <steps>` | Frame rate through a stretch |
| `glb.mjs <files>` | A model's bounds, materials, nodes. Run it before placing any model |
| `poster.mjs` | Remakes the opening picture |
| `photos.mjs <dir>` | Cuts his photographs to 4:3, strips EXIF |
| `crop.mjs` | Enlarges part of a frame |

URL flags: `?debug&tier=1` (audits), `&live`, `&void`, `&off=ao,bloom,vignette,smaa`, `&tm=`, `&set=i&cam=...`, `&export=i`.

## How to do the common jobs

| Job | Steps |
|---|---|
| Resize a room | Give it a named constant (`CONDO`). Derive shell, props and builders from it. Keep the walls that carry doors to other sets. Re-key the camera's first and last frames. Rebake. `void.mjs` |
| Recolour a model | `glb.mjs` for material names, `skin` in `assets.ts`, rebake |
| Hang his photograph | Real file, 4:3, no EXIF, in `photos/`. Image key in `Images`, a paint frame, a builder, a placement, the builder's name in `CONTEXT_PROP` (both lists). Credit line in `stage-assets.mjs` |
| Add or move a mark on the walk | `SIGNS` in `walk.ts`. Then `marks.mjs`: clear of the card, nothing across it, no overlap with the next. Trees keep 4.5 m before a mark and 2.4 m after |
| Add a door | `DOORS` entry, `doorway()`. Leaf open before the camera reaches the jamb |
| Retime the camera | Keys in `dolly.ts`. `npm test` holds step and turn bounds per scroll step: a failure there is a lurch or a head snap he will feel |
| Change light on the walk | Stations in `walk.ts`. Sets 8 and 9 need no bake |

## Traps met, so they are not met again

| Trap | What happened | What to do |
|---|---|---|
| Captures hid the card | Marks looked clear, were under the card in his Chrome | `CARDS=1`, `marks.mjs` |
| Model placed blind | The pendant stood on its rose, shade in the ceiling, for weeks | `glb.mjs` first |
| Lightmap on thin bars | Black picture frames came back white at the edges | `CONTEXT_PROP` |
| Stale opening picture | First screen showed the old room while loading | `poster.mjs` |
| Corridor wider than the room it meets | A sliver of nothing past the room's wall | End wall round a door's hole (`passageDoor`) |
| Things in one line | Marks overlapped each other seen from far down the walk | Stagger `x` |
| Street furniture on a sight line | A bench across Web Summit's mark | `marks.mjs` names what hides it. He wanted it removed, not moved |
| A sign near the track | Elevate's far end stood in the streetcar's side | Keep x at or below -5.5 for a 2 m mark |
| Removing a thing, then its ground | The boardroom went, then the block too: "now it is empty" | Take out the thing he named, leave what stood round it |
| Counting animations on honours | A place or a sum caught mid-count reads as a wrong claim | `still: true` |
| Extra keys for a glance | Pace wobbled 20 percent | Use the even keys |

## His standing rules

- Replies to him: 6 lines at most, plain words, no em dashes, no tables.
- Local commits only. Never push. Commit only when he asks. No attribution lines.
- No new unit tests, no test counts in reports. Keep the existing ones passing quietly.
- Real models over primitives; no stick figures, no people unless he asks; no banners or slogans.
- Review in his real Chrome.
- Facts: only his own figures. Open: what the $70k is made of.

## Where the history is

| Doc | Subject |
|---|---|
| 34 | The walk, rounds one to five |
| 36 | Google without the boardroom |
| 37 | Nits, round one: apartment, photographs, marks, the lamp, the passage |
| 26, 27 | Flight, Sydney |
| 32 | Loading and deployment |
