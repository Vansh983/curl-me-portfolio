# 34. The walk after Sydney, rebuilt (2026-09-27)

He said the whole walk after Australia was not good: bunched, static, the banners tasteless and AI-looking. He asked for research on what others do, real taste, Blender, and a walk where the background and the things keep changing.

## Verdict

- One straight harbour promenade, 60 m, water on the right, land on the left, Volta's door at the end.
- The place never cuts. The air changes: three cities, each in the season he was there.
- Between two cities the harbour mist closes in. What stands far off is changed inside it; what stands near turns with the year in front of him.
- No banner, booth, photo stand or logo board anywhere outdoors. A city is its own things.
- The walk is lit live (its light changes). Volta's room is baked in Blender.

## What was wrong (captured before, `scratchpad/before`)

- A blank beige wall took the left 40% of every frame.
- The whale and the streetcar overlapped: three cities stood in one row, all in view at once.
- The laptop's dashboard covered the lower third, in the middle.
- One flat gradient sky and one light for all three cities. Nothing moved.
- Booth slab, photo on a stand, dark window rectangles: all read as banners.

## Research used

- References: [33-walk-references.md](33-walk-references.md). Taken from it: colour script per city, cross-dissolve over distance (Hench), one landmark revealed by fog, movers that cost one draw call, head sway by rotation.
- Facts and assets: [35-tour-facts-assets.md](35-tour-facts-assets.md). Taken from it: Harbour Air flies Beavers from beside the Convention Centre; the TTC fleet is the Flexity (the CLRV retired in 2019); the ferry's colours; Volta's real interior.

## The script (`src/lib/stage/walk.ts`)

Everything is a function of the chapter. Scrolling back runs it backwards.

| | Vancouver | Toronto | Halifax |
|---|---|---|---|
| When | May 2025, Web Summit | October 2025, Elevate | January 2026, Demo Day |
| Chapters | 8.98 to 10.5 | 10.5 to 11.5 | 11.5 to 12.98 |
| Walk, z | -18.4 to -0.7 | -0.7 to 16.3 | 16.3 to 30, then Volta to 42 |
| Sky | Kloofendal Overcast | Kloppenheim 06 | Qwantani Dusk 2, dimmed to 0.42 |
| Light | soft, cool, off the water | low gold from the west, long shadows across the paving | blue dusk, lamps lit |
| Season | 0: green | 1: gold, orange, red; leaves coming down | 2: bare, snow lying and falling |
| Paving | grey granite, wet | warm paving | timber boards under snow |
| Over the water | North Shore (real elevation), Canada Place | downtown and the CN Tower (OpenStreetMap), 1.4 km | the ferry, Georges Island light, Macdonald Bridge |
| Land side | Coupland's whale, glass towers behind the trees | the streetcar track | downtown on its hill, the Town Clock |
| What happens | the whale goes up cube course by course; a Beaver takes off up the harbour | the mist lifts on the tower; a Flexity passes and runs on | lamps come on far end first; snow covers the boards; the ferry crosses |

- `airAt(c)`: ten stations, eased. Exposure, sun, hemisphere, fog, sky mix, mist, season, cover, lamps, leaves, snow.
- `TURN`: 10.5 and 11.5, the card boundaries. `MIST`: 0.34 chapters either side. At a turn fog far is 150 m.
- `laptopAt(c)`: the laptop comes up for the numbers as Vancouver and Toronto begin, then goes down. It is carried on the left, off the middle of the frame.
- `seaplaneAt`, `streetcarAt`, `ferryAt`: poses by chapter. `cueAt`: a thing that arrives.

## Length

- The walk was 24 m outdoors for three cities. It is 48 m outdoors and 12 m through Volta.
- `STAGE_SPAN` 16.6 (was 15.6). `CARD_SPAN` 8: 1.5, 9: 1, 10: 1.5. `TOUR_GAIN` 1: every key after the tour sits one chapter later.
- The hall and Floqer's house were not rebaked. Their sets stand `TOUR_SHIFT` (18.12 m) further north by `StageSet.at`; their dolly keys move with them.
- `WALK_SPEED` 17 m a chapter.

## Built

