# R4: scroll-driven "life story" references

Brief: two columns. Left = text chapters scrolling (the wall). Right = sticky stage, fixed background, SVG/3D-ish author figure grows kid -> founder. Monotone paper and ink, one acid accent. Prefer zero or tiny JS.

All URLs curl-verified 200 on 2026-08-25 unless flagged. WebSearch budget hit its cap mid-run; later lookups used firecrawl + curl.

## Top 5 closest to the brief

1. HuffPost Highline "Millennials Are Screwed" (Poor Millennials): https://highline.huffingtonpost.com/articles/en/poor-millennials/
   - 8-bit avatar walks through the life stages of a generation as the text scrolls beside it. Closest narrative shape to "kid to founder".
   - three.js r87 + custom main.js. No source. Steal: one character, one scene per chapter, text drives it.
2. Robby Leonardi interactive resume: http://www.rleonardi.com/interactive-resume/
   - Character runs, swims, flies through layered PNG scenes as you scroll. Resume text lives inside scenes.
   - jQuery 3.3.1 + jQuery UI + hand-rolled scroll scripts, layered PNG sprites. Clone: https://github.com/matatacmca/interactiveCV (23 stars). Steal: chapter = a scene, avatar changes pose per scene.
3. The Pudding sticky pattern (blog + repo): https://pudding.cool/process/scrollytelling-sticky/ , https://github.com/the-pudding/blog_scrollytelling-sticky
   - The canonical "text steps left, sticky graphic right" recipe. Parent wraps steps + graphic; graphic is `position: sticky; top: 0`; steps toggle state via enter-view / Scrollama.
   - Steal the DOM shape verbatim. Swap the JS step detection for CSS `view-timeline` + `timeline-scope` (see 4).
4. Josh Comeau, Scroll-Driven Animations: https://www.joshwcomeau.com/animation/scroll-driven-animations/
   - Has the exact demo: sticky square fades as a scrolling paragraph's view progress drives its keyframes via `view-timeline: --name` + `timeline-scope` on the ancestor + `animation-timeline: --name` on the sticky element. Zero JS.
   - Support ~85% (all but Firefox stable, June 2026 note). Steal: named view timelines per chapter, each scrubs one keyframe set on the stage.
5. SBS "The Boat": https://www.sbs.com.au/theboat/ (case study https://distil.im/projects/the-boat)
   - Sumi-e ink illustration, monochrome, scanned 2D art driven by scroll with a custom handwriting font. The tone reference for paper-and-ink.
   - Three.js WebGL + GLSL + custom JS framework, custom multichannel audio. No source. Steal: ink texture, scroll-scrubbed parallax layers, hand-lettered chapter heads.

## A. Personal portfolios / resumes with an evolving character or scene

- Robby Leonardi (see top 5). Award: CSS Design Awards 2013, FWA.
- Joseph Santamaria https://joseph-san.com/ (Codrops writeup https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/)
  - Astronaut with 4 states (fall, walk fwd, walk back, idle) advancing through scenes on snap scroll. Three.js + GSAP ScrollTrigger/Observer, Blender, KTX2. No source. Steal: 4 avatar states are enough; scroll beats flip states.
- Maxime Guillon https://www.maximeguillon.com/ , source https://github.com/Maxxiiime/KameHousePortfolio
  - Scroll-driven walk through a virtual house, skills as rooms. GSAP. Source public. Steal: repo structure for GSAP scroll scenes.
- Marats Samigullins, hiking story https://github.com/Marat200118/Scrollytelling-hiking (live URL 404 now)
  - Personal "from first camp to instructor" narrative. GSAP ScrollTrigger, scroll-scrubbed video, Mapbox. Source public. Steal: chapter structure of a personal journey.
- Muhammad Bilal Khan https://mbilalkhan.com/ (Awwwards HM 2022)
  - Scroll moves through a room representing his work. React bundle. No source.
- Maciej Baska https://www.maciejbaska.com/ (Awwwards HM 2022)
  - Small storytelling portfolio, dark minimal, illustration. No source.
