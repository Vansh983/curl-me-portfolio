# R2: Authored vector animation for a scroll-scrubbed "life stages" character

Research date: 2026-08-25. Sizes measured locally from unpkg tarballs (gzip -9, brotli -q 11) unless a source is cited. "gz" = gzip.

## Verdict

- Cheapest full-featured vector path: **Lottie JSON rendered by `lottie_light` (SVG renderer)**. 46 KB gz, no WASM, crisp at any size, dark mode via plain CSS on layer ids, scrub with `goToAndStop(frame, true)`, authoring free in Lottie Creator (with AI copilot + MCP). Cost: lottie-web is stagnant (last release May 2025, 859 open issues).
- Richest runtime: **Rive**. Number input + 1D blend state is the documented scroll-scrub pattern; colors recolor via data binding. Cost: ≥ 395 KB gz over the wire (canvas-lite), $9/seat/mo (annual) just to export a .riv, and rigging 4 character stages by hand.
- Lowest JS: **frame sequence on canvas**. ~1 to 2 KB hand-rolled JS, ~0.7 MB (AVIF) to 1.2 MB (WebP) for 90 flat-ink frames at 1200 px. Raster: not crisp at arbitrary DPR, dark mode only via `filter: invert()` on transparent ink frames or a second frame set.
- Zero JS is only possible with hand-authored SVG + CSS keyframes + `animation-timeline`. Firefox still has no stable support (Aug 2026), so a JS fallback is needed anyway.
- No tool exports Lottie or Rive that CSS can scrub. Every Lottie/Rive/dotLottie route needs a scroll listener in JS.
- No AI tool (LottieFiles Motion Copilot, Rive Agent, OmniLottie, Recraft) is documented to produce a rigged multi-stage character from a prompt. They generate shapes, keyframes on transform/opacity/color, icons, variants.

## 1. Lottie

### Runtimes (sizes)
- lottie-web 5.13.0, released 2025-05-21, MIT. Repo: 32,062 stars, 859 open issues, last push 2025-09-01, last tag v5.13.0. https://registry.npmjs.org/lottie-web , https://github.com/airbnb/lottie-web
  - `lottie.min.js` 305.7 KB raw / 76.1 KB gz / 63.7 KB br (bundlephobia: 76.8 KB gz). https://bundlephobia.com/package/lottie-web
  - `lottie_light.min.js` (SVG only, no expressions) 168.4 KB raw / 46.5 KB gz / 40.3 KB br
  - `lottie_svg.min.js` 62.4 KB gz; `lottie_canvas.min.js` 67.7 KB gz; `lottie_light_canvas.min.js` 54.3 KB gz. https://unpkg.com/lottie-web@5.13.0/build/player/
- @lottiefiles/dotlottie-web 0.79.2, 2026-08-18, MIT. https://registry.npmjs.org/@lottiefiles/dotlottie-web
  - JS `dist/index.js` 156 KB raw / 30.1 KB gz (bundlephobia 30,175 B gz). https://bundlephobia.com/package/@lottiefiles/dotlottie-web
  - WASM `dist/dotlottie-player.wasm` 1,222 KB raw / 490 KB gz / 383 KB br. Fetched from jsdelivr/unpkg at first construct; README says "~500 KB compressed"; self-host via `DotLottie.setWasmUrl()` + `<link rel=preload>` (version must match). https://github.com/LottieFiles/dotlottie-web/blob/main/packages/web/README.md
  - WebGL / WebGPU backends ship separate wasm: 1,350 KB / 1,380 KB raw. https://unpkg.com/@lottiefiles/dotlottie-web@0.79.2/dist/?meta
  - Renders to `<canvas>` only (Canvas 2D required, no SVG DOM). `DotLottieWorker` moves rendering to a Web Worker. Default `devicePixelRatio` is 75% of real DPR; set `renderConfig.devicePixelRatio = window.devicePixelRatio` for full crispness. https://github.com/LottieFiles/dotlottie-web/blob/main/SKILL.md
  - Total dotLottie cost: ~520 KB gz (30 JS + 490 wasm). Real-world complaint: react wrapper grew 16 KB to 51 KB gz between 0.7.1 and 0.8.12. https://github.com/LottieFiles/dotlottie-web/issues/357
