# Journey stage v3 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the code-built, morphing, toon-lit stage with three photoreal sets (2010 Delhi room, 2013 school lab, 2018 plaza by the bay) lit by HDRIs, dressed with scanned CC0 models and textures, joined by one camera dolly that changes set inside doorways.

**Architecture:** A manifest (`assets.ts`) names every Poly Haven asset; a node script fetches, optimises and writes them under `public/assets/stage/` with a credits file. Pure modules describe the world (`sets.ts`: shells, placements, light; `dolly.ts`: the camera path and the doorway blend) and are tested in node. `stage-run.ts` is rewritten around loaded GLBs, HDRI environments, scanned materials on code-built shells, live motions (fan, TV, curtains, tube, water) and the dolly. Morph keys, `Actor`, `env.ts` blending and the figure mount go.

**Tech Stack:** three 0.185 (`GLTFLoader`, `MeshoptDecoder`, `RGBELoader`, `PMREMGenerator`, `EffectComposer`, `GTAOPass`, `OutputPass`, `FXAAPass`), `@gltf-transform/cli` 4.4 via `npx`, node `--test`, Astro 7.

**Spec:** `docs/rebuild/13-journey-real-spec.md`

## Global Constraints

- Assets: Poly Haven only (CC0), fetched by `scripts/stage-assets.mjs`; outputs committed under `public/assets/stage/`; sources cached in `.cache/polyhaven/` (gitignored). Every asset has `licence: 'CC0'` and an `author`.
- Budget: under 6 MB per set, under 18 MB total, all behind the existing lazy `import()` in `Journey.astro`. First paint unchanged.
- Look: no bloom, no grade, no `envMapIntensity` above 1, matte unless the scan says otherwise. ACES tone mapping, GTAO and FXAA stay. Exposure per set.
- Motion: nothing morphs, nothing changes opacity, no cuts. Set changes happen inside doorways. Reduced motion snaps to the nearest set.
- Local commits only. Never `git push`.
- Tests: `npm test` (node --test), `npx tsc --noEmit`, `npx astro check` all clean before each commit.
- Review: screenshots via the scratchpad `shoot.mjs` (`node shoot.mjs 1440 900 light "0,0.1428,0.2857"`) after every visual task; Vansh reviews the live page at http://localhost:4321.

---

## World layout (shared by every task)

Metres, y up. The three sets lie along +x, joined by doorways in +x walls.

```
Set 0 ROOM     x -2.2..2.2   z -2.5..2.5   h 2.8   door on +x wall at z 1.6 (0.9 w, 2.05 h)
Passage        x  2.2..5.2   z  1.0..2.2   h 2.4   dark, one bulb
Set 1 LAB      x  5.2..12.2  z -1.5..4.5   h 3.0   door in from -x wall at z 1.6, door out on +x wall at z 3.4
Set 2 PLAZA    x 12.2..80    z -60..20     open    floor y 0, bay water beyond z < -22, bridge at z -120
```

Stage progress `q` (0..1, from `stageProgress(p, chapters, 3)`): stations at q = 0, 0.5, 1. `locate(q, 3)` rests 30% of each gap on a station. Inside a gap the dolly runs its keys between the two station keys.

Dolly keys (position, look, fov, set, blend) in `dolly.ts`:

```
q 0.00  cam (0.3, 1.15, 2.1)   look (0, 0.95, -2.3)   fov 46  set 0        the room, the TV
q 0.20  cam (1.4, 1.2, 1.7)    look (2.6, 1.2, 1.6)   fov 50  set 0        turning to the door
q 0.27  cam (2.6, 1.2, 1.6)    look (4.5, 1.2, 1.6)   fov 54  set 0 blend 0.0   door jamb
q 0.32  cam (3.7, 1.2, 1.6)    look (5.6, 1.2, 1.6)   fov 54  set 1 blend 1.0   mid passage (swap here)
q 0.38  cam (5.4, 1.25, 1.6)   look (7.5, 1.1, 0.4)   fov 50  set 1        into the lab
q 0.50  cam (6.6, 1.35, 2.6)   look (8.2, 1.0, 0.6)   fov 46  set 1        over the desk, the CRT
q 0.70  cam (9.5, 1.3, 2.8)    look (12.4, 1.2, 3.4)  fov 50  set 1        to the far door
q 0.77  cam (12.1, 1.3, 3.4)   look (14, 1.3, 3.4)    fov 54  set 1 blend 0.0   door jamb
q 0.82  cam (13.4, 1.35, 3.4)  look (16, 1.4, 1.5)    fov 54  set 2 blend 1.0   just outside (swap)
q 1.00  cam (16.5, 1.6, 6.5)   look (24, 1.6, -12)    fov 48  set 2        the plaza, sign, bridge
```

`blend` is only set on doorway keys; between a `blend 0` key and the next `blend 1` key the environment intensity dips to 0.12, fog lerps, and at blend 0.5 the environment, background, sun and exposure swap to the next set.

---

### Task 1: Asset manifest and fetch script

**Files:**
- Create: `src/lib/stage/assets.ts`
- Create: `scripts/stage-assets.mjs`
- Create: `tests/stage/assets.test.ts`
- Modify: `.gitignore` (add `.cache/`)
- Modify: `package.json` scripts (add `"stage:assets": "node scripts/stage-assets.mjs"`)

**Interfaces:**
- Produces: `export type AssetKind = 'model' | 'hdri' | 'texture'`; `export interface Asset { id: string; kind: AssetKind; res: '1k' | '2k'; licence: 'CC0'; author: string; use: string; maxTex?: 512 | 1024 }`; `export const ASSETS: Asset[]`; `export const assetUrl(a: Asset): string` returning `/assets/stage/<id>.glb` for models, `/assets/stage/<id>_<res>.hdr` for HDRIs, `/assets/stage/tex/<id>` (a folder prefix; files `<id>_diff.webp`, `<id>_nor.webp`, `<id>_arm.webp`) for textures.

- [ ] **Step 1: Write the failing test**

```ts
// tests/stage/assets.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { ASSETS, assetUrl } from '../../src/lib/stage/assets.ts';

test('every asset is named once, credited, and CC0', () => {
  const ids = new Set<string>();
  for (const a of ASSETS) {
    assert.ok(!ids.has(a.id), `${a.id} twice`);
    ids.add(a.id);
    assert.equal(a.licence, 'CC0');
    assert.ok(a.author.length > 1, `${a.id} author`);
    assert.ok(a.use.length > 3, `${a.id} use`);
    assert.match(a.id, /^[a-z0-9_]+$/i);
  }
});

test('urls are under /assets/stage and follow the kind', () => {
  for (const a of ASSETS) {
    const u = assetUrl(a);
    assert.ok(u.startsWith('/assets/stage/'), u);
    if (a.kind === 'model') assert.ok(u.endsWith('.glb'));
    if (a.kind === 'hdri') assert.ok(u.endsWith(`_${a.res}.hdr`));
    if (a.kind === 'texture') assert.ok(u.endsWith(`/tex/${a.id}`));
  }
});

test('the built files exist once the fetch has run', { skip: !existsSync('public/assets/stage/CREDITS.md') }, () => {
  for (const a of ASSETS) {
    const u = assetUrl(a);
    const files = a.kind === 'texture' ? ['_diff.webp', '_nor.webp', '_arm.webp'].map((s) => `public${u}${s}`) : [`public${u}`];
    for (const f of files) assert.ok(existsSync(f), f);
  }
});
```

- [ ] **Step 2: Run it, expect a module-not-found failure**

Run: `node --test --experimental-strip-types tests/stage/assets.test.ts` (or `npm test`). Expected: FAIL, cannot find `assets.ts`.

- [ ] **Step 3: Write the manifest**

