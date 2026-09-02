# Journey stage: the perfect pass (2026-09-01)

Vansh's brief, from a live review in his Chrome: none of the screens are finished. Every frame,
including the doorways, has to be right. This is the ordered list; each step is verified in his
Chrome (tab in front, two screenshots) and committed on its own.

## 1. Toronto, now (set 0) — done 2026-09-01
- He lives high up: the eye must sit above most rooftops. Near towers 30 to 100 m (a few to 140),
  the far city lower still, so the lower half of the window is city and the upper half is sky.
- The CN Tower must be in the window from the hero shot: it stays at 520 m, 10 degrees right of the
  window normal, and nothing in front of it reaches its pod.
- The room much darker: environment 0.08 to 0.035, hemisphere 0.14 to 0.07, exposure 0.85 to 0.72,
  the lamp and the monitor light halved. The lamp lights the desk, not the wall.
- The chair was back to front (its back between him and the desk): rotate it 180.

## 2. Him in every room, dressed for the year — done (standing pose is the rest pose with limbs brought under him; no standing clip in the rig)
- Placement gets `outfit`: `kid` (2010, scale 0.66, red tee, shorts), `school` (2013, scale 0.82,
  white shirt, dark tie, grey trousers), `trip` (2018, scale 0.96, black hoodie, lanyard, Google
  tee), `now` (hoodie, as built). The hoodie parts only for `trip` and `now`.
- 2010: on a pouf on the rug facing the TV, the gamepad in his lap.
- 2013: at the front left desk, facing the monitor.
- 2018: at the rail in front of the Google sign (the sitting clip on the low wall until a standing
  clip lands; then standing at the rail as in the photo).

## 3. Computers of the right year — done
- Lab: the CRT televisions go; a built `labMonitor` (19 inch 5:4 LCD, black bezel, stand) per
  desk and a black `pcTower` under each desk. His screen shows Notepad with index.html.
- 2010: the CRT goes; a built `flatTv` (32 inch, black bezel, the video on the glass) on the table.

## 4. San Francisco, 2018: the real place — done, first pass
Reference: his photo at the Google San Francisco sign on the Embarcadero, the Bay Bridge behind.
- The white sign on its planter (Google logo, "San Francisco"), the hedge, the concrete wall, the
  brown handrail, the sidewalk.
- The Embarcadero: road, a few cars, blue Embarcadero lamp posts, palm trees, low white buildings
  across the street, the Bay Bridge (grey, two towers, double deck) over the water to the right.
- Sky with a few clouds. Him at the rail.
- The dolly's last keys re-aimed: out of the lab door onto the sidewalk, turn, the sign and the
  bridge, end on him.

## 5. Doorways — done: lab door frame; a 26-frame audit fixed the hutch clip (q 0.16) and the head clip (q 0.60); portrait crop keeps heads in frame
- The lab exit shows no jamb: a door frame and a thicker wall so the frame is jamb for a moment.
- Every doorway checked at 5 stops each side.

## 6. Words from LinkedIn — done
- timeline.ts filled from his profile (Floqer Head of Engineering Apr 2026, Founding Engineer Oct
  2025; Bean CTO May 2024 to Apr 2026, #4 Product Hunt, Invest NS, Web Summit Vancouver; ShiftKey
  Labs Technical Lead 2022 to 2025; Webcube 2020 to 2024, 200k revenue, 45 companies, founded at
  17; Dal research, co-op, health admin dashboard; Gig Empower; Google Code-in 2018, one of 52
  winners, Drupal, the trip with his dad).

## Review recipe
- Chrome MCP: `__q(q)` scrolls to stage progress q; screenshot once to wake the tab, wait 2 s,
  screenshot again. A background tab pauses requestAnimationFrame, which is why frames lag or the
  page looks frozen when the window is behind.
- Headless: `.cache/shoot.mjs out q...` for many stops fast.

## Audit recipe (2026-09-01)
- `node .cache/shoot.mjs audit $(python3 -c "print(' '.join(f'{i/25:.3f}' for i in range(26)))")` then
  `node .cache/sheet.mjs sheet.png 3 audit/*.png` for a contact sheet (images embedded as data URIs; file:// images do not load in headless).
- Portrait: `W=390 H=844`, sheet with `AR=2.164` and 6 columns.
