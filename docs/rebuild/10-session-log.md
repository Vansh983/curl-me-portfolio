# Session log: the journey stage

## 2026-08-27: stage v2, three.js

The CSS layer engine below is gone (reference point: tag `pre-3d`, commit `d2c696e`). The stage is a `<canvas>` driven by `src/scripts/stage-run.ts`, loaded lazily (135 KB gz three chunk, 1 KB entry). Spec: [11-journey-3d-spec.md](./11-journey-3d-spec.md), plan: [12-journey-3d-plan.md](./12-journey-3d-plan.md).

- Every object is a rig in `src/lib/stage/` (params in, positions out, fixed vertex count). Station keys are GPU morph targets. No opacity anywhere: things morph, grow, sink, or the camera travels.
- Two stations: the 2010 bedroom and the 2013 lab. The camera holds in the lab for chapters 3 to 8 until their stations exist.
- Firefox needs no fallback any more; scroll progress is JS, WebGL is everywhere. Reduced motion snaps between stations.
- Detail pass (same day): rounded body (capsules, a textured torso lathe), hair cap to the nape with ears, kid proportions in both keys, and every v1 detail back: Barcelona MESSI 10 shirt, controller that becomes the mouse, nuggets and ketchup, panelled football, dusk window with rooftops and curtains, the Steve Jobs quote poster, twelve named spines plus the game case, Xbox ring and logo, socket and wire, CoD HUD, Notepad, keyboard, wall clock. Per-vertex colour and painted canvas textures (`painters()` in `stage-run.ts`) carry the detail; `mix` textures blend by station progress.
- Portrait: the frustum is cropped from a taller one (`setViewOffset`) so the subject sits in the upper half above the text. No media queries in the stage.
- `src/lib/scenes/*.svg`, `morph.ts`, `figure.ts` and the old illustrations in `public/assets/scenes` stay as reference until the last chapter is rebuilt.
- Add a station: a `Station` in `STATIONS`, one more key and colour per actor in `ACTORS` (`src/lib/stage/world.ts`); `npm test` checks the counts and the camera continuity.
- Screenshots for review: `node shoot.mjs <w> <h> [dark] [p1,p2,...]` in the scratchpad used playwright-core against `npm run dev`; the Chrome extension was not connected this session.

Everything below this line describes the v1 CSS engine and is kept for the record.

2026-08-25, branch `canary`. Everything below is built and committed. Dev server: `npm run dev`, then `http://localhost:4321`.

## What exists now

A full-bleed sticky scene on the home page. The reader scrolls, the text column moves over it, and the scene changes in 3D: layers at different depths, a camera that rotates and dollies, and drawings that morph into the next chapter's drawings.

Two chapters are built:

1. **Delhi bedroom, Xbox 360** — you from behind, cross-legged on the rug, controller in hand, Call of Duty zombies on the TV, Steve Jobs poster, book spines, chai and nuggets, football, Xbox 360 with the World at War case. The site's name and intro sit on this first screen.
2. **2013 school computer lab** — the bedroom morphs into it: the wall recolours warm to cold, the TV becomes a beige CRT with Notepad and `<!DOCTYPE html>`, you go from the floor to a chair in a white shirt and tie, a row of lab machines slides in.

The 2018 (Google Code-in, San Francisco) and 2020 (Webcube, Covid Leads) chapters from the earlier passes are still in the data but currently sit after the lab; they use the old bridge illustration and the ink scenery.

## The three engines

### 1. Layers in 3D (`Journey.astro`)

Each chapter is a list of layers. A layer is one SVG (inlined, so its insides can animate) or one image, placed in a 1600 by 900 design space with a `z` depth.

```ts
{ id: 'tv', inline: 'k-tv', x: 620, y: 330, w: 520, z: -430, motion: 'rise', range: 'entry 0% entry 55%' }
```

- `perspective: 1400px` on the world, `perspective-origin` at the figure. A layer at depth `z` is scaled back up by `(1400 - z) / 1400`, so the composition is exact at rest and depth only shows as parallax when the camera moves.
- The camera is one CSS animation on the section's own view timeline: `rotateY(-7deg)` to `rotateY(7deg)` plus a translate and a dolly across the whole section.
- The world is scaled by `--k` (set in JS) to cover any viewport, anchored bottom right.

