# R1: scroll-scrubbed SVG character morph (kid -> teen -> student -> founder)

Date: 2026-08-25. Numbers below marked "measured" were produced locally (npm pack + gzip -9 / brotli -q 11, esbuild 0.28.2 tree-shaken bundles, Astro 7.2.0 builds into scratchpad). Everything else links to a primary source.

## Verdict

- A true shape morph that works in every 2026 browser needs JS. CSS `d: path()` is unsupported in all Safari (desktop + iOS, incl. 27 beta), WebKit bug open since 2021, blocked on a Speedometer regression since Apr 2024, STP-only. Sources: https://caniuse.com/mdn-css_properties_d , https://bugs.webkit.org/show_bug.cgi?id=234227
- CSS-only morph (`d: path()` keyframes + `animation-timeline`) therefore renders in Chromium only. Firefox has `d` (97+) but scroll-driven animations are still behind a flag in Release; Safari has scroll-driven (26+) but no `d`. Sources: https://caniuse.com/mdn-css_properties_d , https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Experimental_features , https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- JS options that handle mismatched point counts, cross-browser, ranked by measured tree-shaken bundle (morph + scroll scrub): anime.js v4.5 = 19.2 KB gz; GSAP core + ScrollTrigger + MorphSVG = 55.4 KB gz; Motion + Flubber = 46.5 KB gz. GSAP MorphSVG has the richest mismatch controls (shapeIndex, map, rotational, precompile) and is free since 3.13. polymorph-js is 4.8 KB gz but last commit May 2024.
- Zero-JS hybrid that is real: normalize the four stage paths at build time to identical command lists (verified with `svg-path-commander` 2.3.1 `equalizePaths` in Node), then CSS `d: path()` keyframes on a `view-timeline` hoisted with `timeline-scope`. Chromium gets the morph; Safari 26 gets the scroll timeline but skips `d` (needs an opacity/clip crossfade fallback); Firefox Release gets nothing scroll-driven.
- Build fix, verified: `vite.build.cssMinify: 'esbuild'` keeps all 6 `animation-timeline` longhands in this repo's output and is 730 B gz smaller than the current `cssMinify: false`. Vite 8's default minifier (Lightning CSS 1.33.0) folds 5 of 6 into the `animation` shorthand, which browsers reject. Lightning CSS bug #1283 is open (June 2026).

## 1. JS morph libraries

Measured self-contained minified files (gz / br):

| File | raw | gz | br |
|---|---|---|---|
| gsap 3.15.0 `dist/gsap.min.js` | 72.9 KB | 28.3 KB | 25.7 KB |
| gsap `dist/ScrollTrigger.min.js` | 44.6 KB | 18.0 KB | 16.2 KB |
| gsap `dist/MorphSVGPlugin.min.js` | 21.2 KB | 9.6 KB | 8.7 KB |
| gsap `dist/DrawSVGPlugin.min.js` | 4.4 KB | 2.2 KB | 1.9 KB |
| flubber 0.4.2 `build/flubber.min.js` | 53.5 KB | 18.4 KB | 15.4 KB |
| polymorph-js 1.0.2 `dist/polymorph.min.js` | 7.2 KB | 3.3 KB | 3.0 KB |
| kute.js 2.2.6 `dist/kute.min.js` (UMD, all-in) | 49.6 KB | 17.4 KB | 15.4 KB |
| svg-morpheus 0.3.0 source (unminified) | 15.3 KB | 3.4 KB | 3.0 KB |
| animejs 4.5.0 `dist/bundles/anime.esm.min.js` (everything) | 118.7 KB | 40.9 KB | 36.4 KB |
| motion 13.1.1 `dist/motion.js` (everything, vanilla) | 139.7 KB | 46.3 KB | 41.2 KB |

Measured tree-shaken esbuild bundles of a morph + scroll-scrub entry (what you would actually ship):

