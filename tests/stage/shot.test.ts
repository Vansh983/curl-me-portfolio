import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stageProgress } from '../../src/lib/stage/shot.ts';

test('stageProgress lands set 1 on chapter 1 and holds after the last set', () => {
  assert.equal(stageProgress(0, 8, 2), 0);
  assert.ok(Math.abs(stageProgress(1 / 7, 8, 2) - 1) < 1e-9);
  assert.equal(stageProgress(0.9, 8, 2), 1);
  assert.ok(Math.abs(stageProgress(0.125, 9, 3) - 0.5) < 1e-9);
  assert.equal(stageProgress(0.25, 9, 3), 1);
});