### 2. Motions (CSS scroll timelines, zero JS)

Every chapter declares `view-timeline: --ch-N block`; the section declares `timeline-scope`. Layers and any group inside an inlined SVG carry `data-motion` and pick the chapter's timeline up through a `--tl` custom property.

Motions available: `rise, pop, slide-l, slide-r, drift-l, drift-r, sail, drop, swing-in, burst, spin, shamble, flicker, pulse, sway, tilt, steam, roll, dusk, fly` (`fly` follows an `offset-path`). Paths with `pathLength="1"` draw themselves on. `data-loop="spin"` runs on its own clock instead of scroll (the ceiling fan).

Support: Chrome/Edge 115+, Safari 26+. Firefox has no scroll timelines; a ~0.5 KB script keeps `data-chapter` current and CSS under `@supports not (...)` shows the right layers statically.

### 3. Morphing (`src/lib/morph.ts`, 116 lines, tested)

Two SVGs with the same element structure are paired at build time, element by element: every number, colour, `d` string and text run that differs is recorded. At scroll time the plan is applied to the live DOM at progress `t`.

- `pairSvgs(a, b)` returns `null` if the files do not line up (different tag order, or a `d` whose command letters differ), and the layer falls back to a crossfade. A test asserts the authored pairs line up.
- Path morphing works because both files use the same command sequence; only the numbers move.
- Colours interpolate in RGB, text swaps at the halfway point, the layer's `x/y/width` interpolate too.

Current pairs: `k-room -> lab-room`, `k-tv -> lab-monitor`, `k-kid -> lab-kid`, `k-fan -> k-fan` (stays).

## Files

| File | What it is |
|---|---|
| `src/components/Journey.astro` | the stage: layer rendering, camera, all motion CSS, the fallback, the runtime |
| `src/lib/morph.ts` | SVG pairing and application, pure, unit tested |
| `src/lib/figure.ts` | the parametric character (height, pose, walk, turn, props). **Currently unused** on the stage, see "dead ends" |
| `src/lib/lerp.ts` | numeric interpolation and scroll to chapter mapping |
| `src/data/timeline.ts` | chapters plus their layer lists |
| `src/lib/scenes/k-*.svg` | the bedroom: room, fan, poster, shelf, TV, Xbox, kid, floor |
| `src/lib/scenes/lab-*.svg` | the lab: room, monitor, kid, row of machines |
| `src/lib/scenes/bg-*.svg`, `sc-*.svg`, `plane.svg` | the 2018 and 2020 scenery |
| `public/assets/scenes/*.svg` | your old illustrations, converted from JSX: bridge, baadal (clouds), sun, boats, curtain, doc |
| `scripts/render.mjs` | renders any keyframe or scene to PNG in `.renders/` for checking |
| `tests/*.test.ts` | 13 tests, `npm test` |

## Reused from your old branches

`main` had hand-drawn scenes as JSX components. Converted to plain SVG and copied into `public/assets/scenes/`:

- `bridge.svg` — the Golden Gate, 427 paths, full colour. Used in the 2018 chapter, swings in on `rotateY`.
- `baadal.svg` (clouds), `sun.svg`, `boat-left.svg`, `boat-right.svg` — sky and water layers.
- `curtain.svg`, `doc.svg` — the theatre curtain and the medical team illustration (the latter used for Covid Leads).
- Bebas Neue from `main` is now at `public/fonts/bebas-neue.ttf` for the Call of Duty wordmark.

## Real photos and logos

Slots are wired. Drop the file and it appears automatically; until it exists the drawing shows instead (a build-time `existsSync` check strips the missing `<image>`).

| Drop at | Appears on |
|---|---|
| `public/assets/scenes/jobs.jpg` | the phone-free Steve Jobs portrait above the TV |
| `public/assets/scenes/xbox-360-logo.png` | the compact standing Xbox beside the TV |
| `public/assets/scenes/football.svg` | the rolling football on the bedroom floor |
| `public/assets/scenes/zombies-gameplay.mp4` | the muted gameplay loop inside the TV |

