import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { pieceIsLive, placementIsLive, parseBakedName, DROP_PROP, CONTEXT_PROP, CONTEXT_MODEL, LM_SCALE } from '../../src/lib/stage/bake.ts';
import { SETS } from '../../src/lib/stage/sets.ts';

test('live pieces: painted faces, glass, cloth and fans stay with the runtime; the rest bakes', () => {
  assert.ok(pieceIsLive('paint:screenCode', 'screen'));
  assert.ok(pieceIsLive('paint:sign', ''));
  assert.ok(pieceIsLive('mat:tubeGlass', 'tube'));
  assert.ok(pieceIsLive('mat:curtain', 'curtain'));
  assert.ok(pieceIsLive('mat:cabinGlass', ''));
  assert.ok(pieceIsLive('mat:board', 'drop'));
  assert.ok(pieceIsLive('mat:anything', 'fan'));
  assert.ok(!pieceIsLive('mat:deskTop', ''));
  assert.ok(!pieceIsLive('mat:bezel', 'screen'));
});

test('live placements: backdrops, the wide ground, leafy models, screens and lights', () => {
  assert.ok(placementIsLive({ build: 'city', at: [0, 0, 0], live: 'city' }));
  assert.ok(placementIsLive({ build: 'plazaFloor', at: [0, 0, 0] }));
  assert.ok(placementIsLive({ model: 'palm_medium', at: [0, 0, 0] }));
  assert.ok(placementIsLive({ model: 'television_02', at: [0, 0, 0], live: 'tv' }));
  assert.ok(!placementIsLive({ model: 'office_chair_black', at: [0, 0, 0] }));
  for (const p of DROP_PROP) assert.ok(placementIsLive({ build: p, at: [0, 0, 0] }), p);
  for (const p of CONTEXT_PROP) assert.ok(placementIsLive({ build: p, at: [0, 0, 0] }), p);
  for (const m of CONTEXT_MODEL) assert.ok(placementIsLive({ model: m, at: [0, 0, 0] }), m);
});

test('baked names read back, with or without the suffix Blender adds', () => {
  assert.deepEqual(parseBakedName('b|desk|mat:deskTop|'), { kind: 'b', prop: 'desk', surface: 'mat:deskTop', live: '' });
  assert.deepEqual(parseBakedName('m|office_chair_black|Back fabric|.002'), { kind: 'm', prop: 'office_chair_black', surface: 'Back fabric', live: '' });
  assert.equal(parseBakedName('Material.001'), null);
  assert.ok(LM_SCALE > 0);
});

test('every baked set has its file and lightmap, under 5 MB each', { skip: !existsSync('public/assets/stage/baked') }, () => {
  SETS.forEach((S, i) => {
    if (!S.baked) return;
    for (const f of [`public/assets/stage/baked/set${i}.glb`, `public/assets/stage/baked/set${i}_lm.webp`]) {
      assert.ok(existsSync(f), f);
      assert.ok(statSync(f).size < 5e6, f);
    }
  });
});

test("the door at the top of the house's stair is marked a door: raised, the bake would light it as a window", () => {
  const house = SETS[12].shell!;
  const raised = house.openings.filter((o) => (o.sill ?? 0) > 0);
  for (const o of raised) assert.ok(o.door || o.h < 2.0, `a raised opening ${o.w} by ${o.h} on ${o.wall} is neither a window nor marked a door`);
  assert.ok(raised.some((o) => o.door), 'the stair door is raised and marked');
});
