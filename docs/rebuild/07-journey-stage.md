# The Journey Stage: research and options

Researched 2026-08-25. Seven parallel research passes, every number below is sourced or measured; the full evidence with URLs lives in [`07-research/`](./07-research/). Stack is **not** locked; Astro is what `canary` runs today, nothing more.

## The vision, restated

- Left column: a wall of text. Chapters of the story (kid in Delhi, Google Code-in at 17, Webcube and Covid Leads, Halifax and Dal, research and teaching, Bean, Floqer). Can hold other components.
- Right column: a sticky stage with a fixed background. A drawn "me" that grows and changes as the left column scrolls: kid, teen, student, founder. SVG or "3D-style".
- The blog stays stripe.dev paper-terminal. The stage is the portfolio piece on the home page.

## Verdict

**Build it as inline ink-stroke SVG scenes, one per chapter, on a sticky stage driven by CSS scroll timelines. Add JS only for two things: a 0.5 KB Firefox fallback, and (optionally) GSAP if you want true shape morphing between ages.** "3D-style" comes from layered 2.5D parallax in CSS, or a Zdog spike if you want real pseudo-3D rotation.

Why this and not the alternatives:

- It is the only route where light/dark theming is free (`currentColor` + CSS vars), the art is crisp at any size, adding a chapter later is "draw one more SVG", and the page stays under 1 KB of JS in Chrome and Safari.
- Every authored-animation route (Lottie, Rive, Spline, three.js) costs 46 KB to 900 KB of runtime, needs JS to scrub, and none of them make the hard part (a consistent character at 5 ages) any easier. The hard part is the drawing, and that is the same in every route.
- Real 3D (three.js / R3F) is the only option that delivers a genuinely different experience (camera moves, rotation, depth). It costs 158 KB to 328 KB gz, a Blender pipeline, and a rigged character with shape keys. Worth it only if the 3D is the point. Kept as option C below.

## The options, ranked

| # | Route | JS over the wire (gz) | Assets you must make | Dark mode | Kid to founder transition | Effort | Risk |
|---|---|---|---|---|---|---|---|
| **A** | **Inline SVG + CSS scroll timelines** (recommended) | 0 KB Chrome/Safari, ~0.5 KB Firefox fallback | 6 to 7 ink SVGs, 5 to 15 KB each | CSS vars, free | draw-on + crossfade (+ 2.5D parallax) | 15 to 22 h art, 1 to 2 d code | Firefox has no scroll timelines (fallback needed) |
| A+ | A + GSAP ScrollTrigger + MorphSVG + DrawSVG | 55 KB, free since 3.13 | same, but same subpath count per stage | same | true morph between ages, pinning, scrub smoothing | +1 d | none, GSAP is the industry default |
| A- | A + anime.js v4 `svg.morphTo` + `onScroll` | 19 KB, MIT | same | same | morph, lighter | +1 d | younger scroll API |
| B | Zdog pseudo-3D (SVG output) | 8 KB, MIT | none, characters are code-drawn shapes | CSS vars (SVG renderer) | lerp point arrays, rotate on scroll | 2 to 4 d | unmaintained since Jan 2022 |
| C | three.js vanilla (toon + Line Art look) | 158 to 166 KB | GLB character with shape keys, Blender scenes | material colors from CSS vars | morph targets, camera path | 1 to 2 wk + Blender | heaviest, WebGL on mobile |
| C+ | R3F + drei / Threlte / TresJS | 328 / 250 / 309 KB | same | same | same | same | drei `ScrollControls` hijacks native scroll (TresJS `htmlScroll` does not) |
| D | Lottie via `lottie_light` (SVG renderer) | 46 KB, no WASM | Lottie JSON from Lottie Creator / Figma plugin / Cavalry (all free) | CSS on layer ids | keyframed in the tool | 1 wk in the tool | lottie-web stagnant (last release May 2025, 859 open issues) |
| E | Rive canvas-lite | 84 KB JS + 311 KB WASM | .riv with bones + state machine; export needs $9/mo | data-binding Color | 1D blend on a number input (documented scroll pattern) | 1 to 2 wk, rig learning curve | ~395 KB minimum, paid export |
| F | Blender frame sequence on canvas | 1 to 3 KB | 60 to 150 AVIF frames, 0.7 to 1.2 MB per 90 frames at 1x | `filter: invert()` or 2nd frame set | rendered in Blender | 1 wk Blender | raster, blurry at DPR, bandwidth |
| G | Spline | ~182 KB + lazy WASM (1.5 MB physics) | .splinecode | undocumented (variables) | states | days in editor | watermark unless $12+/mo, scroll event "only works with the Viewer export" |
| H | `<model-viewer>` | 289 KB | one GLB | CSS background only | GLB animation `currentTime` | 1 d | no scroll binding, heaviest for what it does |