Same pattern for any future photo: add `<image href="/assets/scenes/x.png" .../>` inside the scene SVG.

## Commits

```
7abf94c feat: morph the bedroom into the 2013 computer lab, hero on the first chapter, football, photo and logo slots
6dce69f feat: bedroom details, Steve Jobs poster, book spines, Call of Duty, nuggets, visible Xbox 360, fan on its own clock
3adccb3 fix: crossfade chapters in the middle of the gap
a3a1f28 feat: open the journey in the Delhi bedroom, Xbox 360 and zombies, in 3D layers
c7a4b75 feat: rebuild the stage as 3D layers with the old illustrations and a scroll camera
29bba4d feat: choreograph the 2018 scene and walk the figure through it
a8060e7 feat: draw the figure as a filled ink illustration and match the scenery
33bbfe2 feat: add the journey stage with the 2018 and 2020 chapters
91d517f feat: add the parametric stroke figure, lerp, and the render tool
c6a4aea docs: add the journey stage research, spec and plan
```

50 files, +6521 lines.

## Research and planning docs

| Doc | What is in it |
|---|---|
| `07-journey-stage.md` | 10 routes ranked with measured bundle sizes, the art pipeline, the stack re-check |
| `07-research/r1..r7.md` | the raw evidence from seven parallel research passes, every claim sourced |
| `08-journey-stage-spec.md` | the design spec |
| `09-journey-stage-plan.md` | the 10-task implementation plan |

Key findings that shaped the build: CSS `d: path()` has no Safari support (so morphing is JS, 116 lines, no library); Lightning CSS folds `animation-timeline` into the `animation` shorthand (`cssMinify: 'esbuild'` fixes it, verified); scroll timelines are Chrome 115+ and Safari 26+, 85% global, Firefox needs the fallback.

## Decisions you made along the way

1. Stack is not locked to Astro. Re-checked six frameworks; Astro still ranked first (0 KB baseline vs Next's 114 KB), and it is what the branch runs.
2. No stick figures. Filled, illustrated drawings with proper colour.
3. Animation must be choreography, not one rotating arm. Things move through space.
4. You review the live page, not PNG renders.
5. The scenes are your story, taken from `timeline.ts` and the old `main` branch, never generic.
6. The first screen is the bedroom, with your name introduced on it. White wall, not brown.
7. Football, not cricket. Real photos for people (Steve Jobs) and real logos.
8. One chapter perfected at a time, then carry the style forward.

## Dead ends, kept in the tree

`src/lib/figure.ts` (279 lines) is a parametric character: one function, params for height, head ratio, hair, glasses, beard, sleeve, collar, lean, arm angles, leg stance, prop, face, position, facing, turn, walk phase. It draws a filled figure whose every part interpolates, and it walks with a real cycle.

It is no longer on the stage. You wanted hand-authored characters per scene instead, so `k-kid.svg` and `lab-kid.svg` replaced it. The file and its tests stay because the same idea now lives in `morph.ts` at the SVG level, and the parametric approach may come back for a chapter that needs a walk cycle across the screen.

## How to work on this

```bash
npm run dev                 # the site
npm test                    # 13 unit tests
npm run check               # astro check, 0 errors
npm run render -- --help    # rasterise a scene for inspection
```

Add a chapter: write its SVGs into `src/lib/scenes/`, add a `scene.layers` list to the entry in `src/data/timeline.ts`. To morph a layer into the next chapter, add `to: { inline, x, y, w }` and keep the two files' element order identical; `npm test` tells you if they do not line up.

## Open, next

- The story markdown. Every chapter's words are placeholder until it lands.
- Chapters after the lab: 2018 San Francisco, 2020 Webcube, 2022 Halifax, 2023 teaching, 2024 Bean, 2025 Floqer. The 2018 and 2020 scenes exist but predate the morph engine and the real-photo direction.
- Continue reviewing the first-scene composition at desktop and mobile sizes.
- Mobile layout for the new stage has not been reviewed.
- Firefox fallback path has not been checked in a real Firefox.
