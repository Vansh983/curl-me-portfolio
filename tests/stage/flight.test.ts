import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FLIGHT, flightAt, PHONE, phoneAt, phoneLayout, CLASSROOM_VIEW, WINDOW_VIEW } from '../../src/lib/stage/flight.ts';
import { AUDITORIUM, TOP_ROW, DAIS, SETS, aisleHeight, LECTURE_ROWS } from '../../src/lib/stage/sets.ts';
import { makeDolly, DOLLY } from '../../src/lib/stage/dolly.ts';
import { pieceIsLive, placementIsLive } from '../../src/lib/stage/bake.ts';

test('the descent: high and level at the start, low and level at the end, a bank and the cloud deck between', () => {
  const a = flightAt(FLIGHT.start), b = flightAt(FLIGHT.end);
  assert.equal(a.altitude, FLIGHT.top); assert.equal(a.travel, 0); assert.equal(a.bank, 0);
  assert.equal(b.altitude, FLIGHT.low); assert.equal(b.travel, FLIGHT.distance); assert.ok(Math.abs(b.bank) < 1e-9);
  const mid = flightAt((FLIGHT.start + FLIGHT.end) / 2);
  assert.ok(mid.bank > FLIGHT.bank * 0.8, 'banked in the middle');
  let peak = 0;
  for (let q = FLIGHT.start; q <= FLIGHT.end; q += 0.0005) peak = Math.max(peak, flightAt(q).veil);
  assert.ok(peak > 0.95, 'the deck whites the window out on the way down');
  assert.ok(b.veil < 0.02 && a.veil < 0.05, 'clear above and below it');
  assert.ok(FLIGHT.low > 100, 'never lands: the phone transition happens airborne');
  for (const q of [PHONE.raise, PHONE.transfer]) assert.ok(flightAt(q).altitude >= FLIGHT.low);
  const dolly = makeDolly(DOLLY);
  assert.equal(dolly(PHONE.raise).set, 5);
  assert.equal(dolly(0.85).set, 6);
  assert.equal(dolly(1).set, 6);
});

test('flight motion is finite, monotonic, continuous and held at the end under reduced motion', () => {
  let previous = flightAt(0);
  for (let i = 0; i <= 10000; i++) {
    const q = i / 10000, state = flightAt(q);
    for (const v of Object.values(state)) assert.ok(Number.isFinite(v));
    assert.ok(state.altitude >= FLIGHT.low && state.altitude <= FLIGHT.top);
    assert.ok(state.altitude <= previous.altitude + 1e-9, 'only ever descends');
    assert.ok(state.travel >= previous.travel - 1e-9, 'only ever forward');
    assert.ok(Math.abs(state.altitude - previous.altitude) < 0.8 && Math.abs(state.travel - previous.travel) < 4 && Math.abs(state.bank - previous.bank) < 0.1);
    assert.deepEqual(state, flightAt(q));
    assert.deepEqual(flightAt(q, true), { altitude: FLIGHT.low, travel: FLIGHT.distance, bank: 0, veil: 0 });
    previous = state;
  }
  assert.deepEqual(flightAt(NaN), flightAt(0));
  assert.deepEqual(flightAt(-1), flightAt(0));
  assert.deepEqual(flightAt(2), flightAt(1));
});

test('moving scenery stays live; the cabin has a wing, seat-back screens and no banner; the auditorium its seats, lights and lectern', () => {
  const cabin = SETS[5].props;
  for (const p of cabin.filter((p) => p.live === 'flight')) assert.ok(placementIsLive(p));
  assert.ok(pieceIsLive('mat:flightGround', 'flight'));
  assert.ok(cabin.some((p) => p.build === 'halifax' && p.live === 'flight'), 'the city under the window');
  assert.ok(cabin.some((p) => p.build === 'cloudDeck' && p.live === 'flight'));
  assert.ok(cabin.some((p) => p.build === 'aircraftWing'));
  assert.ok(cabin.filter((p) => p.build === 'seatScreen').length >= 8, 'a screen on the back of every seat but the front row');
  assert.ok(!cabin.some((p) => p.build === 'flightSign'), 'no banner in the cabin');
  const props = SETS[6].props;
  assert.equal(props.filter((p) => p.build === 'auditoriumSeat' || p.build === 'auditoriumStudySeat').length, 96);
  for (const name of ['lectureBoard', 'dalhousieSign', 'studyNotes', 'projectorScreen', 'lectern', 'laptopSlide']) assert.ok(props.some((p) => p.build === name), name);
  assert.ok(props.filter((p) => p.live === 'downlight').length >= 12, 'downlights over the tiers');
  assert.ok(props.some((p) => p.model === 'laptop_14_aluminium'));
  const screen = props.find((p) => p.build === 'projectorScreen')!;
  assert.ok(screen.drop && screen.drop[0] >= PHONE.reveal && screen.drop[1] <= 0.95, 'the screen comes down during the walk');
});

