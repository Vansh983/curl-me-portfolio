// Frame to frame difference along the stage: where does the picture jump? node scripts/look/seams.mjs <outdir> [step of q]
// Q0 and Q1 bound the stretch (stage progress, chapter / STAGE_SPAN); KEEP=1 keeps the frames. The only jump meant is the phone's.
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { open } from './stage.mjs';
const [out, stepArg] = process.argv.slice(2), step = +(stepArg || 0.004);
mkdirSync(out, { recursive: true });
const s = await open({ width: 640, height: 400 });
let prev = null; const rows = [];
for (let q = +(process.env.Q0 || 0); q <= +(process.env.Q1 || 1) + 1e-6; q += step) {
  await s.page.evaluate((q) => scrollTo(0, window.__stage.yFor(q)), q);
  await s.page.waitForTimeout(+(process.env.WAIT || 900));
  const png = await s.page.screenshot();
  const { data } = await sharp(png).resize(160, 100).raw().toBuffer({ resolveWithObject: true });
  if (prev) { let d = 0; for (let i = 0; i < data.length; i++) d += Math.abs(data[i] - prev[i]); rows.push([q, d / data.length]); }
  prev = data;
  if (process.env.KEEP) writeFileSync(`${out}/q${q.toFixed(3)}.png`, png);
}
writeFileSync(`${out}/seams.json`, JSON.stringify(rows));
console.log('median', rows.map((r) => r[1]).sort((a, b) => a - b)[Math.floor(rows.length / 2)].toFixed(1));
for (const [q, d] of [...rows].sort((a, b) => b[1] - a[1]).slice(0, 30)) console.log(q.toFixed(3), d.toFixed(1));
await s.close();
