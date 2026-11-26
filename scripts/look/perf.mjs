// Frame rate and draw calls through a stretch: node scripts/look/perf.mjs <chapter from> <chapter to> <steps>
import { open, SPAN } from './stage.mjs';
const [c0, c1, steps] = process.argv.slice(2).map(Number);
const s = await open({ width: 1600, height: 1000 });
await s.go(c0, 3000);
const res = await s.page.evaluate(async ({ q0, q1, steps }) => {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const q = q0 + (q1 - q0) * (i / steps);
    scrollTo(0, window.__stage.yFor(q));
    const t0 = performance.now(); let frames = 0, worst = 0, last = t0;
    await new Promise((r) => { const tick = () => { const now = performance.now(); worst = Math.max(worst, now - last); last = now; frames++; if (now - t0 < 400) requestAnimationFrame(tick); else r(); }; requestAnimationFrame(tick); });
    const info = window.__stage.renderer.info;
    out.push({ q, fps: +(frames / 0.4).toFixed(0), worst: +worst.toFixed(0), calls: info.render.calls, tris: info.render.triangles, geoms: info.memory.geometries, tex: info.memory.textures });
  }
  return out;
}, { q0: c0 / SPAN, q1: c1 / SPAN, steps });
for (const r of res) console.log(JSON.stringify({ chapter: +(r.q * SPAN).toFixed(2), ...r, q: undefined }));
await s.close();
