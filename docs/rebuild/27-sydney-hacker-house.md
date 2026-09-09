# 27. Out to the right, into Sydney: the hacker house where Bean was built

2026-09-09. Frames: `.cache/syd4/` (baked). Set 7 `sydney`.

## Decisions

- **Chapter units.** Every stage-progress key is now `ch(c)` = c / `STAGE_SPAN` (shot.ts), c in chapter lengths. `STAGE_SPAN` is 8. Adding a set raises the span and nothing earlier moves on the scroll. Dolly keys, `FLIGHT`, `PHONE`, door and drop windows and the tests all use it; `APPROACH_SCALE` is `ch(4.2)`.
- **The auditorium was compressed** from chapters 5.26 to 7 into 5.26 to 6.64 (seated pause, rise, aisle, dais, podium hold) so the exit walk runs 6.64 to 7.06 and Sydney sits on the 2024 Bean card from 7.12. The 2025 card scrolls in over the room's last stretch; that is the chapter layout, not the stage.
- **The exit.** From the podium, right along the dais (west), down the step, through the front west door (x −1.4, z −15.8, 1.2 wide) straight into Sydney: no corridor. `doorLeafWide` in set 6 (the room being left), hinged on the north jamb, swings into Sydney over 6.86 to 7.0, ahead of the jamb at 7.06. The old closed, unwindowed leaf that stood in that doorway is gone.
- **The ring no longer wraps.** Neighbour visibility is by index distance only (`|k − i| ≤ 1`): set 7 would otherwise have shown through the Toronto studio's glass. The return to Toronto will need an explicit neighbour, not the wrap.
- **The room.** x −9.6..−1.4, z −19.4..−12, h 3, timber floor, plaster walls. A 3 by 1.4 m plywood table on pine trestles in the middle under two pendants; four mismatched chairs; the design laptop (`screenBeanApp`: pantry, this week, shopping in a design tool), the code laptop (`screenBeanCode`: the recipe-adapt endpoint streaming), the monitor with the Product Hunt page (`screenProductHunt`: Bean Recipe Adapt, #4 Product of the Day), the phone with the app (`screenBeanPhone`), a scanned laptop, mugs, papers, cables. The whiteboard on the north wall (`whiteboardBean`: pantry → recipes → the week → shopping, launch week's checklist, 700+ parents, 250 interviews). The kitchen run on the south wall (Bean started as "what is in your fridge"), a sofa, a mattress with cushions in the corner, boxes, a bin, shelves by the door, the poster (`beanPoster`: the mark, "The last meal planner you'll ever need"). A 4.4 by 2 m glazed window on the west wall; beyond it `sydneyHarbour`, a 40 by 15 m unlit painting 13 m out: the bridge, the Opera House, the city, a ferry.
- **Bean's identity** comes from the timeline and beantheapp.com (taglines "Your Kitchen Assistant", "The last meal planner you'll ever need"; UNSW among its programs, hence Sydney). The bean mark is drawn in code (`beanMark`); the site's own logo was not copied.
- Baked: `npm run stage:bake -- 7 128 2048 512 0.002` (3.9 MB, 388 KB lightmap).

## Verified

`npm test` 81 pass, `npm run check` 0 errors, `npm run build` ok, headless captures with no browser errors, a frame-difference scan of 0.80 to 1.0 with no spike above the walking baseline (top 62 at the dais step and the turn round the table).

## Open

- Vancouver, graduation, Toronto: sets 8+, each `ch()` keys after 7.62 and a raised span. Toronto needs an explicit neighbour to set 0.
- People in the hacker house and the auditorium: still blocked on licensed models.

## Second pass (same day)

He liked it and asked for less: a smaller room, no appliances, the desk, a couple of air mattresses, monitors and wires in the middle, a Bean logo at the back, and a real Opera House model much closer in the window.

- Room now x −7.4..−1.4, z −18.2..−13.2, h 2.9. Kitchen, sofa, bed, shelves, boxes, plant and poster gone.
- On the table: four monitors back to back down the middle (the app design, code, the Product Hunt page, recipe adapt), two laptops, two keyboards, the phone, mugs, papers, and `wires`: fourteen leads snaking between them, five dropping over the edge to a power strip on the floor. Three chairs.
- Two `airMattress` props on the floor along the north and south walls: flocked I-beam ribs, a pillow, a blanket thrown back.
- The window is 4.0 by 1.55 (sill 0.75); the `beanSign` (mark and wordmark) sits on the wall above it, the "back" wall as you enter. The whiteboard stays on the north wall, smaller.
- Outside: `harbourWater` from the wall out, the painted backdrop (bridge, city, ferry) 60 m off with its painted Opera House removed. **The Opera House model is not in yet:** the pick is Nick Reinhardt's hand-modelled "Sydney Opera House" on Sketchfab (uid 317b2d540f0a4f7e8d87dd3b0372712d, CC Attribution, 62k faces); the other downloadable ones are Google Earth rips. Sketchfab downloads need his login or API token. Place it about 60 m out, `live: 'city'`, `shadow: false`, credited in FLIGHT-CREDITS.md or a SYDNEY-CREDITS.md.
- Re-baked (1.8 MB).

## Third pass: the Opera House, the real logo, the table checked

- **The Opera House** is Nick Reinhardt's model from Sketchfab (CC BY 4.0), downloaded with his account into `.cache/polyhaven/sydney_opera_house/` (the manifest's new source kind `sketchfab`: the pipeline optimises from the cache and refuses to fetch). It was modelled for a night scene, so the manifest's `skin` gives its materials daylight at load (cream shells, stone podium, dark glass, no glow) and `drop` cuts its painted sky and its water. It stands 100 m off the window, broadside, 60 m tall; the painted harbour (bridge, city, ferry) is 150 m out and 480 m wide so nothing but sky and water shows from the glass; the set's fog colour is the painted sky's blue. The walk now ends at the glass looking out at it.
- **The logo** is Bean's own from beanmeals.com (`public/assets/stage/bean-logo.png`, drawn by `beanLogo()` once loaded): the sign above the window, the whiteboard, the phone, the Product Hunt page. The invented green bean is gone.
- **The table, checked from both ends** (`.cache/syd9/tbl.png`): four 2010s monitors (`monOld`: thick bezels, a chin, a deep back, an oval base; one greyed beige) 0.55 m from each edge facing their chairs, keyboards in front of them, both laptops on the top, and the wires laid the way wires are laid: each monitor's leads to the spine down the middle, the spine over the south-east corner to the strip, each keyboard's lead to its monitor, each charger to the spine. The earlier pass had a laptop off the edge and random spaghetti; the frames were not checked closely enough.
- Re-baked (1.8 MB).

## Fourth pass: the Opera House at full size, on land

The Sketchfab model is a 1:4.9 miniature (the shells 12 m tall) and its bounds were inflated by a leftover sky plane, so at scale 1.3 it was a 15 m toy floating over the water. Now: `drop` also cuts `Object_15` and `Object_17` (the sky plane and the camera), the scale is 4.9 (shells 60 m, podium 184 m, as built), and it stands on `bennelongPoint`, a paved 220 m headland with a stone quay edge at y 0.3 that runs from the water 40 m off the window back to the painted shore. Its near edge is 70 m from the glass; the painted harbour is 260 m out and 800 m wide so nothing but sky and water shows round it. The harbour props (`harbourWater`, `bennelongPoint`, `sydneyHarbour`) are in `DROP_PROP`: never baked, always built live. Frames of the whole beat: `.cache/syd11/walk.png`.
