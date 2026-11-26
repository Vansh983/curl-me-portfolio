# R6: two-column scrollytelling, sticky stage + text wall

Date: 2026-08-25. Framework-agnostic. Astro is the current branch, not a constraint.

## Verdict

- Layout: CSS grid. Left "wall" is normal flow and carries the height. Right "stage" is `position: sticky; top: 0; height: 100svh; align-self: start`. No JS to pin. Mobile: stack, stage sticky on top at ~40svh, text scrolls under it.
- Driver tier 1 (zero JS): each chapter declares `view-timeline-name: --ch-N`; the section declares `timeline-scope: --ch-1, ...`; each stage layer has `animation-timeline: --ch-N` and fades in on `entry`, out on `exit`. Keyframes touch only `opacity`/`transform`, so it runs on the compositor.
- Driver tier 2 (fallback, ~0.5 KB gz): `IntersectionObserver` with a centre-line `rootMargin` sets `data-chapter` on the section; CSS shows the matching layer. Only runs where CSS timelines are missing (Firefox today). Optional passive `scroll` + rAF writes `--progress` if a continuous value is needed.
- Tier 3 (only for scrubbed timelines or pinning tricks): GSAP ScrollTrigger (46 KB gz, free) or Motion `scroll()` (7 KB gz), lazy `import()`ed when the section enters view.
- Support 2026: tier 1 works in Chrome/Edge 115+ (`timeline-scope` 116+), Safari/iOS 26+, ~85% global; Firefox stable has none of it (Nightly only). Tier 2 covers the rest. Details in section 3.
- Tooling: the shorthand-folding bug is lightningcss, not esbuild. Vite 8 (Astro 7) minifies with lightningcss by default and Astro passes empty targets, which triggers it. Fix: `cssMinify: 'esbuild'` or set `cssTarget`, and never put `animation` shorthand next to `animation-timeline`.
- A11y: stage is `aria-hidden="true"`, no focusables inside, text is the only source of truth, `@media print` hides the stage. Reduced motion keeps opacity crossfades and drops transform motion.

## Skeleton (plain HTML + CSS + optional JS)

```html
<section class="story" data-chapter="1">
  <div class="wall">
    <article class="ch" id="ch-1"><h2>…</h2><p>…</p></article>
    <article class="ch" id="ch-2">…</article>
    <article class="ch" id="ch-3">…</article>
  </div>
  <div class="stage" aria-hidden="true">
    <div class="bg"></div>
    <svg class="layer" data-for="1" focusable="false">…</svg>
    <svg class="layer" data-for="2" focusable="false">…</svg>
    <svg class="layer" data-for="3" focusable="false">…</svg>
  </div>
</section>
```

```css
.story {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: start;                       /* sticky child must not stretch to the wall's height */
  timeline-scope: --ch-1, --ch-2, --ch-3;   /* lift the chapters' timelines to the common ancestor */
  view-timeline-name: --story;              /* optional: one progress for the whole section */
}
.ch { min-height: 100svh; }                 /* one viewport per chapter is a sane default */
.ch:nth-child(1) { view-timeline: --ch-1 block; }
.ch:nth-child(2) { view-timeline: --ch-2 block; }
.ch:nth-child(3) { view-timeline: --ch-3 block; }

.stage {
  position: sticky;
  top: 0;
  height: 100svh;                           /* svh: stable while the iOS URL bar moves */
  overflow: clip;                           /* clip, never hidden: hidden would make .stage a scroller */
  contain: paint;                           /* fine on the stage itself */
}
.layer {
  position: absolute; inset: 0;
  opacity: 0;
  /* longhands only: no `animation` shorthand anywhere near animation-timeline */
  animation-name: fade-in, fade-out;
  animation-duration: auto, auto;
  animation-timing-function: linear, linear;
  animation-fill-mode: both, both;
  animation-range: entry 0% entry 100%, exit 0% exit 100%;
}
.layer[data-for="1"] { animation-timeline: --ch-1, --ch-1; }
.layer[data-for="2"] { animation-timeline: --ch-2, --ch-2; }
.layer[data-for="3"] { animation-timeline: --ch-3, --ch-3; }
@keyframes fade-in  { from { opacity: 0 } to { opacity: 1 } }
@keyframes fade-out { from { opacity: 1 } to { opacity: 0 } }

/* optional section-wide drift, driven by the whole section's own view timeline */
.bg {
  animation-name: drift; animation-duration: auto; animation-timing-function: linear;
  animation-fill-mode: both;
  animation-timeline: --story;
  animation-range: contain;                 /* 0..100% while the section fills the scrollport */
}
@keyframes drift { from { transform: translateY(0) } to { transform: translateY(-8%) } }

/* Tier 2: class-driven state where scroll timelines are missing */
@supports not ((animation-timeline: scroll()) and (animation-range: 0% 100%)) {
  .layer, .bg { animation-name: none; transition: opacity .4s; }
  .story[data-chapter="1"] .layer[data-for="1"],
  .story[data-chapter="2"] .layer[data-for="2"],
  .story[data-chapter="3"] .layer[data-for="3"] { opacity: 1; }
}

@media (max-width: 48rem) {
  .story { grid-template-columns: 1fr; }
  .stage { order: -1; height: 40svh; }      /* sticky on top, text scrolls under it */
  .ch { min-height: 60svh; }
}

@media (prefers-reduced-motion: reduce) {
  .bg { animation-name: none; transform: none; }   /* kill motion, keep the opacity crossfade */
}
@media print { .stage { display: none; } }
```

