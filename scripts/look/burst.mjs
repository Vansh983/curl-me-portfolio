// A few frames a moment apart at one chapter, cropped and side by side, to see what moves: node scripts/look/burst.mjs <out.png> <chapter> [x y w h] [gap ms] [frames]
import sharp from 'sharp';
import { open } from './stage.mjs';
const [out, c, x = '0', y = '0', w = '1456', h = '829', gap = '130', n = '4'] = process.argv.slice(2);
const s = await open({ cards: !!process.env.CARDS });
await s.go(+c);
const shots = [];
for (let i = 0; i < +n; i++) { shots.push(await s.page.screenshot({ clip: { x: +x, y: +y, width: +w, height: +h } })); await s.page.waitForTimeout(+gap); }
await s.close();
await sharp({ create: { width: +w * shots.length, height: +h, channels: 3, background: '#000' } }).composite(shots.map((input, i) => ({ input, left: i * +w, top: 0 }))).png().toFile(out);
console.log('burst', out);
