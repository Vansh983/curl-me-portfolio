# 25. Review: the flight, the phone, the auditorium

2026-09-08. Frames: `.cache/review-flight/q*.png` (1280×800, `?debug&tier=1`, baked page). Errors: none.

## Verdict

Not good enough to ship. The flight does not fly, the phone is a slab, the auditorium is dim and empty, and a third of the scroll is a frozen frame. Rebuild the sequence as motion, not as a set of stills.

## Flight (set 5, q 0.65 to 0.82)

- The window view never changes. q 0.724 to 0.806 holds one pose (`WINDOW_VIEW`, five identical dolly keys). Frames 0.73, 0.76, 0.785, 0.795 are the same picture with a caption change.
- The plane is at 55 m over the campus for the whole flight (`FLIGHT.altitude`), with 64 m of sideways drift. That is a hover, not a flight. No descent, no bank, no ground sliding past, no wing.
- The sky is a static photo panorama with clouds on the horizon while the cabin is 55 m up. The two do not agree.
- The campus is grey boxes on flat green with a tiled blue box for Goldberg. Reads as a toy from this close. Either go higher (600 m descending to 200 m, where boxes read as a city) or model the near buildings properly.
- Boarding: q 0.64 is a bare beige wall filling the frame, q 0.66 a plain box corridor. The "2022 / A NEW CHAPTER  DELHI → HALIFAX  WELCOME ABOARD" banner hangs inside the cabin like a poster. Gimmick. Put the route on a gate screen or a boarding pass, not on the cabin wall.
- Cabin: seats are fine, walls are flat beige, windows oversized, no seat-back screens, no tray table, no overhead bin detail, no wing outside.
- The 2022 Halifax card appears while still in the seat, before anything Halifax is on screen.

## Phone (q 0.778 to 0.83)

- A black slab with a screen texture. No bezel highlight, no glass, no status bar, no thickness read. Frame 0.805.
- It rises from nowhere. It should come off the tray table or out of a pocket line.
- Screen content is a Data Structures board and a code laptop. Fine for arrival, but the phone sits still for 0.793 to 0.801 with nothing happening on it.
- The zoom through the screen and the cut at 0.822 work. Keep that mechanism.

## Auditorium (set 6, q 0.83 to 1)

- Lit flat and dark: three ceiling strips, no downlights on the tiers, the board is the only bright thing. Frame 1.000.
- Frozen for 17% of the scroll (0.83 to 1.0). Chapters 2023 and 2024 scroll over one still.
- Empty. 96 seats, nobody in them. Blocked on people models, but the empty hall is the single biggest reason it feels dead.
- Seats read well at a distance (burgundy, timber shells). Front dais is shallow and the lectern off centre, as the handoff says.
- Board says Data Structures. The next beat is teaching Gen AI from the podium, so the front needs a projector screen and the board a second face.

## What to do, in order

1. Flight as motion: descend from 600 m to 150 m over 0.70 to 0.80, ground and cloud layer sliding past the window, a wing in frame, a slight bank on the turn to the campus. Cloud layer as a scrolling alpha plane, sky photo behind it.
2. Cabin dressing: tray table with the phone on it, seat-back screen showing the route map, wing outside, smaller windows. Drop the cabin banner.
3. Phone: rounded body, glass with a reflection, status bar, picked up from the tray. Keep the zoom and cut.
4. Auditorium: downlights per tier, a warm key on the front, a projector screen. Use the frozen 17% for the seated pause, the walk down, the turn.
5. Chapter timing: 2022 card on the campus view, 2023 on the auditorium. Re-check after the dolly changes.
6. Students once model access is settled.