```ts
// src/lib/stage/assets.ts
// Every scanned thing on the stage, by name. The fetch script turns this into files under
// public/assets/stage/ and a credits file; the runtime only ever asks assetUrl().
export type AssetKind = 'model' | 'hdri' | 'texture';
export interface Asset {
  id: string; // the Poly Haven slug
  kind: AssetKind;
  res: '1k' | '2k';
  licence: 'CC0';
  author: string;
  use: string; // where it goes, for the credits file
  maxTex?: 512 | 1024; // models: cap on texture size after optimisation (default 1024)
}

const model = (id: string, author: string, use: string, maxTex?: 512 | 1024): Asset => ({ id, kind: 'model', res: '1k', licence: 'CC0', author, use, maxTex });
const hdri = (id: string, author: string, use: string, res: '1k' | '2k' = '1k'): Asset => ({ id, kind: 'hdri', res, licence: 'CC0', author, use });
const tex = (id: string, author: string, use: string): Asset => ({ id, kind: 'texture', res: '1k', licence: 'CC0', author, use });

export const ASSETS: Asset[] = [
  // light
  hdri('small_empty_room_1', 'Sergej Majboroda', '2010: the room, afternoon sun through a window'),
  hdri('school_hall', 'Sergej Majboroda', '2013: the lab, tube light and a high window'),
  hdri('golden_gate_hills', 'Greg Zaal', '2018: the plaza, the sky and the Marin hills', '2k'),
  // 2010, the room
  model('television_02', 'Benny Weimer', 'the CRT television, and scaled down, the lab monitors'),
  model('ceiling_fan', 'Poly Haven', 'the ceiling fan'),
  model('gaming_console', 'Poly Haven', 'the Xbox 360'),
  model('gamepad', 'Poly Haven', 'the controller on the rug', 512),
  model('football', 'Poly Haven', 'the football', 512),
  model('wooden_bookshelf_worn', 'Poly Haven', 'the shelf'),
  model('decorative_book_set_01', 'Poly Haven', 'the books on the shelf', 512),
  model('hanging_picture_frame_01', 'Poly Haven', 'the Jobs poster frame', 512),
  model('throw_pillows_01', 'Poly Haven', 'cushions on the rug', 512),
  // 2013, the lab
  model('SchoolDesk_01', 'Poly Haven', 'the lab desks'),
  model('SchoolChair_01', 'Poly Haven', 'the lab chairs'),
  model('wall_clock', 'Poly Haven', 'the clock', 512),
  // 2018, the plaza
  model('street_lamp_01', 'Poly Haven', 'the lamp post'),
  model('modular_street_seating', 'Poly Haven', 'the bench'),
  model('island_tree_01', 'Poly Haven', 'the trees by the plaza'),
  // surfaces on code-built shells
  tex('plank_flooring', 'Rob Tuytel', 'the room floor'),
  tex('painted_plaster_wall', 'Rob Tuytel', 'the room and lab walls'),
  tex('ceiling_interior', 'Rob Tuytel', 'the ceilings'),
  tex('old_linoleum_flooring_01', 'Rob Tuytel', 'the lab floor'),
  tex('concrete_pavement', 'Rob Tuytel', 'the plaza'),
  tex('dirty_carpet', 'Rob Tuytel', 'the rug'),
  tex('cotton_jersey', 'Rob Tuytel', 'the curtains'),
  tex('leafy_grass', 'Rob Tuytel', 'the hills'),
];

export const assetUrl = (a: Asset): string =>
  a.kind === 'model' ? `/assets/stage/${a.id}.glb`
  : a.kind === 'hdri' ? `/assets/stage/${a.id}_${a.res}.hdr`
  : `/assets/stage/tex/${a.id}`;

export const asset = (id: string): Asset => {
  const a = ASSETS.find((x) => x.id === id);
  if (!a) throw new Error(`no asset ${id}`);
  return a;
};
```

Authors are read from `https://api.polyhaven.com/info/<id>` (`authors` keys) by the script; the script rewrites the credits from the API, the manifest values are the fallback. Correct any author in the manifest after the first run (Step 6 prints them).

- [ ] **Step 4: Run the first two tests, expect PASS; the third is skipped**

- [ ] **Step 5: Write the fetch script**

```js
// scripts/stage-assets.mjs
// Fetches every asset in the manifest from Poly Haven, optimises it, writes it under
// public/assets/stage/ and writes CREDITS.md. Idempotent: sources are cached in .cache/polyhaven.
import { mkdir, writeFile, readFile, stat, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import sharp from 'sharp';

const { ASSETS, assetUrl } = await import('../src/lib/stage/assets.ts');
const CACHE = '.cache/polyhaven', OUT = 'public/assets/stage';
const api = async (p) => (await fetch(`https://api.polyhaven.com${p}`)).json();

async function fetchTo(url, file) {
  if (existsSync(file)) return;
  await mkdir(path.dirname(file), { recursive: true });
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  await writeFile(file, Buffer.from(await r.arrayBuffer()));
}

const credits = [];
let total = 0;
const size = async (f) => (await stat(f)).size;