- `src/lib/stage/walk-built.ts`: `promenade`, `walkLand`, `beanHouse`, `quayRail`, `walkLamp`, `walkBench`, `tramTrack`, `orcaPlinth`, `walkTree0..3`, `voltaBlock`, `voltaGlass`, `voltaCeiling`, `voltaColumn`, `ringPendant`, `stackChair`, `demoScreen`, `voltaLectern`, `paperCup`, `walkWater`, `seaplane`, `ferry`, `georgesIsland`, `vancouverTowers`, `torontoWalk`, `halifaxWalk`.
- `src/lib/stage/part.ts`: `piece`, `M`, and `Built.aux` (four numbers a vertex for a material's own use).
- `src/scripts/stage-weather.ts`: leaves and snow, one draw call each, a box of air that travels with the eye.
- `src/scripts/stage-run.ts`:
  - sky dome of two photographed skies mixed, dimmed, washed by the mist; a PMREM environment per sky;
  - light from `airAt` for sets 8 to 10;
  - leaves: one material, season in the shader (turn, brown, drop), the shadow goes with the leaf;
  - snow cover: a shader patch on the walk's materials, ragged by noise, on what faces up;
  - water: two swells crossing on a generated normal map;
  - lamps: emissive head, halo sprite, pool on the paving, real light at the last three;
  - `Placement.rise`: a clipping plane that rises a course at a time;
  - head bob of 11 mm and a roll of 0.13 degrees by distance walked; off for reduced motion.
- Trees: a maple's habit, 4 variants, about 600 leaf cards each.
- Volta: brick building, four floors, windows that light at dusk. Inside, the real room: black open ceiling, ducts, white strips, ring pendants, grey carpet, a band of glass. Set for Demo Day: 20 red-orange chairs in rows, the screen ("Collect. Demo Day, Volta, Halifax, January 15, 2026"), the speaker, the coffee bar, a paper cup in hand.
- Streetcar: 3D Warehouse Flexity by Jacob L., joined and decimated in Blender (`.cache/decimate.py`, 272k to 59k faces, 913 KB).

## Removed

- `terrace`, `terraceWall`, `voltaFace`, `hallShell` builders. The Bean booth, photo stands and tables from the tour sets.
- Models: Olympic Cauldron, Convention Centre, Harbour Centre, Union Station, Purdy's Wharf, CN Tower (3D Warehouse), CLRV streetcar.
- Baked files for sets 8 and 9.

## Checked

- `npm test`: 94 pass (8 new in `tests/stage/walk.test.ts`). `npm run check`: 0 errors. `npm run build`: ok.
- Frame times at 2x, 1600 by 1000, headless Chrome on Metal: 60 fps across the walk, 50 to 55 by the whale. Worst frame 36 ms.
- Two hitches found and removed by warming at load: the whale's first frame, the hall coming into view.
- His Chrome (dark mode, 2x): Vancouver frame rendered and looked at. The window was in the background, so frames came one screenshot at a time.
- Bake: `npm run stage:bake -- 10 128 2048 512 0`, then `blender -b -P scripts/stage-bake.py -- 10 256 2048 1 env` and the webp step for `set10_env.webp`.
- Assets: 12.8 MB of 14 MB.

## Open

- His judgement, live, of each city.
- The laptop: it now comes and goes. If he wants it up the whole way, `LAPTOP` in walk.ts.
- Montreal (ALL IN, September 2025) is still out, as he asked on 2026-09-09.
- People at Volta are the rigged base character. Better people need licensed models.
- 3D Warehouse licence: not Creative Commons. Three models ship as their own files (whale, streetcar, Town Clock). See 35, section 7.1.
- Demo Day's date comes from his LinkedIn, not from Volta's site.
- Gulls were considered and left out.

## Round two (2026-09-27, after he scrolled it)

He liked it. He asked for: a longer Halifax walk; a much lighter blue Vancouver sky (Toronto too); big numbers that count up in the world, logos added along the side of the walk, the laptop kept for code, terminal and the app; a stop at Collect.'s stage; the degree held higher, then crushed and thrown in a bin; a walk round Floqer's office before the stair; no white door and no flash into his room.

### Verdict

- Halifax walks 23.7 m outdoors (was 13.7). Volta's room moved 10 m north.
- The numbers lie on the paving, lettered large on the walk's line, and count up as he comes to them. In Halifax they are light thrown on the snow.
- The logos are brass on dark granite plaques that rise into the paving by the land side's kerb.
- The way home is walked, with no cut. The apartment stands behind a dark door at the top of Floqer's stair.

### Numbers used (his own words only)

| City | On the paving | Plaque |
|---|---|---|
| Vancouver | 500 conversations, 120 signups in a day | Web Summit |
| Toronto | 8 investor calls | Elevate |
| Halifax | $40k Invest Nova Scotia, #4 on Product Hunt (counts down from 30), 100 at Collect. | Invest NS, Product Hunt, Volta |

- Not used, because no figure of his exists for them: downloads, sessions, revenue, total funding. Add rows to `MARKS` in `src/lib/stage/walk.ts` when he gives them.
- A mark shows nothing from 12 m and all of it from 4.5 m. Panels are 2.6 by 3.6 m, lettering drawn 2.5 times tall for the ground's foreshortening.

### Timing

- `STAGE_SPAN` 19.2 (was 16.6). `CARD_SPAN` 8: 1.5, 9: 1, 10: 2.5. `LAST_SPAN` 4.2. `TOUR_GAIN` 2. `TOUR_SHIFT` 28.12 m.
- Card heights: Halifax 250svh, the last 570svh.
- The walk outdoors: chapters 9.46 to 12.9, z -18.4 to 40, 17 m a chapter. Volta: 12.9 to 13.98.
- Slides at Volta's screen: 13.44 to 13.72, four of them (Collect. Demo Day; Thursdays at Volta; Bean, number four on Product Hunt, 242 upvotes; Invest Nova Scotia Accelerate, one of twelve, $40k). The standing speaker is gone: the one at the screen is him.
- Degree: raised by 14.7, crushed 15.2 to 15.42, thrown 15.5 to 15.68 into `STAGE_BIN` backstage.
- Floqer's: in at 16.24, left along the south side, up the west side by the windows, right along the north side under the mark, the stair's foot at 18.18, the door at 18.72.
- Home: the passage at 18.84, the front door at 18.96, the room at 19.1.

### Laptop

- It comes up only when nothing else is to be looked at: stepping out in Vancouver (the editor), in the mist before Toronto (the terminal), in the mist before Halifax (the app).
- No number is come to while it is up (a test holds this).

### Home without a cut

- Set 0 is one set in two places. From chapter 15.4 (in the hall, out of sight of both) its group is turned 180 degrees and moved to `HOME.at`, so the apartment's own entrance passage ends on the north wall of Floqer's house.
- The old closed landing and the white leaf are gone. `doorLeafDark` is dark oak with a steel pull.
- The white leaf in the apartment's brick door is gone too.
- Floqer's windows now look on real downtown blocks 28 m and more away (`torontoStreet`), with the sky behind them (`StageSet.outlook`).

### Skies

- Vancouver is Kloofendal 48d Partly Cloudy (Greg Zaal, Jarod Guest), shown with a gain of 1.22 and its blue lifted 0.2 toward pale.
- Toronto keeps Kloppenheim 06 with a gain of 1.12 and a lift of 0.1.

### Bakes

- Set 10 and set 12 rebaked, each with its environment. A set that stands off its origin is now exported about its own: meshes, lights and view. The first rebake of set 12 lit the room from 28 m away and rendered a black environment; fixed in `exportForBake`.

### Checked

- `npm test` 97 pass. `npm run check` 0 errors. `npm run build` ok.
- The scroll reaches the story's end (`.cache/endcheck.mjs`).
- Frame times: 58 to 60 fps; one 59 ms frame at the door into the wing, which was there before.
- His Chrome (dark mode, 2x, background window): Vancouver's sky and the counting number, Volta's door in the snow, the degree on the stage with the bin, the dark door and the walk into the room, all rendered and looked at.

### Still open

- His real figures for downloads, sessions, revenue and funding.
- The crowd and Volta's people are the same rigged figure. He called them weird but fine.

## Round three (2026-09-27): gaps and edges

He said: the numbers are not the best (left for later); the door to Floqer has a gap round it; there are a lot of gaps like it; the walk needs edges and perfection.

### Verdict

- Cause: every door leaf was smaller than its hole, no door had a frame, and no floor crossed the wall between two rooms.
- Every door on the walk is now a case and a leaf cut to it (`src/lib/stage/door.ts`, `door-built.ts`, `DOORS` in `sets.ts`).
- Audit: `.cache/void.mjs` paints what is not built magenta. Indoors, chapters 13.7 to 19.2: 0 gaps left (what remains is sky through glass).

### Found and fixed

| Where | Chapter | What was wrong | Now |
|---|---|---|---|
| Hall to Floqer | 15.7 to 16.1 | leaf 0.85 by 2.04 in a hole 1.0 by 2.2: 15 cm open beside it, 16 cm over it; no floor for 0.3 m under it | cased, leaf fits, threshold |
| The same door from the wing | 13.9 to 14.8 | a bright hole: the door belonged to Floqer's set, not drawn yet | the door is the hall's |
| Stair top, his door | 17.0 to 18.5 | a lit outline all round the leaf, a slit of nothing at its edge | dark oak case, leaf fits |
| Volta to the wing | 13.0 to 13.9 | leaf 1.16 by 2.18 in a hole 1.2 by 2.1: a slit beside it, a black band over it, seams up the wall from its head | cased, leaf fits, room rebaked |
| Apartment's window from the stair | 18.6 to 18.8 | Floqer's street in daylight, then a jump to the night city | the apartment's night from chapter 18.4, before his door opens |
| Apartment, the door in the brick | 0 to 0.3 | an open hole showing the city (the white leaf was taken out in round two) | a dark door, shut |
| Apartment, passage to room | 0.3, 18.7 | two flat walls meeting the room with no edge | a cased opening |
| Sydney's south door | 8.5 to 8.8 | leaf 5 cm short; outside, the painted harbour and the water ended in hard edges | cased; the view and the water carry on past what is seen |
| Two single pixels in the hall | 13.94, 15.14 | hairlines between walls showed the page's colour | what is not built takes the air's colour |

### A door (door.ts)

- Lining 32 mm through the wall's depth. Architrave 90 by 16 mm on each face. Stop 12 mm behind the leaf. Threshold 12 mm with a bar under the leaf.
- Leaf 44 mm, 3 mm clear at the sides and head, 5 mm under.
- Cases are built by the runtime and lit by the room the walk is in (`CONTEXT_PROP`): a case is seen from two rooms.
- Walls are now cut on one grid round their holes (`shell.ts`), so a baked wall is one island with no seam up from a door's head. Applies at the next bake of each room; set 10 has it.

### Checked

- `npm test` 98 pass. `npm run check` 0 errors. `npm run build` ok. Assets 12.8 MB of 14 MB.
- Frame times, 2x, 1600 by 1000: Volta's room 60 to 63 fps (was 43 to 53: the hall behind the shut door is no longer drawn), door open 53, hall and Floqer's 60 to 63.
- His Chrome: the door to Floqer, shut, no gap.
- Bake: `npm run stage:bake -- 10 128 2048 512 0`, then the `env` step. Set 12 not rebaked: its old reveal is inside the new case.

### Still open

- The numbers on the paving: he said they are not the best, to come back to.
- The apartment's passage is a flat warm orange (its bulb, baked). Not touched.
- Light theme not looked at in this round.

## Round four (2026-09-27): benches, numbers, logos off the floor

His words: "the benches in the walk are the other way"; "the numbers should go up faster"; "it should have 10k users"; "#4 on product hunt should not have the animation, and that should have a better look, 40k as well"; "remove the number at collect"; "conversations is a pointless discovery, investor calls is not a good number either"; "these metrics need to be thought about"; "the logos of web summit and all need to be somewhere else not down on the floor. i need to know what are my options for it".

### Done

- Benches face the walk and the water, backs to the land.
- Numbers on the paving now:

| Where | Number | How |
|---|---|---|
| Vancouver, z -6 | 120 signups in a day | counts up |
| Halifax, z 26 | $40k, Invest Nova Scotia, Accelerate, one of twelve | still, brass, a rule over and under |
| Halifax, z 31.5 | #4, Product of the Day, Product Hunt | still, brass, in a laurel wreath |
| Halifax, z 37 | 10k users | counts up |

- Removed: 500 conversations, 8 investor calls, 100 at Collect. Toronto has no number.
- A count comes into sight at 11.5 m and is done by 8.5 m (was 12 m to 4.5 m): what he reads as he comes to it is the number itself. Before, most frames showed a number part counted ("#20 on Product Hunt").
- An honour is brass let into the walk (metal, warm under the lamps), not light thrown on the snow: it holds against the snow.
- The five logo plaques are out of the paving: builders, paint and cues removed.
- Cards: the Bean card reads "10k users, #4 Product Hunt, $40k Invest NS"; Vancouver's "120 signups in a day, 1 investor MOU, Web Summit"; Toronto's drops the eight calls. The cards' prose was left as he wrote it.

### Logos: options given to him, none built

1. In the text card beside each chapter's title, in their own colours.
2. On the real things of each city: a Web Summit badge on a lanyard in his hand, Elevate on the streetcar's side, Volta on its building.
3. Flags on poles along the water, one an event, moving in the wind.
4. Etched in the glass of the quay's rail.

### Open

- His choice for the logos.
- The metrics: he said they need thought. Only his own figures are used. 10k users is his word of 2026-09-27; its date is not known, so it lies last, before Volta's door.

## Round five (2026-09-27): three numbers, marks on the left, Volta on its floor, Toronto out of Floqer's windows

His notes (dictated) and message: 10k users in place of the signups; #4 Product of the Day in Toronto, the wreath's wings further apart or the words under them; $70k investment, not $40k; Web Summit seen in Vancouver, on the left; Elevate in Toronto; Invest Nova Scotia in Halifax; the people in Volta look very weird, remove them; the stop at Collect. is not good (Collect. only in the background); go up to the podium and face the crowd; random things kept on the walk; Volta's outside better, wider and slanted windows, as if on the top floor; the Collect. screen narrower, more of Halifax outside; at Floqer, Toronto outside, by day.

### Numbers (one a city)

| City | On the paving | How |
|---|---|---|
| Vancouver, z -6 | 10k users | counts up, done by 8.5 m |
| Toronto, z 9.5 | #4, Product of the Day, Product Hunt | still, brass, a wide wreath, the words under it |
| Halifax, z 28 | $70k, investment | still, brass, a rule over and under |

- 120 signups in a day is out. The cards' stat lines follow.
- $70k is his word; what it is made of he has not said. The label is "investment".

### Marks on the left (`SIGNS` in walk.ts)

- Each city's mark stands on the land side as letters cut out, 10 cm deep, on a granite plinth, turned 40 degrees to him, the way the Google letters stand. Lit from within once the lamps are.
- Web Summit at z -1 (4.4 m wide), Elevate at z 17 (2 m), Invest Nova Scotia at z 37.4 (2.4 m), against the dark glass at the foot of Volta's building.
- His head turns to each as he comes (the glances in dolly.ts). Beside the path they were cut by the frame's edge; they stand ahead of where they are read from.
- If he meant the text card on the left of the screen: `mark` on the timeline's entries does that. Not built.

### Volta

- The building is eight storeys (1800 Argyle Street, suite 801: the eighth floor). Windows 2 m wide. The eighth storey is glass leaning in under the roof, lit.
- In at a steel door. It shuts behind him and the room goes up: the walk, the harbour and the town sink 26 m under it over chapters 12.92 to 13.26 (`RISE`). No cut.
- The room: glass leaning in along the whole harbour side (three bays of 4 m), a window 5.2 m wide on downtown in the east wall. No figures. The screen is 2.2 m wide (was 3.2). The podium is dark oak with a microphone.
- He walks up the room to the podium, round behind it, and turns to the room: the rows, the harbour along the left, then across to the window on downtown; then the door into the wing.
- Pace through the room is even: under 18 m a chapter, the head under 11 degrees a step.
- Set 10 rebaked with its environment. The hall is still not drawn until the wing's door is about to open.

### Floqer

- `torontoView`: every real block OpenStreetMap gives a height, from a spot 1.9 km east and 320 m south of the CN Tower, 30 m up. The tower stands clear to the left of the financial district.
- The data carries only tall blocks, so the ground between them was bare. Low blocks of three to seven storeys fill it, on the street grid the real footprints lie on. They are fabric, not real buildings.
- Fog for the set runs to 9 km (was 900 m).

### Taken off the walk

- The whale stands whole from the first step (it went up course by course, a stair of blocks until done).
- Fallen leaves are 12 to 26 cm across (were 30 to 70 cm sprigs that read as things left on the paving).
- The bench by Volta's door moved down the walk, clear of the mark.
- He did not name the random things. These are the ones that read so.

### Open

- Which things he meant by "random things", if not these.
- What the $70k is made of, for the label.
- With no figures, the room he turns to is rows of empty chairs.
