import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOLLY, makeDolly } from '../../src/lib/stage/dolly.ts';
import { STAGE_SPAN, approach } from '../../src/lib/stage/shot.ts';
import { PerspectiveCamera, Vector3 } from 'three';
import { SETS, FLOQER, TOUR_SHIFT, DELHI } from '../../src/lib/stage/sets.ts';
import { WALK, TURN, MIST, walkZ } from '../../src/lib/stage/walk.ts';
import { BUILT } from '../../src/lib/stage/built.ts';
import { PHONE, phoneAt, WINDOW_VIEW, CLASSROOM_VIEW } from '../../src/lib/stage/flight.ts';

const cameraAt = (q: number) => {
  const f = makeDolly(DOLLY, false)(q), aspect = 1440 / 900;
  const camera = new PerspectiveCamera(2 * Math.atan(Math.tan(f.fov * Math.PI / 360) / aspect) * 180 / Math.PI, aspect, 0.05, 2600); // the stage's own range
  camera.position.set(...f.cam);
  camera.lookAt(new Vector3(...f.look));
  camera.updateMatrixWorld();
  return camera;
};

test('the 2020 room\'s door stays in view on the last steps to it, where it stands in Google\'s block', () => {
  const shell = SETS[4].shell!, door = shell.openings.find((o) => o.wall === 'z-')!;
  for (const q of [0.802, 0.805]) {
    const p = new Vector3(...DELHI.to([door.at, Math.min(1.5, door.h), shell.z[0]])).project(cameraAt(approach(q)));
    assert.ok(Math.abs(p.x) < 0.85 && Math.abs(p.y) < 0.85 && p.z < 1, `door out of frame at ${q}: ${p.toArray()}`);
  }
});

