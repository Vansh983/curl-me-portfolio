# 63. Drawn Halifax below the flight

Vansh: "some of the visuals to get a bit cleaner"; "that can be 2d cause we dont have to interact with it but it should look 3d". He rejected a photograph for the landing: "let's go with B but you trace it perfectly". B is a flat drawing of the real map, moving under separate clouds. Golden-hour light is the requester's interpretation of his earlier "just golden hour for halifax", not an assertion about the flight's actual time.

## The drawing

- `scripts/stage-halifax-map.mjs` uses the existing `stage-halifax.mjs` origin (44.63892, -63.58473), local metre conversion and heading (340°), read from `halifax.json`. `HALIFAX.campus`, the flight path, bank, altitude and timing are unchanged. The source's Goldberg footprint (way 373834324) is retained at its actual coordinates, distinguished by a quiet blue-grey roof fill.
- OpenStreetMap through the same Overpass mirrors, fetched 2026-11-15. The picture covers 44.57–44.76 N, 63.72–63.47 W. Coastline data extends beyond that box, to 44.54–44.79 N, 63.75–63.44 W, so shoreline chains can join before clipping. The peninsula, harbour, Northwest Arm, Bedford Basin, Dartmouth, Georges and McNabs islands, both bridges, piers and terminal outlines, streets, parks, water and building footprints use original coordinates. No simplification or invented shoreline. Road widths are map styling where OSM supplies no width; the small soft shadows do not assert building heights.
- 78,387 building areas, 33,305 road/path segments, mapped land cover and bridge polygons. Citadel Hill, North and Central Common, Point Pleasant, Public Gardens, both container terminals and Goldberg are checked by OSM ID before generation. The two sea seeds from the original Halifax generator guard against an inverted or incorrectly closed coastline. Unclosed area relations or a coast ending inside the extract abort generation.
- Two 4096×4096 WebP tiles cover the port-side 2048×4096 m strip at 0.5 m/px. The first 1 m/px preview was soft in the lowest window view, so only this visible near strip gets the extra resolution. A 3072×3281 surround covers the distant geography. `flight-map.ts` places the near tiles in a hole in the surround: coplanar, adjoining, no overlapping ground or polygon offset. Anisotropic mipmapped sampling keeps the low, oblique view clean. The compressed geometry snapshot, query, IDs, tags and timestamp ship as `halifax-map/source.json.gz` under ODbL; the manifest records its SHA-256. Regeneration works offline from that snapshot or the cached extract; `--fetch` refreshes OSM only.

## Runtime and scope

`sets.ts` replaces the flight's extruded Halifax, built campus and Goldberg model placements with the flat `halifaxMap`. Their source/builders/assets remain for other uses and history. The map is unlit artwork with soft footprint shadows away from a WSW drawing sun, a broad water sheen, and warm distance haze. The existing clouds remain a separate moving layer, with warm tint. The visible sky panorama gets a warm grade; its original PMREM still lights the cabin. No cabin, wing, seat, screen, camera, phone portal, bridge or other set was changed.

All changed scenery is `live: 'flight'`. No bake is required or run; no baked files were touched. No wall, door or furniture changed, so no roam-bot run is needed. Existing assertions naming the old campus placements were updated to the flat-map placements; no tests added. `FLIGHT-CREDITS.md` now describes the drawing and identifies the retained models as no longer displayed in the flight.

## Review

Before frames use `LIVE=1`, the real scroll at chapters 5.7, 5.77, 5.84, 5.91, 5.98, 6.047 and 6.1, and a capture-only rule hiding `.text-wall`. The old `shots.mjs` hide list does not hide the continuous text.

- Sheet: `/Users/vsood/work/curl-me-portfolio/.cache/halifax-drawn/before-after.png`. Three columns: before LIVE, after LIVE, after with the unchanged baked cabin. Full 1456×902 frames remain in the sibling `before`, `after-live` and `after` directories. Every sampled point through the descent was inspected; the map is clean at the low window, Goldberg's blue-grey footprint remains distinct, clouds still pass in front, and the phone transition is unchanged. No cabin-light clash was apparent, so it stayed unchanged. This review was in headless Chrome, not Vansh's live Chrome.
- Final set 5 `LIVE=1 leaks.mjs`: 11/4,896 rays (0.22%), zero floor overlaps, identical to before. All existing hits remain at the aircraft skin / bridge lamps. Audit JSONs: `.cache/halifax-drawn/leaks-before/leaks.json` and `leaks-after/leaks.json`.
- Both final frame runs reported zero failed shader programs. Texture dimensions and the snapshot checksum agree with the manifest. `npm run check && npm run build && npm test` completed without failure. No bake or roam-bot was needed; no dev-server restart, commit or push.
- Only the flight's map texture loading, per-pixel ground haze, visible sky grade, cloud tint and texture disposal changed in `stage-run.ts` (import at 43, material wiring at 424–451, tint at 513, disposal at 2670). `flight.ts`, `dolly.ts` and every baked asset are untouched.

The main Overpass extract reports 2026-11-15T13:18:35Z. The successful kumi coastline-margin response reports an older base, 2026-07-24T11:04:51Z; that coastline timestamp is kept separately in the snapshot and manifest. These are faithful traces of those source snapshots, not a claim that OSM is a current survey. No required geographic part is fabricated.

One part stopped: unnamed Dartmouth building way 1488441252, around 44.6576, -63.5411, has an unclosed outline and no enclosing building relation in the extract. It is omitted from the drawing and reported by the generator/manifest; its missing edge is not guessed. All the named requested landmarks are present. The source way remains in the downloadable snapshot.

One new trap: independently closing coastal fragments where they cross a crop boundary fills an entire harbour. Fetch a coastline margin, join shared OSM endpoints first, close only outside the picture, and check known water points before rendering. Never patch the coastline by eye.
