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

test('feet stay near the floor in both keys', () => {
  for (const p of [KID, TEEN]) {
    const f = figure(p);
    let minY = Infinity;
    for (let i = 1; i < f.legs.length; i += 3) minY = Math.min(minY, f.legs[i]);
    assert.ok(minY > -0.08 && minY < 0.12, `${p === KID ? 'kid' : 'teen'} lowest leg point ${minY}`);
  }
});
