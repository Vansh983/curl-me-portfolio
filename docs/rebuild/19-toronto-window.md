# The Toronto window

The condo (set 0) looks out over the real downtown, built from OpenStreetMap.

## Where he stands

- Condo: Yonge and Gerrard (43.6578, -79.382), 51st floor, eye 155 m up (`sets.ts`: the city sits at y -155).
- The window faces south-south-east (`rot [0, -15, 0]` on the city): the CN Tower 1.7 km off, 29 degrees right of the window normal, its tip 12.9 degrees above the eye; First Canadian Place 1 km down Yonge just right of the hero text; nothing over the eye line in front (checked against the data before choosing the spot).
- The set is hypothetical, not his real flat.

## Data flow

- `npm run stage:city` (`scripts/stage-city.mjs`): Overpass query for every building with `height` or `building:levels` and every street (motorway to residential) in a 6 km box; raw JSON cached at `.cache/osm/toronto.json` (19 MB, git-ignored); `--fetch` asks again.
- Projection: metres about the condo, x west, z north. Kept: south of the window, taller than 6 m within 400 m, 18 m within 1.2 km, 36 m beyond; an outline whose `building:part`s stand in for it is dropped (OSM 3D convention); the CN Tower's own parts are dropped; `roof:shape=dome` marked (the Rogers Centre); a part whose `height` sits under its `min_height` is read as relative.
- Output `src/lib/stage/toronto.json`: 1776 buildings, 10 376 corners (Douglas-Peucker 0.7 m near, 1.6 m far), 1457 roads, 224 KB (70 KB gzipped), bundled with the stage.
- Credit: © OpenStreetMap contributors, ODbL, in `public/assets/stage/CREDITS.md`.

## Runtime (`src/lib/stage/city.ts`, `built.ts: city`)

- `Sink.extrude` pulls each footprint up with the window tile on every face (24 bays by 20 floors in 96 by 70 m, `stage-paint.ts`), roofs by ear clipping (`rig.ts: earcut`), domes as ellipsoid caps.
- Each building takes its own patch of the tile, brightness 0.6 to 1.4 and warm or cool, through vertex colours (`Mat.tint`, `Built.col`); faces toward the window a touch brighter (`shade`).
- The CN Tower is procedural on its real spot: hexagonal core, three legs sprawling 34 m at the ground and tapering into the core under the pod, the main pod 320 to 364 m (37 m across), the SkyPod at 449, the antenna to 553, red beacons; unlit, shaded through vertex colours from below and the front.
- Street lights: a `Points` cloud, one every 28 m along every road (6371), additive, 9 m soft dots.
- The city stays live (DROP_PROP), never baked; the ground is one dark quad, the lake and the islands being dark anyway.

## Still to do

- The CN Tower scan he linked (Sketchfab 1f105541bda242bcb8c00ac9a71bdfd9, CC-BY, 55 k faces) needs his API token or the downloaded glTF zip; it would replace the procedural tower.
- A faint reflection of the skyline in the harbour; the Gardiner's headlights; distance haze.
