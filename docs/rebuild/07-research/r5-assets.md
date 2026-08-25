# R5: Producing the "me growing up" line-art assets (solo dev, no illustrator)

Researched 2026-08-25. Prices checked against official pages where possible; third-party numbers flagged.

## Recommended pipeline (verdict first)

**Hybrid: AI raster reference sheet -> hand-trace as open stroked paths in a free vector tool -> currentColor SVG -> CSS scroll draw-on.**

- Why not pure AI SVG: no AI vector tool tracks a character across ages/poses. Recraft says so explicitly ("Recraft doesn't offer a dedicated character-tracking feature"). Its SVG output is filled shapes with excess anchors, not single strokes, so it cannot be "drawn on" with stroke-dashoffset. See sec 1.
- Why not raster trace: potrace/Image Trace produce closed outlines (double lines around each stroke). Only autotrace centerline gives single strokes, and it is noisy on anything but clean, uniform-width line art. See sec 4.
- Why not CC0 libraries alone: Open Peeps, Notionists, Open Doodles, Humaaans are all filled paths (measured: zero `stroke=` attributes). Recolor fine, draw-on no. Usable as a fallback or as pose reference. See sec 2.

Steps:
1. Reference sheet (1 to 2 h, $8 to $10 for one month): Midjourney V7 `--oref` or Ideogram 4.0 Character Reference (subscription only) or GPT Image 1.5 edits. Prompt: "single continuous black ink line drawing, white paper, no shading, same boy at age 10 / 17 / 20 / 25 / 28". Pick one seed image, derive the others with the reference feature. Output is raster only.
2. Trace (2 to 3 h per stage, 6 stages = 12 to 18 h): Figma (free Starter) or Affinity (free since Oct 2025). Draw open paths with the pen tool over the PNG at low opacity. Rules: one `<path>` per visible line, no fills, no compound paths, consistent draw direction (head to feet), 20 to 60 paths per stage, accent parts in a separate group. Scenery (Delhi rooftop, SF bridge, Halifax harbour, startup desk, present) as 5 to 15 extra paths each.
3. Export: Figma "Export SVG" plugin with currentColor replacement, or Affinity SVG export then sed fill/stroke to `currentColor`. `stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"`.
4. Optimise: `svgo` with `cleanupIds:false`, add `prefixIds` (viewBox is kept by default in svgo 4). Add `pathLength="1"` to every path.
5. Animate: `stroke-dasharray:1; stroke-dashoffset:1` -> 0 with `animation-timeline: view()` inside `@supports (animation-timeline: view())`. Zero JS. Firefox users see the finished drawing.
6. Optional morph between stages: only if paths were built with identical command counts (sec 3). Simpler: crossfade opacity, or draw-in the next stage while the previous fades.

Cost: $0 tooling + $8 to $10 AI month. Hours: 15 to 22 total.
Alternative if hours are the constraint: commission on Fiverr/Upwork, $150 to $600 for 6 stages + scenery as SVG strokes, 2 to 3 weeks (sec 5).

Payload: 6 hand-traced scenes at ~5 to 15 KB raw each = 30 to 90 KB inline, ~15 to 40 KB gzipped. Traced-raster outlines are 5x to 20x that (sec 6).

## 1. AI to SVG

Recraft
- Plans (official, 2026-08-25, billed annually): Free $0 "3 generations per style per day", personal use, images owned by Recraft and public. Basic $10/mo, 1,000 credits. Pro $16/mo, 2,000 credits. Teams $18/seat/mo. Paid plans "grant you full ownership and commercial rights". https://www.recraft.ai/pricing
- Credits: raster 1, vector 2, creative upscale 20. https://www.recraft.ai/blog/pricing-update
- API: raster V3 $0.04, vector V3 $0.08, vectorize $0.01, style creation $0.04. https://www.recraft.ai/docs/api-reference/pricing
- Vector substyles include `Line art`, `Vector art`, `Linocut`, `Engraving`, `Bold stroke`; all output SVG. Custom styles: API custom styles work with V3 and V3 Vector only. https://www.recraft.ai/docs/api-reference/styles
- Custom style = up to 5 reference images, 20% weight each, adjustable. https://www.whytryai.com/p/recraft-custom-style
- Character consistency: "Recraft doesn't offer a dedicated character-tracking feature"; recommends detailed prompt + same style + reference image on canvas. https://www.recraft.ai/docs/best-practices/character-consistency
- Open feature request for consistent characters still open. https://feedback.recraft.ai/feature-requests/p/generate-character-in-different-actions-and-landscapes
- Output quality: "~20-30% more anchor points than an expert would, but significantly fewer than auto-trace tools" (third-party). https://www.svggenie.com/blog/recraft-ai-review-2026
- Recraft V4 released Feb 2026 (raster focus). https://www.mindstudio.ai/blog/what-is-recraft-v4-design-forward-image-model

