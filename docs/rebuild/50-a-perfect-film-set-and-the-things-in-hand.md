# 50. A perfect film set, and the things in hand (2026-10-18)

Design, not yet built. His words, walking the Walk mode off the path on Google's lawn, looking in through the side of the block: "it should be an enclosed space, right?", "I need it to be a perfect film set", "the open world should be created as a 3D model where I can walk around in every different part of the room", "I should be able to pick those things up... like it is in The Last of Us: you see a note, a picture, some information in there".

## Verdict

- Two projects, in his order: first the world sealed, then the things in hand.
- The world stays what it is: thirteen stages, each built in code and lit in Blender, joined by doors, drawn as neighbours. What changes is that every stage must hold from anywhere a walker can stand, not only from the scroll's line. A tool proves it; the fixes are set by set, each a rebake.
- Picking things up is The Last of Us's artifact: a prompt when near, the thing comes up into the hand and fills the frame, it turns under the mouse, the world goes still and soft behind it, the words stand beside it. Esc puts it back. The things are the ones already in the rooms, with the words he already wrote, plus a few papers he will give the words for.

## What he saw, and why

- He stood at world x -6.2, z 4.8, west of Google's block, in the Walk, and saw the 2020 room's inside floating in pale void, through the block's side.
- Rooms are one-sided planes with their normals inward (`shell.ts`); seen from outside a wall is not there. The blocks on the lawn (`facade` in `built.ts`) have only the faces the scroll passes: Google's block has no north face west of x 0.7; the lab's block and the old 2020 block have no west face; the lawn has no ground under any block. Nothing of this is the streaming (doc 49): it was built as a film set for one camera line.
- The Walk (doc 46) and one world (doc 47) let him leave the line. So the set must hold from everywhere.

## Part one: the world sealed

### Goals

- From every point a walker can stand, in every set, every line of sight ends on a built face: a wall's front, a floor, a ceiling, a backdrop, the sky where the set is outdoors. No void, no wall seen from behind, no room seen into from outside.
- Every room's whole floor is reachable: the walker is held by walls, furniture and real drops only, never by the end of what is built, except where the world ends in water or a lawn's edge he can see.
- Outdoors (the lawn, the promenade) the ground runs to the fog and what stands at the edge reads as a place, not a cliff into nothing.

### Non-goals

- Not one Blender model of the whole world. The sets stay in code and the bake pipeline stays (doc 38). "A 3D model" is what the walker gets, not how it is made.
- Not drawing every set at once by distance. Sets stay cells joined by doors; a shut door hides what is beyond it. This is why sets never drawn together may overlap in space and nothing breaks: Floqer's house (x -2.3 to 9.7, z -9.8 to 2.2) stands where Google's block and the 2020 room stand; the lawn's grass runs under the apartment and the 2010 room. Checked today from `POSES` and the shells.
- Not fences or invisible walls on the lawn. What stops him must be seen: on the lawn a hedge at the grass's edge, with the ground running on to the fog beyond it, never walked; on the promenade the water's edge and the front row. The flood fill covers the grass only.

### Anti-goals

- A ray that hits nothing from inside a room. One leak and it is not a film set.
- A new window onto a set that is not drawn (the Volta trap, doc 38).
- Closing a hole the story walks through. A door is cut through every wall on its line (the hall's south wall trap).

### The tool first: `scripts/look/leaks.mjs <dir> [set]`

- Headless, the production preview, the Walk mode, the whole world in.
- For each set: a grid of points 0.4 m apart over the set's footprint; a point counts where the walker's own floor test finds ground (expose `roam.floorAt(x, z)` for review builds). Flood fill from the set's entry over the grid: the reachable floor, and the floor that is built but cut off.
- At each reachable point, from eye height 1.6 m, 96 rays: 24 round, at pitches -25, 0, 15 and 50 degrees. Against the drawn ring's meshes, both sides, doors as the walker finds them (shut unless the story left them open).
- A ray leaks when: it hits nothing within 300 m in a room, or within the fog's far distance outdoors; or its first hit is the back of a one-sided face (the hit's normal along the ray). Two-sided materials (leaves, cards, glass) are not leaks. A ray that passes an open doorway into a set that is not drawn is a leak like any other: it ends in nothing.
- Doors in the tool stand as the Walk draws them: a leaf is drawn shut whenever he is in neither of the two sets it joins (the rule below), the cased openings open.
- A floor leaks when two drawn sets have floors within 5 mm of each other over the same ground (the lawn under the 2010 room when the lab is the set).
- Output: a table per set (reachable floor in square metres, cut-off floor, leaking rays as a share, leaking points), and the six worst points as frames with the leaking face in magenta, as `void.mjs` does. Run after every fix; the number must reach zero before the set is rebaked.
- Keep: `roam-bot.mjs` both ways after every wall or door change, `void.mjs` on the scroll's line.

