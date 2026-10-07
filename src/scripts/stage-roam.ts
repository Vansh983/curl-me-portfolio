// The Walk mode: the same world, walked. Keys move him (W A S D or the arrows, Shift to hurry), the mouse looks once
// the stage is clicked, E opens the door in front of him. The story stays the spine (lib/stage/roam.ts): where he
// stands gives the stage its progress, so the light, the weather and what moves follow him as they follow the scroll.
//
// Every set stands in one place (lib/stage/world.ts), so the walk is one world: the story's end is the room it began in.
// He is a body 1.6 m to the eye. Walls and furniture stop it (a capsule against each set's own collision mesh,
// three-mesh-bvh); the floor carries it (rays down: stairs lift him, a drop of more than 0.6 m holds him at its
// edge, and so does the end of what is built). A door's leaf is a line that turns on its hinge, away from him.
// Where the scroll's camera does not walk (the flight), he takes his seat and it plays, his eye easing into the
// scroll's camera first; from the hall it lands him in, E takes him back to the aircraft.
import { Box3, BufferAttribute, BufferGeometry, DoubleSide, Line3, Matrix4, Ray, Vector3, type Group, type Mesh, type Object3D } from 'three';
import { MeshBVH, type ExtendedTriangle } from 'three-mesh-bvh';
import type { Frame } from '../lib/stage/dolly.ts';
import { ROAM, roamPath, roamNearest, roamHeading, roamProgress, type RoamPath, type RoamRun } from '../lib/stage/roam.ts';

export interface RoamDoor { obj: Object3D; base: number; from: number; to: number; shut?: [number, number]; open: number }
export interface RoamContext {
  groups: Group[];
  dolly: (q: number) => Frame;
  span: number;
  doors: RoamDoor[];
  /** Doors never open together: opening one shuts the other (the 2020 room's two: the lawn outside one, the aircraft outside the other). */
  exclusive: Array<[RoamDoor, RoamDoor]>;
  /** What is not solid: backdrops, the sky, water, what moves on its own. */
  skip: (o: Mesh) => boolean;
}
export interface Roam {
  active: boolean;
  /** The stage progress where he stands. */
  q: number;
  /** What E would do here: '' when nothing. */
  prompt: string;
  /** Builds each set's collision mesh, a set a frame. */
  prepare(): Promise<void>;
  enter(q: number): void;
  exit(): number;
  /** A frame of walking: moves him by the keys held and gives the stage its frame (the scroll's, with his eye). */
  step(dt: number): Frame;
  key(code: string, down: boolean): boolean;
  look(dx: number, dy: number): void;
  use(): void;
  /** Back onto the story's path, where it runs nearest. */
  home(): void;
  release(): void;
  /** Review only: where he is. */
  state(): { pos: [number, number, number]; yaw: number; set: number; run: number; riding: boolean; doors: number[]; ground: number | null; held: string; solids: number };
}

const KEYS = { fwd: ['KeyW', 'ArrowUp'], back: ['KeyS', 'ArrowDown'], left: ['KeyA'], right: ['KeyD'], turnL: ['ArrowLeft'], turnR: ['ArrowRight'], fast: ['ShiftLeft', 'ShiftRight'] } as const;
const HELD = new Set<string>(Object.values(KEYS).flat());
const RING: Array<[number, number]> = [[0, 0], [0.17, 0], [-0.17, 0], [0, 0.17], [0, -0.17]]; // where the floor is felt for: under him and a foot's length round
interface Solid { bvh: MeshBVH; group: Group; inv: Matrix4 }

