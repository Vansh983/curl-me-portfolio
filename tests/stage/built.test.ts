import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILT } from '../../src/lib/stage/built.ts';
import { MATS } from '../../src/lib/stage/materials.ts';
import { SETS } from '../../src/lib/stage/sets.ts';
import { BufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';

test('plaza paving stops at indoor floors while covering the route to Delhi', () => {
  const geometry = new BufferGeometry().setAttribute('position', new Float32BufferAttribute(BUILT.plazaFloor()[0].pos, 3));
  const paving = new Mesh(geometry, new MeshBasicMaterial());
  paving.position.set(...SETS[3].props.find((p) => p.build === 'plazaFloor')!.at);
  paving.updateMatrixWorld();
  const covered = (x: number, z: number) => new Raycaster(new Vector3(x, 1, z), new Vector3(0, -1, 0)).intersectObject(paving).length > 0;
  for (const [x, z] of [[-0.75, 0.75], [-1.1, 3.2], [-3, 1.6], [1.4, 3.6]])
    assert.ok(!covered(x, z), `paving overlaps an indoor floor at ${x}, ${z}`);
  for (const [x, z] of [[-0.7, -0.3], [1.4, 2], [0, 4]])
    assert.ok(covered(x, z), `missing paving outside at ${x}, ${z}`);
  geometry.dispose();
  paving.material.dispose();
});

test('the exterior facade sits beyond Delhi interior walls without coplanar faces', () => {
  const parts = BUILT.facade().map((part) => new Mesh(new BufferGeometry().setAttribute('position', new Float32BufferAttribute(part.pos, 3)), new MeshBasicMaterial()));
  const shell = SETS[4].shell!, origin = new Vector3(-0.7, 1.58, 0.55);
  for (const [direction, insideDistance] of [[new Vector3(0, 0, 1), shell.z[1] - origin.z], [new Vector3(1, 0, 0), shell.x[1] - origin.x]] as const) {
    const hit = new Raycaster(origin, direction).intersectObjects(parts)[0];
    assert.ok(hit && hit.distance > insideDistance + 0.005, `facade overlaps interior wall: ${hit?.distance} / ${insideDistance}`);
  }
  parts.forEach((part) => { part.geometry.dispose(); part.material.dispose(); });
});

const PAINTS = ['window', 'whiteboard', 'banner', 'poster', 'sign', 'screen', 'toronto', 'screenCode', 'screenFloqer', 'screenTerminal', 'windows', 'nightSky', 'badge', 'video', 'screenBoard']; // video: the live television
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

test('the 2020 room props: a wide desk, shelves on brackets, a row of mixed awards, the mess', () => {
  for (const n of ['deskWide', 'wallShelf', 'awards', 'cartons', 'clothes', 'papers', 'curtainDrawn', 'bin', 'monitorBoard']) assert.ok(BUILT[n], n);
  const span = (name: string, axis: 0 | 1 | 2) => {
    let lo = Infinity, hi = -Infinity;
    for (const p of BUILT[name]()) for (let i = axis; i < p.pos.length; i += 3) { lo = Math.min(lo, p.pos[i]); hi = Math.max(hi, p.pos[i]); }
    return [lo, hi];
  };
  const [dx0, dx1] = span('deskWide', 0), [, dy1] = span('deskWide', 1);
  assert.ok(dx1 - dx0 > 2.1 && dx1 - dx0 < 2.4, 'a large desk');
  assert.ok(Math.abs(dy1 - 0.74) < 0.01, 'top at 0.74 like the others');
  const [sx0, sx1] = span('wallShelf', 0);
  assert.ok(sx1 - sx0 > 2.1, 'the shelf runs the desk');
  const awards = BUILT['awards']();
  const mats = new Set(awards.map((p) => ('mat' in p.surface ? p.surface.mat : 'paint')));
  assert.ok(mats.has('gold') && mats.size >= 4, `mixed: ${[...mats]}`); // cups, plaques, glass, wood: different shapes and sizes
  const [ay0, ay1] = span('awards', 1);
  assert.ok(ay0 >= -0.01 && ay1 > 0.2 && ay1 < 0.45, `${ay0} ${ay1}`); // they stand on the shelf, the tallest under the next shelf
});

test('building twice gives the same thing: no hidden state', () => {
  for (const [name, make] of Object.entries(BUILT)) {
    const a = make(), b = make();
    assert.equal(a.length, b.length, name);
    for (let i = 0; i < a.length; i++) assert.deepEqual(Array.from(a[i].pos), Array.from(b[i].pos), name);
  }
});

test('painted faces span uv 0..1 so the canvas lands whole', () => {
  for (const name of ['skyline', 'whiteboard', 'banner', 'teamPhoto', 'jobsPoster', 'sign', 'monitor', 'monitorApp', 'monitorBoard', 'laptop']) {
    const painted = BUILT[name]().find((p) => 'paint' in p.surface)!;
    const us = Array.from({ length: painted.uv.length / 2 }, (_, i) => painted.uv[i * 2]);
    const vs = Array.from({ length: painted.uv.length / 2 }, (_, i) => painted.uv[i * 2 + 1]);
    assert.equal(Math.min(...us), 0, name);
    assert.equal(Math.max(...us), 1, name);
    assert.equal(Math.min(...vs), 0, name);
    assert.equal(Math.max(...vs), 1, name);
  }
});
