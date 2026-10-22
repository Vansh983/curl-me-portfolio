# vanshsood.com

Vansh Sood's personal site: a paper-and-ink Astro site whose home page is a scroll-driven 3D journey through the rooms of his life (a three.js stage, 13 sets, one camera, a Walk mode). Static, deployed on Vercel from `main`; `canary` is the working branch.

## Read first

- `docs/rebuild/38-stage-playbook.md` before touching anything under `src/lib/stage`, `src/scripts/stage-*`, `scripts/look` or `public/assets/stage`. It holds the method, the conventions that bite, the bake commands, the tools and the trap table. The skill `.claude/skills/stage/SKILL.md` is its short form.
- `docs/rebuild/README.md` is the index of every round (docs 01 to 53): what was decided, why, and what he said. The latest rounds are 47 to 53.
- `src/data/things.ts`, `src/data/timeline.ts`: his words. Every figure, date, photo and logo on the site is his own and checked; nothing is invented.

## Map

| Where | What |
|---|---|
| `src/pages`, `src/layouts`, `src/components` | The Astro site: home (`index.astro` with `Journey.astro`), blog, now, archive, `curl` text routes (`index.txt.ts`, `llms*.txt.ts`) |
| `src/lib/stage` | The world as data and pure builders: `sets.ts` (13 sets, every placement), `dolly.ts` (camera keys), `world.ts` (where each set stands), `built.ts` and friends (code-built props), `materials.ts`, `assets.ts` (downloaded models, licences), `bake.ts` (baked or live) |
| `src/scripts/stage-run.ts` | The runtime: loading in story order, lights, the scroll's spring, the Walk mode, doors, the things in hand |
| `src/scripts/stage-roam.ts`, `stage-paint.ts`, `stage-weather.ts` | The walker, everything painted on canvases, the weather |
| `public/assets/stage` | Models and textures; `baked/set<i>.glb` + `set<i>_lm.webp` are Blender lightmaps (code changes to a baked set show only after a rebake) |
| `scripts/look/*.mjs` | Headless Chrome tools: frames by chapter, contact sheets, leak scan, walk frames, the roam bot. The dev server must be up on 4321 |
| `scripts/stage-bake.mjs` + `stage-bake.py` | Export a set from the running stage, bake in Blender, compress |
| `tests/` | Pure tests on the data and builders (`npm test`). Do not add tests for look: he judges by eye |
| `docs/rebuild` | Every round's doc; `ref/` holds reference photographs (never shipped) |

## Commands

```sh
npm run dev -- --port 4321     # the dev server the look tools expect
npm run check && npm run build && npm test   # the silent guards: report only a failure
node scripts/look/shots.mjs .cache/x 1.5 2 2.5   # frames by chapter (CARDS=1 as he sees it, LIVE=1 unbaked)
node scripts/look/leaks.mjs .cache/leaks all     # where a set leaks, from everywhere a walker stands
node scripts/look/pins.mjs .cache/p '<json>'     # walk frames from anywhere, probe what the eye hits
node scripts/look/roam-bot.mjs .cache/roam 0 5   # walks the story; stops where it cannot get on
npm run stage:bake -- <set> 128 2048 512         # rebake a set (see the playbook's table per set)
npm run stage:audit -- http://localhost:4322/    # against npm run preview (listens on ::1: use localhost)
```

## The working loop

Look before and after (capture the frames you will change), change, capture again, judge by eye, run the audits that fit the change, then the guards, then his Chrome, then write the round in `docs/rebuild/<n>-<slug>.md` and add it to the README index and the playbook's trap table if something new bit.

## His standing rules

- Replies: short, plain words, no em dashes, no tables in chat. Say what was seen in his Chrome and what only headless.
- Commit only when he asks; push only when he says so (to `canary`). Conventional commit messages, no attribution lines.
- Real models, real photographs, his own facts. No stick figures, no people unless asked, no banners or slogans, no explainer copy in the UI.
- Build only what he named; a flaw found nearby is fixed only if it is a plain defect in the thing he named, otherwise told in one line.
- Only things that can be picked up answer the pointer. He decides which things exist and their words.
