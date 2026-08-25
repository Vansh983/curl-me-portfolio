# Portfolio Rebuild — Research Docs

Research for the new minimal portfolio (vanshsood.com). Direction: **very bold, in-your-face, artsy — but monotone, minimal, mostly text**. Reference aesthetic: stripe.dev's "paper terminal" (95% static text, animation confined to small framed art windows).

| Doc | What's in it |
|---|---|
| [01-inspiration.md](./01-inspiration.md) | stripe.dev full deconstruction + survey of 22 dev/CTO personal sites (Boris Cherny, rauchg, mitchellh, paco, rauno, antfu, leerob, sivers, DHH…) |
| [02-palette-typography.md](./02-palette-typography.md) | **The palette proposal** (3 candidates, one pick) + type system with exact fonts, sizes, tracking |
| [03-animation.md](./03-animation.md) | Animation budget, techniques, libraries, and the timeline treatment |
| [04-seo-blog.md](./04-seo-blog.md) | SEO architecture (name SEO, JSON-LD, OG images) + blog/content-collection setup + external blog repo import |
| [05-content-inventory.md](./05-content-inventory.md) | Everything worth carrying from the old site: timeline entries, 41 projects, links, bio copy. Plus: the curl gimmick never actually existed |
| [06-build-plan.md](./06-build-plan.md) | **The stack decision** (Astro 6 static on Vercel, zero framework JS) and how all 14 creative-tech features get built, in phases |
| [07-journey-stage.md](./07-journey-stage.md) | **The journey stage**: sticky right-column scene of the author growing up, driven by the left text wall. 10 routes ranked, art pipeline, stack re-check (not locked). Evidence in [07-research/](./07-research/) |
| [08-journey-stage-spec.md](./08-journey-stage-spec.md) | **The journey stage design spec**: parametric stroke figure that morphs with scroll, per-chapter scenery on CSS timelines, layout, fallbacks, tests, milestones |
| [09-journey-stage-plan.md](./09-journey-stage-plan.md) | **The implementation plan**: 10 tasks, TDD, real code for the figure, lerp, render tool, Astro component, timelines, fallback, and the art loop |

## The one-paragraph verdict

Build a paper-and-ink monotone site: near-white paper background, soft-black ink, mono smallcaps labels, one acid accent used surgically. One display grotesk at 100px+ for in-your-face headlines, small mono for metadata — the size contrast IS the design. Animation lives in two places only: a stripe.dev-style generative canvas "art window" and a scroll-scrubbed timeline spine. Everything else is static text. Astro + content collections for the blog, Person/BlogPosting JSON-LD everywhere, per-post OG images at build time.

## Sites that best match the brief (from the 22 surveyed)

1. **rauno.me** — near-black monochrome, sparse splash, neon only on interaction
2. **thesephist.com** — full-bleed dark hero, giant serif "My name is Linus.", then quiet paper column
3. **emilkowal.ski** — zero-hue 12-step gray system, restraint as flex
4. **stripe.dev** — the cited reference: paper gray, acid chartreuse, Canvas2D art windows, mono labels
5. **antfu.me** — ghost year numerals, staggered entrances, hand-drawn SVG art

## Open decisions for the brainstorm

1. Light paper (stripe.dev) vs dark ink (old site identity / rauno.me) as the default — palette doc recommends paper with a dark mode.
2. Accent hue: acid chartreuse family vs international orange vs zero-accent grayscale.
3. Actually build the `curl vanshsood.com` plaintext response this time (it never existed — see doc 05).
4. Display face: Space Grotesk (safe) vs Clash Display (louder).
5. Blog URL scheme `/blog/slug` (recommended) vs root `/slug`.
