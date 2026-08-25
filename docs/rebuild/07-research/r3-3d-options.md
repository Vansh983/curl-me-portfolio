# R3: "3D-style" scroll-driven life-stage scene, options and verified numbers

Date: 2026-08-25. Sizes below marked **[measured]** were built locally with esbuild 0.28.2 (`--bundle --minify --format=esm`, gzip -9, brotli default) from fresh npm installs in the scratchpad. Everything else has a source URL.

## Verdict (what the numbers say)

- Cheapest "3D-style": CSS 2.5D (perspective + preserve-3d + `animation-timeline: scroll()`), 0 KB JS. Blocked by Firefox (no ship, behind flag), so needs a JS fallback or a static fallback for ~5 to 15% of users. Sources in section 4.
- Cheapest real pseudo-3D that matches paper-and-ink: **Zdog, 8.1 KB gz [measured]**, MIT, flat-shaded line-art by design, renders to SVG or canvas. Risk: unmaintained (last commit Jan 2022, "v1 beta"). No morph targets; shapes are point arrays you can lerp yourself.
- Cheapest real WebGL: **OGL, 23 KB gz with GLTFLoader [measured]**, Unlicense. GLTF animations + skinning + Draco yes, **morph targets not supported (TODO in source)**, no meshopt.
- Vanilla three.js floor is **130 KB gz** for a cube, **158 KB gz** with GLTFLoader + AnimationMixer + CatmullRom camera path + MeshToonMaterial, **166 KB gz** adding Draco + meshopt loaders [measured]. WebGPU build: **264 KB gz** and still "experimental" per the three.js manual.
- Frameworks add 90 to 170 KB gz on top of three: **Threlte 250 KB gz, TresJS 309 KB gz, R3F + drei 328 KB gz** [measured]. drei `ScrollControls` hijacks page scroll (own container); TresJS cientos has `htmlScroll` to keep native scroll; Threlte has no scroll helper, wire `mixer.setTime` yourself.
- Spline is the heaviest: **~182 KB gz minimum (entry 36 KB + classic runtime chunk 146 KB) [measured]**, 1.5 MB physics wasm lazy, watermark on Free, and the docs say the Scroll event type "only works with the Viewer export".
- model-viewer: **289 KB gz** shipped build (bundles three) [measured]; `currentTime` and `camera-orbit` are settable so scroll scrubbing works, but no built-in scroll binding and no theming beyond CSS background.
- Image-sequence scrub is bandwidth-bound: Apple's AirPods page is 148 frames at ~31 KB each; Apple serves a single 347 KB image on slow mobile. AVIF/WebP frames at 1080p run ~3 to 5 MB per 60 frames. Video `currentTime` scrub needs keyframe-every-frame encoding (5 to 6x file size) and is bad on Android; Chrome-only WebCodecs path exists (ScrollyVideo).
- Character pipeline: Luma Genie is dead (sunset Jan 1, 2026). For stylized cartoon characters the April 2026 comparison ranked Tripo P1 best, Meshy 5 "slightly realistic", Rodin Gen-2 wrong for cartoon. Free CC0 rigged low-poly humans exist (Quaternius Universal Base Characters, Kenney Mini Characters). Mixamo is free but in maintenance mode with a multi-day outage in June 2025. Blender 5.2.1 is current and free (GPL); Line Art modifier gives the ink-outline look.

## Measured bundle table [measured, three 0.185.1 unless noted]

