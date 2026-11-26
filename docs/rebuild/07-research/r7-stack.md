# R7: stack for a scroll-driven "journey" portfolio + static blog on Vercel

Researched 2026-08-25. Sizes are min+gzip unless marked br. "local" = measured this session (starter app, hello page, `gzip -9` / `brotli -q 11`, Node 22). Every bullet carries its source.

## Verdict

**1. Astro 7 (static, no adapter, plain `<script>` for the scene).** Best fit. 0 KB baseline, best blog tooling of the six, and the scene code is plain DOM: no hydration, no SSR of canvas, no framework cleanup unless you opt into `<ClientRouter />`. Same model the WebGL showpieces use (lusion.co is Astro; Codrops' 2026 three + GSAP tutorial is Astro; GSAP's own examples repo has `astro-gsap`).
**2. SvelteKit 2 + Svelte 5.** 25 KB br baseline, Threlte for 3D, `$effect` gives a clean GSAP lifecycle, built-in transitions. Loses on blog tooling (mdsvex runes support landed 2026-07) and no first-party OG. Pick if you want the scene's state reactive and componentised.
**3. Vite + vanilla TS.** 0 KB, what bruno-simon.com and Codrops ship. No blog story at all (no collections, images, OG); Astro is "Vite vanilla plus a blog", so only pick this if the blog moves elsewhere.
**4. Nuxt 4.** 46 KB br baseline, strong content (`@nuxt/content` v3) and OG (`nuxt-og-image`), TresJS module makes the canvas client-only automatically. Static deploy ships WASM SQLite to the browser for content queries; `@vueuse/motion` stale 17 months; smallest portfolio ecosystem.
**5. Next.js 16 App Router.** 114 KB br before one line of animation (4.5x SvelteKit). MDX tooling churn (Contentlayer dead, next-mdx-remote archived 2026-04). Static export drops `next/image`. Strongest first-party OG/image/ViewTransition and the biggest 3D-portfolio tutorial ecosystem (R3F 31.8k stars). Moves to #2 only if you specifically want React + R3F.
**6. Eleventy 3.** 0 KB and a fine blog, but Astro strictly dominates it (islands, MDX without React, `astro:assets`, richer Vercel adapter).

Scene recommendation (any of the above, but sized for Astro)
- Sticky right stage = CSS `position: sticky`; chapters on the left are plain HTML. 0 JS.
- Drive the scene with GSAP ScrollTrigger `pin`/`scrub`: core + ScrollTrigger 46.2 KB gz; add MorphSVGPlugin (9.6 KB) and DrawSVGPlugin (2.2 KB) for the kid-to-founder SVG morph. All free since GSAP 3.13 (2025-04-29). Total about 57 KB gz, loaded only on the home page via one Astro `<script>`. GSAP works in Firefox, so no CSS scroll-timeline fallback is needed for this section.
- Skip three.js unless the scene truly needs 3D: WebGLRenderer floor is about 130 KB gz; R3F adds 52 KB plus React. If 3D, use vanilla three inside the same script (bruno-simon.com, igloo.inc, lusion.co all do three without R3F).
- 2D character alternative: Rive state machine driven by scroll progress; JS 42 to 49 KB gz plus 311 to 742 KB wasm. Heavier than SVG + MorphSVG; only worth it for rigged character animation.
- Page transitions: native CSS `@view-transition { navigation: auto }` (0 KB). Do not add `<ClientRouter />` (6.8 KB gz) with GSAP: module scripts run once, ScrollTriggers must be killed on `astro:before-swap`; GSAP forum's accepted fix is to drop ClientRouter.
- Keep CSS scroll-driven animations for cheap reveals only: Chrome 115+, Safari 26+, Firefox stable still lacks them (85.4% global). Note this repo already disables `cssMinify` because esbuild/lightningcss fold `animation-timeline` into the `animation` shorthand.

## Baseline JS, hello page

