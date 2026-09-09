import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stageProgress, STAGE_SPAN, ch } from '../../src/lib/stage/shot.ts';

test('stageProgress runs the stage over `span` chapter lengths, then holds', () => {
  assert.equal(stageProgress(0, 8, 1), 0);
  assert.ok(Math.abs(stageProgress(1 / 7, 8, 1) - 1) < 1e-9);
  assert.equal(stageProgress(0.9, 8, 1), 1);
  assert.ok(Math.abs(stageProgress(0.125, 9, 2) - 0.5) < 1e-9);
  assert.equal(stageProgress(0.25, 9, 2), 1);
  assert.ok(Math.abs(stageProgress(1 / 8, 9, 3) - 1 / 3) < 1e-9);
  assert.ok(Math.abs(stageProgress(2 / 8, 9, 3) - 2 / 3) < 1e-9);
  assert.equal(stageProgress(3 / 8, 9, 3), 1);
  // nine chapters, the stage over seven of them: the flight on the 2022 card, the podium on the last stage card
  assert.ok(Math.abs(stageProgress(5 / 9, 10, STAGE_SPAN) - 5 / 9) < 1e-9);
  assert.equal(stageProgress(1, 10, STAGE_SPAN), 1);
  assert.ok(Math.abs(ch(7) * STAGE_SPAN - 7) < 1e-12, 'chapter units');
});
