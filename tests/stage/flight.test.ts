import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FLIGHT, flightAt, PHONE, phoneAt } from '../../src/lib/stage/flight.ts';
import { SETS } from '../../src/lib/stage/sets.ts';
import { makeDolly, DOLLY } from '../../src/lib/stage/dolly.ts';
import { pieceIsLive, placementIsLive } from '../../src/lib/stage/bake.ts';

test('flight takes off, cruises and lands before entering Halifax', () => {
  assert.equal(flightAt(FLIGHT.takeoff).altitude, 0);
  assert.equal(flightAt(FLIGHT.cruise).altitude, 65);
  assert.equal(flightAt(FLIGHT.landed).altitude, 0);
  assert.equal(flightAt(FLIGHT.landed).arrived, true);
  const dolly = makeDolly(DOLLY);
  assert.equal(dolly(FLIGHT.landed).set, 5);
  assert.equal(dolly(0.85).set, 6);
  assert.equal(dolly(1).set, 0);
});

test('flight motion is finite, reversible, continuous and still under reduced motion', () => {
  let previous = flightAt(0);
  for (let i = 0; i <= 10000; i++) {
    const q = i / 10000, state = flightAt(q);
    assert.ok(Number.isFinite(state.altitude) && state.altitude >= 0);
    assert.ok(Math.abs(state.altitude - previous.altitude) < 0.6);
    assert.deepEqual(state, flightAt(q));
    assert.equal(flightAt(q, true).altitude, 0);
    previous = state;
  }
  assert.deepEqual(flightAt(NaN), flightAt(0));
  assert.deepEqual(flightAt(-1), flightAt(0));
  assert.deepEqual(flightAt(2), flightAt(1));
});

test('moving scenery stays live; classroom reuses credited furniture and contains study material', () => {
  for (const p of SETS[5].props.filter((p) => p.live === 'flight')) {
    assert.ok(placementIsLive(p));
    assert.ok(pieceIsLive('mat:flightGround', 'flight'));
  }
  const props = SETS[6].props;
  assert.equal(props.filter((p) => p.model === 'SchoolChair_01').length, 12);
  for (const name of ['lectureBoard', 'dalhousieSign', 'studyNotes', 'halifaxSign']) assert.ok(props.some((p) => p.build === name));
  assert.ok(props.some((p) => p.model === 'laptop_14_aluminium'));
});

test('phone covers the viewport before the sole portal cut and is gone at the classroom reveal', () => {
  assert.ok(PHONE.shutter < PHONE.zoom && PHONE.filled < PHONE.transfer);
  assert.equal(phoneAt(PHONE.transfer).zoom, 1);
  assert.equal(phoneAt(PHONE.transfer).visible, true);
  assert.equal(phoneAt(PHONE.reveal).visible, false);
  assert.equal(phoneAt(PHONE.reveal).classroom, 1);
  assert.equal(phoneAt(PHONE.framed, true).visible, false);
  assert.equal(DOLLY.filter((k) => k.portal).length, 1);
  const dolly = makeDolly(DOLLY);
  assert.equal(dolly(PHONE.transfer - 1e-6).set, 5);
  assert.equal(dolly(PHONE.transfer).set, 6);
  assert.deepEqual(dolly(PHONE.transfer).cam, dolly(PHONE.reveal).cam);
});
