import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clamp01 } from '../src/lib/lerp.ts';

test('clamp01', () => {
  assert.equal(clamp01(-1), 0);
  assert.equal(clamp01(2), 1);
  assert.equal(clamp01(NaN), 0);
});
