// The Walk mode, driven by keys: node scripts/look/roam.mjs <outdir> <chapter> <steps>
// Steps, comma separated: a key held for milliseconds (w:1500, shift+w:800, left:400), a key tapped (e, r), wait:500.
// After each step: where he is (position, set, progress in chapters, doors) and a frame, <outdir>/<n>-<step>.png.
import { mkdirSync } from 'node:fs';
import { open, SPAN } from './stage.mjs';
const [dir, chapter = '0', steps = ''] = process.argv.slice(2);
mkdirSync(dir, { recursive: true });
const KEY = { w: 'KeyW', a: 'KeyA', s: 'KeyS', d: 'KeyD', left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', shift: 'ShiftLeft', e: 'KeyE', r: 'KeyR', esc: 'Escape' };
const s = await open({ cards: true });
s.page.on('console', (m) => { if (m.type() === 'error') console.error('console', m.text()); });
await s.go(+chapter, 1500);
const t0 = Date.now();
await s.page.click('[data-mode="walk"]');
await s.page.waitForFunction(() => document.querySelector('section.journey').dataset.mode === 'walk', null, { timeout: 60000 });
console.log('walk ready in', Date.now() - t0, 'ms');
const say = async (label) => {
  const st = await s.page.evaluate((span) => { const r = window.__stage.roam(), v = r.state(); return { ...v, c: r.q * span, prompt: r.prompt, y: Math.round(scrollY) }; }, SPAN);
  console.log(label.padEnd(14), 'at', st.pos.map((v) => v.toFixed(2)).join(','), 'yaw', ((st.yaw * 180) / Math.PI).toFixed(0), 'set', st.set, 'c', st.c.toFixed(3), st.riding ? 'riding' : '', st.prompt ? `[${st.prompt}]` : '', 'doors', st.doors.map((d) => d.toFixed(1)).join(' '));
};
await say('start');
let n = 0;
await s.page.screenshot({ path: `${dir}/${String(n++).padStart(2, '0')}-start.png` });
for (const step of steps.split(',').filter(Boolean)) {
  const [keys, ms] = step.split(':');
  if (keys === 'wait') await s.page.waitForTimeout(+ms);
  else {
    const codes = keys.split('+').map((k) => KEY[k] ?? k);
    for (const c of codes) await s.page.keyboard.down(c);
    await s.page.waitForTimeout(ms ? +ms : 60);
    for (const c of codes.reverse()) await s.page.keyboard.up(c);
    if (!ms) await s.page.waitForTimeout(700);
  }
  await say(step);
  await s.page.screenshot({ path: `${dir}/${String(n++).padStart(2, '0')}-${step.replace(/[:+]/g, '_')}.png` });
}
await s.close();
