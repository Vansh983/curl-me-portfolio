# 52. The film set sealed, and the things in hand (2026-10-19)

Built from doc 50 on his "go and build this entirely". Uncommitted; not yet judged in his Chrome. The content round (his words for the things) is next.

## Verdict

- Every set is scanned from everywhere a walker can stand (`scripts/look/leaks.mjs`). Eight sets leak nothing; the rest are under a quarter of a percent, except the Bean house, whose only "leak" is the hall seen through its own door (below). What he saw on the lawn is gone: the block is one building with every face, the lawn has a hedge and ground to the fog.
- The things: E or a click lifts a thing into the hand over a blurred still of the frame; it turns under the mouse, R turns it over; the words stand on the right; Esc, E or a click outside puts it back. Big things are looked at: the eye eases to them. Thirty-four things in the first round, words from his captions and cards only.
- His first judgement (2026-10-19): the direction is right; too much answered the pointer (the tower, the 51st floor, the pathway); the panel was wrong. Now only a thing lights and captions under the pointer, nothing else in the world does; the words stand in the frame's right half with no box, a soft fade to the page behind them; a thing with a photograph shows the photograph in the hand (a print, 62 percent of the frame's height on its long side, R turns it to the paper); the story's cards leave the frame while a thing is held. The hover links to the credits files (the flight data, the Opera House model) went with the hover: `public/assets/stage/CREDITS.md` and `FLIGHT-CREDITS.md` are not linked from the page now.

## The leak tool

- `node scripts/look/leaks.mjs <dir> [set,set|all]` on the production preview (`URL`), `LIVE=1` before a bake. For each set, at its first and last camera key: Walk mode, a 0.4 m grid flooded from where he stands over the set's own floor (the walker's floor test, his body's clearance, never another set's room, never a backdrop or the far ground), 96 rays a point from 1.6 m (24 round at pitches -25, 0, 15, 50). A leak: nothing hit within a kilometre indoors or the fog's far outdoors (a drawn sky ends a level or upward ray), or the first hit the back of a one-sided face with no front face on its plane. Floors on one plane from two sets are counted. The six worst points come out as frames, the eye on the worst ray.
- Found by it and fixed: the lawn's blocks open on three sides; redwoods hollow underneath (he looked up into a cone); the Google letters open at the back; three corridors wider than their doors (slivers of a room's wall from behind); the jet bridge's end wider than the cabin's door; the Bean house's plinth filling the room, 14 cm above its floor (he walked on concrete); Floqer's house seen through the apartment's glass at night; the hall seen through its south wall from the walk's land side; the apartment's front door hole smaller than its passage; two floors on one plane under the lab and the 2010 room.

## What changed, set by set

| Set | Change | Bake |
|---|---|---|
| 3 | `facade`: one building from Google's block to the lab's far corner: a west face the whole length (with a stub round the passage from the 2010 room, its end a face toward the lawn only), the lab's north face round the strip window with its reveal, the old 2020 block's window gone, the slot between the blocks closed. `lawnHedge` round the grass's edge, `lawnFar` to the fog (CONTEXT). Grass 12 mm low under the 2010 room and its passage, none under the lab. Redwoods closed underneath. Letters capped at the back | yes |
| 2 | `passageNear` at the mouth (a wall round the door where it leaves the lab); a leaf in the mouth's frame (`DOORS.lab`), open before the jamb, shut whenever he is in neither the lab nor the lawn | yes |
| 1 | `passageBoth` to the lab (walls round both doors); `outlook` so the sky stands beyond its window | yes |
| 0 | `passageHome` east of the brick door (walls round both doors); a leaf in the brick door, paired with Floqer's door (an airlock like the 2020 room's), both shut at the end; the front door's hole the passage's whole section | yes |
| 5 | The bridge's end a wall round the cabin's door | yes |
| 8 | `walkHedge` behind the trees and across both ends of the walk; the Bean house's plinth under its walls only | live |
| 12 | Floqer's door shuts behind him in the passage | no |
| runtime | A leaf is drawn shut whenever he is in neither of the two sets it joins (scroll and Walk). From the apartment, Floqer's house is drawn only while one of its pair of doors is open. In the Walk, the hall is drawn from Volta only once the wing's door is opened | |

## The scan: before and after

Rays leaking, per set, the production build. Before: the first scan (2026-10-18 night), unbounded flood. After: the final scan, the flood bounded to each set's own floor.