```js
// Tier 2 only. ~470 B gz with the optional progress loop. Never runs where CSS timelines exist.
if (!CSS.supports('(animation-timeline: scroll()) and (animation-range: 0% 100%)')) {
  const story = document.querySelector('.story');
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) story.dataset.chapter = e.target.id.slice(3);
  }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 }); // zero-height root at viewport centre
  story.querySelectorAll('.ch').forEach((el) => io.observe(el));
}
```

## 1. Layout facts and pitfalls

- Sticky = normal flow, then offset relative to the nearest scrolling ancestor and containing block; needs a non-auto inset (`top`) or it acts like `relative`; cannot leave its containing block; always creates a stacking context. https://developer.mozilla.org/en-US/docs/Web/CSS/position
- It sticks to the nearest ancestor with a "scrolling mechanism" (`overflow: hidden|scroll|auto|overlay`) even if that ancestor never scrolls. Any `overflow-x: hidden` wrapper between stage and viewport kills the effect (`overflow-x: hidden` alone forces `overflow-y: auto`). https://developer.mozilla.org/en-US/docs/Web/CSS/position ; https://polypane.app/blog/getting-stuck-all-the-ways-position-sticky-can-fail/
- Fix: `overflow: clip`. "The element is not a scroll container and no new formatting context is created." https://developer.mozilla.org/en-US/docs/Web/CSS/overflow ; https://benfrain.com/yes-you-can-use-position-sticky-and-overflow-together/ (2024-06-20). `overflow: clip` ~96.7% global. https://caniuse.com/css-overflow
- Root overflow: `overflow` on `html` propagates to the viewport; if `html` is visible, `body`'s propagates instead. Set it on one, never both, or `body` becomes a second scroller. https://www.w3.org/TR/css-overflow-3/#overflow-propagation
- Grid: children default to `align-items: stretch`, so the stage cell is already as tall as the wall and cannot move. Fix `align-self: start` on the stage (or `align-items: start` on the grid). https://ishadeed.com/article/position-sticky-css-grid/ ; https://css-tricks.com/using-position-sticky-with-css-grid/ ; https://defensivecss.dev/tip/position-sticky-grid/
- Containing block: the stage stays pinned only while its cell (all of `.story`) is on screen. The wall carries the height (chapters ~`100svh` each). Same shape as Codrops' 2026 sticky grid: tall parent (`height: 425vh`), `position: sticky; top: 0` child. https://tympanus.net/codrops/2026/03/02/sticky-grid-scroll-building-a-scroll-driven-animated-grid/
- `contain: paint` on an ancestor is "equivalent to changing overflow-x/y: visible into clip", so it does not break sticky or timelines, but it clips and becomes the containing block for absolute/fixed descendants. `content-visibility: auto` on an ancestor of the stage skips its rendering; use it only on sections far below, never on the sticky column or its ancestors. https://www.w3.org/TR/css-contain-2/ ; https://developer.mozilla.org/en-US/docs/Web/CSS/contain ; https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility
- Heights on iOS: `svh` = toolbars expanded, `lvh` = collapsed, `dvh` follows the toolbars (updates are throttled and re-layout mid-scroll). Use `100svh` for the stage. https://ishadeed.com/article/new-viewport-units/ ; https://web.dev/blog/viewport-units . Units: Chrome/Edge 108+, Firefox 101+, Safari 15.4+, ~94% global. https://caniuse.com/viewport-unit-variants
- Pudding rule: no `vh` step heights on mobile because toolbars toggle the unit on scroll (2017, pre-`svh`). `svh` or `rem` `min-height` today. https://pudding.cool/process/responsive-scrollytelling/ ; https://github.com/russellsamora/scrollama#tips
- Pudding sticky pattern: "The sticky graphic is entirely handled by CSS, while the only thing done in JavaScript is handling the step triggers"; unsupported browsers leave the graphic static in source order. https://pudding.cool/process/scrollytelling-sticky/ (2018)
- Mobile: stack panels, fewer steps, stage on top, text under. "A side-by-side sticky figure has no side" at 390 px. https://scrollytelling.ai/scrollytelling-design-patterns/
- Mobile alternative, stage as `position: fixed` backdrop behind text: needs z-index and a scrim, fights iOS fixed quirks, loses the card feel. Sticky-on-top is the safer default.

