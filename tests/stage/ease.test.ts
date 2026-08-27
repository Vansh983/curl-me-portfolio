import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EASE, timed } from '../../src/lib/stage/ease.ts';

test('every curve starts at 0, ends at 1 and stays inside 0..1', () => {
  for (const [name, f] of Object.entries(EASE)) {
    assert.ok(Math.abs(f(0)) < 1e-9 && Math.abs(f(1) - 1) < 1e-9, name);
    for (let k = 0; k <= 100; k++) { const v = f(k / 100); assert.ok(v >= -1e-9 && v <= 1 + 1e-9, `${name} at ${k}`); }
  }
});

test('in and out are quadratic: gravity-shaped', () => {
  assert.equal(EASE.in(0.5), 0.25);
  assert.equal(EASE.out(0.5), 0.75);
});

test('bounce comes back up three times', () => {
  const v = Array.from({ length: 1001 }, (_, k) => EASE.bounce(k / 1000));
  let peaks = 0;
  for (let k = 1; k < 1000; k++) if (v[k] > v[k - 1] && v[k] >= v[k + 1]) peaks++;
  assert.ok(peaks >= 3, `peaks ${peaks}`);
});

test('timed clamps outside the window and eases inside', () => {
  const w = { start: 0.25, end: 0.75, ease: 'linear' as const };
  assert.equal(timed(0, w), 0);
  assert.equal(timed(0.5, w), 0.5);
  assert.equal(timed(1, w), 1);
  assert.ok(Math.abs(timed(0.5) - 0.5) < 1e-9); // default: whole gap, sine
  assert.ok(timed(0.25) < 0.25);
});
