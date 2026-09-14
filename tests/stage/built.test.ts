import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILT } from '../../src/lib/stage/built.ts';
import { MATS } from '../../src/lib/stage/materials.ts';
import { LECTURE_ROWS, SETS } from '../../src/lib/stage/sets.ts';
import { BufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';

test('the cabin has open rounded windows, a complete ring round each and an inward-facing crown', () => {
  const parts = BUILT.aircraftCabin();
  const meshes = parts.map((p) => new Mesh(new BufferGeometry().setAttribute('position', new Float32BufferAttribute(p.pos, 3)), new MeshBasicMaterial()));
  const glass = meshes[6]; // panel, dado, floor, runner, lights, reveal, glass
  const hits = (origin: number[], direction: number[]) => new Raycaster(new Vector3(...origin), new Vector3(...direction), 0, 2).intersectObjects(meshes);
  const throughWindow = hits([-4.0, 0.95, -5.56], [-1, 0, 0]); // a little off the pane's centre, where its fan's triangles meet
  assert.equal(throughWindow.length, 1, `only the pane in the way: ${throughWindow.map((h) => meshes.indexOf(h.object as (typeof meshes)[number])).join(',')}`);
  assert.equal(throughWindow[0].object, glass);
  assert.ok(hits([-4.0, 1.17, -5.36], [-1, 0, 0]).length > 0, 'no crack in the ring outside the window');
  assert.ok(hits([-4.0, 0.98, -5.86], [-1, 0, 0]).length > 0, 'wall between the windows');
  assert.ok(hits([-3.4, 1.6, -7], [0, 1, 0]).length > 0, 'the crown must face the passenger');
  assert.ok(hits([-3.4, 1.0, -8.0], [0, 0, -1]).length > 0, 'the bulkhead faces the cabin');
  meshes.forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
});

test('study notes use the full image instead of a single blank texture pixel', () => {
  const uv = BUILT.studyNotes()[0].uv;
  assert.equal(Math.min(...uv), 0); assert.equal(Math.max(...uv), 1);
});

test('the aircraft wing has an upward-facing top skin that rises outboard, and an engine hung under it', () => {
  const [skin,, nacelle]=BUILT.aircraftWing();
  const mesh=new Mesh(new BufferGeometry().setAttribute('position',new Float32BufferAttribute(skin.pos,3)),new MeshBasicMaterial());
  const top=(x:number,z:number)=>new Raycaster(new Vector3(x,3,z),new Vector3(0,-1,0)).intersectObject(mesh)[0]?.point.y;
  const root=top(-7,-4.0), out=top(-14,-1.0);
  assert.ok(root!==undefined && root<0.5 && root>-0.3, `the wing sits under the window sill: ${root}`);
  assert.ok(out!==undefined && out>root+0.4, `dihedral: ${out} over ${root}`);
  assert.equal(top(-7,-8.5),undefined,'nothing ahead of the leading edge');
  let lo=Infinity; for(let i=1;i<nacelle.pos.length;i+=3) lo=Math.min(lo,nacelle.pos[i]);
  assert.ok(lo<-2,'the engine hangs below the wing');
  mesh.geometry.dispose(); mesh.material.dispose();
});

test('the auditorium has eight raised rows, sixteen steps per aisle and a rear landing', () => {
  const meshes = BUILT.lectureTiers().slice(0, 2).map((p) => new Mesh(new BufferGeometry().setAttribute('position', new Float32BufferAttribute(p.pos, 3)), new MeshBasicMaterial()));
  const height = (x: number, z: number) => new Raycaster(new Vector3(x, 5, z), new Vector3(0, -1, 0)).intersectObjects(meshes)[0]?.point.y;
  const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 0.001, `${actual} / ${expected}`);
  for (const row of LECTURE_ROWS) {
    for (const x of [2, 7]) near(height(x, row.seat), row.height);
    for (const x of [-0.7, 4.9, 10.5]) for (let half = 0; half < 2; half++) near(height(x, row.front + (half + 0.5) * (row.back - row.front) / 2), row.height - (1 - half) * 0.18);
  }
  near(height(4.9, -2.6), LECTURE_ROWS.at(-1)!.height);
  meshes.forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
});

test('the rear exit has a level landing across the entire door before its stairs', () => {
  const part = BUILT.halifaxReturn().at(-1)!;
  const mesh = new Mesh(new BufferGeometry().setAttribute('position', new Float32BufferAttribute(part.pos, 3)), new MeshBasicMaterial());
  for (const x of [-1.34, -0.8, -0.26]) {
    const hit = new Raycaster(new Vector3(x, 4, -1.6), new Vector3(0, -1, 0)).intersectObject(mesh)[0];
    assert.ok(Math.abs(hit.point.y - 1.08) < 0.001);
  }
  mesh.geometry.dispose(); mesh.material.dispose();
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

const PAINTS = ['window', 'whiteboard', 'banner', 'poster', 'jobsPoster', 'floqer', 'whiteboardFloqer', 'nameCard', 'screen', 'toronto', 'screenCode', 'screenFloqer', 'screenTerminal', 'windows', 'nightSky', 'badge', 'video', 'screenBoard', 'screenMap', 'cloudPuffs', 'facade', 'pitch', 'screenSlide', 'flightSign', 'halifaxSign', 'dalhousieSign', 'lectureBoard', 'studyNotes', 'studyScreen', 'campusPhoto', 'sydney', 'whiteboardBean', 'screenBeanApp', 'screenBeanCode', 'screenProductHunt', 'screenBeanPhone', 'beanPoster', 'beanSign', 'bannerWebSummit', 'boothFront', 'boothBack', 'screenTour', 'bannerAllIn', 'bannerElevate', 'boothMontreal', 'signVancouver', 'signToronto', 'signMontreal', 'signHalifax', 'whiteboardChurn', 'whiteboardCollect', 'certificateInvestNS', 'screenAllIn', 'crowd', 'logo', 'windowsDay']; // video: the live television
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
  for (const name of ['skyline', 'whiteboard', 'banner', 'teamPhoto', 'jobsPrint', 'nameCard', 'monitor', 'monitorApp', 'monitorBoard', 'laptop']) {
    const painted = BUILT[name]().find((p) => 'paint' in p.surface)!;
    const us = Array.from({ length: painted.uv.length / 2 }, (_, i) => painted.uv[i * 2]);
    const vs = Array.from({ length: painted.uv.length / 2 }, (_, i) => painted.uv[i * 2 + 1]);
    assert.equal(Math.min(...us), 0, name);
    assert.equal(Math.max(...us), 1, name);
    assert.equal(Math.min(...vs), 0, name);
    assert.equal(Math.max(...vs), 1, name);
  }
});