test('phone covers the viewport before the sole portal cut and is gone at the classroom reveal', () => {
  assert.ok(PHONE.framed < PHONE.zoom && PHONE.filled < PHONE.transfer);
  assert.ok(PHONE.raise > FLIGHT.start && PHONE.transfer <= FLIGHT.end, 'raised in clear air after the deck, airborne to the cut');
  assert.ok(flightAt(PHONE.raise).veil < 0.05);
  assert.equal(phoneAt(PHONE.transfer).zoom, 1);
  assert.equal(phoneAt(PHONE.transfer).visible, true);
  assert.equal(phoneAt(PHONE.reveal).visible, false);
  assert.equal(phoneAt(PHONE.framed, true).visible, false);
  assert.equal(DOLLY.filter((k) => k.portal).length, 1);
  const dolly = makeDolly(DOLLY);
  assert.equal(dolly(PHONE.transfer - 1e-6).set, 5);
  assert.equal(dolly(PHONE.transfer).set, 6);
  assert.deepEqual(dolly(PHONE.transfer).cam, dolly(PHONE.reveal).cam);
  for (let q = PHONE.raise; q < PHONE.transfer; q += 0.001) assert.ok(Math.hypot(...dolly(q).cam.map((v, i) => v - WINDOW_VIEW.cam[i])) < 0.15, 'seated while the phone is up');
});

test('the phone has viewport coverage and a pixel-aligned destination crop on desktop and portrait', () => {
  for (const aspect of [390/844, 1, 1440/900, 21/9]) {
    const p=phoneLayout(aspect,1,1);
    assert.ok(.7*p.scale > 2*aspect && 1.5*p.scale > 2);
    const ex=aspect/p.scale-(.35-.045), ey=1/p.scale-(.75-.045);
    assert.ok(Math.hypot(Math.max(ex,0),Math.max(ey,0))+Math.min(Math.max(ex,ey),0)<.045, 'rounded glass covers viewport corners');
    assert.ok(p.x===0 && p.y===0);
    assert.ok(Math.abs(p.crop[0] - .7*p.scale/(2*aspect)) < 1e-12);
    assert.ok(Math.abs(p.crop[1] - 1.5*p.scale/2) < 1e-12);
  }
});

test('arrival is seated in the highest row, then the walk down the aisle ends behind the lectern facing the hall', () => {
  const dolly=makeDolly(DOLLY);
  for(let q=PHONE.transfer;q<=0.765;q+=.001) assert.deepEqual(dolly(q).cam,CLASSROOM_VIEW.cam);
  assert.ok(Math.abs(CLASSROOM_VIEW.cam[1]-TOP_ROW.height-1.28)<1e-9);
  assert.equal(CLASSROOM_VIEW.cam[0], AUDITORIUM.studyX);
  assert.ok(CLASSROOM_VIEW.cam[2]>TOP_ROW.front && CLASSROOM_VIEW.cam[2]<TOP_ROW.back);
  assert.equal(SETS[6].props.find(p=>p.model==='laptop_14_aluminium')!.at[1],TOP_ROW.height+AUDITORIUM.tabletHeight);
  // the aisle: every tier is two steps, the eye rides 1.6 m over them, never through a seat bank
  assert.equal(aisleHeight(AUDITORIUM.rear - 1), TOP_ROW.height);
  assert.equal(aisleHeight(LECTURE_ROWS[0].front - 0.5), 0);
  assert.ok(Math.abs(aisleHeight(LECTURE_ROWS[3].front + 0.3) - (LECTURE_ROWS[3].height - 0.18)) < 1e-9);
  for (let q = 0.81; q <= 0.93; q += 0.002) {
    const f = dolly(q);
    assert.ok(Math.abs(f.cam[0] - AUDITORIUM.aisleX) < 0.35, `in the aisle at ${q}: ${f.cam}`);
    assert.ok(f.cam[1] > aisleHeight(f.cam[2]) + 1.2, `above the steps at ${q}`);
    assert.ok(f.look[2] < f.cam[2], `facing the front at ${q}`);
  }
  const end = dolly(1);
  assert.ok(Math.abs(end.cam[0] - DAIS.lectern[0]) < 0.2 && end.cam[2] < DAIS.lectern[1] && end.cam[2] > DAIS.z[0], 'behind the lectern');
  assert.ok(Math.abs(end.cam[1] - (DAIS.height + 1.6)) < 1e-9);
  assert.ok(end.look[2] > end.cam[2] + 5, 'facing the hall');
  assert.ok(SETS[5].props.some(p=>p.model==='dalhousie_campus' && p.live==='flight'));
});

test('the podium hold keeps the lectern top and its laptop in the bottom of the frame, and the walk up never passes through the lectern', () => {
  const dolly = makeDolly(DOLLY);
  const [lx, lz] = DAIS.lectern;
  for (let q = 0.93; q <= 1; q += 0.001) {
    const c = dolly(q).cam;
    assert.ok(!(Math.abs(c[0] - lx) < 0.42 && Math.abs(c[2] - lz) < 0.34), `through the lectern at ${q.toFixed(3)}: ${c}`);
  }
  const laptop = { keys: [lx, DAIS.height + 1.12 + 0.02, lz - 0.05], screenTop: [lx, DAIS.height + 1.12 + 0.2, lz - 0.03] };
  const pitch = (from: number[], to: number[]) => Math.asin((to[1] - from[1]) / Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]));
  for (const q of [0.978, 0.99, 1]) {
    const f = dolly(q);
    const axis = pitch(f.cam, f.look), half = (f.fov / 2) * Math.PI / 180;
    for (const [name, at] of Object.entries(laptop)) assert.ok(axis - pitch(f.cam, at) < half - 0.06, `${name} below the frame at ${q}`);
    assert.ok(f.cam[2] < lz - 0.6, `standing back from the lectern at ${q}`);
  }
});
