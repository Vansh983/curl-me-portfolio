import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACTORS, STATIONS } from '../../src/lib/stage/world.ts';

test('every actor has one key and one colour per station, same count in each', () => {
  assert.equal(STATIONS.length, 3);
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

test('timing, paths and captions line up with the stations', () => {
  for (const a of ACTORS) {
    if (a.timing) {
      assert.equal(a.timing.length, STATIONS.length - 1, `${a.id} timing`);
      for (const w of a.timing) assert.ok(w.start >= 0 && w.end <= 1 && w.end > w.start, `${a.id} window`);
    }
    if (a.path) assert.equal(a.path.length, STATIONS.length, `${a.id} path`);
    if (a.cap) assert.equal(a.cap.length, STATIONS.length, `${a.id} cap`);
    if (a.href) assert.ok(a.cap?.some(Boolean), `${a.id} href without caption`);
  }
  for (const s of STATIONS) assert.equal(s.subject.length, 3);
});

test('the story beats are all on stage', () => {
  const ids = new Set(ACTORS.map((a) => a.id));
  for (const id of ['poster', 'shelf', 'shelfLabels', 'xbox', 'xboxLogo', 'nuggets', 'ball', 'curtains', 'window', 'socket', 'wire', 'keyboard', 'clock', 'rug', 'chair', 'figure-hair', 'figure-held', 'figure-tie', 'banner', 'board', 'tubes', 'tower', 'labChairs', 'whiteboard', 'bridge', 'sky', 'water', 'sign', 'palmL', 'lamp', 'figure-glasses', 'figure-badge']) {
    assert.ok(ids.has(id), id);
  }
});
