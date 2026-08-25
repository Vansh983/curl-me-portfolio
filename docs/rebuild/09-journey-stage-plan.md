# Journey Stage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A full-bleed sticky stage on the home page where an ink-stroke figure of Vansh morphs from 13 to now as the reader scrolls, with per-chapter scenery and place backgrounds drawing on and fading around it.

**Architecture:** One pure function `figure(params)` returns a fixed list of SVG path strings; a ~2 KB inline script lerps params between per-chapter keyframes from scroll progress and rewrites `d`. Scenery and backgrounds are hand-authored stroke SVGs animated by CSS scroll timelines (`view-timeline` per chapter, `timeline-scope` on the section) with an IntersectionObserver-free `data-chapter` fallback set by the same script for Firefox. Art is produced in a render-look-fix loop: a Node script rasterises any keyframe or scene to PNG with `sharp`, Claude reads the PNG, Vansh corrects.

**Tech Stack:** Astro 7.2 static, TypeScript (erasable syntax only, run with `node --experimental-strip-types`), `node --test`, `sharp` (already a dependency via Astro) for rendering, no new runtime dependencies.

**Spec:** `docs/rebuild/08-journey-stage-spec.md` (read it first; research in `docs/rebuild/07-journey-stage.md`).

## Global Constraints

- No new runtime dependencies. No GSAP, Lottie, Rive, three.js.
- Inline stage script under 3 KB gzipped. No framework islands.
- All art is stroked SVG paths: `stroke="currentColor" fill="none"`, round caps and joins, `vector-effect="non-scaling-stroke"`, no text, no raster, no fills. At most one accent (`var(--acc)`) element per chapter.
- `figure()` must return the same stroke ids in the same order with the same path command signature for every parameter set.
- Animation CSS uses longhands only (`animation-name`, `animation-duration`, `animation-timing-function`, `animation-fill-mode`, `animation-timeline`, `animation-range`). Never the `animation` shorthand next to a timeline. Explicit ranges (`entry 0% entry 100%`), never bare `entry`.
- `overflow: clip`, never `overflow: hidden`, on the stage or any ancestor.
- Stage is `aria-hidden="true"`; every SVG in it is `focusable="false"`. Text stays first in DOM order inside each chapter.
- `prefers-reduced-motion: reduce`: no drift, no draw-on, figure pinned to the nearest chapter, opacity crossfades kept.
- Commit messages follow `<type>: <description>` (feat, fix, refactor, docs, test, chore). No attribution trailers.
- Run `npm run check` (astro check) and `npm run build` before every commit that touches `src/`.
- Rendered PNGs go to `.renders/` (gitignored), never committed.

---

## File structure

| File | Responsibility |
|---|---|
| `src/lib/figure.ts` | `FigureParams` type, `figure(params): Stroke[]`, `KEY_DEFAULT`. Pure geometry, no DOM. |
| `src/lib/lerp.ts` | `clamp01`, `lerpParams`, `easeInOutSine`, `locate(progress, n)`. Pure. |
| `src/lib/scenes/bg-delhi.svg`, `bg-sf.svg`, `bg-halifax.svg`, `bg-room.svg` | Place backgrounds, 10 to 25 strokes each. |
| `src/lib/scenes/sc-2013.svg` … `sc-2025.svg` | Per-chapter scenery, 5 to 15 strokes each, `pathLength="1"` on every path. |
| `src/data/timeline.ts` | Existing `Milestone` gains `scene: { place, scenery, figure }`. |
| `src/components/Journey.astro` | Full-bleed section: sticky stage (backgrounds, scenery, figure), wall of chapters, all CSS, the inline script. |
| `src/pages/index.astro` | Swap `<Timeline />` for `<Journey />`. |
| `astro.config.mjs` | `cssMinify: 'esbuild'`. |
| `scripts/render.mjs` | Rasterise a keyframe (and optionally a scene/background) to PNG for the art loop. |
| `tests/figure.test.ts`, `tests/lerp.test.ts` | `node --test` unit tests. |
| `package.json` | `test` and `render` scripts. |
| `.gitignore` | `.renders/`. |

---

### Task 1: `figure.ts`, the parametric stroke figure

**Files:**
- Create: `src/lib/figure.ts`
- Create: `tests/figure.test.ts`
- Modify: `package.json` (add `test` script), `.gitignore` (add `.renders/`)

**Interfaces:**
- Produces: `export type FigureParams`, `export type Stroke = { id: string; d: string; opacity: number; accent: boolean }`, `export function figure(p: FigureParams): Stroke[]`, `export const KEY_DEFAULT: FigureParams`, `export const STROKE_IDS: readonly string[]`.
- Coordinate space: local units, feet on `y = 0`, up is negative `y`, figure centred on `x = 0`. Full height at `height = 1` is 480 units.

- [ ] **Step 1: Add the test script and gitignore entry**

In `package.json` `scripts` add:

```json
"test": "node --experimental-strip-types --test tests/",
"render": "node --experimental-strip-types scripts/render.mjs"
```

Append to `.gitignore`:

```
.renders/
```

- [ ] **Step 2: Write the failing test**

`tests/figure.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { figure, KEY_DEFAULT, STROKE_IDS, type FigureParams } from '../src/lib/figure.ts';

const sig = (d: string) => d.replace(/-?\d+(\.\d+)?/g, '#');

const KID: FigureParams = {
  ...KEY_DEFAULT,
  height: 0.55,
  headRatio: 0.24,
  shoulder: 0.1,
  hairTop: 0.8,
  glasses: 0,
  beard: 0,
  prop: { ...KEY_DEFAULT.prop, show: 1, w: 0.22, h: 0.14, stem: 0 },
};
const FOUNDER: FigureParams = {
  ...KEY_DEFAULT,
  height: 1,
  headRatio: 0.16,
  shoulder: 0.14,
  hairTop: 0.4,
  glasses: 1,
  beard: 0.6,
  lean: 0.3,
  armR: { shoulder: 70, elbow: -60 },
};

test('same ids, same order, same command signature at every age', () => {
  const a = figure(KID);
  const b = figure(FOUNDER);
  assert.deepEqual(a.map((s) => s.id), [...STROKE_IDS]);
  assert.deepEqual(b.map((s) => s.id), [...STROKE_IDS]);
  for (let i = 0; i < a.length; i++) assert.equal(sig(a[i].d), sig(b[i].d), a[i].id);
});

test('every number is finite and every opacity is in [0,1]', () => {
  for (const s of figure(FOUNDER)) {
    for (const n of s.d.match(/-?\d+(\.\d+)?/g) ?? []) assert.ok(Number.isFinite(Number(n)), s.id);
    assert.ok(s.opacity >= 0 && s.opacity <= 1, s.id);
  }
});

test('out of range params are clamped, not thrown', () => {
  const wild = { ...FOUNDER, height: 9, glasses: -3, face: { smile: 5, browL: -9, browR: 9, eyeOpen: 2 } };
  assert.doesNotThrow(() => figure(wild));
  const top = Math.min(...figure(wild).flatMap((s) => (s.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)));
  assert.ok(top >= -520, 'height clamps to 1 so nothing is above 480 plus hair');
});

test('the figure grows with height and the head shrinks with headRatio', () => {
  const head = (p: FigureParams) => figure(p).find((s) => s.id === 'head')!.d;
  const r = (d: string) => Number(d.match(/A (-?\d+(?:\.\d+)?)/)![1]);
  assert.ok(r(head(KID)) > r(head({ ...KID, headRatio: 0.16 })));
  assert.ok(r(head(FOUNDER)) < r(head({ ...FOUNDER, height: 0.6, headRatio: 0.3 })));
});

test('deterministic', () => {
  assert.deepEqual(figure(KID), figure(KID));
});
```