Adobe Illustrator / Firefly Text to Vector
- Illustrator single app $22.99/mo annual, $31.49 month-to-month, 25 generative credits/mo (CC Pro: 4,000). https://justcreative.com/adobe-creative-cloud-photoshop-illustrator-cost/ , https://www.adobe.com/products/illustrator/text-to-vector-graphic.html
- Firefly Text to vector: content types Subject/Scene (Icon/Pattern in Illustrator), "Add a reference image so that the generated variations match its style", download as .svg, can pick non-Adobe models (GPT Image) for vector generation. https://helpx.adobe.com/firefly/web/generate-vectors/text-to-vector/generate-vectors-using-text-prompts.html
- Style reference only, no character reference. Illustrator "Style IDs" (Firefly Design Intelligence) train a style, not a character. https://helpx.adobe.com/firefly/web/firefly-design-intelligence/firefly-design-intelligence-for-illustator/create-style-ids.html

Raster models with character reference (raster only, then trace)
- Midjourney V7: `--oref` + `--ow` (1 to 1000, default 100); `--cref` is V6 only. Basic $10/mo. https://www.imaginepro.ai/blog/2025/7/midjourney-omni-reference-guide , https://costbench.com/software/ai-image-generators/midjourney/
- Ideogram: Character Reference on 4.0 via subscription only (unlimited); API adds it on 3.0 at $0.10/$0.15/$0.20. Basic $8/mo 400 credits, Plus $20/mo (or $15 annual) 1,000 credits. https://www.eesel.ai/blog/ideogram-pricing
- GPT Image 1.5 API: $0.009/$0.034/$0.133 per 1024 image (low/med/high); edits "preserve identity across edits"; scheduled for API removal 2026-12-01. https://www.aifreeapi.com/en/posts/gpt-image-1-5-pricing-api

Vectorizers (raster -> SVG)
- vectorizer.ai: $12.99/mo unlimited web (page showed CAD; USD/EUR available); API from 50 credits $12.99/mo. https://vectorizer.ai/pricing
- vtracer (MIT, Rust): color, `--preset bw`, `--simplify`, spline mode; outlines only. https://github.com/visioncortex/vtracer
- potrace: outlines only; "centerline tracing is beyond the scope of Potrace". https://sourceforge.net/p/potrace/discussion/300717/thread/0f6c5b22/
- Illustrator Image Trace "Create: Strokes: Creates stroked paths in the trace result. Specifies the maximum width of features in the source image that can be stroked." (closest built-in centerline in a commercial tool). https://helpx.adobe.com/illustrator/using/image-trace.html
- Tradeoff: every anti-aliased edge becomes a region; traced files hit hundreds of KB, thousands of paths. https://rebrixe.com/blogs/why-svg-files-get-large

Verdict: no tool keeps one character consistent AND emits stroke SVG. Use raster reference features, then hand-trace.

## 2. Free illustration systems