| Entry | min KB | gz KB | br KB |
|---|---|---|---|
| Zdog 1.1.3 (Illustration + Shape/Ellipse/Box/Anchor/Group) | 28.7 | 8.1 | 7.2 |
| OGL 1.0.11 (Renderer, Camera, GLTFLoader, Orbit) | 80.0 | 23.3 | 20.1 |
| @theatre/core 0.7.2 (getProject, sheet, sequence.position) | 107.6 | 35.3 | 31.1 |
| three WebGL: cube + MeshBasicMaterial | 518.6 | 130.1 | 108.1 |
| three WebGL + GLTFLoader + AnimationMixer + CatmullRomCurve3 + MeshToonMaterial + lights | 623.6 | 158.4 | 131.3 |
| same + DRACOLoader + meshopt_decoder | 650.2 | 165.9 | 138.0 |
| three/webgpu WebGPURenderer + GLTFLoader + AnimationMixer | 1,007.6 | 263.6 | 213.3 |
| Threlte core 8.5.16 + extras 9.21.0 + Svelte 5.56.10, `<Canvas><GLTF/>` | 917.0 | 249.7 | 204.7 |
| TresJS core 5.8.3 + cientos 5.8.1 + Vue 3.5.41, TresCanvas + useGLTF + useAnimations | 1,114.8 | 308.7 | 255.1 |
| R3F 9.7.0 + drei 10.7.8 + React 19.2.8, Canvas + ScrollControls + useGLTF + useAnimations | 1,176.9 | 327.6 | 263.7 |
| @google/model-viewer 4.3.1 (esbuild of package) | 1,066.2 | 303.8 | 249.6 |
| model-viewer shipped `dist/model-viewer.min.js` | 1,068.9 | 289.2 | 235.2 |
| model-viewer shipped `dist/model-viewer-module.min.js` (three external) | 475.1 | 143.7 | 119.7 |
| @splinetool/runtime 2.0.6 all 114 chunks inlined | 4,026.5 | 1,076.1 | 851.0 |
| Spline `runtime.js` entry only | 126.9 | 36.4 | n/a |
| Spline `runtime-classicRuntime` chunk (loaded for normal scenes) | 641.2 | 145.6 | n/a |

Spline lazy wasm on disk: physics.wasm 1,569,588 B, hana-ui.wasm 3,017,894 B, navmesh.wasm 352,193 B, boolean.wasm 152,529 B, process.wasm 329,327 B. Bundlephobia reports 270,137 B gz for the package: https://bundlephobia.com/api/size?package=@splinetool/runtime@2.0.6

## 1. Three.js, vanilla

- Version 0.185.1 published 2026-07-01, MIT, 114,771 stars (npm registry; `gh api repos/mrdoob/three.js`).
- WebGPURenderer: manual says "still in an experimental state although its maturity level has been greatly improved", automatic WebGL 2 fallback, `forceWebGL: true` option, import from `three/webgpu`, custom `ShaderMaterial` not supported (must use TSL). https://threejs.org/manual/en/webgpurenderer.html
- Safari 26 beta "adds support for WebGPU" (macOS, iOS, iPadOS, visionOS). https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/
- Scroll scrub: drive `AnimationMixer.setTime(progress * clip.duration)` from scroll; forum threads map GSAP ScrollTrigger progress to mixer time. https://threejs.org/manual/en/animation-system.html , https://discourse.threejs.org/t/gsap-animationmixer/34777 , https://discourse.threejs.org/t/play-animation-with-scroll/27012
- Morph targets: `mesh.morphTargetInfluences` / `morphTargetDictionary`; "Morphing is always done between sets of equal number of elements", so kid → adult stages must share topology (one base mesh with shape keys), otherwise crossfade or swap meshes. https://threejs.org/docs/#api/en/objects/Mesh.morphTargetInfluences , https://discourse.threejs.org/t/how-can-i-morph-objects-with-different-number-of-vertices/61371
- Compression: meshopt decoder is ~7 KB gz, decodes at ~1 GB/s with WASM SIMD, handles geometry + morph targets + animation; Draco decoder is >100 KB, and "for geometry <1MB, the size of the WASM decoder library may outweigh size savings". https://github.com/KhronosGroup/glTF/pull/1702 , https://aframe.io/docs/1.7.0/components/gltf-model.html , https://github.com/google/model-viewer/issues/337
- Tree-shaking reality: WebGLRenderer pulls most of core; the floor is ~130 KB gz [measured], matching forum reports that three "doesn't really tree-shake well". https://discourse.threejs.org/t/tree-shaking-three-js/1349
- Camera on path from Blender: Codrops 2026-07-07, curve sampled to JSON by a Python script (Blender Z-up → three Y-up), rebuilt with `CatmullRomCurve3`, scroll via GSAP Observer + `gsap.quickTo`, vanilla three 0.184 + gsap 3.15. https://tympanus.net/codrops/2026/07/07/building-a-scroll-driven-3d-gallery-using-a-blender-camera-path-with-three-js-and-gsap/ , https://github.com/gaspoorf/curve-gallery
- Toon look: `MeshToonMaterial` is in core (bundled in the 158 KB measurement above).
- Astro island without a framework: plain `<script>` is bundled as `type="module"` and deduped; `client:*` directives apply only to UI-framework components. Lazy-load with a dynamic `import()` from an IntersectionObserver. https://docs.astro.build/en/guides/client-side-scripts/
- Astro + three portfolios found on GitHub (small, recent): untaughrod/untaughrod.github.io (Astro + three + GSAP, 2026-08), Mengfeidai1031/portfolio, arzzzae/arzzzae.github.io, TigranPetosyants/TigranPetosyants.github.io (`gh search repos "astro three.js"`).
- GSAP 3.15.0 is free including ScrollTrigger and all former Club plugins since April 2025 (Webflow). Lenis 1.3.26, MIT. https://webflow.com/updates/gsap-becomes-free , npm registry.

