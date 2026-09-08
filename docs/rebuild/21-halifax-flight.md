# Webcube → flight → phone → Dalhousie

Superseded by [22-airborne-back-row.md](./22-airborne-back-row.md): no landing or campus photo; remain seated at the top/back after the phone transfer.

September 8, 2026. Continues the preferences and recovery notes in [20-delhi-webcube.md](./20-delhi-webcube.md). Local work only; no publication.

## Latest requested sequence

Open the Webcube room's door, board an aircraft, sit by the window, take a quick flight to Halifax. Dalhousie appears outside; raise a phone, frame and take a photograph, push into the phone, and arrive at a classroom studying computer science. This phone transition supersedes the earlier walk-off-the-airplane idea. No visible avatar or invented biographical details. Preserve the eventual return to the original Toronto studio.

The latest classroom direction is a **tiered university lecture theatre**, not a flat school classroom. Three seating platforms rise 0.36 / 0.72 / 1.08 m; the side aisle has six 0.18 m steps and a handrail. Six fixed writing benches and twelve textured chairs face the lower-front lecture board. Arrive on the upper landing, descend to study in the middle row, then leave through the raised rear door and down the return stairs. This is an authored lecture theatre, not a surveyed replica of a particular Dalhousie room.

## Research and asset decisions

- [Airplane Inside by Dixept](https://sketchfab.com/3d-models/airplane-inside-4fc41cb155cf4cf89cb41eac742227c2): CC Attribution, approximately 253k triangles. The official download API returned 401. The user offered to authenticate; requested that they download and attach the archive or supply its local path, not credentials. **No archive received yet.** Current cabin is authored geometry, not this downloaded model. Integrate and optimize the actual archive in Blender if supplied.
- BlenderKit's public search was checked for aircraft interiors and seats. The suitable commercial-aircraft entries returned `isFree: false`; no purchase or access-control workaround was attempted.
- [School Chair 01, Ethan Place / Poly Haven](https://polyhaven.com/a/SchoolChair_01): existing CC0 textured model, reused for twelve classroom seats. The already licensed aluminium laptop and mug are also reused. Sources remain in the asset manifest and `public/assets/stage/CREDITS.md`.
- [Dalhousie's Goldberg building reference](https://www.dal.ca/campus-maps/building-directory/studley-campus/goldberg-computer-science.html): Faculty of Computer Science at 6050 University Avenue, Halifax. Grey panels, blue glazing, glazed entrance; reference only, not a surveyed classroom replica.
- [Goldberg photograph by Ryan Sharpe / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Goldberg_Computer_Science_Building,_Dalhousie_University_%E2%80%93_Halifax,_NS_%E2%80%93_(2018-08-26).jpg), CC BY-SA 4.0: photographic background for the window and phone. `scripts/stage-campus.mjs` produces the resized WebP. Full credit/modifications/license are in `public/assets/scenes/DALHOUSIE-CREDITS.md`, linked from the scene-media credits and location hotspot. The cinematic aircraft-to-campus view is not an assertion about a real runway or nonstop itinerary.

## Structure

- `sets.ts`: set 5 is the cabin and L-shaped boarding corridor; set 6 is the classroom. Existing set IDs 0–4 are unchanged. The first room's live east-passage overlay is scoped to set 0; the new corridor covers the route back to its east door.
- `built.ts` / `materials.ts`: curved cabin crown, correctly wound oval apertures and reveals, overhead bins, upholstered seats with belts, trays and reading controls; desk/lecture-board/study-note surfaces. Licensed model placements stay in the manifest-based pipeline.
- `flight.ts`: pure scroll-driven takeoff/cruise/descent state, phone staging, shared window/classroom views. Reversing scroll is deterministic. Reduced motion disables the phone movement and flight elevation.
- `dolly.ts`: earlier camera keys rescaled by 2/3, preserving their actual scroll positions when moving from five sets to seven. The sole `portal` key splits the curves to prevent interpolation through intervening walls. Its location change happens only after the phone screen fills the viewport.
- `stage-phone.ts`: landscape camera-phone geometry, shutter/focus UI and two bounded render targets. Campus capture blends to the actual classroom render while fullscreen. Extra rendering happens only during the phone beat; targets and geometry dispose on unmount.
- `stage-run.ts`: owns live scenery transforms, scene visibility, fitted model displays and the phone render pass. Cabin geometry stays hidden from inside the theatre, preventing shared-wall window trim from leaking through; the boarding corridor returns to view beyond the rear exit. `Placement.screen` chooses coding content without hardcoding a chapter in the renderer. Export mode builds only the requested set, avoiding a dependency on earlier baked files being available. Phone capture copies the destination projection, including portrait cropping; resetting the main aspect before that crop avoids cumulative framing drift.
- `stage-paint.ts`: actual computer-science content (binary search and a search tree), notebook, laptop editor, location labels. The timeline's existing Halifax/ShiftKey biography is preserved.

## Timing and layout

| Beat | Stage q |
|---|---|
| Webcube exit / boarding corridor | 0.634–0.688 |
| Take window seat | 0.703–0.724 |
| Takeoff / cruise / landing | 0.724 / 0.741 / 0.777 |
| Phone rises / shutter | 0.778–0.793 / 0.797 |
| Push into phone / fully covered | 0.801–0.818 |
| Covered location transfer / classroom reveal | 0.822 / 0.830 |
| Descend lecture aisle / study desk / leave classroom | 0.844–0.936 |
| Return to Toronto | 0.985–1 |

Cabin: x −5.2…−1.6, z −10.2…−4.8. Classroom: x −1.6…4.8, z −10.2…−2. Boarding/return shaft: x −3.95…−2.75, z −4.8…1. The classroom's north door leads west into that shaft and back to Toronto's existing east door.

## Build and verification

Use `npm run stage:bake -- 5 128 2048 512 0` and `npm run stage:bake -- 6 128 2048 512 0`. These really run the installed Blender Cycles pipeline, not just a browser screenshot. The final `0` disables geometric decimation: the old 0.002 error visibly faceted the close-up oval windows and damaged thin chair/seat hardware. Meshopt and WebP compression remain enabled. Both outputs remain under the existing 5 MB per-file budget.

Run `npm test`, `npm run check`, `npm run build`, `git diff --check`. Added proof covers flight/reduced-motion/rewind state, the fullscreen-before-transfer invariant, oval-window and roof winding, notebook UVs, tier/aisle heights, furniture/landing alignment, and the seven-set route. Earlier view-composition regressions remain checked.

The ignored `.cache/halifax-audit.mjs` waits for the actual camera to reach each target before capture, so slow loading/GPU work cannot silently label an old view as the new one. Supports `W`, `H`, `REDUCE` and `URL`; normal URL is the baked page with debug inspection enabled. Review desktop, portrait, reverse scroll, the phone cover/reveal boundary and the original-room return.

The background Astro server may serve stale source or return 404 for newly generated public assets until restarted. Verify served source and asset status before exporting or reviewing. Restart only the exact port-4321 listener. The existing five type-check hints and large-bundle build warning are not caused by this addition.

Final checks: 76 tests pass; type check reports 0 errors / 0 warnings (5 existing hints); production build and whitespace check pass. Baked cabin: 1,426,276-byte GLB + 286,694-byte lightmap. Tiered theatre: 1,745,192-byte GLB + 359,214-byte lightmap. The closed front door is a runtime leaf; only the raised rear exit is traversed.

Local browser evidence: `.cache/halifax-complete-desktop` (phone, theatre, study desk, rear stairs, original Toronto room), `.cache/halifax-complete-mobile` (portrait capture/reveal and reverse scrolling), `.cache/halifax-complete-reduced` (direct theatre and return). These checks report no page errors, console errors or unexpected warnings. Earlier theatre captures also verify the middle-row eye level and stepped aisle. Research, sources and pending cabin-model authentication remain documented above.
