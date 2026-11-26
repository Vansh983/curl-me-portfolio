# Journey Stage: design spec

Date: 2026-08-25. Builds on the research in [07-journey-stage.md](./07-journey-stage.md). Decisions taken with Vansh: all art is SVG strokes; the figure morphs continuously with scroll; scenery is discrete per chapter; an iconic (not portrait) face is fine; start from the seven chapters in `src/data/timeline.ts`, earlier chapters get added when the story markdown lands; stack stays Astro 7 static.

## 1. What it is

A full-bleed section on the home page that replaces the current `Timeline.astro` stage. The whole viewport is the stage; the text sits on top of it.

- The stage: `position: sticky`, full viewport width and height, behind the text. It is the page background for the length of the section. One ink-stroke figure of Vansh that grows from 13 to now as you scroll. Around the figure, per-chapter scenery draws itself on and fades out, and the background itself morphs with place and activity: Delhi skyline, San Francisco fog and bridge, Halifax harbour, a startup room. The figure stands in the right half; the left half stays quiet so text reads.
- The wall: chapters as plain HTML (year, lane, title, body, stat), one per timeline entry, in DOM order, laid out top-left over the stage in a measure-width column. Scrolls normally. Can hold other components later.
- Everything on the stage is decorative. The text is the only source of truth (curl, llms.txt, reader mode, print all still get the story).

## 2. Architecture

```
src/
  data/timeline.ts          existing entries + a new `scene` field per chapter
  lib/figure.ts             pure: FigureParams -> { paths: Path[] }   (no DOM)
  lib/lerp.ts               pure: (a, b, t) -> FigureParams; easing helpers
  lib/scenes/<id>.svg       one hand-authored stroke SVG per chapter (Astro <Svg/> import)
  components/Journey.astro  layout, wall, stage, CSS timelines, inline <script>
  components/Figure.astro   server-renders the figure at chapter 0 params (no-JS state)
```

Data flow at runtime:

1. `Journey.astro` server-renders the wall, the stage, the chapter-0 figure, and every scenery SVG (hidden, opacity 0). Chapter keyframes (`FigureParams[]`) are serialised into a `data-keys` attribute.
2. A ~2 KB inline `<script>` (no framework) reads `data-keys`, listens to `scroll` (passive) + `resize`, computes section progress `p ∈ [0,1]` from the wall's bounding rect, maps `p` to a chapter pair + local `t`, lerps params, calls `figure(params)`, writes the `d` of each `<path>` in a `requestAnimationFrame`. Exponential damping on `p` gives the scrub a little weight.
3. Scenery needs no JS in Chrome/Safari: each chapter `<article>` declares `view-timeline: --ch-N`, the section declares `timeline-scope`, each scenery layer animates `stroke-dashoffset` (draw on) and `opacity` (fade out) on `--ch-N`. Firefox: `@supports not (animation-timeline: scroll())` + the same script sets `data-chapter` on the section, CSS shows the matching scenery fully drawn.

## 3. The figure

`figure.ts` is the whole character. Rules:

- Output is a fixed list of paths, same count and same command structure for every parameter set. That is what makes lerping the numbers equal to morphing the drawing. No path may appear or disappear between ages; things that "appear" (glasses, a badge, a beard) are always present and shrink to zero-length or move behind another stroke when off.
- Coordinate space: `viewBox="0 0 400 600"`, ground line at y = 540, figure centred at x = 200. Stroke: `currentColor`, width 2.5, round caps and joins, `vector-effect: non-scaling-stroke`, `fill: none`. Accent: at most one path per chapter uses `var(--acc)`.
- Parameters (all numbers in 0..1 unless noted, so any two sets lerp cleanly):

