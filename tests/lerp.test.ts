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
  assert.deepEqual(locate(3 / 6, n), { i: 3, t: 0 });
  assert.deepEqual(locate(3 / 6 + 0.1 / 6, n), { i: 3, t: 0 });
  const mid = locate(3.5 / 6, n);
  assert.equal(mid.i, 3);
  assert.ok(Math.abs(mid.t - 0.5) < 1e-9);
  assert.deepEqual(locate(3.95 / 6, n), { i: 3, t: 1 });
});
