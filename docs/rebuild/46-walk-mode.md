# 46. Walk mode: the same world, walked with the keys (2026-10-05)

His words: "it needs to be interactive. now let's add a button up top to switch between scroll vs moving around. and then people can just use keyboard keys to move around and open doors like a game. i need it to be a very smooth experience so do your research how that can be done... it is an open world after all with my story".

Research: `45-walk-mode-research.md`.

## What he gets

- A switch at the top of the journey: Scroll, Walk. Only where there is a keyboard and a mouse; a phone keeps the scroll.
- Walk: W A S D or the arrows move, Shift runs, the mouse looks after a click on the stage (the arrows turn without it), E opens and shuts the door in front of him, R puts him back on the story's path, Esc leaves.
- The story stays. Where he stands is the stage's progress: the light, the weather, the laptop, the coffee, the degree, the crowd and the text cards all come as he reaches them. The page scrolls itself to match, so switching back to Scroll lands on the same place.
- Doors are his to open. They swing away from him, whichever side he stands. Doors the scroll had already passed stand open.
- The flight is not walked. At his row the stage offers "Take your seat" (E): the descent and the phone play for eight seconds and he stands up in the lecture hall. E again hurries it.
- Walls, furniture and glass stop him. Stairs and the steps to the stage lift him. A drop of more than 0.6 m (the stage's front, the quay) and the end of what is built hold him at the edge.

## How it is built

| Piece | File | What it does |
|---|---|---|
| The path | `src/lib/stage/roam.ts` | The scroll's camera path, 6400 samples, cut into legs: a leg ends at a doorway, at a cut (the 2020 room stands in two places), or where something plays (the flight). The nearest place on his leg is the progress |
| The walker | `src/scripts/stage-roam.ts` | Keys, body, floor, doors, the ride. No three.js scene knowledge beyond the groups it is given |
| The wiring | `src/scripts/stage-run.ts` (`roam`, `setMode`, `ghost`) | The frame comes from the walker while Walk is on; the switch, keys, mouse, page scroll sync |
| The switch | `src/components/Journey.astro` (`.mode`, `.keys`, `.prompt`) | Markup and styles |

- Collision: one mesh a set, in the set's own frame, built on the first switch to Walk (under a second for all thirteen). `three-mesh-bvh` (MIT), the one new dependency.
- Body: a capsule, radius 0.26, pushed out of walls across the floor only. Floor: five rays down. Up to six steps of 7 cm a frame, so a fast frame cannot pass through a wall.
- Solid is what is drawn: every visible set collides. Not solid (`ghost`): backdrops, skies, water, the crowd's cards, what moves by itself, swinging doors (they are lines that turn).
- Numbers (`ROAM`): eye 1.6 m, walk 2.4 m/s, run 4.4, pace eased at 10 a second, step up 0.27 m, drop 0.6 m, reach for a door 2.1 m, frame 74 degrees wide.
- A set that stands in two places (the 2020 room, his apartment) moves when the progress says so; he is carried with it, so the cut is not seen.
- His feet are on the floor at once; only the eye is eased (12 a second), so a stair taken at a run does not lose its next step.

## From the research (doc 45), applied

- The mouse raw, without the system's acceleration, where the browser has it (`requestPointerLock({ unadjustedMovement: true })`, plain lock when refused).
- A locked pointer's stray leaps (more than a third of the window in one event) are dropped.
- No layout is read in a walking frame: the cards' places are measured on the switch and on resize.
- macOS sends no keyup while Command is down: Command lets every held key go. So do losing the window, hiding the tab and freeing the mouse.
- The wheel, PageDown and the scroll bar do not move the page in Walk: it follows him.
- The legend names Esc. Escape frees the mouse first (the browser keeps that press), a second leaves Walk.

Not taken: collision meshes built in a worker (the switch blocks 0.6 to 0.8 s once, behind "preparing"); a wider frame (90 degrees against the scroll's 74): his eye decides.

## What the world needed

- The hall's south wall covered Volta's door from inside: turned round in the wing there was a black panel, and no way back. The door is now cut through that wall (`stageHall`), and the hall rebaked (`npm run stage:bake -- 11 128 2048 512 0`). The scroll's frames are unchanged.
- Nothing else blocked the story in either direction.

## Checked

- A bot that steers along the story's path, holds W and presses E where the stage offers something walked chapters 0 to 19.2 in one go, and back from the end to the top row of the lecture hall and from the jet bridge to his bed (`scripts/look/roam-bot.mjs`, `BACK=1`).
- 60 frames a second through the forward walk (3299 frames in 55 s, none slow).
- The round trip: Scroll, Walk, wheel and PageDown held off, Esc, Scroll again from the same place.
- Headless Chrome only. Pointer lock (the mouse look) cannot be tried there: it needs his Chrome.

## Known limits

- Beats that play while the scroll's camera stands still (the throw to the bin) play only as he walks through that place.
- Going back from the lecture hall to the aircraft is not offered: they join by the phone, not a door.
- Behind the Bean house and off the path on the walk the ground is open to him; where nothing is built the edge holds him.
- No touch controls.

## Tools

- `node scripts/look/roam.mjs <outdir> <chapter> <steps>`: keys by hand (`w:1500,left:400,e`), a frame and his position after each.
- `node scripts/look/roam-bot.mjs <outdir> [from] [to]`: walks the story; `BACK=1` the other way; stops where it cannot get on.