- [ ] **Step 3: Run it to make sure it fails**

Run: `npm test`
Expected: FAIL, `Cannot find module '../src/lib/figure.ts'`.

- [ ] **Step 4: Write `src/lib/figure.ts`**

```ts
// The whole character. Pure geometry: params in, stroke paths out.
// Rule: same ids, same order, same command structure for every input,
// so lerping the params IS morphing the drawing. Things that "appear"
// (glasses, beard, prop) are always drawn and use opacity to hide.

export type Arm = { shoulder: number; elbow: number }; // degrees; 0 hangs down, + swings forward (to +x)
export type Prop = { show: number; w: number; h: number; stem: number; x: number; y: number; rot: number };
export type Face = { smile: number; browL: number; browR: number; eyeOpen: number };

export type FigureParams = {
  height: number; // 0..1 of 480 units
  headRatio: number; // head diameter / height, 0.14..0.3
  shoulder: number; // half shoulder width / height, 0.08..0.18
  hairTop: number; // 0..1
  hairSide: number; // 0..1
  glasses: number; // 0..1 opacity
  beard: number; // 0..1 size and opacity
  sleeve: number; // 0 short .. 1 long
  collar: number; // 0 tee .. 1 collar
  lean: number; // -1..1
  armL: Arm;
  armR: Arm;
  legStance: number; // 0 together .. 1 apart
  prop: Prop; // w,h,stem in units of height; x,y offset from the right hand in units of height; rot degrees
  face: Face; // smile -1..1, brows -1..1, eyeOpen 0..1
};

export type Stroke = { id: string; d: string; opacity: number; accent: boolean };

export const STROKE_IDS = [
  'legL', 'legR', 'torso', 'shoulders', 'armL', 'armR',
  'prop', 'propStem', 'head', 'hair', 'hairL', 'hairR',
  'eyeL', 'eyeR', 'browL', 'browR', 'mouth', 'glasses', 'beard',
] as const;

export const KEY_DEFAULT: FigureParams = {
  height: 1,
  headRatio: 0.17,
  shoulder: 0.13,
  hairTop: 0.5,
  hairSide: 0.3,
  glasses: 0,
  beard: 0,
  sleeve: 0.5,
  collar: 0.3,
  lean: 0,
  armL: { shoulder: -8, elbow: 10 },
  armR: { shoulder: 8, elbow: -10 },
  legStance: 0.4,
  prop: { show: 0, w: 0.18, h: 0.12, stem: 0, x: 0.02, y: -0.02, rot: 0 },
  face: { smile: 0.4, browL: 0, browR: 0, eyeOpen: 1 },
};

const H_MAX = 480;
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const f = (n: number) => (Math.round(n * 10) / 10).toString();
const pt = (x: number, y: number) => `${f(x)} ${f(y)}`;
const rad = (deg: number) => (deg * Math.PI) / 180;

// Every helper emits a fixed command structure.
const circle = (cx: number, cy: number, r: number) =>
  `M ${pt(cx - r, cy)} A ${f(r)} ${f(r)} 0 1 0 ${pt(cx + r, cy)} A ${f(r)} ${f(r)} 0 1 0 ${pt(cx - r, cy)}`;
const line = (...p: [number, number][]) => p.map((q, i) => `${i ? 'L' : 'M'} ${pt(q[0], q[1])}`).join(' ');
const quad = (a: [number, number], c: [number, number], b: [number, number]) =>
  `M ${pt(a[0], a[1])} Q ${pt(c[0], c[1])} ${pt(b[0], b[1])}`;
const cubic = (a: [number, number], c1: [number, number], c2: [number, number], b: [number, number]) =>
  `M ${pt(a[0], a[1])} C ${pt(c1[0], c1[1])} ${pt(c2[0], c2[1])} ${pt(b[0], b[1])}`;
const rot = (x: number, y: number, deg: number, ox: number, oy: number): [number, number] => {
  const s = Math.sin(rad(deg)), c = Math.cos(rad(deg));
  const dx = x - ox, dy = y - oy;
  return [ox + dx * c - dy * s, oy + dx * s + dy * c];
};

function arm(sx: number, sy: number, a: Arm, H: number): { d: string; hand: [number, number] } {
  const up = H * 0.2, lo = H * 0.18;
  const a1 = rad(clamp(a.shoulder, -170, 170));
  const ex = sx + Math.sin(a1) * up, ey = sy + Math.cos(a1) * up;
  const a2 = a1 + rad(clamp(a.elbow, -150, 150));
  const hx = ex + Math.sin(a2) * lo, hy = ey + Math.cos(a2) * lo;
  return { d: line([sx, sy], [ex, ey], [hx, hy]), hand: [hx, hy] };
}

export function figure(p: FigureParams): Stroke[] {
  const H = H_MAX * clamp(p.height, 0.2, 1);
  const headD = H * clamp(p.headRatio, 0.12, 0.32);
  const r = headD / 2;
  const lean = clamp(p.lean, -1, 1);
  const lx = lean * H * 0.06; // upper body shifts with lean

  const hipY = -H * 0.48;
  const neckY = -(H - headD);
  const cx = lx, cy = neckY - r; // head centre
  const shY = neckY + H * 0.03;
  const halfSh = H * clamp(p.shoulder, 0.08, 0.18);
  const collar = clamp(p.collar, 0, 1);

  // legs
  const stance = H * 0.12 * clamp(p.legStance, 0, 1);
  const kneeY = hipY / 2;
  const legL = line([0, hipY], [-stance * 0.6, kneeY], [-stance, 0]);
  const legR = line([0, hipY], [stance * 0.6, kneeY], [stance, 0]);

  // torso and shoulders (collar lifts the shoulder curve into a V)
  const torso = line([0, hipY], [lx, neckY]);
  const shoulders = cubic(
    [lx - halfSh, shY + H * 0.02],
    [lx - halfSh * 0.4, shY - collar * H * 0.03],
    [lx + halfSh * 0.4, shY - collar * H * 0.03],
    [lx + halfSh, shY + H * 0.02],
  );

  // arms
  const L = arm(lx - halfSh, shY + H * 0.02, p.armL, H);
  const R = arm(lx + halfSh, shY + H * 0.02, p.armR, H);

  // prop: a rounded box with a stem, held in the right hand
  const pr = p.prop;
  const pw = H * clamp(pr.w, 0.02, 0.4), ph = H * clamp(pr.h, 0.02, 0.4);
  const px = R.hand[0] + H * clamp(pr.x, -0.3, 0.3), py = R.hand[1] + H * clamp(pr.y, -0.3, 0.3);
  const prr = clamp(pr.rot, -180, 180);
  const corners: [number, number][] = [
    rot(px - pw / 2, py - ph / 2, prr, px, py),
    rot(px + pw / 2, py - ph / 2, prr, px, py),
    rot(px + pw / 2, py + ph / 2, prr, px, py),
    rot(px - pw / 2, py + ph / 2, prr, px, py),
    rot(px - pw / 2, py - ph / 2, prr, px, py),
  ];
  const prop = line(...corners);
  const stemEnd = rot(px, py + ph / 2 + H * clamp(pr.stem, 0, 0.4), prr, px, py);
  const propStem = line(rot(px, py + ph / 2, prr, px, py), stemEnd);
  const propShow = clamp(pr.show, 0, 1);

  // head and hair
  const head = circle(cx, cy, r);
  const ht = clamp(p.hairTop, 0, 1), hs = clamp(p.hairSide, 0, 1);
  const hair = cubic(
    [cx - r * 0.95, cy - r * 0.2],
    [cx - r * 0.7, cy - r * (1.1 + ht * 0.6)],
    [cx + r * 0.7, cy - r * (1.1 + ht * 0.6)],
    [cx + r * 0.95, cy - r * 0.2],
  );
  const hairL = quad([cx - r * 0.95, cy - r * 0.2], [cx - r * (1.05 + hs * 0.25), cy + r * 0.2], [cx - r * 0.9, cy + r * (0.3 + hs * 0.4)]);
  const hairR = quad([cx + r * 0.95, cy - r * 0.2], [cx + r * (1.05 + hs * 0.25), cy + r * 0.2], [cx + r * 0.9, cy + r * (0.3 + hs * 0.4)]);

  // face
  const fc = p.face;
  const eo = clamp(fc.eyeOpen, 0, 1);
  const ex = r * 0.35, ey = cy - r * 0.05;
  const er = r * 0.07 * (0.15 + 0.85 * eo);
  const eyeL = circle(cx - ex, ey, er);
  const eyeR = circle(cx + ex, ey, er);
  const bl = clamp(fc.browL, -1, 1) * r * 0.12, br = clamp(fc.browR, -1, 1) * r * 0.12;
  const by = cy - r * 0.35;
  const browL = line([cx - ex - r * 0.15, by + bl], [cx - ex + r * 0.15, by - bl]);
  const browR = line([cx + ex - r * 0.15, by + br], [cx + ex + r * 0.15, by - br]);
  const sm = clamp(fc.smile, -1, 1);
  const mouth = quad([cx - r * 0.3, cy + r * 0.45], [cx, cy + r * (0.45 + sm * 0.3)], [cx + r * 0.3, cy + r * 0.45]);

  // glasses: two lenses and a bridge, one path, hidden by opacity
  const gr = r * 0.3;
  const glasses =
    `${circle(cx - ex, ey, gr)} ${circle(cx + ex, ey, gr)} M ${pt(cx - ex + gr, ey)} L ${pt(cx + ex - gr, ey)}`;
  const gOp = clamp(p.glasses, 0, 1);

  // beard: hugs the jaw, grows down, hidden by opacity
  const bd = clamp(p.beard, 0, 1);
  const beard = quad([cx - r * 0.75, cy + r * 0.55], [cx, cy + r * (1 + bd * 0.6)], [cx + r * 0.75, cy + r * 0.55]);

  const s = (id: string, d: string, opacity = 1, accent = false): Stroke => ({ id, d, opacity, accent });
  return [
    s('legL', legL), s('legR', legR), s('torso', torso), s('shoulders', shoulders),
    s('armL', L.d), s('armR', R.d),
    s('prop', prop, propShow, true), s('propStem', propStem, propShow),
    s('head', head), s('hair', hair), s('hairL', hairL, hs), s('hairR', hairR, hs),
    s('eyeL', eyeL), s('eyeR', eyeR), s('browL', browL), s('browR', browR), s('mouth', mouth),
    s('glasses', glasses, gOp), s('beard', beard, bd),
  ];
}
```

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: 5 passing. If `hairL`/`hairR` signature differs between KID and FOUNDER, check that `quad` is used for both; the signature test will name the stroke.

