import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WALK, WALK_SPEED, TURN, MIST, STRETCH, TRACK, LAPTOP, MARKS, walkZ, walkC, airAt, onWalk, cityAt, laptopAt, cueAt, markAt, seaplaneAt, streetcarAt, ferryAt } from '../../src/lib/stage/walk.ts';
import { SETS, WALK_TREES, WALK_LAMPS, ORCA, VOLTA_FLOOR, TOUR_SHIFT, FLOQER, STAGE_BIN, STAGE } from '../../src/lib/stage/sets.ts';
import { POSES, toWorld, turnDir, BRICK } from '../../src/lib/stage/world.ts';
import { DOLLY, makeDolly } from '../../src/lib/stage/dolly.ts';
import { STAGE_SPAN, CARD_SPAN, chapterStart, ch } from '../../src/lib/stage/shot.ts';
import { BLOCK } from '../../src/lib/stage/walk-built.ts';

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

test('the walk is one straight line at one pace, and the cities turn where their cards do', () => {
  assert.ok(Math.abs(walkZ(WALK.from.c) - WALK.from.z) < 1e-9 && Math.abs(walkZ(WALK.to.c) - WALK.to.z) < 1e-9);
  for (const c of [9.6, 10.5, 11.2, 12.4]) assert.ok(Math.abs(walkC(walkZ(c)) - c) < 1e-9);
  assert.equal(WALK.to.z, WALK.volta.z[0]); assert.equal(TURN.volta, WALK.to.c);
  assert.ok(WALK_SPEED > 14 && WALK_SPEED < 18.5, `${WALK_SPEED} m a chapter`); // a walking pace on the scroll, under the dolly's step bound
  assert.equal(TURN.toronto, chapterStart(9));
  assert.equal(TURN.halifax, chapterStart(10));
  assert.equal(chapterStart(11), 14, 'the degree two chapters later than it was');
  assert.equal(CARD_SPAN[8]! + CARD_SPAN[9]! + CARD_SPAN[10]!, 5);
  assert.ok(STRETCH.halifax[1] - STRETCH.halifax[0] > 22, 'Halifax has the longest walk');
  assert.ok(STRETCH.vancouver[1] === STRETCH.toronto[0] && STRETCH.toronto[1] === STRETCH.halifax[0] && STRETCH.halifax[1] === WALK.volta.z[0]);
  for (const s of Object.values(STRETCH)) assert.ok(s[1] - s[0] > 12, `a city has room: ${s}`);
  const dolly = makeDolly(DOLLY, false);
  for (let c = WALK.from.c + 0.1; c <= WALK.to.c; c += 0.01) { // a step or two after the corner the spline has settled on the line
    const f = dolly(ch(c));
    assert.ok(Math.abs(f.cam[0] - WALK.x) < 0.02 && Math.abs(f.cam[1] - 1.6) < 0.02, `off the line at ${c}: ${f.cam}`);
    assert.ok(Math.abs(f.cam[2] - walkZ(c)) < 0.25, `off the pace at ${c}: ${f.cam[2]} against ${walkZ(c)}`);
    const dx = f.look[0] - f.cam[0], dz = f.look[2] - f.cam[2];
    assert.ok(dz > 2 && Math.abs(Math.atan2(dx, dz)) < 17 * Math.PI / 180, `the head turns too far at ${c}`); // a glance, never a turn
  }
});

test('the air never jumps: a hundredth of a chapter changes the light by a little', () => {
  let prev = airAt(8.9);
  for (let c = 8.91; c <= WALK.out + 0.2; c += 0.01) {
    const a = airAt(c);
    assert.ok(Math.abs(a.exposure - prev.exposure) < 0.02 && Math.abs(a.sun.power - prev.sun.power) < 0.2 && Math.abs(a.tint.power - prev.tint.power) < 0.06, `light at ${c}`);
    assert.ok(Math.abs(a.mist - prev.mist) < 0.08 && Math.abs(a.season - prev.season) < 0.08 && Math.abs(a.cover - prev.cover) < 0.08 && Math.abs(a.lamps - prev.lamps) < 0.08, `air at ${c}`);
    assert.ok(Math.abs(a.mix - prev.mix) < 0.06 || a.sky !== prev.sky, `sky at ${c}`);
    const d = rgb(a.fog.color).map((v, i) => Math.abs(v - rgb(prev.fog.color)[i]));
    assert.ok(Math.max(...d) < 12, `fog colour at ${c}`);
    assert.ok(Math.abs(Math.hypot(...a.sun.dir) - 1) < 1e-6 && a.sun.dir[1] > 0.1);
    assert.ok(a.fog.far > a.fog.near && a.exposure > 0 && a.envPower > 0);
    prev = a;
  }
});

