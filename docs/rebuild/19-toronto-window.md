# The Toronto window

The condo (set 0) looks out over the real downtown, built from OpenStreetMap.

## Where he stands

- Condo: Front and Spadina (43.64645, -79.39157), 51st floor, eye 155 m up (`sets.ts`: the city sits at y -155).
- The glass faces bearing 125 (`FACING` in the script; the JSON is already in the window's frame, x right, z toward -ahead): the CN Tower 560 m off to the south-east, 15 degrees right of the window normal, its pod 18 degrees and its tip 35 degrees above the eye, the Rogers Centre at its foot, the lake behind. Three Hundred Front Street West pokes 1 degree over the eye line in front; the Ritz stands 31 degrees left.
- Chosen by a line-of-sight check over the OSM data (the first spot, CityPlace, had Concord Canada House, 232 m, dead on the tower). He asked for the tower very close, unmistakable, and not purple: it is floodlit concrete white now.
- The set is hypothetical, not his real flat.

## The ring (since 2026-09-07, evening)

He asked for a plan, not a row: "I just entered a room, the next room is to the right of it", and for the journey to come back to Toronto, "a full circle", with rooms added in the middle later.

- Top view, x east, z north. Apartment x -13..-4.2, z -3.4..2.2. Front door in its north wall at x -5.45; a passage north to the 2010 room (x -9.15..-4.95, z 4.3..7.9, entered from the south at x -5.45, left by its east wall at z 6.6); a passage east to the lab (x -3.15..2.05, z 4.7..9.7, entered from the west at z 6.6, left by its south wall at x 1.4); a passage south to the Embarcadero (heading south from (1.4, 2.6), the bay to the east); a right turn west to the brick door at (-4.2, 1.6) and the passage back into the living room. The dolly ends at q 1 inside the apartment looking at the desk and the glass; the later chapters hold there.
- Sets 1 and 2 were reflected, not rotated (`sets.ts` comments say how; rotations are `90 - y`, `180 - y`, `270 - y`); the plaza reflected so its walk heads south. Ground and road of the plaza are only where they cannot be seen from the apartment's glass; the plaza is `outdoor`, shown only from the lab and itself (`enter()` in stage-run.ts: ring neighbours, outdoor sets only from the set before).
- `facade` (built.ts): the outside of the apartment (brick, with the two doorways) and the lab block (dark render), a prop of the plaza.
- Review flags: `?live` builds every set at runtime (no baked files); `?set=i` with `?cam=` lights the pinned camera as set i.
- Adding a room later: split a passage, give the new room its doors, insert its dolly keys, re-bake it and its neighbours.

## The apartment (set 0, since 2026-09-07)

- One bedroom, 8.8 by 5.6 m: bedroom (x -13..-9.4, z -3.4..0) and bathroom (z 0..2.2) west of a partition at x -9.4 (bedroom door at z -0.6, bathroom door at z 1.4); open living room, kitchen and hall east of it; floor to ceiling glass along the whole south side.
- `Shell.walls` (`InnerWall`, `shell.ts: innerWall`) builds partitions with door reveals; props: `condoBrick`, `condoSkirting`, `bathTiles`, `showerHead`, `doorLeaf`, `wallTv`, `discLight` (live 'pendant' adds a ceiling point light for the bake).
- BlenderKit free models: bed_double, nightstand_modern, sofa_teak, coffee_table_square, tv_stand (also the bedroom dresser), kitchen_modern (scale 0.85, ten unseen or dense nodes cut by `Asset.drop` through `scripts/gltf-drop.mjs`), bathtub_abrazo, toilet_wall_hung, basin_mirror (`rot [90,180,0]`: the file lies flat), shoe_rack_modern.
- The walk (dolly q 0 to 0.22): at the bedroom glass with the tower, diagonally to the bedroom door, into the living room past the armchair, the desk and the television, round the kitchen's end, out of the front door.

## Data flow

- `npm run stage:city` (`scripts/stage-city.mjs`): Overpass query for every building with `height` or `building:levels` and every street (motorway to residential) in a 6 km box; raw JSON cached at `.cache/osm/toronto.json` (19 MB, git-ignored); `--fetch` asks again.
- Projection: metres about the condo, x west, z north. Kept: south of the window, taller than 6 m within 400 m, 18 m within 1.2 km, 36 m beyond; an outline whose `building:part`s stand in for it is dropped (OSM 3D convention); the CN Tower's own parts are dropped; `roof:shape=dome` marked (the Rogers Centre); a part whose `height` sits under its `min_height` is read as relative.
- Kept: ahead of the window, within 2.6 km, taller than 6 m within 400 m, 24 m within 1.2 km, 70 m beyond (he found the first cut, 1776 buildings, far too busy).
- Output `src/lib/stage/toronto.json`: 922 buildings, 5475 corners (Douglas-Peucker 0.7 m near, 1.6 m far), 1002 roads, 125 KB, bundled with the stage.
- Credit: © OpenStreetMap contributors, ODbL, in `public/assets/stage/CREDITS.md`.

## Runtime (`src/lib/stage/city.ts`, `built.ts: city`)

- `Sink.extrude` pulls each footprint up with the window tile on every face (24 bays by 20 floors in 96 by 70 m, `stage-paint.ts`), roofs by ear clipping (`rig.ts: earcut`), domes as ellipsoid caps.
- Each building takes its own patch of the tile, brightness 0.6 to 1.4 and warm or cool, through vertex colours (`Mat.tint`, `Built.col`); faces toward the window a touch brighter (`shade`).
- The CN Tower is procedural on its real spot: hexagonal core, three legs sprawling 34 m at the ground and tapering into the core under the pod, the main pod 320 to 364 m (44 m across), the SkyPod at 449, the antenna to 553, red beacons; unlit concrete white, shaded through vertex colours from below and the front.
- Street lights: a `Points` cloud, one every 28 m along every road (6371), additive, 9 m soft dots.
- The city stays live (DROP_PROP), never baked; the ground is one dark quad, the lake and the islands being dark anyway.

## Still to do

- The CN Tower scan he linked (Sketchfab 1f105541bda242bcb8c00ac9a71bdfd9, CC-BY, 55 k faces) needs his API token or the downloaded glTF zip; it would replace the procedural tower.
- A faint reflection of the skyline in the harbour; the Gardiner's headlights; distance haze.
