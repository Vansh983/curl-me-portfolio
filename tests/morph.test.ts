import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pairSvgs, applyPlan } from '../src/lib/morph.ts';

const A = `<svg><rect x="0" y="0" width="10" height="10" fill="#000000"/><path d="M 0 0 L 10 10 Z" fill="#ff0000" opacity="0"/><text x="1" y="2" text-anchor="end">hi</text></svg>`;
const B = `<svg><rect x="20" y="0" width="10" height="30" fill="#ffffff"/><path d="M 5 5 L 30 10 Z" fill="#00ff00" opacity="1"/><text x="9" y="2" text-anchor="start">yo</text></svg>`;

test('pairs matching structures and records only what changes', () => {
  const plan = pairSvgs(A, B)!;
  assert.equal(plan.count, 3);
  assert.deepEqual(plan.els[0].n, { x: [0, 20], height: [10, 30] });
  assert.deepEqual(plan.els[0].c, { fill: [[0, 0, 0], [255, 255, 255]] });
  assert.deepEqual(plan.els[1].d, { tpl: 'M # # L # # Z', a: [0, 0, 10, 10], b: [5, 5, 30, 10] });
  assert.deepEqual(plan.els[2].s, { 'text-anchor': ['end', 'start'] });
  assert.deepEqual(plan.els[2].t, ['hi', 'yo']);
});

test('refuses mismatched structures', () => {
  assert.equal(pairSvgs(A, `<svg><rect/><rect/><text>x</text></svg>`), null);
  assert.equal(pairSvgs(A, A.replace('L 10 10', 'C 1 1 2 2 10 10')), null);
});

test('applies at t', () => {
  const plan = pairSvgs(A, B)!;
  const mk = () => {
    const attrs: Record<string, string> = {};
    return { attrs, textContent: '', setAttribute: (k: string, v: string) => (attrs[k] = v), removeAttribute: (k: string) => delete attrs[k] } as unknown as Element & { attrs: Record<string, string> };
  };
  const els = [mk(), mk(), mk()];
  applyPlan(els, plan, 0.5);
  assert.equal(els[0].attrs.x, '10');
  assert.equal(els[0].attrs.fill, 'rgb(128,128,128)');
  assert.equal(els[1].attrs.d, 'M 2.5 2.5 L 20 10 Z');
  assert.equal(els[1].attrs.opacity, '0.5');
  assert.equal(els[2].attrs['text-anchor'], 'start');
  assert.equal(els[2].textContent, 'yo');
});

test('the authored morph pairs line up', () => {
  const read = (n: string) => readFileSync(new URL(`../src/lib/scenes/${n}.svg`, import.meta.url), 'utf8');
  for (const [a, b] of [['k-kid', 'lab-kid'], ['k-tv', 'lab-monitor'], ['k-room', 'lab-room'], ['k-fan', 'k-fan']]) {
    assert.ok(pairSvgs(read(a), read(b)), `${a} -> ${b}`);
  }
});