## 1b. Frameworks (React allowed)

### React Three Fiber + drei
- R3F 9.7.0, drei 10.7.8, MIT, r3f 31,788 stars, drei 9,818 stars, both pushed 2026-08-25. Bundle **328 KB gz** [measured].
- `ScrollControls`: "Scroll controls create an HTML scroll container in front of the canvas"; props `pages`, `distance`, `damping` (0.2 s default), `horizontal`, `infinite` (experimental); `useScroll()` gives `offset`, `delta`, `range()`, `curve()`, `visible()`. https://drei.docs.pmnd.rs/controls/scroll-controls , https://github.com/pmndrs/drei/blob/master/src/web/ScrollControls.tsx
- Native page scroll is not supported by ScrollControls; forum answer: fork it or use Lenis; TresJS has `htmlScroll` which "only works with Vue". https://discourse.threejs.org/t/forcing-scrollcontrols-to-use-native-htmlscroll/62293
- Scrub pattern with GLTF: drei example `scrollcontrols-gltf` (pmndrs/examples, drcmda/projects). Alternative pattern: GSAP timeline `seek(scroll.offset * duration)`. https://github.com/pmndrs/examples/tree/main/demos/scrollcontrols-gltf , https://dev.to/wawasensei/scroll-animations-with-react-three-fiber-and-gsap-273j
- Real portfolio: aimees-papercraft-world.com (Andrew Woan), R3F 9.5 + drei 10.7 + GSAP + Lenis + three 0.182, FWA of the Day, stylized papercraft look from Blender, 182 stars. https://github.com/andrewwoan/aimee-rains-papercraft-world (deps from package.json). Other scroll-driven three portfolios listed 2026-05-04: bilal.show, sebastien-lempens.com, jreyes-mc-portfolio.com, ameen-abdullah.dev (WebGPU + Vue). https://www.creativedevjobs.com/blog/best-threejs-portfolio-examples-2025
- Apple-style scroll rig in R3F (custom `useScrollProgress` → lerp in `useFrame`), 2025-10-02. https://www.builder.io/blog/webgl-scroll-animation

### Threlte (Svelte)
- @threlte/core 8.5.16, @threlte/extras 9.21.0, MIT, 3,331 stars, pushed 2026-07-30. Bundle **250 KB gz** [measured].
- `useGltfAnimations` returns `{ actions, mixer }`; set `mixer.setTime()` from scroll yourself. No scroll helper in extras (exports checked: GLTF, useGltf, useGltfAnimations, Float, Align, useSuspense). https://threlte.xyz/docs/reference/extras/use-gltf-animations
- `@threlte/theatre` 3.2.2: `useSequence()` exposes `position` as a writable store, doc example scrubs by drag not scroll. https://threlte.xyz/docs/reference/theatre/use-sequence
- Showcase page currently shows placeholder entries only. https://threlte.xyz/showcase . GitHub portfolios: stefanreifenberg/threlte-portfolio (7 stars).