| Library | License | Formats | Parts | Stroke line art? | CSS recolor |
|---|---|---|---|---|---|
| Open Peeps (Pablo Stanley) | CC0 | SVG, PNG, Figma/Sketch/XD components | hair, eyes, expressions, facial hair, poses (standing, sitting, busts) | No, sketchy look but filled paths (DiceBear sample: 9 paths, 0 stroke attrs) | fill=currentColor works |
| Notionists (Zoish) | CC0 1.0 | ZIP: Sketch, Figma, PNG, SVG | gestures, accessories, brows, eyes, nose, beard, lips, hair, body | No, filled (sample: 15 paths, 0 strokes) | yes |
| Open Doodles (Pablo Stanley) | CC0 | SVG, PNG, GIF, generator | ~35 scenes, generator | No, Sketch-exported filled outlines (coffee: 57 paths, 43 KB; plant: 454 paths, 200 KB) | yes |
| Humaaans | CC0 | Sketch, InVision Studio, Blush | hair, tops, pants, poses | No, flat filled | yes |
| Croodles (DiceBear) | CC BY 4.0 | SVG via API | doodle faces | Yes, real `stroke="#000"` stroke-width 3 (busts only) | stroke=currentColor |
| unDraw | custom, free commercial, no attribution, no redistribution, no AI training | SVG | scenes, single accent color | No, flat filled | yes |
| Lukasz Adam | CC0 / MIT, no attribution | SVG, PNG, WebP | mixed, some outline sets | Mixed | yes |
| Blush | Free = PNG only; Pro $12/mo annual = SVG + all collections, no attribution | SVG, PNG, Figma/Sketch plugin | many collections (Open Peeps etc.) | mostly filled | yes |
| Storyset (Freepik) | free with attribution, or Flaticon premium | SVG, PNG, Lottie, animated HTML | 4 styles, layer toggles, recolor | No, flat | yes |
| absurd.design | free pack: PNG only, link-back required; $19/mo or $199/yr, 10 credits/mo, no attribution | PNG free, vector paid | none | Yes, hand-drawn b&w ink | n/a for PNG |
| Doodle Ipsum (Blush) | Blush license | PNG/SVG via URL API, styles: flat, hand drawn, outline, abstract, avatar | placeholder only | outline style exists | limited |
| DiceBear (engine) | MIT | SVG API, JS/PHP/Python/Rust/Go/Dart/CLI | per style | per style | yes |

Sources: https://www.openpeeps.com/ , https://www.dicebear.com/styles/notionists/ , https://heyzoish.gumroad.com/l/notionists , https://www.opendoodles.com/ , https://www.humaaans.com/ , https://www.dicebear.com/licenses/ , https://undraw.co/license , https://lukaszadam.com/illustrations , https://blush.design/plans , https://storyset.com/faqs , https://absurd.design/faq (via https://designtoolmark.com/resources/detail/absurd-design) , https://doodleipsum.com/ , https://github.com/dicebear/dicebear
Path/stroke counts measured locally on downloaded SVGs (scratchpad/svgs/).

Use: Notionists or Open Peeps Figma parts as a pose/proportion base (CC0, remix allowed), then redraw as strokes. Do not ship them as-is if you want draw-on.

## 3. Hand-authoring tools and morph-friendly paths

Tools
- Figma Starter: free, 3 design files per team, unlimited drafts. https://supercharge.design/articles/is-figma-free-to-use
- Figma native SVG export options: Include id attribute (off by default), Outline text, Simplify stroke (can flatten strokes to filled outlines, turn it off for line art). https://www.svggenie.com/blog/figma-svg-export-clean-code
- Figma "Export SVG" plugin: SVG or JSX, "optional currentColor replacement that replaces fill, stroke, and stop-color". https://www.figma.com/community/plugin/1622882243754727494/export-svg
- LottieFiles for Figma: free plugin, Figma to Lottie export; needs LottieFiles account. https://help.lottiefiles.com/hc/en-us/articles/30798811299865-how-to-use-figma-to-lottie (Lottie is JSON + runtime JS; conflicts with zero-JS goal.)
- Affinity: free forever since 2025-10-30, one app (Photo+Designer+Publisher), Mac/Windows, iPad "in development", pen/node/pencil tools, SVG export, requires free Canva account. https://www.affinity.studio/get-affinity , https://www.canva.com/newsroom/news/affinity-free/
- Inkscape 1.4.4 (2026-05-06), GPL, free; Trace Bitmap includes "Centerline tracing (autotrace)" under Single scan. https://inkscape.org/release/ , https://inkscape.org/forums/questions/how-to-choose-settings-for-trace-bitmap-single-scan-centerline-tracing-autotrace/
- Boxy SVG: proprietary, web + desktop, edits raw XML in Elements panel, ~$9.99 tiers with 15-day trial (third-party). https://en.wikipedia.org/wiki/Boxy_SVG , https://checkthat.ai/brands/boxy-svg-editor
- Linearity Curve: Free, Starter $10/editor/mo annual ($12 monthly), Pro $25/$30; reviews say SVG export needs paid. https://www.linearity.io/pricing/ , https://paperlike.com/blogs/paperlikers-insights/linearity-curve-review
- Concepts (iPad, vector strokes): free base; SVG export is a paid unlock (monthly/yearly). https://apps.apple.com/us/app/concepts/id560586497 , https://concepts.app/en/manual/export
- Procreate: raster only, no SVG export. https://folio.procreate.com/discussions/3/6/52076