### The fixes known today (the tool finds the rest)

| Set | Leak | Fix |
|---|---|---|
| 3 Google's lawn | Google's block open on its north side west of x 0.7; the lab's block and the old 2020 block have no west face; the old 2020 block's east face and window are a leftover of where the room stood | One solid block from x -4.14 to 1.5, z -8 to 3.6, all faces, the roof as now; the lab's block's west and north faces; the window goes |
| 3 Google's lawn | Grass ends at x -40 and 61, z -42 and 14; beyond it the campus ring stands on nothing | A hedge round the grass's edge (he sees why he stops); a ground to the fog beyond it in the lawn's colour; the ring of far blocks on it |
| any | A line of sight through two doorways into a set two away, which is not drawn: back from the lawn through the lab's mouth and the lab's door into the 2010 room, say | Two means, never a wider ring: a leaf is drawn shut whenever he is in neither of the sets it joins (the Walk already shuts the 2020 room's pair; the scroll already shuts Google's and Volta's behind him), and a cased opening that lines up with another doorway gets a jog in its passage or a leaf of its own. The tool counts these lines; they reach zero by these two means |
| 2 the lab | The lab's block has no north face at z 9.9 | A north face |
| 1 the 2010 room | Its window: what it looks onto when set 3 is not drawn (the apartment's and the lab's rings) | The tool says; a backdrop of its own if it is void |
| 4 the 2020 room | The west door's bridge leaves the block through its south face at z -8 | The bridge is set 5, drawn only with its door open and the lawn off (the airlock stays); the block's south face gets the hole cut for it, so the bridge's mouth is a cased opening, not a wall passed through |
| 8, 9 the promenade | The land side past the front row, the ends of the walk past Sydney's house and Volta | The tool says |
| 6, 7, 10, 11, 12 | Rooms built for the scroll: their outsides, the hall's backstage, Volta's floor behind the counter, Floqer's kitchen | The tool says |

### Order

1. The tool, run over all 13 sets: the table goes in this doc.
2. Google's lawn and the lab's block (what he saw), rebake sets 2 and 3, the tool again, his Chrome.
3. The rest in story order, one or two sets a round, each rebaked and run, him judging each round live.

## Part two: the things in hand

### What it is, as he asked

- Walking, he comes to something that matters: a prompt stands at the bottom of the frame, `E  Pick up`, as a door offers `E  Open`. He presses E or clicks. The thing lifts off its place and comes up into his hand in 0.45 s, centre left of the frame, filling about 45 percent of its height, lit by its own soft light so it reads in any room. The world behind goes still, darker by 40 percent and soft, as it does when a note is read in the game.
- The mouse turns it (drag, or the locked pointer's movement), with a little weight. `R` turns it over when it has a back. The words stand on the right: a small mono line of place and year, a title, two to five lines in his own words, his photographs where there are any, a link where there is one. The panel slides in 0.3 s after the thing arrives.
- Esc, E or a click outside puts it back where it was, in 0.35 s, and the world moves again.
- Big things that cannot be lifted (a whiteboard, a screen, a desk, a slide on a wall) are looked at instead: `E  Look`. The eye eases to a view that frames the thing in the left two-thirds, the world stays live, the same panel comes in. Esc puts the eye back where he stood. Under 0.6 m across is lifted; over is looked at; a placement can say which.
- Scroll mode: the pointer's caption as now; a click does the same pick-up, the scroll holds while it is up. Touch: a tap picks up, a drag turns, a tap outside puts back; the panel is a sheet from the bottom.
- A thing within 2.1 m, in the middle of his sight (within 25 degrees), gets the faint accent rim the caption already gives on hover. The nearest of a door and a thing wins the prompt.
- A quiet count in the keys line, mono, grey: `11 of 32 found`, kept in the browser. No popups, no badges, no sound. The count is my call; he can cut it.

### The things, first round (his captions and cards carry the words; the kind is my call)

| Set | Thing | In hand or looked at |
|---|---|---|
| 0 the apartment | The Google Code-in award on the shelf; the desk (Floqer, most nights); the glass and the CN Tower | hand; look; look |
| 1 the 2010 room | The Xbox 360 pad; the World at War case; a figure off the shelf; the Barcelona poster | hand; hand; hand; look |
| 2 the lab | The lab PC with index.html in Notepad; the wireframes sketched in class | look; hand |
| 3 the lawn | His two photographs by the door (the award, the San Francisco sign: the real files in `photos/`); the Google bike; Honeycomb | hand; look; look |
| 4 the 2020 room | Webcube's wide desk and its screens; the Covid Leads laptop; one award off the top shelf | look; look; hand |
| 6 the hall | The lecture's slide; the ShiftKey lectern | look; look |
| 7 Bean's house | The whiteboard; the phone with Bean on it; the Product Hunt launch screen; the air mattress | look; hand; look; look |
| 8, 9 the walk | The three numbers on the paving and the plaques | look (the eye drops to them) |
| 10 Volta | The Collect. slide; the high table | look; look |
| 11 the stage | The lectern; the degree keeps its own choreography (it rises into the hand, is crushed and binned by story progress, on the scroll and in the Walk alike) and is not a pick-up | look |
| 12 Floqer's house | The whiteboard; the foam F; a sticky note off the board | look; look; hand |

- Papers he must give the words for, placed the way the game leaves letters (only if he wants them): a boarding pass on the 2020 room's desk (Delhi to Halifax, 2022), the Code-in winner's email printed and pinned in the apartment, the Invest Nova Scotia letter on Volta's high table, the Floqer offer on a trestle desk. None is built until the words are his.

### How it is made (decided)

- Data: `src/data/things.ts`: `{ id, set, prop, title, lane, lines[], photos[], href?, kind: 'hand' | 'look', back?: string }`. `prop` names the placement (a `thing` key on `Placement` in `sets.ts`, so the placement and its words are one record). Nothing is written in the runtime.
- Finding a thing's meshes in a baked set: the bake keeps each placement's pieces as separate meshes named `b|<build>|...` or `m|<model>|...` (`parseBakedName`); a thing's meshes are those of its name whose bounds lie within 0.3 m of the placement's place. Today a captioned prop in a baked set has an empty hot root, so hover misses it; this fixes that too.
- In hand: the thing is built live (`geometrySource.load(name, false)`, or `loadModel`), hung on the camera as `heldLaptop` is, with its own small key light; the baked meshes hide while it is up. So the thing turns under light and the lightmap does not smear.
- The world behind: at pick-up, one frame of the composer's output is kept in a render target, blurred in two half-res passes, and drawn as the background while the thing is up; the main scene is not rendered meanwhile. One cost at pick-up, none while reading.
- Looked at: the camera eases 0.6 s to a view 2.2 radii from the thing's bounding sphere along his line of sight, the sphere's centre a third from the left; the walker's position is kept and restored.
- The prompt and the rim reuse the Walk's prompt element and the caption's accent tint. Picking is a ray from the eye's centre each frame against the drawn sets' things only, bounding spheres first.
- The panel is DOM in the site's type: `aria-modal`, focus moves to it, Esc closes, the wheel scrolls it. His photographs are the real files, 4:3, no EXIF, as the trip photographs are.
- The count lives in `localStorage` under one key; the audit ignores it.

### Order

1. The mechanism with three things in the first two rooms (the award, the Xbox pad, the desk), the production build, his Chrome. He judges the feel: the lift, the light, the panel, the stillness behind.
2. The rest of the first round, set by set, words drafted from the cards and captions for him to fix.
3. His papers, when the words come.

## Calls made after the builder's check (mine, not his)

- Sight through two doorways: shut leaves by the rule above, a jog or a leaf for a cased opening on a line; the ring stays one set each way.
- The lawn's edge: a hedge he can see; the ground beyond it runs to the fog and is never walked.
- The degree: not a pick-up; its choreography stays.

## Left to the builder

- The blur's radius, the dim, the hand pose, the key light's colour: by eye on the first three things.
- The exact grid step and ray count of the leak tool, as long as a 0.4 m gap and a 2 degree sliver are caught.
- Whether a looked-at thing's view is authored per thing where the automatic framing fails (a slide on a wall seen from an angle).

## Open

- The words on the papers: his.
- Sound for the lift and the put-down: none now; the site has none.
- Whether the count stays.
