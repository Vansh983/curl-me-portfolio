// Walks the whole story in the Walk mode, as a visitor could: node scripts/look/roam-bot.mjs <outdir> [from chapter] [to chapter]
// It steers at the scroll's own path a little ahead of where it stands, holds W, and presses E where the stage offers
// something (a door, the seat on the flight). It prints its progress every two seconds and stops where it cannot get on:
// that place is where a wall, a prop or a threshold blocks the story. A frame is saved there and at the end.
// BACK=1 walks it the other way (from a later chapter to an earlier one): a door must let him back. WALK=1 walks, not runs.
import { mkdirSync } from 'node:fs';
import { open, SPAN } from './stage.mjs';
import { DOLLY, makeDolly } from '../../src/lib/stage/dolly.ts';
const [dir, from = '0', to = String(SPAN)] = process.argv.slice(2);
mkdirSync(dir, { recursive: true });
const dolly = makeDolly(DOLLY), N = 6400, path = [];
for (let i = 0; i <= N; i++) { const f = dolly(i / N); path.push([f.cam[0], f.cam[2]]); }
const s = await open({ cards: true });
s.page.on('console', (m) => { if (m.type() === 'error' || m.text().startsWith('bot')) console.log(m.text()); });
await s.go(+from, 1500);
await s.page.click('[data-mode="walk"]');
await s.page.waitForFunction(() => document.querySelector('section.journey').dataset.mode === 'walk', null, { timeout: 60000 });
const result = await s.page.evaluate(({ path, N, span, to, run, back, every }) => new Promise((done) => {
  const roam = window.__stage.roam(), LOOK = 0.0022;
  let last = performance.now(), best = roam.q, bestAt = last, said = last, used = 0, frames = 0, slow = 0, t0 = last;
  roam.key('KeyW', true);
  if (run) roam.key('ShiftLeft', true);
  const tick = (now) => {
    const st = roam.state(), q = roam.q, c = q * span;
    frames++; if (now - last > 34) slow++;
    last = now;
    if (back ? q < best - 1e-5 : q > best + 1e-5) { best = q; bestAt = now; }
    if (!st.riding) {
      // aim at the path 1.1 m ahead by its own length; past a cut, keep the way he is going
      let i = Math.min(N, Math.round(q * N)), d = 0;
      const dir = back ? -1 : 1;
      while (i + dir >= 0 && i + dir <= N && d < 1.1) { const step = Math.hypot(path[i + dir][0] - path[i][0], path[i + dir][1] - path[i][1]); if (step > 0.5) break; d += step; i += dir; }
      const dx = path[i][0] - st.pos[0], dz = path[i][1] - st.pos[2];
      if (Math.hypot(dx, dz) > 0.25 && Math.hypot(dx, dz) < 4) {
        let turn = Math.atan2(-dx, -dz) - st.yaw;
        turn = Math.atan2(Math.sin(turn), Math.cos(turn));
        roam.look(-Math.max(-0.12, Math.min(0.12, turn)) / LOOK, 0);
      }
      if ((roam.prompt === 'Open' || (roam.prompt === 'Take your seat' && !back)) && now - used > 900) { used = now; roam.use(); console.log('bot use', roam.prompt, 'c', c.toFixed(3)); }
      else if (roam.prompt === 'Close' && now - bestAt > 1500 && now - used > 1500) { used = now; roam.use(); console.log('bot use Close (in its way)', 'c', c.toFixed(3)); } // an open leaf across his way: shut it and open it from here
    }
    // against a prop the path runs close by: a step to one side, then the other, as a person would
    const stuck = now - bestAt, side = stuck > 1200 && !st.riding ? (Math.floor(stuck / 800) % 2 ? 'KeyA' : 'KeyD') : '';
    roam.key('KeyA', side === 'KeyA'); roam.key('KeyD', side === 'KeyD');
    if (now - said > every) { said = now; console.log('bot c', c.toFixed(3), 'set', st.set, 'at', st.pos.map((v) => v.toFixed(2)).join(','), st.riding ? 'riding' : ''); }
    if (back ? c <= to + 0.02 : c >= to - 0.02) return done({ ok: true, c, secs: (now - t0) / 1000, frames, slow });
    if (now - bestAt > (st.riding ? 30000 : 5000)) return done({ ok: false, c, at: st.pos, yaw: st.yaw, set: st.set, prompt: roam.prompt, secs: (now - t0) / 1000, frames, slow });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}), { path, N, span: SPAN, to: +to, run: !process.env.WALK, back: !!process.env.BACK, every: +(process.env.EVERY ?? 2000) });
console.log(JSON.stringify(result));
await s.page.screenshot({ path: `${dir}/${result.ok ? 'end' : 'stuck'}-${result.c.toFixed(2)}.png` });
await s.close();