Morph-friendly path rules
- Native CSS/SMIL morph needs identical command count and types, same order; "you can't morph a line into a curve". https://popmotion.io/learn/morph-svg/ , https://salivity.github.io/svg/article/svg-path-morphing-techniques-for-developers
- Build stage N+1 by duplicating stage N and dragging anchors, never redraw. Convert all to cubic `C`. https://salivity.github.io/svg/article/svg-path-morphing-techniques-for-developers
- Libraries that relax the rule need JS: flubber, polymorph, GSAP MorphSVG. https://motion.dev/tutorials/js-svg-path-morphing , https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/
- Practical: skip morph, use draw-in + crossfade. Same visual story, zero constraints.

SVGO (v4.1.0 tested locally)
- preset-default no longer includes removeViewBox. Disable cleanupIds via `overrides: { cleanupIds: false }`; add `prefixIds` when inlining several SVGs. https://svgo.dev/docs/preset-default/ , https://svgo.dev/docs/plugins/cleanupIds/
- Config:
```js
export default { plugins: [
  { name: 'preset-default', params: { overrides: { cleanupIds: false, mergePaths: false, convertShapeToPath: false } } },
  'prefixIds',
]}
```
  (`mergePaths:false` keeps one path per stroke so draw order and pathLength stay per line.)
- `vector-effect="non-scaling-stroke"`: stroke width ignores transforms and zoom; Baseline widely available since July 2020. https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/vector-effect

## 4. Drawn-on-scroll technique

- `pathLength="1"` + `stroke-dasharray:1; stroke-dashoffset:1` -> 0, no getTotalLength(). https://css-tricks.com/a-trick-that-makes-drawing-svg-lines-way-easier/
- Bind to scroll with `animation-timeline: view()` (or `scroll()`), `animation-range` for start/end. https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations/Timelines , https://css-tricks.com/almanac/properties/a/animation-timeline/
- Support: Chrome/Edge 115+, Safari 26 (Sept 2025), Firefox still behind `layout.css.scroll-driven-animations.enabled` in stable as of Firefox 152 (Interop 2026 item); caniuse global 85.43% (July 2026 stats). https://www.frontendhorizon.com/blog/view-transitions-api-and-css-scroll-driven-animations-the-browser-wins-of-2026 , https://caniuse.com/mdn-css_properties_animation-timeline , https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- Fallback: `@supports (animation-timeline: view())`; unsupported browsers show the finished drawing. https://mskelton.dev/blog/css-scroll-animations
- Irregular strokes (variable width, brush look): use the stroke path as a mask over the filled art, animate the mask. https://css-tricks.com/how-to-get-handwriting-animation-with-irregular-svg-strokes/
- Perf: animating SVG attributes/paint props repaints every frame (motion.dev "C-tier"); scroll-driven animations avoid main-thread scroll listeners but only transform/opacity are composited. https://motion.dev/magazine/web-animation-performance-tier-list , https://developer.chrome.com/blog/scroll-animation-performance-case-study

Producing single-stroke drawings
- Hand-trace in Figma/Affinity (recommended): pen tool over a raster reference, open paths only.
- iPad: Concepts exports vector strokes to SVG (paid unlock); Procreate cannot, must trace after. Sources above.
- Inkscape Trace Bitmap > Single scan > Centerline tracing (autotrace); the legacy extension explains why potrace gives "double lines". https://github.com/fablabnbg/inkscape-centerline-trace
- Autotrace is "the only open-source tool that can do centerline tracing". https://sourceforge.net/p/potrace/discussion/300717/thread/0f6c5b22/
- Illustrator Image Trace with Create: Strokes gives stroked paths up to a max stroke width. https://helpx.adobe.com/illustrator/using/image-trace.html
- Neither potrace, vtracer nor Inkscape were installed on this machine (checked with `which`); Inkscape/Affinity are free installs.

Examples
- antfu.me background "plum" is Canvas 2D + requestAnimationFrame generative branches, not SVG. https://github.com/antfu/antfu.me/blob/main/src/components/ArtPlum.vue
- cassie.codes: SVG stroke/morph animation talks and demos (GSAP-based). https://www.cassie.codes/speaking/getting-started-with-svg-animation/
- Bramus's scroll-driven-animations.style: 14 CSS-only demos, none SVG drawing, but the reading-progress pattern is the same timeline. https://scroll-driven-animations.style/
- CSS-only line + moving circle on scroll walkthroughs. https://www.trapti.dev/blog/scroll-triggered-css-animation-svg-line-reveals-card/ , https://medium.com/@r_tripti/css-only-animation-of-a-line-and-a-circle-that-moves-along-with-the-line-on-scroll-92f16fe33f33
- Awwwards "Illustration in Web Design" collection tags Line Illustration and SVG. https://www.awwwards.com/awwwards/collections/illustration-in-web-design/

