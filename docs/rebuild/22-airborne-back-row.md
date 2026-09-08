# Airborne Dalhousie → phone → top-row seat

2026-09-08. Supersedes the landing/photo/aisle-walk sequence in [21-halifax-flight.md](./21-halifax-flight.md).

## Requested sequence

After Webcube, enter the aircraft and look through the window while already airborne. See a dimensional Dalhousie campus outside. Raise a phone whose screen already contains the classroom, zoom through that screen, and remain seated at the very back/top of the lecture theatre. No landing, shutter, campus photo on the handset, walk down the aisle, or subsequent return walk. The original Toronto hero and earlier rooms are unchanged.

## Changes

- `flight.ts`: constant 55 m cinematic altitude and deterministic lateral travel; reduced motion holds travel still without putting the aircraft on the ground. Shared destination is `[1.25, 2.36, -3.55]`: eye 1.28 m above the highest 1.08 m tier. Camera position and direction hold from the covered transfer to the end.
- `sets.ts`: study props move to the top-row bench, at desk height 1.82 m. Flight uses an actual `dalhousie_campus` GLB and textured trees. The runway, opaque sphere clouds and photographic campus wall are no longer used.
- `stage-phone.ts`: rigid, portrait-proportioned extruded handset with rounded glass, metal edge, volume/power buttons, speaker and lens. One classroom render target, no photograph capture or crossfade. During the zoom the screen crop resolves to the viewport so the full-cover transfer matches the actual back-row render on desktop and portrait screens.
- `built.ts`: the wing now has its previously missing upper surface and sits behind the viewing seat so it does not mask the campus. The distant photographic sky is positioned to put cloud detail above the ground haze, rather than the panorama's stretched lower fill.
- `stage-run.ts`: sky reflections come from that panorama; the flight shadow camera covers the campus instead of the cabin-sized area. The phone captures only the destination, including its portrait projection. Existing set loading, model manifest, Blender bakes and lifecycle remain the owning pipeline.

## Research / Blender

[Dalhousie's Goldberg reference](https://www.dal.ca/campus-maps/building-directory/studley-campus/goldberg-computer-science.html) supplies architectural cues: grey-panel envelope, blue glazing and glazed entrance. `scripts/stage-flight-campus.py` builds physical panel seams, recessed glazing, entrance hardware, extruded lettering, roof parapets/plant, streets and neighbouring massing in Blender. It saves `.cache/flight/campus.blend` and exports the GLB, then the standard glTF tooling optimizes it. This is an authored interpretation, not a surveyed or photogrammetric replica; distant blocks are contextual, not claimed as exact Halifax buildings.

[Kloofendal 48d Partly Cloudy (Pure Sky)](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky), Greg Zaal / Jarod Guest, CC0, supplies photographed clouds and sky reflections. It is a sky panorama, not volumetric clouds. See [flight asset credits](../../public/assets/stage/FLIGHT-CREDITS.md). The older Ryan Sharpe photograph remains credited as a historical asset, but is not loaded or used in this sequence.

Rebuild assets: `node scripts/stage-flight-assets.mjs`. Rebuild cabin/classroom light: `npm run stage:bake -- 5 128 2048 512 0` and the same for set 6. No account, paid asset, or credential is needed for these replacements. The researched Dixept cabin archive from the earlier turn has still not been supplied; the cabin remains authored geometry.

## Verification

Regression proof covers constant altitude, no rejected scenery placements, fixed top-row pose through the end, matching study-prop elevation, wing surface winding, and full phone coverage/destination UV mapping across portrait and desktop aspects. Earlier room composition and bounded camera-motion tests remain in place.

The first export attempt failed because running Astro check concurrently invalidated the dev server's lazy GLTF-exporter dependency (`504 Outdated Optimize Dep`). Restarting the exact local server fixes it. Run check/build after exports, then refresh the server before final browser checks.

Final gates: 79 tests pass; type check has no errors or warnings (five existing hints); production build and whitespace check pass. Campus model is 379,992 bytes; photographed sky is 270,242 bytes. Cabin bake is 1,422,776 bytes plus a 277,328-byte lightmap; theatre bake is 1,740,364 bytes plus a 359,818-byte lightmap. Existing per-file/model budgets remain satisfied.

Browser evidence is in ignored `.cache/airborne-complete-desktop`, `.cache/airborne-complete-mobile`, and `.cache/airborne-complete-reduced`. Earlier `.cache/airborne-final-mobile` also checks backward scroll across the phone transfer and holds the same classroom camera at q=1. The former sphere clouds, landing and middle-row walk are not part of the requested sequence.