- @lottiefiles/dotlottie-wc 0.9.27 (web component) 80 KB raw / 19.6 KB gz + same wasm (bundlephobia 37.3 KB gz). https://registry.npmjs.org/@lottiefiles/dotlottie-wc
- Wrappers (all MIT, all depend on dotlottie-web): @lottiefiles/dotlottie-react 0.19.15, dotlottie-svelte 0.10.14, dotlottie-vue 0.11.26, dotlottie-solid 0.6.26 (all 2026-08-18). lottie-web wrappers: lottie-react 3.1.0 (2026-08-16), @lottiefiles/react-lottie-player 3.6.0 (2025-01-14). https://registry.npmjs.org/@lottiefiles/dotlottie-react
- Astro usage exists in the wild (dotlottie-wc in .astro components): https://github.com/JeremieAlcaraz/j12zdotcom , https://github.com/psephopaiktes/hira.page

### Scroll scrubbing
- dotlottie-web: `autoplay:false`, then `dotLottie.setFrame(n)` on scroll. `setFrame()` renders synchronously. Documented "Scrub with Scroll" snippet. https://github.com/LottieFiles/dotlottie-web/blob/main/SKILL.md
- lottie-web: `anim.goToAndStop(frame, true)`. Same pattern used by ScrollLottie (GSAP ScrollTrigger, 88 stars, last push 2023-05-21). https://github.com/chrisgannon/ScrollLottie
- @lottiefiles/lottie-interactivity 1.6.2 (2023-02-06, 4.5 KB gz) has `mode: 'scroll'` with `type: 'seek'` actions. Repo is **archived** (archived: true, 2026-06-01). Do not adopt. https://github.com/LottieFiles/lottie-interactivity
- dotLottie 2.0 state machines: numeric/boolean/string/event inputs; `SetFrame` and `SetProgress` actions accept `$input` references, so progress can be bound to a numeric input set via `stateMachineSetNumericInput('progress', 0.5)`. https://dotlottie.io/spec/2.0/ , https://github.com/LottieFiles/dotlottie-web/blob/main/SKILL.md
- CSS-only (no JS) scrub of Lottie: **not possible**. Both renderers compute frames in JS; nothing exposes progress to `animation-timeline`. A Lottie-to-CSS-keyframes converter exists (lottietools.app/lottie-to-css) but only extracts transform/opacity/rotation per layer, not path morphs (page blocked, summary via search). https://lottietools.app/lottie-to-css/