### TresJS (Vue)
- @tresjs/core 5.8.3, cientos 5.8.1, MIT, 3,670 stars, pushed 2026-08-17. Bundle **309 KB gz** [measured].
- cientos `ScrollControls` props found in dist: `distance`, `horizontal`, `htmlScroll`, `smoothScroll`; `htmlScroll` uses native page scroll (confirmed in the three.js forum thread above). Also exports `useGLTF`, `useAnimations`, `GLTFModel`, `MouseParallax`.

## 2. Spline

- Runtime 2.0.6 published 2026-08-25, no `license` field in package.json. Sizes: see table (entry 36 KB gz + classic runtime 146 KB gz; 114 JS chunks; physics wasm 1.5 MB lazy).
- Runtime API (from `runtime.d.ts`): `setVariable`, `getVariable`, `emitEvent`, `emitEventReverse`, `findObjectByName`, `setBackgroundColor`, `setZoom`, `setSize`, `renderOnDemand`, `requestRender`, `addEventListener`, `play`, `stop`, `dispose`.
- Scroll: "The Scroll event has a Type called Scroll which only works with the Viewer export." Two types: Steps (scroll amount per transition) and Scroll (page-scroll based). Modes: Enter View (top/middle/bottom + px offset) and Page (px from top). https://docs.spline.design/interaction-states-events-and-actions/events/scroll-event
- Workaround for code export: listen to page scroll yourself and call `setVariable('scroll', progress)` with a Variable driving states (this is the pattern used in the wild, not an official doc). react-spline README lists `onSplineScroll` callback and `emitEvent('scroll', name)`. https://github.com/splinetool/react-spline
- Pricing (spline.design/pricing, fetched 2026-08-25): Free $0 (limited files, watermark on web exports and embeds, 2,000 AI credits/mo); Hobby $12/seat/mo annual or $15 monthly (no watermark on web exports, 3,000 AI credits); Pro $25 annual / $30 monthly (no watermark on web embeds); Max $60 annual / $70 monthly ("Download Code Export", 10,000 AI credits); Enterprise custom ("Self-Hosted Export"). https://spline.design/pricing
- Light/dark: the only theme docs are the editor UI (System/Light/Dark, 2025-11-24). No documented scene-level theme. Possible via Variables + `setVariable` / `setBackgroundColor` from the page's theme toggle (inference). https://updates.spline.design/changelog/introducing-light-mode-support , https://docs.spline.design/basics/change-theme-on-spline
- Embed issues reported: scroll events not firing in some embeds; Squarespace/Framer threads about embeds trapping scroll. https://www.framer.community/c/support/spline-viewer-embedding-not-working-correctly-sometimes , https://forum.squarespace.com/topic/290574-embedded-spline-animation-wont-allow-me-to-scroll-past-it/

## 3. `<model-viewer>`

- 4.3.1, Apache-2.0, published 2026-06-04, 8,211 stars. Shipped `model-viewer.min.js` **289 KB gz** [measured]; module build without three 144 KB gz.
- Attributes (from repo docs.json): `camera-orbit` = `"$theta $phi $radius"` e.g. `"10deg 75deg 1.5m"`; `camera-target` `"$X $Y $Z"`; `min-/max-camera-orbit`; `interpolation-decay` in ms (asymptotic, doubling halves speed); `animation-name`; `autoplay`; `currentTime` "can be set in order to seek along the timeline"; `timeScale`; `paused` read-only; `touch-action` default `pan-y` so vertical page scroll works over the element; `disable-zoom` stops wheel swallowing. https://github.com/google/model-viewer/blob/master/packages/modelviewer.dev/data/docs.json
- No scroll attribute exists; scroll-scrub = your listener sets `currentTime` or `camera-orbit`. Official animation example uses `currentTime = 0` and `timeScale`. https://github.com/google/model-viewer/blob/master/packages/modelviewer.dev/examples/animation/index.html
- Lazy-loading three inside model-viewer was requested in 2019 and not implemented (issue open history). https://github.com/google/model-viewer/issues/337
- Limits: one model per element, no material/theme API beyond CSS background and `environment-image`; morph targets only via GLTF animations.

