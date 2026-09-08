// The whole bake for one set: export from the running stage, light and bake in Blender, compress.
// Writes public/assets/stage/baked/set<i>.glb and set<i>_lm.webp. Run: node scripts/stage-bake.mjs <set> [samples] [size] [tex] [simplify-error]
// tex: the props' own textures in the set file, 512 by default; the apartment (set 0) takes 384 to stay under 5 MB, the lightmap carries the light.
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import sharp from 'sharp';
const set = process.argv[2] ?? '0', samples = process.argv[3] ?? '256', size = process.argv[4] ?? '2048', tex = process.argv[5] ?? (set === '0' ? '384' : '512');
const simplify = Number(process.argv[6] ?? '0.002'); // 0 preserves close-up window curves and thin furniture hardware
const blender = '/Applications/Blender.app/Contents/MacOS/Blender';
const out = 'public/assets/stage/baked';
mkdirSync(out, { recursive: true });
execFileSync('node', ['scripts/stage-export.mjs', set], { stdio: 'inherit' });
execFileSync(blender, ['-b', '-P', 'scripts/stage-bake.py', '--', set, samples, size, '1'], { stdio: 'inherit' });
execFileSync('npx', ['gltf-transform', 'optimize', `.cache/bake/set${set}_baked.glb`, `${out}/set${set}.glb`,
  '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', tex, '--simplify', String(simplify > 0), '--simplify-error', String(simplify), '--instance', 'false', '--palette', 'false', '--join', 'false', '--flatten', 'false',
  '--prune-attributes', 'false'], { stdio: 'inherit' }); // the lightmap uv (TEXCOORD_1) has no texture in the file: keep it
await sharp(`.cache/bake/set${set}_lm.png`).webp({ quality: 88 }).toFile(`${out}/set${set}_lm.webp`);
const kb = (f) => (statSync(f).size / 1024).toFixed(0);
console.log(`set ${set}: ${kb(`${out}/set${set}.glb`)} KB glb, ${kb(`${out}/set${set}_lm.webp`)} KB lightmap`);
