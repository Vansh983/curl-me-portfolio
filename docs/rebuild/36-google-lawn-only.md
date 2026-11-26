# 36. Google without the boardroom (2026-09-27)

He said the conference room after Google was abrupt and might not be needed. Offered three ways (cut it, look in through the glass, fill it with real facts). He chose: "i dont think we need the room".

First build: the block gone, the walk looping back up an empty lawn to the 2020 room's door. He saw it and said: "why cant it be that the door is just on the left where it used to be for the conference room cause now it is empty". Second build, below, is what stands.

## Verdict

- The block stands where it stood, on the left of the walk. Its glass wall is a plain face: cream render, dark glass along the ground floor, a wood door where the glass door was.
- No room of Google's behind the door. It opens straight into the 2020 room.
- The lawn walk is as it was: out of the lab's passage, down the statues, the letters ahead, left to the door.
- The card still runs two chapter lengths. No other chapter moved.

## How the door opens onto Delhi

- The 2020 room is one set in two places, as the apartment is (`HOME`). `DELHI` in `src/lib/stage/sets.ts`.
- Until the walk is well inside it, the room stands turned a quarter behind the door in Google's block (`at` 1.5, 0, -4.3; `turn` -90).
- At raw 0.852 of the approach (chapter 4.58), with only the desk wall in the frame, the room is back where it was built and the camera with it. Nothing in the frame moves: a test holds the two views equal to a millimetre.
- After that its west door is on the jet bridge as before. Sets 5 and later are untouched.
- The jet bridge is not drawn while the room stands in the block (it would stand through the room's corner).

## What changed

| | Before | Now |
|---|---|---|
| Set 3 | lawn, block, boardroom inside it | lawn and block, no shell |
| Walk | lawn 9.5 m, then 7.5 m across the boardroom | lawn 9.2 m, then the door |
| Speed on the lawn | 9 m a chapter | 5.2 m a chapter: a stroll, the head turning to each statue |
| Door to 2020 | an open doorway in the boardroom's north wall | a wood leaf in the room's own frame, in the block's east face, z -5 |
| Removed | `boardGlass`, `boardTable`, `nameCard` (builder and paint), 8 chairs, 3 ceiling lights, `boardCarpet`, 3 west windows | |

- `GOOGLE` in sets.ts: `block`, `door`, `top`, `walkX`.
- Keys: `APPROACH` in `src/lib/stage/dolly.ts`, raw 0.6 to 0.866. The door swings over raw 0.762 to 0.794 (chapters 4.0 to 4.27).
- `facade`, `lawn`, `lawnPath` in `src/lib/stage/built.ts`.
- `DOORS.google` is `bare`: the room's own frame lines the hole, so no case is built and the leaf is cut to the hole (`door.ts`). The leaf is set 4's.
- `campusWall` is a shade darker (`#D2CBBB`, was `#E6DFCF`): a sunlit face seen close burned out.

## Found on the way

- The 2020 room's boxes stood through its south wall (the open one, 25 cm). Moved 40 cm into the room; set 4 rebaked.
- The corner by the lab passage's mouth had no ground (x 0.7 to 1.55, z 0 to 2.6): a patch of nothing at the bottom of the frame on the way out of the passage. Grass now.
- The lawn is built on one grid, with a lip under the passage's floor and one under the 2020 room's at the door: no hairlines.

## Lost

- His name card ("Vansh Sood, Drupal Association"). It is in git history if he wants it somewhere else.
- The caption "The Cloud office in Sunnyvale". The card's text still says it.

## Bakes

- `node scripts/stage-bake.mjs 3 256 2048 512` (927 KB, was 2.1 MB)
- `node scripts/stage-bake.mjs 4 256 2048 512`
- Earlier files kept in `.cache/prev.set3.glb`, `.cache/prev.set4.glb` and their lightmaps.
- The export now undoes a set's turn as well as its place (`exportForBake`).

## Checked

- `npm test` 98 pass. `npm run check` 0 errors. `npm run build` ok. Assets 12.8 MB of 14 MB.
- `.cache/void.mjs`, chapters 2.3 to 5.3: nothing unbuilt below the horizon or indoors.
- `.cache/seams.mjs` across the cut: no jump; the largest frame to frame change is the turn to the door.

## Open

- Two cuts in the dolly now: the phone's, and the room's return. The second changes no set and moves nothing seen.
- The lawn stroll is slow for the same scroll. If he wants it quicker, the card's span (`CARD_SPAN` 3) can drop, but every later chapter's keys then move.
