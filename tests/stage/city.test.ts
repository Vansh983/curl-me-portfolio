import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Sink, earcut } from '../../src/lib/stage/rig.ts';
import { CITY, cityBlocks, cnTower, streetLights } from '../../src/lib/stage/city.ts';

describe('city', () => {
  it('earcut and extrude cover a footprint either way round, concave too', () => {
    assert.equal(earcut([[0, 0], [0, 1], [1, 1], [1, 0]]).length, 2);
    assert.equal(earcut([[0, 0], [0, 2], [1, 2], [1, 1], [2, 1], [2, 0]]).length, 4);
    for (const ring of [[[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0], [0, 1], [1, 1], [1, 0]]] as Array<Array<[number, number]>>) {
      const cap = new Sink(), s = new Sink().extrude(ring, 0, 2, undefined, cap);
      assert.equal(s.pos.length, 4 * 6 * 3);
      assert.equal(cap.pos.length, 2 * 3 * 3);
      // the roof faces up: (b - a) x (c - a) has a positive y
      const [ax, ay, az, bx, by, bz, cx, cy, cz] = cap.pos;
      assert.ok((bz - az) * (cx - ax) - (bx - ax) * (cz - az) > 0, `roof faces up for ${JSON.stringify(ring)}`);
      // the first side faces out: its normal points away from the footprint's centre
      const [sx, , sz, tx, , tz] = s.pos;
      const nx = -(tz - sz), nz = tx - sx;
      assert.ok(nx * ((sx + tx) / 2 - 0.5) + nz * ((sz + tz) / 2 - 0.5) > 0, `side faces out for ${JSON.stringify(ring)}`);
    }
  });
  it('is real Toronto: the CN Tower 560 m off and 15 degrees right of the window, the towers under 300 m, a dome, roads', () => {
    const d = Math.hypot(...CITY.cn), az = (Math.atan2(CITY.cn[0], -CITY.cn[1]) * 180) / Math.PI;
    assert.ok(d > 520 && d < 600 && az > 12 && az < 18, `cn ${CITY.cn} d ${d} az ${az}`);
    assert.ok(CITY.buildings.length > 300 && CITY.buildings.length < 2000);
    assert.ok(CITY.buildings.every((b) => b.h <= 310 && b.h > 0 && b.min < b.h && b.p.length >= 6));
    assert.ok(CITY.buildings.some((b) => b.dome && b.h === 86)); // the Rogers Centre
    assert.ok(CITY.roads.length > 500);
    const lights = streetLights();
    assert.ok(lights.length / 3 > 3000 && lights.length / 3 < 20000, `${lights.length / 3} street lights`);
  });
  it('builds within a budget', () => {
    const near = new Sink(), far = new Sink(), tops = new Sink(), domes = new Sink();
    cityBlocks(near, far, tops, domes);
    const tris = (near.pos.length + far.pos.length + tops.pos.length + domes.pos.length) / 9;
    assert.ok(tris > 10000 && tris < 60000, `${tris} triangles`);
    const shaft = new Sink(), pod = new Sink(), lights = new Sink();
    cnTower(shaft, pod, lights);
    const cn = (shaft.pos.length + pod.pos.length + lights.pos.length) / 9;
    assert.ok(cn > 500 && cn < 4000, `${cn} triangles in the CN Tower`);
    let top = 0;
    for (let i = 1; i < shaft.pos.length; i += 3) top = Math.max(top, shaft.pos[i]);
    assert.equal(Math.round(top), 553);
  });
});
