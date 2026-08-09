# Inspiration Research

All values below were read from live HTML/CSS (curl + WebFetch), not from memory. Raw source archives: session scratchpad `stripedev/` and `sites/` folders.

---

## Part 1 — stripe.dev deconstructed (the cited reference)

Next.js site, CSS Modules, Canvas 2D. Aesthetic: **"paper terminal"** — flat light-gray paper, near-black ink, one loud accent, mono smallcaps labels, file-directory UI metaphors, generative line art in draggable OS-style windows. No WebGL, no shaders, no three.js anywhere.

### Palette (default "paper" theme)

| Role | Value |
|---|---|
| Background | `#e8e8e8` / `#eaeaea` (paper gray, never white) |
| Text (all roles) | `#1e1e1e` (soft black, never `#000`) |
| Accent | `#c4e817` acid chartreuse — selection, link-hover fill, tag highlight only |
| Muted | `#8d8d8d`; disabled = `#1e1e1e44` (alpha-on-ink) |
| Borders | `#1e1e1e` solid, `#1e1e1e44` light, dotted `#ababab` |
| Window chrome | `#dcdcdc`; nav button bg `#1e1e1e11` |

Key mechanism: ~25 semantic CSS vars per theme (`--headingTextColor`, `--windowFrameBG`, `--artStroke`…) swapped wholesale by JS. Nine alt themes ship (night-owl, CRT red/amber/green/mono with pure-CSS scanlines, 90s-vibes with Win95 chrome, berkshirehathaway homage, seasonal). The art canvases read CSS vars live every frame, so artwork re-skins instantly on theme change.

### Typography

- Sans: **Söhne** (Klim) as variable woff2, weight 1–10000. Mono: **Söhne Mono** at 300/100. Pixel accent: DotGothic16.
- The signature pattern: **everything weight 300 (light), tight negative tracking, ~100% line-height**. Nothing bold; 500 only on buttons.
- Fluid scale via linear `calc()`, capped at 1728px container:
  - hero `calc(9.11vw + 12.5px)` → max **170px**, ls −0.07em, lh 80–84%
  - lg → 43px (−0.06em, 95%), md → 28px, sm → 21px, xs → 14px
  - `.text-smallcaps`: mono 12px uppercase — the label style (`/ Featured Post`, `[ Fig. 1 ]`)
- Blog body: 16–18px, lh 130%, weight 300. Links: 1px bottom border → hover fills solid accent behind the text.
- Buttons: pill radius 99px; hover inverts (ink bg, paper text).

### Layout

- Max 1728px centered; grid 8 cols mobile → 16 → 24 at 960px; `row-gap: 120px` between sections; subgrid for article+sidebar.
- Ornament vocabulary: `/` prefixes on section labels, `[ Fig. 1 ]` captions, `( n )` counters, `10x` chips, dotted 1px row separators, fake OS window title bars. Publication-meets-filesystem.
- Blog post: sticky metadata sidebar (dotted-separator table, tag chips, "copy for LLM" button) + a fixed 360×320 generative-art window per post.

### Animation (the "half little animation" model)

- **The page is ~95% static text.** Motion lives only in small framed windows plus one full-bleed footer.
- Art windows: aspect 302/252 boxes with fake OS chrome; inside, a rAF Canvas2D loop draws grids of rects/ellipses parameterized by `twist, twirl, noise, freq, amp, velocity, count, lump, kaleids…`. Grab-and-drag runs it at 10× speed. Kaleidoscope via offscreen canvas mirror passes.
- Endless footer: 200vh scroll region, fixed canvas, giant outline text extruding forever (`strokeText` + `destination-out` knockout), Shepard-tone audio, easter eggs at scroll depth ("You're still here?" → "It's over." → "You can go ❤️").
- Marquees: pure CSS translate keyframes, disabled under `prefers-reduced-motion`.
- Console: draggable xterm.js window with custom CLI, Snake, music player (Howler.js; tick/tock UI sounds at 0.2 volume).
- /art page exposes the internal generative-art instrument publicly.

### stripe.com vs stripe.dev

stripe.com = polished SaaS marketing: navy `#0a2540`, blurple `#635bff`, WebGL mesh-gradient hero, weights 400–600, airy 1.55 line-height. stripe.dev = anti-marketing developer zine: flat paper, single acid accent, weight-300 tight display, mono labels, Canvas2D. Same Söhne family bridges both; everything else deliberately diverges.

---

## Part 2 — Survey: 22 dev/CTO/eng-leader personal sites

### The headliners

**Boris Cherny — borischerny.com** (creator of Claude Code). Near-default Jekyll Minima: bg `#fdfdfd`, text `#111`, system sans 16px, **zero animation, zero design**. Homepage = post list with small gray dates. Data point: the creator of Claude Code doesn't decorate.

**Guillermo Rauch — rauchg.com** (Vercel CEO; from open-source repo rauchg/blog). 672px centered column at 14px base. Monochrome: light `#fcfcfc` / dark `#1C1C1C`, no accent hue, inverted selection. Geist Sans+Mono. Essay list with year rendered once per group in a narrow left gutter; live view counts per essay (Upstash Redis + SWR). Bold via density, not decoration.

