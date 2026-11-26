// Frames at chapters along the real scroll: node scripts/look/shots.mjs <outdir> <chapter> [chapter ...]
// CARDS=1 keeps the text cards and the hero (what he sees; a mark on the left may be under a card). LIVE=1 shows the
// geometry as the code builds it, before any bake. EXTRA adds to the query (&off=bloom).
import { mkdirSync } from 'node:fs';
import { open } from './stage.mjs';
const [dir, ...cs] = process.argv.slice(2);
mkdirSync(dir, { recursive: true });
const s = await open({ query: `${process.env.LIVE ? '&live' : ''}${process.env.EXTRA ?? ''}`, cards: !!process.env.CARDS });
for (const c of cs) {
  if (+c === 0 && process.env.CARDS) { await s.page.evaluate(() => scrollTo(0, 0)); await s.page.waitForTimeout(2500); } else await s.go(+c);
  await s.page.screenshot({ path: `${dir}/${process.env.CARDS ? 'f' : 'q'}${c}.png` });
}
await s.close();
