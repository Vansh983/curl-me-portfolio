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
