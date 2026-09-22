import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { deliveryManifest } from '../../scripts/stage-delivery.mjs';
import { SETS } from '../../src/lib/stage/sets.ts';

test('cacheable model and image URLs carry their exact content hash', () => {
  const files = deliveryManifest(fileURLToPath(new URL('../../public', import.meta.url)));
  assert.ok(files.some((file) => file.path.endsWith('/baked/set0.glb')));
  assert.equal(new Set(files.map((file) => file.versioned)).size, files.length);
  for (const file of files) {
    assert.ok(file.versioned.includes(createHash('sha256').update(file.content).digest('hex').slice(0, 16)));
    assert.ok(file.versioned.startsWith('/assets/versioned/'));
  }
});

test('optional room panoramas are declared exactly when present', () => {
  SETS.forEach((set, i) => assert.equal(!!set.bakedEnvironment, existsSync(new URL(`../../public/assets/stage/baked/set${i}_env.webp`, import.meta.url)), set.id));
});