| Entry | min | gz | br |
|---|---|---|---|
| gsap + ScrollTrigger + MorphSVG (`morphSVG`, `scrub:true`) | 137.9 KB | 55.4 KB | 49.5 KB |
| gsap + ScrollTrigger, no MorphSVG (`attr.d`) | 116.8 KB | 46.2 KB | 41.4 KB |
| animejs `animate` + `svg.morphTo` + `onScroll({sync:true})` | 50.2 KB | 19.2 KB | 17.4 KB |
| motion `animate` + `scroll` + flubber `interpolate` | 130.6 KB | 46.5 KB | 41.2 KB |
| motion `animate` + `scroll` only | 76.1 KB | 27.7 KB | 25.2 KB |
| flubber only + scroll listener | 54.2 KB | 18.9 KB | 15.9 KB |
| polymorph-js only + scroll listener | 11.9 KB | 4.8 KB | 4.3 KB |
| kute.js ESM (needs svg-path-commander pinned 2.1.11) | 51.1 KB | 18.7 KB | 16.6 KB |

### GSAP MorphSVGPlugin
- Free: Webflow acquired GreenSock (fall 2024); with GSAP 3.13 (Apr 30 / May 6 2025) every bonus plugin incl. MorphSVG, DrawSVG, SplitText, ScrollTrigger became free for commercial use. https://webflow.com/blog/gsap-becomes-free , https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/
- License: "Standard 'no charge' license". Commercial use OK. Prohibited: building no-code visual animation builders that compete with Webflow; removing proprietary notices. https://gsap.com/standard-license/ (npm `license` field confirms, measured)
- Version: 3.15.0, published 2026-04-13 (npm, measured). Repo pushed 2026-04-13. https://github.com/greensock/GSAP
- Point mismatch: converts everything to cubic beziers and subdivides so anchor counts match. Controls: `shapeIndex` (start-point alignment, `findShapeIndex()` helper), `map: "size" | "position" | "complexity"` (subpath matching), `type: "rotational"` (interpolates rotation+length, avoids kinks), `precompile` (run once, log equalized strings, paste back to skip runtime cost), `MorphSVGPlugin.convertToPath()` for circle/rect/ellipse/polygon/polyline/line, `stringToRawPath` / `rawPathToString`, custom `render` for canvas. https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/
- Scroll: ScrollTrigger `scrub: true` (direct) or `scrub: 1` (1 s catch-up smoothing), `pin`, `start/end` like `"top center"`. https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- GSAP core `attr` plugin docs only promise numeric attributes; path `d` tweening without MorphSVG is not documented. https://gsap.com/docs/v3/GSAP/CorePlugins/Attributes/

### anime.js v4
- 4.5.0, published 2026-08-17, MIT, repo pushed 2026-08-21 (npm + GitHub API, measured). https://github.com/juliangarnier/anime
- `svg.morphTo(target, precision = 0.33)`: works on `<path>` (`d`), `<polyline>`/`<polygon>` (`points`); `precision` 0..1 controls point extrapolation for mismatched counts, 0 = none; returns `[from, to]` strings. https://animejs.com/documentation/svg/morphto/
- Scroll: `autoplay: onScroll({ container, target, axis, enter, leave, sync: true, debug })`; `sync` modes: method names, playback progress (scrub), smooth (number), eased. No native ScrollTimeline use mentioned. https://animejs.com/documentation/events/onscroll , https://animejs.com/documentation/events/onscroll/scrollobserver-synchronisation-modes

### Motion (motion.dev)
- 13.1.1, published 2026-08-20, MIT. https://github.com/motiondivision/motion
- Native `d` animation only when "the two paths are similar" (same number and type of instructions); otherwise docs say use Flubber as a mixer. https://motion.dev/docs/react-svg-animation , https://motion.dev/tutorials/js-svg-path-morphing
- `scroll()` (claimed 5.1 KB) uses native ScrollTimeline when available (compositor-driven), `offset` in 0..1 / named / px / %. https://motion.dev/docs/scroll

