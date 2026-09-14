# The tour as a row: real things close on the right (2026-09-14)

He said, after the Googleplex landed: fix Vancouver the same way, real researched models, not "this crap in the back"; better transitions between cities; never look left while walking; "like a ramp: you're walking right and on the right the city things should be closer so people don't have to zoom".

## Verdict
- Keep the walk line (out of the Sydney door, north along the terrace, into the wing door). Drop the house wall north of the room: the right side opens into the city's plaza.
- Each city's real things stand in a row on the right, 4 to 15 m off the walk, in its own stretch of the terrace: Vancouver z -18 to -4, Toronto -4 to 10, Halifax 10 to 24. One row, all in the middle set, always in view: nothing swaps.
- The eye looks ahead and a little right all the way. The water and the far shore stay on the left, unlooked at.
- Transitions: the paving continues; a planter line crosses the plaza between stretches; the sky and sun crossfade (the soft thresholds that exist); the laptop's page turns.

## Real models found (3D Warehouse, glb downloads open, licence 3DW)

Vancouver, the Convention Centre waterfront (Web Summit's venue), all real objects of Jack Poole Plaza:
- Digital Orca `97dd587e` (Eric S., 2022): Douglas Coupland's pixel orca, 9.4 m, 11.5k tris, no textures. Close on the right.
- Olympic Cauldron `c53ea833` (jago716, 2010): the 2010 cauldron with its plaza and flames, 559 tris. Or `66aad966` (Jasper L., 9k tris, 13 textures).
- Vancouver Convention Centre West `cfa8cd8f` (3D Warehouse staff, 2010): 257 by 184 m, photo textured, 625 tris. Its corner close, the front receding at 45 degrees.
- Harbour Centre `e6fc5c97` (Ben, 2006): the tower, 174 m, 787 tris. Behind.
- Canada Place `88671b8a` (vojo, 2007): toy scale, would need x30; the authored sails stay.
- Lions Gate Bridge `366552e0` (Andrew K., 2009): 7 MB, 40 textures, 1.4 km; not for this walk.
- The North Shore (northshore.ts, real elevation) stays across the water on the left.

Toronto, Elevate week:
- TTC CLRV streetcar `c80d6a22` (2007): the red car, 14k tris, 7 textures, 15 m. On a short track close on the right.
- Union Station `377e3a48` (2006): the Front Street facade, 15.8k tris, 12 textures, 537 m. Its corner close, receding.
- CN Tower `51cbd137` (2012): 553 m, 5.3k tris. Behind, ahead-right (city.ts has one too).
- Toronto City Hall `a0eeeda2` (2008): 1.8k tris. Optional, behind.

Halifax, Volta:
- The Maritime Centre `b5fd4495` (2009): 1505 Barrington, the tower Volta is in; 2.9k tris, 6 textures, 99 m. Its corner close.
- Halifax Town Clock `f98e09fd` (2008): 258 tris, 31 textures, 14 m. Close on the right.
- Purdy's Wharf Tower 2 `dcccf636` (2008): 176 tris, 64 textures. Behind.
- Dalhousie Computer Science building `6bf2bc20` (2007): the Goldberg building, 265 tris, 12.8 MB of textures (would be capped). For the degree, later.
- Theodore Too `e699bf17`: left Halifax in 2021; not used.

Contact sheets: `.cache/fame2/van-warehouse.png`, `.cache/fame2/tor-hal-warehouse.png`. Sketchfab needs his account; nothing from it.

## What stays of his
- The Bean booth with the day's numbers (Vancouver), the logo boards (Web Summit, Elevate, Volta, Invest NS, Product Hunt) on posts along the right, the laptop in hand.
- The Sydney window still looks west over the terrace and the harbour.

## Built (2026-09-14, 00:10)
- `TERRACE.plaza` (sets.ts): north of z -12 the paving runs west to x -34; `terrace` in built.ts lays the L, the glass balustrade round its water edge, the cliff under both; the planters against the house are gone, so are the logo boards and the booth on the wall.
- The row lives in set 9 (Toronto's), in view from Vancouver's set to Halifax's: the Bean booth, the Digital Orca, the Olympic Cauldron (scale 0.6), the Convention Centre and Harbour Centre far right; a TTC streetcar at 60 degrees across the plaza, the Elevate photo on a stand, Union Station behind; the Demo Day photo, the Town Clock beside the door, Purdy's Wharf twice behind. `plazaPlanter` hedges 1.6 m tall between the stretches, so the next city waits behind them.
- The walk looks ahead and 2.2 m to the right the whole way (`walk()` in dolly.ts); the sky thresholds moved to the sixth and fourteenth keys (z -7 and 8.2); no glances.
- `scripts/gltf-trim.mjs`: drops nodes wider than a limit, keeps only nodes in a box, drops Google Earth snapshot primitives, makes every material plain (SketchUp exports them metallic and tints textured ones), recentres on the bottom; the trimmed glbs sit in `.cache/polyhaven/<id>/` for the pipeline. Eight models, 1.2 MB together.
- His photos: from his LinkedIn posts, captured in his Chrome (the image urls are signed and blocked to scripts): Elevate (the festival wall, October 2025) and Collect. Demo Day at Volta (January 15, 2026, the poster's date). `public/assets/stage/photos/`, paint `photo`, `photoBoard()`.
- Facts corrected on the way: Demo Day was January 15, 2026 (not February); Volta is at 1800 Argyle Street, Suite 801 (the Armoyan Centre by the Scotiabank Centre), not the Maritime Centre; so the Maritime Centre model is not used.
- Still wanted: a Web Summit Vancouver 2025 photo of his (none found by search), Toronto and Vancouver at the plaza scale beyond what is there.
