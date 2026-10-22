# 49. The world comes in behind him (2026-10-17)

## Decision

- The canvas shows after four sets, the apartment, the bedroom, the lab and the lawn, not after thirteen: the first three doorways stand open, with no leaf to hold shut, so those rooms come in together. The other nine come in behind him in the story's order, two at a time, and each set is warmed behind the frames once both its neighbours are in.
- A scroll past what is in holds the camera a step before the door into the next room begins to open; the door stays shut, and once the room is in the leaf swings on and the spring takes him through. Where there is no door (the phone's cut, the promenade's mist) he waits at the last station. In the Walk mode such a door is not his to open.
- The first four sets and the renderer's chunk come down with the page itself, not after the script runs.

## Measured (production build, served on localhost)

| | Before | After |
|---|---|---|
| The canvas shows | 8.4 s | 2.5 s |
| The whole world in and warm | 8.4 s | 8.3 s |
| Programs warmed before the walk | 392 | 414 |
| Downloads during the walk | none | none |
| Long tasks during the walk | none | none |
| GL errors | none | none |

The 36.7 MB and 101 requests are unchanged: nothing was shrunk here (that is doc 48's list). Phone tier: canvas 2.0 s, whole world 7.3 s, no errors, no stalls. On a 4 Mbit/s line with the page scrolled to the end at once (`scripts/look/stream.mjs`): canvas at 19 s, the camera waiting at the station before the lab's door and going on as each set lands, the whole world at 78 s, the end reached.

## How it works (`stage-run.ts`)

- `landed[]` is which sets are in. `held` is the scroll he may reach (`holdFor`): a step before the earliest door into the first set still to come begins to open, else the last station before its jamb, in `cur`'s units. The doors are read from the sets as written (`DOOR_SWINGS`), so a door that hangs in the set it leads into (Google's, in the 2020 room) is known before that set is in. The spring's goal is `min(target, held)`; the frame loop keeps running while he is held.
- A door carries `sides`, the two sets it joins (the set the scroll leaves as it starts to open, and the one it enters by the time it is open, else the next set entered when its entry comes close behind the swing; the brick door: home; Volta's street door joins set 10 to itself), and a `gate` that eases from 0 to 1 over 0.45 s once both sides are in. `open` is the scroll's swing times the gate.
- `prepare()`: sets 0 to 3 (`FIRST`), the shared things, the old warm loop for those four, `phone.prepare()`, then ready. Then `rest()`: `loadInOrder` of what is left, two at a time; on landing set i, `warmSet(i - 1)` is queued behind the frames; the last set queues itself and set 0 again (the ring closes).
- `warmSet(i)`: proxies of every mesh the frame in set i draws (the set, its ring neighbours, what is carried there, the sky) in a scene of their own under the ring's lights, `compileAsync` (parallel shader compile, no stall), textures up four a frame, draws of 64 into an 8 px target. The live scene is never touched.
- Walk mode (`stage-roam.ts`): `landed(set)` in the context; `facing()` skips a door whose sides are not both in; `roam.landed(i)` builds a set's collider when it lands after `prepare()`.
- `Journey.astro`: preload links for sets 0 to 3 (model and lightmap). `stage-delivery.mjs` names the renderer's chunk in the page head (`modulepreload`) at build time.
- Tools: `open()` and the audit wait for `__stage.allMs` (the whole world in and warm) so captures and the walk see everything; `__stage.readyMs` is the canvas, `__stage.loaded` the count.

## Traps met

- A set warmed alone compiled 284 programs and the walk stalled five times. The programs a set is drawn with depend on how many lights are in the frame, and the ring draws a set's two neighbours with it: warm the ring, under the ring's lights, once both neighbours are in. 414 programs, no stalls.
- Lights cloned per batch leave later batches' shadow samplers without a map: `GL_INVALID_OPERATION ... sampler type (signed/unsigned/float/shadow)`, twenty times. One warm scene per set, lights added once.
- Held at the jamb itself, the shut leaf fills the eye; held at the station before it, still a wall. Hold a step before the door begins to open: that is where the author put the camera to see the door.
- The first three doorways have no swinging leaf (the apartment's front door stands open, the bedroom's and the lab's are cased openings): held before them, the next room's absence showed as the air's colour through the opening. So the canvas waits for the first four sets.
- The dev server's first load is not a measurement (76 s cold, 2 s warm). Measure on `astro preview`.

## To test

- Chrome DevTools, Network, a slow profile. Reload, scroll fast. The camera waits at the last thing he looked at; the door opens when the room is in. Nothing pops.
- `?debug` and in the console `__stage.readyMs`, `__stage.allMs`, `__stage.loaded`.
- `node scripts/look/stream.mjs <dir> [kbit/s]` does the same headless and saves a frame at each landing.

## Open

- Held before Google's door on a slow line, the case shows grey: the leaf is the 2020 room's (set 4, placed in `DELHI` coordinates) and arrives with the room. The other doors hang in the set they lead out of.
- The Walk bot stops at chapter 6.6 in the auditorium (between the seat rows at the back) from a cold start, on this code and on the code before it alike; from chapter 6.3 it passes. Not this round's.

- The promenade (sets 8 to 10) has no doors. A runner on a very slow line could reach Volta before it is in; the flight's ride (20 s) covers it in practice.
- A download that fails after the canvas shows gets one more try after 3 s. After that the door stays shut and the console says so; there is no button then.
