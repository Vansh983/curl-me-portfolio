// The skyline out of Floqer's windows: a real photograph of Toronto, cut to a strip. Run: node scripts/stage-skyline.mjs
// The original is not in the repository; save it full size as .cache/toronto/riverdale-pano.jpg:
//   "Toronto Skyline from Riverdale Park East Panorama, April 11 2026 (01)" by Dillan Payne (Commons user PascalHD),
//   CC BY-SA 4.0, 8921 by 2974, about 99 degrees wide.
//   https://commons.wikimedia.org/wiki/File:Toronto_Skyline_from_Riverdale_Park_East_Panorama,_April_11_2026_(01).jpg
// Writes public/assets/stage/sky/<name>.webp (6144 wide) and <name>-s.webp (4096, the phone tier): the sky and the
// skyline down to the photograph's own eye line (the tree tops), graded as a view through glass, the head fading to
// clear so the stage's sky stands over it, the foot fading into the day's haze. The changes: cropped, graded, faded;
// the strip keeps its photograph's licence (credits in CREDITS.md). The numbers the runtime needs are printed, and kept
// in walk.ts (TORONTO_SKYLINE). A night strip for the apartment was cut here for a day (2026-10-18, doc 51): "too fake"; its tower took this photograph's grey instead.
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';

const OUT = 'public/assets/stage/sky';
mkdirSync(OUT, { recursive: true });
const smooth = (t) => { const s = Math.min(1, Math.max(0, t)); return s * s * (3 - 2 * s); };

/**
 * One strip. `left`, `rows`: the columns dropped at the left and the rows kept from the top. `eye`: the photograph's
 * eye line (a row). `head`: how far down the head's fade runs, as a fraction of the height. `foot`: where the foot's
 * fade begins (rows above the eye line), what it goes into (`color`, or clear when none) and how far (`amount`).
 * `grade`: blacks lifted to `lift`, the range scaled by `range`. `tower`: the CN Tower's column. `width`: the
 * photograph's angle of view across its whole width, in degrees.
 */
async function strip({ src, name, left, rows, eye, head, foot, grade, tower, width }) {
  if (!existsSync(src)) throw new Error(`${src} is missing: see the head of this file for where it comes from`);
  const meta = await sharp(src).metadata();
  const { data, info } = await sharp(src).extract({ left, top: 0, width: meta.width - left, height: rows }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    const a = smooth(y / (H * head));
    const f = smooth((y - (eye - foot.from)) / (H - (eye - foot.from))) * foot.amount;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3, o = (y * W + x) * 4;
      for (let k = 0; k < 3; k++) { const v = grade.lift + (data[i + k] / 255) * grade.range * (255 - grade.lift); out[o + k] = foot.color ? Math.round(v + (foot.color[k] - v) * f) : Math.round(v); }
      out[o + 3] = Math.round(255 * a * (foot.color ? 1 : 1 - f));
    }
  }
  const img = sharp(out, { raw: { width: W, height: H, channels: 4 } });
  for (const [suffix, w] of [['', 6144], ['-s', 4096]]) {
    await img.clone().resize({ width: w }).webp({ quality: 82, alphaQuality: 90 }).toFile(`${OUT}/${name}${suffix}.webp`);
    const m = await sharp(`${OUT}/${name}${suffix}.webp`).metadata();
    console.log(name + suffix, m.width, m.height);
  }
  const perDeg = meta.width / width;
  console.log(`${name}: span ${(W / perDeg).toFixed(2)}, tall ${(H / perDeg).toFixed(2)}, eye ${(eye / H).toFixed(4)}, tower ${((tower - left) / W).toFixed(4)}`);
}

// Floqer's windows by day: the south end dropped (a bare tree and a near block, close to the lens); the eye line is the
// tree tops; the trees under it go into the day's haze; blacks lifted, the top kept off white.
await strip({ src: '.cache/toronto/riverdale-pano.jpg', name: 'toronto-skyline', left: 520, rows: 1690, eye: 1570, head: 0.3, foot: { from: 70, color: [0xc9, 0xd7, 0xe3], amount: 0.85 }, grade: { lift: 22, range: 0.9 }, tower: 2283, width: 99 });
