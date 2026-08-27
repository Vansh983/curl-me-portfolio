import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACTORS, STATIONS } from '../../src/lib/stage/world.ts';

test('every actor has one key and one colour per station, same count in each', () => {
  assert.ok(STATIONS.length >= 2);
  for (const a of ACTORS) {
    assert.equal(a.keys.length, STATIONS.length, a.id);
    assert.equal(a.colors.length, STATIONS.length, a.id);
    for (const k of a.keys) {
      assert.equal(k.length, a.keys[0].length, a.id);
      assert.ok(Array.from(k).every(Number.isFinite), a.id);
    }
    assert.equal(a.uv.length, (a.keys[0].length / 3) * 2, `${a.id} uv`);
    assert.equal(a.col.length, a.keys[0].length, `${a.id} col`);
    assert.match(a.colors[0], /^#[0-9a-f]{6}$/i, a.id);
  }
  assert.equal(new Set(ACTORS.map((a) => a.id)).size, ACTORS.length);
});

test('the story beats are all on stage', () => {
  const ids = new Set(ACTORS.map((a) => a.id));
  for (const id of ['poster', 'shelf', 'shelfLabels', 'xbox', 'xboxLogo', 'nuggets', 'ball', 'curtains', 'window', 'socket', 'wire', 'keyboard', 'clock', 'rug', 'chair', 'figure-hair', 'figure-held', 'figure-tie', 'banner', 'board', 'tubes', 'tower', 'labChairs', 'whiteboard']) {
    assert.ok(ids.has(id), id);
  }
});