| Param | Meaning |
|---|---|
| `height` | total figure height as a fraction of 480 px |
| `headRatio` | head diameter relative to height (kids are bigger-headed) |
| `shoulder` | shoulder width relative to height |
| `hairTop`, `hairSide` | hair volume up and out |
| `glasses` | 0 none .. 1 full |
| `beard` | 0 .. 1 |
| `sleeve` | 0 short .. 1 long |
| `collar` | 0 tee .. 1 collar/hoodie (a shape blend, not a swap) |
| `lean` | -1 .. 1, body tilt |
| `armL`, `armR` | each `{ shoulder, elbow }` angles in degrees |
| `legStance` | 0 together .. 1 apart |
| `prop` | `{ w, h, stem, x, y, rot }`: one always-present rounded box with a stem, held in the right hand. Blends read as a laptop (wide, no stem), a phone (tall, no stem), a badge (small, long stem = lanyard), a mic (tiny, long stem). No discrete kinds, so it lerps like everything else |
| `face` | `{ smile, browL, browR, eyeOpen }` |

- Keyframes: one `FigureParams` per chapter, authored by hand in `timeline.ts` under `scene.figure`. Between chapters the script lerps; easing is `easeInOutSine` on `t` so the figure rests on each chapter and moves between them.
- Ages by chapter: 2013 → 13, 2018 → 17, 2020 → 19, 2022 → 21, 2023 → 23, 2024 → 25, 2025 → now.

## 4. Scenery

One SVG per chapter in `src/lib/scenes/`, hand-authored by Claude with a render-look-fix loop (rsvg or Chrome screenshot, viewed as an image), corrected by Vansh in 3 to 5 rounds per scene. Rules from the asset research: open stroked paths only, 5 to 15 paths, `pathLength="1"`, `stroke="currentColor"`, no fills, no text, no raster, draw order = reveal order, one `<g class="accent">`. Target under 6 KB each.

First-pass scene list (Vansh to correct when the story lands):

| Chapter | Scene | Accent |
|---|---|---|
| 2013 Delhi | rooftop water tanks and a parapet, a boxy laptop on a ledge | laptop screen |
| 2018 Google Code-in | Golden Gate towers and cable, a lanyard badge | the badge |
| 2020 to 22 Webcube, Covid Leads | a desk stacked with monitors, a map outline of Delhi with pins | one pin |
| 2022 Halifax, Dal | harbour water line, a sailboat, the Dal clock tower | clock face |
| 2023 to 25 research, teaching, community | a lecture-hall rake of seats, a mic on a stand | the mic |
| 2024 to 26 Bean | an open fridge, a phone with a recipe card | the phone |
| 2025 Floqer | a whiteboard of boxes and arrows (a pipeline) | one arrow |

Backgrounds (place, one per distinct location, shared by consecutive chapters in the same place, 10 to 25 paths each, in `src/lib/scenes/bg-<place>.svg`):

| Place | Chapters | Background |
|---|---|---|
| Delhi | 2013, 2020 to 22 | flat rooftops, water tanks, a distant Qutub-like minar, a kite line |
| San Francisco | 2018 | Golden Gate towers in fog bands, a hill of row houses |
| Halifax | 2022, 2023 to 25, 2024 to 26 | harbour water, a lighthouse, the Dal clock tower, a ferry |
| The room | 2025 to now | a whiteboard wall, a window with a skyline of both cities (Delhi minar, Halifax lighthouse) |

Depth: scenery is split into two layers (back, front) with `perspective` on the stage and a small `translateZ` difference; the section-wide timeline drifts them at different rates. That is the whole "3D-style". Reduced motion removes the drift.

## 5. Layout and CSS