| Stack | Version | JS shipped | Source |
|---|---|---|---|
| Astro | 7.2.6 (2026-08-24) | 0 KB; this repo's built `index.html`: 0 external scripts, 1.3 KB gz inline | https://docs.astro.build/en/concepts/islands/ ; local |
| 11ty | 3.1.6 (2026-06-02) | 0 KB | https://www.11ty.dev/docs/performance/ |
| Vite vanilla | 8.2.2 (2026-08-20) | 0 KB beyond your entry | https://vite.dev/guide/static-deploy |
| SvelteKit | kit 2.70.3, svelte 5.56.10 | 71 KB raw / 27.6 gz / 24.8 br, adapter-static | local |
| Nuxt | 4.5.2 (2026-08-05) | 133 KB raw / 50.4 gz / 45.8 br, `nuxt generate`; maintainer says ~40 KB gz empty | local ; https://github.com/nuxt/nuxt/discussions/23729 |
| Next.js | 16.3.2 (2026-08-21), React 19.3 canary vendored | 453 KB raw / 133 gz / 114 br (5 chunks) + 39 KB gz nomodule polyfill for legacy | local ; https://nextjs.org/blog/next-16-3 |
| stripe.dev/blog (the reference) | Next.js + Turbopack | 14 chunks, 215 KB compressed | curl, 2026-08-25 |

## Per-stack facts

### Astro 7
- 7.0 (2026-06-22): Rust compiler, Rust Markdown "Sätteri" (GFM, math, wikilinks without plugins), Vite 8 / Rolldown. https://astro.build/blog/astro-7/ . 6.0 (2026-03-10): Fonts API, CSP, live collections. https://astro.build/blog/astro-6/
- Vercel: static by default, zero config, auto-detected. `@astrojs/vercel` 11.0.8 only for on-demand rendering or Vercel services: `imageService: true` (works in static), `isr`, `edgeMiddleware`, `webAnalytics`, `skewProtection`. https://docs.astro.build/en/guides/deploy/vercel/ , https://docs.astro.build/en/guides/integrations-guide/vercel/ . Vercel matrix: Astro gets Image Optimization, ISR, Routing Middleware; native OG generation N/A. https://vercel.com/docs/frameworks
- Blog: content collections (`glob` loader, zod schema, `getCollection`/`render`), md + mdx in one collection; `@astrojs/mdx` 7.0.8. https://docs.astro.build/en/guides/content-collections/ , https://docs.astro.build/en/guides/integrations-guide/mdx/
- View Transitions: `<ClientRouter />` (6.8 KB gz measured from the 7.2.6 tarball, `fallback` animate|swap|none) or native `@view-transition` with "no additional JavaScript"; docs say ClientRouter "will increasingly become unnecessary". https://docs.astro.build/en/guides/view-transitions/
- Images: `astro:assets` `<Image>`/`<Picture>`, sharp, build-time, responsive `layout`. https://docs.astro.build/en/guides/images/
- OG: `astro-og-canvas` 0.13.0 (build-time PNG per entry, astro ^5||^6||^7) or satori + `@resvg/resvg-js` in `src/pages/og/[slug].png.ts`. https://github.com/delucis/astro-og-canvas , https://blog.otterlord.dev/posts/dynamic-opengraph/
- Scene: `<script>` = bundled module, TS, deduped per page, npm imports OK. https://docs.astro.build/en/guides/client-side-scripts/ . Islands: `client:visible` (has `rootMargin`), `client:only="react"` skips SSR; `astro-r3f-starter` proves R3F works this way (18 stars, 2025-10). https://docs.astro.build/en/reference/directives-reference/ , https://github.com/ianyimi/astro-r3f-starter
- ClientRouter friction: bundled scripts "are only ever executed once"; init on `astro:page-load`, teardown on `astro:before-swap`. GSAP forum fix: drop ClientRouter. https://docs.astro.build/en/guides/view-transitions/ , https://gsap.com/community/forums/topic/40950-compatibility-with-gsap-scrolltrigger-astro-view-transitiosn-api/
- Codrops 2026-02 three + GSAP + Astro + Barba: Astro is "purely a build tool"; kill ScrollTriggers, dispose three on route change. https://tympanus.net/codrops/2026/02/02/building-a-scroll-revealed-webgl-gallery-with-gsap-three-js-astro-and-barba-js/
- Caveat: Vercel's own Astro page still shows legacy `@astrojs/vercel/static` + `output: 'hybrid'`; trust docs.astro.build.

