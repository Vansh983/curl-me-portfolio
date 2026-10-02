// Fetches every asset in the manifest from Poly Haven, optimises it, writes it under
// public/assets/stage/ and writes CREDITS.md. Idempotent: sources are cached in .cache/polyhaven,
// outputs are skipped when present. Run: npm run stage:assets
import { mkdir, writeFile, stat, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
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

/** Keeps only the named animation clips, so a rigged character does not ship forty it never plays. */
async function keepAnims(src, dst, names) {
  const io = new NodeIO();
  const doc = await io.read(src);
  for (const anim of doc.getRoot().listAnimations()) if (!names.includes(anim.getName())) anim.dispose();
  await io.write(dst, doc);
}

for (const a of ASSETS) {
  const out = `public${assetUrl(a)}`;
  if (a.source === 'local') {
    if (!existsSync(out)) throw new Error(`${a.id}: run node scripts/stage-flight-assets.mjs first`);
    authors[a.id] = a.author; total += await size(out);
    credits.push(`- \`${a.id}\` (${a.kind}), ${a.author}. ${a.use}. See [flight credits](./FLIGHT-CREDITS.md).`);
    continue;
  }
  if (a.source === 'url' || a.source === 'blenderkit' || a.source === 'sketchfab') {
    authors[a.id] = a.author;
    const dir = `${CACHE}/${a.id}`;
    let src = `${dir}/${a.id}.glb`;
    if (a.source === 'blenderkit') {
      // a free asset: the download endpoint answers with a signed file url, no account needed
      if (!existsSync(src)) {
        const r = await fetch(`https://www.blenderkit.com/api/v1/downloads/${a.bk}/?scene_uuid=${crypto.randomUUID()}`);
        if (!r.ok) throw new Error(`${r.status} blenderkit ${a.id}`);
        const { filePath } = await r.json();
        await fetchTo(filePath, src);
      }
    } else if (a.source === 'sketchfab') { if (!existsSync(src)) throw new Error(`${a.id}: download the glTF from ${a.url} with a Sketchfab account and save it as ${src}`); }
    else await fetchTo(a.url, src);
    if (a.anims) { const trimmed = `${dir}/${a.id}.anims.glb`; await keepAnims(src, trimmed, a.anims); src = trimmed; }
    if (a.drop) { const cut = `${dir}/${a.id}.cut.glb`; execFileSync('node', ['scripts/gltf-drop.mjs', src, cut, ...a.drop], { stdio: 'inherit' }); src = cut; }
    if (!existsSync(out)) {
      await mkdir(path.dirname(out), { recursive: true });
      execFileSync('npx', ['gltf-transform', 'optimize', src, out,
        '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', String(a.maxTex ?? 512),
        ...(a.simplify ? ['--simplify', 'true', '--simplify-error', String(a.simplify)] : ['--simplify', 'false']),
        '--instance', 'false', '--palette', 'false', '--join', 'false', '--flatten', 'false'], { stdio: 'inherit' });
    }
    total += await size(out);
    credits.push(`- \`${a.id}\` (${a.kind}) by ${a.author}, ${a.licence}, ${a.url ?? `https://www.blenderkit.com/api/v1/downloads/${a.bk}/`}. ${a.use}.`);
    console.log(a.id, '|', a.author, '|', a.use);
    continue;
  }
  const info = await api(`/info/${a.id}`);
  const author = Object.keys(info.authors ?? {})[0] ?? a.author;
  authors[a.id] = author;
  const files = await api(`/files/${a.id}`);
  if (a.kind === 'model') {
    const g = files.gltf?.[a.res]?.gltf;
    if (!g) throw new Error(`${a.id}: no gltf at ${a.res} (has ${Object.keys(files.gltf ?? {}).join(', ') || 'no gltf at all'})`);
    const dir = `${CACHE}/${a.id}`;
    const src = `${dir}/${path.basename(g.url)}`;
    await fetchTo(g.url, src);
    for (const [rel, f] of Object.entries(g.include)) await fetchTo(f.url, `${dir}/${rel}`);
    if (!existsSync(out)) {
      await mkdir(path.dirname(out), { recursive: true });
      execFileSync('npx', ['gltf-transform', 'optimize', src, out,
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
    // up to three maps: colour, normal (gl), and arm (ao, roughness, metal packed in r, g, b), resized to maxTex
    const maps = { diff: files.Diffuse, nor: files.nor_gl, arm: files.arm };
    await mkdir(path.dirname(out), { recursive: true });
    for (const k of a.maps ?? ['diff', 'nor', 'arm']) {
      const m = maps[k];
      if (!m) throw new Error(`${a.id}: no ${k} map`);
      const url = m[a.res].jpg.url;
      const src = `${CACHE}/${a.id}/${path.basename(url)}`;
      await fetchTo(url, src);
      const dst = `${out}_${k}.webp`;
      if (!existsSync(dst)) await sharp(src).resize(a.maxTex, a.maxTex).webp({ quality: k === 'diff' ? 82 : 88 }).toFile(dst);
      total += await size(dst);
    }
  }
  credits.push(`- \`${a.id}\` (${a.kind}) by ${author}, CC0, https://polyhaven.com/a/${a.id}. ${a.use}.`);
  console.log(a.id, '|', author, '|', a.use);
}
await writeFile(`${OUT}/CREDITS.md`, `# Stage assets\n\nModels and textures from [Poly Haven](https://polyhaven.com) (CC0), free models from [BlenderKit](https://www.blenderkit.com) (royalty free), and one from [Sketchfab](https://sketchfab.com) (CC BY 4.0, downloaded with an account). Optimised by scripts/stage-assets.mjs.\n\n${credits.join('\n')}\n\nThe skies over the tour's walk are three of Poly Haven's pure skies (CC0), cut and compressed by scripts/stage-sky.mjs into \`sky/\`: \`vancouver\` is Kloofendal 48d Partly Cloudy by Greg Zaal and Jarod Guest (https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky), \`toronto\` is Kloppenheim 06 by Greg Zaal and Jarod Guest (https://polyhaven.com/a/kloppenheim_06_puresky), \`halifax\` is Qwantani Dusk 2 by Greg Zaal and Jarod Guest (https://polyhaven.com/a/qwantani_dusk_2_puresky).\n\nThe Toronto skyline out of the condo window and across the harbour from the walk, and Halifax under the aircraft and on its hill beside the walk, are built from [OpenStreetMap](https://www.openstreetmap.org/copyright) data, © OpenStreetMap contributors, ODbL (scripts/stage-city.mjs, scripts/stage-halifax.mjs).\n\n\`bean-logo.png\` is the Bean logo from [beanmeals.com](https://www.beanmeals.com), the company the site's author co-founded, used on the Sydney set's sign, whiteboard and screens.\n\n\nThe poster in the 2010 bedroom carries the text of Apple's 1997 "Think different" campaign (\"Here's to the crazy ones\"), © Apple Inc., painted at runtime (src/scripts/stage-paint.ts); the portrait is \`assets/scenes/jobs.jpg\`.\n\nThe photographs in \`photos/\` are the author's own: Elevate and Demo Day from his LinkedIn posts, the Google trip of June 2019 (\`google-award.jpg\`, \`google-sign.jpg\`) from his own files. The slide on Volta's wall (\`collect/slide.webp\`) is put together from Collect.'s own banner and wordmark (https://luma.com/7fw81j31, https://collecthalifax.org; the author is one of its hosts) and Socratica's mark and name (https://www.socratica.info), by scripts/look/collect.mjs. The people in the hall (\`crowd/\`) are rendered from Microsoft Rocketbox avatars and their motion clips (https://github.com/microsoft/Microsoft-Rocketbox), MIT License, Copyright (c) 2020 Microsoft, by scripts/stage-crowd.mjs; the gowns and hoods are made in that script. Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`);
const wrong = ASSETS.filter((a) => a.author !== authors[a.id]).map((a) => `${a.id}: manifest says ${a.author}, site says ${authors[a.id]}`);
if (wrong.length) console.log('authors to fix in the manifest:\n  ' + wrong.join('\n  '));
console.log(`total ${(total / 1e6).toFixed(1)} MB`);