## 4. Fake 3D / 2.5D with CSS scroll-driven animations (0 KB JS)

- Support: Chrome 115 (2023-07-18), Edge 115, Safari 26 and iOS 26 (2025-09-15), Firefox not shipped (Baseline "limited", blocked by Firefox since Sep 2025). https://web-platform-dx.github.io/web-features-explorer/features/scroll-driven-animations/ . Firefox 152 still behind `layout.css.scroll-driven-animations.enabled` per a June 2026 writeup. https://www.frontendhorizon.com/blog/view-transitions-api-and-css-scroll-driven-animations-the-browser-wins-of-2026
- Technique: `animation-timeline: scroll()` / `view()`, `animation-range`, `@supports (animation-timeline: scroll())` for progressive enhancement, `prefers-reduced-motion` guard; pitfall: `view()` elements flash on reverse scroll, fix with negative inset. CSS-Tricks, Blake Lundquist, 2025-08-06. https://css-tricks.com/bringing-back-parallax-with-scroll-driven-css-animations/
- Sticky stage pattern: a `position: sticky` right column whose layers animate on the document scroll timeline; WebKit guide covers `animation-timeline: scroll(root)` and `view()`. https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/
- Layered depth: `perspective` on container, `transform-style: preserve-3d` on wrappers, `translateZ` + compensating `scale` on layers. https://frontend-hero.com/css-parallax-scrolling-guide
- Best demos (Bramus, Chrome DevRel): Cover Flow (`perspective: 40em`, view timelines rotate covers; transform the `img` not the `li` to avoid scroll-length flicker), 3D Shoe Explorer ("actual 3D-models of shoes, rotating as you scroll"), Stacking Cards, Parallax Carousel. https://scroll-driven-animations.style/ , https://scroll-driven-animations.style/demos/cover-flow/css/ , https://addyosmani.com/blog/coverflow/
- Codrops 3D-on-scroll (JS-driven, GSAP + Lenis): Exploring 3D Image Rotations on Scroll, 2026-06-18, repo codrops/RotatingOnScrollAnimations; Staggered 3D Grid Animations, 2024-10-16; On-Scroll 3D Grid (perspective grids), repo codrops/Scroll3DGrid; 3D scroll text (cylinder/circle/tube), 2025-11-04; Cinematic Scroll Animations demo built with OGL + GSAP. https://tympanus.net/codrops/2026/06/18/exploring-3d-image-rotations-on-scroll/ , https://tympanus.net/codrops/2024/10/16/staggered-3d-grid-animations-with-scroll-triggered-effects/ , https://tympanus.net/Development/Scroll3DGrid/ , https://tympanus.net/codrops/2025/11/04/creating-3d-scroll-driven-text-animations-with-css-and-gsap/ , https://tympanus.net/Tutorials/Cinematic3DScroll/
- SVG scene parallax: Alistair Shepherd's layered SVG landscape (layers move at different rates), isladjan's CodePen SVG parallax (GSAP ScrollTrigger), guttentag's radial SVG parallax (SMIL). https://alistairshepherd.uk/writing/parallax-svg-landscape-1/ , https://codepen.io/isladjan/pen/abdyPBw , https://codepen.io/guttentag/post/radial-parallax-with-svg-smil-and-css
- Fit for this brief: four life-stage SVG illustrations as layers in one sticky stage, cross-faded and translated by the root scroll timeline; monotone + one accent is trivial with `currentColor` and CSS variables, so light/dark is free.

## 5. Image-sequence and video scrubbing

