// What is not built shows magenta: node scripts/look/void.mjs <outdir> <from> <to> [step]
// The skies are switched off and the clear colour is magenta, so a gap between two walls, a missing floor or a wall
// seen from behind shows as magenta. A window shows it too (its sky is off): read the frames it keeps.
// Prints chapter, magenta pixels, their box. Run it after any change to a wall, a door or a set's place.
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { open } from './stage.mjs';
const [out, from, to, stepArg] = process.argv.slice(2), step = +(stepArg || 0.04);
mkdirSync(out, { recursive: true });
const s = await open({ query: '&void&off=ao,bloom,vignette,smaa' });
await s.page.addStyleTag({ content: '[data-debug], .debug { visibility: hidden !important; }' });
await s.page.evaluate(() => {
  const st = window.__stage;
  st.scene.traverse((o) => { if (o.name === 'b|sky|mat:sky|sky' || o.name === 'b|sky|mat:walkSky|sky') o.material.visible = false; });
  st.scene.background = null;
  st.renderer.setClearColor(0xff00ff, 1);
});
const rows = [];
await s.go(+from, 3000);
for (let c = +from; c <= +to + 1e-6; c += step) {
  await s.go(c, +(process.env.WAIT || 1100));
  const png = await s.page.screenshot();
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let n = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
  for (let i = 0, p = 0; i < data.length; i += 3, p++) {
    if (data[i] > 170 && data[i + 2] > 170 && data[i + 1] < 90 && Math.abs(data[i] - data[i + 2]) < 50) { n++; const x = p % info.width, y = (p / info.width) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  rows.push([+c.toFixed(3), n, n ? [x0, y0, x1, y1] : null]);
  if (n > +(process.env.MIN || 12)) writeFileSync(`${out}/v${c.toFixed(2)}.png`, png);
  console.log(c.toFixed(2), n, n ? `${x0},${y0} ${x1},${y1}` : '');
}
writeFileSync(`${out}/void.json`, JSON.stringify(rows));
await s.close();
