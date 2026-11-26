// The tour's skies: three of Poly Haven's pure skies (CC0), one a city, cut to the part a walk ever sees and written
// as webp under public/assets/stage/sky/. The source is the site's tone mapped 8k jpg (cached in .cache/sky); the
// output keeps the dome from the zenith to a little under the horizon, 4096 px round. Prints where the sun stands in
// each and the colour of its horizon, which sets.ts carries by hand. Run: npm run stage:sky
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import sharp from 'sharp';

const CACHE = '.cache/sky', OUT = 'public/assets/stage/sky';
/** The share of the panorama kept, from the top: the horizon is at 0.5, the rest is the mirror under it. */
export const SKY_KEEP = 0.56;
const SKIES = [
  { id: 'kloofendal_48d_partly_cloudy_puresky', as: 'vancouver', author: 'Greg Zaal, Jarod Guest' },
  { id: 'kloppenheim_06_puresky', as: 'toronto', author: 'Greg Zaal, Jarod Guest' },
  { id: 'qwantani_dusk_2_puresky', as: 'halifax', author: 'Greg Zaal, Jarod Guest' },
];

await mkdir(CACHE, { recursive: true });
await mkdir(OUT, { recursive: true });
for (const s of SKIES) {
  const src = `${CACHE}/${s.id}.jpg`;
  if (!existsSync(src)) {
    const r = await fetch(`https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/${s.id}.jpg`);
    if (!r.ok) throw new Error(`${r.status} ${s.id}`);
    await writeFile(src, Buffer.from(await r.arrayBuffer()));
  }
  const W = 4096, H = 2048, keep = Math.round(H * SKY_KEEP), out = `${OUT}/${s.as}.webp`;
  const full = sharp(src, { limitInputPixels: false }).resize(W, H);
  await full.clone().extract({ left: 0, top: 0, width: W, height: keep }).webp({ quality: 84, smartSubsample: true }).toFile(out);
  // where the sun is: the brightest of a coarse grid over the upper half; and the horizon's colour, the mean of the row band at it
  const small = await sharp(src, { limitInputPixels: false }).resize(256, 128).removeAlpha().raw().toBuffer();
  let best = -1, bx = 0, by = 0;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 256; x++) {
    let sum = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const yy = Math.min(63, Math.max(0, y + dy)), xx = (x + dx + 256) % 256, i = (yy * 256 + xx) * 3;
      sum += 0.2126 * small[i] + 0.7152 * small[i + 1] + 0.0722 * small[i + 2];
    }
    if (sum > best) { best = sum; bx = x; by = y; }
  }
  const mean = (y0, y1) => {
    const c = [0, 0, 0]; let n = 0;
    for (let y = y0; y < y1; y++) for (let x = 0; x < 256; x++) { const i = (y * 256 + x) * 3; c[0] += small[i]; c[1] += small[i + 1]; c[2] += small[i + 2]; n++; }
    return `#${c.map((v) => Math.round(v / n).toString(16).padStart(2, '0')).join('')}`;
  };
  console.log(`${s.as}: ${s.id} by ${s.author}, ${((await stat(out)).size / 1024).toFixed(0)} KB; sun at u ${(bx / 256).toFixed(3)} (azimuth ${((bx / 256) * 360).toFixed(0)} deg), elevation ${(90 - (by / 128) * 180).toFixed(0)} deg; horizon ${mean(58, 64)}, zenith ${mean(0, 12)}, sun side ${mean(Math.max(0, by - 4), by + 4)}`);
}