Dropped: dotLottie (30 KB JS + 490 KB WASM, canvas only), SVGator (no scroll scrub in any tier), lottie-interactivity (archived June 2026), flackr scroll-timeline polyfill (17 KB, dead since Aug 2024, no `timeline-scope`), video `currentTime` scrubbing (keyframe-every-frame is 5 to 6x file size, janks on Android, WebM/MP4 split), Theatre.js (public repo frozen since 2024).

## How A works (the mechanism)

Layout: CSS grid, left wall carries the height, right stage is `position: sticky; top: 0; height: 100svh; align-self: start; overflow: clip`. Mobile stacks: stage sticky on top at ~40svh, text scrolls under it. No JS to pin anything.

Driver: each left chapter declares `view-timeline: --ch-N block`. The section declares `timeline-scope: --ch-1, --ch-2, ...` so sibling elements can read those timelines. Each stage layer gets `animation-timeline: --ch-N` with `animation-range: entry 0% entry 100%, exit 0% exit 100%` for fade in / fade out, or `stroke-dashoffset` 1 to 0 for draw-on. The text on the left literally drives the artwork on the right. Full code skeleton in `07-research/r6-architecture.md`.

What the stage can do with zero JS, all Baseline properties:

- Crossfade scenes (opacity).
- Draw each scene on with `pathLength="1"` + `stroke-dashoffset` (paint-tier, fine for 30 to 60 paths per scene).
- 2.5D depth: `perspective` on the stage, `preserve-3d`, layers at different `translateZ`, drifting on the section timeline. This is the cheap "3D-style".
- Move the figure along a path (`offset-path`, already used by the current rider dot).
- One accent element per chapter fills with `--acc`.

What needs JS:

- True shape morph (kid silhouette flowing into teen). CSS `d: path()` is Chromium + Firefox only, no Safari (WebKit bug 234227 stalled since 2024). So morph = GSAP MorphSVG (55 KB) or anime.js (19 KB). Build-time path equalising with `svg-path-commander` is verified working if you ever want the CSS-only morph for Chrome.
- Firefox: no scroll timelines in any stable release (Nightly only, Interop 2026 focus). A 470 B `IntersectionObserver` sets `data-chapter` and CSS shows the matching scene. Runs only where `CSS.supports('animation-timeline: scroll()')` is false.

Browser support, Aug 2026: `animation-timeline`, `view()`, `animation-range` in Chrome/Edge 115+, Safari and iOS 26.0+ (Sep 2025), `timeline-scope` Chrome 116+ and Safari 26+. 85.4% global. Safari 26.4 moved these to the compositor thread. One open Safari bug (timeline matching across nested scopes, fixed in STP 249): use one scope element and unique names, which is what the skeleton does.

Performance rules: scrub only `opacity` and `transform` on scene wrappers (compositor). Keep each scene its own `<svg>`, `transform-box: fill-box`. No SVG filters or `d` on scrubbed timelines. Inline the 6 to 7 scenes, svgo'd, 30 to 90 KB of markup, 15 to 40 KB over the wire.

