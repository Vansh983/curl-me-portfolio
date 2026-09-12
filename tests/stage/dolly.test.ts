import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOLLY, makeDolly, APPROACH_SCALE } from '../../src/lib/stage/dolly.ts';
import { STAGE_SPAN } from '../../src/lib/stage/shot.ts';
import { PerspectiveCamera, Vector3 } from 'three';
import { SETS } from '../../src/lib/stage/sets.ts';
import { BUILT } from '../../src/lib/stage/built.ts';
import { PHONE, phoneAt, WINDOW_VIEW, CLASSROOM_VIEW } from '../../src/lib/stage/flight.ts';

const cameraAt = (q: number) => {
  const f = makeDolly(DOLLY)(q), aspect = 1440 / 900;
  const camera = new PerspectiveCamera(2 * Math.atan(Math.tan(f.fov * Math.PI / 360) / aspect) * 180 / Math.PI, aspect, 0.05, 100);
  camera.position.set(...f.cam);
  camera.lookAt(new Vector3(...f.look));
  camera.updateMatrixWorld();
  return camera;
};

test('the Delhi entrance stays in view on the final plaza approach', () => {
  const shell = SETS[4].shell!, door = shell.openings.find((o) => o.wall === 'z-')!;
  for (const q of [0.722, 0.746, 0.768]) {
    const p = new Vector3(door.at, Math.min(1.5, door.h), shell.z[0]).project(cameraAt(q * APPROACH_SCALE));
    assert.ok(Math.abs(p.x) < 0.85 && Math.abs(p.y) < 0.85 && p.z < 1, `door out of frame at ${q}: ${p.toArray()}`);
  }
});

test('the Delhi desk views keep the full awards shelf in frame on a laptop', () => {
  const awards = SETS[4].props.find((p) => p.build === 'awards')!;
  for (const q of [0.838, 0.866]) {
    const camera = cameraAt(q * APPROACH_SCALE);
    for (const part of BUILT.awards()) for (let i = 0; i < part.pos.length; i += 3) {
      const p = new Vector3(part.pos[i], part.pos[i + 1], part.pos[i + 2]);
      p.applyAxisAngle(new Vector3(0, 1, 0), (awards.rot?.[1] ?? 0) * Math.PI / 180).add(new Vector3(...awards.at)).project(camera);
      assert.ok(Math.abs(p.x) < 0.95 && Math.abs(p.y) < 0.95 && p.z < 1, `award cropped at ${q}: ${p.toArray()}`);
    }
  }
});

test('keys are ordered in q from 0 to 1 and land on the thirteen sets', () => {
  assert.equal(DOLLY[0].q, 0);
  assert.equal(DOLLY[DOLLY.length - 1].q, 1);
  for (let k = 1; k < DOLLY.length; k++) assert.ok(DOLLY[k].q > DOLLY[k - 1].q);
  assert.deepEqual([...new Set(DOLLY.map((k) => k.set))], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
});

test('blend windows come in pairs, 0 then 1, and the set flips inside them', () => {
  const dolly = makeDolly(DOLLY);
  const zeros = DOLLY.filter((k) => k.blend === 0), ones = DOLLY.filter((k) => k.blend === 1);
  assert.equal(zeros.length, 12);
  assert.equal(ones.length, 12);
  for (let w = 0; w < zeros.length; w++) {
    const a = zeros[w], b = ones[w];
    assert.ok(b.q > a.q);
    const mid = (a.q + b.q) / 2;
    assert.equal(dolly(a.q + 1e-6).set, a.set);
    assert.equal(dolly(mid + 1e-6).set, b.portal ? a.set : b.set);
    if (b.soft) assert.equal(dolly(mid).envDip, 1, 'an open-air threshold keeps the light up'); else assert.ok(dolly(mid).envDip < 0.2);
    assert.equal(dolly(a.q - 0.01).envDip, 1);
    for (const q of [a.q + 1e-6, mid, b.q - 1e-6]) {
      assert.equal(dolly(q).from, a.set);
      assert.equal(dolly(q).into, b.set);
    }
    const outside = dolly(a.q - 0.01);
    assert.equal(outside.from, outside.set);
    assert.equal(outside.into, outside.set);
  }
});

test('equal scroll increments keep bounded walking and head turns; only the covered phone portal cuts', () => {
  // the stage runs over STAGE_SPAN chapters of scroll, so a thousandth of q is a fixed number of pixels per chapter: the bounds scale with the span
  const dolly = makeDolly(DOLLY);
  const dir = (f: { cam: number[]; look: number[] }) => {
    const v = [f.look[0] - f.cam[0], f.look[1] - f.cam[1], f.look[2] - f.cam[2]];
    const n = Math.hypot(...v);
    return v.map((x) => x / n);
  };
  let prev = dolly(0);
  for (let i = 1; i <= 1000; i++) {
    const f = dolly(i / 1000);
    const d = Math.hypot(f.cam[0] - prev.cam[0], f.cam[1] - prev.cam[1], f.cam[2] - prev.cam[2]);
    const a = dir(prev), b = dir(f);
    const deg = (Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])) * 180) / Math.PI;
    const portal = (i - 1) / 1000 < PHONE.transfer && i / 1000 >= PHONE.transfer;
    if (portal) { assert.equal(phoneAt(i / 1000).zoom, 1); prev = f; continue; }
    assert.ok(d < 0.02 * STAGE_SPAN, `cam step ${d} at ${i}`);
    assert.ok(deg < 0.67 * STAGE_SPAN, `turn ${deg} degrees at ${i}`);
    assert.ok(f.fov >= 55 && f.fov <= 80, `fov ${f.fov}`); // the horizontal field: a laptop shows the room
    prev = f;
  }
});

