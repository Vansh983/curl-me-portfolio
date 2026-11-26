# 53. Grass in the lab, and the passages' end walls (2026-10-22)

His word: "the 3d model still has some gaps where some walls are not connected like i see grass in the computer lab". Uncommitted, with the round before it (docs 50 to 52).

## Verdict

- From the lab, looking west down the passage, the 2010 room's floor was grass. Two causes, both fixed without touching a wall: the lawn's material carried a polygon offset (`layer: 2`, meant for the city's flat ground kilometres off), so grass 12 mm under the floor won the depth test at a grazing angle; and the lawn's low region under the room sloped back to level across its 36 m quad (its boundary corners took the level height), so under the room it was 1 mm low, not 12. No `layer` on the lawn now; the low region takes its grid lines inclusively.
- Beside that door, from the lab, a black strip the full height of the passage: the end wall round the door stood on the 2010 room's east wall plane, and Cycles baked its north half black (sampled: 0,0,0 against 178,134,77 on the south half). `corridor()` now stands that wall as a partition 2 cm inside the end (`END_IN`), with a reveal through the door. Sets 0, 1 and 2 rebaked (their passages share the builder); set 0's poster remade.
- Nothing else is open. The full scan is the same as doc 52's table (the Bean house's door onto the hall and Volta's wing by design); the scroll's 39 frames read whole; the roam bot walks chapters 0 to 5 through the new partitions.

## Checked

- `pins.mjs` (new, `scripts/look/`): Walk frames from inside the lab, the passage both ways, the 2010 room both doors, the lab's mouth, the brick passage both ways; live before the bake, baked after. `probe` named the grass (the lawn, group 10, 4 mm under the floor before, 12 mm after) and the black strip (the passage's end wall, front face).
- `leaks.mjs` all sets before, sets 0 to 2 after the bake: 0.06, 0.09, 0.77 percent, as before (the lab's residue is the facade's stub seen past the passage, doc 52).
- `roam-bot.mjs` 0 to 5: ok. `npm run check`, `build`, `test`: clean (one test had failed on three stray `set<i>_env.webp` the last bake left for sets without a panorama: deleted, and again after this bake).
- His Chrome: the lab looking west, planks and the lit passage.

## Traps written to the playbook

- Grass drawn over a floor: no polygon offset on any ground a room stands on; a lowered region of a ground takes its own grid lines inclusively; the scan cannot see it (a front face), a walk frame can.
- A passage's end wall baked black: never two faces on one plane across a bake, even back to back.
