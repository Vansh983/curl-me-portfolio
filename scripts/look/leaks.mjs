// Where a set leaks, from everywhere a walker can stand: node scripts/look/leaks.mjs <outdir> [set|all]
// Opens the production preview (URL, default http://127.0.0.1:4322/) in the Walk mode at a set's first and last camera keys,
// floods its floor on a 0.4 m grid from where he stands (the walker's own floor test, his body's clearance), and from every
// reachable point casts 96 rays from eye height (24 round, pitches -25, 0, 15, 50). A ray leaks when it hits nothing within the
// limit (300 m in a room, the fog's far outdoors) or its first hit is the back of a one-sided face. A floor leaks where two drawn
// sets' floors lie within 5 mm. Prints a row per set; writes <outdir>/leaks.json and the six worst points as frames
// (<outdir>/set<i>-<k>.png, what is not built in magenta). STEP=0.4 GRID; RAYS=4000 caps the points rays are cast from.
import { mkdirSync, writeFileSync } from 'node:fs';
import { open, SPAN } from './stage.mjs';
import { DOLLY } from '../../src/lib/stage/dolly.ts';
import { SETS } from '../../src/lib/stage/sets.ts';
import { toWorld } from '../../src/lib/stage/world.ts';
import { ROAM } from '../../src/lib/stage/roam.ts';
const [dir = '.cache/leaks', which = 'all'] = process.argv.slice(2);
mkdirSync(dir, { recursive: true });
const sets = which === 'all' ? SETS.map((_, i) => i) : which.split(',').map(Number);
const keysOf = (i) => DOLLY.filter((k) => k.set === i && k.blend === undefined && !k.portal && !ROAM.rides.some((r) => k.q * SPAN > r.from && k.q * SPAN < r.to)); // never inside a ride: the walker is seated there and the ride plays
/** Every other set's room, on the ground (world): the flood keeps out of it, since there the ring would be that set's. */
const drawnWith = (i, k) => Math.abs(i - k) <= 1 || Math.abs(i - k) === SETS.length - 1 || (SETS[i].also ?? []).includes(k); // the ring, as enter() draws it
const roomsOf = (i) => SETS.flatMap((S, k) => { if (k === i || !S.shell || !drawnWith(i, k) || (i >= 8 && i <= 10 && k >= 8 && k <= 10)) return []; const at = S.at ?? [0, 0, 0]; const c = [[S.shell.x[0], S.shell.z[0]], [S.shell.x[1], S.shell.z[0]], [S.shell.x[0], S.shell.z[1]], [S.shell.x[1], S.shell.z[1]]].map(([x, z]) => toWorld(k, [x + at[0], 0, z + at[2]])); return [[Math.min(...c.map((p) => p[0])) - 0.1, Math.min(...c.map((p) => p[2])) - 0.1, Math.max(...c.map((p) => p[0])) + 0.1, Math.max(...c.map((p) => p[2])) + 0.1]]; });
const say = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
say('opening');
const s = await open({ cards: true, query: `&void&off=ao,bloom,vignette,smaa${process.env.LIVE ? '&live' : ''}` }); // LIVE=1: every set built at run time, before a bake
say('world in');
s.page.on('console', (m) => { if (m.type() === 'error') console.error('console', m.text()); else if (m.text().startsWith('leaks ')) console.log(m.text()); });
await s.page.evaluate(() => { const st = window.__stage; st.scene.background = null; st.renderer.setClearColor(0xff00ff, 1); });
const rows = [];
for (const i of sets) {
  const keys = keysOf(i), S = SETS[i], limit = S.env === 'sky' ? S.fog.far : 1000; // a room's rays end within a kilometre (the city under the apartment's glass is 185 m down, the sky 2400 out)
  // the walk's cities (8, 9, 10) build backdrops and movers, their ground is the promenade in set 8: the camera's keys, 12 m about, bound them
  const bounds = i >= 8 && i <= 10 ? (() => { const cams = keys.map((k) => toWorld(i, [k.cam[0] + (S.at?.[0] ?? 0), k.cam[1], k.cam[2] + (S.at?.[2] ?? 0)])), xs = cams.map((c) => c[0]), zs = cams.map((c) => c[2]); return [Math.min(...xs) - 12, Math.min(...zs) - 12, Math.max(...xs) + 12, Math.max(...zs) + 12]; })() : null; // the keys are written in the set's own frame; the world turns it (world.ts)
  const passes = [...new Set([keys[0].q, keys[keys.length - 1].q])];
  let merged = null;
  for (const q of passes) {
    await s.page.evaluate(() => { const m = document.querySelector('section.journey').dataset.mode; if (m === 'walk') window.__stage.setMode(false); });
    await s.page.waitForFunction(() => document.querySelector('section.journey').dataset.mode !== 'walk');
    await s.go(q * SPAN, 1500);
    say(`set ${i} at chapter ${(q * SPAN).toFixed(2)}: walk`);
    await s.page.click('[data-mode="walk"]');
    await s.page.waitForFunction(() => document.querySelector('section.journey').dataset.mode === 'walk', null, { timeout: 60000 });
    await s.page.waitForTimeout(900); // the leaves settle (the rule shuts those of other rooms over 0.5 s)
    say('scan', JSON.stringify(await s.page.evaluate((span) => { const r = window.__stage.roam(), st = r.state(); return { chapter: +(r.q * span).toFixed(2), set: st.set, at: st.pos.map((v) => +v.toFixed(2)), ground: st.ground, riding: st.riding }; }, SPAN)));
    const r = await s.page.evaluate(({ set, limit, outdoors, bounds, rooms, step, rayCap }) => {
      const st = window.__stage, roam = st.roam(), { MeshBVH } = st.bvh, V = st.Vector3;
      const EYE = 1.6, UP = 0.27, DOWN = 0.6, R = 0.26;
      const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
      const groupOf = (o) => { for (let k = o; k; k = k.parent) { const g = st.groups.indexOf(k); if (g >= 0) return g; } return -1; };
      // every drawn mesh in one BVH, in the world's frame; a triangle remembers its mesh (its name, its group, the side its material draws)
      const meshes = [], counts = [];
      st.scene.traverse((o) => {
        if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !shown(o) || !o.geometry?.getAttribute('position') || o.geometry.isInstancedBufferGeometry) return;
        const n = o.geometry.index ? o.geometry.index.count : o.geometry.getAttribute('position').count;
        meshes.push(o); counts.push(n - (n % 3));
      });
      const total = counts.reduce((a, b) => a + b, 0), pos = new Float32Array(total * 3), triMesh = new Int32Array(total / 3), v = new V();
      let at = 0, tri = 0;
      meshes.forEach((o, mi) => {
        o.updateWorldMatrix(true, false);
        const p = o.geometry.getAttribute('position'), ix = o.geometry.index, n = counts[mi];
        for (let k = 0; k < n; k++) { v.fromBufferAttribute(p, ix ? ix.getX(k) : k).applyMatrix4(o.matrixWorld); pos[at++] = v.x; pos[at++] = v.y; pos[at++] = v.z; }
        for (let k = 0; k < n / 3; k++) triMesh[tri++] = mi;
      });
      const geo = new st.BufferGeometry(); geo.setAttribute('position', new st.BufferAttribute(pos, 3));
      const t0 = performance.now(), bvh = new MeshBVH(geo, { indirect: true });
      console.log(`leaks set ${set}: ${meshes.length} meshes, ${total / 3} triangles, bvh in ${Math.round(performance.now() - t0)} ms`);
      const sideOf = (mi) => { const m = meshes[mi].material; return (Array.isArray(m) ? m[0] : m).side; };
      // the set's own ground: the flood keeps to the box of what the set itself builds (a neighbour's floor is that neighbour's run, under its own ring)
      const box = new st.Box3(), far = /\|(city|sky|flight|mover|water)$/;
      meshes.forEach((o, mi) => { if (groupOf(o) !== set || far.test(o.name) || o.name.startsWith('b|lawnFar|') || o.name === 'torontoSkyline' || o.name.startsWith('crowd:')) return; const b = new st.Box3().setFromObject(o); if (b.max.x - b.min.x < 200) box.union(b); });
      if (box.isEmpty() || !bounds) { if (bounds) box.set(new V(bounds[0], -50, bounds[1]), new V(bounds[2], 50, bounds[3])); } else if (bounds) box.union(new st.Box3(new V(bounds[0], -50, bounds[1]), new V(bounds[2], 50, bounds[3])));
      box.expandByScalar(0.5);
      const inBox = (x, z) => x >= box.min.x && x <= box.max.x && z >= box.min.z && z <= box.max.z && !rooms.some((r) => x > r[0] && x < r[2] && z > r[1] && z < r[3]);
      // the set's own floor: a neighbour's floor through a doorway is that neighbour's run, under its own ring (here the ring never flips, so a
      // door onto an undrawn set would lead onto the far ground under a block); the walk's cities share the promenade (set 8)
      const own = new Set(set >= 8 && set <= 10 ? [8, 9, 10] : [set]);
      const ghost = /\|(city|sky|flight|mover|water|curtain|person|walk|walkLamp|glow|fan)$/; // not solid to the walker (stage-run.ts ghost): never a floor
      const solidFloor = (m) => !m.name.startsWith('b|lawnFar|') && !ghost.test(m.name) && !m.name.startsWith('crowd:') && m.name !== 'torontoSkyline';
      const ownFloor = (x, fy, z) => { // the first solid thing under the point is the set's own (or lies on the same plane as it: two floors in one plane are the floor leak the scan counts, not an edge)
        origin.set(x, fy + UP + 0.04, z); dir.set(0, -1, 0);
        const hits = bvh.raycast(ray, 2, 0, UP + DOWN + 1.2).filter((h) => h.face.normal.y > 0.7 && solidFloor(meshes[triMesh[h.faceIndex]])).sort((a, b) => a.distance - b.distance); // floors face up
        if (!hits.length) return false;
        return hits.some((h) => h.distance - hits[0].distance < 0.006 && own.has(groupOf(meshes[triMesh[h.faceIndex]])));
      };
      const skyUp = outdoors || meshes.some((m) => m.name === 'b|sky|mat:sky|sky' || m.name.startsWith('b|sky|mat:walkSky') || m.name.startsWith('b|nightSky|')); // a sky is drawn (the day's, the walk's, the apartment's night): a ray level or upward ends on it (2400 m out), no leak
      const ray = new st.Ray(), origin = ray.origin, dir = ray.direction, n = new V();
      const first = (ox, oy, oz, dx, dy, dz, far) => { origin.set(ox, oy, oz); dir.set(dx, dy, dz).normalize(); return bvh.raycastFirst(ray, 2, 0, far); };
      // the floor, flooded from where he stands: a point counts where the walker's floor test finds ground a stride up or a drop down from its neighbour, and his body fits
      const st0 = roam.state(), feet0 = st0.ground ?? st0.pos[1] - EYE, x0 = st0.pos[0], z0 = st0.pos[2]; // his feet: the floor under him (seated, the eye is lower)
      const key = (ix, iz) => `${ix},${iz}`;
      const fits = (x, y, z) => { for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; for (const h of [0.6, 1.2]) { const hit = first(x, y + h, z, Math.cos(a), 0, Math.sin(a), R * 0.8); if (hit) return false; } } return true; };
      const seen = new Map(), reach = [], queue = [[0, 0, feet0]];
      seen.set(key(0, 0), feet0);
      const t1 = performance.now();
      let cutoff = 0, head = 0;
      while (head < queue.length && head < 80000) {
        const [ix, iz, fy] = queue[head++];
        const x = x0 + ix * step, z = z0 + iz * step;
        reach.push([x, fy, z]);
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const jx = ix + dx, jz = iz + dz, k = key(jx, jz);
          if (seen.has(k)) continue;
          const nx = x0 + jx * step, nz = z0 + jz * step;
          if (!inBox(nx, nz)) { seen.set(k, null); continue; }
          const g = roam.floorAt(nx, nz, fy);
          if (g === null) { seen.set(k, null); continue; }
          if (g - fy > UP || fy - g > DOWN || !fits(nx, g, nz)) { seen.set(k, null); cutoff++; continue; }
          if (!ownFloor(nx, fy, nz)) { seen.set(k, null); continue; }
          seen.set(k, g); queue.push([jx, jz, g]);
        }
      }
      console.log(`leaks set ${set}: flood ${reach.length} points in ${Math.round(performance.now() - t1)} ms`);
      if (reach.length < 5) { // nowhere to go: say what is under him and round him
        origin.set(x0, feet0 + UP + 0.04, z0); dir.set(0, -1, 0);
        const under = bvh.raycast(ray, 2, 0, 3).sort((a, b) => a.distance - b.distance).slice(0, 4).map((h) => `${meshes[triMesh[h.faceIndex]].name} g${groupOf(meshes[triMesh[h.faceIndex]])} ${h.distance.toFixed(3)} ny${h.face.normal.y.toFixed(2)}`);
        const g1 = roam.floorAt(x0 + step, z0, feet0), f1 = g1 === null ? 'no floor' : `floor ${g1.toFixed(3)} fits ${fits(x0 + step, g1, z0)} own ${ownFloor(x0 + step, feet0, z0)}`;
        console.log(`leaks set ${set}: stuck at ${x0.toFixed(2)},${feet0.toFixed(2)},${z0.toFixed(2)}: under ${under.join(' | ')}; east ${f1}`);
      }
      // the rays: 24 round at four pitches, from every reachable point (every k-th where there are many)
      const yaws = Array.from({ length: 24 }, (_, k) => (k / 24) * Math.PI * 2), pitches = [-25, 0, 15, 50].map((d) => (d * Math.PI) / 180);
      const every = Math.max(1, Math.ceil(reach.length / rayCap));
      const points = [], names = new Map();
      let rays = 0, leaks = 0, floors = 0;
      for (let p = 0; p < reach.length; p += every) {
        const [x, fy, z] = reach[p], ey = fy + EYE, bad = [];
        for (const pt of pitches) for (const yw of yaws) {
          rays++;
          const dx = Math.cos(pt) * Math.sin(yw), dy = Math.sin(pt) * -1, dz = Math.cos(pt) * Math.cos(yw); // pitch positive looks down
          const hit = first(x, ey, z, dx, dy, dz, skyUp && pt <= 0 ? 2500 : limit);
          let kind = '', mesh = hit ? meshes[triMesh[hit.faceIndex]] : null;
          if (!hit) kind = 'void';
          else if (hit.distance > 0.2) { // nearer than his body is a doorway's own edge, never seen
            const side = sideOf(triMesh[hit.faceIndex]);
            if (side !== 2) {
              const d = hit.face.normal.dot(dir);
              if ((side === 0 && d > 0) || (side === 1 && d < 0)) {
                // a back face with a front face on the same plane (a passage's end wall on a room's wall) is drawn as the front: no leak
                const near = bvh.raycast(ray, 2, Math.max(0, hit.distance - 0.02), hit.distance + 0.02);
                const front = near.some((h2) => { const s2 = sideOf(triMesh[h2.faceIndex]), d2 = h2.face.normal.dot(dir); return s2 === 2 || (s2 === 0 && d2 < 0) || (s2 === 1 && d2 > 0); });
                if (!front) kind = 'back';
              }
            }
          }
          if (!kind) continue;
          leaks++;
          let name = hit ? `${mesh.name || mesh.parent?.name || '?'} g${groupOf(mesh)}` : 'nothing';
          if (kind === 'back') { const p = hit.point, h3 = first(p.x + dir.x * 0.02, p.y + dir.y * 0.02, p.z + dir.z * 0.02, dir.x, dir.y, dir.z, 300); name += h3 ? ` > ${meshes[triMesh[h3.faceIndex]].name} g${groupOf(meshes[triMesh[h3.faceIndex]])} ${h3.distance.toFixed(1)}` : ' > nothing'; } // what the eye sees past it
          names.set(`${kind} ${name}`, (names.get(`${kind} ${name}`) ?? 0) + 1);
          bad.push([yw, pt, kind, name, hit ? +hit.distance.toFixed(1) : null]);
        }
        // the floor under the eye: two drawn sets' floors within 5 mm
        origin.set(x, ey, z); dir.set(0, -1, 0);
        const hits = bvh.raycast(ray, 2, 0, EYE + 2).filter((h) => h.face.normal.y > 0.7).map((h) => ({ d: h.distance, g: groupOf(meshes[triMesh[h.faceIndex]]) })); // floors face up: a plinth's underside on a floor's plane is culled, never seen
        let floor = false;
        for (let a = 0; a < hits.length && !floor; a++) for (let b = a + 1; b < hits.length; b++) if (Math.abs(hits[a].d - hits[b].d) < 0.005 && hits[a].g !== hits[b].g) { floor = true; floors++; const k = `floor g${hits[a].g}/g${hits[b].g}`; names.set(k, (names.get(k) ?? 0) + 1); break; }
        if (bad.length || floor) points.push({ x: +x.toFixed(2), y: +fy.toFixed(2), z: +z.toFixed(2), n: bad.length, floor, worst: bad.sort((p1, p2) => (p1[4] ?? 1e9) - (p2[4] ?? 1e9))[0] ?? null });
      }
      geo.dispose();
      console.log(`leaks set ${set}: ${rays} rays in ${Math.round(performance.now() - t0)} ms`);
      return { set, box: [box.min.x, box.min.z, box.max.x, box.max.z].map((v) => +v.toFixed(1)), reach: +(reach.length * step * step).toFixed(1), points: reach.length, cutoff: +(cutoff * step * step).toFixed(1), rays, leaks, floors, leakPoints: points.length, worst: points.sort((a, b) => b.n + (b.floor ? 50 : 0) - a.n - (a.floor ? 50 : 0)).slice(0, 6), names: [...names.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12) };
    }, { set: i, limit, outdoors: S.env === 'sky' || !!S.sky, bounds, rooms: roomsOf(i), step: +(process.env.STEP || 0.4), rayCap: +(process.env.RAYS || 4000) });
    if (!merged || r.leaks + r.floors > merged.leaks + merged.floors) merged = { ...r, q, chapter: +(q * SPAN).toFixed(2) };
    merged.passes = (merged.passes ?? 0) + 1;
  }
  const r = merged;
  console.log(`set ${String(i).padStart(2)} ${S.id.padEnd(12)} box ${r.box.join(',').padEnd(26)} reach ${String(r.reach).padStart(7)} m²  cutoff ${String(r.cutoff).padStart(6)} m²  rays ${r.rays}  leaking ${((100 * r.leaks) / Math.max(1, r.rays)).toFixed(2).padStart(6)} %  points ${r.leakPoints}/${Math.ceil(r.points / Math.max(1, Math.ceil(r.points / +(process.env.RAYS || 4000))))}  floors ${r.floors}`);
  for (const [name, count] of r.names) console.log(`      ${String(count).padStart(6)}  ${name}`);
  rows.push(r);
  // frames of the worst points: put him there, look along the worst ray
  if (process.env.FRAMES !== '0') {
    if (r.q !== undefined) { await s.go(r.q * SPAN, 300); }
    for (let k = 0; k < r.worst.length; k++) {
      const w = r.worst[k], [yw, pt] = w.worst ?? [0, 0];
      await s.page.evaluate(({ w, yw, pt }) => window.__stage.roam().teleport(w.x, w.y, w.z, Math.atan2(-Math.sin(yw), -Math.cos(yw)), -pt), { w, yw, pt }); // the walker's yaw looks along -sin, -cos
      await s.page.waitForTimeout(400);
      await s.page.screenshot({ path: `${dir}/set${i}-${k}.png` });
    }
  }
}
writeFileSync(`${dir}/leaks.json`, JSON.stringify(rows, null, 1));
await s.close();
