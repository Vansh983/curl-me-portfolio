// Shared by the scripts in this folder: a headless Chrome on the running dev server, the stage prepared, the scroll set by chapter.
// The dev server must be up (npm run dev, port 4321). CHROME_BIN points at another Chrome; URL at another server.
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { STAGE_SPAN } from '../../src/lib/stage/shot.ts';

export const SPAN = STAGE_SPAN;
const chrome = process.env.CHROME_BIN ?? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
/** What the captures hide when they want the stage alone: the text cards, the captions, the hero. */
export const HIDE = '.journey .wall, .journey .cap, .hero, header, .intro, .card { visibility: hidden !important; }';

/**
 * Opens the page and waits until every set is prepared. `query` is added to `?debug&tier=1` (`&live` for unbaked
 * geometry, `&void`, `&off=ao,bloom`, `&set=0&cam=...`); `cards: true` leaves the text cards and the hero where a
 * visitor sees them. Returns the page, `go(chapter)` and `close()`.
 */
export async function open({ query = '', width = 1456, height = 829, cards = false, settle = 1500 } = {}) {
  const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--hide-scrollbars'] });
  const page = await browser.newPage({ viewport: { width, height }, colorScheme: 'dark' });
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  await page.goto(`${process.env.URL ?? 'http://localhost:4321/'}?debug&tier=1${query}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => scrollTo(0, document.querySelector('section.journey').getBoundingClientRect().top + scrollY + 10));
  await page.waitForFunction(() => window.__stage?.yFor && document.querySelector('section.journey').dataset.stage === 'ready', null, { timeout: 240000 });
  await page.waitForTimeout(settle);
  if (!cards) await page.addStyleTag({ content: HIDE });
  const go = async (c, wait = 2200) => { await page.evaluate((q) => scrollTo(0, window.__stage.yFor(q)), c / SPAN); await page.waitForTimeout(wait); };
  return { browser, page, go, close: () => browser.close() };
}
