import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { ASSETS, assetUrl } from '../../src/lib/stage/assets.ts';

test('every asset is named once, credited, licensed, and capped at 512 px (1k for a floor)', () => {
  const ids = new Set<string>();
  for (const a of ASSETS) {
    assert.ok(!ids.has(a.id), `${a.id} twice`);
    ids.add(a.id);
    assert.ok(a.licence === 'CC0' || a.licence === 'CC-BY-3.0', `${a.id} licence`);
    if (a.source === 'url') assert.match(a.url ?? '', /^https:\/\/.+\.glb$/, `${a.id} url`);
    assert.ok(a.author.length > 1, `${a.id} author`);
    assert.ok(a.use.length > 3, `${a.id} use`);
    assert.match(a.id, /^[a-z0-9_]+$/i);
    assert.ok(a.maxTex <= (a.kind === 'texture' ? 1024 : 512), `${a.id} maxTex`);
    if (a.kind === 'texture') assert.ok((a.maps?.length ?? 0) > 0 && (a.size ?? 0) > 0, `${a.id} maps and size`);
  }
});

test('urls are under /assets/stage; models end in .glb, textures are a stem for their maps', () => {
  for (const a of ASSETS) {
    const u = assetUrl(a);
    assert.ok(u.startsWith('/assets/stage/'), u);
    if (a.kind === 'model') assert.ok(u.endsWith('.glb'));
    else assert.ok(u.startsWith('/assets/stage/tex/') && !u.includes('.'), u);
  }
});

test('the built files exist and the whole set stays under 5.5 MB', { skip: !existsSync('public/assets/stage/CREDITS.md') }, () => {
  let total = 0;
  for (const a of ASSETS) {
    const files = a.kind === 'model' ? [`public${assetUrl(a)}`] : (a.maps ?? []).map((m) => `public${assetUrl(a)}_${m}.webp`);
    for (const f of files) {
      assert.ok(existsSync(f), f);
      total += statSync(f).size;
    }
  }
  assert.ok(total < 5.5e6, `${(total / 1e6).toFixed(2)} MB`);
});