- [ ] **Step 6: Commit**

```bash
git add src/lib/figure.ts tests/figure.test.ts package.json .gitignore
git commit -m "feat: add the parametric stroke figure"
```

---

### Task 2: `lerp.ts`, interpolation and scroll mapping

**Files:**
- Create: `src/lib/lerp.ts`
- Create: `tests/lerp.test.ts`

**Interfaces:**
- Consumes: `FigureParams` from Task 1.
- Produces: `export const clamp01 = (v: number) => number`, `export const easeInOutSine = (t: number) => number`, `export function lerpParams(a: FigureParams, b: FigureParams, t: number): FigureParams`, `export function locate(p: number, n: number): { i: number; t: number }` where `i` is the chapter index in `0..n-1` and `t` in `0..1` is the eased transition toward chapter `i+1` (0 while resting on `i`).

- [ ] **Step 1: Write the failing test**

`tests/lerp.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clamp01, easeInOutSine, lerpParams, locate } from '../src/lib/lerp.ts';
import { KEY_DEFAULT, type FigureParams } from '../src/lib/figure.ts';

const A: FigureParams = { ...KEY_DEFAULT, height: 0.5, armR: { shoulder: 0, elbow: 0 }, prop: { ...KEY_DEFAULT.prop, show: 0 } };
const B: FigureParams = { ...KEY_DEFAULT, height: 1, armR: { shoulder: 90, elbow: -30 }, prop: { ...KEY_DEFAULT.prop, show: 1 } };

test('endpoints', () => {
  assert.deepEqual(lerpParams(A, B, 0), A);
  assert.deepEqual(lerpParams(A, B, 1), B);
});

test('midpoint lerps nested numbers', () => {
  const m = lerpParams(A, B, 0.5);
  assert.equal(m.height, 0.75);
  assert.equal(m.armR.shoulder, 45);
  assert.equal(m.armR.elbow, -15);
  assert.equal(m.prop.show, 0.5);
});

test('clamp01 and ease', () => {
  assert.equal(clamp01(-1), 0);
  assert.equal(clamp01(2), 1);
  assert.equal(clamp01(NaN), 0);
  assert.equal(easeInOutSine(0), 0);
  assert.equal(easeInOutSine(1), 1);
  assert.ok(Math.abs(easeInOutSine(0.5) - 0.5) < 1e-9);
});

test('locate rests on each chapter and eases between', () => {
  const n = 7;
  assert.deepEqual(locate(0, n), { i: 0, t: 0 });
  assert.deepEqual(locate(1, n), { i: n - 1, t: 0 });
  // exactly on chapter 3
  assert.deepEqual(locate(3 / 6, n), { i: 3, t: 0 });
  // 10% into the span after chapter 3 is still resting (dwell)
  assert.deepEqual(locate(3 / 6 + 0.1 / 6, n), { i: 3, t: 0 });
  // halfway between 3 and 4 is halfway through the transition
  const mid = locate(3.5 / 6, n);
  assert.equal(mid.i, 3);
  assert.ok(Math.abs(mid.t - 0.5) < 1e-9);
  // 95% of the way is fully arrived
  assert.deepEqual(locate(3.95 / 6, n), { i: 3, t: 1 });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npm test`
Expected: FAIL, `Cannot find module '../src/lib/lerp.ts'`.

- [ ] **Step 3: Write `src/lib/lerp.ts`**