export function createRoam(ctx: RoamContext): Roam {
  const { groups, dolly, span } = ctx, path: RoamPath = roamPath(dolly, span);
  const colliders: Array<MeshBVH | null | undefined> = groups.map(() => undefined);
  const pos = new Vector3(), vel = new Vector3(), held = new Set<string>();
  let yaw = 0, pitch = 0, run = 0, idx = 0, feet = NaN, under: number | null = null, heldBy = '', riding: { to: number; rate: number; from: Frame; blend: number } | null = null;
  const solids: Solid[] = [];
  const setOf = (o: Object3D): number => { let k: Object3D | null = o; while (k && !groups.includes(k as Group)) k = k.parent; return k ? groups.indexOf(k as Group) : -1; };
  const doors = ctx.doors.map((d) => ({ ...d, src: d, set: setOf(d.obj), open: 0, target: 0, way: 1, far: new Vector3(), a: new Vector3(), b: new Vector3() }));
  type Door = (typeof doors)[number];

  // ---- what is solid: one mesh a set, in the set's own frame (a set that stands in two places takes its mesh along)
  const collider = (i: number): MeshBVH | null => {
    const g = groups[i];
    g.updateMatrixWorld(true);
    const inv = new Matrix4().copy(g.matrixWorld).invert(), m = new Matrix4(), v = new Vector3(), parts: Array<{ o: Mesh; n: number }> = [];
    let total = 0;
    g.traverse((o) => {
      const mesh = o as Mesh & { isSkinnedMesh?: boolean; isInstancedMesh?: boolean };
      if (!mesh.isMesh || mesh.isSkinnedMesh || mesh.isInstancedMesh) return;
      const geo = mesh.geometry as BufferGeometry & { isInstancedBufferGeometry?: boolean };
      if (geo.isInstancedBufferGeometry || !geo.getAttribute('position') || ctx.skip(mesh)) return;
      const n = geo.index ? geo.index.count : geo.getAttribute('position').count;
      parts.push({ o: mesh, n: n - (n % 3) }); total += n - (n % 3);
    });
    if (!total) return null;
    const out = new Float32Array(total * 3);
    let at = 0;
    for (const { o, n } of parts) {
      const geo = o.geometry, p = geo.getAttribute('position'), ix = geo.index;
      m.multiplyMatrices(inv, o.matrixWorld);
      for (let k = 0; k < n; k++) { v.fromBufferAttribute(p, ix ? ix.getX(k) : k).applyMatrix4(m); out[at++] = v.x; out[at++] = v.y; out[at++] = v.z; } // fromBufferAttribute: the loader's quantized positions come out in metres
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(out, 3));
    return new MeshBVH(geo);
  };
  /** The sets he can touch: the ones that are drawn (his own and what shows through its doors), as they stand this frame. */
  const every: Array<Solid | null> = groups.map(() => null);
  const gather = (): void => {
    solids.length = 0;
    groups.forEach((group, k) => {
      const bvh = colliders[k];
      if (!bvh || !group.visible) return;
      const solid = (every[k] ??= { bvh, group, inv: new Matrix4() });
      group.updateMatrixWorld();
      solid.inv.copy(group.matrixWorld).invert();
      solids.push(solid);
    });
  };

  // ---- the floor under a point: the highest thing a stride up or a drop down from his feet; null where nothing is built
  const ray = new Ray(), hit = new Vector3();
  const floor = (x: number, z: number, from: number): number | null => {
    let top: number | null = null;
    for (const s of solids) for (const [ox, oz] of RING) {
      ray.origin.set(x + ox, from + ROAM.step + 0.04, z + oz).applyMatrix4(s.inv);
      ray.direction.set(0, -1, 0); // the sets only ever turn about the upright
      const h = s.bvh.raycastFirst(ray, DoubleSide, 0, ROAM.step + ROAM.drop + 1.2);
      if (!h) continue;
      const y = hit.copy(h.point).applyMatrix4(s.group.matrixWorld).y;
      if (top === null || y > top) top = y;
    }
    return top;
  };

  /** The floor he stands on when he is put down somewhere (the scroll's camera, a seat): of all that is under the eye, what is nearest a standing height below it. */
  const stand = (): number => {
    const want = pos.y - ROAM.eye;
    let best = want, bd = Infinity;
    for (const s of solids) for (const [ox, oz] of RING) {
      ray.origin.set(pos.x + ox, pos.y - 0.05, pos.z + oz).applyMatrix4(s.inv);
      ray.direction.set(0, -1, 0);
      for (const h of s.bvh.raycast(ray, DoubleSide, 0, 3)) {
        const y = hit.copy(h.point).applyMatrix4(s.group.matrixWorld).y, d = Math.abs(y - want);
        if (d < bd) { bd = d; best = y; }
      }
    }
    return best;
  };

  // ---- walls and furniture: the body pushed out of whatever it stands in, across the floor only (the rays keep his height)
  const seg = new Line3(), box = new Box3(), tp = new Vector3(), cp = new Vector3(), was = new Vector3();
  const pushOut = (p: Vector3): void => {
    for (const s of solids) {
      seg.start.set(p.x, feet + ROAM.eye - 0.2, p.z).applyMatrix4(s.inv);
      seg.end.set(p.x, feet + ROAM.clear + ROAM.radius, p.z).applyMatrix4(s.inv);
      was.copy(seg.start);
      box.makeEmpty().expandByPoint(seg.start).expandByPoint(seg.end);
      box.min.addScalar(-ROAM.radius); box.max.addScalar(ROAM.radius);
      s.bvh.shapecast({
        intersectsBounds: (b) => b.intersectsBox(box),
        intersectsTriangle: (tri: ExtendedTriangle) => {
          const d = tri.closestPointToSegment(seg, tp, cp);
          if (d >= ROAM.radius) return;
          const dir = cp.sub(tp);
          dir.y = 0;
          const l = dir.length();
          if (l < 1e-6) return; // straight above or below: not a wall
          dir.multiplyScalar((ROAM.radius - d) / l);
          seg.start.add(dir); seg.end.add(dir);
        },
      });
      const out = seg.start.sub(was), len = out.length();
      if (len > 1e-6) { out.transformDirection(s.group.matrixWorld); p.x += out.x * len; p.z += out.z * len; }
    }
  };

  // ---- doors: each leaf a line from its hinge, turned by how far it stands open
  for (const d of doors) {
    const b = new Box3(), inv = new Matrix4(), v = new Vector3();
    d.obj.updateMatrixWorld(true);
    inv.copy(d.obj.matrixWorld).invert();
    d.obj.traverse((o) => {
      if (!(o as Mesh).isMesh) return;
      const g = (o as Mesh).geometry;
      g.computeBoundingBox();
      for (const c of [g.boundingBox!.min, g.boundingBox!.max]) b.expandByPoint(v.copy(c).applyMatrix4(o.matrixWorld).applyMatrix4(inv));
    });
    const c = b.getCenter(new Vector3());
    d.far.set(c.x * 2, 1, c.z * 2); // the leaf runs from its hinge, at its own origin, through its middle
  }
  const leaf = (d: Door): void => { d.obj.updateMatrixWorld(true); d.a.set(0, 1, 0).applyMatrix4(d.obj.matrixWorld); d.b.copy(d.far).applyMatrix4(d.obj.matrixWorld); };
  const swing = (d: Door): void => { const e = d.open * d.open * (3 - 2 * d.open); d.obj.rotation.y = d.base + d.way * (Math.PI / 2) * e; d.src.open = e; };
  const close: Door[] = []; // the doors of his set and the ones next to it, their leaves placed: once a frame
  const doorsNear = (): void => {
    const s = path.runs[run].set;
    close.length = 0;
    for (const d of doors) if (Math.abs(d.set - s) <= 1 || (s === 12 && d.set === 0) || (s === 0 && d.set === 12)) { leaf(d); close.push(d); }
  };
  const sameFloor = (d: Door): boolean => Math.abs(d.a.y - 1 - feet) < 1.5;
  const pushDoors = (p: Vector3): void => {
    for (const d of close) {
      if (!sameFloor(d)) continue;
      const ax = d.a.x, az = d.a.z, bx = d.b.x - ax, bz = d.b.z - az, l2 = bx * bx + bz * bz || 1, t = Math.max(0, Math.min(1, ((p.x - ax) * bx + (p.z - az) * bz) / l2));
      const cx = ax + bx * t, cz = az + bz * t, dx = p.x - cx, dz = p.z - cz, dist = Math.hypot(dx, dz), r = ROAM.radius + 0.03;
      if (dist < r && dist > 1e-5) { p.x = cx + (dx / dist) * r; p.z = cz + (dz / dist) * r; }
    }
  };
  /** The door he would open: the nearest within reach, in front of him. */
  const facing = (): Door | null => {
    let best: Door | null = null, bd: number = ROAM.reach;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    for (const d of close) {
      const mx = (d.a.x + d.b.x) / 2 - pos.x, mz = (d.a.z + d.b.z) / 2 - pos.z, dist = Math.hypot(mx, mz);
      if (dist > bd || !sameFloor(d)) continue;
      if (dist > 0.8 && (mx * fx + mz * fz) / dist < 0.2) continue;
      best = d; bd = dist;
    }
    return best;
  };

  // ---- where he is along the story
  /** Past the end of a leg (or before its beginning), near enough to where the path crosses. */
  const beyond = (r: RoamRun, end: boolean, within: number): boolean => {
    const at = end ? r.b : r.a, [hx, hz] = roamHeading(path, r, end), dx = pos.x - path.x[at], dz = pos.z - path.z[at];
    return Math.hypot(dx, dz) < within && Math.abs(feet + ROAM.eye - path.y[at]) < 1.5 && (dx * hx + dz * hz) * (end ? 1 : -1) > 0.03;
  };
  // a doorway is narrow; the open walk gives way to its next city across its whole width
  const reach = (a: RoamRun, b: RoamRun): number => (a.set >= 8 && b.set <= 10 ? 40 : 1.7);
  const last = path.runs.length - 1;
  const place = (): void => {
    const r = path.runs[run], next = path.runs[run + 1], prev = path.runs[run - 1];
    if (next && r.next !== 'ride' && beyond(r, true, reach(r, next))) { run += 1; idx = next.a; }
    else if (prev && prev.next !== 'ride' && beyond(r, false, reach(prev, r))) { run -= 1; idx = prev.b; }
    else {
      idx = roamNearest(path, r, pos.x, feet + ROAM.eye, pos.z, idx);
      // the story ends in the room it began in: there, whichever of its two legs runs nearer is his
      if (run === 0 || run === last) {
        const other = run === 0 ? last : 0, o = path.runs[other], j = roamNearest(path, o, pos.x, feet + ROAM.eye, pos.z, -1);
        const dHere = Math.hypot(path.x[idx] - pos.x, path.z[idx] - pos.z), dThere = Math.hypot(path.x[j] - pos.x, path.z[j] - pos.z);
        if (dThere + 0.4 < dHere) { run = other; idx = j; }
      }
    }
  };
  const seatNear = (): number => { const r = path.runs[run]; return r.next === 'ride' && Math.hypot(pos.x - path.x[r.b], pos.z - path.z[r.b]) < ROAM.seat ? r.ride! : -1; };
  /** Where a ride put him down: within reach of his leg's start, the way back is offered. */
  const landedNear = (): number => { const r = path.runs[run], prev = path.runs[run - 1]; return prev?.next === 'ride' && Math.hypot(pos.x - path.x[r.a], pos.z - path.z[r.a]) < ROAM.seat ? prev.ride! : -1; };
  const board = (k: number): void => { const ride = ROAM.rides[k]; riding = { to: ride.to / span, rate: ride.rate / span, from: eye(dolly(api.q)), blend: 0 }; held.clear(); };
  const mix = (a: Frame, b: Frame, t: number): Frame => ({ ...b, cam: [0, 1, 2].map((i) => a.cam[i] + (b.cam[i] - a.cam[i]) * t) as Frame['cam'], look: [0, 1, 2].map((i) => a.look[i] + (b.look[i] - a.look[i]) * t) as Frame['look'], fov: a.fov + (b.fov - a.fov) * t });

  const aim = (f: Frame): void => {
    pos.set(...f.cam);
    const dx = f.look[0] - f.cam[0], dy = f.look[1] - f.cam[1], dz = f.look[2] - f.cam[2];
    yaw = Math.atan2(-dx, -dz); pitch = Math.max(-1.2, Math.min(1.2, Math.atan2(dy, Math.hypot(dx, dz)))); vel.set(0, 0, 0);
    feet = NaN; // found on his first frame there (stand)
  };
  const eye = (base: Frame): Frame => {
    const c = Math.cos(pitch);
    return { ...base, cam: [pos.x, pos.y, pos.z], look: [pos.x - Math.sin(yaw) * c, pos.y + Math.sin(pitch), pos.z - Math.cos(yaw) * c], fov: ROAM.fov };
  };
  const trial = new Vector3();

  const api: Roam = {
    active: false, q: 0, prompt: '',
    async prepare() {
      for (let i = 0; i < groups.length; i++) {
        if (colliders[i] !== undefined) continue;
        colliders[i] = collider(i);
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      }
    },
    enter(q) {
      const i = Math.round(Math.max(0, Math.min(1, q)) * path.n), c = (i / path.n) * span, ride = ROAM.rides.find((r) => c > r.from && c < r.to);
      run = path.runs.findIndex((r) => i >= r.a && i <= r.b);
      if (run < 0) run = Math.max(0, path.runs.findIndex((r) => r.a > i) - 1); // inside a ride: the leg it leaves
      idx = Math.max(path.runs[run].a, Math.min(path.runs[run].b, i));
      aim(dolly(q));
      riding = ride ? { to: ride.to / span, rate: ride.rate / span, from: dolly(q), blend: 1 } : null;
      api.q = q; api.active = true; held.clear();
      for (const d of doors) { // as the scroll left them
        const k = Math.min(1, Math.max(0, (q - d.from) / (d.to - d.from))), s = d.shut ? Math.min(1, Math.max(0, (q - d.shut[0]) / (d.shut[1] - d.shut[0]))) : 0;
        d.open = d.target = k > 0.5 && s < 0.5 ? 1 : 0; d.way = 1;
        swing(d);
      }
    },
    exit() { api.active = false; held.clear(); api.prompt = ''; riding = null; return api.q; },
    key(code, down) {
      if (!HELD.has(code)) return false;
      if (down) held.add(code); else held.delete(code);
      return true;
    },
    look(dx, dy) { yaw -= dx * ROAM.look; pitch = Math.max(-1.2, Math.min(1.2, pitch - dy * ROAM.look)); },
    release() { held.clear(); },
    use() {
      if (riding) { riding.rate = Math.max(riding.rate, (ROAM.rides[0].rate * 3) / span); riding.blend = 1; return; } // again, to hurry it
      const seat = seatNear(), landed = landedNear();
      doorsNear();
      if (seat >= 0) { board(seat); return; }
      if (landed >= 0) { // back to the aircraft: a cut, as the story's own is
        const c = ROAM.rides[landed].again / span;
        run = path.runs.findIndex((r) => path.q[r.a] <= c && path.q[r.b] >= c);
        idx = Math.round(c * path.n); api.q = c; aim(dolly(c));
        return;
      }
      const d = facing();
      if (!d) return;
      if (d.open === 0) { leaf(d); d.way = (pos.x - d.a.x) * (d.b.z - d.a.z) - (pos.z - d.a.z) * (d.b.x - d.a.x) > 0 ? -1 : 1; } // it swings away from him, whichever side he stands
      d.target = d.target > 0.5 ? 0 : 1;
      if (d.target) for (const [a, b] of ctx.exclusive) { const other = a === d.src ? b : b === d.src ? a : null; if (other) for (const o of doors) if (o.src === other) o.target = 0; } // the other door of the pair shuts
    },
    home() { if (riding) return; idx = roamNearest(path, path.runs[run], pos.x, feet + ROAM.eye, pos.z, -1); aim(dolly(path.q[idx])); },
    step(dt) {
      for (const d of doors) if (d.open !== d.target) { d.open = d.target > d.open ? Math.min(d.target, d.open + dt / 0.5) : Math.max(d.target, d.open - dt / 0.5); swing(d); }
      if (riding) {
        const start = path.q[path.runs[run].b];
        if (riding.blend < 1) { // his eye eases into the seat before anything plays
          riding.blend = Math.min(1, riding.blend + dt / 0.7);
          const t = riding.blend * riding.blend * (3 - 2 * riding.blend);
          api.q = Math.max(api.q, start); api.prompt = '';
          return mix(riding.from, dolly(start), t);
        }
        api.q = Math.min(riding.to, Math.max(api.q, start) + riding.rate * dt);
        const f = dolly(api.q);
        if (api.q >= riding.to) {
          riding = null; aim(f);
          run = path.runs.findIndex((r) => path.q[r.a] >= api.q - 1e-9);
          if (run < 0) run = path.runs.length - 1;
          idx = path.runs[run].a;
        }
        api.prompt = '';
        return f;
      }
      gather();
      doorsNear();
      const on = (k: readonly string[]) => k.some((c) => held.has(c));
      yaw += ((on(KEYS.turnL) ? 1 : 0) - (on(KEYS.turnR) ? 1 : 0)) * ROAM.turn * dt;
      const f = (on(KEYS.fwd) ? 1 : 0) - (on(KEYS.back) ? 1 : 0), s = (on(KEYS.right) ? 1 : 0) - (on(KEYS.left) ? 1 : 0), n = Math.hypot(f, s) || 1, speed = on(KEYS.fast) ? ROAM.run : ROAM.walk;
      const sy = Math.sin(yaw), cy = Math.cos(yaw), k = 1 - Math.exp(-ROAM.ease * dt);
      vel.x += (((-sy * f + cy * s) / n) * speed - vel.x) * k;
      vel.z += (((-cy * f - sy * s) / n) * speed - vel.z) * k;
      if (!f && !s && Math.abs(vel.x) + Math.abs(vel.z) < 0.004) vel.x = vel.z = 0;
      if (Number.isNaN(feet)) feet = stand();
      let ground = floor(pos.x, pos.z, feet);
      const tryMove = (mx: number, mz: number): boolean => {
        trial.set(pos.x + mx, pos.y, pos.z + mz);
        pushOut(trial); pushOut(trial); pushDoors(trial);
        const g = floor(trial.x, trial.z, feet);
        if (g === null ? ground !== null : feet - g > ROAM.drop) { heldBy = g === null ? 'edge' : 'drop'; return false; } // the floor ends, or falls away: the edge holds him
        pos.x = trial.x; pos.z = trial.z; ground = g;
        if (g !== null) feet = g; // his feet are on it at once; the eye follows eased
        return true;
      };
      heldBy = '';
      const steps = Math.max(1, Math.min(6, Math.ceil((Math.hypot(vel.x, vel.z) * dt) / 0.07)));
      for (let i = 0; i < steps; i++) {
        const mx = (vel.x * dt) / steps, mz = (vel.z * dt) / steps;
        if (!tryMove(mx, mz) && !tryMove(mx, 0) && !tryMove(0, mz)) { vel.x = vel.z = 0; break; }
      }
      under = ground;
      if (ground !== null) feet = ground;
      pos.y += (feet + ROAM.eye - pos.y) * (1 - Math.exp(-12 * dt));
      place();
      api.q = roamProgress(path, path.runs[run], idx, pos.x, pos.z);
      const d = facing(), seat = seatNear(), landed = landedNear();
      api.prompt = seat >= 0 ? ROAM.rides[seat].prompt : landed >= 0 ? ROAM.rides[landed].back : d ? (d.target > 0.5 ? 'Close' : 'Open') : '';
      return eye(dolly(api.q));
    },
    state: () => ({ pos: [pos.x, pos.y, pos.z], yaw, set: path.runs[run].set, run, riding: !!riding, doors: doors.map((d) => d.open), ground: under, held: heldBy, solids: solids.length }),
  };
  return api;
}
