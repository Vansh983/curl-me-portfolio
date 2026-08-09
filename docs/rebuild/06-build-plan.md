# Build Plan: stack decision and all 14 features

Status: **phases 0 to 3 built** on `canary`, 2026-08-08. Sits on top of docs 01 to 05.

## What exists right now

`npm install && npm run dev`. Build is clean: `astro check` reports 0 errors, 0 warnings, 0 hints.

| Shipped | Where |
|---|---|
| Astro 7.2 static, zero framework JS (about 3 KB inline, no external bundle) | `astro.config.mjs` |
| Brand tokens, light and dark, system plus a manual toggle | `src/styles/tokens.css` |
| Home, /now, /archive, /blog, post pages, 404 | `src/pages/` |
| Timeline, scroll-driven, pure CSS | `src/components/Timeline.astro` |
| Canvas window, pauses offscreen, reduced-motion safe | `src/components/Field.astro` |
| Command menu, Cmd K, vanilla | `src/components/Menu.astro` + `src/pages/search.json.ts` |
| ASCII panel on the 404 | `src/pages/404.astro` |
| Wordmark weight axis | `src/components/Wordmark.astro` |
| curl response with ANSI colour | `src/pages/index.txt.ts` + `middleware.ts` |
| llms.txt, llms-full.txt, .md twin per post | `src/pages/llms*.ts`, `src/pages/blog/[slug].md.ts` |
| RSS, sitemap, canonicals, Person and BlogPosting JSON-LD | `src/layouts/Base.astro`, `rss.xml.ts` |
| View transitions and speculation rules | `global.css`, `Base.astro` |
| X-headers, humans.txt, robots.txt, HTML source comment | `vercel.json`, `public/` |
| 31 projects and the timeline, ported from `curl-era` with the old data bugs fixed | `src/data/` |

Two deliberate deviations from the plan below:

1. **Search is a static JSON index, not Pagefind, for now.** With one post, full text search would be a dependency for nothing. Pagefind slots into the same command menu when the blog repo lands.
2. **Astro 7, not 6.** 7.2 is current and requires Node 22.12+.

Not built yet, by design: satori OG images, the GitHub commit strip and its nightly cron, the `npx vanshsood` card, and the remark plugin that turns footnotes into margin notes (the CSS for them is already in place). Those are phases 4 and 5.

One thing cannot be verified locally: **Vercel Routing Middleware needs a real deployment**. Everything else was checked in a browser and in the built output.

Needs your answers: the Floqer start year, the right email address, and whether Halifax is still the city. All three are marked `TODO` in `src/data/`.

## The decision

**Astro 6 (static output) on Vercel, with Vercel Routing Middleware in front of it.**
No React, no Next, no animation library, no client router.

Everything on the ideas list is built from four primitives:

| Primitive | Used for | JS cost |
|---|---|---|
| Static HTML from Astro | every page, every post, llms.txt, .txt and .md twins, OG images | 0 |
| Plain CSS (scroll timelines, view transitions, variable fonts) | timeline, page transitions, wordmark motion, sidenotes | 0 |
| Tiny vanilla islands (`client:visible` / `client:idle`) | command menu, canvas window, ASCII panel | under 12 KB total |
| Vercel Routing Middleware + headers config | curl response, X-headers, redirects | 0 on the browser path |

Target: **under 15 KB of JavaScript on the whole site**, 100 Lighthouse, first byte from CDN cache.

### Why Astro and not the alternatives

- **Astro**: HTML-first, ships zero JS unless a component asks for it, content collections with schema validation at build, Markdown is the source of truth (which is what makes it readable by both people and models). Islands mean the command menu and the canvas do not drag a framework runtime onto every page.
- **Next.js**: rejected. Ships a React runtime before you write a line, App Router complexity buys nothing for a text site, and the LLM-readable story is worse because content is JSX-shaped rather than Markdown-shaped.
- **Hand written HTML**: rejected. 31 archive projects plus a blog needs a content pipeline, an RSS feed and OG generation. That is what a static site generator is.
- **11ty**: close second, genuinely fine. Astro wins on typed content collections, first-class islands for the three interactive pieces, and better tooling.

### One risk worth naming

