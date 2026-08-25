import { test } from 'node:test';
import assert from 'node:assert/strict';
import { figure, KEY_DEFAULT, STROKE_IDS, type FigureParams } from '../src/lib/figure.ts';

const sig = (d: string) => d.replace(/-?\d+(\.\d+)?/g, '#');

const KID: FigureParams = {
  ...KEY_DEFAULT,
  height: 0.55,
  headRatio: 0.24,
  shoulder: 0.1,
  hairTop: 0.8,
  glasses: 0,
  beard: 0,
  prop: { ...KEY_DEFAULT.prop, show: 1, w: 0.22, h: 0.14, stem: 0 },
};
const FOUNDER: FigureParams = {
  ...KEY_DEFAULT,
  height: 1,
  headRatio: 0.16,
  shoulder: 0.14,
  hairTop: 0.4,
  glasses: 1,
  beard: 0.6,
  lean: 0.3,
  armR: { shoulder: 70, elbow: -60 },
};

test('same ids, same order, same command signature at every age', () => {
  const a = figure(KID);
  const b = figure(FOUNDER);
  assert.deepEqual(a.map((s) => s.id), [...STROKE_IDS]);
  assert.deepEqual(b.map((s) => s.id), [...STROKE_IDS]);
  for (let i = 0; i < a.length; i++) assert.equal(sig(a[i].d), sig(b[i].d), a[i].id);
});

test('every number is finite and every opacity is in [0,1]', () => {
  for (const s of figure(FOUNDER)) {
    for (const n of s.d.match(/-?\d+(\.\d+)?/g) ?? []) assert.ok(Number.isFinite(Number(n)), s.id);
    assert.ok(s.opacity >= 0 && s.opacity <= 1, s.id);
  }
});

test('out of range params are clamped, not thrown', () => {
  const wild = { ...FOUNDER, height: 9, glasses: -3, face: { smile: 5, browL: -9, browR: 9, eyeOpen: 2 } };
  assert.doesNotThrow(() => figure(wild));
  const top = Math.min(...figure(wild).flatMap((s) => (s.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)));
  assert.ok(top >= -520, 'height clamps to 1 so nothing is above 480 plus hair');
});

test('the figure grows with height and the head shrinks with headRatio', () => {
  const head = (p: FigureParams) => figure(p).find((s) => s.id === 'head')!.d;
  const r = (d: string) => Number(d.match(/A (-?\d+(?:\.\d+)?)/)![1]);
  assert.ok(r(head(KID)) > r(head({ ...KID, headRatio: 0.16 })));
  assert.ok(r(head(FOUNDER)) < r(head({ ...FOUNDER, height: 0.6, headRatio: 0.3 })));
});

test('deterministic', () => {
  assert.deepEqual(figure(KID), figure(KID));
});
