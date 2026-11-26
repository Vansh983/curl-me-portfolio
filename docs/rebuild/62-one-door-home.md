# 62. One door home (2026-11-15)

"There are two doors between Floqer and my room. There should be just one. Just open the door up to the stairs and I enter the room."

First, scoped the graphic walker's `.held` rule to `.me .held` in `src/components/phone/Walker.astro`. A real 3D pickup now keeps the world, prompt and keycaps visible; putting it back works. The graphic walker's laptop, pointer, microphone, suitcase and degree still follow their activities. The separate Escape-immediately-after-Walk issue remains unchanged.

The brick doorway keeps its case and has no leaf, stop, swing timing, collision leaf or paired-door action. The stair door keeps its dimensions, world position, rotation and opening/closing times. Its live leaf and case now belong to set 0, alongside the passage, so they are present from the first frame even while Floqer's house is unloaded or hidden. Only opening that stair door reveals Floqer from the room. No set, stair, passage, camera key or room wall moved.

Files: `src/components/phone/Walker.astro:72`; `src/lib/stage/sets.ts:254`, `:356` and `:912`; `src/scripts/stage-run.ts:2160`, `:2208` and `:2231`. The existing ownership assertion in `tests/stage/walk.test.ts:156` now checks set 0 instead of set 12. No test added.

Checks on the existing server at 4321, headless Chrome only:

- Matched Scroll frames at chapters 0, 18.48, 18.72, 18.84, 18.96 and 19.2, plus Walk pins from the room, both directions in the passage, and the stair. The starting room's centre probe now hits the closed stair door 3.10m away through the open brick doorway, rather than the brick leaf 1.30m away.
- Delayed Floqer's model request: the stair leaf was already built with the opening four sets, while set 12 had no children. The open passage has its far door before the rest of the world loads.
- `leaks.mjs 0,12`: apartment 7 flagged rays before and after (11,520 / 12,192 rays); Floqer 14 before and after (65,184 rays). The exact existing prop-backface categories and counts match. No new doorway/void leaks; floor overlaps remain zero in both sets.
- `roam-bot.mjs`: forward 18 → 19.1 reached 19.186; backward 19.2 → 18 reached 18.016. Each used only the stair door. No action or collision at the brick opening.

Sheets: `.cache/one-door/before-sheet.png` and `.cache/one-door/after-sheet.png`. Individual frames, probes and audit logs are under `.cache/one-door/`; unbaked preview frames are under `after/live/`.

No rebake needed or performed: the changed door leaf and casings are runtime-built; baked shells, passage, stair, textures and models are untouched. The existing dev server was left running. No commit or push.
