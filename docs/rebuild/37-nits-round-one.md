# 37. Nits, round one (2026-09-27)

His words: "time for nits. every single thing i'm going to say is going to be around perfection so you have to make sure everything is pixel perfect. my room needs to be a bit smaller, the blanket needs to be grey and the pillows too. or like dark not light, then in the google thing right before entering the next door on the wall i want a couple pictures like from the trip and me getting the award or something like that, then the invest ns thing is a bit far ahead it needs to be in the beginning of winter and in the end it should be volta".

## The apartment (set 0)

- "My room" is the apartment the story starts and ends in: it is the one with the white bed.
- 5.2 by 5.6 m is now 4.7 by 5.0 m. The west wall came in 0.5 m and the glass 0.6 m. `CONDO` in `src/lib/stage/sets.ts`.
- The front door (north) and the brick wall (east) did not move, so the passages and the way home (`HOME`) are as they were.
- Everything on the west wall and by the glass moved with its wall. The glass is 4.1 m wide (was 4.6).
- The bed: blanket `#6E7076`, pillows `#5A5C62`, frame and bolsters `#64666C` (`skin` on `bed_double` in `assets.ts`). The bolsters share the frame's cloth in the model, so the frame went grey with them.
- First frame: the camera stands 0.5 m further east (-8.3, 1.6, 1.5) and looks 3 degrees lower, so the bed is still under the hero.
- Rebaked: `node scripts/stage-bake.mjs 0 256 2048`. Earlier files in `.cache/prev5.set0.*`.

### Found on the way: the lamp over the bed

- The pendant model stands on its ceiling rose with the shade uppermost. It was placed as if the shade were at the bottom: the shade was in the ceiling, cut by it, and the rose hung in the air on its cable.
- Now turned over and set on the ceiling: the shade's back 5 mm into the slab, hanger and cable above it, out of sight. It reads as a paper lantern on the ceiling, where the cut shape was.
- Its light is 12 cm under the shade (was in mid air at 1.9 m).
- The same lamp is upside down in Sydney (2) and Floqer's (3). Not touched: he did not name those rooms, and hung right they would be large lit shapes in frames he has passed. Open.

### Found on the way: a gap in the passage out of the apartment

- The passage is 1.2 m wide and its far corner stands 10 cm outside the 2010 room's east wall. From chapter 0.72 to 0.8 the eye passed that wall on the outside: a dark patch at the top left of the frame.
- The passage's far end is now a wall round a door's hole, 1.0 by 2.1 m (`passageDoor`). The same end is the one he comes in at from Floqer's stair, where the door is that size.
- `scripts/look/void.mjs` over chapters 0 to 0.9 and 18.8 to 19.2: nothing unbuilt.

## Google (set 3)