## 2. Zero-JS driver: CSS scroll-driven animations

- Module: `animation-timeline`, `animation-range(-start/-end)`, `scroll-timeline(-name/-axis)`, `view-timeline(-name/-axis/-inset)`, `timeline-scope`, functions `scroll()`, `view()`. https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations
- `scroll()` = progress of a scroll container (`nearest|root|self`; axis `block|inline|x|y`). `view()` = progress of an element through its nearest scroller's scrollport, optional inset. https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- Named timeline lookup walks ancestors only. A stage layer is not a descendant of a chapter, so the common ancestor must declare `timeline-scope: --ch-1, ...` (or `all`). https://developer.mozilla.org/en-US/docs/Web/CSS/timeline-scope ; https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- Josh Comeau: `timeline-scope` "allows us to declare a variable at a higher level, which will then be reassigned somewhere down the tree." https://www.joshwcomeau.com/animation/scroll-driven-animations/ (2026-04-28, upd. 2026-06-19)
- Canonical recipe (Google Chrome "modern web guidance", 2026): tracked sections `view-timeline: --tl-N block`; animated sections `animation: animate-in auto linear both, animate-out auto linear forwards; animation-range: entry 25% cover 50%, exit 50% exit 75%; animation-timeline: --tl-N`; `html { timeline-scope: --tl-1, ... }`. Feature check `@supports ((animation-timeline: scroll()) and (animation-range: 0% 100%))`: "the animation-range check is mandatory to filter partial support." Includes an IO fallback and advises against the polyfill. https://github.com/GoogleChrome/modern-web-guidance/blob/main/skills/modern-web-guidance/guides/ui-behaviors/scrollytelling.md
- Range names: `cover` = whole pass through the scrollport; `contain` = fully inside (or fully covering) it; `entry` = leading edge in until fully in; `exit` = starts leaving until gone; `entry-crossing`/`exit-crossing` = one edge crossing. Percentages are relative to the named range; `animation-range: cover` = `cover 0%` to `cover 100%`. https://developer.mozilla.org/en-US/docs/Web/CSS/animation-range ; visualiser https://scroll-driven-animations.style/tools/view-timeline/ranges/
- Per-chapter crossfade: two animations per layer on the same chapter timeline (`entry` in, `exit` out), `animation-fill-mode: both` so the layer holds through `contain`. Josh: `backwards` is what applies the 0% state before the range starts. https://www.joshwcomeau.com/animation/scroll-driven-animations/
- No overlap between scenes: `animation-range: entry 50% entry 100%, exit 0% exit 50%`, or shrink the window with `view-timeline-inset` on chapters (positive = inside the scrollport, negative = outside, `auto` = `scroll-padding`). https://developer.mozilla.org/en-US/docs/Web/CSS/view-timeline-inset
- Whole-section progress: `view-timeline-name: --story` on `.story` plus `animation-range: contain` gives 0..100% exactly while the section fills the scrollport, i.e. the pinned interval. `scroll(root)` is page-wide, not section-wide. The repo's `Timeline.astro` already does this (`view-timeline-name: --tl; animation-range: cover var(--lead) cover calc(100% - var(--lead))`). https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- Do not measure the sticky stage itself: ranges come from the untransformed box, and a stuck box does not move through the scrollport. Measure the wall/chapters, animate the stage. Spec discussion: csswg #8298. https://developer.chrome.com/docs/css-ui/scroll-driven-animations ; https://lists.w3.org/Archives/Public/public-css-archive/2023May/0666.html ; https://dev.to/link2twenty/future-of-css-scroll-animations-52ia
- Named scroll timelines need a real scroller: "if the overflow is hidden or clipped, no scroll progress timeline will be created". Keep the window as the scroller. https://developer.mozilla.org/en-US/docs/Web/CSS/view-timeline-name
- `animation-duration` in seconds is meaningless on a scroll timeline; use `auto` (`1ms` idiom also works). https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- Shorthand trap: `animation-timeline`/`animation-range` are not in the `animation` shorthand and the shorthand resets them, so they must come after it. Minifiers reorder; longhands avoid the problem entirely (section 3). https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations
- `animation-composition: add|accumulate` stacks two scroll animations on one property (section drift `transform` + chapter `transform`). Baseline since 2023-07 (Chrome/Edge 112, Firefox 115, Safari 16). https://developer.mozilla.org/en-US/docs/Web/CSS/animation-composition ; https://caniuse.com/mdn-css_properties_animation-composition
- Cross-browser caveat (Bramus, 2025-11): cascade edge cases (`@starting-style` + scroll animation) differ in Safari and Firefox. Keep keyframes explicit from/to on opacity/transform only. https://www.bram.us/2025/11/06/combining-scroll-driven-animations-with-starting-style/
- Debug: Bramus's Scroll-Driven Animations DevTools extension. https://www.bram.us/2023/09/12/scroll-driven-animations-debugger/
- Demos: https://scroll-driven-animations.style/demos/cover-flow/css/ , https://scroll-driven-animations.style/demos/image-reveal/css/ ; intros https://tympanus.net/codrops/2024/01/17/a-practical-introduction-to-scroll-driven-animations-with-css-scroll-and-view/ , https://css-tricks.com/unleash-the-power-of-scroll-driven-animations/ , https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/

