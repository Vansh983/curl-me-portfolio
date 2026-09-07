// The whole bake for one set: export from the running stage, light and bake in Blender, compress.
// Writes public/assets/stage/baked/set<i>.glb and set<i>_lm.webp. Run: node scripts/stage-bake.mjs <set> [samples] [size]
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import sharp from 'sharp';
const set = process.argv[2] ?? '0', samples = process.argv[3] ?? '256', size = process.argv[4] ?? '2048';
const blender = '/Applications/Blender.app/Contents/MacOS/Blender';
const out = 'public/assets/stage/baked';
mkdirSync(out, { recursive: true });
execFileSync('node', ['scripts/stage-export.mjs', set], { stdio: 'inherit' });
execFileSync(blender, ['-b', '-P', 'scripts/stage-bake.py', '--', set, samples, size, '1'], { stdio: 'inherit' });
execFileSync('npx', ['gltf-transform', 'optimize', `.cache/bake/set${set}_baked.glb`, `${out}/set${set}.glb`,
  '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '512', '--simplify', 'true', '--simplify-error', '0.002', '--instance', 'false', '--palette', 'false', '--join', 'false', '--flatten', 'false',
  '--prune-attributes', 'false'], { stdio: 'inherit' }); // the lightmap uv (TEXCOORD_1) has no texture in the file: keep it
await sharp(`.cache/bake/set${set}_lm.png`).webp({ quality: 88 }).toFile(`${out}/set${set}_lm.webp`);
const kb = (f) => (statSync(f).size / 1024).toFixed(0);
console.log(`set ${set}: ${kb(`${out}/set${set}.glb`)} KB glb, ${kb(`${out}/set${set}_lm.webp`)} KB lightmap`);
