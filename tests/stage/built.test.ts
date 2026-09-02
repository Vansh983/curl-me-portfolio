import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILT } from '../../src/lib/stage/built.ts';
import { MATS } from '../../src/lib/stage/materials.ts';
import { SETS } from '../../src/lib/stage/sets.ts';

const PAINTS = ['window', 'whiteboard', 'banner', 'poster', 'sign', 'screen', 'toronto', 'screenCode', 'screenFloqer', 'screenTerminal', 'windows', 'nightSky', 'badge', 'video']; // video: the live television
const paintName = (p: string) => p.split(':')[0];

test('every code-built prop the sets use exists, and every piece is finite with a normal and a uv per vertex', () => {
  for (const s of SETS) for (const p of s.props) if (p.build) assert.ok(BUILT[p.build], `${p.build} missing`);
  for (const [name, make] of Object.entries(BUILT)) {
    const part = make();
    assert.ok(part.length > 0, name);
    for (const piece of part) {
      assert.equal(piece.pos.length % 9, 0, name);
      assert.equal(piece.nor.length, piece.pos.length, name);
      assert.equal(piece.uv.length, (piece.pos.length / 3) * 2, name);
      for (const v of piece.pos) assert.ok(Number.isFinite(v), name);
      for (const v of piece.nor) assert.ok(Number.isFinite(v), `${name} normal`);
      const su = piece.surface;
      if ('mat' in su) assert.ok(MATS[su.mat], `${name}: ${su.mat}`);
      else assert.ok(PAINTS.includes(paintName(su.paint)), `${name}: ${su.paint}`);
    }
  }
});

test('building twice gives the same thing: no hidden state', () => {
  for (const [name, make] of Object.entries(BUILT)) {
    const a = make(), b = make();
    assert.equal(a.length, b.length, name);
    for (let i = 0; i < a.length; i++) assert.deepEqual(Array.from(a[i].pos), Array.from(b[i].pos), name);
  }
});

test('painted faces span uv 0..1 so the canvas lands whole', () => {
  for (const name of ['skyline', 'whiteboard', 'banner', 'teamPhoto', 'jobsPoster', 'sign', 'monitor', 'monitorApp', 'laptop']) {
    const painted = BUILT[name]().find((p) => 'paint' in p.surface)!;
    const us = Array.from({ length: painted.uv.length / 2 }, (_, i) => painted.uv[i * 2]);
    const vs = Array.from({ length: painted.uv.length / 2 }, (_, i) => painted.uv[i * 2 + 1]);
    assert.equal(Math.min(...us), 0, name);
    assert.equal(Math.max(...us), 1, name);
    assert.equal(Math.min(...vs), 0, name);
    assert.equal(Math.max(...vs), 1, name);
  }
});