Cloudflare acquired the Astro team in January 2026 (Astro stays open source). Practical read: no reason to move, since Astro output is plain static HTML and the `@astrojs/vercel` adapter is barely used in a static build. If Vercel support ever degrades, the site is portable in an afternoon. Revisit only if the adapter stalls.

### Why this answers "queryable" and "works when people query"

Three different consumers, one source of truth:

1. **People**: static HTML, prefetched, cross-faded.
2. **Search engines**: Person and BlogPosting JSON-LD, sitemap, canonicals, unique titles (doc 04).
3. **Models and agents**: `/llms.txt` index, a raw `.md` twin of every page, and clean semantic HTML. When an assistant is asked who Vansh Sood is, it reads a file written on purpose instead of guessing from scraped markup.

On-site search is **Pagefind**: it indexes the built HTML at the end of the build and ships a static WASM index that loads only when the command menu opens. No search server, no API key, no runtime cost. The command menu and the search box are the same thing.

Instant navigation is **speculation rules** (`prefetch` at moderate eagerness, `prerender` where supported) plus native `@view-transition`. Clicked links are already in memory.

---

## Repository shape

```
src/
  pages/
    index.astro            home: wordmark, now line, timeline, one canvas window
    now.astro              /now, present tense status
    archive.astro          31 projects, filterable with CSS only
    blog/index.astro       post list
    blog/[slug].astro      post
    blog/[slug].md.ts      raw markdown twin
    404.astro              ASCII panel lives here
    index.txt.ts           the curl response
    llms.txt.ts            agent index
    llms-full.txt.ts       everything, one file
    rss.xml.ts
    og/[...slug].png.ts    satori image per page
  content/
    blog/*.md              posts (external blog repo copied in)
    data/timeline.json     one entry per milestone, drives the SVG-free timeline
    data/projects.json
  components/
    Head.astro             titles, canonicals, OG, JSON-LD
    Timeline.astro         pure CSS scroll-driven
    Field.astro            canvas island
    Menu.astro             command menu island
  styles/tokens.css        the brand from the Brand Lab, ~24 custom properties
middleware.ts              curl sniffing, at the edge
vercel.ts                  headers, redirects, cron
public/
  humans.txt  robots.txt  resume.pdf
```

---

## The 14 features, and how each stays simple

Rule for all of them: **subtle by default**. If a feature cannot be built in under roughly 60 lines, it gets cut down until it can.

### Identity layer

**1. `curl vanshsood.com` returns a plain text resume**
`src/pages/index.txt.ts` is a static endpoint that renders the same content collection data as the homepage into text with a few ANSI colour codes. `middleware.ts` at the repo root checks the user agent and rewrites terminal clients to it:

```ts
export const config = { matcher: '/' };
export default function middleware(req: Request) {
  const ua = req.headers.get('user-agent') ?? '';
  if (/^(curl|wget|HTTPie)/i.test(ua)) return new URL('/index.txt', req.url); // rewrite, URL stays the same
}
```
Runs before cache, adds no latency for browsers, and the site stays fully static. Same trick gives `curl vanshsood.com/now` and `curl vanshsood.com/blog/slug`.

**2. `npx vanshsood`**
Separate 30 line package, one `bin` script, prints a boxed card and exits. No dependencies (box drawing by hand, not with a library). Published once, then forgotten.

**3. `/llms.txt` and `.md` twins**
`llms.txt` is generated from the collections: H1, a one-paragraph summary, then linked sections. `llms-full.txt` concatenates everything for a single fetch. Every post also renders at `/blog/slug.md` as its raw source. All three are build-time endpoints, so they can never drift from the site.

**4. Command menu (Cmd K)**
One island, vanilla, roughly 80 lines: a dialog element, an input, arrow keys, enter. Static list of pages first; if the query is longer than two characters, it lazily imports the Pagefind bundle and searches post bodies. `?` opens a shortcut sheet. Nothing loads until the first keypress.

### Motion layer

**5. The timeline, pure CSS**
One `<ol>` driven by `timeline.json`. The spine draws with `animation-timeline: scroll()`, each entry lights with `animation-timeline: view()`. No SVG path, no hardcoded pixel coordinates, no GSAP, so adding a 2027 entry is a JSON line. Browsers without support get the finished state, which reads correctly as a normal list.

