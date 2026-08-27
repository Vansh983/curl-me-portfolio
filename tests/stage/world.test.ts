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
    assert.match(a.colors[0], /^#[0-9a-f]{6}$/i, a.id);
  }
  assert.equal(new Set(ACTORS.map((a) => a.id)).size, ACTORS.length);
});