### Flubber
- 0.4.2 published 2022-06-18; last commit 2019-10-16; 6.9k stars; MIT (GitHub API, measured). https://github.com/veltman/flubber
- Resamples shapes to polygons (`maxSegmentLength`, default 10 px) so any counts morph; `separate`/`combine`/`interpolateAll`, `toCircle`/`toRect`. Limits in README "To do": no SVG holes, no unclosed lines, straight segments only in output. https://github.com/veltman/flubber

### polymorph-js
- 1.0.2 published 2022-05-13; last commit 2024-05-12; 299 stars; MIT per README/npm (GitHub license field empty). https://github.com/notoriousb1t/polymorph
- "handles variable length paths and holes in paths"; README claims ~6 KB min (measured 3.3 KB gz). https://github.com/notoriousb1t/polymorph

### KUTE.js
- 2.2.6 published 2026-03-26, MIT. https://github.com/thednp/kute.js
- `svgMorph` (samples paths to polygons, `morphPrecision` default 10, path elements only, first subpath only) and `svgCubicMorph` (equalizes cubic segments via svg-path-commander, always-closed). https://thednp.github.io/kute.js/svgMorph.html
- No scroll scrubbing built in.
- Gotcha (measured): `kute.esm.js` imports named exports from `svg-path-commander ^2.1.11`; 2.2.0+ (2026-04) removed them, so a fresh bundle fails unless svg-path-commander is pinned to 2.1.11. The UMD `kute.min.js` is unaffected.

### svg-morpheus
- 0.3.0, last commit 2017-06-20, README: "THIS PROJECT IS NOT MAINTAINED ANYMORE". MIT. https://github.com/alexk111/SVG-Morpheus

### svg-path-morph (Minibrams)
- Same commands, different values only ("morph between X variations of the same SVG path"). Last push 2023-06-02, MIT. https://github.com/Minibrams/svg-path-morph

## 2. Pure CSS: `d: path()` in keyframes

- Support: Chrome 52+, Edge 79+, Firefox 97+, Samsung 6.2+; Safari none (3.1 to 27), iOS none (to 26.6). Global 79.89%. Not Baseline. https://caniuse.com/mdn-css_properties_d , https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/d
- WebKit status: bug 234227 NEW, implemented but disabled outside Safari Technology Preview because of Speedometer regressions; last comment 2026-05-17, no ship date. https://bugs.webkit.org/show_bug.cgi?id=234227
- Interpolation rule: animatable "as specified for basic-shape", i.e. same number of path commands and same command types. https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/d
- Combining `d` keyframes with `animation-timeline` is ordinary CSS (any animatable property); example pen of `d:path()` in keyframes: https://codepen.io/jorgeatgu/pen/bEEemM ; worked SVG + `timeline-scope` + `view-timeline-name` + `animation-range` scroll example (offset-path case): https://denniskats.dev/blog/path_scroll_animation
- Lightning CSS keeps `d:path()` and `@keyframes` intact (measured), so minification does not break the morph itself.

Build-time normalization, verified in Node (svg-path-commander 2.3.1):
- `SVGPathCommander.equalizePaths('M10 10 L90 10 L90 90 L10 90 Z', 'M20 20 Q50 0 80 20 T80 80 L20 80 Z')` returns two paths both `M C C C C` (square became 4 cubics, quad path became 4 cubics). Output pasted into `d: path()` keyframes satisfies the CSS constraint. Also `equalizeSegments` (single subpath), `normalizePath`, `pathToCurve`, `pathToAbsolute`, `reversePath`; MIT; works in Node. https://github.com/thednp/svg-path-commander
- GSAP MorphSVG "precompile" produces the same kind of equalized string pair (logged to console), usable as static keyframe data. https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/

