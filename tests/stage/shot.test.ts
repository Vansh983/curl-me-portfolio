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