test('between two cities the mist closes in, and what stands far off changes inside it', () => {
  for (const turn of [TURN.toronto, TURN.halifax]) {
    const thick = airAt(turn);
    assert.ok(thick.mist > 0.98 && thick.fog.far < 200, 'at the turn nothing beyond 200 m shows');
    assert.ok(Math.abs(thick.mix - 0.5) < 0.02, 'the sky is half way');
    assert.ok(airAt(turn - MIST - 0.01).mist < 0.15 && airAt(turn + MIST + 0.01).mist < 0.15, 'clear either side');
    assert.notEqual(cityAt(turn - 0.001), cityAt(turn + 0.001));
  }
  assert.deepEqual([cityAt(9.5), cityAt(11), cityAt(12)], ['vancouver', 'toronto', 'halifax']);
  assert.ok(airAt(10).fog.far > 1500 && airAt(11).fog.far > 1500, 'a clear day in Vancouver and in Toronto');
  // the sets change where the mist is thickest
  const dolly = makeDolly(DOLLY);
  assert.equal(dolly(ch(TURN.toronto - 0.01)).set, 8); assert.equal(dolly(ch(TURN.toronto + 0.01)).set, 9);
  assert.equal(dolly(ch(TURN.halifax - 0.01)).set, 9); assert.equal(dolly(ch(TURN.halifax + 0.01)).set, 10);
  assert.equal(dolly(ch(TURN.volta + 0.2)).set, 10, "Volta's room is the Halifax set's");
});

test('the year goes one way: May, October, January; the snow lies only in Halifax; the lamps come on with the dusk', () => {
  let prev = airAt(8.9);
  for (let c = 8.9; c <= WALK.out; c += 0.02) {
    const a = airAt(c);
    assert.ok(a.season >= prev.season - 1e-9 && a.cover >= prev.cover - 1e-9 && a.lamps >= prev.lamps - 1e-9, `the year runs back at ${c}`);
    prev = a;
  }
  assert.equal(airAt(9.8).season, 0); assert.ok(Math.abs(airAt(TURN.toronto + MIST).season - 1) < 1e-9); assert.equal(airAt(12).season, 2);
  assert.equal(airAt(11).cover, 0); assert.equal(airAt(12).cover, 1);
  assert.equal(airAt(10).lamps, 0); assert.equal(airAt(12).lamps, 1);
  assert.equal(airAt(11).leaves, 1); assert.equal(airAt(9.8).leaves, 0); assert.equal(airAt(12).snow, 1); assert.equal(airAt(11).snow, 0);
  assert.ok(airAt(12).dim < 0.6 && airAt(10).dim === 1, 'the sky goes down with the day');
  assert.equal(airAt(TURN.volta - 0.1).inside, 0); assert.equal(airAt(TURN.volta + 0.2).inside, 1);
  assert.ok(onWalk(9) && onWalk(13.9) && !onWalk(8) && !onWalk(14.5));
});

