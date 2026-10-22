---
name: stage
description: Use before any change to the 3D journey (src/lib/stage, src/scripts/stage-*, scripts/look, public/assets/stage, a bake): the method, the tools, the traps, what he judges.
---

# Working on the stage

Read `docs/rebuild/38-stage-playbook.md` in full first; this is its checklist. History by round: `docs/rebuild/README.md`.

## Before touching anything

1. Dev server up on 4321 (`npm run dev -- --port 4321`). If the stage does not start (`Outdated Optimize Dep` in the page), `rm -rf node_modules/.vite` and restart with `--force`.
2. Capture what he sees before the change: `CARDS=1 node scripts/look/shots.mjs .cache/before <chapters>`; for a place off the scroll's line, `node scripts/look/pins.mjs` (a walk frame from anywhere, `probe` names what the eye hits).
3. Find the set and the placement in `src/lib/stage/sets.ts`; check whether the set is baked (`baked: true`): then geometry and material changes show only after a rebake, `LIVE=1` previews them unbaked.

## Changing

- Rooms are single-sided planes; a wall seen from behind is invisible. Walking toward +z, +x is on the left. A door is a case plus a leaf (`DOORS`, `doorway()`), never a bare leaf.
- Every set stands in one place (`world.ts`); sets drawn together must not overlap.
- Never two faces on one plane across a bake (a wall baked black); never a polygon offset on ground a room stands on (grass drawn over a floor).
- Thin dark things on lit walls, wide ground, leafy models: `CONTEXT_PROP` (lit live, in Blender only for shadow).
- Things he can pick up: `thing` on a placement, words in `src/data/things.ts`, his words only; only things answer the pointer.

## After

1. `LIVE=1` frames, then rebake what is baked (the playbook's bake table; copy the old `set<i>.glb` and `_lm.webp` to `.cache/` first; delete any stray `set<i>_env.webp` for a set without `bakedEnvironment`; after set 0, `node scripts/look/poster.mjs`).
2. Frames after, on a sheet (`sheet.mjs`, absolute output path), read them.
3. Audits that fit: `leaks.mjs` after any wall, door, backdrop or place change (zero before a bake where it was zero); `roam-bot.mjs` after any wall, door or furniture change; `void.mjs` for what is not built; `marks.mjs` for the walk's marks.
4. `npm run check`, `npm run build`, `npm test`: silent guards.
5. His Chrome, then the round's doc in `docs/rebuild/`, the README index, the playbook's trap table.
