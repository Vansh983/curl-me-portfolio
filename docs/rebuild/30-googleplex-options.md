# Googleplex: what exists online, what to build, three layouts (2026-09-13)

He rejected the San Francisco build (516289b): the walk is blank walls and a stair, the award is a banner. He wants the Googleplex, no banners, and a real inventory of what can be pulled from online versus built.

## Verdict
- Build the **Android lawn plus the Sunnyvale boardroom** (layout A). Flat ground, real objects, one room, no stair, no city.
- Pull from online: the Android statues, the Google bike, the Google letters, the boardroom. Build: the lawn, the low building face, the paths, the trees (exist), the trophy (his photo).
- Say "Google Code-in grand prize" with objects, not banners: the trophy in hand (engraved when his photo comes), a name card at his seat, the card text beside the stage (already reads "Grand prize at 17").

## What his trip was (checked)
- Google Open Source blog, 2019-01-07: 54 grand prize winners, 19 countries, a four day trip to "Google's main campus and San Francisco offices", meet mentors and engineers.
- Blog, 2019-03-20: June 2019, an awards ceremony, meetings with Google engineers.
- His timeline (timeline.ts): "one of 52 winners", Mountain View, the Cloud office in Sunnyvale, Stanford; the award in a Sunnyvale boardroom. The blog says 54, the timeline 52: his call.
- Android lawn in June 2019: statues up to Pie (Pie unveiled 2018-08), at 1981 Landings Drive by Building 44 (OSM node "Android lawn statues", 37.4184 -122.08797).

## Pull from online

Sketchfab, CC-BY, downloadable with his token (never committed):
- Google bike `78c531b5` (alban, 50k faces): the yellow, blue, green, red campus bike. Park two by the lawn.
- Bugdroid `caa943c3` (rtql8d, 13k) or `11e8989c` (14k): the green Android, 2 m tall on the lawn. Recolour and cap the same mesh for the dessert statues (Marshmallow, Nougat) or use the Warehouse ones below.
- Google letters `a08a013b` (9k): 3D coloured letters, the lawn sign at 1600 Amphitheatre. Or build: extruded letters in the four colours, a solid object, not a board.
- Conference room `bdaa8e99` (122k): a full boardroom, table, chairs, screen, ceiling. Or keep the `boardTable` and chairs already in built.ts.
- T-rex skeleton `77e21c4e` (rigsters, 250k): Stan in the Building 43 courtyard with the pink flamingos. Only if layout B.
- Golden Gate `a0ee5a9c` (93k): unused now.
- Trophy `2a29954c` (star cup, 9k): a stand-in until his photo.

3D Warehouse (SketchUp), glb downloads open, no login; licence is the 3D Warehouse General Model License (use in your own project allowed, no standalone redistribution; verify at sketchup.com before shipping):
- Android Honeycomb Statue `24f7118c` (1.3 MB): the honeycomb with the bee and the little Android, the 2011 lawn piece. Photos show it still on the lawn in 2017.
- Android Gingerbread Sculpture `df6b7330` (522 KB): the gingerbread man, with a lawn patch.
- Google Headquarters Building `415634a4` (530 KB, 2009): buildings 40 to 43 round the courtyard, photo textured, coarse.
- Google Headquarters with Solar Array `dc1bbf80` (641 KB): the 40s cluster massing with solar roofs, white.
- Google Headquarters Buildings 45, 47 `44a6ff27` (247 KB): the Charleston Road pair, photo textured.
- Google Building CL5 `568ba711` (847 KB): a four storey glass block, the best textured one.
- Google Campus `72fcd4e0` (176 KB, 2006): a massing sketch, not useful.
- Downloaded copies sit in the session scratchpad (`w_<id>.glb`); nothing is in the repo.

OpenStreetMap (ODbL, the pipeline `scripts/stage-city.mjs` already extrudes it for Toronto):
- Buildings 40 to 43: 18 m, 3 levels, footprints around the courtyard. Building 44 and 1981 Landings: 9.1 m, 2 levels.
- Nodes: "Google Sign" artwork at 37.42065 -122.08312 (Charleston Road corner), Android statues (Lollipop, Jelly Bean) beside it, "Google Bikes" racks, "Android lawn statues" at 1981 Landings.
- Use: the real campus massing as backdrop boxes, the way downtown Toronto stands behind the condo.

Wikimedia Commons (CC-BY-SA, reference only unless credited on the page): the lawn in 2013 and 2017 (`lawn1..3`), the Charleston Road sign, the courtyard patio with the umbrellas (2014), the bikes. Contact sheets: `.cache/fame2/plex-photos.png`, `plex-models.png`, `plex-warehouse.png`.

Google Photorealistic 3D Tiles: the real Googleplex in photogrammetry, streamed at runtime. Needs an API key, cannot be baked or cached, smeared at eye level. Not for a ground walk.

