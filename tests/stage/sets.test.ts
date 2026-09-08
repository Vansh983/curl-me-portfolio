import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LECTURE_ROWS, SETS } from '../../src/lib/stage/sets.ts';
import { ASSETS } from '../../src/lib/stage/assets.ts';
import { MATS } from '../../src/lib/stage/materials.ts';

const ids = new Set(ASSETS.map((a) => a.id));
const finite = (v: number[]) => v.every((n) => Number.isFinite(n));

test('lecture furniture follows the stepped floor and the rear door meets its landing', () => {
  const theatre = SETS[6];
  for (const row of LECTURE_ROWS) {
    assert.equal(theatre.props.filter((p) => p.build === 'lectureBench' && p.at[1] === row.height && p.at[2] === row.desk).length, 2);
    const chairs = theatre.props.filter((p) => p.model === 'SchoolChair_01' && p.at[1] === row.height);
    assert.equal(chairs.length, 4);
    assert.ok(chairs.every((p) => p.rot?.[1] === 180 && p.at[2] > row.desk && p.at[2] < row.back));
  }
  assert.equal(theatre.shell!.openings.find((o) => o.wall === 'z+')!.sill, 1.08);
  assert.ok(theatre.shell!.h - 1.08 > 3);
});

test('seven sets, each lit and finite', () => {
  assert.equal(SETS.length, 7);
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
  const [now, room, lab, plaza, delhi, , halifax] = SETS;
  for (const s of [now, room, lab, delhi, halifax]) {
    assert.ok(s.shell);
    assert.ok(MATS[s.shell!.floor] && MATS[s.shell!.wall] && MATS[s.shell!.ceiling ?? s.shell!.wall], `${s.id} materials`);
    assert.ok(s.shell!.openings.some((o) => o.h > 1.9 && (o.sill ?? 0) === 0), `${s.id} has a door`);
  }
  // the ring: out of the apartment north, out of the 2010 room east, out of the lab south, across the plaza,
  // north into the 2020 room, west back into the apartment
  const door = (s: typeof now, wall: string) => s.shell!.openings.some((o) => o.wall === wall && o.h > 1.9 && (o.sill ?? 0) === 0);
  assert.ok(door(now, 'z+') && door(now, 'x+'));
  assert.ok(door(room, 'z-') && door(room, 'x+'));
  assert.ok(door(lab, 'x-') && door(lab, 'z-'));
  assert.ok(plaza.outdoor && !plaza.shell);
  assert.equal(delhi.id, 'delhi');
  assert.ok(door(delhi, 'z-') && door(delhi, 'x-'));
  assert.ok(!delhi.shell!.openings.some((o) => (o.sill ?? 0) > 0), 'no window: the curtain is drawn');
});

test('the 2020 room stands east of the apartment, between the brick door and the lab passage', () => {
  const delhi = SETS[4].shell!;
  assert.ok(delhi.x[0] >= -2.4 && delhi.x[1] <= 0.8, `${delhi.x}`); // clear of the passage from the brick door (x -4.2..-2.4) and the passage south from the lab (x 0.8..2.0)
  assert.ok(delhi.z[0] >= 0 && delhi.z[1] <= 4.6, `${delhi.z}`); // on the plaza's edge, south of the lab block
  const west = delhi.openings.find((o) => o.wall === 'x-' && (o.sill ?? 0) === 0)!;
  assert.ok(Math.abs(west.at - 1.6) < 0.01, 'meets the passage from the brick door at z 1.6');
  const names = SETS[4].props.map((p) => p.build ?? p.model);
  for (const n of ['deskWide', 'wallShelf', 'awards', 'pcTower', 'office_chair_black', 'bed_single', 'cartons', 'clothes', 'papers', 'curtainDrawn']) assert.ok(names.includes(n), n);
  assert.equal(SETS[4].props.filter((p) => p.build?.startsWith('monitor')).length, 2);
  assert.equal(SETS[4].props.filter((p) => p.build === 'laptop' || p.model === 'laptop_14_aluminium').length, 2);
});
