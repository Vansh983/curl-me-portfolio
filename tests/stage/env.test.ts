import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENVS, blendEnv, envAt, mixHex } from '../../src/lib/stage/env.ts';
import { STATIONS } from '../../src/lib/stage/world.ts';

test('there is one light for each station, and all of it is finite', () => {
  assert.equal(ENVS.length, STATIONS.length);
  for (const e of ENVS) {
    assert.equal(e.panels.length, 4);
    assert.equal(e.fills.length, 2);
    assert.ok(e.exposure > 0 && e.exposure < 3);
    assert.ok(e.fog.far > e.fog.near);
    for (const c of [e.dome, e.hemi.sky, e.hemi.ground, e.sun.color, e.fog.color]) assert.match(c, /^#[0-9a-f]{6}$/i);
    for (const p of e.panels) assert.ok(p.power > 0 && p.size.every((v) => v > 0));
  }
});

test('a blend lands exactly on its ends', () => {
  const [a, b] = ENVS;
  assert.deepEqual(blendEnv(a, b, 0).sun.from, a.sun.from);
  assert.deepEqual(blendEnv(a, b, 1).sun.from, b.sun.from);
  assert.equal(blendEnv(a, b, 0).exposure, a.exposure);
  assert.equal(blendEnv(a, b, 1).panels[0].power, b.panels[0].power);
});

test('mixHex goes through linear light: the halfway point is brighter than the average byte', () => {
  assert.equal(mixHex('#000000', '#ffffff', 0), '#000000');
  assert.equal(mixHex('#000000', '#ffffff', 1), '#ffffff');
  const mid = parseInt(mixHex('#000000', '#ffffff', 0.5).slice(1, 3), 16);
  assert.ok(mid > 140 && mid < 200, `${mid}`);
});

test('nothing in the light jumps between two stations', () => {
  let prev = envAt(0, 0);
  for (let k = 1; k <= 40; k++) {
    const t = k / 40;
    const now = envAt(0, t);
    assert.ok(Math.abs(now.exposure - prev.exposure) < 0.05);
    assert.ok(Math.abs(now.sun.power - prev.sun.power) < 0.2);
    assert.ok(Math.abs(now.panels[1].power - prev.panels[1].power) < 1.5);
    prev = now;
  }
});

test('the last station holds: past it, the light stops moving', () => {
  const last = ENVS.length - 1;
  assert.equal(envAt(last, 0.5), ENVS[last]);
  assert.equal(envAt(last + 3, 0.9), ENVS[last]);
});