- Two photographs of his own, framed, on the block's face just past the door: the wall from the door's frame to the block's corner in thirds.
- Nearest the door: the award. Him with the trophy, the screen behind reading "Vansh Sood, Drupal, India, 2018 Grand Prize Winner". Taken 2019-06-27 10:06 (the file's own date). From his Google Drive (`IMG_20190627_100614_Original.jpg`), cropped to the widest 4:3 that leaves out the cart on the right.
- Beyond it: him at the Google San Francisco sign, the Bay Bridge behind. From the old site (`public/assets/story/google-code.jpeg` on `curl-era`).
- Files: `public/assets/stage/photos/google-award.jpg`, `google-sign.jpg`, 1280 by 960, no EXIF. Made by `scripts/look/photos.mjs`.
- Each is 72 by 54 cm behind a white mount in a black frame, 89 by 71 cm over all, middle 1.55 m up. `framedPhoto` in `built.ts`, paint `trip`.
- The dark glass that stood on that stretch of wall is gone. The glass north of the door stays.
- The frames are built and lit by the runtime (`CONTEXT_PROP`): baked, the lightmap smeared their thin bars white.
- The walk: the head turns to the photographs from raw 0.753 to 0.77 (chapters 3.92 to 4.07), then to the door, which opens over raw 0.768 to 0.797.
- Rebaked: `node scripts/stage-bake.mjs 3 256 2048 512`.

## The walk (sets 8 to 10)

Mid-turn he added: "there is a bench hiding web summit, remove that. and i dont need to look left towards invest ns or something just walk."

- Invest Nova Scotia's mark stands at z 25.5, x -6.0 (was z 37.4). He comes up to it from chapter 11.1 to 11.55, as the first snow falls, and it is whole and clear all that way.
- Volta's mark stands at z 37.4, x -6.4, at the foot of Volta's building. 2.6 m wide, white, from `logos/volta.png`. Clear from 12.14 to 12.3.
- Elevate's mark moved to z 18, x -5.55 (was z 17, x -5.7).
- In Halifax the head does not turn at all: straight on to Volta's door. The glances to Invest Nova Scotia, the ferry and the last mark are gone (`glance` in `dolly.ts`).
- The bench by Web Summit's mark is removed. Three benches are left (z 9, 18.6, 29.4).
- $70k lies at z 31.5 (was 28), between the two marks of Halifax and abreast of neither.
- The laptop comes down by chapter 11.54 (was 11.76).

### The text card and the marks

- In his Chrome the text card is on the left of the screen, x 36 to 500 of 1456, and climbs it: about 940 px a chapter, 320 to 345 px tall. The captures used until now hid it.
- It lies over the band where a mark on the left stands (y 400 to 560) through chapters 10.55 to 11.08 (Toronto's card) and 11.55 to 12.12 (Halifax's).
- Elevate's mark was looked at from 10.96 to 11.08, under the card. It is looked at from 11.08 to 11.22 now, after the card has climbed past, with the same turn of the head as before (12 degrees).
- Invest Nova Scotia's is passed before Halifax's card comes up; Volta's is reached after it has gone.

### Nothing across a mark

- Measured with rays from the eye to 44 points on each mark, every 0.06 of a chapter (`scripts/look/marks.mjs`): what hides it, how much the card covers, whether two marks overlap.
- While each mark is near and read, nothing hides it: 0 of 44 points.
- The trees of the first row are placed, not stepped: z -11.2, 2.4, 8.2, 20.7, 30. None stands beside a mark or within 4.5 m before one. Five trees (were six).
- The marks do not stand in one line (x -5.3, -5.55, -6.0, -6.4), so seen from far down the walk each is clear of the next. Elevate's stays clear of the streetcar's side.
- From far off a bare trunk or a bench's back still crosses a mark that is 60 to 130 px wide on the screen. Not while it is read.

## Volta stays on the ground (the same day, after the commit)

His words: "there is no need to bring things from the top in volta that looks weird, just keep it stable and halifax is not obvious outside just have the halifax harbour and buildings etc just keep it the same as it was outside before walking s it seems the same".

- The rise is gone (`RISE`, `riseAt`, `WALK.volta.up`). The room is on the walk's level; nothing outside moves as he goes in.
- What the windows show is what the walk showed: the harbour, Georges Island, the ferry and the Macdonald Bridge through the leaning glass; the town on its hill through the side window.
- The building is unchanged. Its faces are one-sided, so from inside the room they are not there and the windows look straight out.
- The door off the walk still shuts behind him (`VOLTA_SHUT`, chapters 12.94 to 13.08).

### Found on the way

- Snow fell inside the room while he stood in the door (the flakes are a box of air that goes with the eye). Now nothing falls in the room, and the snow keeps falling outside the glass while he is in it, as it did on the walk. Nothing falls in the wing or the hall; once through the north door the weather stays behind (`stage-weather.ts`).
- The flakes keep the dusk's colour indoors, not the room's.
- From the ground, the side window looked into the hall of the next chapter from chapter 13.7, when the hall is drawn: a black box with steps and a figure in it. The hall stands east of the wing, from z 52. The window now runs z 45.6 to 50.0 (was 46.2 to 51.4), so no line from where he stands through it reaches the hall. Checked by rays from the camera (`scripts/look/rays.mjs`).
- Set 10 rebaked with its panorama.

## Halifax out of Volta's glass (2026-09-28)

His words: "The window outside Volta still seems very weird. Why don't you just put the city of Halifax there? I don't want to see Peggy's Cove or anything or any water there. Just the city of Halifax, just like it was earlier. Just put that outside. The bridge in the back and all".

- "Peggy's Cove": Georges Island, a white mound with a lighthouse on it, seen across the water.
- The big glass now shows the city: the walk's own town (the real blocks round the Maritime Centre, `halifaxWalk`), turned half round so it stands across the snow from the glass as it stood from the walk, on a lower hill (26 m, not 46), taking blocks up to 1.3 km out (the walk takes 750 m) so the city runs on into the fog.
- Nine bare trees on the snow in front of it.
- The Macdonald Bridge stands behind the town, 1.15 km out, its deck along the roofs, towers and cables above them. No block that would stand across a tower or the cables from the room is built.
- No water shows: snow runs from the building's foot out past the fog.
- `voltaView` in `walk-built.ts`, `VOLTA_VIEW` and `voltaViewBridge` in `walk.ts`.
- It stands there from chapter 12.62, when Volta's front fills the frame; the walk's bridge, Georges Island and the ferry are gone from then on (`indoor: 'in' | 'out'` on a placement). Checked by rays: from 12.5 to the door, nothing west of the building is in view, so the change is never seen.
- The side window still shows the walk's town itself.
- Frame rate in the room 60 to 63, no hitch at 12.62. No rebake: the view is built at runtime.

### Found on the way

- A prop with `live: 'city'` in a baked set was neither baked (the bake drops 'city') nor built at runtime (only named backdrops were): the first view never showed. `pieceIsLive` in `bake.ts` now counts 'city' as live.

## Halifax as a street (2026-09-28, later)

His words: "halifax is not good, i see too much snow on the floor, buildings need to be closer".

- Out of the big glass now: a sidewalk, a plowed road with banks of snow along both kerbs, the far sidewalk with bare street trees every 13 m, and the city across it, its front row at about 17 m from the glass (was 60 m and more across a field of snow).
- The front row: the walk's town (real blocks) where they reach the street, and blocks of three to six storeys filling the street's far side where the real ones leave it open. Kept clear of the town's own streets, which run back from it plowed.
- The ground between the town's blocks is grey (lots and yards trodden and plowed), not white. The sidewalks are wet concrete, darker than the banks.
- The bridge stands end-on at the back, 1.2 km out, between the blocks (a narrower gap is cut for it: 1.5 degrees either side of its towers).
- The side window has the same street: sidewalk, road over the walk's lawn and the streetcar's rails, far sidewalk, a front row of blocks. The walk's trees that would stand in it are hidden from the swap on.
- The swap moved to chapter 12.68 (was 12.62): at 12.62 two rays reached the side street's sidewalk from outside. From 12.66 on, nothing of either view is reachable from outside before the door opens (`.cache/view-seen.mjs`).
- The side window still never reaches the hall (`.cache/window-sees.mjs`, 0 of every ray, 13.7 to 13.98).
- Frame rate 60 to 63 through the room. Gap audit: nothing unbuilt; the magenta is the sky only.
- Helpers: `streetAlong` and `frontRow` in `walk-built.ts`; `street`, `east`, `eastRow` in `VOLTA_VIEW`.

## Open

- The lamps in Sydney and Floqer's.
- The view's city is the walk's town turned round: through the glass and the side window the same real blocks show, from opposite sides.
- What the $70k is made of. It lies between the two marks; neither is claimed as its source.
- The glances in Vancouver and Toronto are as they were. If "just walk" was meant for the whole walk, they go too.
- The opening picture shown while the stage loads (`public/assets/stage/preview.webp`) was the old room; remade with `scripts/look/poster.mjs`.

## Collect.'s poster on Volta's screen (2026-10-01)

Superseded the next day: he did not want Demo Day there at all. See `41-volta-floor-and-the-hall.md`.

His words: "collect poster needs to be better".

- It was a navy slide in Helvetica with a yellow rule: "Collect. Demo Day", made up.
- Now the real poster: "Demo Day." in white on its black ground, Collect.'s computer and Volta builders along the foot, as printed for the evening. From the event's public page (luma.com/7fw81j31; he is one of its hosts).
- The poster is square and the screen 16:9: it stands whole on the left, its ground carried on to the right with Collect.'s wordmark (off its banner, in white), the date and the place.
- The three slides after it (Thursdays, Bean, Accelerate) are on the same ground with the same marks, the big word in the poster's size, Inter 800. Their words are unchanged.
- `scripts/look/collect.mjs` makes `public/assets/stage/collect/demoday.webp` and `ground.webp`; `screenDemoDay` moved into `beanPaint` in `stage-paint.ts` (it draws images now).
- No rebake: the screen is live.
- Seen headless only (12.9 to 13.36). His Chrome's tab was hidden and the stage would not load in it.

### Read in the room, not changed

- The front wall is white; in his Demo Day photograph it is brown and the slide is thrown straight on it.
- The screen is small from the door (he asked for it narrower on 2026-09-27).
- The side window is a dark wall with a few lit squares, close.
- The ceiling reads white at the door and black from 13.2 on.
