# SEO & Blog Architecture

Goal: "Vansh Sood" googles find this site; frequent day-to-day posts; existing blog repo merges in. Assumes Astro on Vercel (the recommended stack).

## Reality check from inspecting the top dev blogs live

overreacted.io, antfu.me, joshwcomeau.com ship **no structured data, no sitemap (overreacted's 404s), no canonicals** — they rank on backlinks + name authority. leerob.com is the only one doing entity SEO deliberately (Person JSON-LD with sameAs on every page — the model to copy). Doing schema + sitemap + canonicals puts vanshsood.com ahead of this cohort's technical baseline. For an uncommon name, ranking is mostly "exist + a handful of profile backlinks": top 10 in 2–3 months is realistic.

## 1. Name SEO

- Homepage `<title>`: `Vansh Sood — <role>` (name first). H1 must be exactly "Vansh Sood" and match the title (reduces Google title rewrites). Name again in the first body paragraph.
- Person JSON-LD on **every page**, stable `@id` so articles can reference it:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://vanshsood.com/#person",
  "name": "Vansh Sood",
  "url": "https://vanshsood.com",
  "jobTitle": "…",
  "worksFor": { "@type": "Organization", "name": "Floqer", "url": "https://floqer.com" },
  "sameAs": [
    "https://github.com/Vansh983",
    "https://www.linkedin.com/in/vanshsood/",
    "https://x.com/…"
  ]
}
</script>
```

- `/about`: **ProfilePage** schema (`mainEntity` = the Person node) — official Google type, feeds E-E-A-T. Homepage also gets **WebSite** schema (`name: "Vansh Sood"`) so SERPs show the site name.
- Knowledge panel: identical name/title/company across LinkedIn, GitHub, X + **bidirectional links** (profiles link back to vanshsood.com). Panels trigger ~90–180 days after ~3 high-authority citations. It's "digital consensus", not a hack.

## 2. Blog technical SEO

- **BlogPosting** JSON-LD per post: `headline`, `image`, `datePublished`, `dateModified` (truthful, wired to frontmatter), `author` → Person `@id`, `mainEntityOfPage`.
- **Canonicals**: self-referencing on every page via `new URL(Astro.url.pathname, Astro.site)`. Pick apex `vanshsood.com`, 308 the www in Vercel. Pick ONE trailing-slash policy (`trailingSlash: 'never'` + `build.format: 'file'`) — Vercel serves both variants otherwise.
- **URLs**: `/blog/slug` — short 3–5 word slugs, **no dates** (overreacted and leerob use root `/slug`; root also fine but collides with future top-level pages). 301 any previously-public URLs from the old blog repo.
- **OG/Twitter** per page: `og:image` 1200×630, `twitter:card: summary_large_image`, `article:published_time` on posts. One shared `<BaseHead>` component.
- **OG images at build time**: `satori` + `satori-html` + `@resvg/resvg-js` in a static endpoint `src/pages/og/[...slug].png.ts` with `getStaticPaths` over the collection. (`@vercel/og` itself is for Next/edge — use satori directly in static Astro.) Turnkey alt: `astro-og-canvas`.
- **Pagination**: `rel=prev/next` is dead (Google, 2019). Each page self-canonical (NOT to page 1), real `<a>` page links.
- **Tag pages**: noindex (or skip at launch). Single-use tags = thin content. Exclude via sitemap `filter` + `<meta name="robots" content="noindex, follow">`; index a tag only once it has ~5+ posts.
- **Sitemap + RSS**: `@astrojs/sitemap` (silently generates NOTHING if `site` unset — set it), `robots.txt` with `Sitemap:` line, `@astrojs/rss` with full-content items + `<link rel="alternate" type="application/rss+xml">`.

## 3. Astro setup

```ts
// src/content.config.ts (Astro 5 content layer)
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});
export const collections = { blog };
```

```js
// astro.config.mjs
export default defineConfig({
  site: 'https://vanshsood.com',
  trailingSlash: 'never',
  integrations: [sitemap({ filter: p => !p.includes('/tags/') })],
});
```

- Zod validates frontmatter at build — exactly what protects against heterogeneous posts when the external repo merges in.
- **View transitions**: use browser-native `@view-transition { navigation: auto; }` (zero JS, zero SEO implications) rather than `<ClientRouter />` (reintroduces JS; inline scripts don't re-run on soft nav).

### Importing the external blog repo — 3 options

1. **Copy the files in (RECOMMENDED)**: one-time move into `src/content/blog/`, normalize frontmatter to the zod schema. Single repo, simplest CI. Right call for a permanent merge.
2. Git submodule at `src/content/blog`: works with `glob()`; Vercel auto-clones public HTTPS submodules. Ongoing friction (two commits per post, stale pointers). Only if posts must keep living in the other repo.
3. Astro 5 custom content loader fetching from GitHub at build: adds network dependency to every build. Overkill.

Note: `blog.vanshsood.com` already exists (old nav links to it) — decide whether it 301s into `vanshsood.com/blog` (recommended for consolidating name authority) or stays a subdomain.

## 4. Launch checklist (ordered by impact)

1. `site` in astro.config; apex vs www 308; one trailing-slash policy.
2. Homepage title/H1/first-paragraph name match + meta description.
3. Person JSON-LD + full sameAs everywhere; make GitHub/LinkedIn/X bios link back.
4. Migrate blog repo into `src/content/blog/` (copy), zod schema, `/blog/slug`, 301s.
5. Shared `<BaseHead>`: unique titles (`Post — Vansh Sood`), descriptions, canonicals, OG/Twitter.
6. Sitemap + robots.txt + RSS.
7. **Google Search Console**: verify domain, submit sitemap, request indexing of homepage/about — the single biggest lever for fast name ranking. Bing Webmaster too.
8. BlogPosting JSON-LD on posts.
9. Satori OG image endpoint.
10. /about with ProfilePage schema; WebSite schema on homepage.
11. Noindexed tag pages; paginated index with self-canonicals.
12. Post-launch: 3–5 profile/directory backlinks (dev.to / Hashnode crossposts with canonical-back, conference bios). Name ranking in weeks; knowledge-panel eligibility 3–6 months.