```ts
import type { FigureParams } from './figure.ts';

export const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * clamp01(t)) - 1) / 2;

// Recursive numeric lerp over the params shape. Non-numbers are taken from b.
function lerpAny<T>(a: T, b: T, t: number): T {
  if (typeof a === 'number' && typeof b === 'number') return (a + (b - a) * t) as T;
  if (a && b && typeof a === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(b as object)) out[k] = lerpAny((a as any)[k], (b as any)[k], t);
    return out as T;
  }
  return b;
}
export function lerpParams(a: FigureParams, b: FigureParams, t: number): FigureParams {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return lerpAny(a, b, t);
}

// Scroll progress 0..1 over n chapters. Each gap between chapters is one span;
// the first DWELL of a span rests on chapter i, the last DWELL rests on i+1,
// the middle eases across.
const DWELL = 0.3;
export function locate(p: number, n: number): { i: number; t: number } {
  const spans = Math.max(1, n - 1);
  const x = clamp01(p) * spans;
  let i = Math.min(spans - 1, Math.floor(x));
  if (n <= 1) return { i: 0, t: 0 };
  const frac = x - i;
  if (clamp01(p) === 1) return { i: n - 1, t: 0 };
  const raw = (frac - DWELL) / (1 - 2 * DWELL);
  const t = raw <= 0 ? 0 : raw >= 1 ? 1 : easeInOutSine(raw);
  return { i, t };
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: all passing (5 from Task 1 + 4 here).

- [ ] **Step 5: Commit**

```bash
git add src/lib/lerp.ts tests/lerp.test.ts
git commit -m "feat: add param lerp and scroll chapter mapping"
```

---

### Task 3: `scripts/render.mjs`, the art loop tool

**Files:**
- Create: `scripts/render.mjs`

**Interfaces:**
- Consumes: `figure`, `KEY_DEFAULT` (Task 1), `timeline` keyframes (Task 4, optional: falls back to `KEY_DEFAULT` when `--key` is not given).
- Produces: PNG files in `.renders/`. CLI: `npm run render -- [--key N | --params file.json] [--bg src/lib/scenes/bg-x.svg] [--scene src/lib/scenes/sc-x.svg] [--dark] [--out name.png]`.

- [ ] **Step 1: Write the script**

```js
// Rasterise a stage composition to PNG so the art can be looked at.
// Usage: npm run render -- --key 2 --bg src/lib/scenes/bg-sf.svg --scene src/lib/scenes/sc-2018.svg --out 2018.png
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { figure, KEY_DEFAULT } from '../src/lib/figure.ts';

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const flag = (name) => args.includes(name);

let params = KEY_DEFAULT;
if (opt('--params')) params = JSON.parse(readFileSync(resolve(opt('--params')), 'utf8'));
else if (opt('--key') !== undefined) {
  const { timeline } = await import('../src/data/timeline.ts');
  params = timeline[Number(opt('--key'))].scene.figure;
}

const dark = flag('--dark');
const bg = dark ? '#0a0a0a' : '#fdfdfc';
const ink = dark ? '#ededed' : '#111111';
const acc = '#b8e000';

// Strip the outer <svg> of an authored scene so its strokes inline into the stage.
const inner = (file) => {
  if (!file) return '';
  const s = readFileSync(resolve(file), 'utf8');
  return s.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
};

const FIG_X = 1100, FIG_Y = 860; // feet position on the 1600x900 stage
const strokes = figure(params)
  .map((s) => `<path d="${s.d}" opacity="${s.opacity}" stroke="${s.accent ? acc : 'currentColor'}"/>`)
  .join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" color="${ink}">
<rect width="1600" height="900" fill="${bg}"/>
<g fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
<g class="bg">${inner(opt('--bg'))}</g>
<g class="scene">${inner(opt('--scene'))}</g>
<line x1="0" y1="860" x2="1600" y2="860" stroke-opacity="0.18"/>
<g transform="translate(${FIG_X} ${FIG_Y})">${strokes}</g>
</g>
</svg>`;

mkdirSync('.renders', { recursive: true });
const out = resolve('.renders', opt('--out', 'stage.png'));
writeFileSync(out.replace(/\.png$/, '.svg'), svg);
await sharp(Buffer.from(svg), { density: 96 }).png().toFile(out);
console.log(out);
```

Note: `--experimental-strip-types` (set in the `render` npm script) lets `.mjs` import the `.ts` modules directly. Authored scenes must use `pathLength="1"` and no `stroke` overrides so they inherit the group's colour; a scene's accent path carries `stroke="var(--acc)"` in the site and `stroke="#b8e000"` is substituted here by the `--acc` replacement below.

- [ ] **Step 2: Add the accent substitution**

After `const inner = ...` add:

```js
const withAccent = (s) => s.replaceAll('var(--acc)', acc);
```

and change both `inner(...)` calls to `withAccent(inner(...))`.

- [ ] **Step 3: Run it against the default figure**

Run: `npm run render -- --out default.png`
Expected: prints `.renders/default.png`. Open the PNG (Read tool) and confirm a standing stick figure on a ground line, feet at the line, in the right half. If the figure is off-canvas, check `FIG_Y` and that `figure()` y values are negative (up).

- [ ] **Step 4: Commit**

```bash
git add scripts/render.mjs
git commit -m "chore: add the stage render script for the art loop"
```

---

### Task 4: chapter keyframes in `timeline.ts`

**Files:**
- Modify: `src/data/timeline.ts`

**Interfaces:**
- Consumes: `FigureParams`, `KEY_DEFAULT` (Task 1).
- Produces: `export type Place = 'delhi' | 'sf' | 'halifax' | 'room'`, `Milestone.scene: { place: Place; scenery: string; figure: FigureParams }` on every entry. `scenery` is the file stem in `src/lib/scenes/` (e.g. `sc-2013`).

- [ ] **Step 1: Add the types and the first keyframes**

At the top of `src/data/timeline.ts`:

```ts
import { KEY_DEFAULT, type FigureParams } from '../lib/figure';

export type Place = 'delhi' | 'sf' | 'halifax' | 'room';
export type Scene = { place: Place; scenery: string; figure: FigureParams };
```

Add `scene: Scene;` to `Milestone`. Then a keyframe per entry. First pass (the art loop in Task 9 tunes these):