test('the dolly is inside the doorway when it says it is', () => {
  const dolly = makeDolly(DOLLY);
  // the ring: north out of the apartment, east out of the 2010 room, south out of the lab, across the plaza and
  // north into the 2020 room, west back in
  const jambs = DOLLY.filter((k) => k.blend === 0);
  const at = (k: { cam: number[] }, x: number, z: number) => Math.abs(k.cam[0] - x) < 0.05 && Math.abs(k.cam[2] - z) < 0.1;
  assert.ok(at(jambs[0], -5.45, 2.3), `${jambs[0].cam}`);
  assert.ok(at(jambs[1], -4.85, 6.6), `${jambs[1].cam}`);
  assert.ok(at(jambs[2], 1.4, 4.75), `${jambs[2].cam}`);
  assert.ok(at(jambs[3], -0.7, -0.1), `${jambs[3].cam}`); // the 2020 room's south door
  assert.ok(at(jambs[4], -2.35, 1.6), `${jambs[4].cam}`); // its west door, into the passage to the brick door
  assert.ok(at(jambs[5], WINDOW_VIEW.cam[0], WINDOW_VIEW.cam[2]), `${jambs[5].cam}`);
  assert.ok(at(jambs[6], -1.3, -15.8), `${jambs[6].cam}`); // the auditorium's front west door, out to Sydney
  assert.ok(at(jambs[7], -6.85, -17.95), `${jambs[7].cam}`); // the hacker house's south door beside the window, out to Vancouver
  assert.ok(at(jambs[8], -10.5, -10.8) && at(jambs[9], -10.5, 4.4), `the thresholds along the terrace: ${jambs[8].cam} ${jambs[9].cam}`);
  assert.ok(at(jambs[10], -10.5, 23.4), `the door back into the house at the terrace's end: ${jambs[10].cam}`);
  assert.ok(at(jambs[11], 23.4, 33.5), `the door out of the back of the hall, at the top of the rake: ${jambs[11].cam}`);
  for (const j of jambs) assert.ok(Math.abs(dolly(j.q).cam[0] - j.cam[0]) < 0.05 && Math.abs(dolly(j.q).cam[2] - j.cam[2]) < 0.1);
  assert.equal(dolly(1).set, 12);
  assert.deepEqual(dolly(PHONE.reveal).cam, CLASSROOM_VIEW.cam);
  // heading north through the south door, the desk on the far wall dead ahead
  const inRoom = dolly(jambs[3].q + 0.02);
  assert.equal(inRoom.set, 4);
  assert.ok(inRoom.look[2] - inRoom.cam[2] > 1.5 && Math.abs(inRoom.look[0] - inRoom.cam[0]) < 0.6, `${inRoom.cam} -> ${inRoom.look}`);
});