test('the laptop comes up for the numbers as a city begins and goes down again', () => {
  assert.equal(LAPTOP.length, 3);
  assert.deepEqual(LAPTOP.map((w) => w.view).sort(), [0, 1, 2], 'the terminal, the editor, the app: a view a city');
  for (const w of LAPTOP) {
    assert.ok(w.up[0] < w.up[1] && w.up[1] < w.down[0] && w.down[0] < w.down[1]);
    assert.ok(Math.abs(laptopAt((w.up[1] + w.down[0]) / 2).lift - 1) < 1e-9, 'held up between');
    assert.equal(laptopAt(w.up[0] - 0.01).lift, 0); assert.equal(laptopAt(w.down[1] + 0.01).lift, 0);
    assert.equal(laptopAt((w.up[1] + w.down[0]) / 2).view, w.view);
  }
  for (const c of [9.9, 11.0, 12.3]) assert.equal(laptopAt(c).lift, 0, `the city has the frame at ${c}`);
  for (const m of MARKS) assert.equal(laptopAt(walkC(m.z - 4.5)).lift, 0, `${m.label} is come to with the laptop down`);
  assert.ok(airAt((LAPTOP[1].up[1] + LAPTOP[1].down[0]) / 2).mist > 0.9, 'up in the thick of the mist');
  assert.equal(laptopAt(TURN.halifax + 0.05).lift, 0, "down as winter begins: Invest Nova Scotia's mark has the frame");
  for (let c = 8.9; c < 13; c += 0.01) { const l = laptopAt(c).lift; assert.ok(l >= 0 && l <= 1); }
});

test('the seaplane leaves the water, the streetcar runs its track, the ferry crosses in Halifax only', () => {
  const start = seaplaneAt(9.3), end = seaplaneAt(TURN.toronto - 0.06);
  assert.ok(Math.abs(start.at[1] - (WALK.water + 0.55)) < 0.1 && end.at[1] > 30, `${start.at[1]} to ${end.at[1]}`);
  assert.ok(start.at[0] < WALK.path[0] - 20 && end.at[0] < start.at[0], 'out on the harbour, heading away');
  let prev = seaplaneAt(9.3);
  for (let c = 9.31; c < TURN.toronto; c += 0.01) { const p = seaplaneAt(c); assert.ok(p.at[2] >= prev.at[2] && p.at[1] >= prev.at[1] - 0.2 && Math.hypot(p.at[0] - prev.at[0], p.at[1] - prev.at[1], p.at[2] - prev.at[2]) < 9, `the seaplane at ${c}`); prev = p; }
  assert.ok(seaplaneAt(9.5).on && !seaplaneAt(10.6).on);
  let car = streetcarAt(TURN.toronto);
  for (let c = TURN.toronto; c <= TURN.halifax; c += 0.01) { const p = streetcarAt(c); assert.equal(p.at[0], TRACK.x); assert.ok(p.at[2] >= car.at[2] && p.at[2] - car.at[2] < 9, `the streetcar at ${c}`); car = p; }
  assert.ok(streetcarAt(TURN.toronto + 0.1).at[2] < walkZ(TURN.toronto + 0.1) - 15, 'behind him until the mist has lifted');
  assert.ok(streetcarAt(TURN.halifax).at[2] > WALK.door + 100, 'away up the track by the turn');
  assert.ok(TRACK.x - 1.4 > BLOCK.x1, "the track clears Volta's building");
  assert.ok(!ferryAt(11).on && ferryAt(12).on && ferryAt(12).at[0] < WALK.path[0] - 100, 'the ferry, well out on the harbour');
});

test('a cue runs from nothing to arrived over its chapters, and can leave', () => {
  assert.equal(cueAt(9.9, { at: [10, 10.2] }), 0);
  assert.equal(cueAt(10.3, { at: [10, 10.2] }), 1);
  assert.ok(cueAt(10.1, { at: [10, 10.2] }) > 0.5 && cueAt(10.1, { at: [10, 10.2] }) < 1);
  assert.ok(Math.abs(cueAt(10.1, { at: [10, 10.2], ease: 'inOut' }) - 0.5) < 1e-9);
  assert.equal(cueAt(10.6, { at: [10, 10.2], leave: [10.4, 10.5] }), 0);
});