for (const a of ASSETS) {
  const info = await api(`/info/${a.id}`);
  const author = Object.keys(info.authors ?? {})[0] ?? a.author;
  const files = await api(`/files/${a.id}`);
  const out = `public${assetUrl(a)}`;
  if (a.kind === 'model') {
    const g = files.gltf[a.res].gltf;
    const dir = `${CACHE}/${a.id}`;
    const src = `${dir}/${path.basename(g.url)}`;
    await fetchTo(g.url, src);
    for (const [rel, f] of Object.entries(g.include)) await fetchTo(f.url, `${dir}/${rel}`);
    if (!existsSync(out)) {
      await mkdir(path.dirname(out), { recursive: true });
      execFileSync('npx', ['--yes', '@gltf-transform/cli', 'optimize', src, out,
        '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', String(a.maxTex ?? 1024),
        '--simplify', 'false', '--instance', 'false', '--palette', 'false'], { stdio: 'inherit' });
    }
    total += await size(out);
  } else if (a.kind === 'hdri') {
    const url = files.hdri[a.res].hdr.url;
    const src = `${CACHE}/${a.id}/${path.basename(url)}`;
    await fetchTo(url, src);
    await mkdir(path.dirname(out), { recursive: true });
    await copyFile(src, out);
    total += await size(out);
  } else {
    // three maps: colour, normal (gl), and arm (ao, roughness, metal packed in r, g, b)
    const maps = { diff: files.Diffuse, nor: files.nor_gl, arm: files.arm };
    await mkdir(path.dirname(out), { recursive: true });
    for (const [k, m] of Object.entries(maps)) {
      const url = m[a.res].jpg.url;
      const src = `${CACHE}/${a.id}/${path.basename(url)}`;
      await fetchTo(url, src);
      const dst = `${out}_${k}.webp`;
      if (!existsSync(dst)) await sharp(src).webp({ quality: k === 'diff' ? 82 : 90 }).toFile(dst);
      total += await size(dst);
    }
  }
  credits.push(`- \`${a.id}\` (${a.kind}) by ${author}, CC0, https://polyhaven.com/a/${a.id}. ${a.use}.`);
  console.log(a.id, author);
}
await writeFile(`${OUT}/CREDITS.md`, `# Stage assets\n\nAll from [Poly Haven](https://polyhaven.com), CC0. Optimised by scripts/stage-assets.mjs.\n\n${credits.join('\n')}\n`);
console.log(`total ${(total / 1e6).toFixed(1)} MB`);
```

`sharp` is already a transitive dependency of Astro (`node_modules/sharp`); if `import 'sharp'` fails, `npm i -D sharp` and say so. The `.ts` import works because the repo runs tests with strip-types; if node refuses, run the script with `node --experimental-strip-types scripts/stage-assets.mjs`.

- [ ] **Step 6: Run it**

Run: `npm run stage:assets`. Expected: one line per asset with its author, `total N MB` under 18. Check `public/assets/stage/` and `CREDITS.md`. Fix authors in the manifest to match the printed ones.

- [ ] **Step 7: Run the tests, all three now pass**

- [ ] **Step 8: Commit**

```bash
git add src/lib/stage/assets.ts scripts/stage-assets.mjs tests/stage/assets.test.ts .gitignore package.json public/assets/stage
git commit -m "feat(stage): asset manifest, Poly Haven fetch and optimise, credits"
```

---

### Task 2: Sets and the dolly (pure data, tested)

**Files:**
- Create: `src/lib/stage/sets.ts`
- Create: `src/lib/stage/dolly.ts`
- Create: `tests/stage/sets.test.ts`
- Create: `tests/stage/dolly.test.ts`

**Interfaces:**
- Produces (`sets.ts`):

```ts
export type V3 = [number, number, number];
export interface Opening { wall: 'x+' | 'x-' | 'z+' | 'z-'; at: number; w: number; h: number; sill?: number } // at: along the wall, sill: bottom height (0 for a door)
export interface Shell { x: [number, number]; z: [number, number]; h: number; floor: string; wall: string; ceiling?: string; openings: Opening[]; tile: { floor: number; wall: number } } // tile: metres per texture repeat
export type Live = 'fan' | 'tv' | 'monitor' | 'tube' | 'curtain' | 'water' | 'bulb';
export interface Placement { model?: string; build?: string; at: V3; rot?: V3; scale?: number | V3; live?: Live; cap?: string; href?: string; shadow?: boolean }
export interface SunSpec { dir: V3; color: string; power: number; shadow: number }
export interface StageSet { id: string; hdri: string; hdriRot: number; exposure: number; envPower: number; background: boolean; sun: SunSpec; fog: { color: string; near: number; far: number }; shell?: Shell; props: Placement[] }
export const SETS: StageSet[]; // three
```

`build` names a code-built prop from Task 4 (`'curtains' | 'keyboard' | 'whiteboard' | 'sign' | 'trophy' | 'bridge' | 'water' | 'boats' | 'hills' | 'skyline' | 'passage' | 'rug' | 'tvTable' | 'counter'`).

- Produces (`dolly.ts`):

```ts
export interface DollyKey { q: number; cam: V3; look: V3; fov: number; set: number; blend?: 0 | 1 }
export const DOLLY: DollyKey[]; // the table above
export interface Frame { q: number; set: number; blend: number; cam: V3; look: V3; fov: number; envDip: number }
export function makeDolly(keys: DollyKey[]): (q: number) => Frame
```

`makeDolly`: position and look are centripetal CatmullRom curves through the keys; the curve parameter for a given `q` is piecewise linear between the keys' `q` values (`u = (k + (q - keys[k].q) / (keys[k+1].q - keys[k].q)) / (keys.length - 1)`). `set` is the set of the nearest key at or before `q`, except inside a blend window (from a `blend: 0` key to the next `blend: 1` key) where `blend` runs 0..1 linearly and `set` flips at 0.5. `envDip = 1 - 0.88 * sin(pi * blend)` (1 outside windows). `fov` lerps linearly by `q` between the keys.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/stage/sets.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SETS } from '../../src/lib/stage/sets.ts';
import { ASSETS } from '../../src/lib/stage/assets.ts';

const ids = new Set(ASSETS.map((a) => a.id));
const finite = (v: number[]) => v.every((n) => Number.isFinite(n));

test('three sets, each lit by a real HDRI in the manifest', () => {
  assert.equal(SETS.length, 3);
  for (const s of SETS) {
    assert.ok(ids.has(s.hdri), s.hdri);
    assert.ok(s.exposure > 0 && s.exposure < 3);
    assert.ok(s.envPower > 0 && s.envPower <= 1);
    assert.ok(s.fog.far > s.fog.near);
    assert.ok(finite(s.sun.dir) && s.sun.power > 0);
  }
});

test('every placement names a model in the manifest or a code-built prop, and sits somewhere finite', () => {
  for (const s of SETS) for (const p of s.props) {
    assert.ok((p.model && ids.has(p.model)) || p.build, `${s.id}: ${p.model ?? p.build}`);
    assert.ok(finite(p.at));
    if (p.href) assert.ok(p.cap, 'a link needs a caption');
  }
});

test('shells use manifest textures and open where the dolly passes', () => {
  const [room, lab] = SETS;
  for (const s of [room, lab]) {
    assert.ok(s.shell);
    assert.ok(ids.has(s.shell!.floor) && ids.has(s.shell!.wall));
    assert.ok(s.shell!.openings.some((o) => o.h > 1.9 && (o.sill ?? 0) === 0), `${s.id} has a door`);
    assert.ok(s.shell!.tile.floor > 0 && s.shell!.tile.wall > 0);
  }
  assert.ok(room.shell!.openings.some((o) => o.wall === 'x+'));
  assert.ok(lab.shell!.openings.some((o) => o.wall === 'x-') && lab.shell!.openings.some((o) => o.wall === 'x+'));
});
```

```ts
// tests/stage/dolly.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOLLY, makeDolly } from '../../src/lib/stage/dolly.ts';

test('keys are ordered in q from 0 to 1 and land on the three sets', () => {
  assert.equal(DOLLY[0].q, 0);
  assert.equal(DOLLY[DOLLY.length - 1].q, 1);
  for (let k = 1; k < DOLLY.length; k++) assert.ok(DOLLY[k].q > DOLLY[k - 1].q);
  assert.deepEqual([...new Set(DOLLY.map((k) => k.set))], [0, 1, 2]);
});

test('blend windows come in pairs, 0 then 1, and the set flips inside them', () => {
  const dolly = makeDolly(DOLLY);
  const zeros = DOLLY.filter((k) => k.blend === 0), ones = DOLLY.filter((k) => k.blend === 1);
  assert.equal(zeros.length, 2);
  assert.equal(ones.length, 2);
  for (let w = 0; w < 2; w++) {
    const a = zeros[w], b = ones[w];
    assert.ok(b.q > a.q);
    const mid = (a.q + b.q) / 2;
    assert.equal(dolly(a.q + 1e-6).set, a.set);
    assert.equal(dolly(mid + 1e-6).set, b.set);
    assert.ok(dolly(mid).envDip < 0.2);
    assert.equal(dolly(a.q - 0.01).envDip, 1);
  }
});

test('the camera never jumps: 1/1000 steps move under 0.06 m and the look under 0.1 m', () => {
  const dolly = makeDolly(DOLLY);
  let prev = dolly(0);
  for (let i = 1; i <= 1000; i++) {
    const f = dolly(i / 1000);
    const d = Math.hypot(f.cam[0] - prev.cam[0], f.cam[1] - prev.cam[1], f.cam[2] - prev.cam[2]);
    const l = Math.hypot(f.look[0] - prev.look[0], f.look[1] - prev.look[1], f.look[2] - prev.look[2]);
    assert.ok(d < 0.06, `cam step ${d} at ${i}`);
    assert.ok(l < 0.1, `look step ${l} at ${i}`);
    assert.ok(f.fov >= 40 && f.fov <= 60);
    prev = f;
  }
});

test('the dolly is inside the doorway when it says it is', () => {
  const dolly = makeDolly(DOLLY);
  const f = dolly(0.27);
  assert.ok(Math.abs(f.cam[0] - 2.6) < 0.05 && Math.abs(f.cam[2] - 1.6) < 0.1, `${f.cam}`);
  const g = dolly(0.77);
  assert.ok(Math.abs(g.cam[0] - 12.1) < 0.05 && Math.abs(g.cam[2] - 3.4) < 0.1, `${g.cam}`);
});
```

