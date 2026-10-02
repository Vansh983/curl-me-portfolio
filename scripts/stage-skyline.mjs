// The skyline out of Floqer's windows: a real photograph of Toronto, cut to a strip. Run: node scripts/stage-skyline.mjs
// The original is not in the repository: "Toronto Skyline from Riverdale Park East Panorama, April 11 2026 (01)" by
// Dillan Payne (Commons user PascalHD), CC BY-SA 4.0, 8921 by 2974, about 99 degrees wide:
// https://commons.wikimedia.org/wiki/File:Toronto_Skyline_from_Riverdale_Park_East_Panorama,_April_11_2026_(01).jpg
// Save its full size as .cache/toronto/riverdale-pano.jpg.
// Writes public/assets/stage/sky/toronto-skyline.webp (6144 wide) and toronto-skyline-s.webp (4096, the phone tier):
// the sky and the skyline down to the tree tops (the photograph's own eye line), graded as a view through glass (blacks
// lifted, a little less contrast), its head fading to clear so the stage's sky stands over it, its foot fading to the
// day's haze. The changes: cropped, graded, faded; the strip stays CC BY-SA 4.0 (credit in CREDITS.md).
// The numbers the runtime needs are printed, and kept in walk.ts (TORONTO_SKYLINE).
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';

const SRC = '.cache/toronto/riverdale-pano.jpg', OUT = 'public/assets/stage/sky';
if (!existsSync(SRC)) throw new Error(`${SRC} is missing: see the head of this file for where it comes from`);
mkdirSync(OUT, { recursive: true });
const LEFT = 520, ROWS = 1690, EYE = 1570, HAZE = [0xc9, 0xd7, 0xe3]; // the columns dropped at the south end (a bare tree and a near block, close to the lens), the rows kept, the photograph's eye line (its tree tops), the haze the foot goes into
const { data, info } = await sharp(SRC).extract({ left: LEFT, top: 0, width: 8921 - LEFT, height: ROWS }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, out = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) {
  const head = Math.min(1, y / (H * 0.3)), a = head * head * (3 - 2 * head); // clear at the top, whole from three tenths down
  const foot = Math.max(0, (y - (EYE - 70)) / (H - (EYE - 70))), f = foot * foot * (3 - 2 * foot) * 0.85; // the trees under the eye line go into the haze
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3, o = (y * W + x) * 4;
    for (let k = 0; k < 3; k++) { const v = 22 + (data[i + k] / 255) * 0.9 * 233; out[o + k] = Math.round(v + (HAZE[k] - v) * f); } // blacks lifted, the top kept off white
    out[o + 3] = Math.round(255 * a);
  }
}
const strip = sharp(out, { raw: { width: W, height: H, channels: 4 } });
for (const [name, w] of [['toronto-skyline', 6144], ['toronto-skyline-s', 4096]]) {
  await strip.clone().resize({ width: w }).webp({ quality: 82, alphaQuality: 90 }).toFile(`${OUT}/${name}.webp`);
  const m = await sharp(`${OUT}/${name}.webp`).metadata();
  console.log(name, m.width, m.height);
}
console.log('eye line at', (EYE / ROWS).toFixed(4), 'of the height from the top; the strip is', (((8921 - LEFT) * 99) / 8921).toFixed(2), 'degrees wide and', ((ROWS * 99) / 8921).toFixed(2), 'tall; the CN Tower stands at', ((2283 - LEFT) / (8921 - LEFT)).toFixed(4), 'across it');
