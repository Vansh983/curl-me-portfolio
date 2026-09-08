import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FLIGHT, flightAt, PHONE, phoneAt, phoneLayout, CLASSROOM_VIEW } from '../../src/lib/stage/flight.ts';
import { AUDITORIUM, TOP_ROW, SETS } from '../../src/lib/stage/sets.ts';
import { makeDolly, DOLLY } from '../../src/lib/stage/dolly.ts';
import { pieceIsLive, placementIsLive } from '../../src/lib/stage/bake.ts';

test('the aircraft remains airborne through the entire phone transition, with no landing', () => {
  for (const q of [FLIGHT.start, FLIGHT.campus, PHONE.raise, PHONE.transfer, PHONE.reveal]) assert.equal(flightAt(q).altitude, 55);
  const dolly = makeDolly(DOLLY);
  assert.equal(dolly(PHONE.raise).set, 5);
  assert.equal(dolly(0.85).set, 6);
  assert.equal(dolly(1).set, 6);
});

test('flight motion is finite, reversible, continuous and still under reduced motion', () => {
  let previous = flightAt(0);
  for (let i = 0; i <= 10000; i++) {
    const q = i / 10000, state = flightAt(q);
    assert.ok(Number.isFinite(state.altitude) && state.altitude >= 0);
    assert.ok(Math.abs(state.altitude - previous.altitude) < 0.6);
    assert.deepEqual(state, flightAt(q));
    assert.equal(flightAt(q, true).altitude, 55);
    assert.equal(flightAt(q, true).travel, 64);
    previous = state;
  }
  assert.deepEqual(flightAt(NaN), flightAt(0));
  assert.deepEqual(flightAt(-1), flightAt(0));
  assert.deepEqual(flightAt(2), flightAt(1));
});

test('moving scenery stays live; auditorium contains fixed seating and study material', () => {
  for (const p of SETS[5].props.filter((p) => p.live === 'flight')) {
    assert.ok(placementIsLive(p));
    assert.ok(pieceIsLive('mat:flightGround', 'flight'));
  }
  const props = SETS[6].props;
  assert.equal(props.filter((p) => p.build === 'auditoriumSeat' || p.build === 'auditoriumStudySeat').length, 96);
  for (const name of ['lectureBoard', 'dalhousieSign', 'studyNotes', 'halifaxSign']) assert.ok(props.some((p) => p.build === name));
  assert.ok(props.some((p) => p.model === 'laptop_14_aluminium'));
});

test('phone covers the viewport before the sole portal cut and is gone at the classroom reveal', () => {
  assert.ok(PHONE.framed < PHONE.zoom && PHONE.filled < PHONE.transfer);
  assert.equal(phoneAt(PHONE.transfer).zoom, 1);
  assert.equal(phoneAt(PHONE.transfer).visible, true);
  assert.equal(phoneAt(PHONE.reveal).visible, false);
  assert.equal(phoneAt(PHONE.framed, true).visible, false);
  assert.equal(DOLLY.filter((k) => k.portal).length, 1);
  const dolly = makeDolly(DOLLY);
  assert.equal(dolly(PHONE.transfer - 1e-6).set, 5);
  assert.equal(dolly(PHONE.transfer).set, 6);
  assert.deepEqual(dolly(PHONE.transfer).cam, dolly(PHONE.reveal).cam);
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

test('arrival stays seated in the highest row, and the campus is a model, not a picture', () => {
  const dolly=makeDolly(DOLLY);
  for(let q=PHONE.transfer;q<=1;q+=.001) assert.deepEqual(dolly(q).cam,CLASSROOM_VIEW.cam);
  assert.ok(Math.abs(CLASSROOM_VIEW.cam[1]-TOP_ROW.height-1.28)<1e-9);
  assert.equal(CLASSROOM_VIEW.cam[0], AUDITORIUM.studyX);
  assert.ok(CLASSROOM_VIEW.cam[2]>TOP_ROW.front && CLASSROOM_VIEW.cam[2]<TOP_ROW.back);
  assert.equal(SETS[6].props.find(p=>p.model==='laptop_14_aluminium')!.at[1],TOP_ROW.height+AUDITORIUM.tabletHeight);
  assert.ok(SETS[5].props.some(p=>p.model==='dalhousie_campus' && p.live==='flight'));
  assert.ok(!SETS[5].props.some(p=>['flightClouds','flightCampus','flightTerrain'].includes(p.build??'')));
});