```ts
const K = KEY_DEFAULT;
const kid: FigureParams = { ...K, height: 0.58, headRatio: 0.25, shoulder: 0.1, hairTop: 0.9, hairSide: 0.5, collar: 0, sleeve: 0.1, legStance: 0.5,
  armL: { shoulder: -14, elbow: 6 }, armR: { shoulder: 55, elbow: -75 },
  prop: { show: 1, w: 0.26, h: 0.17, stem: 0, x: 0.07, y: -0.05, rot: -8 },
  face: { smile: 0.8, browL: 0.3, browR: 0.3, eyeOpen: 1 } };
const teen: FigureParams = { ...K, height: 0.8, headRatio: 0.2, shoulder: 0.12, hairTop: 0.7, hairSide: 0.35, collar: 0.2, sleeve: 0.4, legStance: 0.4,
  armL: { shoulder: -20, elbow: 0 }, armR: { shoulder: 25, elbow: -110 },
  prop: { show: 1, w: 0.08, h: 0.11, stem: 0.16, x: 0.02, y: 0.04, rot: 180 },
  face: { smile: 1, browL: 0.5, browR: 0.5, eyeOpen: 1 } };
const studio: FigureParams = { ...K, height: 0.9, headRatio: 0.18, shoulder: 0.13, hairTop: 0.55, hairSide: 0.3, collar: 0.4, sleeve: 0.8, legStance: 0.35, lean: 0.25,
  armL: { shoulder: 30, elbow: -70 }, armR: { shoulder: 40, elbow: -80 },
  prop: { show: 1, w: 0.22, h: 0.14, stem: 0, x: 0.04, y: -0.02, rot: 0 },
  face: { smile: 0.2, browL: -0.3, browR: -0.3, eyeOpen: 0.7 } };
const halifax: FigureParams = { ...K, height: 0.96, headRatio: 0.17, shoulder: 0.135, hairTop: 0.5, hairSide: 0.25, collar: 0.7, sleeve: 1, legStance: 0.45,
  armL: { shoulder: -10, elbow: 5 }, armR: { shoulder: 12, elbow: -8 },
  prop: { show: 0, w: 0.1, h: 0.1, stem: 0, x: 0, y: 0, rot: 0 },
  face: { smile: 0.5, browL: 0.2, browR: 0.2, eyeOpen: 1 } };
const teach: FigureParams = { ...K, height: 1, headRatio: 0.165, shoulder: 0.14, hairTop: 0.45, hairSide: 0.25, collar: 0.6, sleeve: 0.7, legStance: 0.5, glasses: 0.6,
  armL: { shoulder: -60, elbow: -20 }, armR: { shoulder: 35, elbow: -95 },
  prop: { show: 1, w: 0.03, h: 0.05, stem: 0.22, x: 0.01, y: 0.02, rot: 180 },
  face: { smile: 0.6, browL: 0.4, browR: 0.4, eyeOpen: 1 } };
const bean: FigureParams = { ...K, height: 1, headRatio: 0.16, shoulder: 0.14, hairTop: 0.4, hairSide: 0.2, collar: 0.3, sleeve: 0.3, legStance: 0.4, glasses: 0.8, beard: 0.3,
  armL: { shoulder: -15, elbow: 10 }, armR: { shoulder: 45, elbow: -120 },
  prop: { show: 1, w: 0.07, h: 0.13, stem: 0, x: 0.02, y: 0.02, rot: 10 },
  face: { smile: 0.7, browL: 0.2, browR: 0.5, eyeOpen: 1 } };
const founder: FigureParams = { ...K, height: 1, headRatio: 0.16, shoulder: 0.145, hairTop: 0.4, hairSide: 0.2, collar: 0.8, sleeve: 1, legStance: 0.5, glasses: 1, beard: 0.6, lean: 0.15,
  armL: { shoulder: -25, elbow: 15 }, armR: { shoulder: 80, elbow: -40 },
  prop: { show: 1, w: 0.03, h: 0.03, stem: 0.06, x: 0.02, y: -0.03, rot: 90 },
  face: { smile: 0.4, browL: 0.1, browR: 0.1, eyeOpen: 0.9 } };
```

Then attach, in order: 2013 `{ place: 'delhi', scenery: 'sc-2013', figure: kid }`; 2018 `{ place: 'sf', scenery: 'sc-2018', figure: teen }`; 2020 `{ place: 'delhi', scenery: 'sc-2020', figure: studio }`; 2022 `{ place: 'halifax', scenery: 'sc-2022', figure: halifax }`; 2023 `{ place: 'halifax', scenery: 'sc-2023', figure: teach }`; 2024 `{ place: 'halifax', scenery: 'sc-2024', figure: bean }`; 2025 `{ place: 'room', scenery: 'sc-2025', figure: founder }`.

- [ ] **Step 2: Type-check and render every keyframe**

Run: `npm run check` (0 errors) then:

```bash
for i in 0 1 2 3 4 5 6; do npm run render -- --key $i --out key-$i.png; done
```

Look at all seven PNGs. Acceptance for this task is only: seven distinct, upright, on-the-ground figures that visibly grow. Looks are tuned in Task 9.

- [ ] **Step 3: Commit**

```bash
git add src/data/timeline.ts
git commit -m "feat: add a figure keyframe and place to every chapter"
```

---

### Task 5: `Journey.astro`, layout and static stage

**Files:**
- Create: `src/components/Journey.astro`
- Create: `src/lib/scenes/bg-delhi.svg`, `bg-sf.svg`, `bg-halifax.svg`, `bg-room.svg`, `sc-2013.svg` … `sc-2025.svg` as **placeholders** (one labelled rectangle each; real art in Tasks 8 and 9)
- Modify: `src/pages/index.astro` (swap the component), `astro.config.mjs` (`cssMinify: 'esbuild'`)

**Interfaces:**
- Consumes: `timeline` with `scene` (Task 4), `figure`, `STROKE_IDS` (Task 1).
- Produces: DOM contract used by Task 6 and 7: `section.journey[data-n][data-chapter]` > `div.stage[aria-hidden]` > `svg.stage-svg` containing `g.bg[data-place]` groups, `g.sc[data-i]` groups, `g.fig` with `path[data-id]` per stroke; then `div.wall` > `article.ch[id=ch-N][data-i]`. `section.journey` carries `data-keys` (JSON array of `FigureParams`).

- [ ] **Step 1: Placeholder scene files**

Each placeholder is a valid stroke SVG so the pipeline is real from day one. `src/lib/scenes/bg-delhi.svg` (repeat for the other three backgrounds with the name changed):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <path pathLength="1" d="M 0 860 L 1600 860"/>
  <path pathLength="1" d="M 120 860 L 120 700 L 420 700 L 420 860"/>
</svg>
```

`src/lib/scenes/sc-2013.svg` (repeat for sc-2018, sc-2020, sc-2022, sc-2023, sc-2024, sc-2025 with different `x`):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <path pathLength="1" d="M 800 860 L 800 780 L 900 780 L 900 860"/>
  <path pathLength="1" class="accent" stroke="var(--acc)" d="M 820 800 L 880 800"/>
</svg>
```

- [ ] **Step 2: Write `Journey.astro` (markup and static CSS; the timelines and script come in Tasks 6 and 7)**