- [ ] **Step 2: Run them, expect module-not-found failures**

- [ ] **Step 3: Write `sets.ts`**

Layout numbers from the world layout section. Placements (all `rot` in degrees, `scale` 1 unless said):

```ts
export const SETS: StageSet[] = [
  {
    id: 'room', hdri: 'small_empty_room_1', hdriRot: 90, exposure: 1.0, envPower: 1, background: false,
    sun: { dir: [-0.45, 0.8, -0.4], color: '#FFD9A8', power: 2.6, shadow: 1 },
    fog: { color: '#E9DCC6', near: 12, far: 60 },
    shell: { x: [-2.2, 2.2], z: [-2.5, 2.5], h: 2.8, floor: 'plank_flooring', wall: 'painted_plaster_wall', ceiling: 'ceiling_interior',
      tile: { floor: 2.0, wall: 3.0 },
      openings: [{ wall: 'x+', at: 1.6, w: 0.9, h: 2.05 }, { wall: 'z-', at: -1.1, w: 1.3, h: 1.4, sill: 0.95 }] },
    props: [
      { build: 'tvTable', at: [0, 0, -2.15] },
      { model: 'television_02', at: [0, 0.62, -2.15], rot: [0, 0, 0], live: 'tv', cap: 'Call of Duty: World at War, Nazi Zombies. Every evening.', href: 'https://www.youtube.com/results?search_query=nazi+zombies+world+at+war' },
      { model: 'gaming_console', at: [0.55, 0.005, -2.05], rot: [0, -20, 0], cap: 'The Xbox 360.' },
      { model: 'gamepad', at: [-0.35, 0.005, 0.2], rot: [0, 35, 0] },
      { model: 'ceiling_fan', at: [0, 2.8, 0.2], live: 'fan', cap: 'The ceiling fan. Delhi summers.' },
      { model: 'wooden_bookshelf_worn', at: [1.55, 0, -2.3], rot: [0, 0, 0] },
      { model: 'decorative_book_set_01', at: [1.55, 0.92, -2.28], rot: [0, 0, 0] },
      { model: 'hanging_picture_frame_01', at: [1.0, 1.75, -2.47], rot: [0, 0, 0], cap: "Here's to the crazy ones." },
      { build: 'rug', at: [0, 0.002, 0.3] },
      { model: 'throw_pillows_01', at: [-0.9, 0.0, 0.9], rot: [0, 60, 0] },
      { model: 'football', at: [-1.3, 0.11, 0.1], rot: [0, 40, 0], cap: 'Barcelona. Messi.' },
      { build: 'curtains', at: [-1.1, 2.55, -2.42], live: 'curtain' },
      { build: 'skyline', at: [-1.1, 1.6, -3.4] },
      { build: 'passage', at: [2.2, 0, 1.0], live: 'bulb' },
    ],
  },
  {
    id: 'lab', hdri: 'school_hall', hdriRot: 0, exposure: 0.95, envPower: 1, background: false,
    sun: { dir: [-0.2, 0.9, 0.3], color: '#EEF3FF', power: 1.4, shadow: 0.7 },
    fog: { color: '#E1E8EE', near: 14, far: 70 },
    shell: { x: [5.2, 12.2], z: [-1.5, 4.5], h: 3.0, floor: 'old_linoleum_flooring_01', wall: 'painted_plaster_wall', ceiling: 'ceiling_interior',
      tile: { floor: 2.0, wall: 3.0 },
      openings: [{ wall: 'x-', at: 1.6, w: 0.9, h: 2.05 }, { wall: 'x+', at: 3.4, w: 0.9, h: 2.05 }, { wall: 'z-', at: 8.7, w: 5.5, h: 0.7, sill: 2.1 }] },
    props: [
      // his desk, then two more rows toward -z and +x
      ...[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => ({ model: 'SchoolDesk_01', at: [6.6 + c * 1.5, 0, 0.5 - r * 1.6] as V3, rot: [0, 180, 0] as V3 }))),
      ...[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => ({ model: 'SchoolChair_01', at: [6.6 + c * 1.5, 0, 1.15 - r * 1.6] as V3, rot: [0, 180, 0] as V3 }))),
      ...[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => ({ model: 'television_02', at: [6.6 + c * 1.5, 0.76, 0.35 - r * 1.6] as V3, rot: [0, 180, 0] as V3, scale: 0.6, live: 'monitor' as Live, ...(r === 0 && c === 0 ? { cap: 'index.html in Notepad. The first website.' } : {}) }))),
      ...[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => ({ build: 'keyboard', at: [6.6 + c * 1.5, 0.76, 0.75 - r * 1.6] as V3 }))),
      { build: 'whiteboard', at: [8.7, 1.5, -1.47], cap: 'Wireframes sketched in class.' },
      { model: 'wall_clock', at: [11.0, 2.3, -1.47] },
      { build: 'banner', at: [6.4, 2.35, -1.47], cap: 'Converge Clan.' },
      { build: 'teamPhoto', at: [6.4, 1.55, -1.47] },
      { build: 'tube', at: [8.7, 2.95, 1.5], live: 'tube' },
    ],
  },
  {
    id: 'plaza', hdri: 'golden_gate_hills', hdriRot: 200, exposure: 0.85, envPower: 1, background: true,
    sun: { dir: [0.35, 0.55, -0.75], color: '#FFF1D6', power: 3.2, shadow: 1 },
    fog: { color: '#D6E3EC', near: 60, far: 700 },
    props: [
      { build: 'plazaFloor', at: [12.2, 0, 0] },
      { build: 'counter', at: [22, 0, -10] },
      { build: 'sign', at: [22, 1.55, -10.6], cap: 'Google Code-in 2018, grand prize.', href: 'https://codein.withgoogle.com/archive/2018/' },
      { build: 'trophy', at: [21.2, 0.92, -9.8], cap: 'The trophy.' },
      { model: 'street_lamp_01', at: [15.5, 0, -3] },
      { model: 'modular_street_seating', at: [18, 0, 2], rot: [0, 90, 0] },
      { model: 'island_tree_01', at: [28, 0, -6], scale: 1.1 },
      { model: 'island_tree_01', at: [14, 0, -14], rot: [0, 130, 0], scale: 0.9 },
      { build: 'water', at: [30, -0.35, -60], live: 'water', cap: 'The bay.' },
      { build: 'bridge', at: [30, 0, -120] },
      { build: 'hills', at: [30, 0, -170] },
      { build: 'boats', at: [10, -0.2, -45] },
    ],
  },
];
```

Model origins: Poly Haven models sit on y = 0 at their base, centred in x and z; `television_02` is 0.40 w, 0.35 h, 0.41 d, so the room TV table is 0.62 high. Check every model's origin and size in the browser on Task 5 and fix the numbers there, not here.

- [ ] **Step 4: Write `dolly.ts`**