### Runtime recolor (dark mode)
- lottie-web SVG renderer: name AE layers with `.` or `#` prefix, they export as class/id (`cl` property); override `fill`/`stroke` in CSS under `prefers-color-scheme`. Not possible with the canvas-based players. Limitation: layer opacity can't be overridden in CSS. https://lottiefiles.com/blog/working-with-lottie-animations/customize-lottie-animation-dark-light-mode-css , https://www.denisbouquet.com/lottie-files-add-class-id-to-svg-elements-to-animate-them-in-css/ , https://github.com/airbnb/lottie-web/wiki/Renderer-Settings
- dotLottie themes: theme rules map to Lottie Slots; every property to theme must first get a slot id. Rule types: Color, Scalar, Position, Vector, Gradient, Image, Text; keyframe rules with easing; expressions. Runtime: `themeId` in constructor, `setTheme(id)`, `setThemeData(json)`, `resetTheme()`, `setColorSlot(id, value)`, `setSlots({...})`. https://dotlottie.io/spec/2.0/ , https://docs.lottiefiles.com/en/runtimes/distributions/js/v0.x/api/reference , https://docs.lottiefiles.com/en/tools/dotlottie-js
- Known bug: `loadAnimation()` drops the active theme (issue #676). https://github.com/LottieFiles/dotlottie-web/issues/676

### Authoring tools (Lottie output)
- After Effects + Bodymovin: the reference exporter (lottie-web repo ships the plugin). https://github.com/airbnb/lottie-web
- Figma -> LottieFiles plugin v124 (2026-07-28): exports frames, prototype flows, multiple frames, Figma Motion; "Figma State Machine" added 2026-04-08. https://lottiefiles.com/plugins/figma , https://help.lottiefiles.com/hc/en-us/articles/30798811299865-how-to-use-figma-to-lottie
- Lottie Creator (browser). LottieFiles pricing (scraped 2026-08): Free $0, Individual $19.99/mo, Team $24.99/mo, Team+ contact sales. https://lottiefiles.com/pricing . Secondary source (2026-05-02): Individual 300 AI credits/mo, Team 600. https://vijaytalksai.com/lottiefiles-pricing-explained/
- Lottielab: Free (upload Lottie/SVG, import Figma, GIF/MP4 export); Pro per editor/mo billed annually adds "Export to lottie", CDN hosting. Exports Lottie, dotLottie, SVG, MP4, GIF, WebM. https://www.lottielab.com/pricing (toolradar lists Pro at $20/editor/mo and claims free Lottie export; conflicts with official page) https://toolradar.com/tools/lottie-lab
- Jitter (scraped 2026-08): Free $0 (Video/GIF/Lottie export, 3 workspace files, 20 MB upload), Pro $15/mo (ProRes, WebM), Max $35/mo (transparent + frame-by-frame export), Ultra, Enterprise; annual saves 15%. No scroll/interactivity features. https://jitter.video/pricing/
- Linearity Move: Free (10 files), Pro $10/mo or $119.90/yr, Org custom. Mac + iPad only. Lottie export "currently in early access". https://www.linearity.io/pricing/move/ , https://www.linearity.io/academy/move/mac/user-guide/export/lottie-files-export/
- Cavalry: free for individuals since 2026-04-16/17 (Canva acquired Feb 2026); Win + Mac; Lottie export supported (filters, shaders, dash, skew, track mattes, text not supported in Lottie export). SVG export is frame sequences, not animated SVG. https://www.3dart.it/en/cavalry-pro-is-now-completely-free-the-after-effects-alternative-rides-in/ , https://cavalry.studio/docs/user-interface/menus/window-menu/render-manager/lottie-export/
- Phase: free web tool, Figma import, exports Lottie / dotLottie / MP4 / GIF; no scroll or interactivity documented. https://www.thedesignsphere.pro/phase
- Haiku Animator: maintenance mode Feb 2020, open-sourced Aug 2021, dead. https://www.haikuanimator.com/blog/open-source/

### AI generation (2026)
- LottieFiles Motion Copilot inside Lottie Creator: draws shapes/text/paths, keyframes on position/scale/opacity/rotation/color, loops, staggers; "Prompt to State Machines", "Prompt to Themes", "Prompt to Vector", "Raster to Vector", "generate 10+ variants". https://lottiefiles.com/ai
- Lottie Creator MCP (2026-04-16): Claude / Codex / Gemini read the file, edit layers, generate variants, ship dotLottie. https://lottiefiles.com/tutorials/lottie-creator/lottie-creator-mcp-create-animations-with-your-favorite-ai-assistants-vs6LnaDzYAL
- Recraft (vector/icon to Lottie), OmniLottie, vizGPT, LottieGen: prompt-to-Lottie for icons/UI motion. None documents rigged character animation. https://www.recraft.ai/blog/lottie-ai-generator-animations , https://omnilottie.com/ , https://vizgpt.ai/usecases/ai-generate-lottie

## 2. Rive

### Runtimes (sizes)
- All @rive-app/* web packages 2.40.1, released 2026-08-20, MIT (rive-wasm, rive-runtime repos MIT). @rive-app/webgl deprecated after 2.37.0 (2026-04-03). https://registry.npmjs.org/@rive-app/canvas , https://github.com/rive-app/rive-wasm
- Measured (JS + separate WASM, wasm fetched from unpkg at runtime by default):
  - canvas-lite: rive.js 390 KB raw / 83.9 KB gz / 69.8 KB br; rive.wasm 767 KB raw / 311 KB gz / 242 KB br. Total ≈ 395 KB gz.
  - canvas: rive.js 411 KB / 91.6 KB gz / 76.5 KB br; rive.wasm 1,808 KB / 742 KB gz / 581 KB br. Total ≈ 834 KB gz.
  - webgl2: rive.js 413 KB / 92.3 KB gz / 77.3 KB br; rive.wasm 2,005 KB / 813 KB gz / 647 KB br. Total ≈ 905 KB gz.
  - Bundlephobia (JS entry only): canvas-lite 42.0 KB gz, webgl2 50.2 KB gz. https://bundlephobia.com/package/@rive-app/canvas-lite
- Rive's own table (Jan 2026, brotli -9, "majority is the WASM"): canvas-lite 707 KB / 222 KB; canvas 1,728 KB / 567 KB; webgl2 2,179 KB / 648 KB. https://rive.app/docs/runtimes/runtime-sizes
- Feature split: webgl2 = Rive Renderer, identical to editor, vector feathering; canvas = Canvas2D, no feathering, unlimited instances; canvas-lite drops Text, Layouts, Scripting, Audio. Same API surface. https://rive.app/docs/runtimes/web/canvas-vs-webgl , https://rive.app/docs/runtimes/web/web-js
- Self-host WASM: `RuntimeLoader.setWasmUrl()`, serve `application/wasm`, immutable cache, preload href must match. https://rive.app/docs/runtimes/web/preloading-wasm
- React: @rive-app/react-canvas / react-webgl2 / react-canvas-lite 4.32.1 (2026-08-20). Hooks: `useRive`, `useStateMachineInput`, `useViewModelInstanceNumber`, `useViewModelInstanceColor` (`setRgb`, `setAlpha`, `setRgba`), `useViewModelInstanceEnum`, `useViewModelInstanceTrigger`. https://rive.app/docs/runtimes/react/data-binding . No official Svelte package (`rive-svelte` not on npm).

### Scroll scrubbing
- Documented pattern: number input 0 to 100 + 1D blend state between two timelines; JS sets `input.value = scrollY / (scrollHeight - innerHeight) * 100`. Thresholds on the same input can trigger other timelines. https://riveflow.webflow.io/examples-2/scroll-based-animation
- Official community demo "Lemonade - Scroll Demo" (drawsgood, 2022-09-07, CC BY 4.0): number input tied to page scroll driving a sequence. https://rive.app/community/files/3221-6785-lemonade-scroll-demo/
- With data binding (current recommended API): `vmi.number("progress").value = n`. Inputs are being migrated to data binding. https://rive.app/docs/runtimes/web/data-binding , https://rive.app/docs/editor/data-binding/migration-guide
- Rive changelog "Scrolling" (2024-12-10) is Scroll Constraints for content inside the artboard (touch scroll of layouts, scroll wheel not yet supported), not page-scroll binding. https://rive.app/docs/editor/constraints/scroll-constraint
- Older tutorial uses rive.js 0.7 `animation.scrub(name, t)` API (2021 era). https://www.clickswebdesign.com/rive/scroll-position-based-animation-with-rive/

### Runtime recolor
- Data binding Color property: `vmi.color("Ink").value = 0xFF1A1A1A` (ARGB) or `.rgb(r,g,b)`, `.rgba()`, `.argb()`, `.opacity()`. Bind every fill/stroke you want themed to a view model color in the editor. https://rive.app/docs/runtimes/web/data-binding
- Free plan includes State Machines, Data Binding, Scripting in the editor. https://rive.app/docs/account-admin/pricing

### Pricing (2026)
- rive.app/pricing (fetched 2026-08): Free $0 (3 collaborative files, 1 project, 10 MB assets, **no exports**); Cadet $9/seat/mo (3 seats max, unlimited files, .riv exports, 100 MB); Voyager $32/seat/mo (Libraries, embed URL/CDN hosting, $20 agent credits); Enterprise $120/seat/mo. https://rive.app/pricing
- Docs pricing page lists month-to-month rates: Cadet $17/mo or $108/yr, Voyager $39/mo or $304/yr, Enterprise $1,440/seat/yr. Treat $9 as the annual rate. Student plan exists (personal educational only). https://rive.app/docs/account-admin/pricing
- Since 2025-10-20 "exports now move to paid plans"; "no runtime fee, exports keep working forever". https://rive.app/blog/rive-s-new-9-mo-plan
- Rive AI Agent for all plans since 2026-04-30 (Free: capacity recharges hourly). Generates scripts, responsive layouts, data models, "even animation"; artwork and rigging not documented. https://rive.app/blog/free-rive-ai-agent , https://rive.app/docs/editor/ai-agent/ai-agent

### Authoring effort (multi-stage character)
- Bones bind to vector path vertices and Bezier handles (procedural rects/ellipses must be converted to paths first); auto-weights + weight painting. https://rive.app/docs/editor/manipulating-shapes/bones
- Meshes are raster-only. https://rive.app/docs/editor/manipulating-shapes/meshes
- Reviews flag the state-machine model as the learning-curve cost. https://www.softwares.com/software/rive
- Practical implication: 4 stages (kid/teen/student/founder) = 4 rigs or one rig with 4 art sets, plus 1D blend or a number-driven timeline per chapter; nothing in Rive auto-generates in-betweens across different rigs.

### Real scroll-driven Rive on personal/agency sites
- itaim18/Portfolio (personal): rive-react, state machine "Scroll Machine", number input "scrollY" set to `window.scrollY`. https://github.com/itaim18/Portfolio/blob/main/src/components/FaceIcon/FaceIcon.jsx
- pixel-point/pixelpoint-website hero (agency): @rive-app/react-canvas, scroll listener fires a trigger input past a scroll offset. https://github.com/pixel-point/pixelpoint-website/blob/main/src/components/pages/home/hero/hero.jsx
- parca-dev/landing-page "bees": scroll progress computed in React, play/pause + direction flip. https://github.com/parca-dev/landing-page/blob/main/src/components/pages/home/bees/bees.jsx
- zplata/plant-blog-rive (Next.js, scroll sync) and video "Syncing Scroll Position with Rive", listed in awesome-rive. https://github.com/rive-app/awesome-rive
- Riveflow (Webflow) scroll example. https://riveflow.webflow.io/examples-2/scroll-based-animation

## 3. Animated SVG from tools (CSS/SMIL, zero JS?)

- SVGator pricing: Free $0 (watermark-free static SVG, no interactivity, no Lottie, no Player API); Starter $20/mo billed yearly (SVG as JS **or CSS**, interactivity, Player API, watermarked Lottie/video); Pro $24/mo yearly (all exports watermark-free, 4K/60fps); Team $27/seat/mo, 3 seats min. https://www.svgator.com/pricing
- SVGator scroll: only "On Scroll into View" trigger (starts at N% visible, restarts when re-entering). **No scroll-scrub / progress-follows-scroll mode.** Requires inline SVG. Interactive exports require the JS player; CSS export is for simple non-interactive animations. https://www.svgator.com/help/animation-and-interactivity/how-to-animate-svg-on-scroll , https://www.svgator.com/tutorials/make-an-svg-animation-play-on-scroll-into-view
- CSSVG: free, no sign-up, timeline editor, exports CSS keyframes or SMIL or React JSX, no JS runtime. CSS keyframes output can be driven by `animation-timeline: scroll()`; SMIL cannot. No scroll-timeline export option itself. https://cssvg.com/blog/svg-animation-on-scroll
- Linearity Move exports Lottie, not animated SVG. Cavalry exports SVG only as per-frame sequences. Haiku Animator is dead (see above).
- Browser support for `animation-timeline` (MDN BCD, 2026-08): Chrome 115, Edge mirrors Chrome, Safari 26, Firefox "preview" only (Nightly / behind `layout.css.scroll-driven-animations.enabled`). MDN: "Limited availability", not Baseline. https://github.com/mdn/browser-compat-data/blob/main/css/properties/animation-timeline.json , https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline
- Secondary: Firefox 152 (June 2026) still behind flag, Interop 2026 priority. https://cssawwwards.com/blog/css-scroll-driven-animations-guide-2026

## 4. Frame sequence on canvas (Apple technique)

- Apple AirPods Pro page: 148 JPG frames; one measured page load 55.8 MB; Apple serves a single fallback image on slow connections. CSS-Tricks, 2020-05-22. https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/
- Field numbers (gsapvault, 2026-03-16, updated 2026-08-16): 25 to 50 px of scroll per frame (under 25 skips on flicks, over 50 feels stalled); product on plain background 40 to 80 KB/frame at 1600 px WebP q80, photographic scenes 3 to 4x; AVIF smaller but slower to decode; `createImageBitmap` costs ~8 MB RAM per 1920x1080 frame (90 frames > 0.5 GB); under ~100 frames use images, longer use scrubbed video; size frames to the largest drawn box, cap DPR at 2; ship a real `<img>` fallback for reduced-motion / no-JS. https://gsapvault.com/blog/scroll-image-sequence-tutorial
- AVIF vs WebP (600 images, 96 to 1080 px, same DSSIM): AVIF median 50.3% smaller than JPEG, WebP 31.5%; AVIF won every image. https://www.ctrl.blog/entry/webp-avif-comparison.html
- Local synthetic test (one 1200x900 flat paper-and-ink scene with 3 px strokes and one acid-green disc, rasterized from SVG; not a real frame, order-of-magnitude only): PNG 41.3 KB, JPEG q4 41.1 KB, WebP q80 13.8 KB, WebP q90 17.8 KB, WebP lossless 12.6 KB, AVIF (SVT-AV1) crf20 10.2 KB, crf30 7.6 KB, crf40 5.4 KB. Source SVG: 628 B gz.
  - 90 frames at 1x: WebP q80 ≈ 1.24 MB, AVIF crf30 ≈ 0.68 MB. 2x (2400 px) frames roughly 3 to 4x that. Same scene as vector: under 1 KB.
- Loading strategy from the same tutorial: preload anchor frames first (every Nth), fill gaps at low priority, draw nearest loaded frame, `img.decode()` before marking ready, `ScrollTrigger.refresh()` after preload.
- CSS-only variant: sprite sheet + `steps()` + `animation-timeline` (geyer.dev; page returns 403 to fetch, summary from search index). Same Firefox gap as section 3. https://geyer.dev/blog/css-image-sequence-animations/
- JS cost: hand-rolled scroll → frame index → `drawImage` is ~1 to 2 KB. GSAP 3.15.0 (2026-04-13, free "Standard 'no charge'" license) core 28.3 KB gz + ScrollTrigger 18.0 KB gz if used. https://registry.npmjs.org/gsap
- Dark mode: raster frames don't recolor. Options: transparent-background WebP/AVIF ink frames + CSS `filter: invert(1)` (both formats support alpha), or a second frame set. SVG-filter invert trick is also what people use on Lottie canvas players. https://sam-osborne.medium.com/lottie-animations-with-dark-themed-websites-40407ce109aa

## 5. Comparison

| Option | JS over the wire (gz) | Authoring cost (solo, no animator) | Dark-mode recolor | Crisp at any size | Add a chapter later |
|---|---|---|---|---|---|
| lottie-web `lottie_light` SVG | 46.5 KB, no WASM | Free: Lottie Creator + Motion Copilot/MCP, Figma plugin, Cavalry (free), Phase (free); $0 to export from Creator/Jitter/Cavalry | CSS on `#id`/`.class` layers, `prefers-color-scheme` | Yes (SVG DOM) | Append keyframes/markers to one JSON; re-export |
| dotLottie (`dotlottie-web`) | 30 KB JS + 490 KB WASM (CDN or self-host) | Same tools; themes need slot ids set in Creator/dotlottie-js | `themeId` / `setTheme` / `setColorSlot` | Canvas; must raise default DPR from 75% | Same; themes must be updated per new slot |
| Rive canvas-lite | 84 KB JS + 311 KB WASM (canvas: 834 KB gz; webgl2: 905 KB gz) | Rive editor free to build, $9/seat/mo (annual) to export; rig bones per stage; state machine learning curve | Data-binding Color property from JS | Canvas/WebGL, editor-fidelity on webgl2 | Add timeline + blend segment; re-export .riv |
| Frame sequence (canvas) | ~1 to 2 KB (or +46 KB with GSAP) | Any tool that renders frames (Cavalry free, Jitter free 720p, Rive needs paid export) | Only `filter: invert()` on transparent ink frames or 2nd set | No; raster, DPR-capped | Render + upload N more frames; re-tune scroll length |
| SVG + CSS keyframes + `animation-timeline` | 0 KB (Firefox needs JS fallback) | Hand-authored or CSSVG (free); no character rig tooling | Trivial (CSS vars) | Yes | Edit CSS/SVG by hand |

- React changes ergonomics, not cost: `useRive` + `useViewModelInstanceNumber/Color` (Rive) and `DotLottieReact` + `dotLottieRefCallback` (dotLottie) wrap the same runtimes; bundle numbers above are unchanged. Svelte: `@lottiefiles/dotlottie-svelte` exists; Rive has no official Svelte package.
- lottie-interactivity (archived) and ScrollLottie (2023) are not maintained; write the 10-line scroll → frame mapper yourself.