**Mitchell Hashimoto — mitchellh.com**. Giant bold uppercase name in NimbusSansBold, **PT Serif body**, and the radical move: h1/h2/h3 all 17px — same size as body, bold-only hierarchy. Monotone `#fff`/`#101828`. Zero motion. Chronology told inline in bio prose.

**Paco Coursey — paco.me** (Linear). Strict grayscale, zero accent, gray underlined links. `--content-width: 640px` with side gutters for sidenotes. Inter + Sohne + Newsreader italic. 20 keyframes / 115 transitions — all invisible micro-motion. "Now" section on homepage.

**Rauno Freiberg — rauno.me** (Vercel). **Best match for the brief.** Dark splash: bg `hsl(0 0% 8.5%)`, text `hsl(0 0% 93%)`, display-P3 neon (acid yellow) only on selection/demos. /craft = dated chronological grid of interaction demos. Credo footer: "Make it fast. Make it beautiful. … Make it soulful. Make it."

**Anthony Fu — antfu.me**. Near-black `#050505`, no accent, underlined gray links. Signature moves: staggered `slide-enter` page entrance (per-element `--enter-stage` delay), animated hand-drawn SVG plum branch, **huge translucent ghost year numerals** dividing the post list, view transitions.

**Lee Robinson — leerob.com** (Cursor). 650px column, serif-first (**STIX Two Text** body), monochrome neutrals, near-zero animation, dateless "evergreen" post list, root-level post URLs.

**Dan Abramov — overreacted.io**. 672px column, 28px `font-black` titles, per-date `lab()` link colors that drift with post age, pink accent (not monotone). Full archive as homepage.

**Derek Sivers — sive.rs**. Warm cream `#fff1e5` paper, Georgia serif, deep-blue links, 13KB pages, zero JS. **Inventor of the /now page.** About layered by depth ("me in 10 seconds" → "10 minutes"). Boldest voice per byte.

**DHH — dhh.dk**. Hand-written single page, 580px fixed column, cream `#f6f5ed`, Georgia 18px, red accent `#c30c0c`. The page IS a chronological identity ledger — role sections with years inline. Zero animation.

### The rest, compressed

| Site | One-line takeaway |
|---|---|
| brandur.org | Warm near-white + serif; content taxonomy (Articles/Fragments/Atoms); monthly /now page |
| lucumr.pocoo.org (Armin Ronacher) | Merriweather/Lora serif; distinctive navy dark mode `#1b3156` |
| swyx.io | Dark `#090909` content hub; dates as `YYYY-MM-DD` + type emoji |
| brianlovin.com | Opposite pole: three-pane macOS-app layout, Notion CMS — contrast reference only |
| jim-nielsen.com | 576px ultra-narrow, Atkinson Hyperlegible, humble not bold |
| **emilkowal.ski** (Linear) | Strictest monochrome surveyed: 12-step gray vars, zero accent, custom serif; the animation teacher whose site barely animates |
| **shud.in** (Shu Ding, Vercel) | Most typographically artsy: "rurikon" lapis blue-gray monotone scale, OpenType feature serif, inline career chronology as prose |
| **thesephist.com** (Linus Lee) | Full-bleed dark hero band + giant IBM Plex Serif "My name is Linus." then paper column — exactly "in-your-face but tasteful" |
| danluu.com | Brutalist extreme: 190 bytes of CSS, no max-width, browser defaults |
| fabiensanglard.net | Bold via discipline: uppercase headers + hairline rules + justified text |
| delba.dev | Fraunces display serif + Geist pixel fonts + sparkles on strict stone palette — "artsy monotone" datapoint |
| cretu.dev | Astro 5 + view transitions done tastefully; "now" section as declarative one-liners |

### Cross-site patterns worth stealing

- **Column widths cluster at 576–672px** (36–42rem); wider shells only to host gutters/sidenotes. Centered column, left-aligned text.
- **The monotone formula**: near-white (`#fcfcfc`/`#fdfdfc`/`#fafaf9`) + near-black ink (`#111`–`#222`); dark mode `#050505`–`#1C1C1C`; grays for metadata; accent either absent or one hue used surgically.
- **Serif body is the current leader-site trend** (mitchellh, leerob, sivers, DHH, brandur, thesephist, emil) — a differentiator vs the grotesk crowd.
- **Animation ceiling among the best**: page-entrance stagger, hover pill/scale, micro-transitions. Nobody scroll-jacks.
- **Nobody uses a graphical timeline component** — they use /now pages, "Now" homepage sections, or inline prose chronology. A well-done scroll timeline is an open lane.
- Blog list styles: year-gutter (rauchg), ghost-year headers (antfu), dateless evergreen (leerob, emil, paco), archive-as-homepage (danluu, overreacted).
- Stacks: Next.js dominates; Astro (cretu), Vue/Vite (antfu), hand-rolled HTML for the veterans.