- Section: `position: relative; timeline-scope: --ch-1 … --ch-7; view-timeline-name: --story`. Breaks out of the page measure to full bleed (`width: 100vw; margin-left: calc(50% - 50vw)`).
- Stage: first child, `position: sticky; top: 0; height: 100svh; width: 100%; overflow: clip; contain: paint; z-index: 0`. Never `overflow: hidden` on it or any ancestor. Its SVG uses `viewBox="0 0 1600 900"` with `preserveAspectRatio="xMidYMax slice"` so the ground line sits at the bottom edge at every aspect ratio. Background layers (skyline, fog, water, room) live in the same SVG as `<g>` groups; the figure group is placed in the right half (x ≈ 1100), scenery around it, the left 45% kept sparse.
- Wall: follows the stage in DOM order, `margin-top: -100svh` so it overlaps, `position: relative; z-index: 1`, padded with the page `--pad`, column `max-width: var(--measure)`, left-aligned. Chapters `min-height: 100svh`, text pinned near the top of each chapter (`padding-top: 18svh`), each `view-timeline: --ch-N block`. Text reuses the current `Timeline.astro` type styles (year in Space Grotesk 300, lane label mono, h3, body, stat). A soft scrim behind the text (`background: color-mix(in srgb, var(--bg) 72%, transparent)`, blurred edges via mask) keeps contrast where strokes pass under it.
- Background morph: place backgrounds crossfade on the chapter timelines like scenery (opacity only, compositor-safe); the sky/ground tint shifts per chapter via one `--stage-tint` custom property tweened by the same script (a 2% to 4% `color-mix` of `--tx` into `--bg`, so it stays paper). Each background is 10 to 25 paths.
- Scenery and background layers: `animation-name` / `animation-timeline` / `animation-range` longhands only, never the `animation` shorthand. Ranges: draw on `entry 0% entry 100%`, fade out `exit 0% exit 100%`; backgrounds fade in over `entry 0% entry 100%` and out over `exit 0% exit 100%` with `animation-fill-mode: both` so one is always fully visible.
- Mobile (`max-width: 48rem`): same stacking; the figure moves to the upper-right third (`viewBox` shift via a `--stage-x` variable), text column full width at the bottom-left third with the scrim stronger. Chapters `min-height: 100svh` still.
- `astro.config.mjs`: `cssMinify: 'esbuild'` replaces `cssMinify: false` (verified in research to keep all timelines and save 730 B).
- Accessibility: stage `aria-hidden="true"`, SVGs `focusable="false"`, nothing focusable inside; `prefers-reduced-motion: reduce` disables the drift and the draw-on, keeps opacity crossfades, and the script pins the figure to the nearest chapter instead of lerping; `@media print { .stage { display: none } }`.

## 6. Error handling and fallbacks

- No JS: the chapter-0 figure is server-rendered; scenery for chapter 0 is visible; the page reads as a normal list. Nothing breaks.
- No CSS scroll timelines (Firefox stable): script sets `data-chapter`; CSS under `@supports not (...)` shows the matching scenery, fully drawn, with a 400 ms opacity transition.
- `figure()` must never throw on out-of-range params: clamp every number, and the script wraps the frame in a try so a bad keyframe leaves the last good frame on screen.
- The old `Timeline.astro` stays in the tree until the new section ships, then is deleted in the same PR.

## 7. Testing

- `figure.ts` and `lerp.ts` are pure: unit tests (`node --test`, no new test framework) assert path count and command signature are identical for the kid and founder keyframes, all params clamp, lerp at t=0 and t=1 returns the endpoints, and the output is deterministic.
- Visual: a `scripts/render-scenes.mjs` renders each chapter keyframe and each scenery SVG to PNG in the scratchpad for the look-fix loop. Not committed output.
- Browser: `astro build` + `astro check` clean; manual pass in Chrome, Safari 26, Firefox (fallback path), iOS Safari (svh, sticky), reduced-motion on; Lighthouse 100 on the home page stays the target.
- JS budget: the inline script under 3 KB gz; no new dependencies.

## 8. Milestones

1. Mechanics: `Journey.astro` with a stick-figure `figure.ts` (six or seven paths), two placeholder scenery SVGs, scroll lerp working, Firefox fallback, mobile layout. Replaces `Timeline.astro` on the home page behind no flag; it already looks better than a list.
2. The figure: full parameter set, seven keyframes, render-look-fix rounds with Vansh.
3. Scenery: seven scenes, same loop, depth layers, accent picks.
4. Story pass: when the markdown lands, add the earlier chapters (new keyframes + scenes), retune pacing, delete old assets.

## 9. Out of scope

GSAP, Lottie, Rive, three.js, image sequences. Face likeness. Sound. Scroll hijacking or smooth-scroll libraries. Changing the blog.