## 5. Commissioning

- Fiverr character art: "typically charge between $42.50 and $60.73" per job, "13 to 23 days" (illustration avg 19 days). https://www.fiverr.com/hire/character-art
- Fiverr character/turnaround sheet gigs start $10 to $80 (line art, front/back/3-4 views). https://www.fiverr.com/jerictroy/do-character-sheets-and-turnaround-sheets , https://www.fiverr.com/ventitresei/make-a-character-design-sheet-with-turnaround
- Upwork illustrators: median $25/h, typical $15 to $30/h. https://www.upwork.com/hire/illustrators/cost/
- Published pro rates 2026: spot illustration $150 to $600, junior $15 to $35/h, intermediate $40 to $80/h, expert $80 to $200/h. https://www.designelite.co/en/blog/illustration-cost
- Realistic budget for this job: 6 stages + 5 scenery + revisions as clean SVG: $150 to $400 on Fiverr/Upwork mid-tier, $600 to $1,500 for a Dribbble-level illustrator; 2 to 3 weeks.

Brief must include
- Style: monotone black ink on paper, single line weight, no fills, no shading, no hatching; one accent color on 1 to 3 elements per stage (list them).
- Character sheet first (front, 3/4) at age 10, then derive 17, 20, 25, 28; same face landmarks, hair evolves; approve sheet before scenes.
- Deliverable: SVG per stage, viewBox 0 0 400 600, all art as open `<path>` strokes, `stroke="currentColor" fill="none"`, accent paths in `<g class="accent">`, no compound paths, no clip masks, no text, no embedded raster, no strokes converted to outlines ("Simplify stroke" off in Figma, "Expand" off in Illustrator).
- Path budget: 20 to 60 paths per character, 5 to 15 per scenery, total file under 20 KB unminified.
- Draw order = reveal order (head, torso, arms, props); consistent direction.
- If morph wanted: same anchor count and order across the 5 character stages (state it, it doubles price).
- Source file (Figma/AI) plus commercial license with modification rights, no attribution clause.

## 6. Sizing reality (measured locally, svgo 4.1.0)

| Sample | Paths | Raw | After svgo | Gzip after |
|---|---|---|---|---|
| DiceBear Notionists (filled, mix and match) | 15 | 15.0 KB | 13.8 KB | 6.1 KB |
| DiceBear Open Peeps | 9 | 12.3 KB | 11.6 KB | 5.4 KB |
| DiceBear Croodles (stroked doodle) | 24 | 7.5 KB | 6.3 KB | 2.4 KB |
| unDraw scene | 21 | 10.0 KB | 8.7 KB | 3.7 KB |
| Open Doodles "coffee" (Sketch export, outlines) | 57 | 43.8 KB | 21.1 KB | 10.2 KB |
| Open Doodles "plant" (outlines) | 454 | 200.5 KB | 99.3 KB | 45.1 KB |

- A hand-traced stroke character with 30 to 60 open paths lands around 5 to 15 KB raw, 2 to 6 KB gzipped (Croodles/unDraw class). Traced outlines of the same drawing are 5x to 20x larger (Open Doodles plant class).
- Auto-traced PNGs "can result in 240 KB files because they contain thousands of tiny paths"; SVGO default typically cuts editor exports 50 to 80%. https://rebrixe.com/blogs/why-svg-files-get-large , https://www.svggenie.com/blog/svg-path-optimizer-guide
- Render cost scales with path complexity not display size; fewer nodes draw faster. https://www.svggenie.com/blog/svg-path-optimizer-guide
- 6 stacked scenes hand-traced: 30 to 90 KB inline HTML, 15 to 40 KB over the wire. 6 traced scenes: 0.5 to 1.5 MB inline, and each stroke-dashoffset frame repaints thousands of paths.
- Mitigations: one `<svg>` per scene (not one giant SVG), `contain: paint` on each scene wrapper, `content-visibility: auto` on offscreen scenes, animate only the visible scene via `view()` timeline, reuse shared props via `<symbol>` + `<use>` with `prefixIds`.
