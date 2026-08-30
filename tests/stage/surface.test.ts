import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SURFACE, heightField, packDetail, value, fbm, type Kind } from '../../src/lib/stage/surface.ts';

const KINDS: Kind[] = ['smooth', 'orange', 'plaster', 'grain', 'plank', 'weave', 'pile', 'brushed', 'speckle', 'pores', 'strand', 'pebble', 'leaf', 'ripple'];
const N = 64;

test('every height field is the right size and stays inside 0..1', () => {
  for (const kind of KINDS) {
    const h = heightField(kind, N);
    assert.equal(h.length, N * N, kind);
    for (const v of h) {
      assert.ok(Number.isFinite(v), kind);
      assert.ok(v >= 0 && v <= 1, `${kind} ${v}`);
    }
  }
});

test('the noise wraps, so a tile has no seam', () => {
  // the step from the last column back to the first must be no worse than a step inside the tile
  const h = value(N, 8, 5);
  let inside = 0;
  for (let y = 0; y < N; y++) for (let x = 1; x < N; x++) inside = Math.max(inside, Math.abs(h[y * N + x] - h[y * N + x - 1]));
  let seam = 0;
  for (let y = 0; y < N; y++) seam = Math.max(seam, Math.abs(h[y * N] - h[y * N + N - 1]));
  assert.ok(seam <= inside * 1.5, `seam ${seam} vs inside ${inside}`);
});

test('a stretched lattice runs its grain one way only', () => {
  // few cells across x, many down y: neighbours along x are close, neighbours along y are not
  const h = value(N, 32, 9, 0.03, 1);
  let dx = 0, dy = 0;
  for (let y = 1; y < N; y++) {
    for (let x = 1; x < N; x++) {
      dx += Math.abs(h[y * N + x] - h[y * N + x - 1]);
      dy += Math.abs(h[y * N + x] - h[(y - 1) * N + x]);
    }
  }
  assert.ok(dy > dx * 4, `${dy} should be far above ${dx}`);
});

test('fbm keeps its octaves inside the range', () => {
  const h = fbm(N, 4, 3, 4);
  assert.ok(Math.min(...h) >= 0 && Math.max(...h) <= 1);
});

test('the packed map is a normal plus the height, and every normal points out', () => {
  const h = heightField('plank', N);
  const m = packDetail(h, N, 1);
  assert.equal(m.length, N * N * 4);
  for (let i = 0; i < m.length; i += 4) {
    assert.ok(m[i + 2] > 128, 'z must be positive: a detail normal never points into the surface');
    const nx = (m[i] / 255) * 2 - 1, ny = (m[i + 1] / 255) * 2 - 1, nz = (m[i + 2] / 255) * 2 - 1;
    assert.ok(Math.abs(Math.hypot(nx, ny, nz) - 1) < 0.02, 'unit length');
    assert.ok(Math.abs(m[i + 3] / 255 - h[i / 4]) < 0.01, 'alpha carries the height');
  }
});

test('a flat field gives a flat map', () => {
  const m = packDetail(heightField('smooth', N), N, 1);
  for (let i = 0; i < m.length; i += 4) {
    assert.equal(m[i], 128);
    assert.equal(m[i + 1], 128);
    assert.equal(m[i + 2], 255);
  }
});

test('strength scales the tilt and nothing else', () => {
  const h = heightField('pebble', N);
  const soft = packDetail(h, N, 0.2);
  const hard = packDetail(h, N, 1);
  let softTilt = 0, hardTilt = 0;
  for (let i = 0; i < soft.length; i += 4) {
    softTilt += Math.abs(soft[i] - 128);
    hardTilt += Math.abs(hard[i] - 128);
  }
  assert.ok(hardTilt > softTilt * 2);
});

test('every surface is a real material', () => {
  for (const [name, s] of Object.entries(SURFACE)) {
    assert.ok(KINDS.includes(s.kind), `${name} kind`);
    assert.ok(s.rough > 0 && s.rough <= 1, `${name} rough`);
    assert.ok(s.metal >= 0 && s.metal <= 1, `${name} metal`);
    assert.ok(s.tile > 0.01 && s.tile < 10, `${name} tile`);
    assert.ok(s.bump >= 0 && s.bump <= 1, `${name} bump`);
    assert.ok(s.env > 0 && s.env <= 2, `${name} env`);
  }
});
