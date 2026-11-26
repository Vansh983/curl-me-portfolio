# Journey loading and deployment (2026-09-22)

## Decision

Keep the existing static Astro deployment. Three.js renders on the visitor's GPU, not on an Express server. Vercel serves the HTML, JavaScript and models through its CDN; the existing routing middleware only handles browser-versus-terminal responses. Moving hosts does not remove geometry generation, texture uploads or shader compilation in the browser.

Build with `npm ci && npm run build`; publish `dist`. Vercel remains the simplest deployment because `vercel.json` and the curl middleware already exist. No deployment or push was performed in this optimization pass. A Cloudflare static deployment is an alternative, but would need an equivalent terminal-response rule; `public/_headers` only supplies caching rules, not that middleware.

## Implemented

- The opening is a 42 KB WebP taken from the actual scene. Text stays scrollable while all thirteen sets prepare. The canvas appears only after preparation. Visitors can skip 3D; failed loads offer retry without hiding the story.
- Two sets load concurrently. Procedural props build in a module worker, with transferable geometry buffers and one result per prop variant. Meshopt decoding also uses workers. Main-thread attachment yields between work slices.
- Identical painted textures and procedural geometry are shared. Hidden characters no longer advance their animation mixers.
- Artwork, surface maps, coffee, the held laptop, degree and crowd frames prepare before entry. Optional environment panoramas are explicitly declared: eleven unnecessary 404s are gone.
- Every room warms shaders and uploads textures in small batches, including off-camera objects. Shadow and postprocessing variants and the phone render target warm before the canvas is revealed.
- The phone tier uses 1024-pixel room lightmaps instead of 2048. This reduces resident image memory, not download size; desktop lighting resolution is unchanged.
- Production models, video and image URLs contain a content hash. Those URLs get a year of immutable caching on Vercel, with equivalent static `_headers` rules for Cloudflare. A changed asset gets a new URL. Original assets remain available for the bake/export tools.
- Compatible dependency updates within the existing version ranges remove the advisories reported by `npm audit` during this pass.

The camera path, authored geometry, models, text and desktop artwork are preserved.

## Verification

Run the production build, not the development server, for measurements:

```sh
npm test
npm run check
npm run build
npm run preview -- --host 127.0.0.1 --port 4322
```

In another terminal, with a local Chrome/Chromium installed (or `CHROME_BIN` set):

```sh
npm run stage:audit -- http://127.0.0.1:4322/
npm run stage:audit -- http://127.0.0.1:4322/ --mobile
npm run stage:audit -- http://127.0.0.1:4322/ --mobile --reduced --light
npm run stage:audit -- http://127.0.0.1:4322/ --fallbacks
```

Reports and screenshots go to `.cache/optimization` (override with `AUDIT_OUT`). The audit checks HTTP, JavaScript and GPU errors, lost context and downloads started during the walk. It records main-thread long tasks, but does not treat those as a reliable frame-rate measurement. Camera samples include the phone, coffee, graduation and final return, with waits for the camera to settle. Recovery cases cover skip, a missing model plus successful retry, and unavailable WebGL.

Measured on local desktop Chrome, with cold browser contexts and assets served on localhost:

| Observation | Before | After |
| --- | --- | --- |
| Late asset requests in sampled walk | Coffee model | None |
| Main-thread long tasks during sampled walk | 10, largest 724 ms | None in verified desktop/mobile runs |
| Largest preparation task in representative run | 1,706 ms | 245 ms desktop / 243 ms phone tier |
| Texture objects / unique image sources | 709 / 505 | 677 / 473 |
| Approximate uncompressed image footprint, including mip estimate | 881 MB | 812 MB desktop / 611 MB phone tier |
| Ready time | No reliable readiness signal | About 6–7 seconds locally |

The memory estimate is calculated from unique image-source dimensions. It is **not measured GPU allocation** and excludes buffers, render targets and browser overhead. Mobile here means an emulated phone viewport and the phone rendering tier on the same desktop GPU, not a physical phone. Before/after task samples are illustrative, not statistical benchmarks; the final audit exercises more transition positions than the initial baseline.

## Limits and next work

- The first visit still fetches roughly 32 MB of scene assets, plus JavaScript/fonts. Background loading moves this work before the visible walk; it cannot remove network or GPU latency. A 20 Mbps connection needs roughly 13 seconds for those assets alone, before overhead. Repeated visits benefit from immutable caching.
- The main renderer chunk is approximately 489 KB gzipped; the geometry worker is approximately 279 KB gzipped. Worker isolation reduces main-thread work, not total JavaScript transfer. The build's large-chunk warning remains visible rather than being suppressed.
- Real iOS/Android GPU-memory and thermal tests are still needed. Desktop emulation cannot prove stable frame rates on those devices.
- The next meaningful payload/memory reduction is an independently verified compressed-texture and geometry-budget pass (for example KTX2 and removal of redundant baked textures), with visual comparisons. Do not claim that choosing a CDN alone solves this.
- Validate cache headers on the actual hosting provider after a separately authorized deployment. `astro preview` does not emulate Vercel routing or cache headers.
