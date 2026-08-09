# Animation Strategy

## The budget rule (from stripe.dev + the survey)

The page is **95% static text**. Motion is confined to named, framed places — never ambient, never scroll-jacking, always disabled under `prefers-reduced-motion`. The best sites' entire animation budget: page-entrance stagger (antfu), hover micro-interactions (paco, emil), and contained art pieces (stripe.dev's windows).

## Proposed animation budget for the new site (in priority order)

1. **The timeline** — the one inherited signature interaction (see below).
2. **One generative art window** — stripe.dev-style framed Canvas2D piece near the hero: fake window chrome, `[ Fig. 1 ]` caption, line-art grid driven by a rAF loop, reads colors from CSS vars so it re-skins with theme. Optionally draggable = 10× speed.
3. **Page-entrance stagger** — antfu's `slide-enter`: each element fades/slides up with `animation-delay: calc(var(--i) * 60ms)`. Pure CSS.
4. **Hover micro-interactions** — link underline slide (background-size 0%→100%), accent fill behind text on hover (stripe.dev), arrow nudge on external links. Pure CSS, 150–200ms ease-out.
5. **View transitions** — CSS-only cross-document: `@view-transition { navigation: auto; }`. Zero JS; Astro supports natively.
6. (Optional flourish) **Text scramble/decode** on the hero roles line — replaces the old TypeAnimation rotator with something artsier.

## Timeline treatment

### What the old one did (see 05-content-inventory.md for full mechanics)

GSAP ScrollTrigger scrubbed a master timeline: a white dot traveled a hand-drawn SVG S-curve via MotionPathPlugin while logo "pulses" popped at fixed progress points (0.2/0.38/0.55/0.74). Known defect: the line-draw used `drawSVG` — a paid Club plugin that was never installed, so it silently never worked. Milestone coords and year labels were hardcoded into the SVG.

### Recommended rebuild

**Hairline spine + scroll-scrubbed draw + data-driven entries.** No site in the survey has a graphical timeline — open lane.

- Structure: vertical `1px` spine (`border-left` or an SVG line), entries as data-driven rows: mono year label + bold title + muted prose. Ghost year numeral behind each group (antfu's move: absolute, 8–10rem, 4–6% opacity or text-stroke).
- Draw the spine on scroll with **CSS scroll-driven animations** — `animation-timeline: scroll()` scaling `scaleY 0→1` — zero JS in Chromium; IntersectionObserver fallback.
- Entry reveal: IO adds class → `opacity 0→1, translateY 12px→0, 400ms`, stagger 50–80ms.
- The traveling-dot-on-a-curve idea can survive as a progress dot pinned to the spine (accent color — one of the few accent uses).
- If GSAP is still wanted: ScrollTrigger AND DrawSVG are now **100% free** (post-Webflow acquisition), so the old broken effect is buildable properly. But CSS + IO covers this timeline without shipping 48KB.

### Real timeline references

- antfu.me/posts — year-grouped list, giant translucent year numerals, staggered entrance
- craftz.dog — bold year + plain event text, sections fade up (repo: craftzdog/craftzdog-homepage)
- linear.app/changelog — dates as standalone text dividers, no line, no ornament
- brittanychiang.com — muted uppercase date-range left column, hover lifts row / dims siblings

## Library shortlist

| Need | Pick | Notes |
|---|---|---|
| Scroll reveals | CSS `animation-timeline: view()` + IO fallback | Zero JS baseline |
| Anything complex | GSAP + ScrollTrigger | Now fully free incl. all plugins; ~48KB — only if actually needed |
| React-ish micro-motion | Motion (motion.dev) | ~8KB; irrelevant if Astro-static |
| Text scramble | GSAP ScrambleText (free now) or baffle.js (1.8KB vanilla) | Hover charset like `█▓▒░<>/` |
| ASCII/generative | play.core (ertdfgcvb, Apache-2.0) or hand-rolled Canvas2D | stripe.dev hand-rolls; ~100 lines gets a good line-art grid |
| Smooth scroll | Lenis | Skip at launch; momentum scroll fights "minimal" |

## Hard rules

- Every animation behind `@media (prefers-reduced-motion: no-preference)`.
- No autoplaying marquees unless CSS-only and reduced-motion-disabled (stripe.dev pattern).
- Nothing blocks reading: entrances ≤ 500ms total, reveals never delay content visibility for SEO/crawlers (content is in the HTML regardless).
