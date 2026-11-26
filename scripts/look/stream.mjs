// A slow line and a skimmer. Opens the page on a throttled connection, scrolls to the end as soon as the canvas shows, and
// logs where the camera waits as the sets land: `node scripts/look/stream.mjs <dir> [kbit/s]`. A frame is saved each time
// a set lands (hold-<n>.png), the first the view at the first station he is held at. URL as for the other tools.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const [out = '.cache/stream', kbit = '4000'] = process.argv.slice(2);
const chrome = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--hide-scrollbars'] });
const page = await browser.newPage({ viewport: { width: 1456, height: 829 }, colorScheme: 'dark' });
const cdp = await page.context().newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: (Number(kbit) * 1000) / 8, uploadThroughput: 1e6 });
page.on('pageerror', (e) => console.error('pageerror', e.message));
const t0 = Date.now();
await page.goto(`${process.env.URL ?? 'http://localhost:4321/'}?debug&tier=1`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__stage?.yFor && document.querySelector('section.journey').dataset.stage === 'ready', null, { timeout: 600000 });
console.log(`canvas at ${Date.now() - t0} ms`);
await page.evaluate(() => scrollTo(0, window.__stage.yFor(1)));
let last = -1;
for (let k = 0; k < 600; k++) {
  const s = await page.evaluate(() => ({ q: +window.__stage.q.toFixed(4), loaded: window.__stage.loaded, all: window.__stage.allMs }));
  if (s.loaded !== last) { console.log(`${Date.now() - t0} ms  in ${s.loaded} of 13  q ${s.q}`); last = s.loaded; await page.screenshot({ path: `${out}/hold-${s.loaded}.png` }); }
  if (s.all > 0 && s.q > 0.99) break;
  await page.waitForTimeout(500);
}
console.log(JSON.stringify(await page.evaluate(() => ({ readyMs: window.__stage.readyMs, allMs: window.__stage.allMs, q: +window.__stage.q.toFixed(4) }))));
await browser.close();