**6. One framed canvas window**
Exactly one per page, hairline border, monochrome, drawn from the ink token so it follows the theme. Roughly 18 fps, `IntersectionObserver` pauses it offscreen, `prefers-reduced-motion` draws a single static frame. Around 40 lines of Canvas 2D. No WebGL, no shader toolchain.

**7. ASCII panel**
Same island, different renderer: the field printed as monospace glyphs into a `<pre>`. Scoped to the 404 page and the OG images so the homepage stays calm. Reuses the canvas code path, so it is nearly free once feature 6 exists.

**8. The wordmark is the animation**
Variable font weight transition on hover or focus, one CSS property. Optional one-time decode on first load, stored in `sessionStorage` so it never repeats in a session. This is the only motion allowed above the fold.

### Live layer

**9. Commit strip**
Build-time fetch of the public GitHub contributions, rendered as 26 divs. A Vercel cron hits a deploy hook nightly, so the page ages by itself. If the fetch fails the build uses the last committed snapshot, so a GitHub outage never breaks a deploy.

**10. `/now`**
A Markdown page with an `updated` date in frontmatter, surfaced in the layout. Replaces the stale hero paragraph problem for good. Also served over curl.

**11. Satori OG images**
`satori` plus `@resvg/resvg-js` in a static endpoint over the collection, using the real display font and the brand tokens. Generated at build, cached forever by the CDN.

### Reading layer

**12. Sidenotes**
A remark plugin turns Markdown footnotes into margin notes; a CSS grid puts them in the right column above 1100px and inline below. No JavaScript.

**13. View transitions and instant navigation**
`@view-transition { navigation: auto; }` for the cross-fade, `view-transition-name` on the wordmark so it stays pinned across pages, and a speculation rules script for prefetch. Zero JavaScript, no client router (Astro's `ClientRouter` is deliberately not used, because it reintroduces hydration and breaks inline scripts on soft navigation).

**14. Headers and humans.txt**
`vercel.ts` sets the X-headers; `public/humans.txt` credits the stack; the HTML source starts with a small ASCII comment. Free, invisible, on brand.

---

## Motion budget (the thing that keeps it subtle)

1. One moving element per viewport. Never two.
2. Motion is either scroll-linked (the timeline) or framed inside a bordered window (the canvas). Nothing floats loose on the page.
3. Nothing autoplays above the fold except the wordmark, and only for a moment.
4. Everything pauses offscreen and respects `prefers-reduced-motion`.
5. Monochrome. The accent colour appears in motion only when it means something.

## Performance budget

| Metric | Budget |
|---|---|
| JS shipped, homepage | under 4 KB |
| JS shipped, worst page | under 15 KB |
| Fonts | 2 woff2 files, subset to latin, `font-display: swap` |
| Largest contentful paint | under 1.0 s on 4G |
| CLS | 0 |

Enforced by a size check in CI, not by discipline.

## Build order

- **Phase 0**: `npm create astro`, Vercel project on `canary`, tokens.css from the chosen Brand Lab combo, Head.astro, layout. Deploys a homepage with a wordmark and nothing else.
- **Phase 1**: content collections, blog import from the external repo, archive and timeline JSON, RSS, sitemap, JSON-LD, canonicals. Site is complete as text.
- **Phase 2, the signature**: curl middleware plus index.txt, llms.txt plus .md twins, the CSS timeline, command menu with Pagefind.
- **Phase 3, the motion**: canvas window, wordmark axis, view transitions, speculation rules, ASCII 404.
- **Phase 4, the live parts**: commit strip plus nightly cron, /now, satori OG images.
- **Phase 5, the trinkets**: npx card, X-headers, humans.txt, sidenotes.
- **Phase 6**: Search Console, backlinks, then swap `canary` onto the apex domain and retire the old main.

Each phase ends deployable. Nothing in a later phase is required by an earlier one.

## Open items

- Brand combo from the Brand Lab is not chosen yet. Phase 0 needs it.
- Confirm apex vs www, and whether `blog.vanshsood.com` 301s into `/blog`.
- Confirm the current email and the correct topmate URL (doc 05 lists the conflict).
- Decide whether the repo is renamed or `curl-me-portfolio` is kept, which is now accurate for the first time.