Tricks that work everywhere scroll-driven animations do (Chrome 115+, Safari 26+), no `d` needed:
- Cross-fade stacked SVGs: `opacity` keyframes, one stage per `animation-range` slice. Baseline property.
- `clip-path` basic shapes are animatable (same shape function, same polygon point count); `clip-path: path()` is NOT animatable. Baseline since Jan 2020. https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/clip-path
- Line-draw reveal: `stroke-dasharray` = path length, animate `stroke-dashoffset` to 0 on `animation-timeline: scroll()/view()`; `animation-fill-mode: forwards`. https://cssvg.com/blog/svg-path-animation
- `currentColor` / CSS vars inside inline SVG `fill`/`stroke` keep light/dark theming; nothing above depends on raster.

## 3. SMIL `<animate attributeName="d">`

- Support: Chrome 5+, Edge 79+, Safari 6+, Firefox 4+, iOS 6+; global 96.42%; IE none. https://caniuse.com/svg-smil ; BCD `svg.elements.animate`: Chrome 2, Firefox 4, Safari 3.1. https://github.com/mdn/browser-compat-data/blob/main/svg/elements/animate.json
- Chrome's 2015 deprecation was suspended; SMIL is not deprecated. https://github.com/Fyrd/caniuse/issues/4167 , https://css-tricks.com/smil-on/
- `d` via SMIL needs same command count and types (same as CSS). https://cssvg.com/blog/svg-path-animation
- Not scroll-drivable declaratively, but scrubbable with 2 lines of JS: `svg.pauseAnimations()` then `svg.setCurrentTime(progress * dur)` on scroll. Both APIs Baseline widely available since July 2015. https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement/setCurrentTime , https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement/pauseAnimations , example: https://xyris.app/blog/creating-scroll-triggered-svg-animations-in-the-simplest-way/

## 4. Scroll-driven animations support, Aug 2026

- `animation-timeline`: Chrome 115+, Edge 115+, Opera 101+, Samsung 23+, Safari 26.0+ (macOS + iOS, released 2025-09-15), Firefox Release: none (caniuse lists 157 = current Nightly). Global 85.43%. https://caniuse.com/mdn-css_properties_animation-timeline , https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- BCD raw data: `animation-timeline`, `animation-range`, `view-timeline-name` = Chrome 115 / Safari 26 / Firefox "preview"; `timeline-scope` = Chrome 116 / Safari 26 / Firefox "preview". https://github.com/mdn/browser-compat-data/tree/main/css/properties
- Firefox: pref `layout.css.scroll-driven-animations.enabled`, on by default in Nightly since 136 (bug 1817303, RESOLVED FIXED, Firefox 136), off in Beta/Release; `<timeline-range-name>` added 151/152 behind the same pref. No linked bug targets Release. https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Experimental_features , https://bugzilla.mozilla.org/show_bug.cgi?id=1817303 , https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/152
- Interop 2026 lists Scroll-driven Animations as a focus area (Mozilla, Apple, Google, Microsoft, Igalia). https://webkit.org/blog/17818/announcing-interop-2026/
- Safari 26.0 shipped `animation-timeline`, `animation-range(-start/-end)`, `scroll()`, `view()`. Safari 26.4 (2026-03-24): scroll-driven animations run on the compositor thread. Safari 26.5 (2026-05-11): fixed `scroll` range name, `animation-play-state: paused`, wrong progress near 0%/100% of view timelines, bfcache restore. https://webkit.org/blog/17333/webkit-features-in-safari-26-0/ , https://webkit.org/blog/17862/webkit-features-for-safari-26-4/ , https://webkit.org/blog/17938/webkit-features-for-safari-26-5/
- `timeline-scope: all` only Safari/Samsung/iOS WebView per CSS-Tricks; use explicit names. https://css-tricks.com/almanac/properties/t/timeline-scope/

