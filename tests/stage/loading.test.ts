import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadInOrder } from '../../src/lib/stage/loading.ts';

test('preparation overlaps two loads, preserves queue order, and waits for both', async () => {
  const started: number[] = [], releases: Array<() => void> = [];
  let active = 0, peak = 0;
  const run = loadInOrder([0, 1, 2], async (i) => {
    started.push(i); peak = Math.max(peak, ++active);
    await new Promise<void>((resolve) => releases[i] = resolve);
    active--;
  });
  assert.deepEqual(started, [0, 1]);
  releases[1]();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(started, [0, 1, 2]);
  releases[0](); releases[2]();
  await run;
  assert.equal(active, 0); assert.equal(peak, 2);
});

test('a failed room stops scheduling and cannot signal a ready journey', async () => {
  const started: number[] = [];
  await assert.rejects(loadInOrder([0, 1, 2], async (i) => { started.push(i); throw new Error('missing model'); }, 1), /missing model/);
  assert.deepEqual(started, [0]);
});
