import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { ASSETS, assetUrl } from '../../src/lib/stage/assets.ts';

test('every asset is named once, credited, and CC0', () => {
  const ids = new Set<string>();
  for (const a of ASSETS) {
    assert.ok(!ids.has(a.id), `${a.id} twice`);
    ids.add(a.id);
    assert.equal(a.licence, 'CC0');
    assert.ok(a.author.length > 1, `${a.id} author`);
    assert.ok(a.use.length > 3, `${a.id} use`);
    assert.match(a.id, /^[a-z0-9_]+$/i);
  }
});

test('urls are under /assets/stage and follow the kind', () => {
  for (const a of ASSETS) {
    const u = assetUrl(a);
    assert.ok(u.startsWith('/assets/stage/'), u);
    if (a.kind === 'model') assert.ok(u.endsWith('.glb'));
    if (a.kind === 'hdri') assert.ok(u.endsWith(`_${a.res}.hdr`));
    if (a.kind === 'texture') assert.ok(u.endsWith(`/tex/${a.id}`));
  }
});

test('the built files exist once the fetch has run', { skip: !existsSync('public/assets/stage/CREDITS.md') }, () => {
  for (const a of ASSETS) {
    const u = assetUrl(a);
    const files = a.kind === 'texture' ? ['_diff.webp', '_nor.webp', '_arm.webp'].map((s) => `public${u}${s}`) : [`public${u}`];
    for (const f of files) assert.ok(existsSync(f), f);
  }
});
