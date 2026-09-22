// Run against npm run preview. CHROME_BIN can point at a system Chrome/Chromium.
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import sharp from 'sharp';
import assert from 'node:assert/strict';

const url = process.argv[2] ?? 'http://127.0.0.1:4322/';
const baseline = process.argv.includes('--baseline');
const out = process.env.AUDIT_OUT ?? '.cache/optimization';
const chrome = process.env.CHROME_BIN ?? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: process.platform === 'darwin' ? ['--use-angle=metal'] : [] });
try {
  if (process.argv.includes('--fallbacks')) {
    for (const scenario of ['skip', 'missing-model', 'no-webgl']) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const pending = [];
      if (scenario === 'skip') await page.route('**/*.glb', (route) => { pending.push(route); });
      if (scenario === 'missing-model') await page.route('**/baked/set0.glb', (route) => route.fulfill({ status: 503, body: 'Audit: unavailable model' }));
      if (scenario === 'no-webgl') await page.addInitScript(() => {
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) { return type.startsWith('webgl') ? null : getContext.call(this, type, ...args); };
      });
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      if (scenario === 'skip') {
        await page.locator('[data-skip-stage]').click();
        await page.unroute('**/*.glb');
        for (const route of pending) await route.abort();
        await page.waitForTimeout(1000);
        assert.equal(await page.locator('.journey').getAttribute('data-stage'), 'skipped');
      } else {
        await page.waitForFunction(() => document.querySelector('.journey')?.getAttribute('data-stage') === 'error');
        assert.ok(await page.locator('[data-retry-stage]').isVisible());
      }
      assert.ok(await page.locator('.wall .tx').first().isVisible());
      assert.equal(await page.locator('canvas.gl').evaluate((canvas) => getComputedStyle(canvas).opacity), '0');
      assert.ok(await page.locator('.opening').evaluate((img) => img.complete && img.naturalWidth > 0));
      await page.screenshot({ path: `${out}/${scenario}.png` });
      if (scenario === 'missing-model') {
        await page.unroute('**/baked/set0.glb');
        await page.locator('[data-retry-stage]').click();
        await page.waitForFunction(() => document.querySelector('.journey')?.getAttribute('data-stage') === 'ready', null, { timeout: 120000 });
      }
      assert.deepEqual(errors, [], `${scenario}: no unhandled errors`);
      console.log(`${scenario}: passed${scenario === 'missing-model' ? ' (including retry)' : ''}`);
      await page.close();
    }
  } else for (const mobile of process.argv.includes('--mobile') ? [true] : [false]) {
    const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, hasTouch: mobile, deviceScaleFactor: 1, colorScheme: process.argv.includes('--light') ? 'light' : 'dark', reducedMotion: process.argv.includes('--reduced') ? 'reduce' : 'no-preference' });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' || /GL_INVALID|THREE.*Error/.test(m.text())) { if (errors.length < 20) errors.push(m.text()); } });
    page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${new URL(r.url()).pathname}`); });
    await page.addInitScript(() => {
      window.__audit = { tasks: [], shifts: [] };
      performance.setResourceTimingBufferSize(2000);
      new PerformanceObserver((list) => { for (const e of list.getEntries()) window.__audit.tasks.push({ at: Math.round(e.startTime), ms: Math.round(e.duration) }); }).observe({ type: 'longtask', buffered: true });
    });
    await page.goto(`${url}?${baseline ? 'debug' : 'audit'}&tier=${mobile ? 0 : 1}`, { waitUntil: 'domcontentloaded' });
    if (baseline) await page.waitForTimeout(14000);
    else {
      await page.waitForFunction(() => ['ready', 'error'].includes(document.querySelector('.journey')?.getAttribute('data-stage')), null, { timeout: 120000 });
      if (await page.locator('.journey').getAttribute('data-stage') === 'error') throw new Error(`Preparation failed: ${errors.join('; ')}`);
    }
    const ready = await page.evaluate(() => {
      const s = window.__stage, textures = new Map(), sources = new Map();
      s.scene.traverse((o) => { for (const m of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) for (const t of Object.values(m)) if (t?.isTexture) { textures.set(t.uuid, t); if (t.image?.width) sources.set(t.source.uuid, t.image); } });
      const resources = performance.getEntriesByType('resource').filter((e) => e.name.includes('/assets/'));
      return { readyMs: s.readyMs ?? null, assetMB: resources.reduce((n, e) => n + e.encodedBodySize, 0) / 1e6, requests: resources.length, textureObjects: textures.size, imageSources: sources.size, approximateImageMB: [...sources.values()].reduce((n, i) => n + i.width * i.height * 4 * 4 / 3, 0) / 1e6, preparationTasks: window.__audit.tasks, programs: s.renderer.info.programs.length };
    });
    if (process.argv.includes('--poster')) {
      await page.addStyleTag({ content: '.wall, .cap { visibility:hidden !important; }' });
      await sharp(await page.locator('canvas.gl').screenshot()).webp({ quality: 82 }).toFile(`${out}/preview.webp`);
    }
    const start = await page.evaluate(() => performance.now());
    const visits = [0, 0.08, 0.16, 0.24, 0.31, 0.375, 0.39, 0.398, 0.42, 0.48, 0.56, 0.63, 0.7, 0.725, 0.76, 0.82, 0.9, 0.99, 1, 0.7, 0.4, 0];
    for (const q of visits) {
      await page.evaluate((q) => scrollTo(0, window.__stage.yFor(q)), q);
      if (baseline) await page.waitForTimeout(700);
      else await page.waitForFunction((q) => {
        // At a reduced-motion bin boundary, integer scroll pixels can select either neighbour.
        const tolerance = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 / 24 + 0.0008 : 0.0008;
        return Math.abs(window.__stage.q - q) < tolerance;
      }, q, { timeout: 15000 }).catch(async (error) => { throw new Error(`Camera did not settle at ${q}; actual ${await page.evaluate(() => window.__stage.q)}`, { cause: error }); });
      await page.waitForTimeout(350);
      if ([0, 0.375, 0.48, 0.7, 0.99].includes(q)) await page.screenshot({ path: `${out}/${mobile ? 'mobile' : 'desktop'}-${q}.png` });
    }
    const walk = await page.evaluate((start) => ({ tasks: window.__audit.tasks.filter((e) => e.at >= start), lateAssets: performance.getEntriesByType('resource').filter((e) => e.startTime >= start && e.name.includes('/assets/')).map((e) => e.name), contextLost: window.__stage.renderer.getContext().isContextLost() }), start);
    const report = { mode: mobile ? 'mobile' : 'desktop', baseline, ready, walk, errors };
    await writeFile(`${out}/${mobile ? 'mobile' : 'desktop'}.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ ...report, ready: { ...ready, preparationTasks: ready.preparationTasks.sort((a, b) => b.ms - a.ms).slice(0, 6) } }, null, 2));
    if (!baseline && (errors.length || walk.lateAssets.length || walk.contextLost)) process.exitCode = 1;
    await page.close();
  }
} finally { await browser.close(); }
