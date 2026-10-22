# A perfect film set, and the things in hand: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (native). Steps use `- [ ]`.

**Goal:** Seal every set from everywhere a walker can stand, proven by a tool; then The Last of Us style pick-ups for the things in the rooms.

**Architecture:** The world stays 13 code-built sets lit in Blender, drawn as a ring of neighbours. A headless tool floods each set's floor and casts rays; fixes are per set with rebakes. Pick-ups: a `thing` key on a placement joins it to words in `src/data/things.ts`; the runtime finds the thing's baked meshes by name and bounds, builds it live into the hand over a blurred still of the frame, or eases the eye to it.

**Tech stack:** Astro, three.js 0.185, three-mesh-bvh, playwright-core headless Chrome on the production preview (port 4322), Blender Cycles bake (`scripts/stage-bake.mjs`).

**Spec:** `docs/rebuild/50-a-perfect-film-set-and-the-things-in-hand.md`

## Global constraints

- Walker: eye 1.6, radius 0.26, reach 2.1, fov 74 (`ROAM`). Grid 0.4 m; 96 rays (24 round at pitches -25, 0, 15, 50); a room's rays must end within 300 m, outdoors within the fog's far.
- Leaks: nothing hit; first hit the back of a one-sided face; a ray through an open doorway into an undrawn set. Two-sided materials never leak. Floors within 5 mm of another drawn set's floor leak.
- Ring stays one set each way (`also` for 8/10). A leaf is drawn shut whenever he is in neither of the two sets it joins. No invisible fences: a hedge at the grass's edge, ground to the fog beyond it.
- Pick-up: `E  Pick up` / `E  Look`; lift 0.45 s to centre-left at 45 % of frame height; world 40 % darker, blurred, still; panel slides 0.3 s after; put back 0.35 s; look eases 0.6 s to 2.2 radii, centre a third from the left; rim within 2.1 m and 25°; under 0.6 m lifted, over looked at; count `n of N found` in the keys line (localStorage).
- Words only from his captions and cards. No papers until his words come. No new unit tests. Local commits only when he asks. Measure on the preview, never the dev server. Review in his Chrome.
- `bake.ts` lists and `scripts/stage-bake.py` lists stay the same.

## Review focus

- A door he stands in as the set flips: the leaf-shut rule must not close on him (both sides include his set).
- The still captured with the thing hidden, so no ghost stays on its place while it is in hand.
- Pointer lock: Escape leaves the lock and must also put the thing back, never leave the Walk.
- A thing picked while a ride plays or a door swings: refuse while riding.
- Portrait frames (view offset): the hand camera copies the projection matrix, not only fov.

---

## Part one: the world sealed

### Task 1: review hooks and the leaf-shut rule

**Files:** modify `src/scripts/stage-roam.ts`, `src/scripts/stage-run.ts`

**Produces:** `Roam.floorAt(x, z, from): number | null` (gathers solids, calls `floor`); `Roam.near: number` (distance to what E does; Infinity when nothing); `__stage.bvh = { MeshBVH, acceleratedRaycast, computeBoundsTree }`; `__stage.groups`.

- [ ] In `step`, after `place()`: every door whose `sides` exclude `path.runs[run].set` gets `target = 0`.
- [ ] In the scroll's door loop: `d.open *= d.sides.includes(f.set) || d.sides.includes(f.from) || d.sides.includes(f.into) ? 1 : 0` (use the frame's sets).
- [ ] Add the diagnostics fields. `npm run check` quiet.

### Task 2: `scripts/look/leaks.mjs <dir> [set]`

**Files:** create `scripts/look/leaks.mjs`

- [ ] Open the preview (`URL` env, default `http://127.0.0.1:4322/`), go to the set's first dolly key chapter, click Walk, wait for mode `walk`.
- [ ] In page: install `acceleratedRaycast`, `computeBoundsTree` on every visible Mesh of drawn groups (and the sky, dome). Force `side = DoubleSide` on all materials for the scan, remembering the original side.
- [ ] Flood fill: start at the walker's position (feet from `roam.state()`); 0.4 m grid; neighbour counts when `floorAt(x, z, feet)` within `ROAM.step` up / `ROAM.drop` down and the walker's radius is clear (reuse: a horizontal ray test from the point at 0.5 m in 8 directions must be > 0.26 clear, else the point is not standable). Cut-off floor: grid points with floor but unreachable.
- [ ] Rays: 96 per point at 1.6 m above the floor. First hit's `face.normal` turned by the object; leak if none within the limit, or (FrontSide and dot > 0) or (BackSide and dot < 0). Record the hit mesh name and group.
- [ ] Floors: a downward ray from 1.6 m collecting all hits within 2 m; two hits from different groups within 5 mm leak.
- [ ] Output: per set `reach m², cutoff m², leak %, leak points, floors`, worst six points as frames (`&void` colouring: the tool navigates with `?void` and hides skies as `void.mjs` does; camera pinned by `__stage.camera` to the point, yaw toward the worst ray). JSON to `<dir>/leaks.json`.
- [ ] Run over all 13 sets; put the table in doc 50.

