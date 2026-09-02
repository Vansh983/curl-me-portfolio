import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadAllSets, showSetBackdrops } from '../../src/lib/stage/lifecycle.ts';

test('loads every defined set in order and announces the first set once', async () => {
  const loaded: number[] = [];
  let first = 0;
  await loadAllSets(4, async (i) => { loaded.push(i); }, () => { first++; });
  assert.deepEqual(loaded, [0, 1, 2, 3]);
  assert.equal(first, 1);
});

test('backdrops appear only in their intended sets', () => {
  const toronto = { visible: true }, sanFrancisco = { visible: true };
  const backdrops = [{ root: toronto, sets: [0] }, { root: sanFrancisco, sets: [2, 3] }];

  showSetBackdrops(backdrops, 1);
  assert.equal(toronto.visible, false);
  assert.equal(sanFrancisco.visible, false);

  showSetBackdrops(backdrops, 2);
  assert.equal(toronto.visible, false);
  assert.equal(sanFrancisco.visible, true);

  showSetBackdrops(backdrops, 3);
  assert.equal(toronto.visible, false);
  assert.equal(sanFrancisco.visible, true);
});
