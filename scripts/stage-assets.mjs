// Fetches every asset in the manifest from Poly Haven, optimises it, writes it under
// public/assets/stage/ and writes CREDITS.md. Idempotent: sources are cached in .cache/polyhaven,
// outputs are skipped when present. Run: npm run stage:assets
import { mkdir, writeFile, stat, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import sharp from 'sharp';

const { ASSETS, assetUrl } = await import('../src/lib/stage/assets.ts');
const CACHE = '.cache/polyhaven', OUT = 'public/assets/stage';
const api = async (p) => {
  const r = await fetch(`https://api.polyhaven.com${p}`);
  if (!r.ok) throw new Error(`${r.status} ${p}`);
  return r.json();
};

async function fetchTo(url, file) {
  if (existsSync(file)) return;
  await mkdir(path.dirname(file), { recursive: true });
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  await writeFile(file, Buffer.from(await r.arrayBuffer()));
}

const size = async (f) => (await stat(f)).size;
const credits = [];
const authors = {};
let total = 0;

for (const a of ASSETS) {
  const info = await api(`/info/${a.id}`);
  const author = Object.keys(info.authors ?? {})[0] ?? a.author;
  authors[a.id] = author;
  const files = await api(`/files/${a.id}`);
  const out = `public${assetUrl(a)}`;
  if (a.kind === 'model') {
    const g = files.gltf?.[a.res]?.gltf;
    if (!g) throw new Error(`${a.id}: no gltf at ${a.res} (has ${Object.keys(files.gltf ?? {}).join(', ') || 'no gltf at all'})`);
    const dir = `${CACHE}/${a.id}`;
    const src = `${dir}/${path.basename(g.url)}`;
    await fetchTo(g.url, src);
    for (const [rel, f] of Object.entries(g.include)) await fetchTo(f.url, `${dir}/${rel}`);
    if (!existsSync(out)) {
      await mkdir(path.dirname(out), { recursive: true });
      execFileSync('npx', ['--yes', '@gltf-transform/cli', 'optimize', src, out,
        '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', String(a.maxTex ?? 512),
        ...(a.simplify ? ['--simplify', 'true', '--simplify-error', String(a.simplify)] : ['--simplify', 'false']),
        '--instance', 'false', '--palette', 'false'], { stdio: 'inherit' });
    }
    total += await size(out);
  } else if (a.kind === 'hdri') {
    const url = files.hdri[a.res].hdr.url;
    const src = `${CACHE}/${a.id}/${path.basename(url)}`;
    await fetchTo(url, src);
    await mkdir(path.dirname(out), { recursive: true });
    if (!existsSync(out)) await copyFile(src, out);
    total += await size(out);
  } else {
    // three maps: colour, normal (gl), and arm (ao, roughness, metal packed in r, g, b)
    const maps = { diff: files.Diffuse, nor: files.nor_gl, arm: files.arm };
    await mkdir(path.dirname(out), { recursive: true });
    for (const [k, m] of Object.entries(maps)) {
      const url = m[a.res].jpg.url;
      const src = `${CACHE}/${a.id}/${path.basename(url)}`;
      await fetchTo(url, src);
      const dst = `${out}_${k}.webp`;
      if (!existsSync(dst)) await sharp(src).webp({ quality: k === 'diff' ? 82 : 90 }).toFile(dst);
      total += await size(dst);
    }
  }
  credits.push(`- \`${a.id}\` (${a.kind}) by ${author}, CC0, https://polyhaven.com/a/${a.id}. ${a.use}.`);
  console.log(a.id, '|', author, '|', a.use);
}
await writeFile(`${OUT}/CREDITS.md`, `# Stage assets\n\nAll from [Poly Haven](https://polyhaven.com), CC0. Optimised by scripts/stage-assets.mjs.\n\n${credits.join('\n')}\n`);
const wrong = ASSETS.filter((a) => a.author !== authors[a.id]).map((a) => `${a.id}: manifest says ${a.author}, site says ${authors[a.id]}`);
if (wrong.length) console.log('authors to fix in the manifest:\n  ' + wrong.join('\n  '));
console.log(`total ${(total / 1e6).toFixed(1)} MB`);
