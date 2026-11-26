// Hands a set's geometry and lights from the running stage to the bake pipeline: opens the dev
// server headless with ?export=<set>, waits for the export, writes .cache/bake/set<i>.glb and
// .json. Run: node scripts/stage-export.mjs <set> [url]. Then: blender -b -P scripts/stage-bake.py -- <set>
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const set = Number(process.argv[2] ?? 0);
const url = process.argv[3] ?? 'http://localhost:4321/';
// playwright-core is not a dependency: use the npx cache copy or a global one
const candidates = [`${process.env.HOME}/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core`, 'playwright-core'];
let chromium;
for (const c of candidates) { try { chromium = require(c).chromium; break; } catch { /* next */ } }
if (!chromium) throw new Error('playwright-core not found');
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (e) => console.error('pageerror', e.message));
await page.goto(`${url}?export=${set}&tier=1`, { waitUntil: 'networkidle' });
await page.evaluate(() => scrollTo(0, document.querySelector('section.journey').getBoundingClientRect().top + scrollY + 10));
await page.waitForFunction(() => window.__export !== undefined, null, { timeout: 120000 });
const out = await page.evaluate(() => window.__export);
await browser.close();
mkdirSync('.cache/bake', { recursive: true });
writeFileSync(`.cache/bake/set${set}.glb`, Buffer.from(out.glb, 'base64'));
writeFileSync(`.cache/bake/set${set}.json`, JSON.stringify(out.manifest, null, 1));
console.log(`set ${set}: ${(out.glb.length * 0.75 / 1e6).toFixed(1)} MB glb, ${out.manifest.lights.length} lights`);
if (!existsSync('.cache/bake/.gitignore')) writeFileSync('.cache/bake/.gitignore', '*\n');