```astro
---
import { timeline } from '../data/timeline';
import { figure } from '../lib/figure';
// Astro inlines .svg imports as components; attributes pass through.
import BgDelhi from '../lib/scenes/bg-delhi.svg';
import BgSf from '../lib/scenes/bg-sf.svg';
import BgHalifax from '../lib/scenes/bg-halifax.svg';
import BgRoom from '../lib/scenes/bg-room.svg';
const scenes = import.meta.glob('../lib/scenes/sc-*.svg', { eager: true, import: 'default' });

const n = timeline.length;
const keys = timeline.map((m) => m.scene.figure);
const first = figure(keys[0]);
const bgs = { delhi: BgDelhi, sf: BgSf, halifax: BgHalifax, room: BgRoom } as const;
const places = [...new Set(timeline.map((m) => m.scene.place))];
const sceneFor = (stem: string) => scenes[`../lib/scenes/${stem}.svg`] as any;
---

<section class="journey" data-n={n} data-chapter="0" data-keys={JSON.stringify(keys)} style={`--n:${n}`}>
  <div class="stage" aria-hidden="true">
    <svg class="stage-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" focusable="false">
      <g class="ink">
        {places.map((p) => { const Bg = bgs[p]; return <g class="bg" data-place={p}><Bg /></g>; })}
        {timeline.map((m, i) => { const Sc = sceneFor(m.scene.scenery); return <g class="sc" data-i={i}><Sc /></g>; })}
        <path class="ground" d="M 0 860 L 1600 860" />
        <g class="fig" transform="translate(1100 860)">
          {first.map((s) => <path data-id={s.id} d={s.d} style={`opacity:${s.opacity}`} class:list={{ accent: s.accent }} />)}
        </g>
      </g>
    </svg>
  </div>

  <div class="wall">
    {timeline.map((m, i) => (
      <article class="ch" id={`ch-${i + 1}`} data-i={i} style={`--i:${i + 1}`}>
        <div class="tx">
          <span class="yr">{m.year}{m.span && <span class="mut"> {m.span}</span>}</span>
          {m.lane && <span class="lane label">{m.lane}</span>}
          <h3>{m.title}</h3>
          <p>{m.body}</p>
          {m.stat && <p class="stat">{m.stat}</p>}
        </div>
      </article>
    ))}
  </div>
</section>

<style>
  .journey {
    position: relative;
    width: 100vw;
    margin-left: calc(50% - 50vw);
    timeline-scope: --ch-1, --ch-2, --ch-3, --ch-4, --ch-5, --ch-6, --ch-7, --ch-8, --ch-9, --ch-10;
    view-timeline-name: --story;
  }
  .stage {
    position: sticky;
    top: 0;
    height: 100svh;
    width: 100%;
    overflow: clip;
    contain: paint;
    z-index: 0;
    background: var(--bg);
  }
  .stage-svg {
    display: block;
    width: 100%;
    height: 100%;
    color: var(--tx);
  }
  .ink {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }
  .ink :global(path) { vector-effect: non-scaling-stroke; }
  .ground { stroke-opacity: 0.18; }
  .fig .accent, .ink :global(.accent) { stroke: var(--acc); }

  /* until the timelines land (Task 7), only chapter 0's layers show */
  .bg, .sc { opacity: 0; }
  .journey[data-chapter="0"] .bg[data-place="delhi"], .journey[data-chapter="0"] .sc[data-i="0"] { opacity: 1; }

  .wall {
    position: relative;
    z-index: 1;
    margin-top: -100svh;
    padding: 0 var(--pad);
  }
  .ch {
    min-height: 100svh;
    padding-top: 18svh;
  }
  .tx {
    max-width: min(var(--measure), 46ch);
    padding: 18px 20px 18px 0;
    background: color-mix(in srgb, var(--bg) 74%, transparent);
    -webkit-mask: linear-gradient(90deg, #000 88%, transparent);
    mask: linear-gradient(90deg, #000 88%, transparent);
  }
  .yr {
    display: block;
    font-family: var(--f-display);
    font-weight: 300;
    font-size: 54px;
    line-height: 1;
    letter-spacing: -0.035em;
    font-variant-numeric: tabular-nums;
  }
  .yr .mut { font-family: var(--f-mono); font-size: var(--t-label); letter-spacing: 0.09em; }
  .lane { display: block; margin: 10px 0 6px; }
  .tx h3 { font-size: 22px; margin: 0 0 8px; }
  .stat { margin-top: 10px; font-family: var(--f-mono); font-size: 12px; letter-spacing: 0.02em; color: var(--mut); }

  @media (max-width: 48rem) {
    .stage-svg { transform: translateX(var(--stage-x, 12%)); }
    .ch { padding-top: 52svh; }
    .tx { max-width: none; background: color-mix(in srgb, var(--bg) 82%, transparent); }
    .yr { font-size: 40px; }
  }
  @media print {
    .stage { display: none; }
    .wall { margin-top: 0; }
    .ch { min-height: 0; padding-top: 0; }
  }
</style>
```

The `timeline-scope` lists ten names so adding chapters later needs no CSS edit; unused names are harmless.

- [ ] **Step 3: Wire it in and fix the minifier**

`src/pages/index.astro`: replace `import Timeline from '../components/Timeline.astro';` with `import Journey from '../components/Journey.astro';` and `<Timeline />` with `<Journey />`. Keep `.story { margin-top: 80px }`.

`astro.config.mjs`: change `build: { cssMinify: false }` to `build: { cssMinify: 'esbuild' }` and update the comment: `// Lightning CSS (Vite's default) folds animation-timeline into the animation shorthand (parcel-bundler/lightningcss#1283). esbuild does not.`

- [ ] **Step 4: Build and look**

Run: `npm run check && npm run build`
Expected: 0 errors. Then `npm run dev`, open `http://localhost:4321`, and check: the stage fills the viewport and stays put while the seven chapters scroll over it; the chapter-0 figure stands on the ground line at the right; text is readable over the strokes; no horizontal scrollbar (if one appears, add `html { overflow-x: clip; }` to `global.css`); dark mode recolours everything; mobile width shows the figure top-right and text lower-left.

- [ ] **Step 5: Commit**

```bash
git add src/components/Journey.astro src/lib/scenes src/pages/index.astro astro.config.mjs
git commit -m "feat: add the full-bleed journey stage with a static first chapter"
```

---

### Task 6: the scroll script (figure morph, chapter state, reduced motion)

**Files:**
- Modify: `src/components/Journey.astro` (add the `<script>`)

**Interfaces:**
- Consumes: DOM contract from Task 5, `figure`, `lerpParams`, `locate`, `clamp01` from Tasks 1 and 2.
- Produces: on every frame, `path[data-id]` `d` and `style.opacity` updated; `section.journey[data-chapter]` set to the nearest chapter index; `--p` custom property on the section set to progress (Task 7 uses neither `--p` nor JS for scenery in supporting browsers, but the fallback does use `data-chapter`).

- [ ] **Step 1: Add the script to `Journey.astro`**

```astro
<script>
  import { figure, type FigureParams } from '../lib/figure';
  import { lerpParams, locate, clamp01 } from '../lib/lerp';

  const root = document.querySelector<HTMLElement>('.journey');
  if (root) {
    const keys = JSON.parse(root.dataset.keys!) as FigureParams[];
    const n = keys.length;
    const paths = new Map<string, SVGPathElement>();
    root.querySelectorAll<SVGPathElement>('.fig path[data-id]').forEach((el) => paths.set(el.dataset.id!, el));
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');

    let target = 0, cur = 0, raf = 0, lastKey = -1;

    const draw = (p: number) => {
      const { i, t } = locate(p, n);
      const params = t === 0 ? keys[i] : t === 1 ? keys[i + 1] : lerpParams(keys[i], keys[i + 1], t);
      for (const s of figure(params)) {
        const el = paths.get(s.id);
        if (!el) continue;
        el.setAttribute('d', s.d);
        el.style.opacity = String(s.opacity);
      }
      const near = Math.round(p * (n - 1));
      if (near !== lastKey) { lastKey = near; root.dataset.chapter = String(near); }
      root.style.setProperty('--p', p.toFixed(4));
    };

    const progress = () => {
      const r = root.getBoundingClientRect();
      const total = r.height - innerHeight;
      return total > 0 ? clamp01(-r.top / total) : 0;
    };

    const tick = () => {
      raf = 0;
      if (reduce.matches) { cur = target; }
      else { cur += (target - cur) * 0.18; if (Math.abs(target - cur) < 0.0005) cur = target; }
      try { draw(reduce.matches ? Math.round(cur * (n - 1)) / (n - 1) : cur); } catch { /* keep last good frame */ }
      if (cur !== target) raf = requestAnimationFrame(tick);
    };
    const onScroll = () => { target = progress(); if (!raf) raf = requestAnimationFrame(tick); };

    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    reduce.addEventListener('change', onScroll);
    onScroll();
  }
</script>
```

- [ ] **Step 2: Verify in the browser**

`npm run dev`. Scroll slowly: the figure grows and changes pose with a little lag; it rests on each chapter and moves in the middle of each gap. Scroll fast then stop: it settles within ~0.5 s. In DevTools set "Emulate prefers-reduced-motion: reduce": the figure snaps to the nearest chapter with no lerp. `data-chapter` on the section changes at chapter midpoints. No console errors. `npm run build` then check `dist/index.html` for the script size: `gzip -c dist/_astro/*.js | wc -c` should report under 3072 bytes for the journey chunk (find it by grepping for `data-keys`).

- [ ] **Step 3: Commit**

