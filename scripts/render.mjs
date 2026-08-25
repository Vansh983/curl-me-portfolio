// Rasterise a stage composition to PNG so the art can be looked at.
// Usage: npm run render -- --key 2 --bg src/lib/scenes/bg-sf.svg --scene src/lib/scenes/sc-2018.svg --out 2018.png
//        npm run render -- --params .renders/try.json --out try.png
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { figure, figureTransform, KEY_DEFAULT } from '../src/lib/figure.ts';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : dflt;
};
const flag = (name) => args.includes(name);

let params = KEY_DEFAULT;
if (opt('--params')) params = JSON.parse(readFileSync(resolve(opt('--params')), 'utf8'));
else if (opt('--key') !== undefined) {
  const { timeline } = await import('../src/data/timeline.ts');
  params = timeline[Number(opt('--key'))].scene.figure;
}

const dark = flag('--dark');
const bg = dark ? '#0a0a0a' : '#fdfdfc';
const ink = dark ? '#ededed' : '#111111';
const acc = '#b8e000';

// Strip the outer <svg> of an authored scene so its strokes inline into the stage.
const inner = (file) => {
  if (!file) return '';
  const s = readFileSync(resolve(file), 'utf8');
  return s.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
};
const withAccent = (s) => s.replaceAll('var(--acc)', acc).replaceAll('var(--bg)', bg);

const fillOf = { hair: '#17282f', skin: '#f1c7a3', shirt: '#33535f', trousers: '#dadbd8', shoes: '#17282f', accent: '#f2575d', ink: '#17282f', none: 'none' };
const strokes = figure(params)
  .map((s) => `<path d="${s.d}" opacity="${s.opacity}" fill="${fillOf[s.fill]}" stroke="${s.width ? '#17282f' : 'none'}" stroke-width="${s.width}"/>`)
  .join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" color="${ink}">
<rect width="1600" height="900" fill="${bg}"/>
<g fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
<g class="bg">${withAccent(inner(opt('--bg')))}</g>
<g class="scene">${withAccent(inner(opt('--scene')))}</g>
<line x1="0" y1="860" x2="1600" y2="860" stroke-opacity="0.18"/>
<g transform="${figureTransform(params)}">${strokes}</g>
</g>
</svg>`;

mkdirSync('.renders', { recursive: true });
const out = resolve('.renders', opt('--out', 'stage.png'));
writeFileSync(out.replace(/\.png$/, '.svg'), svg);
await sharp(Buffer.from(svg), { density: 96 }).png().toFile(out);
console.log(out);
