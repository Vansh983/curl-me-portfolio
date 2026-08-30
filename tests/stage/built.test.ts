import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILT } from '../../src/lib/stage/built.ts';
import { ASSETS } from '../../src/lib/stage/assets.ts';
import { SETS } from '../../src/lib/stage/sets.ts';

const texIds = new Set(ASSETS.filter((a) => a.kind === 'texture').map((a) => a.id));
const PAINTS = ['window', 'whiteboard', 'banner', 'poster', 'sign', 'screen'];

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
      if ('tex' in su) assert.ok(texIds.has(su.tex), `${name}: ${su.tex}`);
      else if ('paint' in su) assert.ok(PAINTS.includes(su.paint), `${name}: ${su.paint}`);
      else assert.match(su.color, /^#[0-9a-f]{6}$/i);
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
  for (const name of ['skyline', 'whiteboard', 'banner', 'teamPhoto', 'sign']) {
    const painted = BUILT[name]().find((p) => 'paint' in p.surface)!;
    const us = Array.from({ length: painted.uv.length / 2 }, (_, i) => painted.uv[i * 2]);
    const vs = Array.from({ length: painted.uv.length / 2 }, (_, i) => painted.uv[i * 2 + 1]);
    assert.equal(Math.min(...us), 0, name);
    assert.equal(Math.max(...us), 1, name);
    assert.equal(Math.min(...vs), 0, name);
    assert.equal(Math.max(...vs), 1, name);
  }
});
