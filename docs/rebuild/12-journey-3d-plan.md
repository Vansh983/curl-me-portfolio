# Journey stage v2 (three.js) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the CSS-layer stage with a three.js world where the 2010 bedroom morphs into the 2013 lab in one continuous camera move, driven by native scroll.

**Architecture:** Pure, node-tested modules under `src/lib/stage/` build every mesh from params with a fixed vertex count (so station keys become GPU morph targets) and turn scroll progress into a camera pose plus morph influences. One client module (`src/scripts/stage-run.ts`) owns the renderer and is loaded lazily. `Journey.astro` keeps its text wall and swaps the stage for a `<canvas>`.

**Tech Stack:** Astro 7 static, three 0.185.1 (core only, no loaders), TypeScript, `node --test`.

**Spec:** `docs/rebuild/11-journey-3d-spec.md`

## Global Constraints

- three chunk under 140 KB gz, loaded by dynamic `import()` only, never in the initial script.
- No opacity animation anywhere on the stage. Things morph, grow, sink, or the camera travels.
- Every rig returns the same vertex count for every input. No conditionals that add or drop geometry.
- Non-indexed triangles (3 vertices per triangle). Normals are flat, computed per station by `flatNormals`.
- Units are metres. Floor is y = 0. The figure faces -z; the camera sits at +z.
- Pure modules under `src/lib/stage/` never touch `document`, `window`, or the renderer.
- Test runner: `npm test` (`node --experimental-strip-types --test "tests/**/*.test.ts"`). Assertions with `node:assert/strict`.
- Commit messages: `<type>: <description>`, types feat/fix/refactor/docs/test/chore.
- Reference point before this work: tag `pre-3d` (commit `d2c696e`).

---

## File map

| File | Responsibility |
|---|---|
| `src/lib/stage/rig.ts` | `Sink` (fixed-count primitives: box, bone, sphere, cylinder, quad), `flatNormals` |
| `src/lib/stage/figure3d.ts` | `Figure` params and `figure(p)` returning five part buffers (skin, hair, shirt, legs, tie) |
| `src/lib/stage/props.ts` | rigs for floor, walls, ceiling, panel, table, screenBody, face, seat, fan, crate, ball, shelf, labRow |
| `src/lib/stage/world.ts` | `STATIONS` (camera keys) and `ACTORS` (rig, per-station params and colours) |
| `src/lib/stage/shot.ts` | `makeShot(stations)`: progress to camera pose and morph influences; `stageProgress` |
| `src/scripts/stage-run.ts` | client: renderer, meshes, outline, screen canvas, video, theme, resize, scroll loop |
| `src/components/Journey.astro` | wall unchanged; stage is a canvas; lazy loader script |
| `src/data/timeline.ts` | drop the `scene` field, `Layer`, `Motion`, `ScreenMedia`, figure keyframes |
| `tests/stage/*.test.ts` | rig, figure3d, props, world, shot |

---

### Task 1: Dependency and test folder

**Files:**
- Modify: `package.json` (three and @types/three are already installed and uncommitted)
- Create: `tests/stage/.gitkeep` is not needed; the first test file creates the folder

- [ ] **Step 1: Confirm the install**

Run: `grep -n '"three"\|"@types/three"' package.json`
Expected: both lines present (`"three": "^0.185.1"` in dependencies, `"@types/three"` in devDependencies).

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add three for the journey stage"
```

---

### Task 2: `rig.ts`, fixed-count primitives

**Files:**
- Create: `src/lib/stage/rig.ts`
- Test: `tests/stage/rig.test.ts`

**Interfaces:**
- Produces: `type V3 = [number, number, number]`; `class Sink { pos: number[]; quad, tri, box, bone, sphere, cylinder, rotateY, translate, out(): Float32Array }`; `flatNormals(pos: Float32Array): Float32Array`; `SPHERE_VERTS(segsW, segsH)`, `CYL_VERTS(segs)` helpers are not exported, counts are asserted in tests instead.

- [ ] **Step 1: Write the failing test**

```ts
// tests/stage/rig.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Sink, flatNormals } from '../../src/lib/stage/rig.ts';

test('box is 36 vertices, bone is 36, sphere is segsW*segsH*6, cylinder is segs*12', () => {
  assert.equal(new Sink().box(0, 0, 0, 1, 1, 1).out().length, 36 * 3);
  assert.equal(new Sink().bone([0, 0, 0], [0, 1, 0], 0.1, 0.1).out().length, 36 * 3);
  assert.equal(new Sink().sphere(0, 0, 0, 1, 1, 1, 8, 6).out().length, 8 * 6 * 6 * 3);
  assert.equal(new Sink().cylinder(0, 0, 0, 1, 1, 12).out().length, 12 * 12 * 3);
});

test('degenerate bone keeps its count and stays finite', () => {
  const p = new Sink().bone([1, 1, 1], [1, 1, 1], 0.05, 0.05).out();
  assert.equal(p.length, 36 * 3);
  assert.ok(Array.from(p).every(Number.isFinite));
});

test('box faces point outward', () => {
  const n = flatNormals(new Sink().box(0, 0, 0, 2, 2, 2).out());
  // first quad is the +z face: both triangles have normal (0,0,1)
  assert.deepEqual(Array.from(n.slice(0, 3)), [0, 0, 1]);
  assert.deepEqual(Array.from(n.slice(9, 12)), [0, 0, 1]);
});

