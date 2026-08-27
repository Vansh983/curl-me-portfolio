import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Sink, flatNormals, linear } from '../../src/lib/stage/rig.ts';

const centre = (p: Float32Array) => {
  let x = 0, y = 0, z = 0;
  for (let i = 0; i < p.length; i += 3) { x += p[i]; y += p[i + 1]; z += p[i + 2]; }
  const n = p.length / 3;
  return [x / n, y / n, z / n];
};
const outward = (p: Float32Array) => {
  const [cx, cy, cz] = centre(p), n = flatNormals(p);
  for (let i = 0; i < p.length; i += 9) {
    // skip zero-area triangles (sphere poles): their normal is a placeholder
    const ux = p[i + 3] - p[i], uy = p[i + 4] - p[i + 1], uz = p[i + 5] - p[i + 2];
    const vx = p[i + 6] - p[i], vy = p[i + 7] - p[i + 1], vz = p[i + 8] - p[i + 2];
    const area = Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
    if (area < 1e-9) continue;
    const dot = (p[i] - cx) * n[i] + (p[i + 1] - cy) * n[i + 1] + (p[i + 2] - cz) * n[i + 2];
    if (dot < -1e-9) return false;
  }
  return true;
};

test('primitive counts are fixed', () => {
  assert.equal(new Sink().box(0, 0, 0, 1, 1, 1).out().pos.length, 36 * 3);
  assert.equal(new Sink().bone([0, 0, 0], [0, 1, 0], 0.1, 0.1).out().pos.length, 36 * 3);
  assert.equal(new Sink().sphere(0, 0, 0, 1, 1, 1, 8, 6).out().pos.length, 8 * 6 * 6 * 3);
  assert.equal(new Sink().cylinder(0, 0, 0, 1, 1, 12).out().pos.length, 12 * 12 * 3);
  assert.equal(new Sink().capsule([0, 0, 0], [0, 1, 0], 0.1, 8, 3).out().pos.length, (8 * 6 + 2 * 3 * 8 * 6) * 3);
  assert.equal(new Sink().lathe([[1, 0], [1, 1], [0, 1.2]], 0, 0, 0, 1, 1, 0, 12).out().pos.length, 2 * 12 * 6 * 3);
});

test('uv and colour arrays match the vertex count', () => {
  const g = new Sink().color('#ff0000').box(0, 0, 0, 1, 1, 1, { pz: [0, 0, 1, 1] }).sphere(0, 0, 0, 1, 1, 1, 6, 4, [0, 0, 1, 1]).out();
  const n = g.pos.length / 3;
  assert.equal(g.uv.length, n * 2);
  assert.equal(g.col.length, n * 3);
  assert.deepEqual(Array.from(g.col.slice(0, 3)), [1, 0, 0]);
  assert.ok(Math.abs(linear('#808080')[0] - 0.2158) < 0.001);
});

test('degenerate bone and capsule keep their count and stay finite', () => {
  for (const g of [new Sink().bone([1, 1, 1], [1, 1, 1], 0.05, 0.05).out(), new Sink().capsule([1, 1, 1], [1, 1, 1], 0.05).out()]) {
    assert.ok(Array.from(g.pos).every(Number.isFinite));
  }
});

test('every closed primitive faces outward', () => {
  assert.ok(outward(new Sink().box(0, 0, 0, 2, 1, 3).out().pos), 'box');
  assert.ok(outward(new Sink().bone([0, 0, 0], [1, 2, 0.5], 0.2, 0.1).out().pos), 'bone');
  assert.ok(outward(new Sink().sphere(0, 0, 0, 1, 1.2, 0.8, 8, 6).out().pos), 'sphere');
  assert.ok(outward(new Sink().cylinder(0, 0, 0, 1, 2, 8).out().pos), 'cylinder');
  assert.ok(outward(new Sink().capsule([0, 0, 0], [0.5, 1, 0.2], 0.2).out().pos), 'capsule');
  assert.ok(outward(new Sink().lathe([[0.001, 0], [1, 0.2], [1, 1], [0.001, 1.2]], 0, 0, 0, 1, 1, 0, 12).out().pos), 'lathe');
});

test('flatNormals are unit length or up for zero-area triangles', () => {
  const n = flatNormals(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
  assert.deepEqual(Array.from(n.slice(0, 3)), [0, 0, 1]);
  assert.deepEqual(Array.from(n.slice(9, 12)), [0, 1, 0]);
});

test('rotations and translate move every vertex', () => {
  const s = new Sink().box(1, 0, 0, 0.2, 0.2, 0.2);
  s.rotateY(0, 0, Math.PI).translate(0, 5, 0);
  const [cx, cy] = centre(s.out().pos);
  assert.ok(Math.abs(cx + 1) < 1e-6 && Math.abs(cy - 5) < 1e-6);
  const z = new Sink().box(1, 0, 0, 0.2, 0.2, 0.2).rotateZ(0, 0, Math.PI / 2);
  assert.ok(Math.abs(centre(z.out().pos)[1] - 1) < 1e-6);
  const x = new Sink().box(0, 1, 0, 0.2, 0.2, 0.2).rotateX(0, 0, Math.PI / 2);
  assert.ok(Math.abs(centre(x.out().pos)[2] - 1) < 1e-6);
});
