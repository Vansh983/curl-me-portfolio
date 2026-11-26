// What the eye hits through points of the screen at a chapter: node scripts/look/rays.mjs <chapter> <x,y> [x,y ...]
// Per point, the first five things along the ray: name (b|prop|surface|live), scene group (a set's group is 8 + its
// index), distance, which side was hit (F front, B back: a one-sided face seen from behind is not drawn) and where.
// Use it to find what a stray shape in a frame is, and before adding a window, what lies beyond it. LIVE=1 unbaked;
// SKIP=regex leaves out what it names (SKIP='cabinGlass|weather' looks through the glass and the snow).
import { open } from './stage.mjs';
const [c, ...pts] = process.argv.slice(2);
const s = await open({ settle: 500, query: process.env.LIVE ? '&live' : '' });
await s.go(+c, 2500);
const r = await s.page.evaluate(([pts, skipSrc]) => {
  const skip = skipSrc ? new RegExp(skipSrc) : null;
  const st = window.__stage, ray = new st.Raycaster(), W = innerWidth, H = innerHeight;
  const groupOf = (o) => { let g = o; while (g && g.parent && g.parent !== st.scene) g = g.parent; return st.scene.children.indexOf(g); };
  const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
  return pts.map((p) => {
    const [x, y] = p.split(',').map(Number);
    ray.setFromCamera({ x: (x / W) * 2 - 1, y: -(y / H) * 2 + 1 }, st.camera);
    const hits = ray.intersectObjects(st.scene.children, true).filter((h) => shown(h.object) && !(skip && skip.test(h.object.name))).slice(0, 5);
    return `${p}: ` + hits.map((h) => `${h.object.name || h.object.parent?.name || '?'} [g${groupOf(h.object)}] d${h.distance.toFixed(1)} ${h.face ? (h.face.normal.clone().transformDirection(h.object.matrixWorld).dot(ray.ray.direction) < 0 ? 'F' : 'B') : '?'} at ${h.point.toArray().map((v) => v.toFixed(1)).join(',')}`).join(' | ');
  });
}, [pts, process.env.SKIP ?? '']);
console.log(r.join('\n'));
await s.close();