test('flatNormals are unit length or up for zero-area triangles', () => {
  const n = flatNormals(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
  assert.deepEqual(Array.from(n.slice(0, 3)), [0, 0, 1]);
  assert.deepEqual(Array.from(n.slice(9, 12)), [0, 1, 0]);
});

test('rotateY and translate move every vertex', () => {
  const s = new Sink().box(1, 0, 0, 0.2, 0.2, 0.2);
  s.rotateY(0, 0, Math.PI);
  s.translate(0, 5, 0);
  const p = s.out();
  let cx = 0, cy = 0;
  for (let i = 0; i < p.length; i += 3) { cx += p[i]; cy += p[i + 1]; }
  assert.ok(Math.abs(cx / 36 + 1) < 1e-6);
  assert.ok(Math.abs(cy / 36 - 5) < 1e-6);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/stage/rig.test.ts` (or `node --experimental-strip-types --test tests/stage/rig.test.ts`)
Expected: FAIL, cannot find module `src/lib/stage/rig.ts`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/stage/rig.ts
// Fixed-count geometry. A rig is params in, positions out, and the vertex count never
// depends on the params. That is what lets station keys become GPU morph targets.
// Non-indexed triangles: three vertices each, so normals are flat per face.

export type V3 = [number, number, number];

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => {
  const l = len(a);
  return l < 1e-9 ? [0, 1, 0] : [a[0] / l, a[1] / l, a[2] / l];
};
const madd = (a: V3, b: V3, k: number): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

export class Sink {
  pos: number[] = [];

  tri(a: V3, b: V3, c: V3): this {
    this.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    return this;
  }
  /** a,b,c,d counter-clockwise seen from outside. */
  quad(a: V3, b: V3, c: V3, d: V3): this {
    return this.tri(a, b, c).tri(a, c, d);
  }
  /** Axis-aligned box, 36 vertices. Faces in order +z, -z, +x, -x, +y, -y. */
  box(cx: number, cy: number, cz: number, w: number, h: number, d: number): this {
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
    return this;
  }
  /** A box from a to b (a limb), half-widths rw (sideways) and rd (the other way). 36 vertices. */
  bone(a: V3, b: V3, rw: number, rd: number): this {
    const d = norm(sub(b, a));
    const up: V3 = Math.abs(d[1]) < 0.99 ? [0, 1, 0] : [0, 0, 1];
    const side = norm(cross(up, d));
    const up2 = cross(d, side);
    const c = (base: V3, s: number, u: number): V3 => madd(madd(base, side, s * rw), up2, u * rd);
    // local frame (side, up2, d) is right-handed, same face pattern as box with z = d
    const A = (s: number, u: number) => c(a, s, u), B = (s: number, u: number) => c(b, s, u);
    this.quad(B(-1, -1), B(1, -1), B(1, 1), B(-1, 1));
    this.quad(A(1, -1), A(-1, -1), A(-1, 1), A(1, 1));
    this.quad(B(1, -1), A(1, -1), A(1, 1), B(1, 1));
    this.quad(A(-1, -1), B(-1, -1), B(-1, 1), A(-1, 1));
    this.quad(B(-1, 1), B(1, 1), A(1, 1), A(-1, 1));
    this.quad(A(-1, -1), A(1, -1), B(1, -1), B(-1, -1));
    return this;
  }
  /** UV sphere, segsW * segsH * 6 vertices. Pole quads are degenerate so the count stays fixed. */
  sphere(cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, segsW = 8, segsH = 6): this {
    const p = (i: number, j: number): V3 => {
      const phi = (i / segsH) * Math.PI, th = (j / segsW) * Math.PI * 2;
      return [cx + rx * Math.sin(phi) * Math.cos(th), cy + ry * Math.cos(phi), cz + rz * Math.sin(phi) * Math.sin(th)];
    };
    for (let i = 0; i < segsH; i++) for (let j = 0; j < segsW; j++) this.quad(p(i, j), p(i, j + 1), p(i + 1, j + 1), p(i + 1, j));
    return this;
  }
  /** Cylinder on the y axis, centre (cx, cy, cz), segs * 12 vertices. */
  cylinder(cx: number, cy: number, cz: number, r: number, h: number, segs = 8): this {
    const y0 = cy - h / 2, y1 = cy + h / 2;
    const ring = (j: number, y: number): V3 => {
      const th = (j / segs) * Math.PI * 2;
      return [cx + r * Math.cos(th), y, cz + r * Math.sin(th)];
    };
    for (let j = 0; j < segs; j++) {
      this.quad(ring(j, y0), ring(j, y1), ring(j + 1, y1), ring(j + 1, y0));
      this.tri([cx, y1, cz], ring(j + 1, y1), ring(j, y1));
      this.tri([cx, y0, cz], ring(j, y0), ring(j + 1, y0));
    }
    return this;
  }
  /** Rotate every vertex from index `start` (in vertices) around the vertical line through (cx, cz). */
  rotateY(cx: number, cz: number, rad: number, start = 0): this {
    const c = Math.cos(rad), s = Math.sin(rad);
    for (let i = start * 3; i < this.pos.length; i += 3) {
      const x = this.pos[i] - cx, z = this.pos[i + 2] - cz;
      this.pos[i] = cx + x * c + z * s;
      this.pos[i + 2] = cz - x * s + z * c;
    }
    return this;
  }
  translate(dx: number, dy: number, dz: number, start = 0): this {
    for (let i = start * 3; i < this.pos.length; i += 3) {
      this.pos[i] += dx;
      this.pos[i + 1] += dy;
      this.pos[i + 2] += dz;
    }
    return this;
  }
  /** Vertex count so far (for rotateY/translate `start`). */
  get count(): number {
    return this.pos.length / 3;
  }
  out(): Float32Array {
    return Float32Array.from(this.pos);
  }
}

/** One flat normal per triangle, repeated for its three vertices. Zero-area triangles get (0,1,0). */
export function flatNormals(pos: Float32Array): Float32Array {
  const n = new Float32Array(pos.length);
  for (let i = 0; i < pos.length; i += 9) {
    const a: V3 = [pos[i], pos[i + 1], pos[i + 2]];
    const b: V3 = [pos[i + 3], pos[i + 4], pos[i + 5]];
    const c: V3 = [pos[i + 6], pos[i + 7], pos[i + 8]];
    const v = cross(sub(b, a), sub(c, a));
    const l = len(v);
    const u: V3 = l < 1e-12 ? [0, 1, 0] : [v[0] / l, v[1] / l, v[2] / l];
    for (let k = 0; k < 3; k++) n.set(u, i + k * 3);
  }
  return n;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test tests/stage/rig.test.ts`
Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stage/rig.ts tests/stage/rig.test.ts
git commit -m "feat(stage): fixed-count geometry primitives and flat normals"
```

---

### Task 3: `figure3d.ts`, the person

**Files:**
- Create: `src/lib/stage/figure3d.ts`
- Test: `tests/stage/figure3d.test.ts`

**Interfaces:**
- Consumes: `Sink`, `V3` from `rig.ts`.
- Produces: `type Pose`, `type Figure`, `const PARTS = ['skin','hair','shirt','legs','tie'] as const`, `type Part`, `figure(p: Figure): Record<Part, Float32Array>`, `KID: Figure`, `TEEN: Figure`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/stage/figure3d.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { figure, KID, TEEN, PARTS, type Figure } from '../../src/lib/stage/figure3d.ts';

const rnd = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const randomFigure = (r: () => number): Figure => ({
  ...KID,
  height: 0.8 + r(), headR: 0.06 + r() * 0.1, shoulder: 0.1 + r() * 0.15, hip: 0.08 + r() * 0.1, limbR: 0.02 + r() * 0.04,
  hairTop: r(), tie: r(), x: r() * 4 - 2, y: r(), z: r() * 4 - 2, yaw: r() * 6.28, crossLegs: r(),
  pose: { hipFlex: r() * 120, hipSpread: r() * 60, kneeFlex: r() * 150, shoulderFlex: r() * 90, elbowFlex: r() * 120, armSpread: r() * 40, torsoLean: r() * 30 - 10, headTilt: r() * 20 - 10 },
});

test('every part keeps its vertex count across params', () => {
  const r = rnd(7);
  const base = figure(KID);
  for (let k = 0; k < 20; k++) {
    const f = figure(randomFigure(r));
    for (const part of PARTS) assert.equal(f[part].length, base[part].length, part);
  }
  const t = figure(TEEN);
  for (const part of PARTS) assert.equal(t[part].length, base[part].length, part);
});

test('positions are finite and the head sits above the pelvis', () => {
  for (const p of [KID, TEEN]) {
    const f = figure(p);
    for (const part of PARTS) assert.ok(Array.from(f[part]).every(Number.isFinite), part);
    let maxY = -Infinity;
    for (let i = 1; i < f.skin.length; i += 3) maxY = Math.max(maxY, f.skin[i]);
    assert.ok(maxY > p.y + p.height * 0.3, `head top ${maxY} vs pelvis ${p.y}`);
  }
});

test('tie is flat when tie = 0', () => {
  const f = figure({ ...KID, tie: 0 });
  let minX = Infinity, maxX = -Infinity;
  for (let i = 0; i < f.tie.length; i += 3) { minX = Math.min(minX, f.tie[i]); maxX = Math.max(maxX, f.tie[i]); }
  assert.ok(maxX - minX < 0.01);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test tests/stage/figure3d.test.ts`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/stage/figure3d.ts
// One person, built by forward kinematics from joint angles. Every part has a fixed
// vertex count for every input, so two Figures are morph targets of each other.
// Faces -z at yaw 0. Pelvis at (x, y, z).
import { Sink, type V3 } from './rig';

export type Pose = {
  hipFlex: number; // deg, thigh forward from straight down (90 = sitting)
  hipSpread: number; // deg, thighs out to the sides
  kneeFlex: number; // deg, shin folded back from the thigh line
  shoulderFlex: number; // deg, upper arm forward from straight down
  elbowFlex: number; // deg, forearm folded forward from the upper arm line
  armSpread: number; // deg, arms out to the sides
  torsoLean: number; // deg forward
  headTilt: number; // deg forward
};
export type Figure = {
  height: number; // metres standing
  headR: number;
  shoulder: number; // half width
  hip: number; // half width
  limbR: number; // limb half thickness
  hairTop: number; // 0..1
  tie: number; // 0..1
  x: number; y: number; z: number; // pelvis
  yaw: number; // radians, 0 faces -z
  crossLegs: number; // 0..1, shins cross inward (sitting on the floor)
  pose: Pose;
};
export const PARTS = ['skin', 'hair', 'shirt', 'legs', 'tie'] as const;
export type Part = (typeof PARTS)[number];

const D = Math.PI / 180;
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** Limb direction from straight down: flex swings forward (-z), spread swings out (sign * x). */
const limb = (flex: number, spread: number, sign: number): V3 => {
  const f = flex * D, s = spread * D;
  return norm([sign * Math.sin(s), -Math.cos(f) * Math.cos(s), -Math.sin(f) * Math.cos(s)]);
};

export function figure(p: Figure): Record<Part, Float32Array> {
  const skin = new Sink(), hair = new Sink(), shirt = new Sink(), legs = new Sink(), tie = new Sink();
  const H = p.height, q = p.pose;
  const torsoLen = H * 0.3, thigh = H * 0.24, shin = H * 0.23, upper = H * 0.17, fore = H * 0.15;
  const P: V3 = [0, 0, 0];
  const lean = q.torsoLean * D;
  const N = add(P, [0, Math.cos(lean), -Math.sin(lean)], torsoLen);
  const depth = p.hip * 0.6;

  shirt.bone(P, N, p.shoulder * 0.85, depth);
  const tilt = q.headTilt * D;
  const head = add(N, [0, Math.cos(tilt) * p.headR * 1.15, -Math.sin(tilt) * p.headR * 1.15]);
  skin.sphere(head[0], head[1], head[2], p.headR, p.headR * 1.1, p.headR);
  hair.sphere(head[0], head[1] + p.headR * 0.35, head[2] + 0.01, p.headR * 1.03, p.headR * (0.3 + 0.55 * p.hairTop), p.headR * 1.03);
  tie.box(N[0], N[1] - torsoLen * 0.3, N[2] - depth - 0.006, 0.001 + 0.045 * p.tie, 0.001 + torsoLen * 0.55 * p.tie, 0.01);

  for (const sign of [-1, 1] as const) {
    const S = add(N, [sign * p.shoulder, -0.02, 0]);
    const E = add(S, limb(q.shoulderFlex, q.armSpread, sign), upper);
    const W = add(E, limb(q.shoulderFlex + q.elbowFlex, q.armSpread * 0.5, sign), fore);
    shirt.bone(S, E, p.limbR, p.limbR);
    skin.bone(E, W, p.limbR * 0.9, p.limbR * 0.9);
    skin.sphere(W[0], W[1], W[2], p.limbR * 1.1, p.limbR * 1.1, p.limbR * 1.1, 6, 4);

    const Hp = add(P, [sign * p.hip, 0, 0]);
    const K = add(Hp, limb(q.hipFlex, q.hipSpread, sign), thigh);
    const straight = limb(q.hipFlex - q.kneeFlex, q.hipSpread, sign);
    const crossed = norm([-sign, -0.15, 0.25]);
    const F = add(K, norm(mix(straight, crossed, p.crossLegs)), shin);
    legs.bone(Hp, K, p.limbR * 1.1, p.limbR * 1.1);
    legs.bone(K, F, p.limbR, p.limbR);
    legs.box(F[0], F[1] - p.limbR * 0.3, F[2] - p.limbR * 0.6, p.limbR * 1.8, p.limbR * 1.2, p.limbR * 2.8);
  }

  const out = {} as Record<Part, Float32Array>;
  for (const [name, s] of [['skin', skin], ['hair', hair], ['shirt', shirt], ['legs', legs], ['tie', tie]] as const) {
    s.rotateY(0, 0, p.yaw).translate(p.x, p.y, p.z);
    out[name] = s.out();
  }
  return out;
}

// 2010: nine, cross-legged on the rug, controller up, back to the camera.
export const KID: Figure = {
  height: 1.3, headR: 0.11, shoulder: 0.15, hip: 0.11, limbR: 0.038, hairTop: 0.8, tie: 0,
  x: 0, y: 0.17, z: 0.55, yaw: 0, crossLegs: 1,
  pose: { hipFlex: 75, hipSpread: 50, kneeFlex: 120, shoulderFlex: 20, elbowFlex: 95, armSpread: 12, torsoLean: 8, headTilt: 4 },
};
// 2013: thirteen, on a chair at the lab machine, white shirt and tie.
export const TEEN: Figure = {
  height: 1.55, headR: 0.105, shoulder: 0.18, hip: 0.13, limbR: 0.042, hairTop: 0.5, tie: 1,
  x: 0.05, y: 0.5, z: -0.75, yaw: 0, crossLegs: 0,
  pose: { hipFlex: 90, hipSpread: 8, kneeFlex: 90, shoulderFlex: 35, elbowFlex: 75, armSpread: 8, torsoLean: 6, headTilt: 6 },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test tests/stage/figure3d.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stage/figure3d.ts tests/stage/figure3d.test.ts
git commit -m "feat(stage): forward-kinematic figure with fixed topology, kid and teen keys"
```

---

### Task 4: `props.ts`, the room and its furniture

**Files:**
- Create: `src/lib/stage/props.ts`
- Test: `tests/stage/props.test.ts`

**Interfaces:**
- Consumes: `Sink` from `rig.ts`.
- Produces: rig functions, each `(p) => Float32Array`: `floor({w,d})`, `walls({w,h,d})`, `ceiling({w,h,d})`, `panel({x,y,z,w,h,t,yaw})`, `table({x,y,z,w,h,d,top})`, `screenBody({x,y,z,w,h,d,standW,standH,standD})`, `face({x,y,z,w,h})`, `seat({x,z,rugR,rugT,seatW,seatD,seatH,seatT,legR,backH,yOff})`, `fan({rod,r,hub})` (built at the origin), `crate({x,y,z,w,h,d})`, `ball({x,y,z,r})`, `shelf({x,y,z,w,scale})`, `labRow({x,z0,gap,lift})`. Also `FACE_UV: Float32Array` (uv for one `face` quad).

- [ ] **Step 1: Write the failing test**

```ts
// tests/stage/props.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../../src/lib/stage/props.ts';

const finite = (a: Float32Array) => Array.from(a).every(Number.isFinite);

test('each rig keeps its count between two very different param sets', () => {
  const pairs: Array<[string, Float32Array, Float32Array]> = [
    ['floor', P.floor({ w: 4, d: 4 }), P.floor({ w: 1, d: 9 })],
    ['walls', P.walls({ w: 4, h: 3, d: 4 }), P.walls({ w: 1, h: 1, d: 1 })],
    ['ceiling', P.ceiling({ w: 4, h: 3, d: 4 }), P.ceiling({ w: 2, h: 2, d: 2 })],
    ['panel', P.panel({ x: 0, y: 1, z: 0, w: 1, h: 1, t: 0.02, yaw: 0 }), P.panel({ x: 1, y: 2, z: 3, w: 0.001, h: 0.001, t: 0.001, yaw: 1.5 })],
    ['table', P.table({ x: 0, y: 0, z: 0, w: 1, h: 0.7, d: 0.6, top: 0.04 }), P.table({ x: 1, y: -1, z: 2, w: 2, h: 0.4, d: 1, top: 0.02 })],
    ['screenBody', P.screenBody({ x: 0, y: 1, z: 0, w: 1, h: 0.7, d: 0.5, standW: 0.001, standH: 0.001, standD: 0.001 }), P.screenBody({ x: 0, y: 1, z: -1, w: 0.4, h: 0.4, d: 0.4, standW: 0.3, standH: 0.06, standD: 0.3 })],
    ['face', P.face({ x: 0, y: 1, z: 0, w: 1, h: 0.6 }), P.face({ x: 2, y: 1, z: -1, w: 0.3, h: 0.2 })],
    ['seat', P.seat({ x: 0, z: 0, rugR: 0.9, rugT: 0.01, seatW: 0.001, seatD: 0.001, seatH: 0.002, seatT: 0.001, legR: 0.001, backH: 0.001, yOff: -0.3 }), P.seat({ x: 0, z: -1, rugR: 0.001, rugT: 0.001, seatW: 0.45, seatD: 0.45, seatH: 0.45, seatT: 0.04, legR: 0.02, backH: 0.4, yOff: 0 })],
    ['fan', P.fan({ rod: 0.3, r: 0.6, hub: 0.08 }), P.fan({ rod: 0.1, r: 0.2, hub: 0.02 })],
    ['crate', P.crate({ x: 0, y: 0, z: 0, w: 1, h: 1, d: 1 }), P.crate({ x: 0, y: -1, z: 0, w: 0.001, h: 0.001, d: 0.001 })],
    ['ball', P.ball({ x: 0, y: 0.1, z: 0, r: 0.1 }), P.ball({ x: 0, y: -1, z: 0, r: 0.001 })],
    ['shelf', P.shelf({ x: 1, y: 1, z: -2, w: 0.9, scale: 1 }), P.shelf({ x: 1, y: -1, z: -2, w: 0.9, scale: 0.001 })],
    ['labRow', P.labRow({ x: 1.6, z0: -1.2, gap: 0.8, lift: 0 }), P.labRow({ x: 1.6, z0: -1.2, gap: 0.8, lift: 1 })],
  ];
  for (const [name, a, b] of pairs) {
    assert.equal(a.length, b.length, name);
    assert.ok(finite(a) && finite(b), name);
  }
});

test('face is one quad with matching uv', () => {
  assert.equal(P.face({ x: 0, y: 0, z: 0, w: 1, h: 1 }).length, 6 * 3);
  assert.equal(P.FACE_UV.length, 6 * 2);
});

test('labRow at lift 0 is fully under the floor', () => {
  const a = P.labRow({ x: 1.6, z0: -1.2, gap: 0.8, lift: 0 });
  let maxY = -Infinity;
  for (let i = 1; i < a.length; i += 3) maxY = Math.max(maxY, a[i]);
  assert.ok(maxY <= 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test tests/stage/props.test.ts`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/stage/props.ts
// Every prop is one rig with a fixed vertex count. A prop that exists in one chapter
// and not the next has params that shrink it to a point or sink it under the floor.
import { Sink } from './rig';

export const floor = (p: { w: number; d: number }) =>
  new Sink().quad([-p.w / 2, 0, p.d / 2], [p.w / 2, 0, p.d / 2], [p.w / 2, 0, -p.d / 2], [-p.w / 2, 0, -p.d / 2]).out();

/** Back, left and right walls, inward facing. The front (camera side) is open. */
export const walls = (p: { w: number; h: number; d: number }) => {
  const x0 = -p.w / 2, x1 = p.w / 2, z0 = -p.d / 2, z1 = p.d / 2, h = p.h;
  return new Sink()
    .quad([x0, 0, z0], [x1, 0, z0], [x1, h, z0], [x0, h, z0])
    .quad([x0, 0, z1], [x0, 0, z0], [x0, h, z0], [x0, h, z1])
    .quad([x1, 0, z0], [x1, 0, z1], [x1, h, z1], [x1, h, z0])
    .out();
};

export const ceiling = (p: { w: number; h: number; d: number }) =>
  new Sink().quad([-p.w / 2, p.h, -p.d / 2], [p.w / 2, p.h, -p.d / 2], [p.w / 2, p.h, p.d / 2], [-p.w / 2, p.h, p.d / 2]).out();

/** A thin slab on a wall (window, whiteboard). w runs along x before yaw. */
export const panel = (p: { x: number; y: number; z: number; w: number; h: number; t: number; yaw: number }) =>
  new Sink().box(0, 0, 0, p.w, p.h, p.t).rotateY(0, 0, p.yaw).translate(p.x, p.y, p.z).out();

/** Top slab on two side panels. y is the floor under it, h the height of the top surface. */
export const table = (p: { x: number; y: number; z: number; w: number; h: number; d: number; top: number }) => {
  const legH = Math.max(0.001, p.h - p.top);
  return new Sink()
    .box(p.x, p.y + p.h - p.top / 2, p.z, p.w, p.top, p.d)
    .box(p.x - p.w / 2 + 0.03, p.y + legH / 2, p.z, 0.05, legH, p.d * 0.9)
    .box(p.x + p.w / 2 - 0.03, p.y + legH / 2, p.z, 0.05, legH, p.d * 0.9)
    .out();
};

/** TV or monitor body plus a stand under it. (x, y, z) is the body centre. */
export const screenBody = (p: { x: number; y: number; z: number; w: number; h: number; d: number; standW: number; standH: number; standD: number }) =>
  new Sink()
    .box(p.x, p.y, p.z, p.w, p.h, p.d)
    .box(p.x, p.y - p.h / 2 - p.standH / 2, p.z, p.standW, p.standH, p.standD)
    .out();

/** One quad facing +z, for a texture. (x, y, z) is its centre. */
export const face = (p: { x: number; y: number; z: number; w: number; h: number }) =>
  new Sink().quad([p.x - p.w / 2, p.y - p.h / 2, p.z], [p.x + p.w / 2, p.y - p.h / 2, p.z], [p.x + p.w / 2, p.y + p.h / 2, p.z], [p.x - p.w / 2, p.y + p.h / 2, p.z]).out();
/** uv for `face`: two triangles (a,b,c),(a,c,d), image top-left at d. */
export const FACE_UV = new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]);

/** A rug and a chair in one rig. Bedroom: rug big, chair tiny and sunk. Lab: the reverse. */
export const seat = (p: { x: number; z: number; rugR: number; rugT: number; seatW: number; seatD: number; seatH: number; seatT: number; legR: number; backH: number; yOff: number }) => {
  const s = new Sink().cylinder(p.x, p.rugT / 2, p.z, p.rugR, p.rugT, 16);
  const legH = Math.max(0.001, p.seatH - p.seatT);
  const y = p.yOff;
  s.box(p.x, y + p.seatH - p.seatT / 2, p.z, p.seatW, p.seatT, p.seatD);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) s.box(p.x + sx * (p.seatW / 2 - p.legR), y + legH / 2, p.z + sz * (p.seatD / 2 - p.legR), p.legR * 2, legH, p.legR * 2);
  s.box(p.x, y + p.seatH + p.backH / 2, p.z + p.seatD / 2 - 0.02, p.seatW, p.backH, 0.04);
  return s.out();
};

/** Ceiling fan built at the origin hanging down: the mesh is positioned and spun at runtime. */
export const fan = (p: { rod: number; r: number; hub: number }) => {
  const s = new Sink().cylinder(0, -p.rod / 2, 0, 0.02, p.rod, 8).cylinder(0, -p.rod - 0.03, 0, p.hub, 0.06, 8);
  for (let k = 0; k < 3; k++) {
    const start = s.count;
    s.box(p.r / 2 + p.hub * 0.5, -p.rod - 0.03, 0, p.r, 0.015, 0.12).rotateY(0, 0, (k * Math.PI * 2) / 3, start);
  }
  return s.out();
};

export const crate = (p: { x: number; y: number; z: number; w: number; h: number; d: number }) => new Sink().box(p.x, p.y, p.z, p.w, p.h, p.d).out();

export const ball = (p: { x: number; y: number; z: number; r: number }) => new Sink().sphere(p.x, p.y, p.z, p.r, p.r, p.r, 10, 7).out();

/** A board with four books on it. scale shrinks the whole thing toward (x, y, z). */
export const shelf = (p: { x: number; y: number; z: number; w: number; scale: number }) => {
  const k = p.scale;
  const s = new Sink().box(p.x, p.y, p.z, p.w * k, 0.035 * k, 0.26 * k);
  const books: Array<[number, number, number]> = [[-0.3, 0.05, 0.22], [-0.22, 0.06, 0.2], [-0.13, 0.04, 0.24], [-0.06, 0.05, 0.19]];
  for (const [bx, bw, bh] of books) s.box(p.x + bx * k, p.y + (0.035 / 2 + bh / 2) * k, p.z, bw * k, bh * k, 0.2 * k);
  return s.out();
};

/** Three lab desks with monitors in a row along z. lift 0 puts the whole row under the floor. */
export const labRow = (p: { x: number; z0: number; gap: number; lift: number }) => {
  const s = new Sink();
  for (let k = 0; k < 3; k++) {
    const z = p.z0 + k * p.gap;
    s.box(p.x, 0.72 - 0.02, z, 0.6, 0.04, 0.7);
    s.box(p.x, 0.35, z - 0.3, 0.55, 0.7, 0.05);
    s.box(p.x, 0.35, z + 0.3, 0.55, 0.7, 0.05);
    s.box(p.x + 0.05, 0.72 + 0.21, z, 0.4, 0.38, 0.4);
  }
  return s.translate(0, (p.lift - 1) * 1.3, 0).out();
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test tests/stage/props.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stage/props.ts tests/stage/props.test.ts
git commit -m "feat(stage): room and furniture rigs, each one fixed-count"
```

---

### Task 5: `world.ts` and `shot.ts`, stations, actors, camera

**Files:**
- Create: `src/lib/stage/world.ts`, `src/lib/stage/shot.ts`
- Test: `tests/stage/world.test.ts`, `tests/stage/shot.test.ts`

**Interfaces:**
- Consumes: `figure, KID, TEEN, PARTS` from `figure3d.ts`; rigs from `props.ts`; `locate, clamp01` from `../lerp`.
- Produces:
  - `type Station = { cam: V3; look: V3; fov: number }` (fov is horizontal, degrees)
  - `type Actor = { id: string; keys: Float32Array[]; colors: string[]; kind: 'toon' | 'flat' | 'screen' | 'poster'; outline: boolean; at?: V3 }` (`keys[k]` is the built positions at station k; `flat` is unlit DoubleSide for the room)
  - `STATIONS: Station[]`, `ACTORS: Actor[]`, `ROOM = { w, h, d }`
  - `makeShot(stations): (q: number) => Frame` with `type Frame = { i: number; t: number; u: number; cam: V3; look: V3; fov: number; inf: number[] }`
  - `stageProgress(p: number, chapters: number, stations: number): number`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/stage/world.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACTORS, STATIONS } from '../../src/lib/stage/world.ts';

test('every actor has one key and one colour per station, same count in each', () => {
  assert.ok(STATIONS.length >= 2);
  for (const a of ACTORS) {
    assert.equal(a.keys.length, STATIONS.length, a.id);
    assert.equal(a.colors.length, STATIONS.length, a.id);
    for (const k of a.keys) {
      assert.equal(k.length, a.keys[0].length, a.id);
      assert.ok(Array.from(k).every(Number.isFinite), a.id);
    }
    assert.match(a.colors[0], /^#[0-9a-f]{6}$/i, a.id);
  }
  assert.equal(new Set(ACTORS.map((a) => a.id)).size, ACTORS.length);
});
```

```ts
// tests/stage/shot.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeShot, stageProgress } from '../../src/lib/stage/shot.ts';
import { STATIONS } from '../../src/lib/stage/world.ts';

const shot = makeShot(STATIONS);
const close = (a: number[], b: number[]) => a.every((v, i) => Math.abs(v - b[i]) < 1e-6);

test('rests on the first and last station', () => {
  const a = shot(0), z = shot(1);
  assert.ok(close(a.cam, STATIONS[0].cam) && close(a.look, STATIONS[0].look));
  assert.ok(close(z.cam, STATIONS.at(-1)!.cam) && close(z.look, STATIONS.at(-1)!.look));
  assert.deepEqual(a.inf, STATIONS.slice(1).map(() => 0));
  assert.equal(z.inf.at(-1), 1);
  assert.equal(z.fov, STATIONS.at(-1)!.fov);
});

test('camera never jumps', () => {
  let prev = shot(0);
  let maxStep = 0;
  for (let k = 1; k <= 2000; k++) {
    const f = shot(k / 2000);
    const d = Math.hypot(f.cam[0] - prev.cam[0], f.cam[1] - prev.cam[1], f.cam[2] - prev.cam[2]);
    maxStep = Math.max(maxStep, d);
    assert.ok([...f.cam, ...f.look, f.fov, ...f.inf].every(Number.isFinite));
    prev = f;
  }
  assert.ok(maxStep < 0.02, `max step ${maxStep}`);
});

test('influences blend two neighbours and sum to at most 1', () => {
  for (let k = 0; k <= 100; k++) {
    const f = shot(k / 100);
    const sum = f.inf.reduce((a, b) => a + b, 0);
    assert.ok(sum <= 1 + 1e-9 && f.inf.every((v) => v >= 0 && v <= 1));
  }
  const mid = shot(0.5);
  assert.ok(mid.t > 0.4 && mid.t < 0.6);
});

test('stageProgress lands station 1 on chapter 1 and holds after', () => {
  assert.equal(stageProgress(0, 8, 2), 0);
  assert.ok(Math.abs(stageProgress(1 / 7, 8, 2) - 1) < 1e-9);
  assert.equal(stageProgress(0.9, 8, 2), 1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --experimental-strip-types --test tests/stage/world.test.ts tests/stage/shot.test.ts`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Write `world.ts`**

```ts
// src/lib/stage/world.ts
// The whole world as data: camera stations and actors with their params per station.
// Station 0 is the 2010 Delhi bedroom, station 1 the 2013 school computer lab.
import { figure, KID, TEEN, PARTS, type Part } from './figure3d';
import * as P from './props';
import type { V3 } from './rig';

export type Station = { cam: V3; look: V3; fov: number }; // fov horizontal, degrees
export type Actor = {
  id: string;
  keys: Float32Array[]; // built positions at each station
  colors: string[]; // hex per station
  kind: 'toon' | 'flat' | 'screen' | 'poster';
  outline: boolean;
  at?: V3; // mesh position for rigs built at the origin (the fan)
};

export const ROOM = { w: 4.4, h: 2.8, d: 4.6 };

export const STATIONS: Station[] = [
  { cam: [0.3, 1.1, 2.3], look: [0, 0.8, -1.0], fov: 62 },
  { cam: [-0.75, 1.5, 0.35], look: [0.15, 0.95, -1.5], fov: 56 },
];

const actor = <T>(id: string, rig: (p: T) => Float32Array, keys: T[], colors: string[], kind: Actor['kind'] = 'toon', outline = true, at?: V3): Actor => ({
  id, keys: keys.map(rig), colors, kind, outline, at,
});

const kid = figure(KID), teen = figure(TEEN);
const partColors: Record<Part, [string, string]> = {
  skin: ['#F1C7A3', '#F1C7A3'],
  hair: ['#2B2B2B', '#2B2B2B'],
  shirt: ['#245EDC', '#FFFFFF'],
  legs: ['#6E5238', '#2B2B2B'],
  tie: ['#004D98', '#004D98'],
};

export const ACTORS: Actor[] = [
  actor('floor', P.floor, [{ w: ROOM.w, d: ROOM.d }, { w: ROOM.w, d: ROOM.d }], ['#D9B994', '#C9CFD3'], 'flat', false),
  actor('walls', P.walls, [ROOM, ROOM], ['#F9F4EC', '#E9EEF2'], 'flat', false),
  actor('ceiling', P.ceiling, [ROOM, ROOM], ['#FFFFFF', '#F5F9FC'], 'flat', false),
  // window becomes the whiteboard, on the left wall
  actor('panel', P.panel, [
    { x: -ROOM.w / 2 + 0.01, y: 1.55, z: -0.6, w: 1.1, h: 1.1, t: 0.02, yaw: Math.PI / 2 },
    { x: -ROOM.w / 2 + 0.01, y: 1.45, z: -0.8, w: 1.8, h: 1.1, t: 0.02, yaw: Math.PI / 2 },
  ], ['#BFE3F5', '#FFFFFF']),
  // cabinet under the TV becomes the lab desk
  actor('table', P.table, [
    { x: 0, y: 0, z: -1.7, w: 1.3, h: 0.45, d: 0.55, top: 0.04 },
    { x: 0.1, y: 0, z: -1.5, w: 1.4, h: 0.72, d: 0.7, top: 0.04 },
  ], ['#6E5238', '#C8B79B']),
  // TV becomes the beige CRT monitor
  actor('screenBody', P.screenBody, [
    { x: 0, y: 0.45 + 0.375, z: -1.7, w: 1.2, h: 0.75, d: 0.5, standW: 0.001, standH: 0.001, standD: 0.001 },
    { x: 0.1, y: 0.72 + 0.06 + 0.21, z: -1.5, w: 0.45, h: 0.42, d: 0.45, standW: 0.3, standH: 0.06, standD: 0.3 },
  ], ['#2B2B2B', '#E5DCC5']),
  actor('screen', P.face, [
    { x: 0, y: 0.45 + 0.375, z: -1.7 + 0.25 + 0.003, w: 1.0, h: 0.6 },
    { x: 0.1, y: 0.72 + 0.06 + 0.21, z: -1.5 + 0.225 + 0.003, w: 0.36, h: 0.32 },
  ], ['#101815', '#F4F4F2'], 'screen', false),
  actor('seat', P.seat, [
    { x: 0, z: 0.55, rugR: 0.9, rugT: 0.012, seatW: 0.001, seatD: 0.001, seatH: 0.002, seatT: 0.001, legR: 0.001, backH: 0.001, yOff: -0.3 },
    { x: 0.05, z: -0.75, rugR: 0.001, rugT: 0.001, seatW: 0.46, seatD: 0.46, seatH: 0.45, seatT: 0.04, legR: 0.02, backH: 0.42, yOff: 0 },
  ], ['#B94A48', '#4A5560']),
  actor('fan', P.fan, [{ rod: 0.3, r: 0.6, hub: 0.08 }, { rod: 0.3, r: 0.6, hub: 0.08 }], ['#9A9A96', '#9A9A96'], 'toon', true, [0, ROOM.h, -0.4]),
  actor('poster', P.face, [
    { x: 0.95, y: 1.75, z: -ROOM.d / 2 + 0.01, w: 0.42, h: 0.58 },
    { x: 0.95, y: 1.75, z: -ROOM.d / 2 + 0.01, w: 0.001, h: 0.001 },
  ], ['#FFFFFF', '#FFFFFF'], 'poster', false),
  actor('shelf', P.shelf, [{ x: 1.35, y: 0.95, z: -2.1, w: 0.9, scale: 1 }, { x: 1.35, y: -0.6, z: -2.1, w: 0.9, scale: 0.001 }], ['#8B6B4A', '#8B6B4A']),
  actor('xbox', P.crate, [{ x: 0.78, y: 0.05, z: -1.45, w: 0.31, h: 0.08, d: 0.26 }, { x: 0.78, y: -0.5, z: -1.45, w: 0.001, h: 0.001, d: 0.001 }], ['#F4F4F2', '#F4F4F2']),
  actor('ball', P.ball, [{ x: -0.95, y: 0.11, z: 0.25, r: 0.11 }, { x: -0.95, y: -0.5, z: 0.25, r: 0.001 }], ['#FFFFFF', '#FFFFFF']),
  actor('labRow', P.labRow, [{ x: 1.65, z0: -1.4, gap: 0.85, lift: 0 }, { x: 1.65, z0: -1.4, gap: 0.85, lift: 1 }], ['#C8B79B', '#C8B79B']),
  ...PARTS.map((part) => ({ id: `figure-${part}`, keys: [kid[part], teen[part]], colors: partColors[part], kind: 'toon' as const, outline: true })),
];
```

- [ ] **Step 4: Write `shot.ts`**

```ts
// src/lib/stage/shot.ts
// Scroll progress to a camera pose and morph influences. Pure.
import { CatmullRomCurve3, Vector3 } from 'three';
import { clamp01, locate } from '../lerp';
import type { V3 } from './rig';
import type { Station } from './world';

export type Frame = { i: number; t: number; u: number; cam: V3; look: V3; fov: number; inf: number[] };

/**
 * Builds the shot for a list of stations.
 * @returns a function from stage progress q (0..1) to the camera pose and the
 * morph influences: inf[k] is the weight of station k+1 (station 0 is the base).
 */
export function makeShot(stations: Station[]): (q: number) => Frame {
  const n = stations.length;
  const pos = new CatmullRomCurve3(stations.map((s) => new Vector3(...s.cam)), false, 'centripetal');
  const look = new CatmullRomCurve3(stations.map((s) => new Vector3(...s.look)), false, 'centripetal');
  return (q) => {
    const { i, t } = locate(q, n);
    const j = Math.min(i + 1, n - 1);
    const u = n > 1 ? (i + t) / (n - 1) : 0;
    const inf = new Array(Math.max(0, n - 1)).fill(0);
    if (i >= 1) inf[i - 1] = 1 - t;
    if (i + 1 <= n - 1) inf[i] = t;
    return {
      i, t, u,
      cam: pos.getPoint(u).toArray() as V3,
      look: look.getPoint(u).toArray() as V3,
      fov: stations[i].fov + (stations[j].fov - stations[i].fov) * t,
      inf,
    };
  };
}

/** Section progress over all chapters to stage progress: station k sits on chapter k, then the camera holds. */
export const stageProgress = (p: number, chapters: number, stations: number) =>
  clamp01((p * (chapters - 1)) / Math.max(1, stations - 1));
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: all stage tests pass along with the 13 existing tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/stage/world.ts src/lib/stage/shot.ts tests/stage/world.test.ts tests/stage/shot.test.ts
git commit -m "feat(stage): bedroom and lab stations, actors, and the continuous shot"
```

---

### Task 6: `stage-run.ts`, the client renderer

**Files:**
- Create: `src/scripts/stage-run.ts`

**Interfaces:**
- Consumes: `ACTORS, STATIONS, ROOM` from `world.ts`; `makeShot, stageProgress` from `shot.ts`; `flatNormals` from `rig.ts`; `FACE_UV` from `props.ts`.
- Produces: `mount(root: HTMLElement, canvas: HTMLCanvasElement, chapters: number): () => void` (returns dispose).

No unit test (touches DOM and WebGL). Verified by `astro check`, `astro build`, and the live page in Task 7.

- [ ] **Step 1: Write the module**

```ts
// src/scripts/stage-run.ts
// The renderer. Loaded lazily by Journey.astro when the section is near the viewport.
// Builds one mesh per actor with station keys as morph targets, an ink outline as an
// inverted hull sharing the geometry, a canvas-mixed screen (video -> Notepad), and
// drives everything from scroll progress. Renders only when something changed.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Mesh, BufferGeometry, Float32BufferAttribute, MeshToonMaterial,
  MeshBasicMaterial, DataTexture, RedFormat, NearestFilter, HemisphereLight, DirectionalLight, Color, BackSide,
  DoubleSide, CanvasTexture, TextureLoader, SRGBColorSpace, Vector3, type Material,
} from 'three';
import { ACTORS, STATIONS, type Actor } from '../lib/stage/world';
import { makeShot, stageProgress } from '../lib/stage/shot';
import { flatNormals } from '../lib/stage/rig';
import { FACE_UV } from '../lib/stage/props';

const OUTLINE = 0.0045; // metres pushed along the normal
const D = Math.PI / 180;

type Built = { actor: Actor; mesh: Mesh; outline?: Mesh; a: Color[]; mat: Material & { color: Color } };

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000';

function geometryFor(actor: Actor): BufferGeometry {
  const g = new BufferGeometry();
  const [base, ...rest] = actor.keys;
  g.setAttribute('position', new Float32BufferAttribute(base, 3));
  g.setAttribute('normal', new Float32BufferAttribute(flatNormals(base), 3));
  if (actor.kind === 'screen' || actor.kind === 'poster') g.setAttribute('uv', new Float32BufferAttribute(FACE_UV, 2));
  g.morphAttributes.position = rest.map((k) => new Float32BufferAttribute(k, 3));
  g.morphAttributes.normal = rest.map((k) => new Float32BufferAttribute(flatNormals(k), 3));
  return g;
}

/** Inverted hull: same geometry, back faces, pushed out along the (morphed) normal. */
function outlineMaterial(ink: Color): MeshToonMaterial {
  const m = new MeshToonMaterial({ color: 0x000000, emissive: ink, side: BackSide });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uOut = { value: OUTLINE };
    shader.vertexShader = 'uniform float uOut;\n' + shader.vertexShader.replace('#include <morphtarget_vertex>', '#include <morphtarget_vertex>\n\ttransformed += objectNormal * uOut;');
  };
  return m;
}

function notepad(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d')!;
  x.fillStyle = '#F4F4F2'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#245EDC'; x.fillRect(0, 0, w, 30);
  x.fillStyle = '#FFFFFF'; x.font = 'bold 15px sans-serif'; x.fillText('Untitled - Notepad', 10, 20);
  x.fillStyle = '#E9E9E6'; x.fillRect(0, 30, w, 22);
  x.fillStyle = '#2B2B2B'; x.font = '13px sans-serif'; x.fillText('File   Edit   Format   View   Help', 10, 46);
  x.font = '15px ui-monospace, Menlo, monospace';
  const lines = ['<!DOCTYPE html>', '<html>', '<head>', '  <title>My first website</title>', '</head>', '<body>', '  <h1>Hello world</h1>', '  <p>Made by Vansh, 2013</p>', '</body>', '</html>'];
  lines.forEach((l, i) => x.fillText(l, 12, 76 + i * 20));
  return c;
}

export function mount(root: HTMLElement, canvas: HTMLCanvasElement, chapters: number): () => void {
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  const scene = new Scene();
  const camera = new PerspectiveCamera(50, 1, 0.05, 30);
  scene.add(new HemisphereLight(0xffffff, 0x8a8a8a, 1.1));
  const sun = new DirectionalLight(0xffffff, 2.2);
  sun.position.set(3, 5, 4);
  scene.add(sun);

  const grad = new DataTexture(new Uint8Array([100, 175, 255]), 3, 1, RedFormat);
  grad.minFilter = grad.magFilter = NearestFilter;
  grad.needsUpdate = true;
  const ink = new Color(cssVar('--tx'));
  const outlineMat = outlineMaterial(ink);

  // the screen: video mixed into Notepad on a 2D canvas, uploaded as a texture
  const video = document.createElement('video');
  Object.assign(video, { src: '/assets/scenes/zombies-gameplay.mp4', muted: true, loop: true, playsInline: true, preload: 'auto' });
  video.setAttribute('playsinline', '');
  const mixCanvas = document.createElement('canvas');
  mixCanvas.width = 512; mixCanvas.height = 320;
  const mix = mixCanvas.getContext('2d')!;
  const pad = notepad(512, 320);
  const screenTex = new CanvasTexture(mixCanvas);
  screenTex.colorSpace = SRGBColorSpace;
  let screenT = 0;
  const drawScreen = () => {
    mix.globalAlpha = 1;
    mix.fillStyle = '#101815'; mix.fillRect(0, 0, 512, 320);
    if (video.readyState >= 2) mix.drawImage(video, 0, 0, 512, 320);
    mix.globalAlpha = screenT; mix.drawImage(pad, 0, 0);
    screenTex.needsUpdate = true;
  };
  drawScreen();

  const poster = new TextureLoader().load('/assets/scenes/jobs.jpg', () => (needs = true));
  poster.colorSpace = SRGBColorSpace;

  const built: Built[] = [];
  for (const actor of ACTORS) {
    const g = geometryFor(actor);
    const colors = actor.colors.map((c) => new Color(c));
    let mat: Built['mat'];
    if (actor.kind === 'flat') mat = new MeshBasicMaterial({ color: colors[0], side: DoubleSide });
    else if (actor.kind === 'screen') mat = new MeshBasicMaterial({ map: screenTex });
    else if (actor.kind === 'poster') mat = new MeshBasicMaterial({ map: poster });
    else mat = new MeshToonMaterial({ color: colors[0], gradientMap: grad });
    const mesh = new Mesh(g, mat);
    if (actor.at) mesh.position.set(...actor.at);
    scene.add(mesh);
    let outline: Mesh | undefined;
    if (actor.outline) {
      outline = new Mesh(g, outlineMat);
      outline.position.copy(mesh.position);
      scene.add(outline);
    }
    built.push({ actor, mesh, outline, a: colors, mat });
  }
  const fan = built.find((b) => b.actor.id === 'fan');

  const shot = makeShot(STATIONS);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let needs = true, visible = false, raf = 0, target = 0, cur = 0, lastT = 0;

  const applyTheme = () => {
    renderer.setClearColor(new Color(cssVar('--bg')));
    outlineMat.emissive.set(cssVar('--tx'));
    needs = true;
  };
  const themeObs = new MutationObserver(applyTheme);
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const scheme = matchMedia('(prefers-color-scheme: dark)');
  scheme.addEventListener('change', applyTheme);

  const fit = () => {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    needs = true;
  };
  const ro = new ResizeObserver(fit);
  ro.observe(canvas);

  const progress = () => {
    const r = root.getBoundingClientRect();
    const total = r.height - innerHeight;
    return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
  };
  const frame = (q: number) => {
    const f = shot(q);
    camera.position.set(...f.cam);
    camera.lookAt(new Vector3(...f.look));
    // f.fov is horizontal: convert so narrow viewports keep the width of the shot
    const v = 2 * Math.atan(Math.tan((f.fov * D) / 2) / camera.aspect);
    camera.fov = Math.min(95, Math.max(35, v / D));
    camera.updateProjectionMatrix();
    for (const b of built) {
      const inf = b.mesh.morphTargetInfluences;
      if (inf) for (let k = 0; k < inf.length; k++) inf[k] = f.inf[k] ?? 0;
      const j = Math.min(f.i + 1, b.a.length - 1);
      b.mat.color.copy(b.a[f.i]).lerp(b.a[j], f.t);
    }
    screenT = f.i === 0 ? f.t : 1;
  };

  const tick = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, (now - lastT) / 1000 || 0);
    lastT = now;
    if (reduce.matches) cur = target;
    else {
      cur += (target - cur) * 0.18;
      if (Math.abs(target - cur) < 0.0005) cur = target;
    }
    let q = stageProgress(cur, chapters, STATIONS.length);
    if (reduce.matches) q = Math.round(q * (STATIONS.length - 1)) / Math.max(1, STATIONS.length - 1);
    frame(q);
    if (fan && !reduce.matches) fan.mesh.rotation.y += dt * 5;
    if (fan?.outline) fan.outline.rotation.y = fan.mesh.rotation.y;
    if (!video.paused && screenT < 1) drawScreen();
    else if (needs) drawScreen();
    renderer.render(scene, camera);
    needs = false;
    const live = visible && ((!video.paused && screenT < 1) || (fan && !reduce.matches));
    if (cur !== target || live) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const onScroll = () => { target = progress(); kick(); };
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) { video.play().catch(() => {}); kick(); } else video.pause();
  });
  io.observe(root);
  addEventListener('scroll', onScroll, { passive: true });
  applyTheme();
  fit();
  onScroll();

  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('scroll', onScroll);
    ro.disconnect(); io.disconnect(); themeObs.disconnect();
    scheme.removeEventListener('change', applyTheme);
    video.pause(); video.src = '';
    renderer.dispose();
  };
}
```

- [ ] **Step 2: Type check**

Run: `npx astro check 2>&1 | tail -5`
Expected: 0 errors (warnings about unused imports are fine; remove any the checker flags).

- [ ] **Step 3: Commit**

```bash
git add src/scripts/stage-run.ts
git commit -m "feat(stage): three.js renderer with morph targets, ink outline, screen canvas"
```

---

### Task 7: `Journey.astro` and `timeline.ts`, wire the canvas

**Files:**
- Modify: `src/components/Journey.astro` (whole file rewritten; the wall markup and its CSS are kept verbatim)
- Modify: `src/data/timeline.ts` (drop `scene`, `Layer`, `Motion`, `ScreenMedia`, the three `FigureParams` consts and the `figure` import)
- Check: `scripts/render.mjs` for references to `scene` (fix or leave, it is a dev tool)

- [ ] **Step 1: Rewrite `Journey.astro`**

```astro
---
// The journey stage. A full-bleed sticky three.js world behind the chapter text.
// Chapters are the timeline entries; the stage's stations sit on the first chapters
// and the camera holds after the last station. Spec: docs/rebuild/11-journey-3d-spec.md.
import { timeline } from '../data/timeline';

const chapters = timeline;
const n = chapters.length;
---

<section class="journey" data-n={n}>
  <div class="stage" aria-hidden="true">
    <canvas class="gl"></canvas>
  </div>

  <div class="wall">
    {chapters.map((m, i) => (
      <article class="ch" id={`ch-${i + 1}`} data-i={i}>
        <div class="tx">
          {i === 0 && Astro.slots.has('hero') ? (
            <slot name="hero" />
          ) : (
            <>
              <span class="yr">
                {m.year}
                {m.span && <span class="mut"> {m.span}</span>}
              </span>
              {m.lane && <span class="lane label">{m.lane}</span>}
              <h3>{m.title}</h3>
              <p>{m.body}</p>
              {m.stat && <p class="stat">{m.stat}</p>}
            </>
          )}
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
  .gl {
    display: block;
    width: 100%;
    height: 100%;
  }
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
  @media (min-width: 48.001rem) {
    .ch:first-child {
      padding-top: 13svh;
    }
  }
  .tx {
    max-width: min(var(--measure), 46ch);
    padding: 18px 28px 18px 0;
    background: color-mix(in srgb, var(--bg) 74%, transparent);
    -webkit-mask: linear-gradient(90deg, #000 86%, transparent);
    mask: linear-gradient(90deg, #000 86%, transparent);
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
  .yr .mut {
    font-family: var(--f-mono);
    font-size: var(--t-label);
    letter-spacing: 0.09em;
  }
  .lane {
    display: block;
    margin: 10px 0 6px;
  }
  .tx h3 {
    font-size: 22px;
    margin: 0 0 8px;
  }
  .stat {
    margin-top: 10px;
    font-family: var(--f-mono);
    font-size: 12px;
    letter-spacing: 0.02em;
    color: var(--mut);
  }
  @media (max-width: 48rem) {
    .ch {
      padding-top: 52svh;
    }
    .tx {
      max-width: none;
      background: color-mix(in srgb, var(--bg) 82%, transparent);
    }
    .yr {
      font-size: 40px;
    }
  }
  @media print {
    .stage {
      display: none;
    }
    .wall {
      margin-top: 0;
    }
    .ch {
      min-height: 0;
      padding-top: 0;
    }
  }
</style>

<script>
  // Load the renderer only when the journey is within one viewport. three is its own chunk.
  const root = document.querySelector<HTMLElement>('.journey');
  const canvas = root?.querySelector<HTMLCanvasElement>('canvas.gl');
  if (root && canvas) {
    const n = Number(root.dataset.n) || 1;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        import('../scripts/stage-run')
          .then((m) => m.mount(root, canvas, n))
          .catch((err) => console.warn('[journey] stage did not start', err));
      },
      { rootMargin: '100% 0px' },
    );
    io.observe(root);
  }
</script>
```

- [ ] **Step 2: Trim `timeline.ts`**

Replace the top of the file (everything before `export type Milestone`) with:

```ts
// Drives the journey on the homepage. One entry per chapter, in order.
// Words are placeholders until the LinkedIn export lands; the shape is what matters.
// The 3D stage's stations live in src/lib/stage/world.ts and sit on the first chapters.
```

In `Milestone`, delete the `scene?: Scene;` line. Delete every `scene: { ... }` block from the entries (2010, 2013, 2018, 2020) so each entry is only year, span, lane, title, body, stat, mark. Delete the `teen2018`, `arrive2018`, `studio2020` consts and the `FigureParams` import.

- [ ] **Step 3: Check the render tool**

Run: `grep -n "scene\|figure" scripts/render.mjs | head`
If it reads `m.scene` or the figure keyframes from `timeline.ts`, change those reads to use `KID`/`TEEN` from `src/lib/stage/figure3d.ts` only if it is trivial; otherwise leave the tool alone and note it in the session log as "renders the old 2D scenes only".

- [ ] **Step 4: Verify types, tests, build**

Run: `npx astro check 2>&1 | tail -3 && npm test 2>&1 | tail -3 && npm run build 2>&1 | tail -5`
Expected: 0 errors, all tests pass, build succeeds.

- [ ] **Step 5: Bundle gate**

Run:
```bash
for f in dist/_astro/*.js; do printf "%8s gz  %s\n" "$(gzip -c "$f" | wc -c | tr -d ' ')" "$f"; done | sort -n
grep -l "three" dist/_astro/*.js | head
```
Expected: the three chunk is one file under 140,000 bytes gz; the file referenced by the page's `<script type="module" src=...>` (check `grep -o '_astro/[^"]*\.js' dist/index.html`) is small (under 2 KB gz) and does not contain `WebGLRenderer`.

- [ ] **Step 6: Live check**

Run: `npm run dev` and open `http://localhost:4321`. Scroll through the first two chapters. Check:
- Chapter 1 shows the bedroom from behind the kid: TV with the zombies video, rug, poster, shelf, Xbox, ball, fan turning.
- Between chapters 1 and 2 the camera pushes forward and rises; the room recolours; the TV shrinks into the monitor while the picture turns into Notepad; the kid rises from the rug onto a chair and gets a tie; the shelf, Xbox, ball sink; the lab row rises on the right; the window becomes the whiteboard.
- After chapter 2 the camera holds in the lab for the remaining chapters.
- Toggle the theme: clear colour and outline colour follow.
- Firefox: identical.
- Reduced motion (DevTools rendering emulation): snaps between stations, fan still.

Fix composition numbers in `world.ts` and pose numbers in `figure3d.ts` as needed. Vansh reviews the live page before this task is closed.

- [ ] **Step 7: Commit**

```bash
git add src/components/Journey.astro src/data/timeline.ts src/lib/stage scripts/render.mjs
git commit -m "feat(journey): replace the CSS layer stage with the three.js world"
```

---

### Task 8: Docs

**Files:**
- Modify: `docs/rebuild/10-session-log.md` (new section at the top)
- Modify: `docs/rebuild/README.md` (add 11 and 12 to the index if it lists files)

- [ ] **Step 1: Session log**

Insert after the first heading of `10-session-log.md`:

```markdown
## 2026-08-27: stage v2, three.js

The CSS layer engine is gone. The stage is a `<canvas>` driven by `src/scripts/stage-run.ts`, loaded lazily. Spec: [11-journey-3d-spec.md](./11-journey-3d-spec.md), plan: [12-journey-3d-plan.md](./12-journey-3d-plan.md).

- Every object is a rig in `src/lib/stage/` (params in, positions out, fixed vertex count). Station keys are GPU morph targets. No opacity anywhere.
- Two stations: the 2010 bedroom and the 2013 lab. The camera holds in the lab for chapters 3 to 8 until their stations exist.
- Firefox needs no fallback any more; scroll progress is JS, WebGL is everywhere.
- `src/lib/scenes/*.svg`, `morph.ts`, `figure.ts` stay as reference until the last chapter is rebuilt.
- Add a station: a `Station` in `STATIONS`, one more key and colour per actor in `ACTORS`, `npm test` checks the counts.
```

- [ ] **Step 2: Commit**

```bash
git add docs/rebuild/10-session-log.md docs/rebuild/README.md
git commit -m "docs: log the three.js stage rebuild"
```

---

## Self-review

- Spec coverage: §1 canvas and engine removal (Task 7), lazy chunk and budget (Tasks 6, 7 step 5); §2 file layout (Tasks 2 to 6); §3 morph rules (Tasks 2 to 6, tests assert counts, screen mixes on a canvas texture instead of a shader, same effect, fewer moving parts); §4 camera curves, `locate`, reduced motion snap, aspect-based FOV, no media queries in the stage (Tasks 5, 6); §5 toon, outline, theme, textures, render on demand (Task 6); §6 fallbacks (Task 7: no JS means paper and text; print hides the stage); §7 tests and gates (every task, Task 7 step 5); §8 hold after the last station (`stageProgress`).
- Placeholders: none. Every code step is complete.
- Names: `Sink`, `flatNormals`, `figure`, `KID`, `TEEN`, `PARTS`, rig names in `props.ts`, `FACE_UV`, `STATIONS`, `ACTORS`, `ROOM`, `Actor.kind`, `makeShot`, `stageProgress`, `mount(root, canvas, chapters)` are used with the same signatures across tasks.
