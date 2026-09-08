# Delhi / Webcube room and session handoff

Date: 2026-09-08. Continues Claude session `ce132787-0f1f-4032-b000-8d5b18489947` on `canary`, starting from commit `466f0dd` and nine uncommitted stage files.

## Latest approved request

After Google San Francisco, return to Delhi during Covid: the small, messy bedroom where Vansh built Webcube with a team of 25 working across multiple countries. A large desk holds two monitors, one PC and two laptops. Above it are a shelf of books and a higher shelf of awards in different shapes and sizes. Include a single bed. The journey then returns to the Toronto studio; future rooms can be inserted before that return.

Vansh approved this addition on September 8. Claude implemented the room and tests but reached its session limit while inspecting the plaza approach. The Delhi bake was missing, and the changed plaza facade had not been re-baked.

## Current layout and implementation

The route is Toronto → 2010 Delhi bedroom → 2013 computer lab → San Francisco → 2020 Delhi / Webcube → Toronto. It turns through connected doors around a ring rather than placing every room in a straight row.

- `sets.ts`: Delhi is set 4, x −2.4…0.7, z 0…3.6, height 2.7 m. Entry is on the south wall at x −0.7; exit is west at z 1.6 into the existing passage back to Toronto.
- `built.ts` / `materials.ts`: wide laminate desk, bracketed shelves, varied awards, papers, cartons, clothes, cables, bin and drawn curtain. Existing licensed furniture models supply the chair, single bed, laptop, lamp and fan.
- `stage-paint.ts`: a Webcube project board on the second monitor. Captions use the supplied story and existing timeline; no invented client cities, award origins or sleeping habits.
- `dolly.ts`: five doorway transitions. Delhi is entered around q 0.798; desk views are q 0.838 and 0.866; return to Toronto is around q 0.962. The plaza approach brings the entrance into view and laptop framing keeps the awards visible.
- `stage-run.ts`: outdoor geometry is visible only while the plaza is active, preventing it from entering adjacent indoor views. The Toronto return door opens at q 0.915…0.95.
- `stage-bake.py`: the Webcube screen contributes light like the other monitors. Baked assets for sets 3 and 4 must match these placements.
- The plaza paving excludes the Delhi room and both connecting passages. Coplanar outdoor paving previously showed through the indoor wood floor at the entrance; a raycast regression test checks the indoor exclusions and outdoor walking surface.
- Delhi's exterior facade is separated from its interior shell by 1 cm. Overlapping wall faces previously made the back wall black before the environment switched; a raycast regression test covers the separation.

## Standing context recovered from the prior session

- Local work and local commits only. Do not push or publish without a new request.
- Vansh reviews the live page at `http://localhost:4321/`; screenshots are for implementation checks. Inspect actual browser renders before claiming visual fixes.
- The Toronto room is a hypothetical studio with a bed and prominent desk, not a full apartment tour. Preserve the short first-room path, high viewpoint, visible CN Tower tip and return to the same room.
- Toronto is the 51st floor. The nearby white CN Tower and thinned OSM skyline are intentional; prior purple/faraway/overcrowded versions were rejected.
- No human figure. The intended look uses real furniture, textured surfaces and baked bounced lighting. Earlier SVG/morphing/low-poly-only plans in docs 07–14 are historical.
- The separate Sketchfab loft is a saved future-room reference with no story placement yet. The loft and CN Tower scan downloads await a supplied model archive or authorized download access. They are not prerequisites for the Webcube room.
- Keep biography faithful to `src/data/timeline.ts` and explicit corrections. Story captions are not permission to invent personal facts.
- Current user instructions prohibit Firecrawl and MCP unless explicitly requested. Historical Claude tool choices do not override them.

## Verification and local tools

Run `npm test`, `npm run check`, `npm run build`. Camera tests cover continuity, doorway transitions, visibility of the Delhi entry, and awards staying in frame at 1440×900. Every baked GLB and lightmap must remain below 5 MB.

`npm run stage:bake -- 4 128 2048` builds Delhi; use set 3 for the revised plaza. Requires the dev server, installed Google Chrome, and Blender at `/Applications/Blender.app/Contents/MacOS/Blender`. The existing pipeline exports geometry, bakes Cycles lighting and compresses the assets. A stale Vite exporter dependency can produce `504 Outdated Optimize Dep`; restart the dev server before retrying.

During the Codex continuation, the background dev server also missed source and new-public-file updates. Compare the source served at `/src/lib/stage/built.ts` with disk before exporting a changed scene, and check newly generated asset URLs return 200. Restart the exact local server if stale; successful unit tests alone do not prove the browser/exporter has the new geometry.

The existing ignored `.cache/shoot.mjs` takes stage-progress q values and supports `URL`, `W`, `H`, `WAIT` and `STEP`. Its set count is now five. Review flags: `?live` builds geometry without baked assets; `?tier=1` forces desktop effects; `?cam=x,y,z,lx,ly,lz&set=4` pins the Delhi view. Check the normal baked page as well as `?live`.

Claude's local transcript and project memory remain under `/Users/vsood/.claude/projects/-Users-vsood-work-curl-me-portfolio/`. The transcript contains earlier compaction summaries and exact user approvals. Treat the newest user corrections as authoritative over older memory and specs.

## September 8 completion checks

Delhi was baked at 128 samples / 2048 px: 1,695,208-byte GLB and approximately 316 KB lightmap. The plaza was re-baked for its revised facade and paving. All assets remain within the 5 MB per-file limit.

The baked journey was inspected at 26 positions at 1440×900, with no browser console errors or warnings. Four additional 390×844 renders checked that the new room and return load on a narrow screen; the existing text overlay and portrait cropping remain. Final doorway captures check the paving correction. Audit images are under `.cache/delhi-final-tour/`, `.cache/delhi-final-mobile/` and `.cache/delhi-final-doorway/` (ignored).

Final gates: `npm test` (67 tests), `npm run check`, `npm run build`, and `git diff --check`. The pre-existing five type-check hints and large JavaScript chunk build warning are outside this room addition. The live server remains on port 4321; no push or publication.
