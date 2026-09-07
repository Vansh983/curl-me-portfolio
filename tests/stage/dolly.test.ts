import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOLLY, makeDolly } from '../../src/lib/stage/dolly.ts';

test('keys are ordered in q from 0 to 1 and land on the four sets', () => {
  assert.equal(DOLLY[0].q, 0);
  assert.equal(DOLLY[DOLLY.length - 1].q, 1);
  for (let k = 1; k < DOLLY.length; k++) assert.ok(DOLLY[k].q > DOLLY[k - 1].q);
  assert.deepEqual([...new Set(DOLLY.map((k) => k.set))], [0, 1, 2, 3]);
});

test('blend windows come in pairs, 0 then 1, and the set flips inside them', () => {
  const dolly = makeDolly(DOLLY);
  const zeros = DOLLY.filter((k) => k.blend === 0), ones = DOLLY.filter((k) => k.blend === 1);
  assert.equal(zeros.length, 4);
  assert.equal(ones.length, 4);
  for (let w = 0; w < 3; w++) {
    const a = zeros[w], b = ones[w];
    assert.ok(b.q > a.q);
    const mid = (a.q + b.q) / 2;
    assert.equal(dolly(a.q + 1e-6).set, a.set);
    assert.equal(dolly(mid + 1e-6).set, b.set);
    assert.ok(dolly(mid).envDip < 0.2);
    assert.equal(dolly(a.q - 0.01).envDip, 1);
    for (const q of [a.q + 1e-6, mid, b.q - 1e-6]) {
      assert.equal(dolly(q).from, a.set);
      assert.equal(dolly(q).into, b.set);
    }
    const outside = dolly(a.q - 0.01);
    assert.equal(outside.from, outside.set);
    assert.equal(outside.into, outside.set);
  }
});

test('the camera never jumps: 1/1000 steps move under 0.06 m and turn under 2 degrees', () => {
  const dolly = makeDolly(DOLLY);
  const dir = (f: { cam: number[]; look: number[] }) => {
    const v = [f.look[0] - f.cam[0], f.look[1] - f.cam[1], f.look[2] - f.cam[2]];
    const n = Math.hypot(...v);
    return v.map((x) => x / n);
  };
  let prev = dolly(0);
  for (let i = 1; i <= 1000; i++) {
    const f = dolly(i / 1000);
    const d = Math.hypot(f.cam[0] - prev.cam[0], f.cam[1] - prev.cam[1], f.cam[2] - prev.cam[2]);
    const a = dir(prev), b = dir(f);
    const deg = (Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])) * 180) / Math.PI;
    assert.ok(d < 0.06, `cam step ${d} at ${i}`);
    assert.ok(deg < 2, `turn ${deg} degrees at ${i}`);
    assert.ok(f.fov >= 55 && f.fov <= 80, `fov ${f.fov}`); // the horizontal field: a laptop shows the room
    prev = f;
  }
});

test('the dolly is inside the doorway when it says it is', () => {
  const dolly = makeDolly(DOLLY);
  // the ring: north out of the apartment, east out of the 2010 room, south out of the lab, west back in
  const e = dolly(0.22);
  assert.ok(Math.abs(e.cam[0] + 5.45) < 0.05 && Math.abs(e.cam[2] - 2.3) < 0.1, `${e.cam}`);
  const f = dolly(0.513);
  assert.ok(Math.abs(f.cam[0] + 4.85) < 0.05 && Math.abs(f.cam[2] - 6.6) < 0.1, `${f.cam}`);
  const g = dolly(0.76);
  assert.ok(Math.abs(g.cam[0] - 1.4) < 0.05 && Math.abs(g.cam[2] - 4.75) < 0.1, `${g.cam}`);
  const h = dolly(0.97);
  assert.ok(Math.abs(h.cam[0] + 2.3) < 0.05 && Math.abs(h.cam[2] - 1.6) < 0.1, `${h.cam}`);
  assert.equal(dolly(1).set, 0);
});
