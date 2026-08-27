import { test } from 'node:test';
import assert from 'node:assert/strict';
import { figure, KID, TWEEN, PARTS, type Figure } from '../../src/lib/stage/figure3d.ts';

const rnd = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const randomFigure = (r: () => number): Figure => ({
  ...KID,
  height: 0.8 + r(), headR: 0.06 + r() * 0.1, shoulder: 0.1 + r() * 0.15, hip: 0.08 + r() * 0.1, limbR: 0.02 + r() * 0.04,
  hairTop: r(), tie: r(), held: r(), x: r() * 4 - 2, y: r(), z: r() * 4 - 2, yaw: r() * 6.28, crossLegs: r(),
  pose: { hipFlex: r() * 120, hipSpread: r() * 60, kneeFlex: r() * 150, shoulderFlex: r() * 90, elbowFlex: r() * 120, armSpread: r() * 40, foreSpread: r() * 60 - 30, torsoLean: r() * 30 - 10, headTilt: r() * 20 - 10 },
});

test('every part keeps its vertex count across params', () => {
  const r = rnd(7);
  const base = figure(KID);
  for (let k = 0; k < 20; k++) {
    const f = figure(randomFigure(r));
    for (const part of PARTS) assert.equal(f[part].pos.length, base[part].pos.length, part);
  }
  const t = figure(TWEEN);
  for (const part of PARTS) assert.equal(t[part].pos.length, base[part].pos.length, part);
});

test('positions are finite and the head sits above the pelvis', () => {
  for (const p of [KID, TWEEN]) {
    const f = figure(p);
    for (const part of PARTS) assert.ok(Array.from(f[part].pos).every(Number.isFinite), part);
    let maxY = -Infinity;
    for (let i = 1; i < f.skin.pos.length; i += 3) maxY = Math.max(maxY, f.skin.pos[i]);
    assert.ok(maxY > p.y + p.height * 0.3, `head top ${maxY} vs pelvis ${p.y}`);
  }
});

test('hair covers the back of the head', () => {
  const f = figure(KID);
  let hairMinY = Infinity, headMaxY = -Infinity, hairMaxZ = -Infinity;
  for (let i = 0; i < f.hair.pos.length; i += 3) { hairMinY = Math.min(hairMinY, f.hair.pos[i + 1]); hairMaxZ = Math.max(hairMaxZ, f.hair.pos[i + 2]); }
  for (let i = 1; i < f.skin.pos.length; i += 3) headMaxY = Math.max(headMaxY, f.skin.pos[i]);
  // the cap reaches below the centre of the head at the back
  assert.ok(hairMinY < headMaxY - KID.headR * 1.2, `hair bottom ${hairMinY}, head top ${headMaxY}`);
  assert.ok(hairMaxZ > KID.z + KID.headR * 0.5);
});

test('tie is flat when tie = 0, the controller shrinks into the mouse', () => {
  const f = figure({ ...KID, tie: 0 });
  let minX = Infinity, maxX = -Infinity;
  for (let i = 0; i < f.tie.pos.length; i += 3) { minX = Math.min(minX, f.tie.pos[i]); maxX = Math.max(maxX, f.tie.pos[i]); }
  assert.ok(maxX - minX < 0.01);
  const span = (g: Float32Array) => {
    let a = Infinity, b = -Infinity;
    for (let i = 0; i < g.length; i += 3) { a = Math.min(a, g[i]); b = Math.max(b, g[i]); }
    return b - a;
  };
  assert.ok(span(figure(KID).held.pos) > span(figure(TWEEN).held.pos) * 1.5);
});

test('shoes stay near the floor in both keys', () => {
  for (const p of [KID, TWEEN]) {
    const f = figure(p);
    let minY = Infinity;
    for (let i = 1; i < f.shoes.pos.length; i += 3) minY = Math.min(minY, f.shoes.pos[i]);
    assert.ok(minY > -0.08 && minY < 0.14, `${p === KID ? 'kid' : 'tween'} lowest shoe point ${minY}`);
  }
});