```ts
// The camera path, as data, and the function from stage progress to a frame. Pure.
import { CatmullRomCurve3, Vector3 } from 'three';
import type { V3 } from './sets.ts';

export interface DollyKey { q: number; cam: V3; look: V3; fov: number; set: number; blend?: 0 | 1 }
export interface Frame { q: number; set: number; blend: number; cam: V3; look: V3; fov: number; envDip: number }

export const DOLLY: DollyKey[] = [
  { q: 0.0, cam: [0.3, 1.15, 2.1], look: [0, 0.95, -2.3], fov: 46, set: 0 },
  { q: 0.2, cam: [1.4, 1.2, 1.7], look: [2.6, 1.2, 1.6], fov: 50, set: 0 },
  { q: 0.27, cam: [2.6, 1.2, 1.6], look: [4.5, 1.2, 1.6], fov: 54, set: 0, blend: 0 },
  { q: 0.32, cam: [3.7, 1.2, 1.6], look: [5.6, 1.2, 1.6], fov: 54, set: 1, blend: 1 },
  { q: 0.38, cam: [5.4, 1.25, 1.6], look: [7.5, 1.1, 0.4], fov: 50, set: 1 },
  { q: 0.5, cam: [6.6, 1.35, 2.6], look: [8.2, 1.0, 0.6], fov: 46, set: 1 },
  { q: 0.7, cam: [9.5, 1.3, 2.8], look: [12.4, 1.2, 3.4], fov: 50, set: 1 },
  { q: 0.77, cam: [12.1, 1.3, 3.4], look: [14, 1.3, 3.4], fov: 54, set: 1, blend: 0 },
  { q: 0.82, cam: [13.4, 1.35, 3.4], look: [16, 1.4, 1.5], fov: 54, set: 2, blend: 1 },
  { q: 1.0, cam: [16.5, 1.6, 6.5], look: [24, 1.6, -12], fov: 48, set: 2 },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function makeDolly(keys: DollyKey[]): (q: number) => Frame {
  const n = keys.length;
  const cam = new CatmullRomCurve3(keys.map((k) => new Vector3(...k.cam)), false, 'centripetal');
  const look = new CatmullRomCurve3(keys.map((k) => new Vector3(...k.look)), false, 'centripetal');
  // blend windows: [start index, end index]
  const windows: [number, number][] = [];
  for (let k = 0; k < n; k++) if (keys[k].blend === 0) { for (let j = k + 1; j < n; j++) if (keys[j].blend === 1) { windows.push([k, j]); break; } }
  return (qIn) => {
    const q = clamp01(qIn);
    let k = 0;
    while (k < n - 2 && q >= keys[k + 1].q) k++;
    const a = keys[k], b = keys[k + 1];
    const f = clamp01((q - a.q) / (b.q - a.q));
    const u = (k + f) / (n - 1);
    let set = a.set, blend = 0, envDip = 1;
    for (const [s, e] of windows) {
      if (q >= keys[s].q && q <= keys[e].q) {
        blend = clamp01((q - keys[s].q) / (keys[e].q - keys[s].q));
        set = blend < 0.5 ? keys[s].set : keys[e].set;
        envDip = 1 - 0.88 * Math.sin(Math.PI * blend);
      }
    }
    return {
      q, set, blend, envDip,
      cam: cam.getPoint(u).toArray() as V3,
      look: look.getPoint(u).toArray() as V3,
      fov: a.fov + (b.fov - a.fov) * f,
    };
  };
}
```

- [ ] **Step 5: Run the tests. If the 1/1000 step test fails on a doorway, move the neighbouring key closer in q (the curve speed is set by key spacing), not the threshold.**

- [ ] **Step 6: Commit**

```bash
git add src/lib/stage/sets.ts src/lib/stage/dolly.ts tests/stage/sets.test.ts tests/stage/dolly.test.ts
git commit -m "feat(stage): three sets and the dolly as data"
```

---

### Task 3: Shell builder (rooms with openings, uv in metres)

**Files:**
- Create: `src/lib/stage/shell.ts`
- Create: `tests/stage/shell.test.ts`

**Interfaces:**
- Produces: `export interface Slab { pos: Float32Array; nor: Float32Array; uv: Float32Array }`; `export function buildShell(s: Shell): { floor: Slab; walls: Slab; ceiling: Slab }`. Winding faces into the room. `uv` = world metres divided by `tile` (floor: x/z, walls: along-wall/height, ceiling: x/z). Openings are cut by splitting the wall into up to four rectangles around each opening (left, right, above, below the hole).

- [ ] **Step 1: Write the failing test**

```ts
// tests/stage/shell.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildShell } from '../../src/lib/stage/shell.ts';
import { SETS } from '../../src/lib/stage/sets.ts';

const room = SETS[0].shell!;

test('a shell is finite, closed above and below, and its uv is in metres', () => {
  const { floor, walls, ceiling } = buildShell(room);
  for (const s of [floor, walls, ceiling]) {
    assert.equal(s.pos.length % 9, 0);
    assert.equal(s.nor.length, s.pos.length);
    assert.equal(s.uv.length, (s.pos.length / 3) * 2);
    for (const v of s.pos) assert.ok(Number.isFinite(v));
  }
  // the floor spans the room and its uv spans width / tile
  const us = Array.from({ length: floor.uv.length / 2 }, (_, i) => floor.uv[i * 2]);
  assert.ok(Math.abs(Math.max(...us) - Math.min(...us) - (room.x[1] - room.x[0]) / room.tile.floor) < 1e-6);
});

test('an opening removes wall area: a door leaves a hole you can walk through', () => {
  const solid = buildShell({ ...room, openings: [] });
  const cut = buildShell(room);
  const area = (s: { pos: Float32Array }) => {
    let a = 0;
    for (let i = 0; i < s.pos.length; i += 9) {
      const ax = s.pos[i + 3] - s.pos[i], ay = s.pos[i + 4] - s.pos[i + 1], az = s.pos[i + 5] - s.pos[i + 2];
      const bx = s.pos[i + 6] - s.pos[i], by = s.pos[i + 7] - s.pos[i + 1], bz = s.pos[i + 8] - s.pos[i + 2];
      a += 0.5 * Math.hypot(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx);
    }
    return a;
  };
  const holes = room.openings.reduce((t, o) => t + o.w * o.h, 0);
  assert.ok(Math.abs(area(solid.walls) - area(cut.walls) - holes) < 1e-6);
  // no wall vertex sits inside the door hole
  const door = room.openings.find((o) => (o.sill ?? 0) === 0)!;
  for (let i = 0; i < cut.walls.pos.length; i += 3) {
    const x = cut.walls.pos[i], y = cut.walls.pos[i + 1], z = cut.walls.pos[i + 2];
    const inside = Math.abs(x - room.x[1]) < 1e-9 && z > door.at - door.w / 2 + 1e-9 && z < door.at + door.w / 2 - 1e-9 && y > 1e-9 && y < door.h - 1e-9;
    assert.ok(!inside, `vertex in the door at ${x},${y},${z}`);
  }
});

test('every normal points into the room', () => {
  const { floor, walls, ceiling } = buildShell(room);
  const cx = (room.x[0] + room.x[1]) / 2, cy = room.h / 2, cz = (room.z[0] + room.z[1]) / 2;
  for (const s of [floor, walls, ceiling]) {
    for (let i = 0; i < s.pos.length; i += 3) {
      const dot = (cx - s.pos[i]) * s.nor[i] + (cy - s.pos[i + 1]) * s.nor[i + 1] + (cz - s.pos[i + 2]) * s.nor[i + 2];
      assert.ok(dot > 0, `normal at ${i / 3} faces out`);
    }
  }
});
```

- [ ] **Step 2: Run, expect module-not-found**

- [ ] **Step 3: Write `shell.ts`**