test('the Delhi desk views keep the full awards shelf in frame on a laptop', () => {
  const awards = SETS[4].props.find((p) => p.build === 'awards')!;
  for (const q of [0.838, 0.866]) {
    const camera = cameraAt(approach(q));
    for (const part of BUILT.awards()) for (let i = 0; i < part.pos.length; i += 3) {
      const p = new Vector3(part.pos[i], part.pos[i + 1], part.pos[i + 2]);
      p.applyAxisAngle(new Vector3(0, 1, 0), (awards.rot?.[1] ?? 0) * Math.PI / 180).add(new Vector3(...awards.at));
      if (q < DELHI.cut) p.set(...DELHI.to(p.toArray())); // the room stands behind Google's door until the cut
      p.project(camera);
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
  const dolly = makeDolly(DOLLY, false);
  const zeros = DOLLY.filter((k) => k.blend === 0), ones = DOLLY.filter((k) => k.blend === 1);
  assert.equal(zeros.length, 13);
  assert.equal(ones.length, 13);
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

test('equal scroll increments keep bounded walking and head turns; only the two covered portals cut', () => {
  // the stage runs over STAGE_SPAN chapters of scroll, so a thousandth of q is a fixed number of pixels per chapter: the bounds scale with the span
  const dolly = makeDolly(DOLLY); // the path as walked, every set in its place in the world
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
    const portal = DOLLY.find((k) => k.portal && (i - 1) / 1000 < k.q && i / 1000 >= k.q); // the two cuts: the phone's, covered by its screen; the door home, covered by the door
    if (portal) { if (portal.q === PHONE.transfer) assert.equal(phoneAt(i / 1000).zoom, 1); prev = f; continue; }
    assert.ok(d < 0.02 * STAGE_SPAN, `cam step ${d} at ${i}`);
    assert.ok(deg < 0.67 * STAGE_SPAN, `turn ${deg} degrees at ${i}`);
    assert.ok(f.fov >= 55 && f.fov <= 80, `fov ${f.fov}`); // the horizontal field: a laptop shows the room
    prev = f;
  }
});

test('the dolly is inside the doorway when it says it is', () => {
  const dolly = makeDolly(DOLLY, false);
  // north out of the apartment, east out of the 2010 room, south out of the lab, down Google's lawn and left into
  // the 2020 room, west out of it
  const jambs = DOLLY.filter((k) => k.blend === 0);
  const at = (k: { cam: number[] }, x: number, z: number) => Math.abs(k.cam[0] - x) < 0.05 && Math.abs(k.cam[2] - z) < 0.1;
  assert.ok(at(jambs[0], -5.45, 2.3), `${jambs[0].cam}`);
  assert.ok(at(jambs[1], -4.85, 6.6), `${jambs[1].cam}`);
  assert.ok(at(jambs[2], 1.4, 4.75), `${jambs[2].cam}`);
  { const [x, , z] = DELHI.to([-0.7, 0, -0.1]); assert.ok(at(jambs[3], x, z), `${jambs[3].cam}`); } // the 2020 room's south door, where it stands in the face of Google's block
  assert.ok(at(jambs[4], -2.35, 1.6), `${jambs[4].cam}`); // its west door, into the passage to the brick door
  assert.ok(at(jambs[5], WINDOW_VIEW.cam[0], WINDOW_VIEW.cam[2]), `${jambs[5].cam}`);
  assert.ok(at(jambs[6], -1.3, -15.8), `${jambs[6].cam}`); // the auditorium's front west door, out to Sydney
  assert.ok(at(jambs[7], -6.85, -17.95), `${jambs[7].cam}`); // the hacker house's south door beside the window, out to Vancouver
  // the walk's two open-air thresholds stand where the mist begins to gather, the city changing at its thickest
  assert.ok(at(jambs[8], WALK.x, walkZ(TURN.toronto - MIST + 0.04)) && at(jambs[9], WALK.x, walkZ(TURN.halifax - MIST + 0.04)), `the thresholds along the walk: ${jambs[8].cam} ${jambs[9].cam}`);
  assert.ok(at(jambs[10], WALK.x, WALK.door - 0.6), `the door out of Volta's room into the wing: ${jambs[10].cam}`);
  assert.ok(at(jambs[11], -10.5, 47.4 + TOUR_SHIFT), `the door out of the back of the hall, behind the stage: ${jambs[11].cam}`);
  assert.ok(at(jambs[12], FLOQER.door.x, FLOQER.z[1] - 0.1 + TOUR_SHIFT), `the door at the top of the hacker house's stair: ${jambs[12].cam}`);
  for (const j of jambs) assert.ok(Math.abs(dolly(j.q).cam[0] - j.cam[0]) < 0.05 && Math.abs(dolly(j.q).cam[2] - j.cam[2]) < 0.1);
  assert.equal(dolly(1).set, 0); // home
  assert.deepEqual(dolly(PHONE.reveal).cam, CLASSROOM_VIEW.cam);
  // in through the room's south door (own north; west in the world, where the room stands in Google's block), the desk on the far wall dead ahead
  const inRoom = dolly(jambs[3].q + 0.008); // a step inside the door
  assert.equal(inRoom.set, 4);
  assert.ok(inRoom.cam[0] - inRoom.look[0] > 1.5 && Math.abs(inRoom.look[2] - inRoom.cam[2]) < 0.6, `${inRoom.cam} -> ${inRoom.look}`);
  // the room's return to where it was built moves nothing in the frame: either side of the cut the camera is at the same place in the room
  const cut = DOLLY.find((k) => k.portal && k.blend === undefined)!, before = dolly(cut.q - 1e-7), after = dolly(cut.q);
  const there = DELHI.to(after.cam as [number, number, number]), looks = DELHI.to(after.look as [number, number, number]);
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(before.cam[i] - there[i]) < 1e-3 && Math.abs(before.look[i] - looks[i]) < 1e-3, `${before.cam} against ${there}`);
  assert.equal(cut.q, DELHI.back);
});
