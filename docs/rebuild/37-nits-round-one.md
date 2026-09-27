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

## Open

- The lamps in Sydney and Floqer's.
- What the $70k is made of. It lies between the two marks; neither is claimed as its source.
- The glances in Vancouver and Toronto are as they were. If "just walk" was meant for the whole walk, they go too.
- The opening picture shown while the stage loads (`public/assets/stage/preview.webp`) was the old room; remade with `scripts/look/poster.mjs`.
