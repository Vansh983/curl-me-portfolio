import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../../src/lib/stage/props.ts';

const finite = (a: Float32Array) => Array.from(a).every(Number.isFinite);

test('each rig keeps its count between two very different param sets', () => {
  const pairs: Array<[string, Float32Array, Float32Array]> = [
    ['floor', P.floor({ w: 4, d: 4 }), P.floor({ w: 1, d: 9 })],
    ['walls', P.walls({ w: 4, h: 3, d: 4 }), P.walls({ w: 1, h: 1, d: 1 })],
    ['ceiling', P.ceiling({ w: 4, h: 3, d: 4 }), P.ceiling({ w: 2, h: 2, d: 2 })],
    ['panel', P.panel({ x: 0, y: 1, z: 0, w: 1, h: 1, t: 0.02, yaw: 0 }), P.panel({ x: 1, y: 2, z: 3, w: 0.001, h: 0.001, t: 0.001, yaw: 1.5 })],
    ['table', P.table({ x: 0, y: 0, z: 0, w: 1, h: 0.7, d: 0.6, top: 0.04 }), P.table({ x: 1, y: -1, z: 2, w: 2, h: 0.4, d: 1, top: 0.02 })],
    ['screenBody', P.screenBody({ x: 0, y: 1, z: 0, w: 1, h: 0.7, d: 0.5, standW: 0.001, standH: 0.001, standD: 0.001 }), P.screenBody({ x: 0, y: 1, z: -1, w: 0.4, h: 0.4, d: 0.4, standW: 0.3, standH: 0.06, standD: 0.3 })],
    ['face', P.face({ x: 0, y: 1, z: 0, w: 1, h: 0.6 }), P.face({ x: 2, y: 1, z: -1, w: 0.3, h: 0.2 })],
    ['seat', P.seat({ x: 0, z: 0, rugR: 0.9, rugT: 0.01, seatW: 0.001, seatD: 0.001, seatH: 0.002, seatT: 0.001, legR: 0.001, backH: 0.001, yOff: -0.3 }), P.seat({ x: 0, z: -1, rugR: 0.001, rugT: 0.001, seatW: 0.45, seatD: 0.45, seatH: 0.45, seatT: 0.04, legR: 0.02, backH: 0.4, yOff: 0 })],
    ['fan', P.fan({ rod: 0.3, r: 0.6, hub: 0.08 }), P.fan({ rod: 0.1, r: 0.2, hub: 0.02 })],
    ['crate', P.crate({ x: 0, y: 0, z: 0, w: 1, h: 1, d: 1 }), P.crate({ x: 0, y: -1, z: 0, w: 0.001, h: 0.001, d: 0.001 })],
    ['ball', P.ball({ x: 0, y: 0.1, z: 0, r: 0.1 }), P.ball({ x: 0, y: -1, z: 0, r: 0.001 })],
    ['shelf', P.shelf({ x: 1, y: 1, z: -2, w: 0.9, scale: 1 }), P.shelf({ x: 1, y: -1, z: -2, w: 0.9, scale: 0.001 })],
    ['labRow', P.labRow({ x: 1.6, z0: -1.2, gap: 0.8, lift: 0 }), P.labRow({ x: 1.6, z0: -1.2, gap: 0.8, lift: 1 })],
  ];
  for (const [name, a, b] of pairs) {
    assert.equal(a.length, b.length, name);
    assert.ok(finite(a) && finite(b), name);
  }
});

test('face is one quad with matching uv', () => {
  assert.equal(P.face({ x: 0, y: 0, z: 0, w: 1, h: 1 }).length, 6 * 3);
  assert.equal(P.FACE_UV.length, 6 * 2);
});

test('labRow at lift 0 is fully under the floor', () => {
  const a = P.labRow({ x: 1.6, z0: -1.2, gap: 0.8, lift: 0 });
  let maxY = -Infinity;
  for (let i = 1; i < a.length; i += 3) maxY = Math.max(maxY, a[i]);
  assert.ok(maxY <= 0);
});