### Image sequence (Apple technique)
- Apple AirPods Pro page: 148 JPEG frames (`0001.jpg` to `0148.jpg`), ~31 KB each; demo page transferred 55.8 MB over 1,609 requests; Apple serves one 347 KB fallback image on slow mobile. Canvas `drawImage` on scroll, preload all frames first. CSS-Tricks, Jurn van Wissen, 2020-05-22. https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/ ; CodePen recreation uses 147 frames at 1158x770. https://codepen.io/flcwl/pen/LYYevVr
- Modern numbers: 151 frames at 1920x1080 from a 30 fps export ("60fps performance was horrendous"), PNG "way too heavy", converted to AVIF; set canvas width/height attributes to frame size to avoid blur; canvas is invisible to screen readers. https://www.jamesbattye.dev/articles/building-a-scroll-based-image-sequencer-with-gsap
- Rule of thumb: 60 WebP frames at 1080p ≈ 3 to 5 MB (15 to 20 MB PNG); use `img.decode()` / `createImageBitmap()` to pre-decode; cap DPR at 2; serve a lower-res set on phones; skipping every other frame usually reads fine. https://gsapvault.com/blog/scroll-image-sequence-tutorial
- Server-delivered frames were 3 to 4.5x faster to become scrubbable than extracting frames client-side from a video (~3 MB, 20% larger than the source video). https://www.ghosh.dev/posts/playing-with-video-scrubbing-animations-on-the-web/
- Blender pipeline is free: Blender 5.2.1 is the latest tag (GitHub mirror commit 2026-08-24), GPL. https://github.com/blender/blender/tags . Blender 5.1 shipped March 2026, 5.2 July, 5.3 November per the roadmap. https://www.cgchannel.com/2026/02/see-the-2026-blender-development-roadmap/
- Line-art look: Grease Pencil Line Art modifier detects contour, crease, intersection, material-border, loose edges, can output filled strokes, supports illumination-based filtering, and can reuse cached scene data from the first Line Art modifier in the stack. https://docs.blender.org/manual/en/latest/grease_pencil/modifiers/generate/line_art.html . Freestyle has more customization but is "resource-intensive" / slow. https://blenderartists.org/t/grease-pencil-v-freestyle/1568908 . Toon BSDF exists in Cycles. https://www.softwarerendering.com/blender-rendering-guide.php
- Blender 5.1 known bugs: Freestyle fails with "Face Smoothness" checked; Line Art vertex-weight transfer broken. https://developer.blender.org/docs/release_notes/5.1/corrective_releases/
- Light/dark: render two frame sets (ink on paper, paper on ink) or render alpha PNG/WebP ink-only frames and let CSS supply the paper color (inference).

### Video `currentTime` scrubbing
- Jank cause: seeking to non-keyframes. Test: keyframe every 5 vs every 100 frames: MP4 845 KB vs 146 KB, WebM 1,038 KB vs 195 KB (5 to 6x). Safari "seems to have the best support"; Firefox is choppy with MP4 even with dense keyframes, needs WebM; iOS Safari does not play WebM, so ship both. Commands: `ffmpeg -i in.mp4 -vcodec libvpx-vp9 -g 10 -acodec copy out.webm` and `ffmpeg -i in.mp4 -vcodec libx264 -x264-params keyint=10:scenecut=0 out.mp4`. https://muffinman.io/blog/scrubbing-videos-using-javascript/
- Encode at keyframe interval 1 (`-g 1`) for smoothest scrub; video needs `playsinline muted preload="auto"`; Android performs poorly, fall back to canvas + JPG frames. 2023-10-30. https://blog.yoanngueny.com/the-secrets-for-an-optimized-scroll-based-html5-video/
- Direct `currentTime` on mobile showed "stupendous" frame drops at higher resolutions. https://www.ghosh.dev/posts/playing-with-video-scrubbing-animations-on-the-web/
- ScrollyVideo 0.0.24 (2025-03-07), MIT, 1,088 stars: decodes all frames with WebCodecs (Chrome only, delayed until decoded), falls back to `currentTime`; "on mobile safari browsers ... [currentTime] performs better", still recommends keyframe = 1. https://github.com/dkaoster/scrolly-video
- Mega-command gist for scrub-friendly encodes. https://gist.github.com/jeffpamer/f3134c5145238d0fd4752221b2d75eb7

## 6. Lightweight WebGL / pseudo-3D