### SvelteKit 2 + Svelte 5
- kit 2.70.3 (2026-08-18), svelte 5.56.10; kit 3.0.0-next.25 in prerelease. New `sv create` puts adapter in `vite.config.ts`. https://github.com/sveltejs/kit/releases
- Svelte 5 up to 50% smaller than 4 as apps grow. https://khromov.se/svelte-5-brings-up-to-50-bundle-size-decrease-for-existing-svelte-4-apps/
- Vercel: `adapter-static` (`prerender = true` in root layout, `strict` fails build if a page isn't prerendered) or `adapter-vercel` (node/edge, per-route `isr`, `images` maps to Vercel Image Optimization). https://svelte.dev/docs/kit/adapter-static , https://svelte.dev/docs/kit/adapter-vercel
- Blog: mdsvex 0.12.8 (2026-07-19) adds `layoutPropForwarding` for runes-mode layouts; runes layout bug #738 closed. Index via `import.meta.glob`. https://github.com/pngwn/MDsveX/blob/main/packages/mdsvex/CHANGELOG.md , https://github.com/pngwn/MDsveX/issues/738
- View Transitions: `onNavigate` + `document.startViewTransition` (documented pattern, raw API). https://svelte.dev/blog/view-transitions
- Images: `@sveltejs/enhanced-img` 0.11.0, build-time avif/webp, local files only. https://svelte.dev/docs/kit/images
- OG: no convention; `+server.ts` with `@vercel/og` 1.0.2 or satori. https://vercel.com/docs/og-image-generation
- Scene: Threlte `@threlte/core` 8.5.16 / `extras` 9.21.0 (svelte >=5, three >=0.160; 3.3k stars, push 2026-07-30). `$effect` runs browser-only after mount and returns teardown (GSAP `ctx.revert()`); `browser` from `$app/environment`. https://threlte.xyz/docs/reference/core/canvas , https://svelte.dev/docs/svelte/$effect
- Built-ins: `transition:` (fade, fly, draw, crossfade), `svelte/motion` `Tween`/`Spring`. https://svelte.dev/docs/svelte/transition , https://svelte.dev/docs/svelte/svelte-motion
- Pain: Threlte has no SSR page; no official Lenis Svelte binding; mdsvex runes support is weeks old.

### Vite + vanilla TS
- Vite 8.0 (2026-03-12) Rolldown-only, Node 20.19+/22.12+. https://vite.dev/blog/announcing-vite8
- Vercel: auto-detected, `dist`; SPA deep links need a rewrite; MPA mode for static; no SSR without Nitro. https://vercel.com/docs/frameworks/frontend/vite
- Blog: nothing. `vite-plugin-markdown` 2.2.0 (last publish 2024-11) or marked/markdown-it prebuild. Images: `vite-imagetools` 12. OG: hand-rolled satori script. https://www.npmjs.com/package/vite-plugin-markdown , https://github.com/JonasKruckenberg/imagetools
- Scene: zero interference, zero help. This is the Codrops and bruno-simon.com model.

### Nuxt 4
- 4.5.2 (2026-08-05); 4.0 on 2025-07-15 (`app/` dir). https://nuxt.com/blog/v4 , https://github.com/nuxt/nuxt/releases
- Vercel: `nuxt build` (SSR + ISR) or `nuxt generate` (static); Nitro presets `vercel`, `vercel-static`; `routeRules` `{ prerender: true }` / `{ isr: 60 }`. https://vercel.com/docs/frameworks/full-stack/nuxt , https://github.com/nitrojs/nitro/blob/main/src/presets/vercel/preset.ts
- Blog: `@nuxt/content` 3.15.2, SQL-backed collections, zod schema, MDC syntax. Static hosting "will load the database in the browser using WASM SQLite" for client-side queries. https://content.nuxt.com/docs/getting-started , https://content.nuxt.com/docs/deploy/static
- View Transitions: `experimental.viewTransition: true | 'always'`, respects reduced motion. https://nuxt.com/docs/4.x/getting-started/transitions
- Images: `@nuxt/image` 2.1.0, ipx default, Vercel provider auto-detected (needs `domains`, `screens`). https://image.nuxt.com/providers/vercel
- OG: `nuxt-og-image` 6.7.8, Takumi (default) / Satori / Browser renderers, Vue component templates, build-time OK. https://nuxtseo.com/docs/og-image/getting-started/introduction
- Scene: `@tresjs/nuxt` 5.6.3 makes TresCanvas client-only with no `<ClientOnly>` needed; `@tresjs/core` 5.8.3 is 35.2 KB gz. https://github.com/Tresjs/tres/blob/main/packages/nuxt/README.md , https://bundlephobia.com/package/@tresjs/core
- Pain: no official GSAP Vue hook (`onMounted` + `gsap.context` + `onBeforeUnmount`); `@vueuse/motion` 3.0.3 last release 2025-03; `motion-v` 2.4.0 is the maintained Vue option (62.6 KB gz). https://motion.dev/docs/vue

### Next.js 16 App Router
- 16.3.2 (2026-08-21); App Router vendors React canary (`19.3.0-canary-…` in chunks). https://nextjs.org/blog/next-16-3
- Vercel default: static prerender + Functions + ISR + on-demand images + PPR. https://vercel.com/docs/frameworks/full-stack/nextjs
- `output: 'export'` loses: dynamic routes without `generateStaticParams`, cookies/headers, rewrites/redirects, Proxy/middleware, ISR, `next/image` default loader, Server Actions, Draft Mode. https://nextjs.org/docs/app/guides/static-exports
- Blog: `@next/mdx` (requires `mdx-components.tsx`; Turbopack only takes remark/rehype plugins by string name; no frontmatter by default). Contentlayer dead (0.3.4, 2023-06, peer next ^13). `next-mdx-remote` 6.0.0 repo archived 2026-04-09. Live option: `@content-collections/core` 0.15.2 (2026-06-16). https://nextjs.org/docs/app/guides/mdx , https://github.com/contentlayerdev/contentlayer/issues/674 , https://github.com/hashicorp/next-mdx-remote/releases/tag/v6.0.0 , https://github.com/sdorra/content-collections
- View Transitions: React `<ViewTransition>` is canary-only, but Next 16.3 ships canary so it works "with no configuration"; `<Link transitionTypes>`. https://react.dev/reference/react/ViewTransition , https://nextjs.org/docs/app/guides/view-transitions
- Images: `next/image` on Vercel; Hobby = 5K transformations, 300K cache reads, 100K writes per month, 402 over limit. https://vercel.com/docs/image-optimization/limits-and-pricing
- OG: `opengraph-image.tsx` + `ImageResponse`, static at build unless request-time APIs. https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
- Scene: `@gsap/react` 2.1.2 `useGSAP` (0.55 KB, auto-revert, fixes StrictMode double effects, needs `"use client"`). R3F 9.7.0 (51.8 KB gz, React 19), drei 10.7.8. `dynamic(..., { ssr: false })` only inside Client Components. `lenis/react`. https://gsap.com/resources/React/ , https://r3f.docs.pmnd.rs/getting-started/installation , https://nextjs.org/docs/app/guides/lazy-loading
- Pain: StrictMode setup/cleanup/setup in dev; persistent-canvas template `react-three-next` pinned to Next 14 / R3F 8, last push 2024-06. https://react.dev/reference/react/StrictMode , https://github.com/pmndrs/react-three-next

### Eleventy 3
- 3.1.6 (2026-06-02), 4.0 alpha. Vercel auto-detects, output `_site`, pure static. https://github.com/11ty/eleventy/releases , https://vercel.com/kb/guide/deploying-eleventy-with-vercel
- Blog: markdown-it + collections; MDX only via `@mdx-js/mdx` rendered through React. Images: `@11ty/eleventy-img` 7 (Node 22+). OG: `eleventy-plugin-og-image` (satori + sharp, build-time). https://www.11ty.dev/docs/languages/mdx/ , https://www.11ty.dev/docs/plugins/image/ , https://github.com/KiwiKilian/eleventy-plugin-og-image
- Scene and transitions: plain script and native `@view-transition`, same as Vite.

## Animation and 3D library sizes (min+gz)

- gsap 3.15.0 core 27.4 KB (bp); tarball: core 28.3, ScrollTrigger 18.0, MorphSVG 9.6, DrawSVG 2.2, ScrollSmoother 5.5. core+ST 46.2; core+ST+Morph+Draw 57.0 (local). Free incl. all plugins since 3.13; license bars only no-code animation builders. https://bundlephobia.com/package/gsap , https://gsap.com/blog/3-13/ , https://gsap.com/standard-license/
- three 0.185.1: 182.4 KB full (bp); minimal scene 132.5 KB (local). https://bundlephobia.com/package/three
- @react-three/fiber 9.7.0: 51.8 KB; drei 10.7.8: 500 KB barrel, tree-shakes. https://bundlephobia.com/package/@react-three/drei
- @threlte/core 8.5.16, extras 9.21.0: no gz figure obtainable (bp rate-limited). https://www.npmjs.com/package/@threlte/core
- @tresjs/core 5.8.3: 35.2 KB; cientos barrel ~217 KB (local).
- lenis 1.3.26: 5.5 KB, react/vue/nuxt bindings, none for Svelte. https://bundlephobia.com/package/lenis
- motion 13.1.1: 45.3 KB full; vanilla `animate` 18 KB, `motion/mini` 2.3 KB (docs) / 3.5 KB (local); `scroll()` 7.0 KB local, uses native ScrollTimeline when present. https://motion.dev/docs/animate , https://motion.dev/docs/scroll
- scrollama 3.2.0: 2.1 KB, IO only, sticky graphic + steps pattern, 6.0k stars, last push 2025-11. https://github.com/russellsamora/scrollama
- CSS scroll-driven: Chrome/Edge 115+, Safari 26+, Firefox preview only (listed 157), 85.43% global; polyfill 16.8 KB, dormant since 2024-08. https://caniuse.com/mdn-css_properties_animation-timeline_scroll , https://github.com/flackr/scroll-timeline
- Rive: canvas 49.4 KB + 742 KB wasm; canvas-lite 42.0 KB + 311 KB wasm; scroll drives a state-machine Number input; free tier has all runtimes. https://rive.app/docs/runtimes/web/canvas-vs-webgl , https://rive.app/docs/runtimes/web/inputs , https://rive.app/pricing
- Lottie: lottie-web 76.8 KB (light 48.9); dotlottie-web 30.2 KB + 490 KB wasm. Spline runtime 270 KB + lazy chunks, free tier watermarks. flubber 18.1 KB, unmaintained since 2022. https://bundlephobia.com/package/lottie-web , https://bundlephobia.com/package/@splinetool/runtime , https://github.com/veltman/flubber
- Least JS for the sticky-stage pattern: CSS-only 0 KB > sticky + IO/scrollama 0 to 2 KB > motion `scroll()` 7 KB > GSAP ScrollTrigger 46 KB. GSAP is the only one that also does scrubbed morphs and works in every browser.

## What the well-known portfolios run (view-source via curl, 2026-08-25)

- bruno-simon.com: vanilla Vite, three r183 (WebGPU/TSL), Rapier, GSAP. Public repo, 1.8k stars, push 2026-04. https://github.com/brunosimon/folio-2025
- lusion.co: Astro (`/_astro/hoisted.*.js`), three r158 + postprocessing. Awwwards SOTY 2023. https://www.awwwards.com/lusion/
- igloo.inc: Svelte + Vite, three + three-mesh-bvh + GSAP. SOTY + Developer SOTY 2024. https://www.awwwards.com/igloo-inc-case-study.html
- jesperlandberg.com: Nuxt 3, three + GSAP + ScrollTrigger + hamo.
- landonorris.com (OFF+BRAND): Webflow + 1.46 MB bundle with Rive, GSAP, OGL, Lenis. SOTY 2025. https://www.awwwards.com/sites/lando-norris
- rauno.me: Next.js Pages Router + Framer Motion. emilkowal.ski: Next.js App Router + Framer Motion + Radix. paco.me: Next.js Pages + Framer Motion + cmdk. linusrogge.com: Next.js App Router + Framer Motion + Contentlayer.
- joshwcomeau.com: Next.js 15 App Router, React 19, MDX via next-mdx-remote, Linaria, Framer Motion + React Spring (his own post). https://www.joshwcomeau.com/blog/how-i-built-my-blog-v2/
- dennissnellenberg.com: static HTML + jQuery + GSAP 3.9 + Barba + Locomotive (2022 build). https://www.awwwards.com/sites/dennis-snellenberg
- cassie.codes: now a static farewell page with esm.sh three + GSAP; 2022 archive was static HTML + cdnjs GSAP; Eleventy not verifiable from source. Newest repo `cassieevans/astro-gsap` (2026-05-23).
- Codrops 2025 to 2026 repos: plain `index.html` + local `gsap.min.js` (+ ScrollTrigger, ScrollSmoother, Lenis); one Parcel repo; no framework. Their Feb 2026 three tutorial uses Astro.
- Pattern: writing/design-engineer portfolios = Next.js + Framer Motion; WebGL showpieces = three + GSAP with whatever framework is light (Vite, Svelte, Astro, Nuxt, Webflow). three + GSAP is the constant, the framework is not.
- Top OSS 3D/scroll portfolios: HamishMW/portfolio 3.5k (Remix + three, 2024-11); adrianhajdin/3d-portfolio 633 (React + three); davidhckh/portfolio-2025 845 (Vue + Vite + three + GSAP + Lenis, 2026-08); Musab-Hassan/musabhassan.com 219 (SvelteKit 2 + Svelte 5 + three 0.185, 2026-07); ITomPoland/portfolio-itom 314 (React 19 + R3F 9 + GSAP, 2026-07).

## GitHub ecosystem, `gh search repos --sort stars` (2026-08-25)

- "scrollytelling": scrollama 5998 (vanilla) ; codehike 5375 (Markdown + React) ; basementstudio/scrollytelling 1633 (React + GSAP, last push 2024-02) ; vue-scrollama 475 ; react-scrollama 405 ; svelte-scroller 369 (last push 2023-12).
- "scrollytelling portfolio": 6 repos, max 9 stars; 4 of 6 are Next.js + Framer Motion.
- Per framework: "scrollytelling astro" 1 repo (0 stars); nextjs 0; sveltekit 1; nuxt 0; vue 0; eleventy 0; vite 1; react 4 (0 stars); gsap 4 (max 3).
- "3d portfolio": adrianhajdin 633, codebucks27 Next.js 396, akashrmalhotra 381, sanidhyy 294; all React/Next tutorials.
- "astro gsap": Webflow-Examples/astro-gsap 17 (2026-08), cassieevans/astro-gsap (2026-05), 4 more. "astro three.js": 6 repos, 5 pushed 2026. "sveltekit gsap": 6 repos, max 2 stars. "portfolio threlte": 1. "portfolio tresjs": 0. "react-three-fiber portfolio": 6, max 1 star.
- Read: no framework owns a starred scrollytelling-portfolio template. Star mass is in framework-agnostic libs (scrollama, GSAP, Lenis, three) and React 3D tutorials; framework-specific scroll libs are stale or small. Ecosystem is not a differentiator; the libs are portable.

## Why Astro over the rest, in one line each

- vs SvelteKit: 0 vs 25 KB br baseline; content collections + `astro:assets` + build-time OG are turnkey vs mdsvex + endpoint; scene code is identical vanilla GSAP either way.
- vs Vite vanilla: same scene model, plus the whole blog stack for free.
- vs Nuxt: 46 KB baseline and WASM SQLite on static; TresJS convenience only matters if you go 3D-in-components.
- vs Next.js: 114 KB baseline on a "95% static text" site, and static export forfeits `next/image`; its advantages (useGSAP, R3F, OG convention) are all replaceable with 0.5 KB, vanilla three, and astro-og-canvas.
- vs 11ty: same 0 KB, but islands, MDX, images, and Vercel services are better in Astro.
- The repo is already Astro 7.2 static with 0 external JS; switching costs real days and buys nothing measurable for this brief.

## Caveats

- Local KB numbers are one machine, one day, hello-page builds; treat as ±10%.
- Threlte gz size could not be measured (bundlephobia rate-limited, esbuild cannot compile .svelte).
- Redesign dates for rauno.me, emilkowal.ski, jesperlandberg.com unconfirmed (search budget exhausted).
- Awwwards exposes no framework-share counts; no citable "X% of winners use Y" stat exists.
- GitHub search API hit its secondary rate limit mid-run; results were re-run spaced and are complete for the listed queries.