Minifier status (why the repo has `cssMinify: false`):
- Spec/MDN: `animation-timeline` is reset-only in the `animation` shorthand; a shorthand containing a timeline value is invalid and the whole declaration is dropped, so declare the longhand after the shorthand. https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation , https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- Lightning CSS 1.33.0 (latest, and the version inside Vite 8.2.1 used by Astro 7.2.0) folds `animation-timeline: view()` and `--tl` into the shorthand (measured on a test file and on the repo build: 5 of 6 timelines folded). Bug #1283 opened 2026-06-23, open, no workaround, no feature flag for shorthand merging. https://github.com/parcel-bundler/lightningcss/issues/1283 , https://lightningcss.dev/transpilation.html
- Vite: "Vite uses Lightning CSS to minify CSS in production builds by default"; `build.cssMinify` accepts `'esbuild'`. https://vite.dev/guide/features#lightning-css
- esbuild 0.28.2 (repo's version and latest) does NOT fold: output keeps `animation:grow 1ms linear both;animation-timeline:view()` (measured).
- Repo build with `vite: { build: { cssMinify: 'esbuild' } }` (measured, output to scratchpad, repo untouched): 6/6 `animation-timeline` longhands kept; CSS 1672 + 2074 = 3746 B gz vs 1802 + 2676 = 4478 B gz with `cssMinify: false`, vs 1666 + 2059 B gz with Lightning CSS (which breaks 5 timelines). Net: switch `false` to `'esbuild'`.

## 5. Named timeline scoping: left text drives sticky right artwork

- Default lookup for a named timeline is ancestors only; `timeline-scope` on a common ancestor hoists the name so siblings/cousins can reference it. Chrome 116+, Safari 26+, Firefox Nightly. https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/timeline-scope , https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- Minimal pattern (Chrome docs):
  ```css
  .parent { timeline-scope: --tl; }
  .parent .scroller { scroll-timeline: --tl; }
  .parent .scroller ~ .subject { animation: animate linear; animation-timeline: --tl; }
  ```
- MDN working example: `body { timeline-scope: --my-scroller }`, `.scroller { scroll-timeline-name: --my-scroller }`, sibling `.animation { animation-timeline: --my-scroller }`. https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/timeline-scope
- View-timeline variant for this site: each left `<section>` gets `view-timeline-name: --stage-N`; the grid wrapper gets `timeline-scope: --stage-1, --stage-2, --stage-3, --stage-4`; the sticky right `<svg>` (or its `<path>`) gets one animation per stage with `animation-timeline: --stage-N` and `animation-range: entry 0% cover 50%` (or `cover` slices). Same shape as denniskats "Case 2" (timeline-scope + view-timeline-name + animation-range + fill-mode forwards). https://denniskats.dev/blog/path_scroll_animation , https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- Multiple named timelines on one element are allowed (comma list); sticky positioning of the subject is fine because the timeline is measured on the text section, not the sticky element. https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/timeline-scope
- Gotchas: `timeline-scope` must sit on an ancestor of the element that declares the timeline; it does nothing alone; name collisions resolve by proximity and scroll-timelines beat view-timelines; `overflow: hidden` on an intermediate ancestor creates a scroller and breaks view timelines, use `overflow: clip`. https://css-tricks.com/almanac/properties/t/timeline-scope/ , https://www.smashingmagazine.com/2024/12/introduction-css-scroll-driven-animations/
- Demo catalogue (no timeline-scope-specific demo listed, but view-timeline range visualizer tools): https://scroll-driven-animations.style/ (tools: `/tools/view-timeline/ranges/`). Repo already uses this mechanism (`view-timeline-name: --tl` at `src/components/Timeline.astro:64`).

## 6. Build-time tooling and Figma

- svg-path-commander 2.3.1 (MIT, Node-capable, repo pushed 2026-08-05): `equalizePaths`, `equalizeSegments`, `normalizePath`, `pathToCurve`, `pathToAbsolute`, `reversePath`, `getPathBBox`. Verified above. https://github.com/thednp/svg-path-commander
- GSAP MorphSVG precompile / `stringToRawPath` + `rawPathToString`: equalized cubic strings you can freeze into CSS. https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/
- anime.js `svg.morphTo()` returns the `[from, to]` equalized strings (runtime, but can be logged once and pasted). https://animejs.com/documentation/svg/morphto/
- svg-path-interpolator (CLI, MIT, last push 2022-05): samples beziers into polygon point arrays at a chosen precision; useful if you want polygon-based `clip-path: polygon()` morphs. https://github.com/justinwilaby/svg-path-interpolator
- SVGO: default preset includes `convertPathData` (relative/absolute switching, curve-to-line, `z` conversion, `floatPrecision` 3). It rewrites command structure, so run SVGO first, then equalize; or disable `convertPathData` for morph source files. https://svgo.dev/docs/plugins/convertPathData/
- Figma: flatten each stage to a single path (Flatten, Outline Stroke) so export is one `<path>`; the "Vector Path Editor" plugin previews and sets the first vertex and fill rule (needs flattened shapes), which fixes start-point mismatch (the same issue GSAP solves with `shapeIndex`). https://www.figma.com/community/plugin/1391765568770221941/vector-path-editor , https://help.figma.com/hc/en-us/articles/360039957634-Edit-vector-layers
- Draw all four stages with the same subpath count and winding direction; morph libraries match subpaths by size/position (GSAP `map`) and Flubber cannot do holes at all. https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/ , https://github.com/veltman/flubber

## Sources (all)

- https://caniuse.com/mdn-css_properties_animation-timeline
- https://caniuse.com/mdn-css_properties_d
- https://caniuse.com/svg-smil
- https://github.com/mdn/browser-compat-data (css/properties/{animation-timeline,timeline-scope,d,view-timeline-name,animation-range}.json, svg/elements/animate.json)
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/d
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/timeline-scope
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/clip-path
- https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement/setCurrentTime
- https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement/pauseAnimations
- https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Experimental_features
- https://bugzilla.mozilla.org/show_bug.cgi?id=1817303
- https://bugzilla.mozilla.org/show_bug.cgi?id=1676784
- https://bugs.webkit.org/show_bug.cgi?id=234227
- https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- https://webkit.org/blog/17862/webkit-features-for-safari-26-4/
- https://webkit.org/blog/17938/webkit-features-for-safari-26-5/
- https://webkit.org/blog/17818/announcing-interop-2026/
- https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- https://scroll-driven-animations.style/
- https://css-tricks.com/almanac/properties/t/timeline-scope/
- https://www.smashingmagazine.com/2024/12/introduction-css-scroll-driven-animations/
- https://denniskats.dev/blog/path_scroll_animation
- https://github.com/parcel-bundler/lightningcss/issues/1283
- https://lightningcss.dev/transpilation.html
- https://vite.dev/guide/features#lightning-css
- https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/
- https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- https://gsap.com/docs/v3/GSAP/CorePlugins/Attributes/
- https://gsap.com/standard-license/
- https://webflow.com/blog/gsap-becomes-free
- https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/
- https://animejs.com/documentation/svg/morphto/
- https://animejs.com/documentation/events/onscroll
- https://animejs.com/documentation/events/onscroll/scrollobserver-synchronisation-modes
- https://motion.dev/docs/react-svg-animation
- https://motion.dev/tutorials/js-svg-path-morphing
- https://motion.dev/docs/scroll
- https://github.com/veltman/flubber
- https://github.com/notoriousb1t/polymorph
- https://github.com/thednp/kute.js and https://thednp.github.io/kute.js/svgMorph.html
- https://github.com/alexk111/SVG-Morpheus
- https://github.com/Minibrams/svg-path-morph
- https://github.com/thednp/svg-path-commander
- https://github.com/justinwilaby/svg-path-interpolator
- https://svgo.dev/docs/plugins/convertPathData/
- https://www.figma.com/community/plugin/1391765568770221941/vector-path-editor
- https://cssvg.com/blog/svg-path-animation
- https://xyris.app/blog/creating-scroll-triggered-svg-animations-in-the-simplest-way/
- https://github.com/Fyrd/caniuse/issues/4167 , https://css-tricks.com/smil-on/
- https://codepen.io/jorgeatgu/pen/bEEemM
