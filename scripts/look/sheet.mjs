// Many frames on one sheet, each with its name: node scripts/look/sheet.mjs <out.png> <columns> <frame.png> [frame.png ...]
import { chromium } from 'playwright-core';
import { basename } from 'node:path';
import { writeFileSync, readFileSync } from 'node:fs';
const [out, colsS, ...imgs] = process.argv.slice(2);
const cols = +colsS, cw = Math.floor(1512 / cols), ch = Math.round(cw * +(process.env.AR || 806 / 1512)), rows = Math.ceil(imgs.length / cols);
const html = `<body style="margin:0;background:#222"><div style="display:grid;grid-template-columns:repeat(${cols},${cw}px);gap:0">${imgs.map((f) => `<div style="position:relative;width:${cw}px;height:${ch}px"><img src="data:image/png;base64,${readFileSync(f).toString('base64')}" style="width:${cw}px;height:${ch}px;display:block"><span style="position:absolute;left:4px;top:2px;color:#fff;font:bold 14px monospace;text-shadow:0 0 3px #000">${basename(f).replace('.png', '')}</span></div>`).join('')}</div></body>`;
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: rows * ch } });
writeFileSync(`${out}.html`, html);
await page.goto(`file://${out}.html`);
await page.waitForTimeout(1500);
await page.screenshot({ path: out });
await browser.close();
console.log('sheet', out, rows * ch);
