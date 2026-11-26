// Licensed photographic sky and authored Blender campus. No model account/service.
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
const cache = '.cache/flight', id = 'kloofendal_48d_partly_cloudy_puresky';
await mkdir(cache, { recursive: true });
const original = `${cache}/sky.jpg`;
if (!existsSync(original)) {
  const meta = await fetch(`https://api.polyhaven.com/files/${id}`);
  if (!meta.ok) throw new Error(`sky metadata: ${meta.status}`);
  const files = await meta.json(), source = await fetch(files.tonemapped.url);
  if (!source.ok) throw new Error(`sky download: ${source.status}`);
  await writeFile(original, Buffer.from(await source.arrayBuffer()));
}
await sharp(original).resize(4096, 2048).webp({ quality: 90 }).toFile('public/assets/stage/flight-sky.webp');
execFileSync('/Applications/Blender.app/Contents/MacOS/Blender', ['-b', '-P', 'scripts/stage-flight-campus.py'], { stdio: 'inherit' });
execFileSync('npx', ['gltf-transform', 'optimize', `${cache}/campus.glb`, 'public/assets/stage/dalhousie_campus.glb', '--compress', 'meshopt', '--simplify', 'false', '--texture-compress', 'webp', '--texture-size', '512'], { stdio: 'inherit' });