test('the walk stands in the Vancouver set; nothing stands on the walk or on the track; the hall stands further north', () => {
  const [van, tor, hal] = [SETS[8], SETS[9], SETS[10]];
  assert.deepEqual([van.sky, tor.sky, hal.sky], ['vancouver', 'toronto', 'halifax']);
  assert.ok(!van.baked && !tor.baked && hal.baked && hal.bake?.env === 'studio', "the walk is lit live, its light changes; Volta's room is baked as a room");
  assert.ok(hal.also?.includes(8), 'the promenade shows from Halifax');
  for (const name of ['promenade', 'walkLand', 'beanHouse', 'quayRail', 'voltaBlock', 'tramTrack']) assert.ok(van.props.some((p) => p.build === name), name);
  assert.equal(van.props.filter((p) => p.build === 'walkLamp').length, WALK_LAMPS.length);
  for (const z of WALK_LAMPS) assert.ok(z > WALK.south && z < WALK.volta.z[0]);
  for (const t of WALK_TREES) {
    assert.ok(t.x > WALK.path[1] + 0.5, `a tree on the paving at ${t.z}`);
    assert.ok(Math.abs(t.x - TRACK.x) > 2.2 || t.z < STRETCH.toronto[0], `a tree on the track at ${t.z}`);
    assert.ok(Math.hypot(t.x - ORCA.x, t.z - ORCA.z) > 2.8, `a tree in the whale at ${t.z}`);
    assert.ok(!(t.x < BLOCK.x1 + 1 && t.z > BLOCK.z0 - 1), `a tree in Volta's wall at ${t.z}`);
  }
  // no board, no banner, no photo on a stand, no booth: the cities are the things themselves
  for (const s of [van, tor, hal]) for (const p of s.props) assert.ok(!/^(photo|beanBooth|sign|hang|logoWebSummit|logoElevate|logoInvestNS|logoProductHunt|expoBooth)/.test(p.build ?? ''), `${s.id}: ${p.build}`);
  for (const [x] of [...VOLTA_FLOOR.chairs, ...VOLTA_FLOOR.tables, ...VOLTA_FLOOR.tubs]) assert.ok(x < WALK.x - 1.2, 'the tables and chairs clear of the walk through the room');
  assert.deepEqual(SETS[11].at, [0, 0, TOUR_SHIFT]); assert.deepEqual(SETS[12].at, [0, 0, TOUR_SHIFT]);
  assert.ok(TOUR_SHIFT > 28 && TOUR_SHIFT < 28.3);
  assert.ok(Math.abs(STAGE_SPAN - 19.2) < 1e-9);
});

test('the end is walked: the door at the top of Floqer\'s stair is the far end of the passage behind the apartment\'s brick door, and the story ends in the room it began in', () => {
  assert.ok(!DOLLY.some((k) => k.portal && k.set === 0), 'no cut into the apartment');
  assert.equal(DOLLY.filter((k) => k.portal && k.blend !== undefined).length, 1, 'the phone is the only portal between two sets');
  const last = DOLLY[DOLLY.length - 1];
  assert.equal(last.set, 0);
  assert.ok(last.cam[0] > -8.9 && last.cam[0] < -4.2 && last.cam[2] > -2.8 && last.cam[2] < 2.2, `inside the apartment: ${last.cam}`);
  // every set stands in one place: the apartment where the story began, Floqer's door at the brick passage's end, opening west into it
  assert.deepEqual(POSES[0].at, [0, 0, 0]);
  const door = toWorld(12, [FLOQER.door.x, FLOQER.floor + FLOQER.stair.n * FLOQER.stair.rise, FLOQER.z[1] - 0.09 + 0.23 + TOUR_SHIFT]);
  assert.ok(Math.abs(door[0] - (BRICK.x + BRICK.length)) < 1e-9 && Math.abs(door[1]) < 1e-9 && Math.abs(door[2] - BRICK.z) < 1e-9, `${door}`);
  const north = turnDir(12, [0, 0, 1]);
  assert.ok(Math.abs(north[0] + 1) < 1e-9 && Math.abs(north[2]) < 1e-9, 'the house\'s north is the world\'s west');
  assert.ok(!SETS[0].props.some((p) => p.build === 'doorLeaf'), 'no white leaf in the apartment');
  assert.ok(SETS[12].props.some((p) => p.build === 'doorLeafHome') && !SETS[12].props.some((p) => p.build === 'landing'));
  assert.ok(STAGE_BIN[2] > STAGE.centre + 6 && STAGE_BIN[0] < WALK.x - 0.6, 'the bin backstage, off the walk on its right');
});