### Task 3: Google's lawn and the lab's block (set 3)

**Files:** modify `src/lib/stage/built.ts` (`facade`, `lawn`, new `lawnHedge`, `lawnFar`), `src/lib/stage/sets.ts` (set 3 props), `src/lib/stage/bake.ts` + `scripts/stage-bake.py` (`lawnFar` to CONTEXT), rebake 3.

- [ ] `facade`: a west face `x -4.14-t..-4.14, z -8.07..9.9`; the lab's north face `z 9.9..9.9+t` cut round the strip window (x -2.55..1.45, y 2.1..2.8); the old 2020 block's east face solid (window and its pane gone); drop Google's own west face.
- [ ] `lawn`: grass 12 mm low for `x < W && z > 4.2` (under the 2010 room and the 1→2 passage); grid lines at 4.2.
- [ ] `lawnHedge`: boxes 1.2 high, 0.7 thick along x -40, 61.55, z -42, 14 (material `hedge`), corners met.
- [ ] `lawnFar`: one quad y -0.02 from -600 to 600 in `lawn`'s material (CONTEXT, live). Placed in set 3, `shadow: false`.
- [ ] `LIVE=1` frames at chapters 2.5, 2.9, 3.4 with `CARDS=1`; rebake 3 (`node scripts/stage-bake.mjs 3 256 2048 512`), back up the old files to `.cache/` first; leaks on 2, 3, 4.

### Task 4: lines through two doorways

**Files:** modify `src/lib/stage/sets.ts` (`DOORS`, props of sets 0, 1, 2), `src/lib/stage/bake.ts` + `stage-bake.py` (new door cases to CONTEXT), `src/scripts/stage-run.ts` (set 12 drawn from set 0 only while the home door is open).

- [ ] Where the tool shows a line into an undrawn set through two openings: a leaf on the nearer doorway, placed with `doorway()`/`shutDoor()`, swing keyed so it is open before the camera reaches the jamb (dolly keys: front door jamb q 0.167, the 2010 room's east jamb 0.39, the lab's south jamb 0.578, all through `approach()`), `sides` by `doorSides`.
- [ ] Set 12 from set 0: `groups[12].visible = homeDoor.open > 0.001` while `mainFrame.set === 0`; the home door gets `shut` keys once he is through the brick door.
- [ ] `roam-bot.mjs` both ways over the whole story; `void.mjs` 0 to 19.2 step 0.08; leaks on 0, 1, 2, 3, 12.

### Task 5: the rest, in story order

- [ ] For each of 4 to 12 the tool's leaks: fix the face (a wall, a backdrop, a case), rebake where baked geometry changed, run again. Promenade sets 8 and 9 are live (no bake).
- [ ] Table in doc 50 after; `npm run build`, preview, `stage:audit`.

### Task 6: his Chrome and the docs

