import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SETS } from '../../src/lib/stage/sets.ts';
import { ASSETS } from '../../src/lib/stage/assets.ts';
import { MATS } from '../../src/lib/stage/materials.ts';

const ids = new Set(ASSETS.map((a) => a.id));
const finite = (v: number[]) => v.every((n) => Number.isFinite(n));

test('three sets, each lit and finite', () => {
  assert.equal(SETS.length, 3);
  for (const s of SETS) {
    assert.ok(s.env === 'studio' || s.env === 'sky');
    assert.ok(s.tint.power >= 0);
    assert.ok(s.exposure > 0 && s.exposure < 3);
    assert.ok(s.envPower > 0 && s.envPower <= 1);
    assert.ok(s.fog.far > s.fog.near);
    assert.ok(finite(s.sun.dir) && s.sun.power > 0);
  }
});

test('every placement names a model in the manifest or a code-built prop, and sits somewhere finite', () => {
  for (const s of SETS) {
    for (const p of s.props) {
      assert.ok((p.model && ids.has(p.model)) || p.build, `${s.id}: ${p.model ?? p.build}`);
      assert.ok(finite(p.at));
      if (p.href) assert.ok(p.cap, 'a link needs a caption');
    }
  }
});

test('shells use designed materials and open where the dolly passes', () => {
  const [room, lab] = SETS;
  for (const s of [room, lab]) {
    assert.ok(s.shell);
    assert.ok(MATS[s.shell!.floor] && MATS[s.shell!.wall] && MATS[s.shell!.ceiling ?? s.shell!.wall], `${s.id} materials`);
    assert.ok(s.shell!.openings.some((o) => o.h > 1.9 && (o.sill ?? 0) === 0), `${s.id} has a door`);
  }
  assert.ok(room.shell!.openings.some((o) => o.wall === 'x+'));
  assert.ok(lab.shell!.openings.some((o) => o.wall === 'x-') && lab.shell!.openings.some((o) => o.wall === 'x+'));
});