### Zdog
- 1.1.3 on npm (2022-05-25), MIT, 10,650 stars, 55 open issues, last commit 2022-01-22, last GitHub release v1.1.1 2019-10-23. README: "v1 is a beta-release ... Expect lots of changes for v2." https://github.com/metafizzy/zdog , https://zzz.dog/
- Renders 3D-positioned flat shapes through the 2D canvas or SVG API, ~2,100 LOC, 28 KB min (README claim; 28.7 KB min / 8.1 KB gz measured with all primitives).
- Scroll: no built-in; set `illo.rotate` / shape props from scroll progress then `illo.updateRenderGraph()`. No morph targets; `Shape.path` is a plain point array you can interpolate between stages (inference). Wrappers: pmndrs/react-zdog (453 stars), svelte-zdog, vue-zdog. "Made with Zdog" CodePen collection linked from https://zzz.dog/extras
- Fit: exactly the flat-shaded, stroked, two-tone look; `stroke`/`color` can be CSS-variable driven when rendering to SVG, so light/dark is a CSS change.

### OGL
- 1.0.11 (npm 2025-01-27), Unlicense (public domain), 4,634 stars, last commit 2025-04-13. README: core 8 KB, math 6 KB, extras 15 KB gz. https://github.com/oframe/ogl
- GLTFLoader: animations (`GLTFAnimation`), skinning (`GLTFSkin`), `KHR_draco_mesh_compression`, `KHR_texture_basisu`, `EXT_texture_webp`; **morph targets are a TODO**; no `EXT_meshopt_compression`. https://github.com/oframe/ogl/blob/master/src/extras/GLTFLoader.js
- Used by Codrops "Cinematic Scroll Animations" demo (OGL + GSAP). https://tympanus.net/Tutorials/Cinematic3DScroll/

### Theatre.js
- @theatre/core 0.7.2 (2024-05-19) Apache-2.0; @theatre/studio AGPL-3.0 (dev-only). 12,631 stars, public repo last commit 2024-04-11. README: "Theatre.js 1.0 is around the corner. We have temporarily moved development to a private repo". https://github.com/theatre-js/theatre
- Scroll: `sheet.sequence.position = t` is a plain setter. Core-only bundle 35 KB gz [measured]. https://www.theatrejs.com/docs/latest/api/core
- Risk: 0.7.x targets three r155-era; no public release since 2023-08-10 (v0.7.0). https://www.theatrejs.com/docs/latest/releases

### curtains.js, Blotter
- curtainsjs 8.1.6 (2024-05-02), MIT, 1,824 stars, repo pushed 2025-04-03; turns DOM elements into WebGL planes (image/video shaders), not a scene/character tool. https://github.com/martinlaxenaire/curtainsjs
- Blotter 2.1.0 (npm 2022-06-13), repo last push 2020-07-28, 3,078 stars, Snyk "Inactive"; text effects only. https://github.com/bradley/Blotter , https://snyk.io/advisor/npm-package/blotter

## 7. Asset generation and rigging (2026)

