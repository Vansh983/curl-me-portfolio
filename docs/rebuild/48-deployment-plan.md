# Deployment plan (2026-10-13)

## Verdict

- Hosting is already right. Vercel project `curl-me-portfolio` (team `vansh983s-projects`) serves www.vanshsood.com from `main`, Node 22. Static Astro: every file sits on the CDN, no server renders anything. The only function is the Routing Middleware for `curl` on `/` and `/blog/:slug`.
- Deploy = merge `canary` into `main` (or set the project's production branch to `canary`). Vercel runs `npm run build`, publishes `dist`.
- The CDN is not the slowness. Two things are: 32 MB downloads before the 3D shows, and GPU texture memory on phones. Fix those in the code; the host needs almost nothing.

## A cold visit today

1. HTML 20 KB from the nearest edge. Middleware reads the user agent, browsers pass through.
2. JavaScript: stage chunk 1.6 MB (489 KB gzipped) + geometry worker (279 KB gzipped). Brotli is automatic on Vercel.
3. All 13 sets, two at a time (`loadInOrder`, concurrency 2): ~27 MB of `.glb` (meshopt + quantization + WebP textures inside) + ~4 MB of 2048 px lightmaps + other models. ~32 MB total.
4. Shader warm-up and texture uploads, then `ready = true` and the canvas appears (`stage-run.ts:2061`). On 20 Mbps that is ~13 s of download before any 3D. Repeat visits are instant: hashed URLs, one-year immutable cache.

## What moves the needle, in order

1. **Progressive reveal.** Done 2026-10-17, doc 49: the canvas after sets 0 to 3, the rest streamed, the camera held before the next door, doors shut until the room is in. Gate `ready` on set 0 (2.1 MB glb + 0.4 MB lightmap) plus the JS, not on all 13. Keep loading in scroll order; hold the camera only if scroll reaches a set not yet in. 13 s to ~1.5 s on 20 Mbps. One change in the ready gate, no asset work.
2. **Start the first fetches with the HTML.** Done 2026-10-17, doc 49. `<link rel="preload" as="fetch" crossorigin>` for set0's glb and lightmap, `<link rel="modulepreload">` for the stage chunk. Today the first model request waits for the 1.6 MB script to download and parse. `dist/index.html` has zero modulepreload hints now.
3. **KTX2 textures** (gltf-transform `uastc`/`etc1s`, three's `KTX2Loader`). Uncompressed image footprint is 812 MB desktop / 611 MB phone (doc 32). GPU-compressed textures cut that 4 to 6x, upload faster and stop phone stutter and heat. ETC1S also shrinks downloads. Visual before/after per set, it is lossy.
4. **Phone lightmaps as files.** Tier 0 downscales 2048 px maps after downloading them. Ship 1024 px copies and pick by tier: ~3 MB less on phones.
5. **Heaviest sets.** set12 4.5 MB, set6 4.2 MB, set10 2.7 MB, set2 2.4 MB. Simplify and cap textures to land under 3 MB each.
6. **Drop the unversioned `/assets` copy from `dist`.** The stage-delivery integration writes hashed copies (42 MB) next to the originals (48 MB). The runtime only asks for hashed URLs. Removing the originals halves the upload and keeps `dist` well under Vercel's 100 MB Hobby static-upload cap (94 MB today).

## Vercel settings

- Keep static output, no adapter. HTTP/2 and HTTP/3 are on by default.
- `vercel.json` headers stay: `/assets/versioned/*` and `/fonts/*` one year immutable; HTML `max-age=0, must-revalidate` (correct for a page that changes).
- `.glb` and `.webp` are already compressed; the CDN serves them as is. Nothing to gain from brotli there.
- **Plan.** Hobby: 100 GB Fast Data Transfer a month, hard cap, no commercial use. At 32 MB per cold visitor that is ~3,000 cold visits a month. A Product Hunt or Hacker News day can hit it. Options: Pro ($20 a month, 1 TB), or host `/assets` on Cloudflare R2 (free egress) behind a CORS header, with the asset URL base as the only code change. Decide before announcing.
- Node 22 on the project is fine for `astro build`. The 74 untracked reference photos live under `docs/`, not in `public/`, so they never ship.

## Verify after the first preview deploy

```sh
curl -sI https://<preview>/assets/versioned/<hash>/stage/baked/set0.glb | grep -i 'cache-control\|x-vercel-cache\|content-type'
curl -sI https://<preview>/ | grep -i 'cache-control\|x-vercel-cache'
curl -A curl https://<preview>/ | head -5
npm run stage:audit -- https://<preview>/ --mobile
```

Expect `immutable` and `x-vercel-cache: HIT` on the second request for the model, text back for the `curl` line, and a clean audit. Then a real phone over cellular, not emulation.

## Sources

- Vercel limits: https://vercel.com/docs/limits/overview
- Vercel pricing (Fast Data Transfer): https://vercel.com/pricing
- Cache-Control on Vercel: https://vercel.com/docs/caching/cache-control-headers
- Doc 32 in this folder for the loading work already done and its audit commands.
