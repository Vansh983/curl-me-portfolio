// Walk-mode frames from anywhere, several from one opened page: node scripts/look/pins.mjs <outdir> '<json>'
// json: [{ name, c (chapter: the set and what has opened by then), at: [x, feet, z] (world), dir: [dx, dz] (where he looks), pitch (up positive, radians), probe?: [[px, py], ...] }]
// Each pin: the scroll at chapter c, the Walk mode, a teleport to at looking along dir, a frame <outdir>/<name>.png; probe prints the first four things the eye hits through those screen points (name, group, distance, F front or B back, where). LIVE=1 unbaked. For what the scan cannot see: a neighbour's ground drawn over a floor, a wall baked black.
import { open } from './stage.mjs';
const [dir, json] = process.argv.slice(2);
const pins = JSON.parse(json);
const s = await open({ cards: true, query: process.env.LIVE ? '&live' : '' });
for (const p of pins) {
  await s.page.evaluate(() => { if (document.querySelector('section.journey').dataset.mode === 'walk') window.__stage.setMode(false); });
  await s.page.waitForFunction(() => document.querySelector('section.journey').dataset.mode !== 'walk');
  await s.go(+p.c, 1200);
  await s.page.click('[data-mode="walk"]');
  await s.page.waitForFunction(() => document.querySelector('section.journey').dataset.mode === 'walk', null, { timeout: 60000 });
  await s.page.waitForTimeout(900);
  await s.page.evaluate((p) => window.__stage.roam().teleport(p.at[0], p.at[1], p.at[2], Math.atan2(-p.dir[0], -p.dir[1]), p.pitch ?? 0), p);
  await s.page.waitForTimeout(700);
  await s.page.screenshot({ path: `${dir}/${p.name}.png` });
  if (p.probe) console.log((await s.page.evaluate((pts) => {
    const st = window.__stage, ray = new st.Raycaster(), W = innerWidth, H = innerHeight;
    const groupOf = (o) => { let g = o; while (g && g.parent && g.parent !== st.scene) g = g.parent; return st.scene.children.indexOf(g); };
    const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
    return pts.map(([x, y]) => { ray.setFromCamera({ x: (x / W) * 2 - 1, y: -(y / H) * 2 + 1 }, st.camera); const hits = ray.intersectObjects(st.scene.children, true).filter((h) => shown(h.object)).slice(0, 4); return `${x},${y}: ` + hits.map((h) => `${h.object.name || h.object.parent?.name || '?'} [g${groupOf(h.object)}] d${h.distance.toFixed(2)} ${h.face ? (h.face.normal.clone().transformDirection(h.object.matrixWorld).dot(ray.ray.direction) < 0 ? 'F' : 'B') : '?'} at ${h.point.toArray().map((v) => v.toFixed(2)).join(',')}`).join(' | '); });
  }, p.probe)).join('\n'));
  console.log('pin', p.name, JSON.stringify(await s.page.evaluate(() => { const st = window.__stage.roam().state(); return { set: st.set, at: st.pos.map((v) => +v.toFixed(2)) }; })));
}
await s.close();
