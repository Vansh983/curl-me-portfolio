import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Sink, flatNormals } from '../../src/lib/stage/rig.ts';

test('box is 36 vertices, bone is 36, sphere is segsW*segsH*6, cylinder is segs*12', () => {
  assert.equal(new Sink().box(0, 0, 0, 1, 1, 1).out().length, 36 * 3);
  assert.equal(new Sink().bone([0, 0, 0], [0, 1, 0], 0.1, 0.1).out().length, 36 * 3);
  assert.equal(new Sink().sphere(0, 0, 0, 1, 1, 1, 8, 6).out().length, 8 * 6 * 6 * 3);
  assert.equal(new Sink().cylinder(0, 0, 0, 1, 1, 12).out().length, 12 * 12 * 3);
});

test('degenerate bone keeps its count and stays finite', () => {
  const p = new Sink().bone([1, 1, 1], [1, 1, 1], 0.05, 0.05).out();
  assert.equal(p.length, 36 * 3);
  assert.ok(Array.from(p).every(Number.isFinite));
});

test('box faces point outward', () => {
  const n = flatNormals(new Sink().box(0, 0, 0, 2, 2, 2).out());
  assert.deepEqual(Array.from(n.slice(0, 3)), [0, 0, 1]);
  assert.deepEqual(Array.from(n.slice(9, 12)), [0, 0, 1]);
});

test('every box and bone face normal points away from the centre', () => {
  for (const s of [new Sink().box(0, 0, 0, 2, 1, 3), new Sink().bone([0, 0, 0], [1, 2, 0.5], 0.2, 0.1)]) {
    const p = s.out(), n = flatNormals(p);
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < p.length; i += 3) { cx += p[i]; cy += p[i + 1]; cz += p[i + 2]; }
    cx /= 36; cy /= 36; cz /= 36;
    for (let i = 0; i < p.length; i += 9) {
      const dot = (p[i] - cx) * n[i] + (p[i + 1] - cy) * n[i + 1] + (p[i + 2] - cz) * n[i + 2];
      assert.ok(dot > 0, `face at ${i / 9} points inward`);
    }
  }
});

test('flatNormals are unit length or up for zero-area triangles', () => {
  const n = flatNormals(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
  assert.deepEqual(Array.from(n.slice(0, 3)), [0, 0, 1]);
  assert.deepEqual(Array.from(n.slice(9, 12)), [0, 1, 0]);
});

test('rotateY and translate move every vertex', () => {
  const s = new Sink().box(1, 0, 0, 0.2, 0.2, 0.2);
  s.rotateY(0, 0, Math.PI);
  s.translate(0, 5, 0);
  const p = s.out();
  let cx = 0, cy = 0;
  for (let i = 0; i < p.length; i += 3) { cx += p[i]; cy += p[i + 1]; }
  assert.ok(Math.abs(cx / 36 + 1) < 1e-6);
  assert.ok(Math.abs(cy / 36 - 5) < 1e-6);
});