- Melanie Daveid https://www.melaniedaveid.com/
  - Illustrated portfolio, characters animated with Rive (+ some Lottie, inline SVG). Steal: Rive state machine driven by scroll % (see Rive tutorial below).
- Samuel Day https://www.samuelday.de/ (Awwwards scroll-triggered)
  - Illustrated, Lottie + matter.js physics, Webflow. Steal: nothing technical, but the "little Sams" character motif.
- Cassie Evans https://cassie.codes/
  - Animated SVG self-portrait, GSAP. Her 11ty base is public (https://github.com/cassieevans/svg-site). Steal: SVG portrait built for animation (grouped, named layers).
- Piotr Jankowski pixel-art resume http://jankowskiresume.com/ , source https://github.com/petejank/interactive-resume (21 stars, React).
- Prateek Narang interactive resume https://github.com/prateek27/interactive-resume (157 stars; live site down).
- Marcus Due Jensen https://www.marcusduejensen.com/interactive-resume.html (Weebly, jQuery; weak).
- Pascal van Gemert https://www.pascalvangemert.nl/ (classic two-column interactive CV, custom JS, no library detected).
- Adham Dannaway https://www.adhamdannaway.com/ (split designer/dev face; static, not scroll-driven; identity idea only).
- Bruno Simon https://bruno-simon.com/ , source https://github.com/brunosimon/folio-2019 (4.7k stars)
  - Three.js + cannon.js car you drive; not scroll-driven. Reference for "playful 3D self" only.
- Sean Halpin https://www.seanhalpin.xyz/ (illustrated, no scroll story; skip).

## B. Sticky stage + scrolling text (editorial scrollytelling)

- The Pudding sticky recipe (top 5). Also: https://pudding.cool/process/responsive-scrollytelling/ (rules: mobile first, no `vh`, use px from innerHeight, matchMedia for breakpoints, kill hover, keep steps short).
- The Pudding library comparison (2017): https://pudding.cool/process/how-to-implement-scrollytelling/ (Waypoints, ScrollStory, ScrollMagic, graph-scroll, in-view, roll your own).
- Pudding example piece: https://pudding.cool/2017/03/film-dialogue/ (sticky chart right, steps left).
- NYT Snow Fall (2012): https://www.nytimes.com/projects/2012/snow-fall/ (the origin; custom JS).
- Every Last Drop http://everylastdrop.co.uk/ (http only)
  - Astronaut's morning, one scene per scroll block, cartoon parallax. skrollr.js + jQuery 1.8 (data-attribute keyframes). Steal: scene-per-chapter pacing.
- NASA Prospect https://nasaprospect.com/ (2013): require.js + jQuery + soundmanager2, layered parallax scenes with story. Old but alive.
- Trip in the Dark https://tripinthedark.ru/en (Awwwards): illustrated minimal scroll story, custom theme JS.
- Black Dog https://blackdogstory.com/ (WebGL picture book, near-monochrome ink dog story). Tone reference.
- Ponpon Mania https://ponpon-mania.com/about (Nuxt + WebGL + GSAP; Codrops case study https://tympanus.net/codrops/2025/10/07/ponpon-mania-how-webgl-and-gsap-bring-a-comic-sheeps-dream-to-life/). Animated storybook "about" page.
- MindMarket https://mindmarket.com/ (Awwwards): Rive animations follow a path on scroll, Lenis. Steal: path-follow character with Rive.
- Cyclemon https://www.cyclemon.com/ (illustrated bike per section, simple).
- Firewatch https://www.firewatchgame.com/ (layered PNG hero parallax).
- scrollytelling.ai "Universe to You" https://scrollytelling.ai/universe-to-you/ (marketed CSS-only; page actually ships Lenis + GSAP ScrollTrigger + Rive, so not zero JS).
- Apple MacBook Pro https://www.apple.com/macbook-pro/ (canvas frame sequence; AirPods Pro = 65 PNG, 15.2 MB). Anti-pattern for weight.

## C. Line-art / monochrome / paper-and-ink

- The Boat (top 5): sumi-e ink, custom handwriting font, scanned art.
- Black Dog: near-monochrome WebGL picture book.
- Olha Lazarieva (black-and-white typographic story portfolio, listed at https://reallygooddesigns.com/scrollytelling-website-examples/ ; URL not resolved).
- "Who's Guilty" scribble-style illustrated story (same list; URL not resolved).
- Codrops scroll-driven SVG map (line drawing): https://tympanus.net/codrops/2026/05/21/creating-scroll-driven-svg-map-animations-with-gsap/ , demo https://tympanus.net/Tutorials/ScrollMap/ , pen https://codepen.io/creativeocean/pen/myOVZYO/
  - DrawSVG draws the path, MotionPath moves a marker, quickTo pans the "camera", ScrollTrigger pins a 300vh section. Steal: pinned SVG with viewBox, stroke draws as you scroll.
- SVG line drawing basics: https://css-tricks.com/svg-line-animation-works/ (stroke-dasharray/dashoffset; pure CSS when tied to `animation-timeline`).
- Codrops SVG text on path on scroll: https://github.com/codrops/AnimateSVGTextPath (64 stars, IntersectionObserver).

## D. Zero or tiny JS

- Josh Comeau (top 5): sticky element scrubbed by another element's view timeline, zero JS.
- Roman Komarov "Future CSS: wishes granted by scroll-driven animations" https://kizu.dev/scroll-driven-animations/
  - Pure CSS: stuck-header detection, scroll shadows, TOC highlighting via `timeline-scope` + per-section `view-timeline` names in inline styles. Steal: the `--section-n` naming trick to map N text chapters to N stage keyframes.
- Bramus demos https://scroll-driven-animations.style/ (14 demos: progress bar, cover flow, stacking cards, horizontal section, 3D shoe explorer, image reveal, contact list, scroll shadows). Tools: animation-range visualizer https://scroll-driven-animations.style/tools/view-timeline/ranges/ . Utilities https://github.com/bramus/sda-utilities (36 stars, active 2026). Debugger https://github.com/bramus/scroll-driven-animations-debugger-extension .
- Ryan Geyer, (almost) pure CSS image sequence https://geyer.dev/blog/css-image-sequence-animations/ (Cloudflare blocks bots; open in browser)
  - Spritesheet + `animation-timeline: scroll()` stepping `background-position`. Replaces Apple's 65 PNG + canvas. Steal: if you ever bake the figure as frames, do this, not canvas.
- Ryan Mulligan https://ryanmulligan.dev/blog/scroll-driven-animations/ and https://ryanmulligan.dev/blog/scroll-triggered-animations-style-queries/ (scroll-triggered via style queries, no JS).
- CSS-Tricks, Lee Meyer "Scrollytelling on steroids with scroll-state queries" https://css-tricks.com/scrollytelling-on-steroids-with-scroll-state-queries/ (pixel-art character game in pure CSS: scroll-state, animation timelines, `if()`; Chromium only).
- Effect.Labs sticky + scroll-driven https://effect-labs.com/en/pages/blog/sticky-scroll-sections.html (three tiers: pure CSS timeline, IntersectionObserver, scroll events).
- Polyfill https://github.com/flackr/scroll-timeline (1.2k stars, last push 2024-08; no linked timelines).
- Astro example, zero framework JS: https://github.com/theomeme/portfolio-scrollytelling (Astro, "paper" light + "dusk" dark palettes, vanilla reveal/parallax). Small but same stack as this repo.

## E. Tutorials and guides for this exact layout

- Pudding sticky (top 5).
- Josh Comeau (top 5).
- Chrome docs https://developer.chrome.com/docs/css-ui/scroll-driven-animations ; case studies https://developer.chrome.com/blog/css-ui-ecommerce-sda (Tokopedia: 80% less code, CPU 50% -> 2%; redBus; Policybazaar); perf study https://developer.chrome.com/blog/scroll-animation-performance-case-study .
- MDN guide https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations .
- Bramus 10-video course (CSS-Tricks) https://css-tricks.com/unleash-the-power-of-scroll-driven-animations/ ; tag archive https://www.bram.us/tag/scroll-driven-animations/ .
- Codrops practical intro https://tympanus.net/codrops/2024/01/17/a-practical-introduction-to-scroll-driven-animations-with-css-scroll-and-view/ .
- Smashing, Mariana Beldi https://www.smashingmagazine.com/2024/12/introduction-css-scroll-driven-animations/ (timeline-scope for sibling linking; GPU-only props).
- Kevin Powell video "Incredible scroll-based animations with CSS-only" https://www.youtube.com/watch?v=UmzFk68Bwdk .
- Codrops Sticky Grid Scroll https://tympanus.net/codrops/2026/03/02/sticky-grid-scroll-building-a-scroll-driven-animated-grid/ , repo https://github.com/theoplawinski/codrops-sticky-grid-scroll (sticky wrapper + 425vh runway + ScrollTrigger + Lenis).
- Codrops scroll layout switches https://github.com/codrops/ScrollBasedLayoutAnimations (334 stars, ScrollTrigger + Flip).
- Codrops Astro + GSAP portfolio https://tympanus.net/codrops/2026/02/18/joffrey-spitzer-portfolio-a-minimalist-astro-gsap-build-with-reveals-flip-transitions-and-subtle-motion/ (live https://joffreyspitzer.com/ ; scrub pattern `scrollTrigger:{trigger, start, end, scrub:true}` inside Astro).
- Apple-style canvas frames https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/ (know it, avoid it).
- GSAP path-follow pens: https://codepen.io/GreenSock/pen/LYywqze , https://codepen.io/snorkltv/pen/KKmZYGy , https://codepen.io/JasonDuquain/pen/YzxBvwg (CodePen returns 403 to curl; fine in browser).
- Rive from scroll, no GSAP: https://malts.me/blog/rive-scroll-animations/ (Blend 1D state machine input = scroll %, 60 to 80 lines vanilla JS, canvas-lite build).

## F. Libraries: size and health

- scrollama https://github.com/russellsamora/scrollama : 5,998 stars, last commit 2025-11-13 (dev-dep cleanup), npm 3.2.0 from 2022-06. `scrollama.min.js` 4.8 KB raw, 2.1 KB gzip. Stable, low activity, IntersectionObserver based. Fine to use, or skip for CSS timelines.
- ONS svelte-scrolly https://github.com/ONSvisual/svelte-scrolly : 192 stars, pushed 2025-10. Svelte only.
- enter-view (Pudding's pick in 2018), Waypoints, ScrollMagic: legacy.
- GSAP ScrollTrigger: the industry default for pinned scrub; now free for all use, but ~70 KB+ of JS.
- flackr/scroll-timeline polyfill: 1.2k stars, stale since 2024-08.

## Recommendation for this repo

- Layout: Pudding DOM (wrapper > steps + sticky stage). Stage `position: sticky; top: 0; height: 100dvh`.
- Motion: CSS only. Each chapter `<section style="view-timeline: --ch-n">`; wrapper `timeline-scope: --ch-1, --ch-2, ...`; stage layers use `animation-timeline: --ch-n; animation-range: entry 0% exit 100%` to crossfade / morph SVG layers (opacity, transform, stroke-dashoffset). No JS in supporting browsers.
- Fallback: `@supports not (animation-timeline: scroll())` shows the final figure static; optional 2 KB scrollama to toggle `data-chapter` for Firefox.
- Figure: one SVG with named groups per age (kid, teen, student, engineer, founder), same viewBox, same anchor point, ink strokes only, accent on one element per chapter.
- Dead or blocked during check: jeraldportfolio.uk (Awwwards "life journey" piece, 000), species-in-pieces.com (000), rstlss.xyz (000), marats-samigullins.com/scrollytelling (404), prateeknarang.com (000).