## 3. Browser support and tooling (2026-08-25)

- `animation-timeline`, `scroll()`, `view()`, `scroll/view-timeline-name`, `view-timeline-inset`, `animation-range`: Chrome 115, Edge 115, Safari 26.0 + iOS 26.0 (2025-09-15). ~85.4% global. https://caniuse.com/mdn-css_properties_animation-timeline ; https://caniuse.com/mdn-css_properties_animation-range ; https://caniuse.com/mdn-css_properties_view-timeline-inset ; https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- `timeline-scope`: Chrome 116, Edge 116, Safari/iOS 26.0. ~85.4%. https://caniuse.com/mdn-css_properties_timeline-scope
- Firefox: not in any stable release (154 is current). Nightly-only since 136 behind `layout.css.scroll-driven-animations.enabled`; MDN lists `timeline-scope` and `animation-range-start/end` as not yet supported there. caniuse's "Firefox 157" is BCD `"preview"` rendered as a number. Meta bug https://bugzilla.mozilla.org/show_bug.cgi?id=1676779 , timeline-scope https://bugzilla.mozilla.org/show_bug.cgi?id=1823500 ; https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Experimental_features ; https://github.com/mdn/browser-compat-data/blob/main/css/properties/animation-timeline.json . Scroll-driven animations are an Interop 2026 focus area. https://webkit.org/blog/17818/announcing-interop-2026/
- Safari bugs fixed in 26.5 (2026-05-11): view-timeline progress wrong near 0%/100%, `animation-play-state: paused`, timelines lost from bfcache. https://webkit.org/blog/17938/webkit-features-for-safari-26-5/
- Safari still open in shipped 26.x, fixed only in STP 249 (2026-07-29): `animation-timeline` could match a timeline outside the nearest `timeline-scope`, and did not pick the last match when several matched. Low risk for this design (one scope element, unique names, no nesting); avoid nested `timeline-scope` and duplicate names. https://webkit.org/blog/18182/release-notes-for-safari-technology-preview-249/
- Polyfill flackr/scroll-timeline: npm `scroll-timeline-polyfill` 1.1.0 (2024-05-15), last commit 2024-08-26, 86 open issues, effectively unmaintained. 61 KB min / 17 KB gz. No `timeline-scope` (#123), partial `animation-range` (#236), no inset in `view-timeline` shorthand (#134), no viewport units (#266), laggy in Safari (#286), `view()` broken in Astro (#283). Not worth it; tier 2 IO is 30x smaller. https://github.com/flackr/scroll-timeline ; https://github.com/flackr/scroll-timeline/issues/123 ; https://github.com/flackr/scroll-timeline/issues/236 ; https://github.com/flackr/scroll-timeline/issues/283
- Minifier bug, root cause: lightningcss folds `animation-timeline` into the `animation` shorthand when targets are empty. Open: https://github.com/parcel-bundler/lightningcss/issues/1283 (2026-06-23, reported on Astro 7 + Vite 8). Earlier closed as "works as designed with targets": https://github.com/parcel-bundler/lightningcss/issues/815 , https://github.com/parcel-bundler/lightningcss/issues/1115 . Second open bug: `animation-range: entry exit` becomes `entry exit 0%` with any targets, https://github.com/parcel-bundler/lightningcss/issues/1226 . Not fixed in lightningcss 1.33.0 (2026-07-20).
- esbuild: no such bug. esbuild 0.28.2 `--minify` preserves `animation: fade 1ms linear both; animation-timeline: view(); animation-range: entry 0% exit 100%` verbatim; no timeline handling in its shorthand code. https://github.com/evanw/esbuild/blob/main/internal/css_parser/css_decls_animation.go
- Why it bit this repo: Vite 8 (Astro 7) defaults `build.cssMinify` to `'lightningcss'`; Astro passes empty targets (`build.target: 'esnext'`), the exact trigger. Astro maintainers declined a default cssTarget. https://vite.dev/config/build-options ; https://vite.dev/guide/migration ; https://github.com/withastro/astro/issues/17647 ; https://github.com/withastro/astro/pull/17648
- Options to turn minification back on: (a) `vite: { build: { cssMinify: 'esbuild' } }`; (b) keep lightningcss and set `vite.build.cssTarget` (e.g. `['chrome115','safari26']`), verified to stop the merge but not #1226; (c) independent of tooling, write animation longhands and explicit ranges (`entry 0% exit 100%`, never bare `entry exit`). Do (c) regardless.

## 4. JS-driven alternative

- Vanilla pattern (Pudding / scrollama internals): sticky graphic + `data-step` blocks, trigger at 50% of viewport via IO. scrollama computes px `rootMargin` per step with `threshold: 0.5` and a ResizeObserver; the `-50% 0px -50% 0px` centre-line variant needs `threshold: 0` (ratio is always ~0 with a zero-height root) and needs no resize code. https://pudding.cool/process/how-to-implement-scrollytelling/ ; https://pudding.cool/process/introducing-scrollama/ ; https://github.com/russellsamora/scrollama/blob/main/src/entry.js ; https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/IntersectionObserver
- Measured size: IO chapter switch + passive `scroll` + rAF writing `--progress` = 667 B min / 468 B gz. IO-only is about half.
- iOS: WebKit rootMargin bug 198784 only affected element roots, fixed 2019; viewport root is fine. The centre line drifts a few px as the toolbar collapses; harmless for chapter switching. https://bugs.webkit.org/show_bug.cgi?id=198784
- GSAP 3.15.0 (2026-04-13): core 28.3 KB gz, core + ScrollTrigger 46.2 KB gz. Free for all use incl. commercial and all plugins since 3.13 (2025-04-29, Webflow). Standard license only bars competing no-code animation builders. https://gsap.com/pricing/ ; https://gsap.com/blog/3-13/ ; https://gsap.com/community/standard-license/
- Motion 13.1.1 (MIT, 2026-08-20): `import { scroll } from "motion"`; docs say 5.1 KB, measured tree-shaken `scroll()` + callback 7.1 KB gz (+`inView` 7.3 KB). Uses native ScrollTimeline for hardware acceleration only when driving `animate()`; a progress callback still runs in JS. https://motion.dev/docs/scroll ; https://motion.dev/docs/inview
- scrollama 3.2.0 (MIT): 2.5 KB gz; last npm publish 2022-10-14, last commit 2025-11-13, maintenance mode. https://github.com/russellsamora/scrollama ; https://www.npmjs.com/package/scrollama
- Smooth-scroll/scroll-jacking libs (Lenis, Locomotive) are a separate decision and out of scope.
- Lazy-loading a big lib: dynamic `import()` inside the IO callback; Rollup/Vite emit it as a separate chunk fetched only on demand. https://rollupjs.org/tutorial/#code-splitting ; https://vite.dev/guide/features#async-chunk-loading-optimization
- Astro specifics: `<script>` in `.astro` is TS, bundled, `type="module"`, included once per page even if the component repeats, inlined if small. `is:inline` = verbatim, no bundling. `define:vars` implies `is:inline`; prefer `data-*` + `dataset`. `client:*` directives apply only to UI-framework islands, not `<script>`. Astro 7 changed nothing about scripts (Vite 8, Rust compiler only, `compressHTML: 'jsx'` default). https://docs.astro.build/en/guides/client-side-scripts/ ; https://docs.astro.build/en/reference/directives-reference/ ; https://docs.astro.build/en/guides/upgrade-to/v7/
- Astro examples in the wild: https://github.com/althenlimzixuan/althenlimzixuan.github.io (`src/components/scrolly/Scrolly.astro`, sticky figure + `is:inline` IO with `rootMargin: '-45% 0px -45% 0px'`, unsticks under 60rem); https://github.com/rishichawda/rishikc.com (`sticky top-0 h-screen` stage, IO `threshold: 0.5`); https://github.com/design-practices/maplibre-yaml (`Scrollytelling.astro`, chapters drive a MapLibre map).

## 5. Performance rules

- Only `transform` and `opacity` are compositor-only everywhere; colors repaint, geometry re-layouts. Chrome also composites `filter`, `background-color`, `clip-path`. https://web.dev/articles/animations-guide ; https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate ; https://developer.chrome.com/blog/hardware-accelerated-animations
- Scroll-driven animations run off the main thread only for compositable properties; Chrome's docs animate `transform: scaleX()` instead of `width` for that reason, and the case study stayed smooth under heavy JS with transform-only keyframes. https://developer.chrome.com/docs/css-ui/scroll-driven-animations ; https://developer.chrome.com/blog/scroll-animation-performance-case-study
- `will-change`: "last resort", not on many elements, costs memory. At most `will-change: opacity, transform` on the 5 to 6 layer wrappers. https://developer.mozilla.org/en-US/docs/Web/CSS/will-change
- SVG: CSS `d: path()` is Chrome 52+/Edge 79+/Firefox 97+, no Safari (~80%). No path morphing in CSS; stack two shapes and crossfade. https://caniuse.com/mdn-css_properties_d ; https://developer.mozilla.org/en-US/docs/Web/CSS/d
- SVG transforms: set `transform-box: fill-box; transform-origin: center` or the origin is the SVG canvas corner. Chromium 89+ hardware-accelerates transform/opacity on SVG elements. https://developer.mozilla.org/en-US/docs/Web/CSS/transform-box ; https://developer.chrome.com/blog/hardware-accelerated-animations
- Filters: CSS shorthand filters composite; `filter: url(#svg)` and SVG-on-SVG filters are CPU paths. `stroke-dashoffset` is a paint property (main thread each frame). Avoid both on scrubbed timelines. https://www.chromium.org/developers/design-documents/image-filters/
- Structure: each scene = its own `<svg>` (or wrapper `<div>`) absolutely stacked; scrub opacity/transform on wrappers; keep inner SVG static.
- Inline vs `<img>` vs `<use>`: `<img src=x.svg>` caches but cannot see page CSS or custom properties; inline is fully styleable at the cost of HTML weight; same-document `<use>` inherits `currentColor` and custom properties, external sprite `<use>` stops the cascade at `<use>` and must be same-origin. https://css-tricks.com/using-svg/ ; https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/use ; https://tympanus.net/codrops/2015/07/16/styling-svg-use-content-css/ ; https://css-tricks.com/svg-use-with-external-reference-take-2/
- Recommendation: inline the 5 to 6 scenes (svgo'd, `fill="currentColor"` / `var(--token)` for themes), keep total under ~30 to 50 KB markup. In Astro 5.7+ `import Scene from './scene.svg'; <Scene />` inlines it; `?raw` + `set:html` is the generic Vite route. https://docs.astro.build/en/guides/images/#svg-components ; https://docs.astro.build/en/guides/imports/
- `content-visibility: auto` for far-below sections only (keeps DOM/a11y/tab order; pair with `contain-intrinsic-size`); never on the sticky column. https://web.dev/articles/content-visibility

## 6. Accessibility, print, curl, llms.txt

- Reduced motion: OS "reduce" means drop non-essential movement (parallax, zoom, autoplay), not all animation. Val Head: parallax and scroll-linked motion are "universally triggering"; "color fades, opacity changes and small changes in scale are unlikely to be problematic". WCAG 2.3.3: interaction-triggered motion must be disableable unless essential. https://web.dev/articles/prefers-reduced-motion ; https://www.smashingmagazine.com/2020/09/design-reduced-motion-sensitivities/ ; https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- Implementation: under `prefers-reduced-motion: reduce` keep opacity crossfades, set `transform: none` and remove the timeline on drift/parallax layers, pin final state. Alternative: render one static scene per chapter inline (no sticky), which also works as the no-CSS-timeline fallback.
- `aria-hidden="true"` on the stage removes it from the a11y tree; only for decorative content and never on/above a focusable element. Decorative SVG: `aria-hidden="true" focusable="false"`. Meaningful SVG would need `role="img"` + `<title>`; here the text carries meaning so keep it decorative. https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden ; https://www.sarasoueidan.com/blog/accessible-icon-buttons/
- No links/buttons inside the stage, no scroll hijacking; keyboard users tab through the wall only.
- Print: `@media print { .stage { display: none } }` (MDN pattern); fixed elements repeat on every page and sticky misbehaves, so hide or `position: static`. https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing ; https://aaronsaray.com/2025/a-deep-dive-into-print-css-headers-and-footers/
- curl / reader mode / llms.txt: chapters are plain headings + paragraphs in DOM order before the stage markup, so text-only consumers get the full narrative with no CSS or JS. Stage contributes nothing to the content model.

## 7. Framework fit (only where it matters)

- Tier 1 is identical everywhere: it is CSS in the HTML. Frameworks only change the cost of tiers 2/3.
- Plain HTML/Vite: skeleton above is the whole thing; `import()` becomes a lazy chunk. https://vite.dev/guide/features#dynamic-import
- Astro: `<style>` + `<script>` in one component; script deduped once per page; `client:*` is islands-only, so lazy loading is a plain `<script>` with IO + `import()`. Cost of tier 2 = the observer bytes. Section 4 has the details.
- Next.js app router / static export: the section can be a Server Component for tier 1 (zero JS). Tiers 2/3 need a `'use client'` leaf with `useEffect` + `import()` (or `next/dynamic` with `ssr: false`), which puts the React runtime on the page. https://nextjs.org/docs/app/guides/lazy-loading
- SvelteKit adapter-static: `onMount(async () => { await import('lib') })`; side-effect-free libs can be static-imported and tree-shaken server side. Small runtime, but hydration happens. https://svelte.dev/docs/kit/faq
- Nuxt generate: `<ClientOnly>` skips SSR for the wrapped part (its CSS may not be inlined in the initial HTML); Vue runtime still ships to hydrate. https://nuxt.com/docs/api/components/client-only
- SSG with any of them: the sticky/timeline CSS needs no hydration; the only pre-render concern is that `CSS.supports`/`IntersectionObserver` code runs client-side only (guard with `onMount`/`useEffect`/plain `<script>`).