## Build ourselves (the engine does these well)
- The lawn: a grass slab with a bark path, the two-storey face of 1981 Landings behind it (cream render, the arched glass entrance from the 2013 photo), the redwoods (trees exist).
- The Google letters as solid extruded letters if the Sketchfab set reads badly.
- The Sunnyvale boardroom: the `boardTable`, eight chairs, carpet, a glass wall to the lawn, the trophy at his seat, a folded name card "Vansh Sood · Drupal Association" (a real ceremony object, not a banner).
- The trophy from his photo.

## Three layouts

A. Lawn and boardroom (recommended)
- Lab door opens onto the Android lawn: the green Android, Honeycomb, Gingerbread, Marshmallow, Nougat, the Google letters, a bike, redwoods, June sun.
- Straight across the lawn (12 m, one turn) to a glass door in the building face: the boardroom. Trophy at his seat rises into the hand as the degree does, the lawn and the statues seen back through the glass.
- The Delhi door in the boardroom's far wall. One chapter, no stair, no cut.

B. The courtyard
- Lab door onto the Building 43 courtyard: the patio umbrellas, Stan the T-rex with the flamingos, the 40s buildings from OSM around, bikes.
- Into Building 43's lobby, the boardroom, the Delhi door. Two turns more than A; the buildings are boxes again; more to build. The T-rex is the one thing A lacks.

C. Warehouse campus as the world
- Drop the 2009 `415634a4` campus glb in as the surroundings, walk its courtyard. Fast to try, the real shapes, but 2009 photo textures at 256 px will read as a map, not a place. A one-hour spike if he wants to see it.

## What "Grand Prize Winner" becomes without a banner
- The trophy, engraved (needs his photo).
- The name card at the seat.
- The stage card's words, already there.
- Not: a wall screen, a board, a framed certificate.

## Still needed from him
- The trophy photo. Trip photos (only if he wants them as framed prints in the boardroom; otherwise none).
- 52 or 54 winners in the card.

## Built (2026-09-13, 23:00): layout A without the trophy
He chose A and said "don't do the trophy thing, I'll think what to do": nothing rises into the hands; his seat has the name card only.
- `GOOGLE` in sets.ts: the boardroom x -4.0..1.5, z -8.0..-0.03, 3.0 high, carpet, plastered walls, tile ceiling; the east wall an opening the bake lights as day, filled by `boardGlass` (bays 1.2 m between steel mullions, the third bay from the south the open door in its frame, at z -5.0); three windows in the west wall (the lawn and the redwoods beyond); the 2020 room's door in the north wall (`door: true`, so the bake does not light it as a window).
- Inside: `boardTable` (1.4 by 4.4, white laminate on two pedestals), eight `office_chair_black`, `nameCard` at the north-east seat ("Vansh Sood, Drupal Association", painted), three ceiling lights, the door frame.
- Outside: `facade` rebuilt at ground level, two storeys (7 m) in cream render with dark panes on the upper storey, the bed's window in the 2020 room's east face, the boardroom's west windows cut through with glass; `lawn` (Poly Haven `leafy_grass`, CC0) on three sides of the block, never under a floor; `lawnPath` (concrete) down the block's east face at x 3.2.
- The Android lawn, each statue built from primitives (`droid()` in built.ts is the Android: legs, body, hemisphere head, antennae, eyes): `bugdroid` 2.3 m, `statueCupcake`, `statueDonut`, `statueGingerbread`, `statueJellyBean`, `statueKitKat`, `statueLollipop`, `statueMarshmallow`, `statueOreo`, `statuePie`; `android_honeycomb` from 3D Warehouse (Francesco P., 2011, 111 KB after the pipeline, licence 3DW). `googleLetters` at the end of the path: arc bands and bars extruded 24 cm in the four colours on concrete blocks, the g's tail to the ground. `gbike` twice on a `bikeRack`, `campusFar` (three cream blocks, glazed along the ground floor), thirteen `redwood` (canopy from 3 m up), `clouds`. The scanned `island_tree_01` stays only outside the 2010 room: on the lawn it cost 700 KB a copy.
- The walk (APPROACH 0.588 to 0.808, still two chapter lengths): the mouth, the Android, down the row, the letters, right into the open bay, along the table, his seat, the door north into the 2020 room. No cut.
- Gone: the plaza, the steps, the lobby stair, the screens and the wordmark board, the balcony, the Embarcadero builders (sign, planter, kerb, road, cars, palms, lamp posts, piers, boats, water, the Bay Bridge), the Golden Gate and the Marin hills (marin.ts, marin.json), the trophy and `heldTrophy`, `TROPHY` in flight.ts, the palm and asphalt assets.
- Tests: 82 pass (the bridge test gone, the 3DW licence and its download url accepted, `nameCard` among the paints).
- Iterated on frames (`.cache/fame2/googleplex-a.png`, `-b.png`, `-c.png`): the statues spread 2.2 m apart and 3 to 5 m off the path, the door bay moved north so the turn in looks across the table and not at the south wall, the segment counts halved (the baked set is 2.1 MB, in line with the rooms either side), the walk's turns spread over six keys along the glass.
- Still open: the boardroom is bare by design (he will say what goes at the seat); the far blocks are boxes; the lawn texture reads dry.