Build fix (verified on this repo): the shorthand-folding bug that forced `cssMinify: false` is Lightning CSS (#1283, open), not esbuild. `vite.build.cssMinify: 'esbuild'` keeps all six timelines alive and is 730 B smaller than unminified. Independent of tooling, always write animation longhands and explicit ranges (`entry 0% exit 100%`, never bare `entry exit`).

Accessibility: stage is `aria-hidden="true"`, no focusables inside, `@media print` hides it, reduced motion keeps opacity crossfades and drops transform motion. Text is the only source of truth, so curl, reader mode and `llms.txt` still get the whole story.

## The art: how the character gets made

This is the real cost, and it is identical in every route. Verified facts:

- No AI vector tool keeps one character consistent across ages and poses. Recraft says so in its own docs. Its SVG is filled shapes with 20 to 30% excess anchors, not drawable strokes.
- Character reference exists only on raster models: Midjourney V7 `--oref` ($10/mo), Ideogram 4.0 Character Reference (subscription), GPT Image 1.5 edits (~$0.03 to $0.13 per image).
- Raster-to-SVG tracers (potrace, vtracer, Illustrator Image Trace) give closed outlines, so every line becomes a double line and cannot be "drawn on". Only autotrace centerline (Inkscape 1.4 Trace Bitmap) gives single strokes, and it is noisy.
- CC0 libraries (Open Peeps, Notionists, Open Doodles, Humaaans) are all filled paths (measured: zero `stroke` attributes). Fine as pose reference or a fallback style, not as draw-on ink.

Recommended pipeline (15 to 22 hours, $0 to $10):

1. Reference sheet: one seed image of the kid, derive ages 17, 20, 25, 28 with the reference feature. Prompt for "single continuous black ink line, white paper, no shading".
2. Hand-trace as open stroked paths in Figma (free) or Affinity (free since Oct 2025). One `<path>` per visible line, no fills, no compound paths, 20 to 60 paths per character, 5 to 15 per scenery, head-to-feet draw order, accent parts in their own `<g>`.
3. Export with `stroke="currentColor" fill="none" stroke-linecap="round" vector-effect="non-scaling-stroke"`, `pathLength="1"` on every path.
4. svgo with `cleanupIds: false`, `mergePaths: false`, plus `prefixIds`.
5. If morphing is wanted: build stage N+1 by duplicating stage N and dragging anchors, never redraw. Same subpath count and direction.

Alternative: commission. $150 to $400 on Fiverr/Upwork mid-tier, $600 to $1,500 for a Dribbble-level illustrator, 2 to 3 weeks. The brief spec (viewBox, open strokes only, path budget, accent group, no outlined strokes, source file + commercial licence) is in `07-research/r5-assets.md`.

Scene ideas, one per chapter in `src/data/timeline.ts`: 2013 Delhi rooftop with a first laptop; 2018 the Golden Gate and a Google badge; 2020 to 22 a crowded desk and a map of Delhi with pins (Covid Leads); 2022 Halifax harbour and the Dal clock tower; 2023 to 25 a lecture hall and a mic; 2024 to 26 a fridge and a phone (Bean); 2025 onwards a whiteboard of pipelines (Floqer). Character ages 13, 17, 19, 21, 23, 25, now.

## References worth opening

Closest to the brief:

1. HuffPost "Millennials Are Screwed": an 8-bit avatar walks through the life stages beside scrolling text. The exact narrative shape. https://highline.huffingtonpost.com/articles/en/poor-millennials/
2. Robby Leonardi's interactive resume: character runs through layered scenes, resume text inside the scenes. https://www.rleonardi.com/interactive-resume/
3. The Pudding's sticky recipe and repo: the canonical "steps left, sticky graphic right" DOM. https://pudding.cool/process/scrollytelling-sticky/
4. Josh Comeau's scroll-driven animations guide: has the exact zero-JS demo of a sticky element scrubbed by a paragraph's view timeline via `timeline-scope`. https://www.joshwcomeau.com/animation/scroll-driven-animations/
5. SBS "The Boat": sumi-e ink, monochrome, scroll-scrubbed layers. The tone reference for paper-and-ink. https://www.sbs.com.au/theboat/

Also: Joseph San's astronaut with 4 states (Codrops writeup, three.js), Maxime Guillon's scroll house (public GSAP source), Melanie Daveid and MindMarket (Rive on scroll), Codrops scroll-driven SVG map (DrawSVG + MotionPath, pinned), Roman Komarov's `--section-n` timeline-scope trick, Bramus's 14 CSS-only demos and DevTools debugger, Ryan Geyer's near-pure-CSS sprite-sheet image sequence. 30+ more with URLs in `07-research/r4-references.md`.

## Stack

Not locked, so six were compared on a hello page (local builds, brotli): Astro 7 / 11ty / Vite vanilla 0 KB, SvelteKit 2 25 KB, Nuxt 4 46 KB, Next.js 16 114 KB before a line of animation. stripe.dev's own blog (Next.js) ships 215 KB compressed JS.

Ranking for this site (journey stage + stripe.dev-style blog, on Vercel):

1. **Astro 7 static, plain `<script>` for the scene.** 0 KB baseline, the best blog tooling of the six (content collections, MDX without React, `astro:assets`, satori OG), and the scene is plain DOM: no hydration, no canvas SSR, no framework cleanup. Same model the WebGL showpieces use: lusion.co is Astro, Codrops' 2026 three + GSAP tutorial is Astro, GSAP's examples repo has `astro-gsap`. It is also what `canary` already runs.
2. SvelteKit 2 + Svelte 5: 25 KB, Threlte for 3D, `$effect` gives a clean GSAP lifecycle. Loses on blog tooling (mdsvex runes support landed July 2026) and has no OG convention. Pick if you want the scene state reactive and componentised.
3. Vite + vanilla TS: 0 KB, what bruno-simon.com and Codrops ship. No blog story at all. Astro is "Vite vanilla plus a blog".
4. Nuxt 4: 46 KB, good content and OG modules, TresJS auto client-only. Static deploy ships WASM SQLite to the browser for content queries.
5. Next.js 16: 114 KB, MDX tooling churn (Contentlayer dead, next-mdx-remote archived April 2026), static export drops `next/image`. Biggest R3F ecosystem. Moves to #2 only if you specifically want React + R3F.
6. Eleventy 3: Astro strictly dominates it.

What the best-known animated portfolios actually use: the writing/design-engineer sites (rauno, emil, paco, josh, linus) are Next.js + Framer Motion; the WebGL showpieces (bruno: Vite, igloo: Svelte + Vite, lusion: Astro, jesper: Nuxt) are three + GSAP on whatever is light. three + GSAP is the constant; the framework is not. No framework has a starred scrollytelling-portfolio template on GitHub (max 9 stars); the stars sit in framework-agnostic libraries (GSAP 28k, lenis 15.6k, scrollama 6k).

Two Astro-specific traps: do not add `<ClientRouter />` (6.8 KB) alongside GSAP, bundled scripts run once and ScrollTriggers must be torn down on `astro:before-swap`; use native `@view-transition` (already the case here). And switch `cssMinify: false` to `'esbuild'` (above).

One honest counterpoint from the stack pass: if you pick morphing (A+), GSAP is already on the page and works in Firefox, so it can drive the whole stage and the CSS-timeline tier plus its Firefox fallback become optional. One engine instead of two. The CSS-first path wins only if you stay morph-free.

## Decisions needed from you

1. Morph or no morph. Draw-on + crossfade needs no library. A flowing kid-to-teen morph needs GSAP (55 KB) or anime.js (19 KB) and morph-friendly paths.
2. How much "3D". 2.5D CSS parallax (0 KB) vs Zdog spike (8 KB, unmaintained) vs real three.js (158 KB+, Blender pipeline).
3. Who draws. You (15 to 22 h with the pipeline above) or a commission ($150 to $1,500).
4. The story markdown. Chapters, ages, one image idea per chapter. Everything in the stage keys off it.

## Next step

Once the story lands: a 1-day spike of option A with placeholder stick figures, using the skeleton in `r6-architecture.md`, on the current branch. That proves the scroll mechanics, the sticky layout and the Firefox fallback before any art money or hours are spent.

## Research files

| File | Covers |
|---|---|
| [r1-svg-morph.md](./07-research/r1-svg-morph.md) | Morph libraries (measured bundles), CSS `d`, SMIL, scroll-timeline support, Lightning CSS bug, Figma/svg-path-commander tooling |
| [r2-lottie-rive.md](./07-research/r2-lottie-rive.md) | Lottie, dotLottie, Rive, SVGator, frame sequences: sizes, pricing, scrub APIs, recolor |
| [r3-3d-options.md](./07-research/r3-3d-options.md) | three.js, R3F/Threlte/TresJS, Spline, model-viewer, Zdog, OGL, CSS 2.5D, Blender, AI 3D generators, Mixamo |
| [r4-references.md](./07-research/r4-references.md) | 30+ reference sites and tutorials, library health |
| [r5-assets.md](./07-research/r5-assets.md) | Character production pipeline, AI tools, CC0 libraries, tracing, commissioning brief, size measurements |
| [r6-architecture.md](./07-research/r6-architecture.md) | Sticky layout, timeline-scope driver, code skeleton, browser support, fallback, perf, a11y, framework fit |
| [r7-stack.md](./07-research/r7-stack.md) | Framework comparison for this site |