- [ ] Frames of what he saw (world -6.2, 1.6, 4.8 looking east) before and after; the lawn's edge; the lab's mouth from the lawn.
- [ ] Doc 50: results table; `docs/rebuild/38-stage-playbook.md`: `leaks.mjs` row, the leaf-shut rule, the trap (a set's faces built for one camera line). README row. Memory.

## Part two: the things in hand

### Task 7: data

**Files:** create `src/data/things.ts`; modify `src/lib/stage/sets.ts` (`Placement.thing?: string`).

**Produces:** `export interface Thing { title: string; lane: string; lines: string[]; photos?: string[]; href?: string; kind: 'hand' | 'look'; back?: string }`, `export const THINGS: Record<string, Thing>`.

- [ ] First three: `award` (set 0 `badge`, hand, photo `/assets/stage/photos/google-award.jpg`), `xboxPad` (set 1 `xbox_controller`, hand), `floqerDesk` (set 0 `desk`, look). Words from the captions and the cards only.

### Task 8: a thing's meshes in a baked set

**Files:** modify `src/scripts/stage-run.ts` (`Placed`, `loadBaked`, `place`, `pick`, `tint`).

**Produces:** `Placed.meshes: Mesh[]`, `Placed.sphere: Sphere` (world), `Placed.thing?: string`.

- [ ] In `loadBaked`, for every placement with `cap` or `thing`: meshes whose `parseBakedName(name).prop === p.build ?? p.model` and whose `Box3` (glb frame) is within 0.3 m of `p.at`. Keep them on the `Placed` pushed by `place()` (match by placement identity).
- [ ] `pick()` intersects roots and meshes; `tint()` covers meshes. Hover works on baked captions again.

### Task 9: the hand

**Files:** modify `src/scripts/stage-run.ts` (new section after the hotspots), `src/components/Journey.astro` (panel markup and CSS).

**Produces:** `pickUp(t: Placed)`, `putBack()`, `held: Placed | undefined`; `handScene`, `handCam`; `still` render targets.

- [ ] Capture: hide the thing's meshes; `composer.renderToScreen = false; composer.render()`; blur `composer.readBuffer` in two half-res 9-tap passes (horizontal, vertical × 0.6) into `stillTex`; restore. A raw ShaderMaterial quad (`depthTest false`, `toneMapped` irrelevant) draws `stillTex` as the hand scene's background.
- [ ] Build live: `geometrySource.load(build, false)` → `placeBuilt`, or `loadModel(model)` scene clone; centre by its box; scale so the largest side is 0.45 of frame height at the hand's distance; start pose = `camera.matrixWorldInverse × thing.matrixWorld`; ease 0.45 s to the hand pose (x at NDC -0.3); key light `DirectionalLight` upper left front + `HemisphereLight` fill in `handScene`; `handScene.environment = scene.environment`.
- [ ] Turning: movement or drag adds angular velocity (yaw, pitch) with decay 6/s; `R` adds π yaw eased 0.4 s.
- [ ] Put back: reverse ease 0.35 s; meshes visible; normal rendering resumes; panel hides.
- [ ] Render: while `held && kind === 'hand'`: `handCam.projectionMatrix.copy(camera.projectionMatrix)`; `renderer.render(handScene, handCam)` instead of `composer.render()`.

### Task 10: looked at

- [ ] `lookAt(t)`: target eye = centre − dir × 2.2 r along the current line of sight (clamped above the floor + 0.3), look point = centre + right × (d tan(hfov/2) / 3); ease 0.6 s from the current frame; the frame fed to `frame()` is the eased one while held; `putBack()` eases back 0.6 s.

### Task 11: the panel

- [ ] Markup in `Journey.astro`: `<aside class="thing" role="dialog" aria-modal="true" hidden>` with lane (mono), `h3`, lines, photos (`img` 4:3, lazy), link, a close button. CSS: right third on wide screens, sheet from the bottom under 48rem; slide 0.3 s; `prefers-reduced-motion` cuts the slide.
- [ ] Focus moves to the panel on open and back to the canvas on close; Esc closes; the wheel scrolls it (the Walk's `onWheel` lets events inside the panel through).

### Task 12: wiring

- [ ] Walk: each frame the nearest thing of the drawn set within 2.1 m of the eye and 25° of the look direction (bounding spheres); `near < roam.near` wins the prompt (`Pick up` | `Look`); rim via `tint`. `E`: put back if held, else pick if a thing wins, else `roam.use()`. While held: movement keys not forwarded, `roam.release()`, pointer movement turns the thing.
- [ ] Scroll: click on a thing picks it up (caption flow stays for captions without `thing`); while held `onScroll` puts the scroll back to where it was and `onWheel` outside the panel is prevented.
- [ ] Touch: a tap on a thing picks up; a drag turns; a tap on the canvas puts back.
- [ ] Riding: no pick-ups.

### Task 13: the count

- [ ] `localStorage['journey.found']`: JSON array of ids; `<span class="found" data-found>` in `.keys`: `n of N found`, mono grey; updated on pick-up.

### Task 14: the first round's things

- [ ] Add `thing` keys and `THINGS` entries per the spec's table (sets 0 to 12), words from captions and cards; the paving numbers skipped unless they are placements (they are built in `buildMarks`: register them as look things with their mark text).
- [ ] `npm run check`, `npm run build`, preview, frames of the award in hand (chapter 0.02, Walk), the pad, the desk looked at; `stage:audit` quiet.

### Task 15: his Chrome and the docs

- [ ] Doc 51 `docs/rebuild/51-the-things-in-hand.md`: what was built, what to judge, open words. Playbook: `thing` key, the hand's render path, traps. README row. Memory.
