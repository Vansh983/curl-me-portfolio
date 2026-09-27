// A crop of a frame, enlarged, to look at an edge: node scripts/look/crop.mjs <in.png> <out.png> <x> <y> <w> <h> [scale]
import sharp from 'sharp';
const [i, o, x, y, w, h, s = '2'] = process.argv.slice(2);
const m = await sharp(i).metadata();
const L = Math.max(0, +x), T = Math.max(0, +y), W = Math.min(m.width - L, +w), H = Math.min(m.height - T, +h);
await sharp(i).extract({ left: L, top: T, width: W, height: H }).resize(Math.round(W * +s), Math.round(H * +s), { kernel: 'nearest' }).toFile(o);
