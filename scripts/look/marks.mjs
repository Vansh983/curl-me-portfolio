// Each mark of the walk (walk.ts SIGNS) along the scroll, as he sees it: node scripts/look/marks.mjs [from] [to] [step]
// Per chapter and mark: its width and place on the screen, how much of it is in the frame (in), how much the text card
// covers (card), how much something else hides (hid, by what: rays from the eye to 44 points on it), and CLASH where two
// marks overlap. A mark is done when, while it is near and read, in is 1 and card and hid are 0.
import { open } from './stage.mjs';
import { SIGNS } from '../../src/lib/stage/walk.ts';
const [from = '9.5', to = '12.6', step = '0.06'] = process.argv.slice(2);
const TURN = 40; // the marks' turn toward him, degrees (sets.ts)
const s = await open({ cards: true, settle: 500 });
for (let c = +from; c <= +to + 1e-6; c += +step) {
  await s.go(c, 900);
  const r = await s.page.evaluate(({ signs, turn }) => {
    const st = window.__stage, V = st.Vector3, W = innerWidth, H = innerHeight, ray = new st.Raycaster();
    const cards = [...document.querySelectorAll('.wall .ch .tx')].map((e) => ({ r: e.getBoundingClientRect(), o: +getComputedStyle(e).opacity * +getComputedStyle(e.parentElement).opacity })).filter((k) => k.o > 0.2 && k.r.bottom > 0 && k.r.top < H && k.r.width > 0);
    const meshes = [];
    st.scene.traverseVisible((o) => { if (o.isMesh && !o.isPoints && !o.isInstancedMesh && o.geometry?.attributes?.position && !/sky|water|cloud|leafSprig|leafLitter|snow|mark/i.test(o.name)) meshes.push(o); });
    const eye = st.camera.getWorldPosition(new V()), out = [], rects = [];
    for (const g of signs) {
      const h = g.w / g.ratio, a = (turn * Math.PI) / 180, P = (u, v) => new V(g.x + ((u * g.w) / 2) * Math.cos(a), 0.35 + v * h, g.z - ((u * g.w) / 2) * Math.sin(a));
      const pts = [[-1, 0], [1, 0], [1, 1], [-1, 1]].map(([u, v]) => { const p = P(u, v).project(st.camera); return [((p.x + 1) / 2) * W, ((1 - p.y) / 2) * H, p.z]; });
      if (pts.some((p) => p[2] > 1)) continue;
      const x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0])), y0 = Math.min(...pts.map((p) => p[1])), y1 = Math.max(...pts.map((p) => p[1]));
      if (x1 < 0 || x0 > W || x1 - x0 < 55) continue;
      const vis = Math.max(0, Math.min(W, x1) - Math.max(0, x0)) / (x1 - x0);
      let cover = 0;
      for (const k of cards) { const ox = Math.max(0, Math.min(x1, k.r.right) - Math.max(x0, k.r.left)), oy = Math.max(0, Math.min(y1, k.r.bottom) - Math.max(y0, k.r.top)); cover = Math.max(cover, (ox * oy) / ((x1 - x0) * (y1 - y0))); }
      let n = 0, hid = 0; const by = {};
      for (let i = 0; i <= 10; i++) for (let j = 0; j <= 3; j++) {
        const p = P(-0.96 + (1.92 * i) / 10, 0.08 + (0.84 * j) / 3), d = p.distanceTo(eye);
        ray.set(eye, p.clone().sub(eye).normalize()); ray.far = d - 0.25;
        const hit = ray.intersectObjects(meshes, false).find((k) => !/logoSign/.test(k.object.name) && !/logoSign/.test(k.object.parent?.name ?? ''));
        n++; if (hit) { hid++; const name = (hit.object.name || hit.object.parent?.name || '?').split('|').slice(1, 3).join('|'); by[name] = (by[name] ?? 0) + 1; }
      }
      rects.push({ logo: g.logo, x0, x1, y0, y1 });
      out.push(`${g.logo} w${Math.round(x1 - x0)} x${Math.round(x0)}..${Math.round(x1)} in ${vis.toFixed(2)} card ${cover.toFixed(2)} hid ${(hid / n).toFixed(2)}${hid ? ' by ' + Object.entries(by).map(([k, v]) => `${k}:${v}`).join(',') : ''}`);
    }
    const clash = [];
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) { const A = rects[i], B = rects[j], ox = Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0), oy = Math.min(A.y1, B.y1) - Math.max(A.y0, B.y0); if (ox > 0 && oy > 0) clash.push(`${A.logo}/${B.logo} ${Math.round(ox)}px`); }
    return { out, clash };
  }, { signs: SIGNS, turn: TURN });
  console.log(c.toFixed(2), '|', r.out.join(' || '), r.clash.length ? '| CLASH ' + r.clash.join(', ') : '');
}
await s.close();