```bash
git add src/components/Journey.astro
git commit -m "feat: morph the journey figure with scroll"
```

---

### Task 7: CSS scroll timelines for backgrounds and scenery, plus the fallback

**Files:**
- Modify: `src/components/Journey.astro` (CSS only)

**Interfaces:**
- Consumes: `article.ch[data-i]`, `g.bg[data-place]`, `g.sc[data-i]`, `section.journey[data-chapter]` from Tasks 5 and 6; `timeline[i].scene.place` for the place-to-chapter mapping.

- [ ] **Step 1: Emit per-chapter timeline names and a place map**

In the frontmatter add:

```ts
// which chapters each place spans, so a background fades in at its first chapter and out at its last
const span = Object.fromEntries(places.map((p) => {
  const idx = timeline.map((m, i) => (m.scene.place === p ? i : -1)).filter((i) => i >= 0);
  return [p, { from: idx[0] + 1, to: idx[idx.length - 1] + 1 }];
}));
```

On each `article.ch` add `style={`--i:${i + 1}; view-timeline: --ch-${i + 1} block;`}` (replace the existing `style`). On each `g.bg` add `style={`--from:--ch-${span[p].from}; --to:--ch-${span[p].to};`}` is **not** valid CSS (custom properties cannot hold timeline names for `animation-timeline`), so instead emit the timelines directly: `style={`animation-timeline: --ch-${span[p].from}, --ch-${span[p].to};`}`. On each `g.sc` add `style={`animation-timeline: --ch-${i + 1}, --ch-${i + 1};`}`.

- [ ] **Step 2: Replace the temporary `.bg, .sc` rules with the timeline CSS**

Delete the two "until the timelines land" rules from Task 5 and add:

```css
  /* Scenery: draw on while its chapter enters, fade out while it exits. */
  .sc {
    opacity: 0;
    animation-name: fade-in, fade-out;
    animation-duration: auto, auto;
    animation-timing-function: linear, linear;
    animation-fill-mode: both, both;
    animation-range: entry 0% entry 100%, exit 0% exit 100%;
  }
  .sc :global(path) {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation-name: draw;
    animation-duration: auto;
    animation-timing-function: linear;
    animation-fill-mode: both;
    animation-timeline: inherit; /* set per group by the inline style on .sc */
    animation-range: entry 10% entry 90%;
  }
  /* Backgrounds: in at the first chapter of the place, out at the last. */
  .bg {
    opacity: 0;
    animation-name: fade-in, fade-out;
    animation-duration: auto, auto;
    animation-timing-function: linear, linear;
    animation-fill-mode: both, both;
    animation-range: entry 0% entry 100%, exit 0% exit 100%;
  }
  @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
  @keyframes fade-out { from { opacity: 1 } to { opacity: 0 } }
  @keyframes draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }

  /* Fallback (Firefox stable): the script's data-chapter picks the layers, fully drawn. */
  @supports not ((animation-timeline: scroll()) and (animation-range: 0% 100%)) {
    .bg, .sc { animation-name: none; transition: opacity 0.4s; }
    .sc :global(path) { animation-name: none; stroke-dashoffset: 0; }
    .journey[data-chapter="0"] .sc[data-i="0"], .journey[data-chapter="1"] .sc[data-i="1"],
    .journey[data-chapter="2"] .sc[data-i="2"], .journey[data-chapter="3"] .sc[data-i="3"],
    .journey[data-chapter="4"] .sc[data-i="4"], .journey[data-chapter="5"] .sc[data-i="5"],
    .journey[data-chapter="6"] .sc[data-i="6"], .journey[data-chapter="7"] .sc[data-i="7"],
    .journey[data-chapter="8"] .sc[data-i="8"], .journey[data-chapter="9"] .sc[data-i="9"] { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .sc :global(path) { animation-name: none; stroke-dashoffset: 0; }
  }
```

`animation-timeline: inherit` is not a real keyword for that property in all engines; if Chrome ignores it, move the per-path timeline onto the paths by emitting `style` on each `<path>` inside the scene SVGs at build time instead. Do this: in the frontmatter, read each scene with `import.meta.glob('../lib/scenes/sc-*.svg', { eager: true, query: '?raw', import: 'default' })`, inject `style="animation-timeline: --ch-N"` into every `<path` via `.replaceAll('<path ', `<path style="animation-timeline: --ch-${i + 1}" `)`, and render it with `<Fragment set:html={...} />` instead of the SVG component. Then delete the `animation-timeline: inherit` line. Use this raw route for the `.sc` groups from the start if the inherit trick fails in the first browser check.

The fallback also needs the background mapping. Add, generated in the frontmatter as a `<style is:inline>` block (place spans are data, not static CSS):

