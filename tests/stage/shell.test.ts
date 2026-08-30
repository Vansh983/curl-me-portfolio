import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildShell } from '../../src/lib/stage/shell.ts';
import { SETS } from '../../src/lib/stage/sets.ts';

const room = SETS[0].shell!;

const area = (s: { pos: Float32Array }) => {
  let a = 0;
  for (let i = 0; i < s.pos.length; i += 9) {
    const ax = s.pos[i + 3] - s.pos[i], ay = s.pos[i + 4] - s.pos[i + 1], az = s.pos[i + 5] - s.pos[i + 2];
    const bx = s.pos[i + 6] - s.pos[i], by = s.pos[i + 7] - s.pos[i + 1], bz = s.pos[i + 8] - s.pos[i + 2];
    a += 0.5 * Math.hypot(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx);
  }
  return a;
};

test('a shell is finite, closed above and below, and its uv is in metres', () => {
  const { floor, walls, ceiling } = buildShell(room);
  for (const s of [floor, walls, ceiling]) {
    assert.equal(s.pos.length % 9, 0);
    assert.equal(s.nor.length, s.pos.length);
    assert.equal(s.uv.length, (s.pos.length / 3) * 2);
    for (const v of s.pos) assert.ok(Number.isFinite(v));
  }
  const us = Array.from({ length: floor.uv.length / 2 }, (_, i) => floor.uv[i * 2]);
  assert.ok(Math.abs(Math.max(...us) - Math.min(...us) - (room.x[1] - room.x[0]) / room.tile.floor) < 1e-6);
  assert.ok(Math.abs(area(floor) - (room.x[1] - room.x[0]) * (room.z[1] - room.z[0])) < 1e-6);
});

test('an opening removes wall area: a door leaves a hole you can walk through', () => {
  const solid = buildShell({ ...room, openings: [] });
  const cut = buildShell(room);
  const holes = room.openings.reduce((t, o) => t + o.w * o.h, 0);
  assert.ok(Math.abs(area(solid.walls) - area(cut.walls) - holes) < 1e-6, `${area(solid.walls)} - ${area(cut.walls)} vs ${holes}`);
  const door = room.openings.find((o) => (o.sill ?? 0) === 0)!;
  for (let i = 0; i < cut.walls.pos.length; i += 3) {
    const x = cut.walls.pos[i], y = cut.walls.pos[i + 1], z = cut.walls.pos[i + 2];
    const inside = Math.abs(x - room.x[1]) < 1e-9 && z > door.at - door.w / 2 + 1e-9 && z < door.at + door.w / 2 - 1e-9 && y > 1e-9 && y < door.h - 1e-9;
    assert.ok(!inside, `vertex in the door at ${x},${y},${z}`);
  }
});

test('every normal points into the room and every triangle winds toward it', () => {
  const { floor, walls, ceiling } = buildShell(room);
  const cx = (room.x[0] + room.x[1]) / 2, cy = room.h / 2, cz = (room.z[0] + room.z[1]) / 2;
  for (const s of [floor, walls, ceiling]) {
    for (let i = 0; i < s.pos.length; i += 3) {
      const dot = (cx - s.pos[i]) * s.nor[i] + (cy - s.pos[i + 1]) * s.nor[i + 1] + (cz - s.pos[i + 2]) * s.nor[i + 2];
      assert.ok(dot > 0, `normal at ${i / 3} faces out`);
    }
    for (let i = 0; i < s.pos.length; i += 9) {
      const ax = s.pos[i + 3] - s.pos[i], ay = s.pos[i + 4] - s.pos[i + 1], az = s.pos[i + 5] - s.pos[i + 2];
      const bx = s.pos[i + 6] - s.pos[i], by = s.pos[i + 7] - s.pos[i + 1], bz = s.pos[i + 8] - s.pos[i + 2];
      const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
      assert.ok(nx * s.nor[i] + ny * s.nor[i + 1] + nz * s.nor[i + 2] > 0, `triangle ${i / 9} winds away from its normal`);
    }
  }
});