```ts
// Rooms as geometry: a floor, four walls with holes for doors and windows, a ceiling. Every
// vertex carries a normal facing into the room and a uv in metres over the tile size, so a
// scanned plaster or plank set lands at its real scale wherever the wall is.
import type { Shell, Opening } from './sets.ts';

export interface Slab { pos: Float32Array; nor: Float32Array; uv: Float32Array }

type Rect = [number, number, number, number]; // u0, v0, u1, v1 in the wall's own 2d frame

class Bag {
  pos: number[] = []; nor: number[] = []; uv: number[] = [];
  /** A rectangle given by a corner, two edge vectors (a: along u, b: along v), a normal, and uv scale. */
  rect(o: [number, number, number], a: [number, number, number], b: [number, number, number], n: [number, number, number], uv0: [number, number], uvA: number, uvB: number) {
    const p = (s: number, t: number): [number, number, number] => [o[0] + a[0] * s + b[0] * t, o[1] + a[1] * s + b[1] * t, o[2] + a[2] * s + b[2] * t];
    const tri = (...pts: [number, number][]) => { for (const [s, t] of pts) { this.pos.push(...p(s, t)); this.nor.push(...n); this.uv.push(uv0[0] + uvA * s, uv0[1] + uvB * t); } };
    tri([0, 0], [1, 0], [1, 1]);
    tri([0, 0], [1, 1], [0, 1]);
  }
  out(): Slab { return { pos: new Float32Array(this.pos), nor: new Float32Array(this.nor), uv: new Float32Array(this.uv) }; }
}

/** Splits a wall rectangle (u along the wall, v up) around its openings into solid rectangles. */
function cut(u0: number, u1: number, h: number, holes: Rect[]): Rect[] {
  let rects: Rect[] = [[u0, 0, u1, h]];
  for (const [hu0, hv0, hu1, hv1] of holes) {
    const next: Rect[] = [];
    for (const [a0, b0, a1, b1] of rects) {
      const ou0 = Math.max(a0, hu0), ou1 = Math.min(a1, hu1), ov0 = Math.max(b0, hv0), ov1 = Math.min(b1, hv1);
      if (ou0 >= ou1 || ov0 >= ov1) { next.push([a0, b0, a1, b1]); continue; }
      if (ou0 > a0) next.push([a0, b0, ou0, b1]);
      if (ou1 < a1) next.push([ou1, b0, a1, b1]);
      if (ov0 > b0) next.push([ou0, b0, ou1, ov0]);
      if (ov1 < b1) next.push([ou0, ov1, ou1, b1]);
    }
    rects = next;
  }
  return rects;
}

export function buildShell(s: Shell): { floor: Slab; walls: Slab; ceiling: Slab } {
  const [x0, x1] = s.x, [z0, z1] = s.z, h = s.h, tf = s.tile.floor, tw = s.tile.wall;
  const floor = new Bag(), ceiling = new Bag(), walls = new Bag();
  floor.rect([x0, 0, z0], [x1 - x0, 0, 0], [0, 0, z1 - z0], [0, 1, 0], [x0 / tf, z0 / tf], (x1 - x0) / tf, (z1 - z0) / tf);
  ceiling.rect([x0, h, z1], [x1 - x0, 0, 0], [0, 0, z0 - z1], [0, -1, 0], [x0 / tf, z1 / tf], (x1 - x0) / tf, (z0 - z1) / tf);
  // each wall: an origin, a unit vector along it, and its inward normal; u runs along the wall in world metres
  const WALLS: Array<{ id: Opening['wall']; o: [number, number, number]; a: [number, number, number]; n: [number, number, number]; len: number; from: number }> = [
    { id: 'z-', o: [x0, 0, z0], a: [1, 0, 0], n: [0, 0, 1], len: x1 - x0, from: x0 },
    { id: 'x+', o: [x1, 0, z0], a: [0, 0, 1], n: [-1, 0, 0], len: z1 - z0, from: z0 },
    { id: 'z+', o: [x1, 0, z1], a: [-1, 0, 0], n: [0, 0, -1], len: x1 - x0, from: x1 },
    { id: 'x-', o: [x0, 0, z1], a: [0, 0, -1], n: [1, 0, 0], len: z1 - z0, from: z1 },
  ];
  for (const w of WALLS) {
    const sign = w.a[0] + w.a[2]; // +1 when u increases with the world axis, -1 otherwise
    const holes: Rect[] = s.openings.filter((o) => o.wall === w.id).map((o) => {
      const c = (o.at - w.from) * sign; // opening centre in u
      return [c - o.w / 2, o.sill ?? 0, c + o.w / 2, (o.sill ?? 0) + o.h];
    });
    for (const [u0, v0, u1, v1] of cut(0, w.len, h, holes)) {
      const o: [number, number, number] = [w.o[0] + w.a[0] * u0, v0, w.o[2] + w.a[2] * u0];
      walls.rect(o, [w.a[0] * (u1 - u0), 0, w.a[2] * (u1 - u0)], [0, v1 - v0, 0], w.n, [u0 / tw, v0 / tw], (u1 - u0) / tw, (v1 - v0) / tw);
    }
  }
  return { floor: floor.out(), walls: walls.out(), ceiling: ceiling.out() };
}
```