- Comparison (StraySpark, 2026-04-23): "Tripo P1 was best on the stylized chicken. Clean silhouette, good cartoon proportions"; Meshy 5 "slightly realistic when I asked for cartoon"; Rodin Gen-2 "stylistically wrong for 'cartoon'"; CSM Cube 2 best topology (quad flow, edge loops at joints). https://www.strayspark.studio/blog/generative-3d-tools-comparison-meshy-rodin-tripo-csm-2026
- Meshy: Free 100 credits/mo under CC BY 4.0 (attribution required); Pro $20/mo ($240/yr) 1,000 credits, own assets, rigging + animation included; Premium $40; Ultra $100; Studio $70 (+$10/seat). Exports .glb/.fbx/.obj/.usdz/.stl/.blend. Auto-rig "in under 30 seconds", handles stylized proportions, 600+ motions on paid, 20+ free. https://www.meshy.ai/pricing , https://www.meshy.ai/features/ai-auto-rigging
- Tripo: Free 200 credits/mo non-commercial; Pro $19.90/mo ($238.80/yr) 3,000 credits commercial; Max $89.90/mo 25,000 credits + "AI Model Stylization" (cartoon/sketch); Team $54.95/seat. Blender/Unity/Unreal/Godot plugins, separate API billing. https://www.tripo3d.ai/pricing
- Rodin / Hyper3D: Free = pay-per-result $1.50/credit, generate before paying; Creator $30/mo ($24 annual) ~60 models, low-poly style included; Business $120 ($96 annual) with API. Style list includes Low Poly, Cartoon, Cel-Shaded, Flat, Isometric. https://hyper3d.ai/pricing , https://hyper3d.ai/blog/rodin-gen-2
- Luma Genie: "We've officially Sunset Genie since January 1, 2026 ... You can still export your content." (Luma 3D Capture App Store notes, v1.3.14). https://apps.apple.com/us/app/luma-3d-capture/id1615849914
- Spline AI: credits bundled in plans (Free 2,000/mo, Hobby 3,000, Max 10,000); text-to-3D, image-to-3D, texture gen, style transfer. https://spline.design/pricing
- Hunyuan3D-2 (Tencent, open weights, run locally): 14,566 stars, custom license, last push 2025-10-28. https://github.com/Tencent-Hunyuan/Hunyuan3D-2
- Blender MCP (ahujasid): 26,277 stars, MIT, pushed 2026-08-24, Blender ≥ 3.0; integrates Poly Haven, Sketchfab, Hyper3D Rodin, Hunyuan3D; works with Claude Code via `claude mcp add blender uvx blender-mcp`; you supply your own Hyper3D key. https://github.com/ahujasid/blender-mcp
- Mixamo: still free with an Adobe account, maintenance mode, no updates since 2015 acquisition, multi-day 500 outage June 2025 with support saying "not supported anymore", FBX/DAE only (no GLB), bipeds in T/A-pose only. Alternatives: Cinevva Auto Rigger (free browser), AccuRIG 2.0 (free Windows), Quaternius Universal Animation Library (CC0, 260+ clips). Community Blender add-on "Mixamo Rig 5" (GPL). https://app.cinevva.com/guides/free-character-animations-rigging , https://extensions.blender.org/add-ons/mixamo-rig/
- Free CC0 stylized rigged humans (no AI needed): Quaternius Universal Base Characters, CC0, FBX/OBJ/Blend/glTF, humanoid rig, ~13k tris, 20 hairstyles. https://quaternius.com/packs/universalbasecharacters.html . Kenney Mini Characters (2024), CC0, animated, 25 items. https://kenney.nl/assets/mini-characters
- Same-topology kid → adult: AI generators output different topology per generation, so morphing needs one base mesh with Blender shape keys (or CSM Cube 2 / Rodin quad output as a base), then export shape keys as glTF morph targets. Constraint source: three.js morph docs above.

## Quick reference: what each route costs for this brief

| Route | JS gz | Assets | Light/dark | Kid→adult | Maintenance |
|---|---|---|---|---|---|
| CSS 2.5D SVG layers | 0 | 4 SVGs (tens of KB) | CSS vars | crossfade layers | web platform; Firefox gap |
| Zdog | 8 KB | none (code-drawn) | CSS vars (SVG) or color prop | lerp point arrays | stale since 2022 |
| OGL + GLTF | 23 KB | 1 GLB per stage or skinned | uniforms | swap/blend meshes, no morphs | active-ish (Apr 2025) |
| three vanilla | 158 to 166 KB | GLB + morph targets, meshopt | material color from CSS var | morph targets | active |
| three/webgpu | 264 KB | same | same | same | experimental |
| Threlte / Tres / R3F | 250 / 309 / 328 KB | same | same | same | active |
| model-viewer | 289 KB | one GLB | CSS bg only | GLB animation | active (Jun 2026) |
| Spline runtime | ~182 KB + lazy wasm | .splinecode | via variables (undocumented) | states | active; paid to drop watermark |
| Image sequence | ~1 to 3 KB | 3 to 5 MB per 60 frames 1080p | two frame sets or alpha frames | free in Blender | none |
| Video scrub | ~1 KB | keyframe=1 MP4 + WebM | two videos | free in Blender | Android jank |
