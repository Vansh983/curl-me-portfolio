import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STOPS, PATH_LENGTH, TRANSIT, paragraphsFor } from '../src/lib/phone/story-path.ts';
import { LANDMARKS } from '../src/lib/phone/artwork.ts';
import { pathDistance, follow } from '../src/lib/phone/pacing.ts';
import { activityAt, flightsFor, hopsFor } from '../src/lib/phone/activities.ts';

test('phone paragraphs follow the shared about text by stop', () => {
  assert.deepEqual(STOPS.map(stop => paragraphsFor(stop).length), [1, 0, 1, 2, 1, 1, 2, 1, 7]);
  const paragraphs = STOPS.flatMap(paragraphsFor).map(paragraph => paragraph.id);
  assert.equal(new Set(paragraphs).size, paragraphs.length);
});

test('related work stays together, with graduation immediately before Floqer', () => {
  assert.equal(STOPS.length, 9);
  assert.deepEqual(STOPS.map(stop => stop.id), ['delhi', 'google', 'webcube', 'university', 'shiftkey', 'bean', 'collect', 'graduation', 'floqer']);
  assert.deepEqual(STOPS.slice(-2).map(stop => stop.id), ['graduation', 'floqer']);
  assert.ok(!STOPS.some(stop => stop.id === 'disrupt'));
  assert.equal(STOPS.at(-1)!.id, 'floqer');
});

test('one connected world has one illustration per category and a compact ShiftKey stretch', () => {
  assert.deepEqual(Object.keys(LANDMARKS), STOPS.map(stop => stop.id));
  for (let i = 1; i < STOPS.length; i++) assert.equal(STOPS[i].x, STOPS[i - 1].x + STOPS[i - 1].width + (STOPS[i].gapBefore ?? 0));
  assert.equal(STOPS.filter(stop => stop.gapBefore).length, 1);
  assert.equal(TRANSIT.end - TRANSIT.start, 800);
  assert.equal(PATH_LENGTH, STOPS.at(-1)!.x + STOPS.at(-1)!.width);
  assert.ok(STOPS.find(stop => stop.id === 'shiftkey')!.width < STOPS.find(stop => stop.id === 'university')!.width);
});

test('walking distance advances continuously through category boundaries and reverses exactly', () => {
  const anchors = [0, 320, 900, 1200];
  const distances = [100, 540, 980, 1380];
  assert.equal(pathDistance(-50, anchors, distances), 100);
  assert.equal(pathDistance(9999, anchors, distances), 1380);
  for (let i = 0; i < anchors.length; i++) assert.equal(pathDistance(anchors[i], anchors, distances), distances[i]);
  const samples = Array.from({length: 1201}, (_, y) => pathDistance(y, anchors, distances));
  for (let i = 1; i < samples.length; i++) {
    assert.ok(samples[i] > samples[i - 1], 'no hold or scene switch');
    assert.ok(samples[i] - samples[i - 1] < 2, 'no jump at a boundary');
  }
  assert.deepEqual([...samples].reverse(), Array.from({length: 1201}, (_, i) => pathDistance(1200 - i, anchors, distances)));
});

test('the walk settles equally at 60Hz and 120Hz', () => {
  const run = (hz: number) => {
    let position = 0;
    for (let i = 0; i < hz; i++) position = follow(position, 440, 1000 / hz);
    return position;
  };
  assert.ok(Math.abs(run(60) - run(120)) < 1e-9);
  assert.ok(run(60) > 438 && run(60) < 440);
});

test('travel takes off and lands continuously, stays reversible, and respects reduced motion', () => {
  const flights = flightsFor(STOPS);
  assert.equal(flights.length, 1);
  assert.deepEqual(flights.map(flight => flight.route), ['Delhi to Halifax']);
  assert.ok(flights[0].start > TRANSIT.start && flights[0].end < TRANSIT.end);
  assert.ok(flights[0].end - flights[0].start > 600);
  for (const { start, end } of flights) {
    const middle = (start + end) / 2;
    assert.equal(activityAt(start, STOPS).boarding, 0);
    assert.equal(activityAt(end, STOPS).boarding, 0);
    assert.equal(activityAt(middle, STOPS).boarding, 1);
    assert.equal(activityAt(middle, STOPS).altitude, 100);
    assert.equal(activityAt(middle, STOPS).gear, 0);
    assert.equal(activityAt(start + 1, STOPS).gear, 1);
    assert.equal(activityAt(end - 1, STOPS).gear, 1);
    assert.equal(activityAt(start + (end - start) * .4, STOPS).altitude, 100);
    assert.equal(activityAt(start + (end - start) * .65, STOPS).altitude, 100);
    assert.equal(activityAt(middle, STOPS, true).flight, undefined);
    const outward = Array.from({ length: 101 }, (_, i) => activityAt(start + (end - start) * i / 100, STOPS));
    const backward = Array.from({ length: 101 }, (_, i) => activityAt(start + (end - start) * (100 - i) / 100, STOPS));
    assert.deepEqual(outward.reverse(), backward);
    assert.ok(activityAt(start + 0.001, STOPS).boarding < 0.00001);
    assert.ok(activityAt(end - 0.001, STOPS).boarding < 0.00001);
  }
});

test('landing keeps the suitcase until university, without returning to the selling pose', () => {
  const flight = flightsFor(STOPS)[0];
  const university = STOPS.find(stop => stop.id === 'university')!;
  for (let distance = flight.end; distance < university.x + 65; distance++) {
    assert.equal(activityAt(distance, STOPS).activity, 'travel');
    assert.equal(activityAt(distance, STOPS).flight, undefined);
  }
  assert.equal(activityAt(university.x + 65, STOPS).activity, 'walk');
});

test('scroll hops are grounded at both ends and activities belong to their places', () => {
  assert.equal(hopsFor(STOPS).length, 1);
  for (const x of hopsFor(STOPS)) {
    assert.equal(activityAt(x - 42, STOPS).hop, 0);
    assert.equal(activityAt(x + 42, STOPS).hop, 0);
    assert.equal(activityAt(x, STOPS).hop, 12);
    assert.equal(activityAt(x, STOPS, true).hop, 0);
  }
  for (const [id, expected] of [['shiftkey', 'teach'], ['bean', 'sell'], ['collect', 'present'], ['graduation', 'graduate'], ['floqer', 'sell']]) {
    const stop = STOPS.find(stop => stop.id === id)!;
    assert.equal(activityAt(stop.x + 100, STOPS).activity, expected);
  }
});