Winding check: with `n` given, three.js lights by the supplied normal; GTAO and shadows use depth, so the triangle order only matters for back-face culling. Use `DoubleSide` off: the test on normals guarantees the inward face; if a wall renders black, flip the `tri` order in `rect` (swap the second triangle's `[1,1]` and `[0,1]`), not the normals.

- [ ] **Step 4: Run the tests, expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/stage/shell.ts tests/stage/shell.test.ts
git commit -m "feat(stage): shell builder, rooms with openings, uv in metres"
```

---

### Task 4: Code-built props with scans on them

**Files:**
- Create: `src/lib/stage/built.ts` (replaces the parts of `props.ts` that survive; `props.ts` stays until Task 6)
- Create: `tests/stage/built.test.ts`

**Interfaces:**
- Produces: `export interface Built { pos: Float32Array; nor: Float32Array; uv: Float32Array; surface: BuiltSurface }` where `export type BuiltSurface = { tex: string; tile: number } | { color: string; rough: number; metal: number; emissive?: string }`; `export type BuiltPart = Built[]`; `export const BUILT: Record<string, () => BuiltPart>` with keys: `tvTable, rug, curtains, skyline, passage, keyboard, whiteboard, banner, teamPhoto, tube, plazaFloor, counter, sign, trophy, water, bridge, hills, boats`. Each part is a list of `Built` pieces, one per surface, built at the origin; `Placement.at/rot/scale` place it. Pieces that carry a painted canvas (`skyline`, `whiteboard`, `banner`, `teamPhoto`, `sign`) use `{ color: '#FFFFFF', rough: 0.6, metal: 0 }` and have uv 0..1 over their face so the runtime can drop the existing painter canvases from `stage-run.ts` (`window`, `whiteboard`, `banner`, `poster` (the clan photo), `sign`) onto them by name.

Geometry helpers: reuse `Sink` from `rig.ts` for boxes/cylinders (its `Geo.uv` is 0..1 per face; scale by `tile` in the runtime via `texture.repeat`), and `smoothNormals` for the trophy and the boat hulls. Every piece: `nor` from `smoothNormals(pos, 62)` or `flatNormals(pos)`.

Exact pieces:
- `tvTable`: dark wood box 1.1 × 0.62 × 0.5 with four legs (`{ color: '#4A3223', rough: 0.7, metal: 0 }`).
- `rug`: a 12-sided disc r 1.3, y 0, `{ tex: 'dirty_carpet', tile: 1.2 }`, uv from x/z over tile.
- `curtains`: two panels 0.55 w × 1.7 h, 14 columns of quads each, folded (x offset `0.03 * sin(column * 1.9)`), `{ tex: 'cotton_jersey', tile: 0.8 }`, plus a rod (cylinder r 0.015, `{ color: '#8A6E4E', rough: 0.5, metal: 0.2 }`). The runtime animates the panels (Task 5).
- `skyline`: one quad 2.4 × 1.6 facing +z, painter `window`.
- `passage`: floor, two side walls, ceiling for x 0..3, z 0..1.2, h 2.4, `{ tex: 'painted_plaster_wall', tile: 3 }` on the walls and ceiling, `{ tex: 'old_linoleum_flooring_01', tile: 2 }` on the floor; a bulb: sphere r 0.04 at (1.5, 2.2, 0.6) `{ color: '#FFE6B0', rough: 0.4, metal: 0, emissive: '#FFC978' }`.
- `keyboard`: 0.44 × 0.02 × 0.15 slab `{ color: '#D9D3C4', rough: 0.55, metal: 0 }` with 6 rows × 15 key boxes 0.018 cube `{ color: '#EFEAE0', rough: 0.5, metal: 0 }`.
- `whiteboard`: 2.4 × 1.2 quad painter `whiteboard`, aluminium frame four boxes 0.03 `{ color: '#C9CCD0', rough: 0.35, metal: 0.9 }`.
- `banner`: 2.2 × 0.5 quad painter `banner`.
- `teamPhoto`: 1.0 × 0.7 quad painter `poster` frame 1 (the clan photo) with a 0.03 wood frame `{ color: '#5C4033', rough: 0.6, metal: 0 }`.
- `tube`: a cylinder r 0.02 × 1.2 long `{ color: '#F6FAFF', rough: 0.3, metal: 0, emissive: '#EAF2FF' }` in a 1.3 × 0.06 × 0.1 tray `{ color: '#DADDE0', rough: 0.4, metal: 0.6 }`.
- `plazaFloor`: a 70 × 80 quad `{ tex: 'concrete_pavement', tile: 2.5 }`.
- `counter`: 3.6 × 0.9 × 0.6 box `{ color: '#1E6B3A', rough: 0.7, metal: 0 }`.
- `sign`: 3.6 × 1.5 quad painter `sign` on a 0.08 thick white box `{ color: '#F4F4F2', rough: 0.5, metal: 0 }`.
- `trophy`: a lathe cup (rings r 0.02 at y 0, 0.06 at 0.05, 0.05 at 0.12, 0.09 at 0.22, 0.1 at 0.26) with a base disc r 0.07, `{ color: '#D4AF37', rough: 0.34, metal: 1 }`.
- `water`: a 200 × 120 quad `{ color: '#3E6E8A', rough: 0.15, metal: 0 }` (the runtime adds the ripple normal map from `surface.ts` 'water').
- `bridge`: the existing `bridge` rig from `props.ts` ported: colours `{ color: '#C0392B', rough: 0.55, metal: 0.2 }` for the deck, towers and cables.
- `hills`: the existing `hills` rig ported, `{ tex: 'leafy_grass', tile: 40 }`.
- `boats`: the existing `boats` rig ported, `{ color: '#F2EFE6', rough: 0.6, metal: 0 }`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/stage/built.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILT } from '../../src/lib/stage/built.ts';
import { ASSETS } from '../../src/lib/stage/assets.ts';
import { SETS } from '../../src/lib/stage/sets.ts';

const texIds = new Set(ASSETS.filter((a) => a.kind === 'texture').map((a) => a.id));

test('every code-built prop the sets use exists, and every piece is finite with a normal and a uv per vertex', () => {
  for (const s of SETS) for (const p of s.props) if (p.build) assert.ok(BUILT[p.build], `${p.build} missing`);
  for (const [name, make] of Object.entries(BUILT)) {
    const part = make();
    assert.ok(part.length > 0, name);
    for (const piece of part) {
      assert.equal(piece.pos.length % 9, 0, name);
      assert.equal(piece.nor.length, piece.pos.length, name);
      assert.equal(piece.uv.length, (piece.pos.length / 3) * 2, name);
      for (const v of piece.pos) assert.ok(Number.isFinite(v), name);
      if ('tex' in piece.surface) assert.ok(texIds.has(piece.surface.tex), `${name}: ${piece.surface.tex}`);
      else assert.match(piece.surface.color, /^#[0-9a-f]{6}$/i);
    }
  }
});

test('building twice gives the same thing: no hidden state', () => {
  for (const [name, make] of Object.entries(BUILT)) {
    const a = make(), b = make();
    assert.equal(a.length, b.length, name);
    for (let i = 0; i < a.length; i++) assert.deepEqual(Array.from(a[i].pos), Array.from(b[i].pos), name);
  }
});
```

- [ ] **Step 2: Run, expect module-not-found**
- [ ] **Step 3: Write `built.ts`** with the pieces above. Port `bridge`, `hills`, `boats` by copying the bodies from `props.ts` and changing the colour calls to piece boundaries (one `Sink` per surface).
- [ ] **Step 4: Run the tests, expect PASS**
- [ ] **Step 5: Commit**

```bash
git add src/lib/stage/built.ts tests/stage/built.test.ts
git commit -m "feat(stage): code-built props for what has no scan"
```

---

### Task 5: The runtime, rewritten

**Files:**
- Rewrite: `src/scripts/stage-run.ts` (keep: the painters for `screen`, `window`, `whiteboard`, `banner`, `poster`, `sign`, `keyboard`; `loadImage`; the hotspot DOM and `.cap` CSS contract; the pacer; theme clear colour; the scroll spring; `fit`. Drop: `Actor` handling, morph targets, `withDetail`, outlines, `env.ts`, bloom, grade, the figure.)
- Modify: `src/components/Journey.astro` (comment line 4 points at spec 13; nothing else)

**Interfaces:**
- Consumes: `SETS`, `buildShell`, `BUILT`, `DOLLY`, `makeDolly`, `assetUrl`, `asset`, `stageProgress` (from `shot.ts`, kept), `locate` (from `lerp.ts`).

Structure of the new `mount(root, canvas, chapters)`:

1. Renderer as today (`ACESFilmicToneMapping`, `PCFShadowMap`, dpr cap 1.5). Composer: `RenderPass`, `GTAOPass` (blendIntensity 0.6, radius 0.25), `OutputPass`, `FXAAPass`. No bloom, no grade.
2. Loaders: `GLTFLoader` with `setMeshoptDecoder(MeshoptDecoder)`, `RGBELoader`, `TextureLoader`, `PMREMGenerator`. Helper `loadHdri(id) -> Promise<{ env: Texture; sky: Texture }>` (`sky` is the equirect with `mapping = EquirectangularReflectionMapping`, used as `scene.background` only for sets with `background: true`; `env` is the PMREM). Helper `loadModel(id) -> Promise<Group>` (clones per placement via `SkeletonUtils.clone` not needed: `group.clone()` is fine, materials shared). Helper `loadTex(id, tile) -> { map, normalMap, aoMap, roughnessMap, metalnessMap }` from the three webp files, `wrapS/T = RepeatWrapping`, `repeat.set(1,1)` (uv already in metres over tile), `map.colorSpace = SRGBColorSpace`, anisotropy max. `arm.webp` is used for `aoMap`, `roughnessMap` and `metalnessMap` all at once (three reads r for ao, g for roughness, b for metalness, exactly the arm packing).
3. Build per set: a `Group` per set. Shell slabs to `BufferGeometry` (`position`, `normal`, `uv`; also `uv1 = uv` for the aoMap). `MeshStandardMaterial({ ...loadTex(shell.floor, tile) })`, `receiveShadow` on, `castShadow` off for floor/ceiling, on for walls. Placements: models via `loadModel` then `traverse`: `castShadow = receiveShadow = true`, any material with `envMapIntensity > 1` clamped to 1; built parts from `BUILT[name]()` with materials from the surface (`tex` → `loadTex`, `color` → `MeshStandardMaterial({ color, roughness, metalness, emissive })`). Position/rotation/scale from the placement. `mesh.userData.placement = p` for hotspots.
4. Live things, driven each tick with `t` seconds and `dt`:
   - `fan`: the model's rotating child (name contains `blade` or the largest child by bounds) spins `rotation.y += dt * 6` with a start-up ramp from 0 over 3 s (`speed = min(6, speed + dt * 2)`).
   - `tv` / `monitor`: an emissive plane child added in front of the screen face (0.30 × 0.23 at local (0, 0.19, 0.205) for `television_02`; scaled with the model): `MeshBasicMaterial({ map: video or notepad canvas, toneMapped: false })`, plus a `PointLight` (colour from the frame's average, power 2, distance 1.5) so the screen lights the room. `tv` uses the existing video texture, `monitor` the `screen` painter's second frame (Notepad).
   - `tube`: emissive intensity `tubeOn` goes 0 → 1 with three flickers when the dolly enters the lab (`q` crosses 0.30; sequence over 0.6 s: 0, 1, 0.2, 1, 0.4, 1) and stays; a `RectAreaLight`-free approach: one `PointLight` at the tube, power tied to `tubeOn`.
   - `curtain`: a vertex displacement on the curtain material via `onBeforeCompile`: `transformed.x += 0.02 * sin(uTime * 1.3 + position.y * 3.0) * (1.0 - uv.y)`; `uTime` uniform set per tick. Reduced motion: `uTime` frozen.
   - `water`: the ripple normal map from `surface.ts` (`detailMap('ripple')` packed rgb only) as `normalMap`, `normalMap.offset` scrolled `0.02 * t`, `normalScale` 0.35.
   - `bulb`: static emissive; nothing to drive.
5. The frame: `frame(f: Frame)`: camera from `f.cam/look/fov` with the portrait `setViewOffset` logic kept from today; the current set `S = SETS[f.set]`; when `f.set` changes from the last frame: `scene.environment = envs[f.set]`, `scene.background = S.background ? skies[f.set] : null`, `renderer.toneMappingExposure = S.exposure`, sun colour/power/position from `S.sun` (position = `look + dir * 30`, target = look), fog colour/near/far from `S.fog`, `scene.backgroundRotation`/`environmentRotation` set from `S.hdriRot` (y, radians). Every frame: `scene.environmentIntensity = S.envPower * f.envDip`, `sun.intensity = S.sun.power * f.envDip`, sun shadow camera follows the camera (`sun.position` recomputed from the look each frame so the 12 m shadow box always covers the frame).
6. Loading order: set 0 (HDRI + models + textures) first; `mount` resolves the first frame as soon as set 0 is in; sets 1 and 2 load in the background right after, in order. Until a set is loaded, its group is absent; the dolly cannot reach it before it loads at normal scroll speed, and if it does, the doorway darkness covers it.
7. Hotspots: `ray.intersectObjects(hotRoots, true)`; walk `hit.object` parents to the placement root; caption = `placement.cap`, click opens `placement.href`. Hover highlight: set `material.emissive` to the accent at 0.25 on the root's meshes (cloning materials on first hover), restore on leave. No outline hull.
8. Scroll and tick: as today (`stageProgress(cur, chapters, 3)`, the spring, `pace(dt)`), but `frame(dolly(q))`; reduced motion: `q = round(q * 2) / 2`.
9. Theme: `renderer.setClearColor(cssVar('--bg'))` only matters when `background` is false and no shell covers the frame; otherwise as today.

- [ ] **Step 1: Write the new `stage-run.ts`** following the structure above. Keep the file under 700 lines; move the painters into `src/scripts/stage-paint.ts` (`export function painters(images, video): Record<string, Paint>` and `export function loadImage(src)`), unchanged.
- [ ] **Step 2: `npx tsc --noEmit` and `npx astro check` clean. `npm test` clean (old `world.test.ts`, `env.test.ts`, `props.test.ts`, `figure3d.test.ts`, `shot.test.ts` still pass because their modules still exist).**
- [ ] **Step 3: Screenshot the three stations and both doorways:** `node shoot.mjs 1440 900 light "0,0.14,0.16,0.5,0.77,0.79,1"`. Check: no black walls (winding), models on the floor and at the right size (fix `sets.ts` numbers), the doorway frames are dark but not black, the swap at blend 0.5 is invisible, the bay HDRI horizon sits at the plaza floor's far edge under fog.
- [ ] **Step 4: Console clean** (`shoot.mjs` prints console errors and warnings): no missing files, no shader warnings.
- [ ] **Step 5: Commit**

```bash
git add src/scripts/stage-run.ts src/scripts/stage-paint.ts src/components/Journey.astro src/lib/stage/sets.ts
git commit -m "feat(stage): HDRI light, scanned models and surfaces, one dolly through doorways"
```

---

### Task 6: Tune, retire the old engine, document

**Files:**
- Delete: `src/lib/stage/world.ts`, `src/lib/stage/env.ts`, `src/lib/stage/props.ts`, `tests/stage/world.test.ts`, `tests/stage/env.test.ts`, `tests/stage/props.test.ts`
- Keep: `src/lib/stage/figure3d.ts`, `tests/stage/figure3d.test.ts` (unmounted, for the avatar decision), `rig.ts`, `surface.ts` (trim to `heightField`, `packDetail`, `detailMap` and the `water` entry; drop the `SURFACE` table and its test), `shot.ts` (keep only `stageProgress`; move `Station`-typed `makeShot` and its test out)
- Modify: `docs/rebuild/10-session-log.md` (new top entry), `docs/rebuild/README.md` (list 13 and 14)

- [ ] **Step 1: Tune by screenshots**, one set at a time, in this order, each a commit:
  - Exposure and sun per set so a white wall reads about 0.8 grey, never clipping; shadow softness `sun.shadow.radius` 3; `normalBias` 0.02.
  - Placement sizes and positions (models' real dimensions from `api.polyhaven.com/info/<id>`.dimensions in mm).
  - GTAO `blendIntensity` 0.6; if corners go dirty, 0.45.
  - Fog so the plaza's far edge dissolves into the HDRI hills.
  - Measure fps at 1440 × 900 with the scratchpad `perf` pattern (average `dt` over 120 frames at q 0, 0.5, 1); dpr cap stays 1.5 if the median frame is under 16 ms at dpr 1.5 on this machine, else 1.25.
- [ ] **Step 2: Delete the old modules and tests, fix imports, `npm test` and `tsc` clean.**
- [ ] **Step 3: `npx astro build`; print `du -sh dist/_astro/stage-run*.js` gz size and `du -sh public/assets/stage`; both in the session log entry.**
- [ ] **Step 4: Session log entry** "2026-08-30: real light, real things, one dolly": what changed, the numbers, the asset list, what is still code-built and why, the avatar decision pending.
- [ ] **Step 5: Commit**

```bash
git add -A src tests docs
git commit -m "refactor(stage): retire morph actors and per-station light; document v3"
```

---

## Self-review

- Spec coverage: §1 look → Tasks 1, 5 (HDRI, scans, matte, no bloom/grade), 6 (tune). §2 motion → Tasks 2 (dolly, doorway blend), 5 (live things, spring, reduced motion, hotspots). §3 pipeline → Task 1. §4 world model → Tasks 2, 3, 4. §5 testing → each task's tests plus Task 6 build gate. §6 out of scope: the figure stays unmounted (Task 6 keeps `figure3d.ts`).
- Types: `V3` is defined in `sets.ts` and imported by `dolly.ts`; `Live`, `Placement`, `Shell`, `Opening`, `StageSet` in `sets.ts`; `Slab` in `shell.ts`; `Built`, `BuiltPart`, `BuiltSurface`, `BUILT` in `built.ts`; `DollyKey`, `Frame`, `DOLLY`, `makeDolly` in `dolly.ts`; `Asset`, `ASSETS`, `assetUrl`, `asset` in `assets.ts`. The runtime consumes exactly these names.
- Placements name `banner`, `teamPhoto`, `tube`, `plazaFloor`, `counter` as builds: all in `BUILT`.