| Set | Before | After | Floor scanned | What remains |
|---|---|---|---|---|
| 0 now | 3.14 % | 0.06 % | 19.2 m² | a lamp's globe |
| 1 room | 9.28 % | 0.06 % | 11.7 m² | a wall's edge in the passage to the lab |
| 2 lab | 37.00 % | 0.77 % | 18.7 m² | the stub's end from the lab side: the 2010 room drawn past it |
| 3 google | 5.53 % | 0.00 % | 4776.3 m² |  |
| 4 delhi | 38.99 % | 0.15 % | 5.4 m² | the bin's inside, a lamp's globe |
| 5 flight | 0.48 % | 0.21 % | 8 m² | the wing skin at the cabin door |
| 6 halifax | 2.69 % | 0.00 % | 131.5 m² |  |
| 7 sydney | 44.84 % | 3.18 % | 23.4 m² | the hall through its own door, past the house's boards |
| 8 vancouver | 0.54 % | 0.13 % | 1141.8 m² | the house's boards from its door |
| 9 toronto | 3.63 % | 0.01 % | 557.4 m² | the house's boards from its door |
| 10 halifaxVolta | 3.76 % | 0.71 % | 84.2 m² | the block's north wall through the wing |
| 11 convocation | 2.91 % | 0.00 % | 167.2 m² |  |
| 12 floqer | 1.15 % | 0.02 % | 108.6 m² | the bin's inside, the duvets |

- Set 7, the Bean house: every remaining ray goes through its door into the hall and ends on the back of the house's own outer boards (set 8's skin has no hole there); the hall, drawn, is what the eye sees. Left as it is.
- Set 10: the block's north wall crosses the wing's first two metres; only its back stands inside the wing, and the stage is seen past it, as it should be. Left.
- Set 12 and 0: the bin's inside and the air beds' hanging duvets, a lamp's globe: model nits.
- The tool's own limits: the ring never flips as the walker's does, so a neighbour's floor is scanned only in that neighbour's run; a drawn sky ends a ray in any set (a gap that shows sky is not counted); a back face is a leak even when what is drawn past it is right (set 7, set 10); a ray ends on glass and on a card, so what shows through a pane is not scanned; the flood's clearance is cast against everything, drapes and the crowd too. Zero means zero at this resolution: 24 directions 15 degrees apart at four pitches, from every point up to 4000 and every k-th past that (`RAYS`, `STEP`).

## The things in hand

- `src/data/things.ts`: `THINGS`, keyed by the `thing` on a placement (`sets.ts`). `kind` hand or look, `lane`, `title`, two to five lines, photos (the real files), a link. Thirty-four in the first round.
- In a baked set a thing's placement keeps its meshes from the bake (name and bounds), so hover and the rim work there (they missed every baked prop before). Only things are in the pointer's list; a `cap` without a `thing` does nothing now.
- Hand: the thing is built live at its place (`placeBuilt` or the model's clone), in a pivot at its centre, and eased 0.45 s to centre-left, 45 percent of the frame's height, half a metre out, as he saw it standing; the mouse turns it with weight, R turns it over. The frame behind: the composer's output kept once, blurred in two half-size passes, 40 percent darker; the world is not drawn while it is up. Its own key light and fill. Put back: 0.35 s.
- Look: the eye eases 0.6 s to 2.2 radii from the thing (never further than it stood, never lower than the knees), the thing a third from the left; the world stays live. Esc eases back.
- Walk: the thing he aims at within 2.1 m and 32 degrees gets the rim; the prompt is `Pick up` or `Look` when it is nearer than the door; E. Scroll: a click, or a tap; the scroll holds while it is up. The words: `aside.thing`, the right half of the frame, no box, a fade to the page behind them, focus, Esc, the wheel scrolls them; the lower half on a phone, the thing in the upper half (the hand pose reads the camera's view crop). A photograph: `showPhoto`, a box in the pivot after the lift, the model hidden under it, fading up over 0.3 s. Its styles are `:global()`: the words are built in the runtime, outside Astro's scope. The count in the keys line: `n of 34 found`, `localStorage`.

## What he judges

- The lift, the light on the thing, the blur and the fade behind, the words' type and their half; the print's size in the hand (the award, the trip's award and sign); the look's distance and framing (the desk, the whiteboards, the slides).
- The hedges on the lawn and the walk; the block's west side from the lawn; the lab's new door; the brick door's leaf and the shut doors at the end.
- The words: every line is from his captions and cards; the content round rewrites them, and gives the papers theirs.

## Checked

- `leaks.mjs` over all 13 sets, live and baked (the table above). `void.mjs` over the scroll: magenta only where the skies are off by design (the lab's strip, Sydney's window, the walk, Volta's glass, Floqer's windows). `stage:audit`: no errors, no late assets, no lost context.
- `roam-bot.mjs`: forward 0 to 5.0, 4.6 to 5.65 (the 2020 room's doors and the bridge), 5.3 to 8.2 (the flight, the hall, Sydney), and the rest in the full run; back from 19.2 to the hall's top row (the phone's cut, as before). The bot now holds W again after a ride, aims across a cut in the path and presses R when stuck, as a walker would.
- The hand, the look, the click, the wheel and the put-back, headless (`.cache/leaks/hand`, `.cache/leaks/frames`). Headless Chrome only; his Chrome next.