```astro
<style is:inline set:html={
  `@supports not ((animation-timeline: scroll()) and (animation-range: 0% 100%)) {` +
  places.map((p) => {
    const sel = Array.from({ length: span[p].to - span[p].from + 1 }, (_, k) => `.journey[data-chapter="${span[p].from - 1 + k}"] .bg[data-place="${p}"]`).join(',');
    return `${sel}{opacity:1}`;
  }).join('') + '}'
} />
```

- [ ] **Step 3: Verify in three browsers**

Chrome and Safari 26: scroll; each chapter's scenery draws its strokes on as the chapter's top enters the viewport and fades as it leaves; the Delhi background is visible for chapters 1 and 3, SF for 2, Halifax for 4 to 6, the room for 7; exactly one background is fully visible at every rest point. Install Bramus's "Scroll-Driven Animations Debugger" DevTools extension if a timeline looks wrong; it lists which timeline each animation resolved to. Firefox: no timelines, `@supports not` branch applies, layers switch with a 0.4 s fade as `data-chapter` changes. Reduced motion: no draw-on, crossfades remain.

- [ ] **Step 4: Build check and commit**

Run: `npm run check && npm run build`, then `grep -c "animation-timeline" dist/_astro/*.css` must be non-zero (proves the minifier kept them).

```bash
git add src/components/Journey.astro
git commit -m "feat: drive scenery and place backgrounds from chapter scroll timelines"
```

---

### Task 8: retire the old timeline

**Files:**
- Delete: `src/components/Timeline.astro`
- Modify: `docs/rebuild/06-build-plan.md` (the "What exists right now" table row for the timeline), `src/pages/llms-full.txt.ts` and `src/pages/index.txt.ts` only if they import `Timeline.astro` (check with `grep -rn "Timeline" src/`)

- [ ] **Step 1: Remove and re-verify**

Run: `grep -rn "Timeline" src/` and remove every import of the component. `git rm src/components/Timeline.astro`. In `06-build-plan.md` change the row `| Timeline, scroll-driven, pure CSS | src/components/Timeline.astro |` to `| Journey stage, full-bleed sticky scene with a morphing stroke figure | src/components/Journey.astro, docs 07 to 09 |`.

Run: `npm run check && npm run build && npm test`. Expected: all clean.

- [ ] **Step 2: Commit**

```bash
git add -A src docs/rebuild/06-build-plan.md
git commit -m "refactor: replace the css timeline with the journey stage"
```

---

### Task 9: the art loop (backgrounds, scenery, figure keyframes)

This task repeats once per asset. It is where the time goes. Each round is the same five steps. Vansh reviews after every round; "perfect" is his call, not the implementer's.

**Files:**
- Modify: one of `src/lib/scenes/bg-*.svg`, `src/lib/scenes/sc-*.svg`, or the keyframe objects in `src/data/timeline.ts`.

**Order:** backgrounds first (they set the scale of everything), then the figure keyframes chapter by chapter, then scenery chapter by chapter. Backgrounds: Delhi, SF, Halifax, room. Scenery and keyframes: 2013, 2018, 2020, 2022, 2023, 2024, 2025.

**Rules for every SVG (from the spec):** `viewBox="0 0 1600 900"`, ground at `y = 860`, figure feet at `(1100, 860)`, keep `x < 700` sparse so text reads. Open stroked paths only, `pathLength="1"` on every path, `stroke="currentColor"` inherited (no `stroke` attribute except the single accent path, which carries `class="accent" stroke="var(--acc)"`). 10 to 25 paths per background, 5 to 15 per scenery, under 6 KB each. Draw order = reveal order (ground first, big shapes, then details). Strokes 2.5 px at 1600 wide; for emphasis use `stroke-width="4"` sparingly, never fills. Round numbers to one decimal.

- [ ] **Step 1: Write or edit the asset**

Backgrounds, first-pass content (Vansh corrects):
- `bg-delhi.svg`: a low skyline of flat-roofed blocks with water tanks and a few antennae between x 700 and 1600, a minar silhouette at x ≈ 1400, one kite on a long line rising from x ≈ 900, a faint second ground line at y 820 for depth.
- `bg-sf.svg`: two Golden Gate towers at x ≈ 1150 and 1450 with the main cable and a dozen hangers, two horizontal fog bands (long soft `Q` curves) crossing the towers, a hill of five stepped row houses at x 750 to 1000.
- `bg-halifax.svg`: a water line at y 830 with three short wave strokes, a lighthouse at x ≈ 1480 with a lantern room, the Dal clock tower at x ≈ 950 (a tall rectangle, a circle face, a small peaked roof), a ferry outline low on the water at x ≈ 1250.
- `bg-room.svg`: a whiteboard rectangle from (720, 300) to (1400, 620) with four boxes and three arrows, a window at (1440, 280) to (1580, 560) framing a minar and a lighthouse side by side, a desk edge at y 700.

Scenery, first-pass content (Vansh corrects):
- `sc-2013`: a rooftop parapet at the figure's feet, a boxy laptop on a ledge at x ≈ 1000 (the accent is its screen edge).
- `sc-2018`: a lanyard badge at the figure's chest height (accent), a suitcase on the ground at x ≈ 1200.
- `sc-2020`: a desk at x 800 to 1000 with two monitors, a Delhi map outline above it with three pins (accent on one pin).
- `sc-2022`: a small sailboat on the water at x ≈ 850, a "SHIFTKEY" name tag shaped as a small rectangle at chest height, one gull (two strokes).
- `sc-2023`: a raked row of four seats at x 800 to 1000, a mic stand next to the figure (accent on the mic head).
- `sc-2024`: an open fridge at x ≈ 900 with three shelves, a phone in the figure's hand with a recipe card rectangle (accent on the card).
- `sc-2025`: a pipeline of four boxes and arrows on the whiteboard behind the figure, the figure's marker (accent on its cap).

Figure keyframes: adjust the numbers in `timeline.ts` (height, headRatio, hair, glasses, beard, collar, arms, prop) until the pose reads as the chapter.

- [ ] **Step 2: Render**

Run, for the asset's chapter `i`, its place background and scenery together, in both themes:

```bash
npm run render -- --key 1 --bg src/lib/scenes/bg-sf.svg --scene src/lib/scenes/sc-2018.svg --out 2018.png
npm run render -- --key 1 --bg src/lib/scenes/bg-sf.svg --scene src/lib/scenes/sc-2018.svg --dark --out 2018-dark.png
```

- [ ] **Step 3: Look**

Read `.renders/<name>.png` with the image reader. Check against the list: figure feet on the ground line; nothing important under x 700; strokes do not cross the figure's face; the accent is exactly one element; silhouettes are recognisable at a glance; nothing is clipped at the 1600 by 900 edge; dark render is identical in shape.

- [ ] **Step 4: Fix and re-render** until the implementer's own checklist passes, then send the PNG pair to Vansh with one line naming what changed. Apply his corrections. Repeat. Expect 3 to 5 rounds per asset.

- [ ] **Step 5: Verify and commit per asset**

Run: `npm test && npm run check && npm run build` (the SVGs are imported at build time, so a malformed file fails here). Then in the browser scrub through the chapter once.

```bash
git add src/lib/scenes/sc-2018.svg
git commit -m "feat: draw the 2018 san francisco scene"
```

(one commit per asset; keyframe tuning commits as `feat: tune the <year> figure keyframe`.)

---

### Task 10: final pass

**Files:**
- Modify: `docs/rebuild/README.md` (mark the journey stage as built), `src/components/Journey.astro` if any of the checks below fail.

- [ ] **Step 1: Run the full check list**

- `npm test`, `npm run check`, `npm run build`: clean.
- Lighthouse on `/` in Chrome (mobile and desktop): Performance 100, Accessibility 100. If CLS appears, confirm `.stage` has `height: 100svh` and the SVG has explicit `viewBox` (no intrinsic-size jump).
- Chrome, Safari 26, Firefox, iOS Safari: scroll the whole section; the stage never unsticks early (if it does, an ancestor has `overflow: hidden`; find it with `document.querySelectorAll('*')` filtered by computed `overflow`); no horizontal scrollbar; the URL bar collapse on iOS does not jump the stage (`svh`).
- Keyboard: Tab never lands inside the stage.
- Reduced motion: no drift, no draw-on, figure snaps per chapter.
- `curl -A curl http://localhost:4321` (via `npm run preview` plus the middleware in a Vercel preview) still returns the text resume with all chapters.
- View source: chapters' text appears before the stage's SVG markup in each `article`, and the total inline SVG is under 90 KB (`grep -o "<path" dist/index.html | wc -l` under ~250).

- [ ] **Step 2: Update the docs index and commit**

In `docs/rebuild/README.md` change the 07 and 08 rows' bold labels to end with "(built)". Commit:

```bash
git add docs/rebuild/README.md src/components/Journey.astro
git commit -m "docs: mark the journey stage as built"
```

---

## Self-review notes

- Spec coverage: §1 layout (Task 5), §2 data flow (Tasks 5 to 7), §3 figure (Tasks 1, 4, 9), §4 scenery and backgrounds incl. depth drift (Task 9; the two-layer `translateZ` drift from the spec is deliberately deferred to after Task 10, since the backgrounds already crossfade per place and the drift is a polish item; add a Task 11 if Vansh wants it after seeing it flat), §5 CSS (Tasks 5, 7), §6 fallbacks (Tasks 6, 7), §7 tests (Tasks 1, 2, 3, 10), §8 milestones (Tasks 1 to 7 = milestone 1, Task 9 = milestones 2 and 3, Task 10 = wrap-up; milestone 4 waits for the story markdown), §9 out of scope respected.
- Names used across tasks: `figure`, `FigureParams`, `Stroke`, `STROKE_IDS`, `KEY_DEFAULT` (Task 1); `clamp01`, `easeInOutSine`, `lerpParams`, `locate` (Task 2); `Milestone.scene.{place, scenery, figure}`, `Place` (Task 4); DOM: `.journey[data-n][data-chapter][data-keys]`, `.stage`, `.stage-svg`, `.ink`, `.bg[data-place]`, `.sc[data-i]`, `.fig path[data-id]`, `.wall`, `.ch#ch-N[data-i]` (Tasks 5 to 7). Checked consistent.
